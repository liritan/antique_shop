from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime
import os
from dotenv import load_dotenv
from extensions import db, migrate
from models import User
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import Category, Product, ProductPhoto, Order, OrderItem, Payment
from seed import seed_all
import re
from datetime import date
from decimal import Decimal
from werkzeug.utils import secure_filename
import uuid
app = Flask(__name__)
CORS(app)
load_dotenv()

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/antik_shop"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["AVATARS_DIR"] = os.path.join(app.root_path, "static", "uploads", "avatars")
app.config["MAX_CONTENT_LENGTH"] = 4 * 1024 * 1024  # 4MB

db.init_app(app)
migrate.init_app(app, db)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login_page"   # <-- ВАЖНО

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

ALLOWED_AVATAR_EXT = {".jpg", ".jpeg", ".png", ".webp"}

def _avatar_public_url(filename: str) -> str:
    return f"/static/uploads/avatars/{filename}"

def _ensure_avatars_dir():
    os.makedirs(app.config["AVATARS_DIR"], exist_ok=True)
    
# ---------- PAGES ----------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/catalog")
def catalog():
    return render_template("catalog.html")

@app.route("/cart")
def cart():
    return render_template("cart.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/contacts")
def contacts():
    return render_template("contacts.html")

@app.route("/login")
def login_page():
    return render_template("login.html")

@app.route("/profile")
@login_required
def profile_page():
    return render_template("profile.html")


# ---------- AUTH API ----------
@app.post("/api/auth/register")
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()

    if not email or not password:
        return jsonify({"error": "email и password обязательны"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Пользователь с таким email уже существует"}), 409

    u = User(email=email, first_name=first_name, last_name=last_name)
    u.set_password(password)
    db.session.add(u)
    db.session.commit()

    login_user(u)
    return jsonify({"ok": True, "user": {"id": u.id, "email": u.email}}), 201


@app.post("/api/auth/login")
def login_api():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    u = User.query.filter_by(email=email).first()
    if not u or not u.check_password(password):
        return jsonify({"error": "Неверный email или пароль"}), 401

    login_user(u)
    return jsonify({"ok": True, "user": {"id": u.id, "email": u.email}})


@app.post("/api/auth/logout")
@login_required
def logout_api():
    logout_user()
    return jsonify({"ok": True})

from flask import render_template

@app.get("/services")
def services_page():
    return render_template("services.html")

# @app.get("/api/auth/me")
# def me():
#     if not current_user.is_authenticated:
#         return jsonify({"authenticated": False}), 200

#     return jsonify({
#         "authenticated": True,
#         "user": {
#             "id": current_user.id,
#             "email": current_user.email,
#             "first_name": current_user.first_name,
#             "last_name": current_user.last_name,
#             "middle_name": current_user.middle_name,
#             "phone": current_user.phone,
#             "birthdate": current_user.birthdate.isoformat() if current_user.birthdate else None,
#         }
#     })
@app.get("/api/auth/me")
def me():
    if not current_user.is_authenticated:
        return jsonify({"authenticated": False}), 200

    return jsonify({
        "authenticated": True,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "middle_name": current_user.middle_name,
            "phone": current_user.phone,
            "birthdate": current_user.birthdate.isoformat() if current_user.birthdate else None,
            "avatar_url": current_user.avatar_url or "",  
        }
    })


@app.get("/api/products")
def api_products():
    category = request.args.get("category")  # slug или None

    q = Product.query

    if category and category != "all":
        q = q.join(Category).filter(Category.slug == category)

    products = q.order_by(Product.id.asc()).all()

    return jsonify([p.to_dict() for p in products])

@app.get("/api/products/<int:product_id>")
def api_product(product_id):
    p = Product.query.get_or_404(product_id)
    return jsonify(p.to_dict(detail=True))


@app.cli.command("seed")
def seed_cmd():
    seed_all()
    print("Seed done.")
    
    
def _normalize_phone(phone: str) -> str:
    # простая нормализация: оставим + и цифры
    phone = (phone or "").strip()
    if not phone:
        return ""
    phone = re.sub(r"[^\d+]", "", phone)
    return phone[:32]

def _parse_birthdate(s: str):
    s = (s or "").strip()
    if not s:
        return None
    # ожидаем YYYY-MM-DD
    try:
        y, m, d = s.split("-")
        return date(int(y), int(m), int(d))
    except Exception:
        return None


@app.patch("/api/users/me")
@login_required
def update_me():
    data = request.get_json() or {}

    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    middle_name = (data.get("middle_name") or "").strip()
    phone = _normalize_phone(data.get("phone") or "")
    birthdate = _parse_birthdate(data.get("birthdate") or "")

    # минимальные ограничения (можно менять)
    if len(first_name) > 80 or len(last_name) > 80 or len(middle_name) > 80:
        return jsonify({"error": "Слишком длинное имя/фамилия/отчество"}), 400

    if len(phone) > 32:
        return jsonify({"error": "Телефон слишком длинный"}), 400

    # сохраняем
    current_user.first_name = first_name
    current_user.last_name = last_name
    current_user.middle_name = middle_name
    current_user.phone = phone
    current_user.birthdate = birthdate

    db.session.commit()

    return jsonify({"ok": True, "user": current_user.to_dict()})    

def _to_decimal(x) -> Decimal:
    # поддержка чисел/строк типа "125000.00"
    try:
        return Decimal(str(x))
    except Exception:
        return Decimal("0")

@app.post("/api/orders")
@login_required
def create_order():
    """
    Создаёт заказ из items (из localStorage на фронте) и сразу создаёт payment=paid (mock).
    Request:
      { "items": [ { "id": 12, "quantity": 1 }, ... ] }
    """
    data = request.get_json() or {}
    items = data.get("items") or []
    if not isinstance(items, list) or len(items) == 0:
        return jsonify({"error": "items обязателен и не должен быть пустым"}), 400

    # нормализуем ids (антиквариат — quantity = 1, но оставим поле)
    normalized = []
    seen = set()
    for it in items:
        try:
            pid = int(it.get("id"))
            qty = int(it.get("quantity", 1))
        except Exception:
            continue
        if pid <= 0:
            continue
        if pid in seen:
            continue
        seen.add(pid)
        normalized.append({"id": pid, "quantity": max(1, qty)})

    if not normalized:
        return jsonify({"error": "Некорректные items"}), 400

    product_ids = [x["id"] for x in normalized]

    # Берём товары из БД
    products = Product.query.filter(Product.id.in_(product_ids)).all()
    products_map = {p.id: p for p in products}

    # Проверки и расчёт суммы
    total = Decimal("0")
    order_items = []

    for it in normalized:
        p = products_map.get(it["id"])
        if not p:
            return jsonify({"error": f"Товар id={it['id']} не найден"}), 404

        if p.status != "available":
            return jsonify({"error": f"Товар '{p.title}' недоступен"}), 409

        qty = it["quantity"]
        # если антиквариат в единственном экземпляре — жёстко ограничим
        if qty != 1:
            qty = 1

        price = _to_decimal(p.price)
        total += price * qty

        order_items.append(OrderItem(
            product_id=p.id,
            quantity=qty,
            price_at_purchase=p.price
        ))

    # Транзакция: создаём заказ, позиции, оплату, помечаем товары sold
    try:
        order = Order(
            user_id=current_user.id,
            customer_email=current_user.email,
            total_amount=total,
            status="paid",  # сразу paid, потому что оплата mock
        )
        db.session.add(order)
        db.session.flush()  # получаем order.id

        for oi in order_items:
            oi.order_id = order.id
            db.session.add(oi)

        payment = Payment(
            order_id=order.id,
            provider="mock",
            status="paid",
            amount=total,
            provider_payment_id=f"mock_{order.id}",
            paid_at=datetime.utcnow(),
        )
        db.session.add(payment)

        # антиквариат -> продано
        for it in normalized:
            products_map[it["id"]].status = "sold"

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Не удалось создать заказ"}), 500

    return jsonify({"ok": True, "order": order.to_dict(detail=True)}), 201

@app.get("/api/orders")
@login_required
def my_orders():
    orders = (
        Order.query
        .filter_by(user_id=current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return jsonify([o.to_dict(detail=False) for o in orders])

@app.get("/api/orders/<int:order_id>")
@login_required
def my_order_detail(order_id: int):
    order = Order.query.filter_by(id=order_id, user_id=current_user.id).first()
    if not order:
        return jsonify({"error": "Заказ не найден"}), 404
    return jsonify(order.to_dict(detail=True))

@app.post("/api/users/me/avatar")
@login_required
def upload_avatar():
    if "avatar" not in request.files:
        return jsonify({"error": "Файл avatar обязателен"}), 400

    f = request.files["avatar"]
    if not f or f.filename == "":
        return jsonify({"error": "Файл не выбран"}), 400

    filename = secure_filename(f.filename)
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_AVATAR_EXT:
        return jsonify({"error": "Разрешены только jpg/jpeg/png/webp"}), 400

    _ensure_avatars_dir()

    new_name = f"user_{current_user.id}_{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(app.config["AVATARS_DIR"], new_name)

    try:
        f.save(save_path)
        current_user.avatar_url = _avatar_public_url(new_name)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Не удалось сохранить аватар"}), 500

    return jsonify({"ok": True, "avatar_url": current_user.avatar_url, "user": current_user.to_dict()})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)