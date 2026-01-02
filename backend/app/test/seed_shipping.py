from app.database import SessionLocal, SessionLocalAdmin
from app import models
from datetime import datetime, timedelta
import uuid
import json

def seed_data():
    db = SessionLocal()
    admin_db = SessionLocalAdmin()

    try:
        # Hardcoded data from frontend
        data = [
            { 
                "orderNumber": "PET12345", 
                "customer": "张三", 
                "phone": "13800138000", 
                "address": "北京市朝阳区三里屯街道100号",
                "products": "进口猫粮 5kg × 2", 
                "amount": 396.0, 
                "status": "pending", # Mapped to backend status
                "shipping_status": "待揽件",
                "shippingCompany": "顺丰速运",
                "trackingNumber": "SF1234567890",
                "estimatedTime": "2026-01-03",
                "date": "2026-01-01"
            },
            { 
                "orderNumber": "PET12346", 
                "customer": "李四", 
                "phone": "13900139000", 
                "address": "上海市浦东新区陆家嘴环路88号",
                "products": "猫咪玩具套装 × 1", 
                "amount": 89.0, 
                "status": "shipped",
                "shipping_status": "运输中",
                "shippingCompany": "中通快递",
                "trackingNumber": "ZTO9876543210",
                "estimatedTime": "2026-01-02",
                "date": "2025-12-31"
            },
            { 
                "orderNumber": "PET12347", 
                "customer": "王五", 
                "phone": "13600136000", 
                "address": "广州市天河区珠江新城花城大道10号",
                "products": "宠物自动饮水器 × 1", 
                "amount": 158.0, 
                "status": "shipped",
                "shipping_status": "派送中",
                "shippingCompany": "圆通速递",
                "trackingNumber": "YT5678901234",
                "estimatedTime": "2026-01-01",
                "date": "2025-12-30"
            },
            { 
                "orderNumber": "PET12348", 
                "customer": "赵六", 
                "phone": "13700137000", 
                "address": "深圳市南山区科技园南路20号",
                "products": "天然狗粮 10kg × 1, 狗狗磨牙棒 × 3", 
                "amount": 403.0, 
                "status": "completed",
                "shipping_status": "已签收",
                "shippingCompany": "顺丰速运",
                "trackingNumber": "SF0987654321",
                "estimatedTime": "2025-12-30",
                "date": "2025-12-28"
            },
        ]

        for item in data:
            # 1. Create or Get Order
            order = db.query(models.Order).filter(models.Order.order_number == item["orderNumber"]).first()
            if not order:
                print(f"Creating order {item['orderNumber']}...")
                # Create dummy user if needed, or just leave user_id null for now as it's optional in some contexts, 
                # but better to have a user. Let's pick the first user or create one.
                user = db.query(models.User).first()
                if not user:
                    user = models.User(username="seed_user", email="seed@example.com", password="password")
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                
                # Create address dict
                address_data = {
                    "name": item["customer"],
                    "phone": item["phone"],
                    "detail": item["address"],
                    "province": "", "city": "", "district": "" # Simplified
                }

                order = models.Order(
                    id=str(uuid.uuid4()),
                    order_number=item["orderNumber"],
                    user_id=user.id,
                    payment_method="wechat",
                    total_amount=item["amount"],
                    status=item["status"],
                    create_time=datetime.strptime(item["date"], "%Y-%m-%d"),
                    address_snapshot=json.dumps(address_data, ensure_ascii=False)
                )
                db.add(order)
                db.commit()
                db.refresh(order)
                
                # Create dummy order items to match "products" string description roughly
                # We won't parse the string perfectly, just add a placeholder item
                product = db.query(models.Product).first()
                if product:
                    order_item = models.OrderItem(
                        order_id=order.id,
                        product_id=product.id,
                        quantity=1,
                        price=item["amount"]
                    )
                    db.add(order_item)
                    db.commit()

            # 2. Create Shipping in Admin DB
            shipping = admin_db.query(models.Shipping).filter(models.Shipping.order_id == order.id).first()
            if not shipping:
                print(f"Creating shipping for order {item['orderNumber']}...")
                shipping = models.Shipping(
                    order_id=order.id,
                    tracking_number=item["trackingNumber"],
                    carrier=item["shippingCompany"],
                    status=item["shipping_status"],
                    shipping_time=datetime.strptime(item["date"], "%Y-%m-%d"),
                    estimated_delivery_time=datetime.strptime(item["estimatedTime"], "%Y-%m-%d")
                )
                admin_db.add(shipping)
                admin_db.commit()
            else:
                print(f"Shipping for order {item['orderNumber']} already exists.")

    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()
        admin_db.close()

if __name__ == "__main__":
    seed_data()
