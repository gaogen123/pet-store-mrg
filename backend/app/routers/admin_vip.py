from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from .. import models, schemas, database
import json

router = APIRouter(
    prefix="/admin/vip",
    tags=["admin_vip"],
    responses={404: {"detail": "Not found"}},
)

@router.get("/", response_model=List[schemas.VIPLevel])
def read_vip_levels(db: Session = Depends(database.get_db)):
    vip_levels = db.query(models.VIPLevel).order_by(models.VIPLevel.level).all()
    
    result = []
    for vip in vip_levels:
        # Calculate member count
        member_count = db.query(models.User).filter(models.User.vip_level_id == vip.id).count()
        
        # Calculate monthly revenue
        # Get first day of current month
        today = datetime.utcnow()
        first_day = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Find orders from users in this VIP level created this month
        # This might be slow if many users/orders, but for now it's fine
        # Optimized query: Join Order and User
        revenue = db.query(models.Order).join(models.User).filter(
            models.User.vip_level_id == vip.id,
            models.Order.create_time >= first_day
        ).with_entities(models.Order.total_amount).all()
        
        monthly_revenue = sum(r[0] for r in revenue if r[0])
        
        vip_data = schemas.VIPLevel.model_validate(vip)
        vip_data.memberCount = member_count
        vip_data.monthlyRevenue = monthly_revenue
        result.append(vip_data)
        
    return result

@router.post("/", response_model=schemas.VIPLevel)
def create_vip_level(vip: schemas.VIPLevelCreate, db: Session = Depends(database.get_db)):
    db_vip = db.query(models.VIPLevel).filter(models.VIPLevel.name == vip.name).first()
    if db_vip:
        raise HTTPException(status_code=400, detail="VIP level name already exists")
    
    db_vip_level = db.query(models.VIPLevel).filter(models.VIPLevel.level == vip.level).first()
    if db_vip_level:
        raise HTTPException(status_code=400, detail="VIP level number already exists")
    
    # Convert benefits list to JSON string
    benefits_json = json.dumps(vip.benefits, ensure_ascii=False)
    
    new_vip = models.VIPLevel(
        name=vip.name,
        level=vip.level,
        discount=vip.discount,
        min_spend=vip.min_spend,
        color=vip.color,
        icon=vip.icon,
        benefits=benefits_json
    )
    
    db.add(new_vip)
    db.commit()
    db.refresh(new_vip)
    return new_vip

@router.put("/{vip_id}", response_model=schemas.VIPLevel)
def update_vip_level(vip_id: str, vip_update: schemas.VIPLevelUpdate, db: Session = Depends(database.get_db)):
    db_vip = db.query(models.VIPLevel).filter(models.VIPLevel.id == vip_id).first()
    if not db_vip:
        raise HTTPException(status_code=404, detail="VIP level not found")
        
    update_data = vip_update.dict(exclude_unset=True)
    
    if 'benefits' in update_data:
        update_data['benefits'] = json.dumps(update_data['benefits'], ensure_ascii=False)
        
    for key, value in update_data.items():
        setattr(db_vip, key, value)
        
    db.commit()
    db.refresh(db_vip)
    return db_vip

@router.delete("/{vip_id}")
def delete_vip_level(vip_id: str, db: Session = Depends(database.get_db)):
    db_vip = db.query(models.VIPLevel).filter(models.VIPLevel.id == vip_id).first()
    if not db_vip:
        raise HTTPException(status_code=404, detail="VIP level not found")
        
    # Check if any user is in this level
    user_count = db.query(models.User).filter(models.User.vip_level_id == vip_id).count()
    if user_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete VIP level with {user_count} members")
        
    db.delete(db_vip)
    db.commit()
    return {"message": "VIP level deleted successfully"}
