// /static/js/storage.js
// Единое хранилище для фронта (localStorage)
// Здесь НЕТ демо-данных, чтобы не подменять БД.

class DataStorage {
    // ------- CART -------
    // cart: [{ id: number, quantity: number }]
    static getCart() {
      try {
        const raw = localStorage.getItem("cart");
        const arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) return [];
        // нормализация
        return arr
          .map((x) => ({
            id: Number(x?.id),
            quantity: Number(x?.quantity ?? 1),
          }))
          .filter((x) => Number.isFinite(x.id) && x.id > 0)
          .map((x) => ({ ...x, quantity: Number.isFinite(x.quantity) && x.quantity > 0 ? x.quantity : 1 }));
      } catch {
        return [];
      }
    }
  
    static saveCart(cart) {
      localStorage.setItem("cart", JSON.stringify(cart || []));
    }
  
    static setCartItem(productId, quantity = 1) {
      const id = Number(productId);
      if (!Number.isFinite(id) || id <= 0) return this.getCart();
  
      const q = Number(quantity);
      const cart = this.getCart();
      const idx = cart.findIndex((i) => i.id === id);
  
      if (!Number.isFinite(q) || q <= 0) {
        if (idx >= 0) cart.splice(idx, 1);
        this.saveCart(cart);
        this.updateCartBadge();
        return cart;
      }
  
      if (idx >= 0) cart[idx].quantity = q;
      else cart.push({ id, quantity: q });
  
      this.saveCart(cart);
      this.updateCartBadge();
      return cart;
    }
  
    static addToCart(productId, quantity = 1) {
      const id = Number(productId);
      if (!Number.isFinite(id) || id <= 0) return this.getCart();
  
      const q = Number(quantity);
      const add = Number.isFinite(q) && q > 0 ? q : 1;
  
      const cart = this.getCart();
      const item = cart.find((i) => i.id === id);
      if (item) item.quantity += add;
      else cart.push({ id, quantity: add });
  
      this.saveCart(cart);
      this.updateCartBadge();
      return cart;
    }
  
    static removeFromCart(productId) {
      const id = Number(productId);
      const cart = this.getCart().filter((i) => i.id !== id);
      this.saveCart(cart);
      this.updateCartBadge();
      return cart;
    }
  
    static clearCart() {
      localStorage.removeItem("cart");
      this.updateCartBadge();
    }
  
    static getCartCount() {
      return this.getCart().reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    }
  
    static updateCartBadge() {
      const el = document.getElementById("cart-count");
      if (el) el.textContent = String(this.getCartCount());
    }
  
    // ------- Simple toast (опционально) -------
    static toast(message, type = "info") {
      // type: info | success | error
      const existing = document.querySelector(".toast-container");
      const container = existing || (() => {
        const c = document.createElement("div");
        c.className = "toast-container";
        c.style.cssText = `
          position: fixed;
          top: 100px;
          right: 20px;
          z-index: 4000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        `;
        document.body.appendChild(c);
        return c;
      })();
  
      const toast = document.createElement("div");
      const bg =
        type === "success" ? "#d4af37" :
        type === "error" ? "#dc3545" :
        "#2c1810";
      const color = type === "error" ? "#fff" : "#f8f5f2";
  
      toast.style.cssText = `
        pointer-events: auto;
        background: ${bg};
        color: ${color};
        padding: 12px 14px;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        max-width: 320px;
        font-weight: 600;
        line-height: 1.2;
        transform: translateY(-6px);
        opacity: 0;
        transition: opacity .2s ease, transform .2s ease;
      `;
      toast.textContent = message;
  
      container.appendChild(toast);
  
      requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
      });
  
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-6px)";
        setTimeout(() => toast.remove(), 250);
      }, 3000);
    }
  }
  
  // Обновляем бейдж корзины на каждой странице, где подключен storage.js
  document.addEventListener("DOMContentLoaded", () => {
    DataStorage.updateCartBadge();
  });