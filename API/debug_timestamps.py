from database import get_cursor
from datetime import datetime, timezone

def check_timestamps():
    try:
        with get_cursor() as cur:
            # Check current DB time
            cur.execute("SELECT NOW()")
            db_now = cur.fetchone()['now']
            print(f"Database NOW(): {db_now}")
            
            # Check Python NOW()
            py_now = datetime.now()
            print(f"Python NOW():   {py_now}")
            
            # Check latest DHT22 data
            print("\nLatest 5 DHT22 Records:")
            cur.execute("SELECT id, timestamp FROM data_dht22 ORDER BY timestamp DESC LIMIT 5")
            rows = cur.fetchall()
            for row in rows:
                ts = row['timestamp']
                # Calculate age
                age = db_now - ts
                print(f"ID: {row['id']}, TS: {ts}, Age: {age}")

            if not rows:
                print("No data in data_dht22 table.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_timestamps()
