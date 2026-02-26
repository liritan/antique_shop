

(function () {
    // ---------- TOASTS ----------
    function ensureToastContainer() {
      let c = document.getElementById("toast-container");
      if (c) return c;
  
      c = document.createElement("div");
      c.id = "toast-container";
      c.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 4000;
        pointer-events: none;
      `;
      document.body.appendChild(c);
      return c;
    }
  
    function showToast(message, type = "success") {
      const container = ensureToastContainer();
  
      const toast = document.createElement("div");
      toast.style.cssText = `
        pointer-events: auto;
        min-width: 260px;
        max-width: 360px;
        padding: 12px 14px;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,.18);
        font-weight: 600;
        transform: translateX(120%);
        opacity: 0;
        transition: transform .25s ease, opacity .25s ease;
        background: ${type === "error" ? "#dc3545" : type === "info" ? "#2c1810" : "#d4af37"};
        color: ${type === "error" ? "#fff" : "#2c1810"};
      `;
      toast.textContent = message;
  
      container.appendChild(toast);
      requestAnimationFrame(() => {
        toast.style.transform = "translateX(0)";
        toast.style.opacity = "1";
      });
  
      const lifeMs = 2600;
      setTimeout(() => {
        toast.style.transform = "translateX(120%)";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 260);
      }, lifeMs);
    }
  
    // expose if надо из HTML onclick
    window.showToast = showToast;
  
    // ---------- HELPERS ----------
    function setText(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value ?? "";
    }
  
    function setValue(id, value) {
      const el = document.getElementById(id);
      if (el) el.value = value ?? "";
    }
  
    function getValue(id) {
      const el = document.getElementById(id);
      return el ? el.value : "";
    }
  
    function fullName(u) {
      const parts = [
        (u.last_name || "").trim(),
        (u.first_name || "").trim(),
        (u.middle_name || "").trim(),
      ].filter(Boolean);
  
      return parts.join(" ") || "Пользователь";
    }
  
    // ---------- API ----------
    async function apiMe() {
      const res = await fetch("/api/auth/me", {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      return await res.json();
    }
  
    async function apiLogout() {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
      return await res.json();
    }
  
    async function apiUpdateMe(payload) {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
  
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Update failed: ${res.status}`);
      return data;
    }
  
    // ---------- UI: sections ----------
    function showSection(sectionId) {
      document.querySelectorAll(".profile-section").forEach(s => s.classList.remove("active"));
      document.querySelectorAll(".profile-nav .nav-link").forEach(l => l.classList.remove("active"));
  
      const section = document.getElementById(sectionId);
      if (section) section.classList.add("active");
  
      const links = document.querySelectorAll(".profile-nav .nav-link");
      links.forEach(link => {
        const href = link.getAttribute("href") || "";
        if (href === `#${sectionId}`) link.classList.add("active");
      });
    }
  
    // чтобы работали onclick в HTML
    window.showSection = showSection;
  
    window.addAddress = function addAddress() {
      showToast("Адреса доставки пока не реализованы", "info");
    };
  
    window.removeFavorite = function removeFavorite(btn) {
      btn?.closest?.(".favorite-item")?.remove?.();
    };
  
    // ---------- INIT ----------
    document.addEventListener("DOMContentLoaded", async () => {
      // счётчик корзины (если storage.js определяет updateCartCount)
      if (typeof updateCartCount === "function") updateCartCount();
  
      // mobile menu (если у тебя нет общего main.js)
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
  
      // load me
      try {
        const me = await apiMe();
        if (!me.authenticated) {
          window.location.href = "/login";
          return;
        }
  
        const u = me.user || {};
  
        setText("profile-name", fullName(u));
        setText("profile-email", u.email || "");
  
        setValue("first-name", u.first_name || "");
        setValue("last-name", u.last_name || "");
        setValue("middle-name", u.middle_name || "");
        setValue("email", u.email || "");      // email неизменяемый — пусть остаётся disabled в HTML
        setValue("phone", u.phone || "");
        setValue("birthdate", u.birthdate || "");
  
        const status = document.getElementById("profile-status");
        if (status) status.textContent = `ID: ${u.id}`;
  
      } catch (e) {
        console.error(e);
        showToast("Ошибка загрузки профиля", "error");
      }
  
      // logout
      const logoutBtn = document.getElementById("logoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          try {
            await apiLogout();
            window.location.href = "/login";
          } catch (e) {
            console.error(e);
            showToast("Не удалось выйти", "error");
          }
        });
      }
  
      // save form
      const form = document.getElementById("profileForm");
      if (form) {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
  
          // email НЕ отправляем, раз он неизменяемый
          const payload = {
            first_name: getValue("first-name"),
            last_name: getValue("last-name"),
            middle_name: getValue("middle-name"),
            phone: getValue("phone"),
            birthdate: getValue("birthdate"),
          };
  
          try {
            const resp = await apiUpdateMe(payload);
            const u = resp.user || {};
  
            setText("profile-name", fullName(u));
            // email мог вернуться прежним — но всё равно:
            setText("profile-email", u.email || getValue("email"));
  
            showToast("Изменения сохранены", "success");
          } catch (err) {
            console.error(err);
            showToast(`Ошибка сохранения: ${err.message}`, "error");
          }
        });
      }
    });
  })();