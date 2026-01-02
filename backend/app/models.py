from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from .database import Base, AdminBase
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))
    phone = Column(String(20))
    avatar = Column(String(255))
    role = Column(String(20), default="user")
    is_active = Column(Boolean, default=True)
    vip_level_id = Column(String(36), ForeignKey("vip_levels.id"), nullable=True)
    register_time = Column(DateTime, default=datetime.utcnow)
    
    orders = relationship("Order", back_populates="user")
    addresses = relationship("Address", back_populates="user")
    cart_items = relationship("CartItem", back_populates="user")
    favorites = relationship("Favorite", back_populates="user")
    search_history = relationship("SearchHistory", back_populates="user")
    vip_level = relationship("VIPLevel", back_populates="users")

class VIPLevel(Base):
    __tablename__ = "vip_levels"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True)
    level = Column(Integer, unique=True)
    discount = Column(Integer)
    min_spend = Column(Float, default=0.0)
    color = Column(String(20))
    icon = Column(String(20))
    benefits = Column(Text) # Store as JSON string
    
    users = relationship("User", back_populates="vip_level")

class AdminUser(AdminBase):
    __tablename__ = "admin_users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))
    avatar = Column(String(255))
    create_time = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), index=True)
    price = Column(Float)
    category = Column(String(50), index=True)
    image = Column(Text)
    description = Column(Text)
    rating = Column(Float, default=0.0)
    sales = Column(Integer, default=0)
    stock = Column(Integer, default=0)
    status = Column(String(20), default="上架")
    
    images = relationship("ProductImage", back_populates="product")
    specs = relationship("ProductSpec", back_populates="product")

class ProductImage(Base):
    __tablename__ = "product_images"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String(36), ForeignKey("products.id"))
    url = Column(Text)
    
    product = relationship("Product", back_populates="images")

class ProductSpec(Base):
    __tablename__ = "product_specs"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String(36), ForeignKey("products.id"))
    spec = Column(String(100))
    
    product = relationship("Product", back_populates="specs")

class Address(Base):
    __tablename__ = "addresses"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"))
    name = Column(String(50))
    phone = Column(String(20))
    province = Column(String(50))
    city = Column(String(50))
    district = Column(String(50))
    detail = Column(String(200))
    is_default = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="addresses")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_number = Column(String(50), unique=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"))
    payment_method = Column(String(50))
    total_amount = Column(Float)
    create_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="pending")
    address_snapshot = Column(Text) # Store address as JSON string
    
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(36), ForeignKey("orders.id"))
    product_id = Column(String(36), ForeignKey("products.id"))
    quantity = Column(Integer)
    price = Column(Float)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class CartItem(Base):
    __tablename__ = "cart_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"))
    product_id = Column(String(36), ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    
    user = relationship("User", back_populates="cart_items")
    product = relationship("Product")

class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"))
    product_id = Column(String(36), ForeignKey("products.id"))
    create_time = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="favorites")
    product = relationship("Product")

class SearchHistory(Base):
    __tablename__ = "search_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"))
    keyword = Column(String(100))
    search_time = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="search_history")

class Category(AdminBase):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)
    description = Column(String(200))
    icon = Column(String(100))
    color = Column(String(50), default="blue")
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

class Shipping(AdminBase):
    __tablename__ = "shippings"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(36), unique=True, index=True)
    tracking_number = Column(String(100))
    carrier = Column(String(50))
    status = Column(String(20), default="shipped")
    shipping_time = Column(DateTime, default=datetime.utcnow)
    estimated_delivery_time = Column(DateTime)

class Banner(AdminBase):
    __tablename__ = "banners"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100))
    image_url = Column(Text)
    description = Column(Text, nullable=True)
    link_url = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    create_time = Column(DateTime, default=datetime.utcnow)
