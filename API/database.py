import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from config import DB

# Connection pool - reuse koneksi untuk performa lebih baik
_connection_pool = None

def init_pool(minconn=2, maxconn=10):
    """Inisialisasi connection pool"""
    global _connection_pool
    if _connection_pool is None:
        _connection_pool = pool.ThreadedConnectionPool(
            minconn=minconn,
            maxconn=maxconn,
            host=DB["host"],
            port=DB["port"],
            dbname=DB["dbname"],
            user=DB["user"],
            password=DB["password"]
        )
    return _connection_pool

def get_pool():
    """Dapatkan pool, inisialisasi jika belum ada"""
    global _connection_pool
    if _connection_pool is None:
        init_pool()
    return _connection_pool

@contextmanager
def get_conn():
    """Context manager untuk koneksi database dengan auto-cleanup"""
    pool = get_pool()
    conn = pool.getconn()
    try:
        yield conn
    finally:
        pool.putconn(conn)

@contextmanager
def get_cursor():
    """Context manager untuk cursor dengan RealDictCursor"""
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cur
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()

def close_pool():
    """Tutup semua koneksi di pool"""
    global _connection_pool
    if _connection_pool:
        _connection_pool.closeall()
        _connection_pool = None

def check_database_exists():
    """Cek apakah database target sudah dibuat"""
    try:
        # Gunakan database default 'postgres' untuk pengecekan
        conn = psycopg2.connect(
            host=DB["host"],
            port=DB["port"],
            user=DB["user"],
            password=DB["password"],
            dbname="postgres"
        )
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB["dbname"],))
        exists = cur.fetchone() is not None
        cur.close()
        conn.close()
        return exists
    except Exception as e:
        print(f"Database check error: {e}")
        return False

