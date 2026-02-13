// Система хранения данных в localStorage
class DataStorage {
    // Профиль пользователя
    static saveProfile(data) {
        localStorage.setItem('userProfile', JSON.stringify(data));
    }
    
    static getProfile() {
        const data = localStorage.getItem('userProfile');
        return data ? JSON.parse(data) : null;
    }
    
    static updateProfile(updates) {
        const current = this.getProfile() || {};
        const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
        this.saveProfile(updated);
        return updated;
    }
    
    // Заказы
    static saveOrder(order) {
        const orders = this.getOrders();
        order.id = Date.now();
        order.createdAt = new Date().toISOString();
        order.status = 'pending';
        orders.push(order);
        localStorage.setItem('userOrders', JSON.stringify(orders));
        return order;
    }
    
    static getOrders() {
        const data = localStorage.getItem('userOrders');
        return data ? JSON.parse(data) : [];
    }
    
    static updateOrderStatus(orderId, status) {
        const orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = status;
            order.updatedAt = new Date().toISOString();
            localStorage.setItem('userOrders', JSON.stringify(orders));
        }
        return order;
    }
    
    // Избранное
    static addToFavorites(productId) {
        const favorites = this.getFavorites();
        if (!favorites.includes(productId)) {
            favorites.push(productId);
            localStorage.setItem('userFavorites', JSON.stringify(favorites));
        }
        return favorites;
    }
    
    static removeFromFavorites(productId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(productId);
        if (index > -1) {
            favorites.splice(index, 1);
            localStorage.setItem('userFavorites', JSON.stringify(favorites));
        }
        return favorites;
    }
    
    static getFavorites() {
        const data = localStorage.getItem('userFavorites');
        return data ? JSON.parse(data) : [];
    }
    
    // Адреса доставки
    static saveAddress(address) {
        const addresses = this.getAddresses();
        address.id = Date.now();
        addresses.push(address);
        localStorage.setItem('userAddresses', JSON.stringify(addresses));
        return address;
    }
    
    static updateAddress(addressId, updates) {
        const addresses = this.getAddresses();
        const address = addresses.find(a => a.id === addressId);
        if (address) {
            Object.assign(address, updates);
            localStorage.setItem('userAddresses', JSON.stringify(addresses));
        }
        return address;
    }
    
    static deleteAddress(addressId) {
        const addresses = this.getAddresses();
        const filtered = addresses.filter(a => a.id !== addressId);
        localStorage.setItem('userAddresses', JSON.stringify(filtered));
        return filtered;
    }
    
    static getAddresses() {
        const data = localStorage.getItem('userAddresses');
        return data ? JSON.parse(data) : [];
    }
    
    // Настройки
    static saveSettings(settings) {
        localStorage.setItem('userSettings', JSON.stringify(settings));
    }
    
    static getSettings() {
        const data = localStorage.getItem('userSettings');
        return data ? JSON.parse(data) : {
            emailNotifications: true,
            smsNotifications: false,
            newsletter: true
        };
    }
    
    // Корзина (для совместимости)
    static saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
    
    static getCart() {
        const data = localStorage.getItem('cart');
        return data ? JSON.parse(data) : [];
    }
    
    // Очистка всех данных
    static clearAll() {
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userOrders');
        localStorage.removeItem('userFavorites');
        localStorage.removeItem('userAddresses');
        localStorage.removeItem('userSettings');
        localStorage.removeItem('cart');
    }
}

// Инициализация данных по умолчанию
function initializeDefaultData() {
    // Профиль по умолчанию
    if (!DataStorage.getProfile()) {
        DataStorage.saveProfile({
            firstName: 'Иван',
            lastName: 'Петров',
            email: 'ivan.petrov@example.com',
            phone: '+7 (999) 123-45-67',
            birthdate: '1985-06-15',
            createdAt: new Date().toISOString()
        });
    }
    
    // Демо-заказы
    if (DataStorage.getOrders().length === 0) {
        DataStorage.saveOrder({
            items: [
                {
                    id: 1,
                    title: 'Антикварный комод',
                    price: 125000,
                    quantity: 1,
                    image: '/static/images/commode.jpg'
                }
            ],
            total: 125000,
            customerInfo: {
                name: 'Иван Петров',
                email: 'ivan.petrov@example.com',
                phone: '+7 (999) 123-45-67'
            }
        });
        
        DataStorage.saveOrder({
            items: [
                {
                    id: 2,
                    title: 'Золотая брошь',
                    price: 85000,
                    quantity: 1,
                    image: '/static/images/brooch.jpg'
                }
            ],
            total: 85000,
            customerInfo: {
                name: 'Иван Петров',
                email: 'ivan.petrov@example.com',
                phone: '+7 (999) 123-45-67'
            }
        });
        
        // Обновляем статус первого заказа
        DataStorage.updateOrderStatus(1, 'delivered');
    }
    
    // Демо-адрес
    if (DataStorage.getAddresses().length === 0) {
        DataStorage.saveAddress({
            street: 'ул. Арбат, д. 15, кв. 42',
            city: 'Москва',
            postalCode: '119002',
            isDefault: true
        });
    }
    
    // Демо-избранное
    if (DataStorage.getFavorites().length === 0) {
        DataStorage.addToFavorites(3); // Картина маслом
        DataStorage.addToFavorites(8); // Антикварные часы
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initializeDefaultData();
});
