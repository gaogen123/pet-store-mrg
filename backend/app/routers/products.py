from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(
    prefix="/products",
    tags=["products"],
    responses={404: {"description": "Not found"}},
)

from typing import List, Optional
from sqlalchemy import or_

@router.get("/", response_model=List[schemas.Product])
def read_products(
    skip: int = 0, 
    limit: int = 100, 
    q: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Product)
    
    if category and category != "全部":
        query = query.filter(models.Product.category == category)
        
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                models.Product.name.like(search),
                models.Product.description.like(search)
            )
        )
        
    products = query.offset(skip).limit(limit).all()
    return products

@router.post("/search-history")
def create_search_history(
    keyword: str,
    user_id: str,
    db: Session = Depends(database.get_db)
):
    print(f"Received search history request: keyword={keyword}, user_id={user_id}")
    if not keyword or not user_id:
        print("Missing keyword or user_id")
        return {"message": "Keyword and user_id required"}
        
    history = models.SearchHistory(user_id=user_id, keyword=keyword)
    db.add(history)
    db.commit()
    return {"message": "History created"}

@router.post("/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(database.get_db)):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product
