// Данные о товарах
const products = [
    {
        id: 1,
        title: "Антикварный комод",
        era: "XIX век",
        category: "furniture",
        price: 125000,
        image: "/static/images/commode.jpg",
        description: "Красивый комод из красного дерева XIX века. Идеальное состояние, оригинальная фурнитура.",
        dimensions: "120x60x85 см",
        material: "Красное дерево",
        in_stock: true
    },
    {
        id: 2,
        title: "Золотая брошь",
        era: "Начало XX века",
        category: "jewelry",
        price: 85000,
        image: "/static/images/brooch.jpg",
        description: "Изящная брошь из 14-каратного золота с натуральными изумрудами. Работа известного ювелира.",
        dimensions: "4x3 см",
        material: "Золото 14К, изумруды",
        in_stock: true
    },
    {
        id: 3,
        title: "Картина маслом",
        era: "Конец XVIII века",
        category: "art",
        price: 320000,
        image: "/static/images/painting.jpg",
        description: "Пейзаж маслом на холсте, автор неизвестен, но стиль указывает на школу известных мастеров.",
        dimensions: "60x80 см",
        material: "Холст, масло",
        in_stock: true
    },
    {
        id: 4,
        title: "Редкая книга",
        era: "XVII век",
        category: "books",
        price: 45000,
        image: "/static/images/book.jpg",
        description: "Первое издание классического произведения в прекрасной сохранности.",
        dimensions: "15x22 см",
        material: "Кожаный переплет",
        in_stock: false
    },
    {
        id: 5,
        title: "Кресло рококо",
        era: "Середина XVIII века",
        category: "furniture",
        price: 180000,
        image: "/static/images/chair.jpg",
        description: "Роскошное кресло в стиле рококо с резными элементами и оригинальной обивкой.",
        dimensions: "70x65x95 см",
        material: "Орех, шелк",
        in_stock: true
    },
    {
        id: 6,
        title: "Серебряный подсвечник",
        era: "XIX век",
        category: "jewelry",
        price: 65000,
        image: "/static/images/candlestick.jpg",
        description: "Парный подсвечник из стерлингового серебра 925 пробы с клеймами мастера.",
        dimensions: "25x15 см",
        material: "Серебро 925",
        in_stock: true
    },
    {
        id: 7,
        title: "Портрет маслом",
        era: "Начало XIX века",
        category: "art",
        price: 280000,
        image: "/static/images/portrait.jpg",
        description: "Портрет неизвестной дамы в стиле ампир. Отличная сохранность цветов.",
        dimensions: "50x70 см",
        material: "Холст, масло",
        in_stock: true
    },
    {
        id: 8,
        title: "Антикварные часы",
        era: "Конец XIX века",
        category: "furniture",
        price: 95000,
        image: "/static/images/clock.jpg",
        description: "Напольные часы с маятником, механический механизм в рабочем состоянии.",
        dimensions: "200x60x40 см",
        material: "Орех, латунь",
        in_stock: true
    }
];

// Корзина
let cart = [];

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем корзину из localStorage
    cart = JSON.parse(localStorage.getItem('cart') || '[]');
    renderProducts();
    setupEventListeners();
    updateCartCount();
});

// Рендер товаров
function renderProducts() {
    const grid = document.getElementById('products-grid');
    const filteredProducts = products; // На главной показываем все товары
    
    grid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-id="${product.id}">
            <img src="${product.image}" alt="${product.title}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-era">${product.era}</p>
                <p class="product-price">${formatPrice(product.price)} ₽</p>
                <button class="add-to-cart" onclick="addToCart(${product.id})">
                    В корзину
                </button>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики для открытия модального окна
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('add-to-cart')) {
                const productId = parseInt(this.dataset.id);
                showProductModal(productId);
            }
        });
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Фильтры
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderProducts(this.dataset.category);
        });
    });
    
    // Модальное окно
    const modal = document.getElementById('product-modal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Мобильное меню
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', () => {
        navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        navMenu.style.position = 'absolute';
        navMenu.style.top = '100%';
        navMenu.style.left = '0';
        navMenu.style.right = '0';
        navMenu.style.background = '#2c1810';
        navMenu.style.flexDirection = 'column';
        navMenu.style.padding = '1rem';
    });
}

// Добавление в корзину
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product.in_stock) return;
    
    // Проверяем, есть ли товар уже в корзине
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        showNotification('Этот товар уже в корзине');
        return;
    }
    
    // Добавляем товар в корзину с количеством 1
    cart.push({...product, quantity: 1});
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification('Товар добавлен в корзину');
}

// Обновление счетчика корзины
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

// Показать модальное окно товара
function showProductModal(productId) {
    const product = products.find(p => p.id === productId);
    const modal = document.getElementById('product-modal');
    const details = document.getElementById('modal-product-details');
    
    details.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
                <img src="${product.image}" alt="${product.title}" style="width: 100%; border-radius: 10px;">
            </div>
            <div>
                <h2 style="font-family: 'Playfair Display', serif; color: #2c1810; margin-bottom: 1rem;">
                    ${product.title}
                </h2>
                <p style="color: #666; margin-bottom: 1rem;">${product.era}</p>
                <p style="font-size: 1.8rem; color: #d4af37; font-weight: 600; margin-bottom: 1.5rem;">
                    ${formatPrice(product.price)} ₽
                </p>
                <p style="line-height: 1.6; margin-bottom: 1.5rem;">${product.description}</p>
                <div style="background: #f8f5f2; padding: 1rem; border-radius: 5px; margin-bottom: 1.5rem;">
                    <p><strong>Размеры:</strong> ${product.dimensions}</p>
                    <p><strong>Материал:</strong> ${product.material}</p>
                </div>
                <button onclick="addToCart(${product.id})" style="background: #d4af37; color: #2c1810; border: none; padding: 15px 30px; font-size: 1.1rem; font-weight: 600; border-radius: 5px; cursor: pointer; width: 100%;">
                    Добавить в корзину
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Форматирование цены
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Уведомления
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #d4af37;
        color: #2c1810;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 3000;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Плавная прокрутка
function scrollToCatalog() {
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
}

// Обработка корзины
document.querySelector('.cart-link').addEventListener('click', function(e) {
    e.preventDefault();
    // Переходим на страницу корзины
    window.location.href = '/cart';
});

// Показать модальное окно корзины
function showCartModal() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const modal = document.getElementById('product-modal');
    const details = document.getElementById('modal-product-details');
    
    const cartItems = cart.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee;">
            <div>
                <h4>${item.title}</h4>
                <p>${formatPrice(item.price)} ₽ x ${item.quantity}</p>
            </div>
            <div>
                <p style="font-weight: 600;">${formatPrice(item.price * item.quantity)} ₽</p>
                <button onclick="removeFromCart(${item.id})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-left: 10px;">×</button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    details.innerHTML = `
        <h2 style="font-family: 'Playfair Display', serif; color: #2c1810; margin-bottom: 2rem;">Корзина</h2>
        ${cartItems}
        <div style="padding: 1rem; background: #f8f5f2; border-radius: 5px; margin-top: 1rem;">
            <p style="font-size: 1.2rem; font-weight: 600;">Итого: ${formatPrice(total)} ₽</p>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
            <button onclick="window.location.href='/cart'" style="background: #d4af37; color: #2c1810; border: none; padding: 15px 30px; font-size: 1.1rem; font-weight: 600; border-radius: 5px; cursor: pointer; flex: 1;">
                Оформить заказ
            </button>
            <button onclick="document.getElementById('product-modal').style.display='none'" style="background: transparent; border: 2px solid #d4af37; color: #2c1810; padding: 15px 30px; font-size: 1.1rem; font-weight: 600; border-radius: 5px; cursor: pointer;">
                Продолжить покупки
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
}

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showCartModal(); // Обновить отображение корзины
}

function checkout() {
    showNotification('Спасибо за заказ! Мы свяжемся с вами в ближайшее время.');
    const cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    document.getElementById('product-modal').style.display = 'none';
}
