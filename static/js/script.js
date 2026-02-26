

let products = [];
let cart = [];

// ---------- helpers ----------
function getEra(p) {
  return p.era ?? p.period ?? "";
}

function isInStock(p) {
  if (typeof p.in_stock === "boolean") return p.in_stock;
  if (typeof p.status === "string") return p.status === "available";
  return true;
}

function getImage(p) {
  if (p.image) return p.image;
  if (Array.isArray(p.photos) && p.photos.length > 0) {
    const main = p.photos.find(ph => ph.is_main) || p.photos[0];
    return main.url || "";
  }
  return "";
}

function getDimensions(p) {
  // если сервер не отдаёт dimensions строкой — просто покажем аккуратно
  if (p.dimensions) return p.dimensions;

  const h = p.height_cm ?? null;
  const w = p.width_cm ?? null;
  const d = p.depth_cm ?? null;

  const nums = [h, w, d].filter(v => v !== null && v !== undefined && v !== "");
  if (nums.length === 0) return "";
  return nums.join(" x ") + " см";
}

function formatPrice(price) {
  const n = Number(price);
  if (Number.isNaN(n)) return String(price);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

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
  setTimeout(() => notification.remove(), 3000);
}

async function fetchProducts(category = "all") {
  const url = new URL("/api/products", window.location.origin);
  if (category && category !== "all") url.searchParams.set("category", category);

  const res = await fetch(url.toString(), { headers: { "Accept": "application/json" }});
  if (!res.ok) throw new Error(`Ошибка загрузки товаров: ${res.status}`);
  return await res.json();
}

async function fetchProductById(id) {
  const res = await fetch(`/api/products/${id}`, { headers: { "Accept": "application/json" }});
  if (!res.ok) throw new Error(`Ошибка загрузки товара: ${res.status}`);
  return await res.json();
}

// ---------- init ----------
document.addEventListener('DOMContentLoaded', async function () {
  cart = JSON.parse(localStorage.getItem('cart') || '[]');
  setupEventListeners();
  updateCartCount();

  try {
    products = await fetchProducts("all");
    renderProducts(products);
  } catch (e) {
    console.error(e);
    showNotification("Не удалось загрузить товары");
  }
});

// ---------- render ----------
function renderProducts(list) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = list.map(p => `
    <div class="product-card" data-id="${p.id}">
      <img src="${getImage(p)}" alt="${p.title}" class="product-image">
      <div class="product-info">
        <h3 class="product-title">${p.title}</h3>
        <p class="product-era">${getEra(p)}</p>
        <p class="product-price">${formatPrice(p.price)} ₽</p>
        <button class="add-to-cart" onclick="addToCart(${p.id})">
          В корзину
        </button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', function (e) {
      if (!e.target.classList.contains('add-to-cart')) {
        const productId = parseInt(this.dataset.id);
        showProductModal(productId);
      }
    });
  });
}

// ---------- events ----------
function setupEventListeners() {
  // фильтры на главной (кнопки)
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const category = this.dataset.category || "all";
      try {
        products = await fetchProducts(category);
        renderProducts(products);
      } catch (e) {
        console.error(e);
        showNotification("Не удалось загрузить товары");
      }
    });
  });

  // модалка
  const modal = document.getElementById('product-modal');
  const closeBtn = document.querySelector('.close');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  // мобильное меню
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

  // корзина в меню
  const cartLink = document.querySelector('.cart-link');
  if (cartLink) {
    cartLink.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = '/cart';
    });
  }
}

// ---------- cart ----------
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (!isInStock(product)) return;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    showNotification('Этот товар уже в корзине');
    return;
  }

  cart.push({ ...product, quantity: 1 });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  showNotification('Товар добавлен в корзину');
}

function updateCartCount() {
  const cartLocal = JSON.parse(localStorage.getItem('cart') || '[]');
  const count = cartLocal.reduce((total, item) => total + (item.quantity || 1), 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = count;
}

// ---------- modal ----------
async function showProductModal(productId) {
  const modal = document.getElementById('product-modal');
  const details = document.getElementById('modal-product-details');
  if (!modal || !details) return;

  try {
    // берём detail с сервера (надёжнее)
    const product = await fetchProductById(productId);

    details.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <div>
          <img src="${getImage(product)}" alt="${product.title}" style="width: 100%; border-radius: 10px;">
        </div>
        <div>
          <h2 style="font-family: 'Playfair Display', serif; color: #2c1810; margin-bottom: 1rem;">
            ${product.title}
          </h2>
          <p style="color: #666; margin-bottom: 1rem;">${getEra(product)}</p>
          <p style="font-size: 1.8rem; color: #d4af37; font-weight: 600; margin-bottom: 1.5rem;">
            ${formatPrice(product.price)} ₽
          </p>
          <p style="line-height: 1.6; margin-bottom: 1.5rem;">${product.description || ""}</p>
          <div style="background: #f8f5f2; padding: 1rem; border-radius: 5px; margin-bottom: 1.5rem;">
            ${getDimensions(product) ? `<p><strong>Размеры:</strong> ${getDimensions(product)}</p>` : ""}
            ${product.material ? `<p><strong>Материал:</strong> ${product.material}</p>` : ""}
          </div>
          <button onclick="addToCart(${product.id})"
            style="background: #d4af37; color: #2c1810; border: none; padding: 15px 30px; font-size: 1.1rem; font-weight: 600; border-radius: 5px; cursor: pointer; width: 100%; ${!isInStock(product) ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
            ${isInStock(product) ? 'Добавить в корзину' : 'Недоступен'}
          </button>
        </div>
      </div>
    `;

    modal.style.display = 'block';
  } catch (e) {
    console.error(e);
    showNotification("Не удалось загрузить карточку товара");
  }
}

function scrollToCatalog() {
  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
}