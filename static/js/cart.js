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

let cart = [];

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    renderCart();
    updateCartCount();
    setupEventListeners();
});

// Загрузка корзины из localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Сохранение корзины в localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Настройка обработчиков событий
function setupEventListeners() {
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

// Рендер корзины
function renderCart() {
    const cartItems = document.querySelector('.cart-items');
    const cartEmpty = document.getElementById('cart-empty');
    const cartContent = document.getElementById('cart-content');
    
    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartContent.style.display = 'none';
        return;
    }
    
    cartEmpty.style.display = 'none';
    cartContent.style.display = 'grid';
    
    cartItems.innerHTML = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        return `
            <div class="cart-item">
                <img src="${product.image}" alt="${product.title}" class="cart-item-image">
                <div class="cart-item-info">
                    <h3>${product.title}</h3>
                    <p class="cart-item-era">${product.era}</p>
                    <p class="cart-item-material">${product.material}</p>
                    <div class="quantity-controls">
                            <button onclick="updateQuantity(${item.id}, -1)" class="quantity-btn" disabled>-</button>
                            <input type="number" value="${item.quantity}" min="1" max="1" readonly class="quantity-input">
                            <button onclick="updateQuantity(${item.id}, 1)" class="quantity-btn" disabled>+</button>
                        </div>
                </div>
                <div class="cart-item-price">
                    <p class="item-price">${formatPrice(product.price * item.quantity)} ₽</p>
                    <p class="item-unit-price">${formatPrice(product.price)} ₽ за шт.</p>
                    <button onclick="removeFromCart(${item.id})" class="remove-btn">Удалить</button>
                </div>
            </div>
        `;
    }).join('');
    
    updateSummary();
}

// Обновление количества товара
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        // Для антикварных товаров нельзя изменять количество
        // Только можно удалить товар из корзины
        showNotification('Для удаления товара используйте кнопку "Удалить"');
    }
}

// Установка количества товара
function setQuantity(productId, value) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        // Для антикварных товаров количество всегда 1
        if (value != 1) {
            showNotification('Антикварные товары доступны только в единичном экземпляре');
            // Возвращаем значение обратно на 1
            const input = document.querySelector(`input[onchange="setQuantity(${productId}, this.value)"]`);
            if (input) input.value = 1;
        }
    }
}

// Удаление товара из корзины
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
    updateCartCount();
    showNotification('Товар удален из корзины');
}

// Обновление итоговой суммы
function updateSummary() {
    const subtotal = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + (product.price * item.quantity);
    }, 0);
    
    const shipping = subtotal > 0 ? (subtotal > 100000 ? 0 : 2000) : 0;
    const total = subtotal + shipping;
    
    document.getElementById('subtotal').textContent = formatPrice(subtotal) + ' ₽';
    document.getElementById('shipping').textContent = shipping > 0 ? formatPrice(shipping) + ' ₽' : 'Бесплатно';
    document.getElementById('total').textContent = formatPrice(total) + ' ₽';
}

// Оформление заказа
function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('Корзина пуста');
        return;
    }
    
    // Создание заказа
    const order = {
        items: cart.map(item => ({
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            image: item.image
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        customerInfo: {
            name: 'Иван Петров', // Будет браться из профиля
            email: 'ivan.petrov@example.com',
            phone: '+7 (999) 123-45-67'
        }
    };
    
    // Сохраняем заказ через систему хранения
    const savedOrder = DataStorage.saveOrder(order);
    
    // Очищаем корзину
    cart = [];
    DataStorage.saveCart(cart);
    renderCart();
    updateCartCount();
    
    showNotification('Заказ успешно оформлен! Номер заказа: ' + savedOrder.id);
    
    // Перенаправляем в личный кабинет через 2 секунды
    setTimeout(() => {
        window.location.href = '/profile';
    }, 2000);
}

// Обновление счетчика корзины
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
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
