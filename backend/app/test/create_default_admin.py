from app import models, database
from app.routers.users import get_password_hash
from sqlalchemy.orm import Session

def create_default_admin():
    db = database.SessionLocal()
    try:
        username = "admin"
        email = "admin@example.com"
        password = "admin"
        
        # Check if user exists
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user:
            print(f"Admin user {username} already exists.")
            return

        hashed_password = get_password_hash(password)
        admin_user = models.User(
            username=username,
            email=email,
            password=hashed_password,
            role="admin"
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"Default admin user created: {username} / {password}")
        
    except Exception as e:
        print(f"Error creating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_default_admin()
