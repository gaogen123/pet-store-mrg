import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Default to local if not set, but strip the database name to connect to server root
DEFAULT_DB_URL = "mysql+pymysql://root@localhost/pet_marketplace"
DB_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# Get base connection string (remove database name)
if "/" in DB_URL.split("@")[1]:
    BASE_DB_URL = DB_URL.rsplit("/", 1)[0]
else:
    BASE_DB_URL = DB_URL

ADMIN_DB_NAME = "pet_marketplace_admin"

def create_admin_database():
    engine = create_engine(BASE_DB_URL)
    with engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {ADMIN_DB_NAME}"))
        print(f"Database '{ADMIN_DB_NAME}' created or already exists.")

if __name__ == "__main__":
    create_admin_database()
