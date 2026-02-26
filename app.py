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


app = Flask(__name__)
CORS(app)
load_dotenv()

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/antik_shop"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
migrate.init_app(app, db)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login_page"   # <-- ВАЖНО

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


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

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)