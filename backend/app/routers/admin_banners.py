from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(
    prefix="/admin/banners",
    tags=["admin-banners"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.Banner])
def read_banners(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_admin_db)
):
    banners = db.query(models.Banner).order_by(models.Banner.sort_order).offset(skip).limit(limit).all()
    return banners

@router.post("/", response_model=schemas.Banner)
def create_banner(banner: schemas.BannerCreate, db: Session = Depends(database.get_admin_db)):
    db_banner = models.Banner(**banner.dict())
    db.add(db_banner)
    db.commit()
    db.refresh(db_banner)
    return db_banner

@router.put("/{banner_id}", response_model=schemas.Banner)
def update_banner(banner_id: int, banner: schemas.BannerUpdate, db: Session = Depends(database.get_admin_db)):
    db_banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not db_banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    update_data = banner.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_banner, key, value)
        
    db.commit()
    db.refresh(db_banner)
    return db_banner

@router.delete("/{banner_id}")
def delete_banner(banner_id: int, db: Session = Depends(database.get_admin_db)):
    db_banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not db_banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    db.delete(db_banner)
    db.commit()
    return {"message": "Banner deleted successfully"}
