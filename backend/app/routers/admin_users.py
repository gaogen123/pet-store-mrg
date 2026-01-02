from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database

router = APIRouter(
    prefix="/admin/users",
    tags=["admin-users"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=dict)
def read_users(
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(database.get_db) # Use main DB
):
    query = db.query(models.User)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.User.username.like(search_term)) |
            (models.User.email.like(search_term)) |
            (models.User.phone.like(search_term))
        )
        
    if status and status != '全部状态':
        is_active = True if status == '活跃' else False
        query = query.filter(models.User.is_active == is_active)
        
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    items = []
    for user in users:
        # Calculate stats
        orders_count = len(user.orders)
        total_spent = sum(order.total_amount for order in user.orders)
        
        # Get address
        address_str = "未知地址"
        if user.addresses:
            # Try to find default address
            default_addr = next((a for a in user.addresses if a.is_default), user.addresses[0])
            address_str = f"{default_addr.province or ''}{default_addr.city or ''}{default_addr.district or ''}{default_addr.detail or ''}"
            
        # Create UserAdminView
        # We need to handle potential missing fields or None values if schema is strict
        # Using model_validate to convert SQLAlchemy model to Pydantic model
        user_view = schemas.UserAdminView.model_validate(user)
        user_view.orders_count = orders_count
        user_view.total_spent = total_spent
        user_view.address_str = address_str
        items.append(user_view)
        
    return {
        "total": total,
        "items": items,
        "page": skip // limit + 1,
        "size": limit
    }

@router.put("/{user_id}/status")
def update_user_status(
    user_id: str,
    status: str = Query(..., regex="^(活跃|非活跃)$"),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = (status == '活跃')
    db.commit()
    return {"message": "Status updated successfully"}

@router.delete("/{user_id}")
def delete_user(user_id: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password (simplified for now, ideally use hashing lib)
    # In real app, use passlib
    fake_hashed_password = user.password + "notreallyhashed"
    
    db_user = models.User(
        username=user.username,
        email=user.email,
        password=fake_hashed_password,
        phone=user.phone,
        role=user.role,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=schemas.User)
def update_user(user_id: str, user_update: schemas.UserUpdate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user
