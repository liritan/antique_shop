

let products = [];
let filteredProducts = [];
let currentView = 'grid';
let currentPage = 1;
let itemsPerPage = 12;

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
  setupEventListeners();
  updateCartCount();

  try {
    products = await fetchProducts("all");
    filteredProducts = [...products];
    renderProducts();
  } catch (e) {
    console.error(e);
    showNotification("Не удалось загрузить товары");
  }
});

// ---------- events ----------
function setupEventListeners() {
  const modal = document.getElementById('product-modal');
  const closeBtn = document.querySelector('.close');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

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
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageProducts = filteredProducts.slice(startIndex, endIndex);

  if (currentView === 'grid') {
    grid.className = 'products-grid';
    grid.innerHTML = pageProducts.map(p => {
      const inStock = isInStock(p);
      const stockClass = inStock ? '' : 'out-of-stock';
      
      return `
        <div class="product-card ${stockClass}" data-id="${p.id}">
          <img src="${getImage(p)}" alt="${p.title}" class="product-image">
          <div class="product-info">
            <h3 class="product-title">${p.title}</h3>
            <p class="product-era">${getEra(p)}</p>
            <p class="product-price">${formatPrice(p.price)} ₽</p>
            <button class="add-to-cart" onclick="addToCart(${p.id})" ${!inStock ? 'disabled' : ''}>
              ${inStock ? 'В корзину' : 'Нет в наличии'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  } else {
    grid.className = 'products-list';
    grid.innerHTML = pageProducts.map(p => {
      const inStock = isInStock(p);
      const stockClass = inStock ? '' : 'out-of-stock';
      
      return `
        <div class="product-list-item ${stockClass}" data-id="${p.id}">
          <img src="${getImage(p)}" alt="${p.title}" class="product-list-image">
          <div class="product-list-info">
            <h3 class="product-title">${p.title}</h3>
            <p class="product-era">${getEra(p)}</p>
            <p class="product-description">${p.description || ""}</p>
            <p class="product-price">${formatPrice(p.price)} ₽</p>
          </div>
          <div class="product-list-actions">
            <button class="view-details" onclick="showProductModal(${p.id})" ${!inStock ? 'disabled' : ''}>Подробнее</button>
            <button class="add-to-cart" onclick="addToCart(${p.id})" ${!inStock ? 'disabled' : ''}>
              ${inStock ? 'В корзину' : 'Нет в наличии'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  document.querySelectorAll('.product-card, .product-list-item').forEach(card => {
    card.addEventListener('click', function (e) {
      if (!e.target.classList.contains('add-to-cart') && !e.target.classList.contains('view-details')) {
        const productId = parseInt(this.dataset.id);
        showProductModal(productId);
      }
    });
  });

  updateResultsCount();
  renderPagination();
}
function applyFilters() {
  const categories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
  const eras = Array.from(document.querySelectorAll('input[name="era"]:checked')).map(cb => cb.value);

  const minPrice = parseInt(document.getElementById('min-price').value) || 0;
  const maxPriceValue = document.getElementById('max-price').value;
  const maxPrice = maxPriceValue ? parseInt(maxPriceValue) : Infinity;

  const inStockOnly = document.querySelector('input[name="availability"]:checked') !== null;

  filteredProducts = products.filter(p => {
    const pCategory = p.category ?? p.category_slug ?? (p.category?.slug ?? null);

    const categoryMatch = categories.includes('all') || categories.includes(pCategory);
    const eraVal = getEra(p);
    const eraMatch = eras.length === 0 || eras.includes(eraVal);

    const priceNum = Number(p.price);
    const priceMatch = priceNum >= minPrice && priceNum <= maxPrice;

    const stockMatch = !inStockOnly || isInStock(p);

    return categoryMatch && eraMatch && priceMatch && stockMatch;
  });

  currentPage = 1;
  renderProducts();
 }
function resetFilters() {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    if (cb.value === 'all') cb.checked = true;
    else cb.checked = false;
  });
  document.getElementById('min-price').value = '';
  document.getElementById('max-price').value = '';

  filteredProducts = [...products];
  currentPage = 1;
  renderProducts();
}
// function resetFilters() {
//   document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
//     if (cb.value === 'all' || cb.value === 'in_stock') cb.checked = true;
//     else cb.checked = false;
//   });
//   document.getElementById('min-price').value = '';
//   document.getElementById('max-price').value = '';

//   filteredProducts = [...products];
//   currentPage = 1;
//   renderProducts();
// }

function searchProducts() {
  const query = document.getElementById('search-input').value.toLowerCase();

  if (!query) {
    filteredProducts = [...products];
  } else {
    filteredProducts = products.filter(p =>
      (p.title || "").toLowerCase().includes(query) ||
      (p.description || "").toLowerCase().includes(query) ||
      getEra(p).toLowerCase().includes(query) ||
      (p.material || "").toLowerCase().includes(query)
    );
  }

  currentPage = 1;
  renderProducts();
}

function sortProducts() {
  const sortValue = document.getElementById('sort-select').value;

  switch (sortValue) {
    case 'price-asc':
      filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case 'price-desc':
      filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case 'name-asc':
      filteredProducts.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      break;
    case 'name-desc':
      filteredProducts.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
      break;
    default:
      filteredProducts = [...products];
  }

  renderProducts();
}

function changeView(view) {
  currentView = view;
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  renderProducts();
}

// ---------- pagination ----------
function updateResultsCount() {
  const el = document.getElementById('results-count');
  if (el) el.textContent = `Найдено товаров: ${filteredProducts.length}`;
}

function renderPagination() {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = '';

  if (currentPage > 1) html += `<button onclick="changePage(${currentPage - 1})" class="page-btn">←</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button onclick="changePage(${i})" class="page-btn ${i === currentPage ? 'active' : ''}">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span class="page-dots">...</span>`;
    }
  }

  if (currentPage < totalPages) html += `<button onclick="changePage(${currentPage + 1})" class="page-btn">→</button>`;

  pagination.innerHTML = html;
}

function changePage(page) {
  currentPage = page;
  renderProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- modal ----------
async function showProductModal(productId) {
  const modal = document.getElementById('product-modal');
  const details = document.getElementById('modal-product-details');
  if (!modal || !details) return;

  try {
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
            <p><strong>Наличие:</strong> ${isInStock(product) ? 'В наличии' : 'Недоступен'}</p>
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

// ---------- cart ----------
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  if (!isInStock(product)) return;

  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
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
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = count;
}