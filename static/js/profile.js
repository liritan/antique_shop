
(function () {
  // ---------------- TOASTS ----------------
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
      z-index: 6000;
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
      max-width: 380px;
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

  window.showToast = showToast;

  // ---------------- HELPERS ----------------
  const DEFAULT_AVATAR = "/static/images/default-avatar.jpg";

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

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replaceAll("`", "&#096;");
  }

  function toNumber(x) {
    const n = typeof x === "string" ? Number(x.replace(",", ".")) : Number(x);
    return Number.isFinite(n) ? n : 0;
  }

  function formatPrice(price) {
    const n = Math.round(toNumber(price));
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function formatDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ru-RU");
  }

  function getEra(p) {
    return p?.period ?? p?.era ?? "";
  }

  function getImage(p) {
    if (!p) return "/static/images/placeholder.jpg";
    if (p.image) return p.image;
    if (Array.isArray(p.photos) && p.photos.length > 0) {
      const main = p.photos.find((ph) => ph.is_main) || p.photos[0];
      return main?.url || "/static/images/placeholder.jpg";
    }
    return "/static/images/placeholder.jpg";
  }

  function setAvatarSrc(url) {
    const img = document.getElementById("avatar-img");
    if (!img) return;
    const u = (url || "").trim();
    img.src = u ? `${u}?t=${Date.now()}` : DEFAULT_AVATAR;
  }

  function getCurrentAvatarSrc() {
    const img = document.getElementById("avatar-img");
    return img?.src || DEFAULT_AVATAR;
  }

  // ---------------- API ----------------
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Logout failed: ${res.status}`);
    return data;
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

  async function apiOrders() {
    const res = await fetch("/api/orders", {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await res.json().catch(() => ([]));
    if (!res.ok) throw new Error(data?.error || `Orders failed: ${res.status}`);
    return data;
  }

  async function apiOrderDetail(id) {
    const res = await fetch(`/api/orders/${id}`, {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Order detail failed: ${res.status}`);
    return data;
  }

  async function apiProductsIndex() {
    const res = await fetch("/api/products", {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await res.json().catch(() => ([]));
    if (!res.ok) throw new Error(`Products failed: ${res.status}`);
    return Array.isArray(data) ? data : [];
  }

  async function apiUploadAvatar(file) {
    const fd = new FormData();
    fd.append("avatar", file);

    const res = await fetch("/api/users/me/avatar", {
      method: "POST",
      credentials: "include",
      body: fd,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Avatar upload failed: ${res.status}`);
    return data;
  }

  // ---------------- UI: sections ----------------
  function showSection(sectionId) {
    document.querySelectorAll(".profile-section").forEach((s) => s.classList.remove("active"));
    document.querySelectorAll(".profile-nav .nav-link").forEach((l) => l.classList.remove("active"));

    const section = document.getElementById(sectionId);
    if (section) section.classList.add("active");

    document.querySelectorAll(".profile-nav .nav-link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (href === `#${sectionId}`) link.classList.add("active");
    });
  }

  window.showSection = showSection;

  window.addAddress = function addAddress() {
    showToast("Адреса доставки пока не реализованы", "info");
  };

  // ---------------- Orders UI ----------------
  function setOrdersLoading(isLoading) {
    const el = document.getElementById("orders-loading");
    if (!el) return;
    el.style.display = isLoading ? "block" : "none";
  }

  function renderOrders(list) {
    const box = document.getElementById("orders-list");
    if (!box) return;

    if (!Array.isArray(list) || list.length === 0) {
      box.innerHTML = `<p style="opacity:.75;">Заказов пока нет.</p>`;
      return;
    }

    box.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${list
          .map(
            (o) => `
          <div style="border:1px solid rgba(0,0,0,.08); border-radius:12px; padding:12px 14px; background:#fff;">
            <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center;">
              <div style="font-weight:700;">Заказ #${escapeHtml(o.id)}</div>
              <div style="font-weight:700;">${formatPrice(o.total_amount)} ₽</div>
            </div>
            <div style="opacity:.75; margin-top:6px;">
              <span>Статус: <b>${escapeHtml(o.status || "")}</b></span>
              <span style="margin-left:10px;">•</span>
              <span style="margin-left:10px;">${escapeHtml(formatDateTime(o.created_at))}</span>
            </div>
            <button class="order-detail-btn" data-order-id="${escapeHtml(o.id)}" style="
              margin-top:10px;
              background:#2c1810; color:#f8f5f2; border:none;
              padding:8px 12px; border-radius:10px; cursor:pointer;
            ">Детали</button>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    box.querySelectorAll(".order-detail-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.orderId);
        if (!Number.isFinite(id)) return;

        try {
          const detail = await apiOrderDetail(id);
          openOrderModal(detail);
        } catch (e) {
          console.error(e);
          showToast("Не удалось загрузить детали заказа", "error");
        }
      });
    });
  }

  // ---------------- Products cache (for order details) ----------------
  let productsById = new Map(); // product_id -> product

  // ---------------- Order Modal ----------------
  function openOrderModal(order) {
    const modal = document.getElementById("order-modal");
    const body = document.getElementById("order-modal-body");
    if (!modal || !body) return;

    const items = Array.isArray(order.items) ? order.items : [];

    const itemsHtml =
      items.length === 0
        ? `<p style="opacity:.75;">Нет позиций</p>`
        : `
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${items
            .map((it) => {
              const pid = Number(it.product_id);
              const p = productsById.get(pid);

              const title = p?.title || `Товар #${pid}`;
              const era = getEra(p);
              const material = p?.material || "";
              const img = getImage(p);

              const unit = toNumber(it.price_at_purchase);
              const qty = Number(it.quantity) || 1;
              const line = unit * qty;

              return `
                <div style="display:grid; grid-template-columns: 90px 1fr; gap:12px; border:1px solid rgba(0,0,0,.08); border-radius:12px; padding:10px 12px;">
                  <div>
                    <img src="${escapeAttr(img)}" alt="${escapeAttr(title)}" style="width:90px; height:90px; object-fit:cover; border-radius:10px;">
                  </div>
                  <div>
                    <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:flex-start;">
                      <div style="font-weight:700; color:#2c1810;">${escapeHtml(title)}</div>
                      <div style="font-weight:700;">${formatPrice(line)} ₽</div>
                    </div>

                    <div style="opacity:.75; margin-top:6px;">
                      ${era ? `<span>${escapeHtml(era)}</span>` : ``}
                      ${era && material ? ` <span>•</span> ` : ``}
                      ${material ? `<span>${escapeHtml(material)}</span>` : ``}
                    </div>

                    <div style="opacity:.9; margin-top:8px;">
                      ${formatPrice(unit)} ₽ × ${escapeHtml(qty)}
                      <span style="opacity:.6;">(ID: ${escapeHtml(pid)})</span>
                    </div>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `;

    body.innerHTML = `
      <h2 style="margin:0 0 8px 0; font-family:'Playfair Display', serif; color:#2c1810;">
        Заказ #${escapeHtml(order.id)}
      </h2>

      <div style="opacity:.85; margin-bottom: 14px; line-height:1.5;">
        <div><b>Статус:</b> ${escapeHtml(order.status || "")}</div>
        <div><b>Сумма заказа:</b> ${formatPrice(order.total_amount)} ₽</div>
        <div><b>Дата:</b> ${escapeHtml(formatDateTime(order.created_at))}</div>
        <div><b>Email:</b> ${escapeHtml(order.customer_email || "")}</div>
      </div>

      <h3 style="margin: 12px 0 8px;">Позиции</h3>
      ${itemsHtml}
      <!-- Оплату (mock) не показываем -->
    `;

    modal.style.display = "block";
  }

  function closeOrderModal() {
    const modal = document.getElementById("order-modal");
    if (modal) modal.style.display = "none";
  }

  // ---------------- Avatar Modal ----------------
  function openAvatarModal() {
    const modal = document.getElementById("avatar-modal");
    const preview = document.getElementById("avatar-preview");
    const fileInput = document.getElementById("avatar-file");

    if (!modal) return;

    if (preview) preview.src = getCurrentAvatarSrc();
    if (fileInput) fileInput.value = "";

    modal.style.display = "block";
  }

  function closeAvatarModal() {
    const modal = document.getElementById("avatar-modal");
    if (!modal) return;
    modal.style.display = "none";
  }

  // ---------------- INIT ----------------
  document.addEventListener("DOMContentLoaded", async () => {
    // cart badge
    if (window.DataStorage && typeof window.DataStorage.updateCartBadge === "function") {
      window.DataStorage.updateCartBadge();
    }

    // mobile menu
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

    // close order modal
    const orderModal = document.getElementById("order-modal");
    const orderModalClose = document.getElementById("order-modal-close");
    if (orderModalClose) orderModalClose.addEventListener("click", closeOrderModal);
    if (orderModal) {
      orderModal.addEventListener("click", (e) => {
        if (e.target === orderModal) closeOrderModal();
      });
    }

    // avatar modal bindings
    const avatarClick = document.getElementById("avatar-click");
    const avatarModal = document.getElementById("avatar-modal");
    const avatarModalClose = document.getElementById("avatar-modal-close");
    const avatarFile = document.getElementById("avatar-file");
    const avatarUploadBtn = document.getElementById("avatar-upload-btn");
    const avatarPreview = document.getElementById("avatar-preview");

    let selectedFile = null;

    if (avatarClick) avatarClick.addEventListener("click", openAvatarModal);
    if (avatarModalClose) avatarModalClose.addEventListener("click", closeAvatarModal);
    if (avatarModal) {
      avatarModal.addEventListener("click", (e) => {
        if (e.target === avatarModal) closeAvatarModal();
      });
    }

    // общий ESC: закрываем обе модалки
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      closeOrderModal();
      closeAvatarModal();
    });

    if (avatarFile) {
      avatarFile.addEventListener("change", () => {
        const f = avatarFile.files && avatarFile.files[0] ? avatarFile.files[0] : null;
        selectedFile = f;

        if (f && avatarPreview) {
          avatarPreview.src = URL.createObjectURL(f);
        }
      });
    }

    if (avatarUploadBtn) {
      avatarUploadBtn.addEventListener("click", async () => {
        if (!selectedFile) {
          showToast("Выберите файл", "info");
          return;
        }

        try {
          const resp = await apiUploadAvatar(selectedFile);
          const newUrl = resp.avatar_url || resp.user?.avatar_url || "";
          setAvatarSrc(newUrl);
          showToast("Аватар обновлён", "success");
          selectedFile = null;
          if (avatarFile) avatarFile.value = "";
          closeAvatarModal();
        } catch (e) {
          console.error(e);
          showToast(e.message || "Не удалось загрузить аватар", "error");
        }
      });
    }

    // load me
    let userLoaded = false;
    try {
      const me = await apiMe();
      if (!me.authenticated) {
        window.location.href = "/login";
        return;
      }

      const u = me.user || {};
      userLoaded = true;

      setText("profile-name", fullName(u));
      setText("profile-email", u.email || "");

      setValue("first-name", u.first_name || "");
      setValue("last-name", u.last_name || "");
      setValue("middle-name", u.middle_name || "");
      setValue("email", u.email || "");
      setValue("phone", u.phone || "");
      setValue("birthdate", u.birthdate || "");

      setAvatarSrc(u.avatar_url || "");
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

    // save profile
    const form = document.getElementById("profileForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

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
          setText("profile-email", u.email || getValue("email"));

          if (u.avatar_url !== undefined) setAvatarSrc(u.avatar_url || "");

          showToast("Изменения сохранены", "success");
        } catch (err) {
          console.error(err);
          showToast(`Ошибка сохранения: ${err.message}`, "error");
        }
      });
    }

    // deep link: /profile#orders
    if (location.hash) {
      const sec = location.hash.replace("#", "");
      if (sec) showSection(sec);
    }

    // load products index (for pretty order details) + orders
    if (userLoaded) {
      try {
        const products = await apiProductsIndex();
        productsById = new Map(products.map((p) => [Number(p.id), p]));
      } catch (e) {
        console.warn("Не удалось загрузить каталог для деталей заказа:", e);
        productsById = new Map();
      }

      setOrdersLoading(true);
      try {
        const orders = await apiOrders();
        renderOrders(orders);
      } catch (e) {
        console.error(e);
        const box = document.getElementById("orders-list");
        if (box) box.innerHTML = `<p style="color:#dc3545;">Не удалось загрузить заказы</p>`;
      } finally {
        setOrdersLoading(false);
      }
    }
  });
})();