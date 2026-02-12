from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime
 
app = Flask(__name__)
CORS(app)
 
# Данные о товарах (в реальном приложении это будет база данных)
products = [
    {
        "id": 1,
        "title": "Антикварный комод",
        "era": "XIX век",
        "category": "furniture",
        "price": 125000,
        "image": "/static/images/commode.jpg",
        "description": "Красивый комод из красного дерева XIX века. Идеальное состояние, оригинальная фурнитура.",
        "dimensions": "120x60x85 см",
        "material": "Красное дерево",
        "in_stock": True
    },
    {
        "id": 2,
        "title": "Золотая брошь",
        "era": "Начало XX века",
        "category": "jewelry",
        "price": 85000,
        "image": "/static/images/brooch.jpg",
        "description": "Изящная брошь из 14-каратного золота с натуральными изумрудами. Работа известного ювелира.",
        "dimensions": "4x3 см",
        "material": "Золото 14К, изумруды",
        "in_stock": True
    },
    {
        "id": 3,
        "title": "Картина маслом",
        "era": "Конец XVIII века",
        "category": "art",
        "price": 320000,
        "image": "/static/images/painting.jpg",
        "description": "Пейзаж маслом на холсте, автор неизвестен, но стиль указывает на школу известных мастеров.",
        "dimensions": "60x80 см",
        "material": "Холст, масло",
        "in_stock": True
    },
    {
        "id": 4,
        "title": "Редкая книга",
        "era": "XVII век",
        "category": "books",
        "price": 45000,
        "image": "/static/images/book.jpg",
        "description": "Первое издание классического произведения в прекрасной сохранности.",
        "dimensions": "15x22 см",
        "material": "Кожаный переплет",
        "in_stock": False
    },
    {
        "id": 5,
        "title": "Кресло рококо",
        "era": "Середина XVIII века",
        "category": "furniture",
        "price": 180000,
        "image": "/static/images/chair.jpg",
        "description": "Роскошное кресло в стиле рококо с резными элементами и оригинальной обивкой.",
        "dimensions": "70x65x95 см",
        "material": "Орех, шелк",
        "in_stock": True
    },
    {
        "id": 6,
        "title": "Серебряный подсвечник",
        "era": "XIX век",
        "category": "jewelry",
        "price": 65000,
        "image": "/static/images/candlestick.jpg",
        "description": "Парный подсвечник из стерлингового серебра 925 пробы с клеймами мастера.",
        "dimensions": "25x15 см",
        "material": "Серебро 925",
        "in_stock": True
    },
    {
        "id": 7,
        "title": "Портрет маслом",
        "era": "Начало XIX века",
        "category": "art",
        "price": 280000,
        "image": "/static/images/portrait.jpg",
        "description": "Портрет неизвестной дамы в стиле ампир. Отличная сохранность цветов.",
        "dimensions": "50x70 см",
        "material": "Холст, масло",
        "in_stock": True
    },
    {
        "id": 8,
        "title": "Антикварные часы",
        "era": "Конец XIX века",
        "category": "furniture",
        "price": 95000,
        "image": "/static/images/clock.jpg",
        "description": "Напольные часы с маятником, механический механизм в рабочем состоянии.",
        "dimensions": "200x60x40 см",
        "material": "Орех, латунь",
        "in_stock": True
    }
]
 
# Временное хранилище заказов
orders = []
 
@app.route('/')
def index():
    """Главная страница"""
    return render_template('index.html')
 
@app.route('/api/products')
def get_products():
    """API для получения всех товаров"""
    category = request.args.get('category', 'all')
 
    if category == 'all':
        return jsonify(products)
    else:
        filtered_products = [p for p in products if p['category'] == category]
        return jsonify(filtered_products)
 
@app.route('/api/products/<int:product_id>')
def get_product(product_id):
    """API для получения конкретного товара"""
    product = next((p for p in products if p['id'] == product_id), None)
    if product:
        return jsonify(product)
    else:
        return jsonify({"error": "Товар не найден"}), 404
 
@app.route('/api/categories')
def get_categories():
    """API для получения категорий"""
    categories = [
        {"id": "all", "name": "Все товары"},
        {"id": "furniture", "name": "Мебель"},
        {"id": "jewelry", "name": "Ювелирные изделия"},
        {"id": "art", "name": "Искусство"},
        {"id": "books", "name": "Книги"}
    ]
    return jsonify(categories)
 
@app.route('/api/orders', methods=['POST'])
def create_order():
    """API для создания заказа"""
    order_data = request.json
 
    # Валидация данных
    if not order_data or 'items' not in order_data:
        return jsonify({"error": "Некорректные данные заказа"}), 400
 
    # Создание заказа
    order = {
        "id": len(orders) + 1,
        "items": order_data['items'],
        "customer_info": order_data.get('customer_info', {}),
        "total": order_data.get('total', 0),
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
 
    orders.append(order)
 
    return jsonify({
        "success": True,
        "order_id": order["id"],
        "message": "Заказ успешно создан"
    }), 201
 
@app.route('/api/search')
def search_products():
    """API для поиска товаров"""
    query = request.args.get('q', '').lower()
 
    if not query:
        return jsonify([])
 
    results = []
    for product in products:
        if (query in product['title'].lower() or 
            query in product['description'].lower() or 
            query in product['era'].lower() or 
            query in product['material'].lower()):
            results.append(product)
 
    return jsonify(results)
 
@app.route('/api/featured')
def get_featured_products():
    """API для получения избранных товаров"""
    featured = [p for p in products if p['in_stock']][:4]
    return jsonify(featured)
 
@app.route('/health')
def health_check():
    """Проверка здоровья сервиса"""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})
 
if __name__ == '__main__':
    print("Запуск антикварного магазина 'Времена'...")
    print("Откройте http://localhost:5000 в браузере")
    app.run(debug=True, host='0.0.0.0', port=5000)