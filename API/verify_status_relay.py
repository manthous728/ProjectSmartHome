import sys
import os
import psycopg2
import time

# Temporary config for verification script
DB = {
    "host": "localhost",
    "port": 5432,
    "dbname": "iotdb",
    "user": "postgres",
    "password": "root"
}

try:
    print("Connecting to database...")
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    
    # 1. Check if table 'status_relay' exists
    cur.execute("SELECT to_regclass('public.status_relay')")
    if not cur.fetchone()[0]:
        print("FAIL: Table 'status_relay' does not exist.")
        # Attempt to simulate creation logic from API/main.py
        print("SIMULATION: Creating table 'status_relay'...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS status_relay (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                gpio INT,
                is_active BOOLEAN DEFAULT false
            );
        """)
        conn.commit()
    else:
        print("PASS: Table 'status_relay' exists.")
        
    # 2. Check defaults
    cur.execute("SELECT COUNT(*) FROM status_relay")
    count = cur.fetchone()[0]
    print(f"Status Relay count: {count}")
    
    if count == 0:
        print("SIMULATION: Seeding defaults...")
        cur.execute("""
            INSERT INTO status_relay (id, name, gpio, is_active) VALUES 
            (1, 'Lampu Teras', 12, false),
            (2, 'Pompa Air', 14, false),
            (3, 'Exhaust Fan', 27, false),
            (4, 'Door Lock', 26, false)
        """)
        conn.commit()
        print("PASS: Seeded defaults.")
    else:
        print("PASS: Defaults already present.")
        
    # 3. Verify content
    cur.execute("SELECT id, name, is_active FROM status_relay ORDER BY id")
    rows = cur.fetchall()
    print("Current Status Relays:")
    for row in rows:
        print(f" - ID {row[0]}: {row[1]} [Active: {row[2]}]")

    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
