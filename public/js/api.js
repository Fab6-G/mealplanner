// api.js
// API integration layer for Couples Meal Planner backing with Cloudflare D1 + Worker

const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8787"
  : ""; // Production: same domain proxy route /api/*

const API = {
  async request(path, options = {}) {
    options.credentials = "include"; // Ensure HTTP-only cookies are sent/saved
    options.headers = options.headers || {};
    if (!(options.body instanceof FormData) && typeof options.body === "object") {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, options);
      if (response.status === 401 && !path.startsWith("/api/auth/")) {
        // Session expired or unauthorized - prompt login overlay
        API.showLoginOverlay();
        throw new Error("Unauthorized. Please log in.");
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "API request failed");
      }
      return data;
    } catch (err) {
      console.error(`API Error [${path}]:`, err);
      throw err;
    }
  },

  // Auth Methods
  async checkSession() {
    return this.request("/api/auth/session");
  },

  async login(username, password) {
    const data = await this.request("/api/auth/login", {
      method: "POST",
      body: { username, password }
    });
    if (data.success) {
      API.hideLoginOverlay();
      // Reload page to re-initialize data from server
      window.location.reload();
    }
    return data;
  },

  async register(username, password) {
    return this.request("/api/auth/register", {
      method: "POST",
      body: { username, password }
    });
  },

  async logout() {
    const data = await this.request("/api/auth/logout", { method: "POST" });
    window.location.reload();
    return data;
  },

  // Recipes CRUD
  async getRecipes() {
    return this.request("/api/recipes");
  },

  async saveRecipe(recipe) {
    return this.request("/api/recipes", {
      method: "POST",
      body: recipe
    });
  },

  // Weekly Plan CRUD
  async getWeeklyPlan(weekLabel) {
    return this.request(`/api/weekly-plan?week_label=${encodeURIComponent(weekLabel)}`);
  },

  async saveWeeklyPlan(weekLabel, days) {
    return this.request("/api/weekly-plan", {
      method: "POST",
      body: { week_label: weekLabel, days }
    });
  },

  // Pantry / Inventory CRUD
  async getInventory() {
    return this.request("/api/inventory");
  },

  async saveInventoryItem(item) {
    return this.request("/api/inventory", {
      method: "POST",
      body: item
    });
  },

  async deleteInventoryItem(id) {
    return this.request(`/api/inventory/${id}`, {
      method: "DELETE"
    });
  },

  // Staples CRUD
  async getStaples() {
    return this.request("/api/staples");
  },

  async saveStapleItem(staple) {
    return this.request("/api/staples", {
      method: "POST",
      body: staple
    });
  },

  async deleteStapleItem(id) {
    return this.request(`/api/staples/${id}`, {
      method: "DELETE"
    });
  },

  // Shopping Checked States
  async getShoppingChecks(weekLabel) {
    return this.request(`/api/shopping/checks?week_label=${encodeURIComponent(weekLabel)}`);
  },

  async saveShoppingCheck(weekLabel, itemKey, isChecked) {
    return this.request("/api/shopping/checks", {
      method: "POST",
      body: { week_label: weekLabel, item_key: itemKey, is_checked: isChecked }
    });
  },

  // Dynamically inject a beautiful glassmorphic login overlay
  showLoginOverlay() {
    if (document.getElementById("authOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "authOverlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(18, 18, 24, 0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 100000;
      font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
    `;

    const card = document.createElement("div");
    card.style.cssText = `
      width: 100%;
      max-width: 400px;
      padding: 40px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
      color: #fff;
      text-align: center;
    `;

    card.innerHTML = `
      <div style="font-size: 40px; margin-bottom: 10px;">🥗</div>
      <h2 id="authTitle" style="margin: 0 0 10px 0; font-size: 24px; font-weight: 700; background: linear-gradient(135deg, #10b981, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Couples Meal Planner</h2>
      <p id="authSubtitle" style="margin: 0 0 30px 0; font-size: 14px; color: rgba(255, 255, 255, 0.6);">Sign in to sync your recipes and grocery list</p>
      
      <div id="authError" style="display: none; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 10px; border-radius: 8px; margin-bottom: 20px; font-size: 13px;"></div>

      <form id="authForm" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="text-align: left;">
          <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.5); margin-bottom: 6px;">Username</label>
          <input type="text" id="authUsername" required placeholder="e.g. goldie" style="width: 100%; padding: 12px 16px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #fff; font-size: 15px; outline: none; transition: border 0.2s;" />
        </div>

        <div style="text-align: left; margin-bottom: 10px;">
          <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.5); margin-bottom: 6px;">Password</label>
          <input type="password" id="authPassword" required placeholder="••••••••" style="width: 100%; padding: 12px 16px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #fff; font-size: 15px; outline: none; transition: border 0.2s;" />
        </div>

        <button type="submit" id="authSubmitBtn" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 8px; color: #fff; font-weight: 600; font-size: 16px; cursor: pointer; transition: transform 0.1s, opacity 0.2s;">Sign In</button>
      </form>

      <div style="margin-top: 24px; font-size: 13px; color: rgba(255, 255, 255, 0.6);">
        <span id="authToggleText">Don't have an account?</span>
        <a href="#" id="authToggleBtn" style="color: #3b82f6; text-decoration: none; font-weight: 600; margin-left: 4px;">Sign Up</a>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Dynamic style hover events for input
    const inputs = overlay.querySelectorAll("input");
    inputs.forEach(input => {
      input.addEventListener("focus", () => input.style.borderColor = "#10b981");
      input.addEventListener("blur", () => input.style.borderColor = "rgba(255, 255, 255, 0.1)");
    });

    let isLogin = true;

    const toggleBtn = card.querySelector("#authToggleBtn");
    const toggleText = card.querySelector("#authToggleText");
    const submitBtn = card.querySelector("#authSubmitBtn");
    const title = card.querySelector("#authTitle");
    const subtitle = card.querySelector("#authSubtitle");
    const errorEl = card.querySelector("#authError");

    toggleBtn.onclick = (e) => {
      e.preventDefault();
      isLogin = !isLogin;
      errorEl.style.display = "none";
      if (isLogin) {
        title.textContent = "Couples Meal Planner";
        subtitle.textContent = "Sign in to sync your recipes and grocery list";
        submitBtn.textContent = "Sign In";
        toggleText.textContent = "Don't have an account?";
        toggleBtn.textContent = "Sign Up";
      } else {
        title.textContent = "Create Shared Account";
        subtitle.textContent = "Set up a shared account for your household";
        submitBtn.textContent = "Register Household";
        toggleText.textContent = "Already have a household?";
        toggleBtn.textContent = "Sign In";
      }
    };

    const form = card.querySelector("#authForm");
    form.onsubmit = async (e) => {
      e.preventDefault();
      errorEl.style.display = "none";
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";

      const username = card.querySelector("#authUsername").value.trim();
      const password = card.querySelector("#authPassword").value;

      try {
        if (isLogin) {
          await API.login(username, password);
        } else {
          await API.register(username, password);
          // Auto login after registration
          await API.login(username, password);
        }
      } catch (err) {
        errorEl.textContent = err.message || "Authentication failed.";
        errorEl.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
      }
    };
  },

  hideLoginOverlay() {
    const overlay = document.getElementById("authOverlay");
    if (overlay) overlay.remove();
  }
};
