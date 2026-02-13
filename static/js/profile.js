// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateCartCount();
    loadProfileData();
    loadOrders();
    loadFavorites();
    loadAddresses();
    loadSettings();
});

// Загрузка данных профиля
function loadProfileData() {
    const profile = DataStorage.getProfile();
    if (profile) {
        document.getElementById('first-name').value = profile.firstName || '';
        document.getElementById('last-name').value = profile.lastName || '';
        document.getElementById('email').value = profile.email || '';
        document.getElementById('phone').value = profile.phone || '';
        document.getElementById('birthdate').value = profile.birthdate || '';
        
        // Обновляем имя в сайдбаре
        const sidebarName = document.querySelector('.profile-header h3');
        if (sidebarName) {
            sidebarName.textContent = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Пользователь';
        }
        
        const sidebarEmail = document.querySelector('.profile-header p');
        if (sidebarEmail) {
            sidebarEmail.textContent = profile.email || '';
        }
    }
}

// Загрузка заказов
function loadOrders() {
    const orders = DataStorage.getOrders();
    const ordersList = document.querySelector('.orders-list');
    
    if (ordersList && orders.length > 0) {
        ordersList.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h4>Заказ #${order.id}</h4>
                        <p class="order-date">${formatDate(order.createdAt)}</p>
                    </div>
                    <div class="order-status ${getStatusClass(order.status)}">${getStatusText(order.status)}</div>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <img src="${item.image}" alt="${item.title}">
                            <div class="item-info">
                                <h5>${item.title}</h5>
                                <p>Количество: ${item.quantity}</p>
                            </div>
                            <div class="item-price">${formatPrice(item.price)} ₽</div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    <span>Итого:</span>
                    <span>${formatPrice(order.total)} ₽</span>
                </div>
            </div>
        `).join('');
    }
}

// Загрузка избранного
function loadFavorites() {
    const favoriteIds = DataStorage.getFavorites();
    const products = getProducts(); // Получаем товары из catalog.js
    const favoritesGrid = document.querySelector('.favorites-grid');
    
    if (favoritesGrid && favoriteIds.length > 0) {
        const favoriteProducts = products.filter(p => favoriteIds.includes(p.id));
        favoritesGrid.innerHTML = favoriteProducts.map(product => `
            <div class="favorite-item">
                <img src="${product.image}" alt="${product.title}">
                <div class="favorite-info">
                    <h4>${product.title}</h4>
                    <p>${product.era}</p>
                    <p class="price">${formatPrice(product.price)} ₽</p>
                </div>
                <button class="remove-favorite" onclick="removeFavorite(${product.id})">×</button>
            </div>
        `).join('');
    }
}

// Загрузка адресов
function loadAddresses() {
    const addresses = DataStorage.getAddresses();
    const addressesList = document.querySelector('.addresses-list');
    
    if (addressesList && addresses.length > 0) {
        addressesList.innerHTML = addresses.map(address => `
            <div class="address-card">
                <div class="address-header">
                    <h4>${address.isDefault ? 'Основной адрес' : 'Адрес доставки'}</h4>
                    <div class="address-actions">
                        <button class="edit-btn" onclick="editAddress(${address.id})">Редактировать</button>
                        <button class="delete-btn" onclick="deleteAddress(${address.id})">Удалить</button>
                    </div>
                </div>
                <p>${address.street}</p>
                <p>${address.city}, ${address.postalCode}</p>
                <p>Иван Петров, +7 (999) 123-45-67</p>
            </div>
        `).join('');
    }
}

// Загрузка настроек
function loadSettings() {
    const settings = DataStorage.getSettings();
    
    // Устанавливаем чекбоксы
    document.querySelector('input[value="emailNotifications"]').checked = settings.emailNotifications;
    document.querySelector('input[value="smsNotifications"]').checked = settings.smsNotifications;
    document.querySelector('input[value="newsletter"]').checked = settings.newsletter;
}

// Сохранение данных профиля
function saveProfileData() {
    const formData = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        birthdate: document.getElementById('birthdate').value
    };
    
    DataStorage.updateProfile(formData);
    showNotification('Данные успешно сохранены');
    
    // Обновляем имя в сайдбаре
    const sidebarName = document.querySelector('.profile-header h3');
    if (sidebarName) {
        sidebarName.textContent = `${formData.firstName} ${formData.lastName}`.trim();
    }
    
    const sidebarEmail = document.querySelector('.profile-header p');
    if (sidebarEmail) {
        sidebarEmail.textContent = formData.email;
    }
}

// Удаление из избранного
function removeFavorite(productId) {
    DataStorage.removeFromFavorites(productId);
    loadFavorites(); // Перезагружаем избранное
    showNotification('Товар удален из избранного');
}

// Редактирование адреса
function editAddress(addressId) {
    const addresses = DataStorage.getAddresses();
    const address = addresses.find(a => a.id === addressId);
    
    if (address) {
        const newStreet = prompt('Улица, дом, квартира:', address.street);
        if (newStreet && newStreet.trim()) {
            DataStorage.updateAddress(addressId, { street: newStreet.trim() });
            loadAddresses(); // Перезагружаем адреса
            showNotification('Адрес обновлен');
        }
    }
}

// Удаление адреса
function deleteAddress(addressId) {
    if (confirm('Вы уверены, что хотите удалить этот адрес?')) {
        DataStorage.deleteAddress(addressId);
        loadAddresses(); // Перезагружаем адреса
        showNotification('Адрес удален');
    }
}

// Добавление адреса
function addAddress() {
    const street = prompt('Улица, дом, квартира:');
    const city = prompt('Город:');
    const postalCode = prompt('Индекс:');
    
    if (street && city && postalCode) {
        DataStorage.saveAddress({
            street: street.trim(),
            city: city.trim(),
            postalCode: postalCode.trim(),
            isDefault: false
        });
        loadAddresses(); // Перезагружаем адреса
        showNotification('Адрес добавлен');
    }
}

// Сохранение настроек
function saveSettings() {
    const settings = {
        emailNotifications: document.querySelector('input[value="emailNotifications"]').checked,
        smsNotifications: document.querySelector('input[value="smsNotifications"]').checked,
        newsletter: document.querySelector('input[value="newsletter"]').checked
    };
    
    DataStorage.saveSettings(settings);
    showNotification('Настройки сохранены');
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
    
    // Форма личных данных
    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfileData();
        });
    }
    
    // Настройки
    const settingInputs = document.querySelectorAll('.settings-form input[type="checkbox"]');
    settingInputs.forEach(input => {
        input.addEventListener('change', saveSettings);
    });
}

// Показать секцию
function showSection(sectionId) {
    // Скрыть все секции
    document.querySelectorAll('.profile-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Показать выбранную секцию
    document.getElementById(sectionId).classList.add('active');
    
    // Обновить активную ссылку в навигации
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.add('active');
        }
    });
}

// Вспомогательные функции
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function getStatusClass(status) {
    const classes = {
        'pending': 'processing',
        'processing': 'processing',
        'shipped': 'processing',
        'delivered': 'delivered',
        'cancelled': 'cancelled'
    };
    return classes[status] || 'processing';
}

function getStatusText(status) {
    const texts = {
        'pending': 'В обработке',
        'processing': 'В обработке',
        'shipped': 'Отправлен',
        'delivered': 'Доставлен',
        'cancelled': 'Отменен'
    };
    return texts[status] || 'В обработке';
}

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function getProducts() {
    // Товары из catalog.js
    return [
        {id: 1, title: "Антикварный комод", era: "XIX век", price: 125000, image: "/static/images/commode.jpg"},
        {id: 2, title: "Золотая брошь", era: "Начало XX века", price: 85000, image: "/static/images/brooch.jpg"},
        {id: 3, title: "Картина маслом", era: "Конец XVIII века", price: 320000, image: "/static/images/painting.jpg"},
        {id: 4, title: "Редкая книга", era: "XVII век", price: 45000, image: "/static/images/book.jpg"},
        {id: 5, title: "Кресло рококо", era: "Середина XVIII века", price: 180000, image: "/static/images/chair.jpg"},
        {id: 6, title: "Серебряный подсвечник", era: "XIX век", price: 65000, image: "/static/images/candlestick.jpg"},
        {id: 7, title: "Портрет маслом", era: "Начало XIX века", price: 280000, image: "/static/images/portrait.jpg"},
        {id: 8, title: "Антикварные часы", era: "Конец XIX века", price: 95000, image: "/static/images/clock.jpg"}
    ];
}
