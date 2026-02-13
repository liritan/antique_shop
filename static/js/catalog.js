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

let filteredProducts = [...products];
let currentView = 'grid';
let currentPage = 1;
let itemsPerPage = 12;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    renderProducts();
    updateCartCount();
    setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
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

// Рендер товаров
function renderProducts() {
    const grid = document.getElementById('products-grid');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    if (currentView === 'grid') {
        grid.className = 'products-grid';
        grid.innerHTML = pageProducts.map(product => `
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
    } else {
        grid.className = 'products-list';
        grid.innerHTML = pageProducts.map(product => `
            <div class="product-list-item" data-id="${product.id}">
                <img src="${product.image}" alt="${product.title}" class="product-list-image">
                <div class="product-list-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-era">${product.era}</p>
                    <p class="product-description">${product.description}</p>
                    <p class="product-price">${formatPrice(product.price)} ₽</p>
                </div>
                <div class="product-list-actions">
                    <button class="view-details" onclick="showProductModal(${product.id})">Подробнее</button>
                    <button class="add-to-cart" onclick="addToCart(${product.id})">В корзину</button>
                </div>
            </div>
        `).join('');
    }
    
    // Добавляем обработчики для открытия модального окна
    document.querySelectorAll('.product-card, .product-list-item').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('add-to-cart') && !e.target.classList.contains('view-details')) {
                const productId = parseInt(this.dataset.id);
                showProductModal(productId);
            }
        });
    });
    
    updateResultsCount();
    renderPagination();
}

// Применить фильтры
function applyFilters() {
    const categories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
    const eras = Array.from(document.querySelectorAll('input[name="era"]:checked')).map(cb => cb.value);
    const minPrice = parseInt(document.getElementById('min-price').value) || 0;
    const maxPrice = parseInt(document.getElementById('max-price').value) || Infinity;
    const inStockOnly = document.querySelector('input[name="availability"]:checked')?.value === 'in_stock';
    
    filteredProducts = products.filter(product => {
        const categoryMatch = categories.includes('all') || categories.includes(product.category);
        const eraMatch = eras.length === 0 || eras.includes(product.era);
        const priceMatch = product.price >= minPrice && product.price <= maxPrice;
        const stockMatch = !inStockOnly || product.in_stock;
        
        return categoryMatch && eraMatch && priceMatch && stockMatch;
    });
    
    currentPage = 1;
    renderProducts();
}

// Сбросить фильтры
function resetFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.value === 'all' || cb.value === 'in_stock') {
            cb.checked = true;
        } else {
            cb.checked = false;
        }
    });
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    
    filteredProducts = [...products];
    currentPage = 1;
    renderProducts();
}

// Поиск товаров
function searchProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    
    if (!query) {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => 
            product.title.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            product.era.toLowerCase().includes(query) ||
            product.material.toLowerCase().includes(query)
        );
    }
    
    currentPage = 1;
    renderProducts();
}

// Сортировка товаров
function sortProducts() {
    const sortValue = document.getElementById('sort-select').value;
    
    switch(sortValue) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        default:
            filteredProducts = [...products];
    }
    
    renderProducts();
}

// Изменение вида отображения
function changeView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    renderProducts();
}

// Обновление счетчика результатов
function updateResultsCount() {
    document.getElementById('results-count').textContent = `Найдено товаров: ${filteredProducts.length}`;
}

// Рендер пагинации
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Предыдущая страница
    if (currentPage > 1) {
        paginationHTML += `<button onclick="changePage(${currentPage - 1})" class="page-btn">←</button>`;
    }
    
    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `<button onclick="changePage(${i})" class="page-btn ${i === currentPage ? 'active' : ''}">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<span class="page-dots">...</span>`;
        }
    }
    
    // Следующая страница
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="changePage(${currentPage + 1})" class="page-btn">→</button>`;
    }
    
    pagination.innerHTML = paginationHTML;
}

// Изменение страницы
function changePage(page) {
    currentPage = page;
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                    <p><strong>Наличие:</strong> ${product.in_stock ? 'В наличии' : 'Под заказ'}</p>
                </div>
                <button onclick="addToCart(${product.id})" style="background: #d4af37; color: #2c1810; border: none; padding: 15px 30px; font-size: 1.1rem; font-weight: 600; border-radius: 5px; cursor: pointer; width: 100%; ${!product.in_stock ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                    ${product.in_stock ? 'Добавить в корзину' : 'Недоступен'}
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

// Добавление в корзину
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product.in_stock) return;

    // Проверяем, есть ли товар уже в корзине
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
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
