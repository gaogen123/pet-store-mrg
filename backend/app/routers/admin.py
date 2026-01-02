from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, database
from .users import get_password_hash, verify_password
from datetime import datetime

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    responses={404: {"description": "Not found"}},
)

@router.post("/register", response_model=schemas.AdminUser)
def register_admin(user: schemas.AdminUserCreate, db: Session = Depends(database.get_admin_db)):
    db_user = db.query(models.AdminUser).filter(models.AdminUser.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.AdminUser(
        username=user.username,
        email=user.email,
        password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=schemas.AdminUser)
def login_admin(user: schemas.AdminUserLogin, db: Session = Depends(database.get_admin_db)):
    db_user = db.query(models.AdminUser).filter(
        (models.AdminUser.email == user.identifier) | (models.AdminUser.username == user.identifier)
    ).first()
    
    if not db_user:
        raise HTTPException(status_code=400, detail="Incorrect username/email or password")
    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Incorrect username/email or password")
    
    # Update last login
    db_user.last_login = datetime.utcnow()
    db.commit()
        
    return db_user
