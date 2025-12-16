import psycopg2
from config import DB
from datetime import datetime, timezone

def check_data():
    try:
        conn = psycopg2.connect(**DB)
        cur = conn.cursor()
        
        # 1. Check DB time
        cur.execute("SELECT NOW()::text")
        db_now = cur.fetchone()[0]
        print(f"[DB] Time: {db_now}")
        
        # 2. Check Python UTC time
        utc_now = datetime.now(timezone.utc)
        print(f"[PY] UTC : {utc_now}")
        
        # 3. Check latest data in dht22
        print("-" * 30)
        print("LATEST 5 DHT22 DATA:")
        cur.execute("SELECT id, timestamp FROM data_dht22 ORDER BY timestamp DESC LIMIT 5")
        rows = cur.fetchall()
        
        if not rows:
            print(">> Table data_dht22 is EMPTY or user has no data.")
        else:
            for row in rows:
                ts = row[1]
                # Try to calculate difference
                # Ensure ts is aware if possible, or naive
                print(f"ID: {row[0]} | TS: {ts} | Type: {type(ts)}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    check_data()
