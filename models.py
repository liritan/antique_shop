
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from extensions import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash


def _dec_to_float(v: Any) -> Optional[float]:
    """SQLAlchemy Numeric -> Decimal -> float (for jsonify)."""
    if v is None:
        return None
    if isinstance(v, Decimal):
        return float(v)
    return float(v)


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    first_name = db.Column(db.String(80), default="")
    last_name = db.Column(db.String(80), default="")

    # NEW
    middle_name = db.Column(db.String(80), default="")
    phone = db.Column(db.String(32), default="", index=True)
    birthdate = db.Column(db.Date)  # nullable=True by default

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    orders = db.relationship("Order", back_populates="user", lazy=True)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name or "",
            "last_name": self.last_name or "",
            "middle_name": self.middle_name or "",
            "phone": self.phone or "",
            "birthdate": self.birthdate.isoformat() if self.birthdate else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)

    products = db.relationship("Product", back_populates="category", lazy=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "slug": self.slug}


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)

    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False, index=True)

    price = db.Column(db.Numeric(12, 2), nullable=False)

    # available / sold (минимально)
    status = db.Column(db.String(20), nullable=False, default="available", index=True)

    description = db.Column(db.Text, default="")
    country_of_origin = db.Column(db.String(120), default="")
    author = db.Column(db.String(255), default="")          # автор/мастер
    period = db.Column(db.String(120), default="")          # "XVIII век", "1890-1905" и т.п.
    material = db.Column(db.String(255), default="")

    height_cm = db.Column(db.Numeric(10, 2))
    width_cm = db.Column(db.Numeric(10, 2))
    depth_cm = db.Column(db.Numeric(10, 2))
    weight_kg = db.Column(db.Numeric(10, 3))

    condition = db.Column(db.String(120), default="")
    is_restored = db.Column(db.Boolean, nullable=False, default=False)
    has_certificate = db.Column(db.Boolean, nullable=False, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    category = db.relationship("Category", back_populates="products")
    photos = db.relationship(
        "ProductPhoto",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy=True,
    )
    order_items = db.relationship("OrderItem", back_populates="product", lazy=True)

    def _main_photo_url(self) -> Optional[str]:
        if not self.photos:
            return None
        for ph in self.photos:
            if ph.is_main:
                return ph.url
        return self.photos[0].url

    def to_dict(self, detail: bool = False):
        # base fields for списки (/api/products)
        data = {
            "id": self.id,
            "title": self.title,
            "price": _dec_to_float(self.price),
            "status": self.status,
            "description": self.description or "",
            "period": self.period or "",
            "material": self.material or "",
            "category_slug": self.category.slug if self.category else None,
            # удобный shortcut для фронта
            "image": self._main_photo_url(),
        }

        if detail:
            data.update({
                "country_of_origin": self.country_of_origin or "",
                "author": self.author or "",
                "height_cm": _dec_to_float(self.height_cm),
                "width_cm": _dec_to_float(self.width_cm),
                "depth_cm": _dec_to_float(self.depth_cm),
                "weight_kg": _dec_to_float(self.weight_kg),
                "condition": self.condition or "",
                "is_restored": bool(self.is_restored),
                "has_certificate": bool(self.has_certificate),
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "category": self.category.to_dict() if self.category else None,
                "photos": [ph.to_dict() for ph in (self.photos or [])],
            })

        return data


class ProductPhoto(db.Model):
    __tablename__ = "product_photos"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)

    url = db.Column(db.Text, nullable=False)
    is_main = db.Column(db.Boolean, nullable=False, default=False)

    product = db.relationship("Product", back_populates="photos")

    def to_dict(self):
        return {"id": self.id, "url": self.url, "is_main": bool(self.is_main)}


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    # snapshot email на момент заказа
    customer_email = db.Column(db.String(255), nullable=False)

    total_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)

    # created / paid / cancelled / refunded
    status = db.Column(db.String(20), nullable=False, default="created", index=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="orders")
    items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy=True)
    payments = db.relationship("Payment", back_populates="order", cascade="all, delete-orphan", lazy=True)

    def to_dict(self, detail: bool = False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "customer_email": self.customer_email,
            "total_amount": _dec_to_float(self.total_amount),
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if detail:
            data["items"] = [it.to_dict() for it in (self.items or [])]
            data["payments"] = [p.to_dict() for p in (self.payments or [])]
        return data


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)

    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)

    price_at_purchase = db.Column(db.Numeric(12, 2), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)

    order = db.relationship("Order", back_populates="items")
    product = db.relationship("Product", back_populates="order_items")

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "product_id": self.product_id,
            "price_at_purchase": _dec_to_float(self.price_at_purchase),
            "quantity": int(self.quantity),
        }


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)

    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)

    provider = db.Column(db.String(50), nullable=False, default="mock")  # stripe/paypal/mock
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)  # pending/paid/failed/refunded

    amount = db.Column(db.Numeric(12, 2), nullable=False)

    provider_payment_id = db.Column(db.String(120), default="", index=True)
    paid_at = db.Column(db.DateTime)

    order = db.relationship("Order", back_populates="payments")

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "provider": self.provider,
            "status": self.status,
            "amount": _dec_to_float(self.amount),
            "provider_payment_id": self.provider_payment_id or "",
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
        }