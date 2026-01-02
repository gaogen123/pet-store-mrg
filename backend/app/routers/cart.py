from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(
    prefix="/cart",
    tags=["cart"],
    responses={404: {"description": "Not found"}},
)

@router.get("/{user_id}", response_model=List[schemas.CartItem])
def get_cart(user_id: str, db: Session = Depends(database.get_db)):
    return db.query(models.CartItem).filter(models.CartItem.user_id == user_id).all()

@router.post("/{user_id}", response_model=schemas.CartItem)
def add_to_cart(user_id: str, item: schemas.CartItemCreate, db: Session = Depends(database.get_db)):
    # Check if product exists
    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if item already exists in cart
    db_item = db.query(models.CartItem).filter(
        models.CartItem.user_id == user_id,
        models.CartItem.product_id == item.product_id
    ).first()

    if db_item:
        db_item.quantity += item.quantity
    else:
        db_item = models.CartItem(
            user_id=user_id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{user_id}/{product_id}", response_model=schemas.CartItem)
def update_cart_item(user_id: str, product_id: str, item: schemas.CartItemUpdate, db: Session = Depends(database.get_db)):
    db_item = db.query(models.CartItem).filter(
        models.CartItem.user_id == user_id,
        models.CartItem.product_id == product_id
    ).first()

    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    if item.quantity <= 0:
        db.delete(db_item)
        db.commit()
        return db_item # This might be tricky as it's deleted, but for now let's return it or handle in frontend
    
    db_item.quantity = item.quantity
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{user_id}/{product_id}")
def remove_from_cart(user_id: str, product_id: str, db: Session = Depends(database.get_db)):
    db_item = db.query(models.CartItem).filter(
        models.CartItem.user_id == user_id,
        models.CartItem.product_id == product_id
    ).first()

    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    db.delete(db_item)
    db.commit()
    return {"message": "Item removed"}

@router.delete("/{user_id}")
def clear_cart(user_id: str, db: Session = Depends(database.get_db)):
    db.query(models.CartItem).filter(models.CartItem.user_id == user_id).delete()
    db.commit()
    return {"message": "Cart cleared"}
