from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(
    prefix="/favorites",
    tags=["favorites"],
    responses={404: {"description": "Not found"}},
)

@router.get("/{user_id}", response_model=List[schemas.Favorite])
def get_favorites(user_id: str, db: Session = Depends(database.get_db)):
    return db.query(models.Favorite).filter(models.Favorite.user_id == user_id).all()

@router.post("/{user_id}", response_model=schemas.Favorite)
def add_favorite(user_id: str, favorite: schemas.FavoriteCreate, db: Session = Depends(database.get_db)):
    # Check if product exists
    product = db.query(models.Product).filter(models.Product.id == favorite.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if already exists
    db_favorite = db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.product_id == favorite.product_id
    ).first()

    if db_favorite:
        return db_favorite # Already favorited, return existing

    db_favorite = models.Favorite(
        user_id=user_id,
        product_id=favorite.product_id
    )
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite

@router.delete("/{user_id}/{product_id}")
def remove_favorite(user_id: str, product_id: str, db: Session = Depends(database.get_db)):
    db_favorite = db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.product_id == product_id
    ).first()

    if not db_favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    db.delete(db_favorite)
    db.commit()
    return {"message": "Favorite removed"}
