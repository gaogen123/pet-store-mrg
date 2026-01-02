from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
import datetime

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
    responses={404: {"description": "Not found"}},
)

@router.post("/{user_id}", response_model=schemas.Order)
def create_order(user_id: str, order_create: schemas.OrderCreate, db: Session = Depends(database.get_db)):
    # 1. Get cart items
    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == user_id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # 2. Calculate total amount
    total_amount = 0
    for item in cart_items:
        total_amount += item.product.price * item.quantity

    # 3. Create Order
    # Generate order number: PET + timestamp
    order_number = f"PET{int(datetime.datetime.utcnow().timestamp() * 1000)}"
    
    import json
    db_order = models.Order(
        order_number=order_number,
        user_id=user_id,
        payment_method=order_create.payment_method,
        total_amount=total_amount,
        status="pending",
        address_snapshot=json.dumps(order_create.address)
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # 4. Create OrderItems
    for item in cart_items:
        order_item = models.OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.product.price
        )
        db.add(order_item)
        
        # Update product sales and stock (optional but good practice)
        item.product.sales += item.quantity
        # item.product.stock -= item.quantity # If we tracked stock strictly
    
    # 5. Clear Cart
    db.query(models.CartItem).filter(models.CartItem.user_id == user_id).delete()
    
    db.commit()
    db.refresh(db_order)
    return db_order

@router.post("/{order_id}/pay")
def pay_order(order_id: str, payment_method: str = "wechat", db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="Order is not pending payment")

    order.status = "paid"
    order.payment_method = payment_method
    db.commit()
    db.refresh(order)
    return order

@router.get("/{user_id}", response_model=List[schemas.Order])
def get_user_orders(user_id: str, db: Session = Depends(database.get_db)):
    orders = db.query(models.Order).filter(models.Order.user_id == user_id).order_by(models.Order.create_time.desc()).all()
    return orders

@router.get("/detail/{order_id}", response_model=schemas.Order)
def get_order_detail(order_id: str, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
