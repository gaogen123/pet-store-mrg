from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(
    prefix="/admin/categories",
    tags=["admin-categories"],
    responses={404: {"description": "Not found"}},
)

from sqlalchemy import func

@router.get("/", response_model=List[schemas.Category])
def read_categories(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_admin_db),
    db_main: Session = Depends(database.get_db)
):
    categories = db.query(models.Category).order_by(models.Category.sort_order).offset(skip).limit(limit).all()
    
    # Calculate product counts
    product_counts = db_main.query(
        models.Product.category, func.count(models.Product.id)
    ).group_by(models.Product.category).all()
    
    counts_map = {name: count for name, count in product_counts}
    
    for cat in categories:
        cat.productCount = counts_map.get(cat.name, 0)
        
    return categories

@router.post("/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(database.get_admin_db)):
    db_category = db.query(models.Category).filter(models.Category.name == category.name).first()
    if db_category:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.put("/{category_id}", response_model=schemas.Category)
def update_category(category_id: int, category: schemas.CategoryUpdate, db: Session = Depends(database.get_admin_db)):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category.dict(exclude_unset=True)
    
    # Check name uniqueness if name is being updated
    if 'name' in update_data:
        existing = db.query(models.Category).filter(models.Category.name == update_data['name']).first()
        if existing and existing.id != category_id:
            raise HTTPException(status_code=400, detail="Category name already exists")

    for key, value in update_data.items():
        setattr(db_category, key, value)
        
    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(database.get_admin_db)):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(db_category)
    db.commit()
    return {"message": "Category deleted successfully"}
