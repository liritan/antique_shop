

function setMessage(text, type = "success") {
    const box = document.getElementById("auth-message");
    if (!box) return;
  
    box.className = "auth-message " + (type === "error" ? "error" : "success");
    box.textContent = text;
    box.style.display = "block";
  }
  
  function clearMessage() {
    const box = document.getElementById("auth-message");
    if (!box) return;
    box.style.display = "none";
    box.textContent = "";
    box.className = "auth-message";
  }
  
  function switchTab(mode) {
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const panelLogin = document.getElementById("panel-login");
    const panelRegister = document.getElementById("panel-register");
  
    const isLogin = mode === "login";
  
    tabLogin.classList.toggle("active", isLogin);
    tabRegister.classList.toggle("active", !isLogin);
  
    tabLogin.setAttribute("aria-selected", isLogin ? "true" : "false");
    tabRegister.setAttribute("aria-selected", !isLogin ? "true" : "false");
  
    panelLogin.classList.toggle("active", isLogin);
    panelRegister.classList.toggle("active", !isLogin);
  
    clearMessage();
  }
  
  async function apiPost(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
  
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Ошибка: ${res.status}`);
    }
    return data;
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof updateCartCount === "function") updateCartCount();
  
    // tabs
    document.getElementById("tab-login")?.addEventListener("click", () => switchTab("login"));
    document.getElementById("tab-register")?.addEventListener("click", () => switchTab("register"));
  
    // small links under forms
    document.querySelectorAll("[data-switch]").forEach(btn => {
      btn.addEventListener("click", () => switchTab(btn.dataset.switch));
    });
  
    // LOGIN
    document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMessage();
  
      const email = (document.getElementById("loginEmail")?.value || "").trim().toLowerCase();
      const password = document.getElementById("loginPassword")?.value || "";
  
      try {
        await apiPost("/api/auth/login", { email, password });
        setMessage("Вы вошли", "success");
        setTimeout(() => (window.location.href = "/profile"), 400);
      } catch (err) {
        setMessage(err.message || "Ошибка входа", "error");
      }
    });
  
    // REGISTER
    document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMessage();
  
      const first_name = (document.getElementById("regFirstName")?.value || "").trim();
      const last_name = (document.getElementById("regLastName")?.value || "").trim();
      const email = (document.getElementById("regEmail")?.value || "").trim().toLowerCase();
      const password = document.getElementById("regPassword")?.value || "";
  
      try {
        await apiPost("/api/auth/register", { first_name, last_name, email, password });
        setMessage("Аккаунт создан ✅", "success");
        setTimeout(() => (window.location.href = "/profile"), 450);
      } catch (err) {
        setMessage(err.message || "Ошибка регистрации", "error");
      }
    });
  
    // optional: start on login
    switchTab("login");
  });