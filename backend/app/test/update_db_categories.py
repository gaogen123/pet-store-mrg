from app import database, models
from sqlalchemy import text

def update_db():
    db = database.SessionLocal()
    try:
        # Create categories table (now in AdminBase)
        models.AdminBase.metadata.create_all(bind=database.admin_engine)
        print("Categories table created successfully in Admin DB.")
            
    except Exception as e:
        print(f"Error updating database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_db()
