from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root@localhost/pet_marketplace")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Admin Database Config
SQLALCHEMY_ADMIN_DATABASE_URL = os.getenv("ADMIN_DATABASE_URL", "mysql+pymysql://root@localhost/pet_marketplace_admin")

admin_engine = create_engine(
    SQLALCHEMY_ADMIN_DATABASE_URL
)
SessionLocalAdmin = sessionmaker(autocommit=False, autoflush=False, bind=admin_engine)

Base = declarative_base()
AdminBase = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_admin_db():
    db = SessionLocalAdmin()
    try:
        yield db
    finally:
        db.close()
