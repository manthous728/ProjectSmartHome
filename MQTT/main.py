import json
import psycopg2
from paho.mqtt import client as mqtt
from config import DB_DEFAULT, MQTT_BROKER, MQTT_PORT, MQTT_TOPICS
from datetime import datetime, timezone
import sys
import time
import requests

# Global State
APP_SETTINGS = {
    "thresholds": {},
    "enable_thresholds": True,
    "telegram_config": {"bot_token": "", "chat_id": "", "enabled": False}
}
LAST_SETTINGS_LOAD = 0
SETTINGS_RELOAD_INTERVAL = 5  # Reload every 5 seconds for faster updates during testing

# Alert State
LAST_ALERT = {}
ALERT_COOLDOWN = 60  # 1 minute cooldown per sensor condition

TABLES = {
    "dht22": "data_dht22",
    "pzem004t": "data_pzem004t",
    "mq2": "data_mq2",
    "bh1750": "data_bh1750"
}

DB_IOT = DB_DEFAULT.copy()
DB_IOT["dbname"] = "iotdb"


def check_database_exists():
    try:
        # connect ke postgres (default DB)
        tmp = DB_DEFAULT.copy()
        tmp["dbname"] = "postgres"

        with psycopg2.connect(**tmp) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", ("iotdb",))
                return cur.fetchone() is not None

    except Exception as e:
        print("Gagal mengecek database:", e)
        return False


def insert_data(sensor, data):
    table = TABLES.get(sensor)
    if not table:
        print(f"[{sensor}] Tidak ada tabel")
        time.sleep(2)
        return

    timestamp = data.get("timestamp", datetime.now(timezone.utc).isoformat())

    try:
        with psycopg2.connect(**DB_IOT) as conn:
            with conn.cursor() as cur:

                if sensor == "dht22":
                    temp = data.get("temp")
                    if temp is None:
                        temp = data.get("temperature")
                        
                    hum = data.get("hum")
                    if hum is None:
                        hum = data.get("humidity")

                    cur.execute(
                        f"INSERT INTO {table} (temperature, humidity, timestamp) VALUES (%s, %s, %s)",
                        (temp, hum, timestamp)
                    )

                elif sensor == "pzem004t":
                    cur.execute(
                        f"""INSERT INTO {table} 
                        (voltage, current, power, energy, power_factor, timestamp) 
                        VALUES (%s, %s, %s, %s, %s, %s)""",
                        (
                            data.get("voltage"),
                            data.get("current"),
                            data.get("power"),
                            data.get("energy"),
                            data.get("power_factor"),
                            timestamp
                        )
                    )

                elif sensor == "mq2":
                    lpg = data.get("lpg")
                    if lpg is None:
                        lpg = data.get("gas_lpg")
                    if lpg is None:
                        lpg = data.get("LPG")
                        
                    co = data.get("co")
                    if co is None:
                        co = data.get("gas_co")
                    if co is None:
                        co = data.get("CO")
                        
                    smoke = data.get("smoke")
                    if smoke is None:
                        smoke = data.get("Smoke")
                        
                    cur.execute(
                        f"INSERT INTO {table} (gas_lpg, gas_co, smoke, timestamp) VALUES (%s, %s, %s, %s)",
                        (lpg, co, smoke, timestamp)
                    )

                elif sensor == "bh1750":
                    cur.execute(
                        f"INSERT INTO {table} (lux, timestamp) VALUES (%s, %s)",
                        (data.get("lux"), timestamp)
                    )

        print(f"[{sensor}] Data masuk → {data}")

    except Exception as e:
        print(f"[{sensor}] DB Error:", e)


def on_message(client, userdata, message):
    try:
        payload = json.loads(message.payload.decode())

        for sensor, topic in MQTT_TOPICS.items():
            if sensor == "relay":
                # Check match manually since it uses wildcard #
                if message.topic.startswith("command/relay/"):
                    try:
                        # Parse relay ID from topic or payload
                        relay_id = int(message.topic.split("/")[-1])
                        state = payload.get("state", False)
                        
                        print(f"[RELAY] ID={relay_id} State={state}")
                        
                        # Sync to DB
                        with psycopg2.connect(**DB_IOT) as conn:
                            with conn.cursor() as cur:
                                cur.execute("UPDATE status_relay SET is_active = %s WHERE id = %s", (state, relay_id))
                                conn.commit()
                                print(f"[RELAY] Saved to DB (status_relay).")
                    except Exception as e:
                        print(f"[RELAY] Sync Error: {e}")
                continue

            if message.topic == topic:
                insert_data(sensor, payload)
                
                # Check thresholds and notify
                check_thresholds(sensor, payload)
                break

    except Exception as e:
        print("Parse Error:", e)

def load_settings():
    """Load settings from DB"""
    global APP_SETTINGS, LAST_SETTINGS_LOAD
    
    # Simple cache to avoid hitting DB on every message
    if time.time() - LAST_SETTINGS_LOAD < SETTINGS_RELOAD_INTERVAL:
        return

    try:
        with psycopg2.connect(**DB_IOT) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT setting_key, setting_value FROM app_settings")
                rows = cur.fetchall()
                
                for key, val in rows:
                    if key == "thresholds":
                        if APP_SETTINGS["thresholds"] != val:
                            print(f"🔄 Thresholds updated: {val}", flush=True)
                            APP_SETTINGS["thresholds"] = val
                    elif key == "enable_thresholds":
                        if APP_SETTINGS["enable_thresholds"] != val:
                            print(f"🔄 Global thresholds enabled: {val}", flush=True)
                            APP_SETTINGS["enable_thresholds"] = val
                    elif key == "telegram_config":
                        if APP_SETTINGS["telegram_config"] != val:
                            print(f"🔄 Telegram config updated: {val}", flush=True)
                            APP_SETTINGS["telegram_config"] = val
                        
        LAST_SETTINGS_LOAD = time.time()
        # print("Settings reloaded.")
    except Exception as e:
        print(f"Failed to load settings: {e}")

def send_telegram_alert(message):
    """Send alert to Telegram"""
    tg = APP_SETTINGS.get("telegram_config", {})
    enabled = tg.get("enabled")
    if not (enabled is True or enabled == "true" or enabled == 1):
        # print("Telegram alerts are disabled.")
        return

    token = tg.get("bot_token")
    chat_id = tg.get("chat_id")

    if not token or not chat_id:
        print("Telegram Token/ChatID missing.")
        return

    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "Markdown"
        }
        res = requests.post(url, json=payload, timeout=5)
        if res.status_code == 200:
            print(f"🚀 Telegram message sent: {message}", flush=True)
        else:
            print(f"❌ Telegram send failed ({res.status_code}): {res.text}", flush=True)
    except Exception as e:
        print(f"Failed to send Telegram alert: {e}", flush=True)

def check_thresholds(sensor, data):
    """Check sensor data against thresholds"""
    # Load latest settings if needed
    load_settings()

    if not APP_SETTINGS.get("enable_thresholds", True):
        return

    thresholds = APP_SETTINGS.get("thresholds", {}).get(sensor, {})
    # print(f"DEBUG: Checking {sensor} with keys: {list(thresholds.keys()) if thresholds else 'None'}", flush=True)
    
    if not thresholds:
        return

    alerts = []
    
    # Helper to check condition and add alert
    def check(key, condition_type, limit, unit, label, val, setting_key):
        if val is None: return
        
        try:
            val = float(val)
            limit = float(limit)
        except (ValueError, TypeError):
            return

        # Debug check
        print(f"Checking {sensor} {label}: Val={val} Limit={limit} Type={condition_type} Triggered={val > limit if condition_type == 'max' else val < limit}", flush=True)

        # Unique alert key based on sensor and the specific setting key (e.g. tempMax, tempMin)
        alert_key = f"{sensor}_{setting_key}"
        last_time = LAST_ALERT.get(alert_key, 0)
        
        is_triggered = False
        msg = ""

        u = unit.strip() if unit else ""
        unit_str = f" {u}" if u else ""
        if condition_type == "max" and val > limit:
            is_triggered = True
            msg = f"⚠️ *PERINGATAN {sensor.upper()}*\n{label} tinggi: *{val}{unit_str}* (Batas: {limit}{unit_str})"
        elif condition_type == "min" and val < limit:
            is_triggered = True
            msg = f"⚠️ *PERINGATAN {sensor.upper()}*\n{label} rendah: *{val}{unit_str}* (Batas: {limit}{unit_str})"
        
        if is_triggered:
            if time.time() - last_time > ALERT_COOLDOWN:
                alerts.append(msg)
                LAST_ALERT[alert_key] = time.time()
    
    # Mapping checks based on sensor
    if sensor == "dht22":
        t = data.get("temperature") if data.get("temperature") is not None else data.get("temp")
        h = data.get("humidity") if data.get("humidity") is not None else data.get("hum")
        
        if thresholds.get("tempMax"): check("temp", "max", thresholds["tempMax"], "°C", "Suhu", t, "tempMax")
        if thresholds.get("tempMin"): check("temp", "min", thresholds["tempMin"], "°C", "Suhu", t, "tempMin")
        if thresholds.get("humMax"): check("hum", "max", thresholds["humMax"], "%", "Kelembaban", h, "humMax")
        if thresholds.get("humMin"): check("hum", "min", thresholds["humMin"], "%", "Kelembaban", h, "humMin")

    elif sensor == "mq2":
        s = data.get("smoke") if data.get("smoke") is not None else data.get("Smoke")
        l = data.get("gas_lpg") if data.get("gas_lpg") is not None else data.get("lpg")
        c = data.get("gas_co") if data.get("gas_co") is not None else data.get("co")

        # Smoke
        if thresholds.get("smokeMax"): check("smoke", "max", thresholds["smokeMax"], "ppm", "Asap (Bahaya)", s, "smokeMax")
        if thresholds.get("smokeWarn"): check("smoke", "max", thresholds["smokeWarn"], "ppm", "Asap (Waspada)", s, "smokeWarn")
        
        # LPG
        if thresholds.get("lpgMax"): check("lpg", "max", thresholds["lpgMax"], "ppm", "LPG (Bahaya)", l, "lpgMax")
        if thresholds.get("lpgWarn"): check("lpg", "max", thresholds["lpgWarn"], "ppm", "LPG (Waspada)", l, "lpgWarn")
        
        # CO
        if thresholds.get("coMax"): check("co", "max", thresholds["coMax"], "ppm", "CO (Bahaya)", c, "coMax")
        if thresholds.get("coWarn"): check("co", "max", thresholds["coWarn"], "ppm", "CO (Waspada)", c, "coWarn")

    elif sensor == "pzem004t":
        p = data.get("power")
        v = data.get("voltage")
        c = data.get("current")
        e = data.get("energy")
        pf = data.get("power_factor") if data.get("power_factor") is not None else data.get("pf")
        
        if thresholds.get("powerMax"): check("power", "max", thresholds["powerMax"], "W", "Daya", p, "powerMax")
        if thresholds.get("voltageMax"): check("voltage", "max", thresholds["voltageMax"], "V", "Tegangan", v, "voltageMax")
        if thresholds.get("voltageMin"): check("voltage", "min", thresholds["voltageMin"], "V", "Tegangan", v, "voltageMin")
        if thresholds.get("currentMax"): check("current", "max", thresholds["currentMax"], "A", "Arus", c, "currentMax")
        if thresholds.get("energyMax"): check("energy", "max", thresholds["energyMax"], "kWh", "Energi", e, "energyMax")
        if thresholds.get("pfMin"): check("pf", "min", thresholds["pfMin"], "", "Power Factor", pf, "pfMin")

    elif sensor == "bh1750":
        lx = data.get("lux")
        if thresholds.get("luxMax"): check("lux", "max", thresholds["luxMax"], "lux", "Cahaya", lx, "luxMax")
        if thresholds.get("luxMin"): check("lux", "min", thresholds["luxMin"], "lux", "Cahaya", lx, "luxMin")

    # Send alerts
    for alert in alerts:
        send_telegram_alert(alert)
        print(f"Sent alert: {alert}", flush=True)


def on_connect(client, userdata, flags, rc, properties=None):
    """Callback saat berhasil konek ke broker"""
    if rc == 0:
        print("✔ Terhubung ke MQTT broker")
        # Subscribe ke semua topic saat connect/reconnect
        for topic in MQTT_TOPICS.values():
            client.subscribe(topic)
            print(f"  → Subscribed: {topic}")
    else:
        error_messages = {
            1: "Incorrect protocol version",
            2: "Invalid client identifier",
            3: "Server unavailable",
            4: "Bad username or password",
            5: "Not authorized"
        }
        print(f"❌ Gagal connect: {error_messages.get(rc, f'Unknown error ({rc})')}")


def on_disconnect(client, userdata, disconnect_flags, rc, properties=None):
    """Callback saat terputus dari broker"""
    if rc == 0:
        print("ℹ Disconnected secara normal")
    else:
        print(f"⚠ Disconnected dari broker (rc={rc}). Auto-reconnect aktif...")


def main():
    print("Cek database dulu...")

    if not check_database_exists():
        print("❌ Database 'iotdb' belum ada.")
        print("   Jalankan 'python init_db.py' terlebih dahulu.")
        sys.exit(1)

    print("✔ Database ditemukan. Lanjut…")

    # Load initial settings
    load_settings()

    # Setup MQTT client dengan reconnect otomatis
    client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    
    # Set reconnect delay (min 1 detik, max 120 detik dengan exponential backoff)
    client.reconnect_delay_set(min_delay=1, max_delay=120)

    try:
        print(f"Menghubungkan ke {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        print("MQTT listener aktif... nunggu data masuk 😎")
        client.loop_forever()
    except KeyboardInterrupt:
        print("\n⏹ Dihentikan oleh user")
        client.disconnect()
    except Exception as e:
        print(f"❌ Error koneksi MQTT: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
