import psycopg2
from config import DB

try:
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users'")
    columns = [row[0] for row in cur.fetchall()]
    print(f"Users table columns: {columns}")
    
    required = ['role', 'is_active', 'created_at']
    missing = [col for col in required if col not in columns]
    
    if missing:
        print(f"MISSING COLUMNS: {missing}")
    else:
        print("Schema verification PASSED")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
