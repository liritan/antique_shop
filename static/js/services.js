document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateCartCount();
  });
  
  function setupEventListeners() {
    // Мобильное меню
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
  
    if (hamburger && navMenu) {
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
  
    // Форма заявки
    const serviceForm = document.getElementById('serviceForm');
    if (serviceForm) {
      serviceForm.addEventListener('submit', handleFormSubmit);
    }
  
    // Маска для телефона
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', formatPhone);
    }
  }
  
  function formatPhone(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      if (value[0] === '7') value = value.substring(1);
      if (value.length > 10) value = value.substring(0, 10);
  
      let formatted = '+7 (';
      if (value.length >= 3) {
        formatted += value.substring(0, 3) + ') ';
        if (value.length >= 6) {
          formatted += value.substring(3, 6) + '-';
          if (value.length >= 8) {
            formatted += value.substring(6, 8) + '-';
            formatted += value.length >= 10 ? value.substring(8, 10) : value.substring(8);
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
  
  function handleFormSubmit(e) {
    e.preventDefault();
  
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
  
    if (!validateForm(data)) return;
  
    showNotification('Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
    e.target.reset();
  
    // пока mock (как и у тебя в contacts.js)
    console.log('Заявка на услугу:', data);
  }
  
  function validateForm(data) {
    if (!data.name || data.name.trim().length < 2) {
      showNotification('Пожалуйста, введите корректное имя', 'error');
      return false;
    }
    if (!data.email || !isValidEmail(data.email)) {
      showNotification('Пожалуйста, введите корректный email', 'error');
      return false;
    }
    if (!data.service_type) {
      showNotification('Пожалуйста, выберите услугу', 'error');
      return false;
    }
    if (!data.message || data.message.trim().length < 10) {
      showNotification('Описание должно содержать не менее 10 символов', 'error');
      return false;
    }
    if (!data.privacy) {
      showNotification('Необходимо согласие с политикой конфиденциальности', 'error');
      return false;
    }
    return true;
  }
  
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const el = document.getElementById('cart-count');
    if (el) el.textContent = count;
  }
  
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
      max-width: 320px;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
  
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // анимации
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
  `;
  document.head.appendChild(style);