// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateCartCount();
});

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
    
    // Форма обратной связи
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Маска для телефона
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', formatPhone);
    }
}

// Форматирование телефона
function formatPhone(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        if (value[0] === '7') {
            value = value.substring(1);
        }
        if (value.length > 10) {
            value = value.substring(0, 10);
        }
        
        let formatted = '+7 (';
        if (value.length >= 3) {
            formatted += value.substring(0, 3) + ') ';
            if (value.length >= 6) {
                formatted += value.substring(3, 6) + '-';
                if (value.length >= 8) {
                    formatted += value.substring(6, 8) + '-';
                    if (value.length >= 10) {
                        formatted += value.substring(8, 10);
                    } else {
                        formatted += value.substring(8);
                    }
                } else {
                    formatted += value.substring(6);
                }
            } else {
                formatted += value.substring(3);
            }
        } else {
            formatted += value;
        }
        
        e.target.value = formatted;
    }
}

// Обработка отправки формы
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Валидация
    if (!validateForm(data)) {
        return;
    }
    
    // Показываем уведомление об отправке
    showNotification('Ваше сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
    
    // Очищаем форму
    e.target.reset();
    
    // В реальном приложении здесь будет отправка данных на сервер
    console.log('Данные формы:', data);
}

// Валидация формы
function validateForm(data) {
    if (!data.name || data.name.trim().length < 2) {
        showNotification('Пожалуйста, введите корректное имя', 'error');
        return false;
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        showNotification('Пожалуйста, введите корректный email', 'error');
        return false;
    }
    
    if (!data.subject) {
        showNotification('Пожалуйста, выберите тему обращения', 'error');
        return false;
    }
    
    if (!data.message || data.message.trim().length < 10) {
        showNotification('Сообщение должно содержать не менее 10 символов', 'error');
        return false;
    }
    
    if (!data.privacy) {
        showNotification('Необходимо согласие с политикой конфиденциальности', 'error');
        return false;
    }
    
    return true;
}

// Проверка email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Переключение FAQ
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const answer = faqItem.querySelector('.faq-answer');
    const toggle = element.querySelector('.faq-toggle');
    
    // Закрываем другие открытые FAQ
    document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem && item.classList.contains('open')) {
            item.classList.remove('open');
            item.querySelector('.faq-answer').style.maxHeight = '0';
            item.querySelector('.faq-toggle').textContent = '+';
        }
    });
    
    // Переключаем текущий FAQ
    faqItem.classList.toggle('open');
    
    if (faqItem.classList.contains('open')) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        toggle.textContent = '-';
    } else {
        answer.style.maxHeight = '0';
        toggle.textContent = '+';
    }
}

// Обновление счетчика корзины
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

// Уведомления
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : '#d4af37'};
        color: ${type === 'error' ? 'white' : '#2c1810'};
        padding: 1rem 1.5rem;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 3000;
        font-weight: 600;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Добавление CSS анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .faq-answer {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
    }
    
    .faq-item.open .faq-answer {
        margin-top: 1rem;
    }
    
    .faq-toggle {
        font-size: 1.5rem;
        font-weight: bold;
        transition: transform 0.3s ease;
    }
    
    .contact-form {
        max-width: 600px;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: #2c1810;
        font-weight: 500;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 0.8rem;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-family: inherit;
    }
    
    .form-group textarea {
        resize: vertical;
        min-height: 120px;
    }
    
    .checkbox-group label {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        cursor: pointer;
        line-height: 1.4;
    }
    
    .checkbox-group input[type="checkbox"] {
        margin-top: 0.2rem;
    }
    
    .submit-btn {
        background: #d4af37;
        color: #2c1810;
        border: none;
        padding: 1rem 2rem;
        border-radius: 5px;
        cursor: pointer;
        font-weight: 600;
        font-size: 1.1rem;
        transition: all 0.3s;
    }
    
    .submit-btn:hover {
        background: #b8941f;
    }
    
    .contact-form-container {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 3rem;
    }
    
    .info-card {
        background: #f8f5f2;
        padding: 1.5rem;
        border-radius: 10px;
        margin-bottom: 1.5rem;
    }
    
    .info-card h3 {
        color: #2c1810;
        margin-bottom: 1rem;
        font-family: 'Playfair Display', serif;
    }
    
    .info-card ul {
        list-style: none;
        padding: 0;
    }
    
    .info-card li {
        margin-bottom: 0.5rem;
        color: #666;
    }
    
    .social-links {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .social-link {
        color: #2c1810;
        text-decoration: none;
        padding: 0.5rem;
        border-radius: 5px;
        transition: background 0.3s;
    }
    
    .social-link:hover {
        background: #d4af37;
        color: #fff;
    }
    
    @media (max-width: 768px) {
        .contact-form-container {
            grid-template-columns: 1fr;
        }
        
        .form-row {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(style);
