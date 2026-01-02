from app import models, database
from app.routers.users import get_password_hash
from sqlalchemy.orm import Session

def create_admin(username, email, password):
    db = database.SessionLocal()
    try:
        # Check if user exists
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user:
            print(f"User with email {email} already exists.")
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
        print(f"Admin user {username} created successfully.")
        
    except Exception as e:
        print(f"Error creating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating Admin User...")
    username = input("Enter admin username: ")
    email = input("Enter admin email: ")
    password = input("Enter admin password: ")
    
    create_admin(username, email, password)
