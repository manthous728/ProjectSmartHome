from database import get_cursor, init_pool, close_pool
import time

def fix_schema():
    print("Initializing pool...")
    init_pool(minconn=1, maxconn=1)
    
    try:
        with get_cursor() as cur:
            print("Checking users table columns...")
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users'")
            columns = [row['column_name'] for row in cur.fetchall()]
            print(f"Found columns: {columns}")
            
            if 'force_password_change' not in columns:
                print("Adding missing column 'force_password_change'...")
                cur.execute("ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT false")
                print("Column added successfully.")
            else:
                print("Column 'force_password_change' already exists.")
                
            # Verify again
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users'")
            columns = [row['column_name'] for row in cur.fetchall()]
            print(f"Final columns: {columns}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        close_pool()

if __name__ == "__main__":
    fix_schema()
