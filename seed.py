# seed.py
import re
from decimal import Decimal

from extensions import db
from models import Category, Product, ProductPhoto


CATEGORIES = [
    ("Мебель", "furniture"),
    ("Ювелирные изделия", "jewelry"),
    ("Искусство", "art"),
    ("Книги", "books"),
    ("Коллекционные предметы", "collectibles"),
    ("Часы", "watches"),
]

PRODUCTS = [
    # --- уже существующие (я только поправил пути image по папкам) ---
    {
        "title": "Антикварный комод",
        "era": "XIX век",
        "category_slug": "furniture",
        "price": 125000,
        "image": "/static/images/furniture/commode_01.jpg",
        "description": "Красивый комод из красного дерева XIX века. Идеальное состояние, оригинальная фурнитура.",
        "dimensions": "120x60x85 см",
        "material": "Красное дерево",
        "in_stock": True,
    },
    {
        "title": "Золотая брошь",
        "era": "Начало XX века",
        "category_slug": "jewelry",
        "price": 85000,
        "image": "/static/images/jewelry/brooch_01.jpg",
        "description": "Изящная брошь из 14-каратного золота с натуральными изумрудами. Работа известного ювелира.",
        "dimensions": "4x3 см",
        "material": "Золото 14К, изумруды",
        "in_stock": True,
    },
    {
        "title": "Картина маслом",
        "era": "Конец XVIII века",
        "category_slug": "art",
        "price": 320000,
        "image": "/static/images/art/painting_01.jpg",
        "description": "Пейзаж маслом на холсте, автор неизвестен, но стиль указывает на школу известных мастеров.",
        "dimensions": "60x80 см",
        "material": "Холст, масло",
        "in_stock": True,
    },
    {
        "title": "Редкая книга",
        "era": "XVII век",
        "category_slug": "books",
        "price": 45000,
        "image": "/static/images/books/book_01.jpg",
        "description": "Первое издание классического произведения в прекрасной сохранности.",
        "dimensions": "15x22 см",
        "material": "Кожаный переплет",
        "in_stock": False,
    },
    {
        "title": "Кресло рококо",
        "era": "Середина XVIII века",
        "category_slug": "furniture",
        "price": 180000,
        "image": "/static/images/furniture/chair_01.jpg",
        "description": "Роскошное кресло в стиле рококо с резными элементами и оригинальной обивкой.",
        "dimensions": "70x65x95 см",
        "material": "Орех, шелк",
        "in_stock": True,
    },
    {
        "title": "Серебряный подсвечник",
        "era": "XIX век",
        "category_slug": "jewelry",
        "price": 65000,
        "image": "/static/images/jewelry/candlestick_01.jpg",
        "description": "Парный подсвечник из стерлингового серебра 925 пробы с клеймами мастера.",
        "dimensions": "25x15 см",
        "material": "Серебро 925",
        "in_stock": True,
    },
    {
        "title": "Портрет маслом",
        "era": "Начало XIX века",
        "category_slug": "art",
        "price": 280000,
        "image": "/static/images/art/portrait_01.jpg",
        "description": "Портрет неизвестной дамы в стиле ампир. Отличная сохранность цветов.",
        "dimensions": "50x70 см",
        "material": "Холст, масло",
        "in_stock": True,
    },
    {
        "title": "Часы с маятником",
        "era": "Конец XIX века",
        "category_slug": "watches",
        "price": 95000,
        "image": "/static/images/watches/clock_01.jpg",
        "description": "Часы с маятником, механический механизм в рабочем состоянии.",
        "dimensions": "200x60x40 см",
        "material": "Орех, латунь",
        "in_stock": True,
    },

    # --- +10 новых предметов ---
    {
        "title": "Витрина из ореха",
        "era": "Начало XX века",
        "category_slug": "furniture",
        "price": 210000,
        "image": "/static/images/furniture/showcase_01.jpg",
        "description": "Остекленная витрина с резьбой и латунной фурнитурой. Отлично подходит для коллекций.",
        "dimensions": "190x95x45 см",
        "material": "Орех, стекло, латунь",
        "in_stock": True,
    },
    {
        "title": "Письменный стол",
        "era": "XIX век",
        "category_slug": "furniture",
        "price": 165000,
        "image": "/static/images/furniture/bureau_01.jpg",
        "description": "Компактный стол с выдвижными ящиками, сохранившаяся оригинальная патина.",
        "dimensions": "110x55x98 см",
        "material": "Красное дерево",
        "in_stock": True,
    },
    {
        "title": "Фарфоровая статуэтка (пара)",
        "era": "Середина XX века",
        "category_slug": "collectibles",
        "price": 38000,
        "image": "/static/images/collectibles/porcelain_pair_01.jpg",
        "description": "Парная фарфоровая композиция. Без сколов, аккуратная роспись.",
        "dimensions": "18x10x8 см",
        "material": "Фарфор",
        "in_stock": True,
    },
    {
        "title": "Монета серебряная (коллекционная)",
        "era": "Конец XIX века",
        "category_slug": "collectibles",
        "price": 12000,
        "image": "/static/images/collectibles/silver_coin_01.jpg",
        "description": "Коллекционная серебряная монета в достойной сохранности, читаемый рельеф.",
        "dimensions": "3.0 см",
        "material": "Серебро",
        "in_stock": True,
    },
    {
        "title": "Почтовые марки (набор)",
        "era": "Начало XX века",
        "category_slug": "collectibles",
        "price": 15000,
        "image": "/static/images/collectibles/stamps_set_01.jpg",
        "description": "Набор марок в альбоме. Подойдёт для начинающей коллекции.",
        "dimensions": "",
        "material": "Бумага",
        "in_stock": True,
    },
    {
        "title": "Старинная карта города",
        "era": "XIX век",
        "category_slug": "art",
        "price": 54000,
        "image": "/static/images/art/map_01.jpg",
        "description": "Гравированная карта, подходит для оформления в раму.",
        "dimensions": "45x60 см",
        "material": "Бумага, гравюра",
        "in_stock": True,
    },
    {
        "title": "Гравюра на бумаге",
        "era": "XVIII век",
        "category_slug": "art",
        "price": 62000,
        "image": "/static/images/art/engraving_01.jpg",
        "description": "Классическая гравюра. Есть лёгкие следы времени, без критичных повреждений.",
        "dimensions": "35x50 см",
        "material": "Бумага",
        "in_stock": True,
    },
    {
        "title": "Карманные часы (серебро)",
        "era": "Начало XX века",
        "category_slug": "watches",
        "price": 78000,
        "image": "/static/images/watches/pocket_watch_01.jpg",
        "description": "Карманные часы в серебряном корпусе, на ходу. Возможна профилактика у мастера.",
        "dimensions": "5.2 см",
        "material": "Серебро, сталь",
        "in_stock": True,
    },
    {
        "title": "Настенные часы (эмаль)",
        "era": "Конец XIX века",
        "category_slug": "watches",
        "price": 88000,
        "image": "/static/images/watches/wall_clock_01.jpg",
        "description": "Настенные часы с эмалированным циферблатом. Механизм требует настройки.",
        "dimensions": "45x28x12 см",
        "material": "Дерево, эмаль, латунь",
        "in_stock": True,
    },
    {
        "title": "Книга: собрание сочинений (том I)",
        "era": "XIX век",
        "category_slug": "books",
        "price": 22000,
        "image": "/static/images/books/collection_book_01.jpg",
        "description": "Редкое издание, аккуратный переплет. Есть владельческий штамп.",
        "dimensions": "16x24 см",
        "material": "Бумага, кожаный переплет",
        "in_stock": True,
    },
]


def _parse_dimensions_to_cm(dim_str: str):
    """
    Принимает:
      - "120x60x85 см"
      - "120x60x85"
      - "4x3 см"
      - "5.2 см"
      - "3.0 см"
    Возвращает (h, w, d) как Decimal или None.
    Маппинг: height x width x depth.
    """
    if not dim_str:
        return None, None, None

    s = dim_str.lower().replace("см", "").replace(" ", "")
    parts = re.split(r"[x×*]", s)

    nums = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        m = re.search(r"\d+(?:[.,]\d+)?", p)
        if m:
            nums.append(Decimal(m.group(0).replace(",", ".")))

    if len(nums) == 0:
        return None, None, None
    if len(nums) == 1:
        return nums[0], None, None
    if len(nums) == 2:
        return nums[0], nums[1], None
    return nums[0], nums[1], nums[2]


def seed_all():
    # 1) Категории
    slug_to_cat = {}
    for name, slug in CATEGORIES:
        cat = Category.query.filter_by(slug=slug).first()
        if not cat:
            cat = Category(name=name, slug=slug)
            db.session.add(cat)
        slug_to_cat[slug] = cat

    db.session.flush()

    # 2) Товары + фото
    for item in PRODUCTS:
        cat = slug_to_cat[item["category_slug"]]

        p = Product.query.filter_by(title=item["title"]).first()
        if not p:
            h, w, d = _parse_dimensions_to_cm(item.get("dimensions", ""))

            p = Product(
                title=item["title"],
                category_id=cat.id,
                price=Decimal(str(item["price"])),
                status="available" if item.get("in_stock", True) else "sold",
                description=item.get("description", ""),
                period=item.get("era", ""),      # era -> period
                material=item.get("material", ""),
                height_cm=h,
                width_cm=w,
                depth_cm=d,
            )
            db.session.add(p)
            db.session.flush()

        img = item.get("image")
        if img:
            exists = ProductPhoto.query.filter_by(product_id=p.id, url=img).first()
            if not exists:
                has_main = ProductPhoto.query.filter_by(product_id=p.id, is_main=True).first()
                db.session.add(ProductPhoto(
                    product_id=p.id,
                    url=img,
                    is_main=(has_main is None)
                ))

    db.session.commit()
    print("✅ Seed completed: categories + products + photos")