from app import database
from sqlalchemy import text

def update_db_admin():
    db = database.SessionLocal()
    try:
        # Create admin_users table if not exists
        # Actually sqlalchemy create_all in main.py should handle this if we restart the server.
        # But let's force it here just in case or for manual run.
        from app.models import AdminUser
        from app.database import engine
        AdminUser.__table__.create(bind=engine, checkfirst=True)
        print("AdminUser table created/checked.")
            
    except Exception as e:
        print(f"Error updating database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_db_admin()
