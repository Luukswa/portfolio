import os
from psycopg_pool import ConnectionPool

_pool = None

def _dsn():
    return (
        f"host={os.environ.get('DB_HOST', 'localhost')} "
        f"port={os.environ.get('DB_PORT', '5432')} "
        f"dbname={os.environ.get('DB_NAME', 'portfolio')} "
        f"user={os.environ.get('DB_USER', 'postgres')} "
        f"password={os.environ.get('DB_PASS', '')}"
    )

def get_pool():
    global _pool
    if _pool is None:
        _pool = ConnectionPool(_dsn(), min_size=1, max_size=10, open=True)
    return _pool

def get_conn(timeout=5):
    return get_pool().getconn(timeout=timeout)

def put_conn(conn):
    get_pool().putconn(conn)
