// /static/js/cart.js
// Корзина использует ТОЛЬКО localStorage для состава корзины (id/quantity)
// а данные товара подтягивает из БД через /api/products

let cart = [];
let productsById = new Map();

document.addEventListener("DOMContentLoaded", async () => {
  cart = DataStorage.getCart();

  setupEventListeners();
  DataStorage.updateCartBadge();

  try {
    await loadProductsIndex();
  } catch (e) {
    console.error(e);
    DataStorage.toast("Не удалось загрузить товары из базы данных", "error");
  }

  renderCart();
  updateSummary();
});

async function loadProductsIndex() {
  const res = await fetch("/api/products");
  if (!res.ok) {
    throw new Error(`GET /api/products failed: ${res.status}`);
  }
  const list = await res.json();
  productsById = new Map(list.map((p) => [Number(p.id), p]));
}

function setupEventListeners() {
  // Мобильное меню
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.style.display = navMenu.style.display === "flex" ? "none" : "flex";
      navMenu.style.position = "absolute";
      navMenu.style.top = "100%";
      navMenu.style.left = "0";
      navMenu.style.right = "0";
      navMenu.style.background = "#2c1810";
      navMenu.style.flexDirection = "column";
      navMenu.style.padding = "1rem";
    });
  }

  // Кнопка оформления заказа (если есть)
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", proceedToCheckout);
}

function renderCart() {
  // Эти блоки есть на странице cart.html
  const cartItems = document.querySelector(".cart-items");
  const cartEmpty = document.getElementById("cart-empty");
  const cartContent = document.getElementById("cart-content");

  if (!cartItems || !cartEmpty || !cartContent) {
    // если вдруг подключили скрипт не на той странице
    return;
  }

  if (!cart || cart.length === 0) {
    cartEmpty.style.display = "block";
    cartContent.style.display = "none";
    cartItems.innerHTML = "";
    return;
  }

  cartEmpty.style.display = "none";
  cartContent.style.display = "grid";

  cartItems.innerHTML = cart
    .map((item) => {
      const product = productsById.get(Number(item.id));

      if (!product) {
        return `
          <div class="cart-item">
            <div class="cart-item-info">
              <h3>Товар #${escapeHtml(String(item.id))} не найден</h3>
              <p class="cart-item-era" style="opacity:.75;">Возможно, он был удалён или изменился каталог.</p>
            </div>
            <div class="cart-item-price">
              <button onclick="removeFromCart(${Number(item.id)})" class="remove-btn">Удалить</button>
            </div>
          </div>
        `;
      }

      const title = product.title ?? `Товар #${product.id}`;
      const era = product.period ?? product.era ?? "";
      const material = product.material ?? "";
      const price = toNumber(product.price);
      const qty = Number(item.quantity) || 1;

      // Попробуем определить главное фото
      const mainPhoto =
        product.image ||
        product.main_image ||
        product.main_photo ||
        (Array.isArray(product.photos)
          ? (product.photos.find((ph) => ph.is_main)?.url || product.photos[0]?.url)
          : null) ||
        "/static/images/placeholder.jpg";

      return `
        <div class="cart-item">
          <img src="${escapeAttr(mainPhoto)}" alt="${escapeAttr(title)}" class="cart-item-image">
          <div class="cart-item-info">
            <h3>${escapeHtml(title)}</h3>
            ${era ? `<p class="cart-item-era">${escapeHtml(era)}</p>` : ``}
            ${material ? `<p class="cart-item-material">${escapeHtml(material)}</p>` : ``}

            <p style="opacity:.75; font-size:.9rem; margin-top:.5rem;">
              Антикварные товары доступны в единственном экземпляре.
            </p>
          </div>

          <div class="cart-item-price">
            <p class="item-price">${formatPrice(price * qty)} ₽</p>
            <p class="item-unit-price">${formatPrice(price)} ₽ за шт.</p>
            <button onclick="removeFromCart(${Number(item.id)})" class="remove-btn">Удалить</button>
          </div>
        </div>
      `;
    })
    .join("");

  // обновим summary после рендера
  updateSummary();
}

function updateSummary() {
  const subtotalEl = document.getElementById("subtotal");
  const shippingEl = document.getElementById("shipping");
  const totalEl = document.getElementById("total");

  // если это не страница корзины — выходим
  if (!subtotalEl || !shippingEl || !totalEl) return;

  const subtotal = (cart || []).reduce((sum, item) => {
    const product = productsById.get(Number(item.id));
    if (!product) return sum;

    const price = toNumber(product.price);
    const qty = Number(item.quantity) || 1;
    return sum + price * qty;
  }, 0);

  const shipping = subtotal > 0 ? (subtotal > 100000 ? 0 : 2000) : 0;
  const total = subtotal + shipping;

  subtotalEl.textContent = `${formatPrice(subtotal)} ₽`;
  shippingEl.textContent = shipping > 0 ? `${formatPrice(shipping)} ₽` : "Бесплатно";
  totalEl.textContent = `${formatPrice(total)} ₽`;
}

function removeFromCart(productId) {
  cart = DataStorage.removeFromCart(productId);
  renderCart();
  DataStorage.toast("Товар удален из корзины", "success");
}

async function proceedToCheckout() {
  if (!cart || cart.length === 0) {
    DataStorage.toast("Корзина пуста", "error");
    return;
  }

  // 1) проверка авторизации
  try {
    const meRes = await fetch("/api/auth/me", {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const me = await meRes.json().catch(() => ({}));

    if (!me?.authenticated) {
      // DataStorage.toast("Войдите в аккаунт для оформления заказа", "info");
      // сохраняем куда вернуться после логина
      const next = encodeURIComponent("/cart");
      window.location.href = `/login?next=${next}`;
      return;
    }
  } catch (e) {
    console.error(e);
    DataStorage.toast("Не удалось проверить авторизацию", "error");
    return;
  }

  // 2) создаём заказ
  const payload = {
    items: cart.map((i) => ({ id: Number(i.id), quantity: Number(i.quantity || 1) })),
  };

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      // на случай если сессия истекла между проверкой и запросом
      const next = encodeURIComponent("/cart");
      window.location.href = `/login?next=${next}`;
      return;
    }

    if (!res.ok) {
      DataStorage.toast(data?.error || "Ошибка оформления заказа", "error");
      return;
    }

    DataStorage.clearCart();
    DataStorage.toast("Заказ оформлен ✅", "success");
    window.location.href = "/profile#orders";
  } catch (e) {
    console.error(e);
    DataStorage.toast("Сеть/сервер недоступны", "error");
  }
}

// ------- helpers -------

function toNumber(x) {
  // Numeric может прийти строкой "125000.00"
  const n = typeof x === "string" ? Number(x.replace(",", ".")) : Number(x);
  return Number.isFinite(n) ? n : 0;
}

function formatPrice(price) {
  const n = Math.round(toNumber(price));
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  // для атрибутов (src/alt)
  return escapeHtml(str).replaceAll("`", "&#096;");
}
