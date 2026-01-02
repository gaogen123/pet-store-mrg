from app import database, models
from sqlalchemy import text

def update_db():
    db = database.SessionLocalAdmin()
    try:
        # Check if color column exists in categories table
        result = db.execute(text("SHOW COLUMNS FROM categories LIKE 'color'"))
        if not result.fetchone():
            print("Adding 'color' column to categories table...")
            db.execute(text("ALTER TABLE categories ADD COLUMN color VARCHAR(50) DEFAULT 'blue'"))
            db.commit()
            print("Column 'color' added successfully.")
        else:
            print("Column 'color' already exists.")
            
    except Exception as e:
        print(f"Error updating database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_db()
