from app import models, database
from app.routers.users import get_password_hash
from sqlalchemy.orm import Session

def create_default_admin_v2():
    db = database.SessionLocal()
    try:
        username = "admin"
        email = "admin@example.com"
        password = "admin"
        
        # Check if user exists in AdminUser table
        existing_user = db.query(models.AdminUser).filter(models.AdminUser.email == email).first()
        if existing_user:
            print(f"Admin user {username} already exists in AdminUser table.")
            return

        hashed_password = get_password_hash(password)
        admin_user = models.AdminUser(
            username=username,
            email=email,
            password=hashed_password
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"Default admin user created in AdminUser table: {username} / {password}")
        
    except Exception as e:
        print(f"Error creating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_default_admin_v2()
