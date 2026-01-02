from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from .. import models, schemas, database
from passlib.context import CryptContext
from typing import List
import shutil
import os

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@router.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        role=user.role
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=schemas.User)
def login_user(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    # Check if identifier is email or phone
    db_user = db.query(models.User).filter(
        (models.User.email == user.identifier) | (models.User.phone == user.identifier)
    ).first()
    
    if not db_user:
        raise HTTPException(status_code=400, detail="Incorrect email/phone or password")
    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Incorrect email/phone or password")
        
    return db_user



@router.put("/{user_id}", response_model=schemas.User)
def update_user(user_id: str, user_update: schemas.UserUpdate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.dict(exclude_unset=True)
    
    if "password" in update_data:
        update_data["password"] = get_password_hash(update_data["password"])
        
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/{user_id}/avatar", response_model=schemas.User)
def upload_avatar(user_id: str, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Save file
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"avatar_{user_id}{file_extension}"
    file_path = os.path.join(upload_dir, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update user avatar URL
    # Assuming backend runs on localhost:8000
    avatar_url = f"http://localhost:8000/uploads/{file_name}"
    db_user.avatar = avatar_url
    
    db.commit()
    db.refresh(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/reset-password")
def reset_password(user_data: schemas.UserResetPassword, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.email != user_data.email:
        raise HTTPException(status_code=400, detail="Email does not match")
    
    user.password = get_password_hash(user_data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
