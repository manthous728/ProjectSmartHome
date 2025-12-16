import sys
import os

# Adjust path to import from current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from database import check_database_exists
    from config import DB
    
    print(f"Target Database: {DB['dbname']}")
    exists = check_database_exists()
    print(f"Database Exists: {exists}")
    
    if not exists:
        print("Test Result: Database MISSING (Expected if not created)")
    else:
        print("Test Result: Database FOUND")
        
except ImportError as e:
    print(f"Import Error: {e}")
except Exception as e:
    print(f"Runtime Error: {e}")
