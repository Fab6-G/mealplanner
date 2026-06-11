// ==========================================
// 0. APP STYLING & CUSTOMIZATION SETUP
// ==========================================
const ACCENT_PALETTES = {
    ocean: { primary: "#2186AC", light: "#E8F4F8" },
    emerald: { primary: "#27AE60", light: "#E8F8F0" },
    sunset: { primary: "#E67E22", light: "#FDEDEC" },
    purple: { primary: "#8E44AD", light: "#F5EEF8" },
    crimson: { primary: "#C0392B", light: "#FDEDEC" },
    sunflower: { primary: "#F1C40F", light: "#FEF9E7" }
};

window.applyTheme = function() {
    const theme = localStorage.getItem("theme") || "System";
    let isDark = false;
    if (theme === "Dark") {
        isDark = true;
    } else if (theme === "System") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    
    if (isDark) {
        document.documentElement.classList.add("dark-mode");
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.classList.remove("dark-mode");
        document.documentElement.setAttribute("data-theme", "light");
    }
};

window.applyAccentColor = function() {
    const accentKey = localStorage.getItem("accentColor") || "ocean";
    const palette = ACCENT_PALETTES[accentKey] || ACCENT_PALETTES.ocean;
    document.documentElement.style.setProperty("--color-primary", palette.primary);
    document.documentElement.style.setProperty("--color-primary-light", palette.light);
};

window.applyDensity = function() {
    const density = localStorage.getItem("density") || "comfortable";
    document.documentElement.setAttribute("data-density", density);
};

// Run customizations immediately before DOM renders to prevent flicker
applyTheme();
applyAccentColor();
applyDensity();

document.addEventListener("DOMContentLoaded", function () {
    // Debug overlay
    const debugArea = document.createElement("div");
    debugArea.id = "debugArea";
    debugArea.style.cssText =
        "position: fixed; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 10px; max-height: 30vh; overflow-y: auto; z-index: 9999; font-size: 12px;";
    document.body.appendChild(debugArea);

    window.debug = function (message) {
        const el = document.getElementById("debugArea");
        el.innerHTML = message + "<br>" + el.innerHTML;
    };

    // Tab switching with hash updates
    window.switchTab = function (tabId) {
        const tabButtons = document.querySelectorAll(".tab-btn");
        const tabContents = document.querySelectorAll(".tab-content");

        tabButtons.forEach(btn => btn.classList.remove("active"));
        tabContents.forEach(content => {
            content.style.display = "none";
            content.classList.remove("active");
        });

        const selectedButton = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const selectedContent = document.getElementById(tabId);

        if (selectedButton) selectedButton.classList.add("active");
        if (selectedContent) {
            selectedContent.style.display = "block";
            selectedContent.classList.add("active");
        }

        if (window.location.hash !== `#${tabId}`) {
            window.location.hash = tabId;
        }

        // Auto trigger initSettingsPage when settings tab loads
        if (tabId === "settings" && typeof initSettingsPage === "function") {
            initSettingsPage();
        }
    };

    const handleHash = () => {
        const hash = window.location.hash.slice(1);
        const validTabs = ["dashboard", "meals", "staples", "shopping", "inventory", "recipes", "settings"];
        if (validTabs.includes(hash)) {
            switchTab(hash);
        } else {
            switchTab("dashboard");
        }
    };

    window.addEventListener("hashchange", handleHash);

    document.querySelectorAll(".tab-btn").forEach(button => {
        button.addEventListener("click", function (e) {
            e.preventDefault();
            const tabId = this.getAttribute("data-tab");
            switchTab(tabId);
        });
        button.addEventListener("touchstart", function (e) {
            e.preventDefault();
            const tabId = this.getAttribute("data-tab");
            switchTab(tabId);
        });
    });

    // Make old settingsBtn in header redirect to Settings tab
    const headerSettingsBtn = document.getElementById("settingsBtn");
    if (headerSettingsBtn) {
        headerSettingsBtn.removeAttribute("onclick");
        headerSettingsBtn.addEventListener("click", (e) => {
            e.preventDefault();
            switchTab("settings");
        });
    }

    // Set active link highlight on Settings sidebar anchor links
    const sidebarLinks = document.querySelectorAll(".settings-sidebar-link");
    sidebarLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();
            const targetId = this.getAttribute("href");
            const targetSec = document.querySelector(targetId);
            if (targetSec) {
                targetSec.scrollIntoView({ behavior: "smooth" });
                sidebarLinks.forEach(l => l.classList.remove("active"));
                this.classList.add("active");
            }
        });
    });

    // Check initial hash route
    handleHash();
});

// =========================
// 1. WEEKLY PLAN (LOCAL STORAGE)
// =========================

// =========================
// 1. WEEKLY PLAN (API PERSISTENCE)
// =========================

const defaultWeeklyPlan = {
    weekLabel: "This week",
    days: [
        { day: "Monday", recipeId: null },
        { day: "Tuesday", recipeId: null },
        { day: "Wednesday", recipeId: null },
        { day: "Thursday", recipeId: null },
        { day: "Friday", recipeId: null },
        { day: "Saturday", recipeId: null },
        { day: "Sunday", recipeId: null }
    ]
};

const State = {
    weeklyPlan: structuredClone(defaultWeeklyPlan),
    inventory: [],
    staples: [],
    shoppingChecks: {},
    household: null,
    favourites: [],

    renderAll() {
        renderProfiles();
        populateMealPlans();
        populateRecipesTab();
        renderInventory();
        renderStaples();
        renderStarterPacks();
        recomputeShoppingData();
        renderDashboardOverview();
        restoreShoppingCheckboxes();
    }
};

let cachedWeeklyPlan = null;
let favouritesOnlyFilter = false;

function loadWeeklyPlan() {
    return State.weeklyPlan;
}

function saveWeeklyPlan(plan) {
    State.weeklyPlan = plan;
    API.saveWeeklyPlan(plan.weekLabel, plan.days).catch(console.error);
}

// Initial local plan copy reference
let weeklyPlan = State.weeklyPlan;

// Helper to format scaled ingredient quantities beautifully using unicode fractions and units conversion
function formatQuantity(quantity, unit) {
    if (quantity <= 0) return "";
    
    let q = quantity;
    let u = unit || "";
    
    // Convert 1000g to 1kg
    if (u === "g" && q >= 1000) {
        q = q / 1000;
        u = "kg";
    }
    // Convert 1000ml to 1l
    if (u === "ml" && q >= 1000) {
        q = q / 1000;
        u = "l";
    }
    
    const formatFraction = (val) => {
        const tolerance = 0.05;
        const dec = val % 1;
        const integer = Math.floor(val);
        
        let fractionStr = "";
        if (Math.abs(dec - 0.25) < tolerance) {
            fractionStr = "¼";
        } else if (Math.abs(dec - 0.5) < tolerance) {
            fractionStr = "½";
        } else if (Math.abs(dec - 0.75) < tolerance) {
            fractionStr = "¾";
        } else if (Math.abs(dec - 0.33) < tolerance) {
            fractionStr = "⅓";
        } else if (Math.abs(dec - 0.67) < tolerance) {
            fractionStr = "⅔";
        }
        
        if (fractionStr) {
            return integer > 0 ? `${integer} ${fractionStr}` : fractionStr;
        }
        
        return val % 1 === 0 ? val.toString() : val.toFixed(1).replace(/\.0$/, "");
    };
    
    const formattedVal = formatFraction(q);
    return `${formattedVal} ${u}`.trim();
}

// Helper to setup collapsible ingredients list and locks warnings on recipe cards
function setupRecipeCardIngredientsAndWarnings(card, recipe, portionsContainer, viewRecipeBtn) {
    if (!card || !recipe || !portionsContainer || !viewRecipeBtn) return;
    
    const servingInfo = getRecipeServingInfo(recipe);
    
    // Remove old badge
    let badgeEl = card.querySelector(".clamp-warning-badge");
    if (badgeEl) badgeEl.remove();
    
    if (servingInfo.clamped) {
        const badge = document.createElement("div");
        badge.className = "clamp-warning-badge";
        badge.innerHTML = `⚠️ Scaled to ${servingInfo.servings} servings (${servingInfo.clampType})`;
        portionsContainer.parentNode.insertBefore(badge, portionsContainer.nextSibling);
    }
    
    // Collapsible list
    let collapsibleBtn = card.querySelector(".toggle-card-ingredients");
    if (collapsibleBtn) collapsibleBtn.remove();
    let collapsibleList = card.querySelector(".card-ingredients-list");
    if (collapsibleList) collapsibleList.remove();
    
    collapsibleBtn = document.createElement("button");
    collapsibleBtn.className = "btn-secondary toggle-card-ingredients";
    collapsibleBtn.innerHTML = `<span>🧑‍🍳 Ingredients (${(recipe.ingredients || []).length})</span><span class="toggle-icon">▼</span>`;
    
    collapsibleList = document.createElement("div");
    collapsibleList.className = "card-ingredients-list";
    collapsibleList.style.display = "none";
    
    collapsibleBtn.onclick = (e) => {
        e.stopPropagation();
        const isHidden = collapsibleList.style.display === "none";
        collapsibleList.style.display = isHidden ? "block" : "none";
        collapsibleBtn.querySelector(".toggle-icon").textContent = isHidden ? "▲" : "▼";
    };
    
    let ingHtml = '<ul style="margin: 0; padding-left: 15px; line-height: 1.6;">';
    const list = Array.isArray(recipe.ingredients) 
        ? recipe.ingredients 
        : Object.entries(recipe.ingredients).flatMap(([category, items]) => 
            (Array.isArray(items) ? items.map(item => ({ ...item, category, quantity_per_serving: (item.quantity || 0) / (recipe.servings || 2) })) : [])
          );
          
    list.forEach(ing => {
        const qtyPerServing = ing.quantity_per_serving !== undefined 
            ? ing.quantity_per_serving 
            : (ing.quantity || 0) / (recipe.servings || 2);
        const scaledQty = qtyPerServing * servingInfo.servings;
        const formattedQty = formatQuantity(scaledQty, ing.unit);
        const notesText = ing.notes ? ` <em>(${ing.notes})</em>` : "";
        ingHtml += `<li>${formattedQty} ${ing.name}${notesText}</li>`;
    });
    ingHtml += '</ul>';
    collapsibleList.innerHTML = ingHtml;
    
    viewRecipeBtn.parentNode.insertBefore(collapsibleBtn, viewRecipeBtn);
    viewRecipeBtn.parentNode.insertBefore(collapsibleList, viewRecipeBtn.nextSibling);
}

// =========================
// 2. PROFILE RENDERING
// =========================

function formatActivity(level) {
    switch (level) {
        case "very_active": return "Very Active";
        case "moderately_active": return "Moderately Active";
        default: return "Active";
    }
}

function formatGoal(profile) {
    if (profile.goal === "muscle_gain") return "↗ 500 cal surplus";
    if (profile.goal === "fat_loss") return "↘ 500 cal deficit";
    return "";
}

function renderProfiles() {
    const profileGrid = document.getElementById("profileGrid");
    if (!profileGrid) return;

    profileGrid.innerHTML = "";

    const members = State.household ? State.household.members : [];
    
    if (members.length === 0) {
        profileGrid.innerHTML = `<div class="card" style="grid-column: span 2; text-align: center; color: var(--color-text-light); padding: 30px;">No household profiles found. Complete onboarding or add household members.</div>`;
        return;
    }

    members.forEach(member => {
        const { calories, protein_g, carbs_g, fat_g } = member.macro_goals || { calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65 };
        
        const proteinPct = calories > 0 ? Math.round((protein_g * 4) / calories * 100) : 0;
        const carbsPct = calories > 0 ? Math.round((carbs_g * 4) / calories * 100) : 0;
        const fatPct = calories > 0 ? Math.round((fat_g * 9) / calories * 100) : 0;

        const sexDisplay = member.sex.charAt(0).toUpperCase() + member.sex.slice(1);
        const allergiesText = member.allergies && member.allergies.length > 0 
            ? `Allergies: ${member.allergies.join(", ")}` 
            : "No allergies";

        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">${member.sex === "male" ? "💪" : member.sex === "female" ? "🏃‍♀️" : "🌟"}</div>
                <div class="profile-info">
                    <h4>${member.name}</h4>
                    <p>${member.age}${sexDisplay.charAt(0)} • ${member.height_cm}cm • ${member.weight_kg}kg</p>
                    <p style="color: var(--color-text-light); font-size: 11px; margin-top: 4px;">${allergiesText}</p>
                </div>
            </div>

            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${calories.toLocaleString()}</div>
                    <div class="stat-label">Calories</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${Math.round(protein_g)}g</div>
                    <div class="stat-label">Protein</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${Math.round(carbs_g)}g</div>
                    <div class="stat-label">Carbs</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${Math.round(fat_g)}g</div>
                    <div class="stat-label">Fats</div>
                </div>
            </div>

            <h3 style="margin-top: 20px;">Daily Macro Target</h3>

            <div class="macro-bar">
                <div class="macro-label">
                    <span>Protein: ${Math.round(protein_g)}g (${proteinPct}%)</span>
                    <span>Protein</span>
                </div>
                <div class="macro-progress">
                    <div class="macro-fill protein-fill" style="width: ${proteinPct}%;">${proteinPct}%</div>
                </div>
            </div>

            <div class="macro-bar">
                <div class="macro-label">
                    <span>Carbs: ${Math.round(carbs_g)}g (${carbsPct}%)</span>
                    <span>Carbs</span>
                </div>
                <div class="macro-progress">
                    <div class="macro-fill carb-fill" style="width: ${carbsPct}%;">${carbsPct}%</div>
                </div>
            </div>

            <div class="macro-bar">
                <div class="macro-label">
                    <span>Fats: ${Math.round(fat_g)}g (${fatPct}%)</span>
                    <span>Fats</span>
                </div>
                <div class="macro-progress">
                    <div class="macro-fill fat-fill" style="width: ${fatPct}%;">${fatPct}%</div>
                </div>
            </div>
        `;
        profileGrid.appendChild(card);
    });
}

// =========================
// 3. WEEKLY RECIPES + SHOPPING DATA
// =========================

function getRecipeById(id) {
    return recipeBank.find(r => r.id === id);
}

function getWeeklyRecipes() {
    const plan = State.weeklyPlan;
    if (!plan || !Array.isArray(plan.days)) return [];
    const used = new Set();
    const list = [];
    plan.days.forEach(entry => {
        if (!entry.recipeId) return;
        const rec = getRecipeById(entry.recipeId);
        if (rec && !used.has(rec.id)) {
            used.add(rec.id);
            list.push(rec);
        }
    });
    return list;
}

// Keep the global recipes variable as a fallback getter or initial copy
let recipes = getWeeklyRecipes();

// Shopping list backing data
let allIngredients = [];
let combinedIngredients = [];

// Recompute ingredients & combinedIngredients from current weekly recipes
function recomputeShoppingData() {
    const currentRecipes = getWeeklyRecipes();
    allIngredients = getAllIngredientsNormalised(currentRecipes); // from data.js
    combinedIngredients = buildCombinedIngredients(allIngredients); // from data.js
    buildShoppingListFromPlan();
}

// =========================
// 4. INVENTORY (LOCAL STORAGE + UI)
// =========================

// =========================
// 4. INVENTORY (API PERSISTENCE)
// =========================

let cachedInventory = [];

function loadInventory() {
    return State.inventory;
}

function saveInventory(items) {
    State.inventory = items;
    State.renderAll();
}

async function syncInventory() {
    try {
        State.inventory = await API.getInventory();
        State.renderAll();
    } catch (err) {
        console.error("Failed to sync inventory:", err);
    }
}

function getStatusFromAge(daysAgo) {
    if (daysAgo <= 3) return { text: "Fresh ✓", color: "var(--color-success)" };
    if (daysAgo <= 14) return { text: "Reorder soon", color: "var(--color-warning)" };
    return { text: "Low stock", color: "var(--color-danger)" };
}

function renderInventory() {
    const container = document.getElementById("inventoryGrid");
    if (!container) return;

    const items = loadInventory();
    container.innerHTML = "";

    const categories = {
        produce: [],
        protein: [],
        dairy: [],
        carbs: [],
        pantry: [],
        other: []
    };

    items.forEach(item => {
        const key = categories.hasOwnProperty(item.category) ? item.category : "other";
        categories[key].push(item);
    });

    Object.values(categories).forEach(list =>
        list.sort((a, b) => a.name.localeCompare(b.name))
    );

    function renderInventoryCategory(emoji, title, list) {
        if (!list.length) return;

        const group = document.createElement("div");
        group.className = "category-group";

        const titleDiv = document.createElement("div");
        titleDiv.className = "category-title";
        titleDiv.textContent = `${emoji} ${title}`;
        group.appendChild(titleDiv);

        const listDiv = document.createElement("div");
        listDiv.className = "item-list";

        list.forEach(item => {
            const daysAgo = Math.floor(
                (Date.now() - new Date(item.dateAdded).getTime()) / (1000 * 60 * 60 * 24)
            );
            const { text: statusText, color: statusColor } = getStatusFromAge(daysAgo);

            const label = document.createElement("label");
            label.className = "shop-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";

            const nameSpan = document.createElement("span");
            nameSpan.style.flex = "2";
            nameSpan.textContent = item.name;

            const qtySpan = document.createElement("span");
            qtySpan.style.flex = "1";
            qtySpan.style.textAlign = "right";
            qtySpan.textContent = `${item.quantity} ${item.unit}`.trim();

            const metaSpan = document.createElement("span");
            metaSpan.style.flex = "2";
            metaSpan.style.fontSize = "11px";
            metaSpan.style.color = statusColor;
            metaSpan.textContent =
                `Added ${daysAgo === 0 ? "today" : daysAgo + " day(s) ago"} • ${statusText}`;

            label.appendChild(checkbox);
            label.appendChild(nameSpan);
            label.appendChild(qtySpan);
            label.appendChild(metaSpan);

            checkbox.addEventListener("change", async () => {
                if (!checkbox.checked) return;
                const ok = confirm(`Remove "${item.name}" from inventory?`);
                if (!ok) {
                    checkbox.checked = false;
                    return;
                }
                await API.deleteInventoryItem(item.id);
                await syncInventory();
                renderInventory();
            });

            listDiv.appendChild(label);
        });

        group.appendChild(listDiv);
        container.appendChild(group);
    }

    renderInventoryCategory("🥬", "Fresh Produce", categories.produce);
    renderInventoryCategory("🍗", "Proteins", categories.protein);
    renderInventoryCategory("🥛", "Dairy & Alternatives", categories.dairy);
    renderInventoryCategory("🌾", "Grains & Carbs", categories.carbs);
    renderInventoryCategory("🏪", "Pantry Staples", categories.pantry);
    renderInventoryCategory("📦", "Other Items", categories.other);
}

async function addInventoryItem() {
    const name = document.getElementById("itemInput").value.trim();
    const quantity = parseFloat(document.getElementById("quantityInput").value) || 1;
    const rawUnit = document.getElementById("unitSelect").value;
    const unit = normaliseUnit(rawUnit);
    const category = document.getElementById("categorySelect").value || "other";

    if (!name) {
        alert("Please enter an item name");
        return;
    }

    await syncInventory();
    const items = loadInventory();
    const existing = items.find(
        i =>
            i.name.toLowerCase() === name.toLowerCase() &&
            i.unit === unit &&
            i.category === category
    );

    let itemToSave;
    if (existing) {
        existing.quantity += quantity;
        itemToSave = existing;
    } else {
        itemToSave = {
            id: `inv-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name,
            quantity,
            unit,
            category,
            dateAdded: new Date().toISOString()
        };
    }

    await API.saveInventoryItem(itemToSave);
    await syncInventory();
    renderInventory();

    document.getElementById("itemInput").value = "";
    document.getElementById("quantityInput").value = "1";
    document.getElementById("unitSelect").value = "kg";
    document.getElementById("categorySelect").value = "pantry";
}

function exportInventory() {
    const items = loadInventory();
    const json = JSON.stringify(items, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `inventory-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importInventory() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (!Array.isArray(data)) {
                    alert("Invalid inventory file: expected an array.");
                    return;
                }

                const normalised = data.map(item => ({
                    id: item.id || `inv-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    name: String(item.name || "").trim(),
                    quantity: Number(item.quantity) || 0,
                    unit: String(item.unit || "").trim() || "unit",
                    category: item.category || "other",
                    dateAdded: item.dateAdded || new Date().toISOString()
                }));

                saveInventory(normalised);
                renderInventory();
                alert("Inventory imported successfully.");
            } catch (e) {
                console.error(e);
                alert("Failed to import inventory. Make sure it's a valid JSON export.");
            }
        };

        reader.readAsText(file);
    });

    input.click();
}

async function clearInventory() {
    const confirmed = confirm("This will delete ALL inventory items. Are you sure?");
    if (!confirmed) return;
    const items = loadInventory();
    await Promise.all(items.map(item => API.deleteInventoryItem(item.id)));
    await syncInventory();
    renderInventory();
}

// =========================
// 5. SHOPPING LIST (UI + ACTIONS)
// =========================

function copyToClipboard() {
    const items = Array.from(document.querySelectorAll(".shop-item"))
        .filter(item => {
            const checkbox = item.querySelector("input[type='checkbox']");
            return !checkbox || !checkbox.checked;
        })
        .map(item => {
            const spans = item.querySelectorAll("span");
            const name = spans[0]?.textContent.trim() || "";
            const qty = spans[1]?.textContent.trim() || "";
            return qty ? `${name} – ${qty}` : name;
        })
        .filter(line => line.length > 0)
        .join("\n");

    if (!items) {
        alert("No items found to copy.");
        return;
    }

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
            .writeText(items)
            .then(() => alert("Shopping list copied to clipboard!"))
            .catch(err => {
                console.error("Clipboard error:", err);
                fallbackCopy(items);
            });
    } else {
        fallbackCopy(items);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
        const ok = document.execCommand("copy");
        alert(ok ? "Shopping list copied to clipboard!" : "Press Ctrl+C to copy the list.");
    } catch {
        alert("Press Ctrl+C to copy the list.");
    }
    document.body.removeChild(textarea);
}

function printList() {
    window.print();
}

function resetCheckboxes() {
    document.querySelectorAll(".shop-item").forEach(item => {
        const checkbox = item.querySelector("input[type='checkbox']");
        if (checkbox) checkbox.checked = false;
        item.classList.remove("checked");
    });
}

document.addEventListener("change", async function (e) {
    if (e.target.type === "checkbox") {
        const item = e.target.closest(".shop-item");
        if (item) {
            item.classList.toggle("checked");
            const itemKey = e.target.getAttribute("data-item-key");
            if (itemKey) {
                const isChecked = e.target.checked;
                State.shoppingChecks[itemKey] = isChecked;
                await API.saveShoppingCheck(State.weeklyPlan.weekLabel, itemKey, isChecked).catch(console.error);
            }
        }
    }
});

function buildShoppingListFromPlan() {
    const categories = {
        produce: [],
        protein: [],
        dairy: [],
        carbs: [],
        pantry: [],
        other: [],
        staples: []
    };

    const staplesList = State.staples || [];
    const stapleNames = new Set(staplesList.map(s => s.name.toLowerCase().trim()));
    const showStaples = State.preferences ? State.preferences.show_staples_in_list : true;

    // Map to combine/aggregate staples to avoid duplication
    const staplesMap = new Map();

    // First, process recipe-derived ingredients
    combinedIngredients.forEach(ing => {
        const isStaple = stapleNames.has(ing.name.toLowerCase().trim());
        if (isStaple) {
            if (!showStaples) {
                // Completely skip recipe ingredients that match staples if toggle is off
                return;
            }
            const nameLower = ing.name.toLowerCase().trim();
            if (!staplesMap.has(nameLower)) {
                staplesMap.set(nameLower, {
                    label: ing.name,
                    quantity: ing.quantity,
                    unit: ing.unit,
                    category: ing.category,
                    isStaple: true,
                    fromRecipe: true
                });
            } else {
                staplesMap.get(nameLower).quantity += ing.quantity;
            }
        } else {
            const category = ing.category || "other";
            const targetCategory = categories[category] ? category : "other";
            const qty = ing.quantity ?? 1;
            
            categories[targetCategory].push({
                label: ing.name,
                quantityText: formatQuantity(qty, ing.unit),
                category: ing.category,
                unit: ing.unit,
                isStaple: false
            });
        }
    });

    // Second, process weekly staples themselves
    if (showStaples) {
        staplesList.forEach(staple => {
            const nameLower = staple.name.toLowerCase().trim();
            if (!staplesMap.has(nameLower)) {
                staplesMap.set(nameLower, {
                    label: staple.name,
                    quantity: staple.quantity,
                    unit: staple.unit,
                    category: staple.category,
                    isStaple: true,
                    fromStaple: true
                });
            } else {
                const existing = staplesMap.get(nameLower);
                if (existing.unit.toLowerCase() === staple.unit.toLowerCase()) {
                    existing.quantity += staple.quantity;
                }
                existing.fromStaple = true;
            }
        });
    }

    // Populate the staples category array
    if (showStaples) {
        staplesMap.forEach(item => {
            const qty = item.quantity ?? 1;
            categories.staples.push({
                label: item.label,
                quantityText: formatQuantity(qty, item.unit),
                category: item.category,
                unit: item.unit,
                isStaple: true,
                sourceText: item.fromRecipe && item.fromStaple 
                    ? " (Recipe + Staple)" 
                    : item.fromRecipe 
                        ? " (Recipe)" 
                        : " (Staple)"
            });
        });
    }

    const container = document.getElementById("shoppingList");
    if (!container) return;
    container.innerHTML = "";

    function renderCategory(emoji, title, items) {
        if (!items.length) return;

        const group = document.createElement("div");
        group.className = "category-group";

        const titleDiv = document.createElement("div");
        titleDiv.className = "category-title";
        titleDiv.textContent = `${emoji} ${title}`;
        group.appendChild(titleDiv);

        const listDiv = document.createElement("div");
        listDiv.className = "item-list";

        items.forEach(item => {
            const label = document.createElement("label");
            label.className = "shop-item";
            if (item.isStaple) {
                label.style.opacity = "0.85";
            }

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";

            const itemKey = `${item.category}::${item.label.toLowerCase()}::${(item.unit || "").toLowerCase()}`;
            checkbox.setAttribute("data-item-key", itemKey);
            checkbox.setAttribute("data-item-name", item.label);
            checkbox.setAttribute("data-item-qty", item.rawQuantity || 1);
            checkbox.setAttribute("data-item-unit", item.unit || "");
            checkbox.setAttribute("data-item-category", item.category || "other");

            const nameSpan = document.createElement("span");
            nameSpan.style.flex = "2";
            if (item.isStaple) {
                nameSpan.innerHTML = `${item.label} <span style="font-size: 10px; color: var(--color-warning); opacity: 0.8; font-style: italic; font-weight: 600;">${item.sourceText}</span>`;
            } else {
                nameSpan.textContent = item.label;
            }

            const qtySpan = document.createElement("span");
            qtySpan.style.flex = "1";
            qtySpan.style.textAlign = "right";
            qtySpan.textContent = item.quantityText || "-";

            label.appendChild(checkbox);
            label.appendChild(nameSpan);
            label.appendChild(qtySpan);
            listDiv.appendChild(label);
        });

        group.appendChild(listDiv);
        container.appendChild(group);
    }

    renderCategory("🥬", "Fresh Produce", categories.produce);
    renderCategory("🍗", "Proteins", categories.protein);
    renderCategory("🥛", "Dairy & Alternatives", categories.dairy);
    renderCategory("🌾", "Grains & Carbs", categories.carbs);
    renderCategory("🏪", "Pantry Staples", categories.pantry);
    renderCategory("📦", "Other Items", categories.other);
    renderCategory("🏡", "Staples (Usually kept on hand)", categories.staples);

    updateCostSummary(categories);
}

// Summary calculation based on actual lists
function updateCostSummary(categories) {
    let totalLines = 0;
    if (categories) {
        totalLines = categories.produce.length + 
                     categories.protein.length + 
                     categories.dairy.length + 
                     categories.carbs.length + 
                     categories.pantry.length + 
                     categories.other.length + 
                     categories.staples.length;
    } else {
        const weeklyStaples = loadWeeklyStaples();
        totalLines = combinedIngredients.length + weeklyStaples.length;
    }
    
    const estimatedCost = totalLines * 3.50;
    const perDayCost = estimatedCost / 7;

    const totalEl = document.getElementById("shopping-cost-total");
    const perDayEl = document.getElementById("shopping-cost-per-day");
    const itemsEl = document.getElementById("shopping-cost-items");

    if (totalEl) totalEl.textContent = `£${estimatedCost.toFixed(2)}`;
    if (perDayEl) perDayEl.textContent = `~£${perDayCost.toFixed(2)}/day`;
    if (itemsEl) itemsEl.textContent = `${totalLines}`;
}

function renderDashboardOverview() {
    const plannedDinnersCount = State.weeklyPlan.days.filter(d => d.recipeId).length;
    const weeklyStaplesCount = State.staples.length;
    const totalIngredientsCount = combinedIngredients.length + weeklyStaplesCount;
    const estimatedCost = totalIngredientsCount * 3.50;

    const members = State.household ? State.household.members : [];
    const numMembers = members.length > 0 ? members.length : 1;

    const mealsCountEl = document.getElementById("dashboard-meals-count");
    const ingredientsCountEl = document.getElementById("dashboard-ingredients-count");
    const costEl = document.getElementById("dashboard-cost");
    const prepDaysEl = document.getElementById("dashboard-prep-days");

    if (mealsCountEl) mealsCountEl.textContent = `${plannedDinnersCount * numMembers}`;
    if (ingredientsCountEl) ingredientsCountEl.textContent = `${totalIngredientsCount}`;
    if (costEl) costEl.textContent = `~£${estimatedCost.toFixed(0)}`;
    
    const uniqueRecipesCount = new Set(State.weeklyPlan.days.map(d => d.recipeId).filter(Boolean)).size;
    if (prepDaysEl) {
        prepDaysEl.textContent = uniqueRecipesCount > 0 ? `${Math.max(1, Math.min(2, uniqueRecipesCount))}` : "0";
    }

    // Render dynamic Household Target summary card
    const dashboard = document.getElementById("dashboard");
    if (dashboard && members.length > 0) {
        let targetSummaryCard = document.getElementById("dashboard-household-target-card");
        if (!targetSummaryCard) {
            targetSummaryCard = document.createElement("div");
            targetSummaryCard.id = "dashboard-household-target-card";
            targetSummaryCard.className = "card";
            targetSummaryCard.style.marginTop = "20px";
            dashboard.appendChild(targetSummaryCard);
        }

        let totalCals = 0;
        let totalProt = 0;
        let totalCarb = 0;
        let totalFat = 0;

        members.forEach(m => {
            const { calories, protein_g, carbs_g, fat_g } = m.macro_goals || { calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65 };
            totalCals += calories;
            totalProt += protein_g;
            totalCarb += carbs_g;
            totalFat += fat_g;
        });

        targetSummaryCard.innerHTML = `
            <h3>🏡 Household Daily Targets (Consolidated)</h3>
            <p style="color: var(--color-text-light); margin-bottom: 15px; font-size: 13px;">Combined target macros across all ${members.length} household members.</p>
            <div class="stats" style="grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));">
                <div class="stat" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15);">
                     <div class="stat-value" style="color: var(--color-success); font-size: 22px;">${totalCals.toLocaleString()}</div>
                     <div class="stat-label">Total Calories</div>
                </div>
                <div class="stat" style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.15);">
                     <div class="stat-value" style="color: var(--color-primary); font-size: 22px;">${Math.round(totalProt)}g</div>
                     <div class="stat-label">Protein</div>
                </div>
                <div class="stat" style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.15);">
                     <div class="stat-value" style="color: var(--color-warning); font-size: 22px;">${Math.round(totalCarb)}g</div>
                     <div class="stat-label">Carbs</div>
                </div>
                <div class="stat" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15);">
                     <div class="stat-value" style="color: var(--color-danger); font-size: 22px;">${Math.round(totalFat)}g</div>
                     <div class="stat-label">Fats</div>
                </div>
            </div>
        `;
    } else if (dashboard) {
        const targetSummaryCard = document.getElementById("dashboard-household-target-card");
        if (targetSummaryCard) targetSummaryCard.remove();
    }
}

async function addShoppingListToInventory() {
    const itemLabels = Array.from(document.querySelectorAll(".shop-item"));
    if (!itemLabels.length) {
        alert("No shopping items found.");
        return;
    }

    const currentInventory = await API.getInventory();
    const itemsToSave = [];

    itemLabels.forEach((itemEl) => {
        const checkbox = itemEl.querySelector("input[type='checkbox']");
        if (!checkbox) return;

        const name = checkbox.getAttribute("data-item-name");
        const quantity = parseFloat(checkbox.getAttribute("data-item-qty")) || 1;
        const unit = checkbox.getAttribute("data-item-unit") || "";
        const category = checkbox.getAttribute("data-item-category") || "other";
        const isChecked = checkbox.checked;

        if (!isChecked && name && quantity > 0) {
            const existing = currentInventory.find(
                inv =>
                    inv.name.toLowerCase() === name.toLowerCase() &&
                    inv.unit.toLowerCase() === unit.toLowerCase() &&
                    inv.category.toLowerCase() === category.toLowerCase()
            );

            if (existing) {
                existing.quantity += quantity;
                itemsToSave.push(existing);
            } else {
                const newItem = {
                    id: `inv-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    name,
                    quantity,
                    unit,
                    category,
                    dateAdded: new Date().toISOString()
                };
                currentInventory.push(newItem);
                itemsToSave.push(newItem);
            }
        }

        checkbox.checked = true;
        itemEl.classList.add("checked");
    });

    await Promise.all(itemsToSave.map(item => API.saveInventoryItem(item)));
    await syncInventory();
    renderInventory();
    alert("Remaining shopping list items have been added to inventory.");
}

// =========================
// 6. WEEKLY PLAN: UI + ADD FROM RECIPE BANK
// =========================

function renderRecipePortions(container, recipe) {
    if (!container) return;
    container.innerHTML = "";

    const members = State.household ? State.household.members : [];
    if (members.length === 0) {
        container.innerHTML = `<span class="setup-household-notice">Set up your household in Settings to see portions</span>`;
        return;
    }

    const servingInfo = getRecipeServingInfo(recipe);
    const scale = servingInfo.servings / recipe.servings;
    const baseMacros = recipe.macros || { calories: 800, protein_g: 70, carbs_g: 80, fat_g: 25 };
    
    const scaledMacros = {
        calories: baseMacros.calories * scale,
        protein_g: baseMacros.protein_g * scale,
        carbs_g: baseMacros.carbs_g * scale,
        fat_g: baseMacros.fat_g * scale
    };

    const splits = calculateProportionalSplit(scaledMacros, members);

    splits.forEach(split => {
        const card = document.createElement("div");
        card.className = "portion-card";

        const labelText = members.length > 1 ? `<strong>👤 ${split.name}:</strong> ` : "";
        card.innerHTML = `
            <div>${labelText}${split.macros.calories} kcal</div>
            <div class="portion-card-sub">
                ${split.macros.protein_g}g P • ${split.macros.carbs_g}g C • ${split.macros.fat_g}g F
            </div>
        `;
        container.appendChild(card);
    });
}

function populateMealPlans() {
    const tab = document.getElementById("meals");
    if (!tab) return;

    const container = tab.querySelector(".grid");
    const template = document.getElementById("day-template");
    if (!container || !template || !State.weeklyPlan || !Array.isArray(State.weeklyPlan.days)) return;

    container.innerHTML = "";

    // 1. Get weekStartDay sorting order
    let daysToRender = State.weeklyPlan.days.map((entry, index) => ({ entry, index }));
    const weekStartDay = localStorage.getItem("weekStartDay") || "Monday";
    if (weekStartDay === "Sunday") {
        const sundayIndex = daysToRender.findIndex(d => d.entry.day === "Sunday");
        if (sundayIndex !== -1) {
            const sunday = daysToRender.splice(sundayIndex, 1)[0];
            daysToRender.unshift(sunday);
        }
    }

    // 2. Get mealsPerDay slot names
    const mealsPerDay = parseInt(localStorage.getItem("mealsPerDay") || "1");
    const slotNames = getSlotNames(mealsPerDay);

    daysToRender.forEach(({ entry, index }) => {
        const clone = template.content.cloneNode(true);
        const dayHeading = clone.querySelector("h3");
        if (dayHeading) dayHeading.textContent = entry.day;

        const dayDiv = clone.querySelector("div");
        const defaultMealItem = dayDiv.querySelector(".meal-item");
        if (defaultMealItem) defaultMealItem.remove();

        // Build slots for meals
        for (let slot = 0; slot < mealsPerDay; slot++) {
            const slotRecipeId = entry.recipeIds ? entry.recipeIds[slot] : (slot === 0 ? entry.recipeId : null);
            const recipe = slotRecipeId ? getRecipeById(slotRecipeId) : null;
            
            const mealItem = document.createElement("div");
            mealItem.className = `meal-item recipe-card ${recipe ? "shared-dinner" : ""}`;
            mealItem.style.position = "relative";
            mealItem.style.marginBottom = "15px";

            let slotHtml = `
                <div class="meal-time" style="font-weight: 700; color: var(--color-primary); font-size: 11px; margin-bottom: 6px; text-transform: uppercase;">${slotNames[slot]}</div>
            `;

            if (!recipe) {
                slotHtml += `
                    <div class="meal-name" style="font-style: italic; color: var(--color-text-light); font-size: 14px;">No recipe planned</div>
                    <button class="btn-secondary add-recipe-btn-slot" onclick="openAddRecipeForDayAndSlot(${index}, ${slot})" style="width: 100%; margin-top: 8px; font-size: 11px; padding: 6px 10px;">
                        ➕ Plan a Meal
                    </button>
                `;
                mealItem.innerHTML = slotHtml;
            } else {
                slotHtml += `
                    <div class="meal-name" style="font-weight: 600; font-size: 15px; margin-bottom: 8px;">${recipe.emoji} ${recipe.name}</div>
                    <div class="portions-container" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;"></div>
                    <div class="meal-macros" style="margin-top: 8px;">
                        <div style="font-size: 11px; color: var(--color-text-light);">
                            <strong>Prep & Cook:</strong> <span class="recipe-time">${recipe.prepTime || ""} • ${recipe.cookTime || ""}</span>
                        </div>
                    </div>
                    <button class="btn-secondary view-recipe" style="width: 100%; margin-top: 10px; font-size: 11px; padding: 6px 10px;">
                        📖 View Full Recipe
                    </button>
                    <button class="btn-secondary remove-recipe" style="width: 100%; margin-top: 6px; font-size: 11px; padding: 6px 10px; color: var(--color-danger); border-color: rgba(239, 68, 68, 0.25);">
                        🗑 Remove from Plan
                    </button>
                `;
                mealItem.innerHTML = slotHtml;

                const portionsContainer = mealItem.querySelector(".portions-container");
                if (portionsContainer) {
                    renderRecipePortions(portionsContainer, recipe);
                }

                const viewBtn = mealItem.querySelector(".view-recipe");
                if (viewBtn) {
                    viewBtn.onclick = () => showRecipeModal(recipe);
                }

                const removeBtn = mealItem.querySelector(".remove-recipe");
                if (removeBtn) {
                    removeBtn.onclick = () => removeRecipeFromPlanSlot(index, slot);
                }

                setupRecipeCardIngredientsAndWarnings(mealItem, recipe, portionsContainer, viewBtn);
            }

            dayDiv.appendChild(mealItem);
        }

        container.appendChild(clone);
    });
}

function showCardInlineError(card, message) {
    if (!card) return;
    let errEl = card.querySelector(".card-inline-error");
    if (!errEl) {
        errEl = document.createElement("div");
        errEl.className = "card-inline-error";
        card.appendChild(errEl);
    }
    errEl.textContent = message;
    errEl.style.opacity = "1";
    errEl.style.transform = "translateY(0)";
    
    setTimeout(() => {
        errEl.style.opacity = "0";
        errEl.style.transform = "translateY(10px)";
        setTimeout(() => errEl.remove(), 300);
    }, 3000);
}

window.toggleFavouritesFilter = function() {
    favouritesOnlyFilter = !favouritesOnlyFilter;
    const btn = document.getElementById("favouritesFilterBtn");
    if (btn) {
        if (favouritesOnlyFilter) {
            btn.innerHTML = "🍔 Show All";
            btn.classList.add("btn-primary");
            btn.classList.remove("btn-secondary");
        } else {
            btn.innerHTML = "⭐ Show Favourites";
            btn.classList.add("btn-secondary");
            btn.classList.remove("btn-primary");
        }
    }
    populateRecipesTab();
};

function populateRecipesTab() {
    const recipesTab = document.getElementById("recipes");
    if (!recipesTab) return;

    const grid = recipesTab.querySelector(".grid");
    const template = document.getElementById("recipe-template");
    if (!grid || !template) return;

    grid.innerHTML = "";

    const usageById = {};
    if (State.weeklyPlan && Array.isArray(State.weeklyPlan.days)) {
        State.weeklyPlan.days.forEach(d => {
            if (d.recipeId) usageById[d.recipeId] = d.day;
        });
    }

    let filteredRecipes = recipeBank;
    if (favouritesOnlyFilter) {
        filteredRecipes = recipeBank.filter(r => State.favourites.includes(r.id));
    }

    if (favouritesOnlyFilter && filteredRecipes.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-favourites" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--color-text-light);">
                <div style="font-size: 48px; margin-bottom: 12px;">⭐</div>
                <h4 style="margin-bottom: 8px; color: var(--color-text);">You haven't starred any recipes yet</h4>
                <p style="font-size: 13px; max-width: 320px; margin: 0 auto; line-height: 1.5;">Click the star icon (☆) on any recipe to add it to your favourites so you can find it easily later!</p>
            </div>
        `;
        return;
    }

    filteredRecipes.forEach(recipe => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector(".meal-item");
        if (card) {
            card.setAttribute("data-recipe-id", recipe.id);
        }

        const badge = clone.querySelector(".plan-badge");
        const mealName = clone.querySelector(".meal-name");
        const portionsContainer = clone.querySelector(".portions-container");
        const timeSpan = clone.querySelector(".recipe-time");
        const viewRecipeBtn = clone.querySelector(".view-recipe");
        const addToPlanBtn = clone.querySelector(".add-to-plan");
        const favouriteBtn = clone.querySelector(".favourite-btn");

        if (mealName) mealName.textContent = `${recipe.emoji} ${recipe.name}`;

        if (portionsContainer) {
            renderRecipePortions(portionsContainer, recipe);
        }

        if (timeSpan) {
            const prep = recipe.prepTime || "";
            const cook = recipe.cookTime || "";
            timeSpan.textContent =
                prep && cook ? `${prep} prep • ${cook} cook` : prep || cook || "N/A";
        }

        if (viewRecipeBtn) {
            viewRecipeBtn.onclick = () => showRecipeModal(recipe);
        }

        const isFavourited = State.favourites.includes(recipe.id);
        if (favouriteBtn) {
            favouriteBtn.textContent = isFavourited ? "⭐" : "☆";
            favouriteBtn.setAttribute("aria-label", isFavourited ? "Remove from favourites" : "Add to favourites");
            if (isFavourited) {
                favouriteBtn.classList.add("favourited");
            } else {
                favouriteBtn.classList.remove("favourited");
            }

            favouriteBtn.onclick = async (e) => {
                e.stopPropagation();
                
                const cardEl = favouriteBtn.closest(".meal-item");
                const currentFavourited = State.favourites.includes(recipe.id);
                
                // Optimistic UI updates
                if (currentFavourited) {
                    State.favourites = State.favourites.filter(id => id !== recipe.id);
                    favouriteBtn.textContent = "☆";
                    favouriteBtn.setAttribute("aria-label", "Add to favourites");
                    favouriteBtn.classList.remove("favourited");
                } else {
                    State.favourites.push(recipe.id);
                    favouriteBtn.textContent = "⭐";
                    favouriteBtn.setAttribute("aria-label", "Remove from favourites");
                    favouriteBtn.classList.add("favourited");
                }

                // If favourites-only filter is active, immediately re-render to avoid lag
                if (favouritesOnlyFilter) {
                    populateRecipesTab();
                }

                try {
                    if (currentFavourited) {
                        await API.removeFavourite(recipe.id);
                    } else {
                        await API.addFavourite(recipe.id);
                    }
                } catch (err) {
                    // Rollback on failure
                    if (currentFavourited) {
                        State.favourites.push(recipe.id);
                    } else {
                        State.favourites = State.favourites.filter(id => id !== recipe.id);
                    }
                    populateRecipesTab();
                    showCardInlineError(cardEl, "Failed to save favourite");
                }
            };
        }

        const usedDay = usageById[recipe.id];

        // Subtle visual indicator for custom recipes: purple border and Left "Custom" badge
        if (recipe.is_custom) {
            if (card) {
                card.style.borderLeftColor = "#9b59b6";
                
                const leftContainer = card.querySelector(".recipe-card-header-left");
                if (leftContainer) {
                    const customBadge = document.createElement("div");
                    customBadge.className = "custom-recipe-badge";
                    customBadge.textContent = "Custom";
                    leftContainer.appendChild(customBadge);
                }
            }
        }

        // Show edit/delete icon controls on custom recipes owned by the logged-in user
        if (recipe.is_custom && State.user && recipe.created_by_user_id === State.user.id) {
            if (card) {
                const rightContainer = card.querySelector(".recipe-card-header-right");
                if (rightContainer) {
                    const editBtn = document.createElement("button");
                    editBtn.className = "card-control-btn edit-btn";
                    editBtn.innerHTML = "✏️";
                    editBtn.title = "Edit recipe";
                    editBtn.onclick = (e) => {
                        e.stopPropagation();
                        showEditRecipeModal(recipe.id);
                    };
                    
                    const deleteBtn = document.createElement("button");
                    deleteBtn.className = "card-control-btn delete-btn";
                    deleteBtn.innerHTML = "🗑️";
                    deleteBtn.title = "Delete recipe";
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        deleteCustomRecipe(recipe.id, recipe.name);
                    };
                    
                    rightContainer.appendChild(editBtn);
                    rightContainer.appendChild(deleteBtn);
                }
            }
        }

        if (badge) {
            if (usedDay) {
                badge.textContent = `In plan (${usedDay})`;
                badge.style.display = "inline-flex";
            } else {
                badge.textContent = "";
                badge.style.display = "none";
            }
        }

        if (addToPlanBtn) {
            if (usedDay) {
                addToPlanBtn.textContent = "✅ In plan";
                addToPlanBtn.disabled = true;
                addToPlanBtn.onclick = null;
            } else {
                addToPlanBtn.textContent = "➕ Add to Meal Plan";
                addToPlanBtn.disabled = false;
                addToPlanBtn.onclick = (e) => addRecipeToPlanFromButton(e.currentTarget);
            }
        }
        setupRecipeCardIngredientsAndWarnings(card, recipe, portionsContainer, viewRecipeBtn);

        grid.appendChild(clone);
    });
}

function addRecipeToPlanFromButton(btn) {
    const card = btn.closest("[data-recipe-id]");
    if (!card) {
        debug("No data-recipe-id on card");
        return;
    }

    const recipeId = card.getAttribute("data-recipe-id");
    if (!recipeId) {
        debug("No recipeId found on card");
        return;
    }

    addRecipeToPlan(recipeId);
}

// Add/clear/remove meals using custom day and slot selector
function addRecipeToPlan(recipeId) {
    currentAddingRecipeId = recipeId;
    
    const modal = document.getElementById("addToPlanModal");
    const daySelect = document.getElementById("addToPlanDaySelect");
    const slotSelect = document.getElementById("addToPlanSlotSelect");
    
    if (!modal || !daySelect || !slotSelect) return;
    
    // Populate Day dropdown
    daySelect.innerHTML = "";
    const currentWeekStart = localStorage.getItem("weekStartDay") || "Monday";
    const daysOrder = currentWeekStart === "Sunday"
        ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        
    daysOrder.forEach(day => {
        const option = document.createElement("option");
        option.value = day;
        option.textContent = day;
        daySelect.appendChild(option);
    });

    // Populate Slot dropdown
    slotSelect.innerHTML = "";
    const mealsPerDay = parseInt(localStorage.getItem("mealsPerDay") || "1");
    const slotNames = getSlotNames(mealsPerDay);
    for (let s = 0; s < mealsPerDay; s++) {
        const option = document.createElement("option");
        option.value = s;
        option.textContent = slotNames[s];
        slotSelect.appendChild(option);
    }
    
    // Bind click confirmation
    const confirmBtn = document.getElementById("addToPlanConfirmBtn");
    confirmBtn.onclick = async () => {
        const chosenDay = daySelect.value;
        const chosenSlot = parseInt(slotSelect.value);
        
        await executeAddRecipeToSlot(currentAddingRecipeId, chosenDay, chosenSlot);
        closeAddToPlanModal();
    };

    modal.classList.add("active");
}

window.closeAddToPlanModal = function() {
    const modal = document.getElementById("addToPlanModal");
    if (modal) modal.classList.remove("active");
};

async function executeAddRecipeToSlot(recipeId, dayName, slotIndex) {
    if (!State.weeklyPlan || !Array.isArray(State.weeklyPlan.days)) {
        State.weeklyPlan = structuredClone(defaultWeeklyPlan);
    }

    const dayObjIndex = State.weeklyPlan.days.findIndex(d => d.day === dayName);
    if (dayObjIndex === -1) return;

    const fallbackPlan = structuredClone(State.weeklyPlan);

    // Initialize recipeIds if not present
    if (!State.weeklyPlan.days[dayObjIndex].recipeIds) {
        State.weeklyPlan.days[dayObjIndex].recipeIds = [null, null, null, null, null];
        State.weeklyPlan.days[dayObjIndex].recipeIds[0] = State.weeklyPlan.days[dayObjIndex].recipeId;
    }

    State.weeklyPlan.days[dayObjIndex].recipeIds[slotIndex] = recipeId;
    if (slotIndex === 0) {
        State.weeklyPlan.days[dayObjIndex].recipeId = recipeId;
    }

    State.renderAll();

    try {
        await API.saveWeeklyPlan(State.weeklyPlan.weekLabel, State.weeklyPlan.days);
        showToast("Recipe added to your meal plan!", "success");
    } catch (err) {
        showToast("Failed to save meal plan. Changes rolled back.", "error");
        State.weeklyPlan = fallbackPlan;
        State.renderAll();
    }
}

async function removeRecipeFromPlan(dayIndex) {
    await removeRecipeFromPlanSlot(dayIndex, 0);
}

async function removeRecipeFromPlanSlot(dayIndex, slotIndex) {
    if (!State.weeklyPlan || !Array.isArray(State.weeklyPlan.days)) return;

    const fallbackPlan = structuredClone(State.weeklyPlan);

    if (State.weeklyPlan.days[dayIndex].recipeIds) {
        State.weeklyPlan.days[dayIndex].recipeIds[slotIndex] = null;
    }
    if (slotIndex === 0) {
        State.weeklyPlan.days[dayIndex].recipeId = null;
    }

    State.renderAll();

    try {
        await API.saveWeeklyPlan(State.weeklyPlan.weekLabel, State.weeklyPlan.days);
        showToast("Recipe removed from plan.", "success");
    } catch (err) {
        showToast("Failed to remove recipe. Changes rolled back.", "error");
        State.weeklyPlan = fallbackPlan;
        State.renderAll();
    }
}

async function clearWeeklyPlan() {
    await confirmAndClearWeekPlan();
}

// =========================
// 7. RECIPE MODAL
// =========================

function showRecipeModal(recipe) {
    const modal = document.getElementById("recipeModal");
    if (!modal) return;

    const categoryLabels = {
        produce: "Produce",
        protein: "Protein",
        dairy: "Dairy",
        carbs: "Carbohydrates",
        pantry: "Pantry",
        other: "Other"
    };

    const servingInfo = getRecipeServingInfo(recipe);
    
    // Group flat ingredients by category
    const list = Array.isArray(recipe.ingredients) 
        ? recipe.ingredients 
        : Object.entries(recipe.ingredients).flatMap(([category, items]) => 
            (Array.isArray(items) ? items.map(item => ({ ...item, category, quantity_per_serving: (item.quantity || 0) / (recipe.servings || 2) })) : [])
          );

    const grouped = {};
    list.forEach(ing => {
        const cat = ing.category || "other";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(ing);
    });

    let ingredientsHtml = "";

    for (const [category, items] of Object.entries(grouped)) {
        const label = categoryLabels[category] || category;
        const listItems = items
            .map(ing => {
                const qtyPerServing = ing.quantity_per_serving !== undefined 
                    ? ing.quantity_per_serving 
                    : (ing.quantity || 0) / (recipe.servings || 2);
                const scaledQty = qtyPerServing * servingInfo.servings;
                const formattedQty = formatQuantity(scaledQty, ing.unit);
                const notesText = ing.notes ? ` <em>(${ing.notes})</em>` : "";
                return `<li>${formattedQty} ${ing.name}${notesText}</li>`;
            })
            .join("");

        ingredientsHtml += `
      <li>
        <strong>${label}:</strong>
        <ul style="margin-top: 4px; margin-left: 16px;">
          ${listItems}
        </ul>
      </li>
    `;
    }

    const instructionsHtml = (recipe.instructions || [])
        .map((instruction, index) => `<li><strong>Step ${index + 1}:</strong> ${instruction}</li>`)
        .join("");

    const members = State.household ? State.household.members : [];
    let portionsHtml = "";

    if (members.length === 0) {
        portionsHtml = `<div style="color: var(--color-warning); font-size: 12px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">Set up your household in Settings to see portion targets.</div>`;
    } else {
        const scale = servingInfo.servings / recipe.servings;
        const baseMacros = recipe.macros || { calories: 800, protein_g: 70, carbs_g: 80, fat_g: 25 };
        
        const scaledMacros = {
            calories: baseMacros.calories * scale,
            protein_g: baseMacros.protein_g * scale,
            carbs_g: baseMacros.carbs_g * scale,
            fat_g: baseMacros.fat_g * scale
        };

        const splits = calculateProportionalSplit(scaledMacros, members);
        
        portionsHtml = splits.map(split => {
            const labelText = members.length > 1 ? `👤 ${split.name}: ` : "";
            return `
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px; margin-bottom: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                    <div style="font-weight: 600; font-size: 13px; color: var(--color-primary);">${labelText}${split.macros.calories} kcal</div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 11px; margin-top: 4px;">
                        Protein: <strong>${split.macros.protein_g}g</strong> • Carbs: <strong>${split.macros.carbs_g}g</strong> • Fats: <strong>${split.macros.fat_g}g</strong>
                    </div>
                </div>
            `;
        }).join("");
    }

    let clampWarningHtml = "";
    if (servingInfo.clamped) {
        clampWarningHtml = `
            <div class="clamp-warning-badge" style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; padding: 10px 14px; border-radius: 8px; font-size: 12px; font-weight: 500; margin-bottom: 20px; display: flex; align-items: center; gap: 6px; line-height: 1.4;">
                ⚠️ This recipe is locked between ${recipe.min_servings} and ${recipe.max_servings} servings. 
                Scaled to ${servingInfo.servings} servings (${servingInfo.clampType}).
            </div>
        `;
    }

    const recipeContent = `
    <div class="recipe-modal-header">
      <h2>${recipe.emoji} ${recipe.name}</h2>
      <p>${recipe.description}</p>
      <div class="stats" style="margin-top: 15px;">
        <div class="stat" style="background: rgba(255,255,255,0.1); padding: 8px;">
          <div class="stat-label" style="color: rgba(255,255,255,0.8);">⏱️ Prep</div>
          <div class="stat-value" style="color: white; font-size: 14px;">${recipe.prepTime}</div>
        </div>
        <div class="stat" style="background: rgba(255,255,255,0.1); padding: 8px;">
          <div class="stat-label" style="color: rgba(255,255,255,0.8);">🍳 Cook</div>
          <div class="stat-value" style="color: white; font-size: 14px;">${recipe.cookTime}</div>
        </div>
        <div class="stat" style="background: rgba(255,255,255,0.1); padding: 8px;">
          <div class="stat-label" style="color: rgba(255,255,255,0.8);">👥 Serves</div>
          <div class="stat-value" style="color: white; font-size: 14px;">${servingInfo.servings}</div>
        </div>
      </div>
    </div>

    ${clampWarningHtml}

    <div class="recipe-sections">
      <div class="recipe-section">
        <h4>Ingredients</h4>
        <ul>${ingredientsHtml}</ul>
      </div>
      <div class="recipe-section">
        <h4>Portion Sizes</h4>
        <div style="margin-top: 8px;">
          ${portionsHtml}
        </div>
      </div>
    </div>

    <div class="instructions-list" style="margin-bottom: 20px;">
      <h4 style="color: var(--color-primary); margin-bottom: 15px;">📖 Instructions</h4>
      <ol>${instructionsHtml}</ol>
    </div>

    <div class="buttons">
      <button class="btn-success" onclick="addRecipeToPlan('${recipe.id}')">✅ Add to This Week</button>
      <button class="btn-secondary" onclick="closeRecipeModal()">Close</button>
    </div>
  `;

    const content = modal.querySelector(".modal-content");
    if (content) content.innerHTML = recipeContent;
    modal.classList.add("active");
}

function closeRecipeModal() {
    const modal = document.getElementById("recipeModal");
    if (modal) modal.classList.remove("active");
}

document.addEventListener("click", function (e) {
    const modal = document.getElementById("recipeModal");
    if (modal && e.target === modal) closeRecipeModal();
});

// =========================
// CUSTOM RECIPES HANDLERS
// =========================

window.showAddRecipeModal = function() {
    const modal = document.getElementById("recipeFormModal");
    if (!modal) return;
    
    document.getElementById("recipeFormTitle").textContent = "➕ Create Custom Recipe";
    document.getElementById("recipeFormId").value = "";
    document.getElementById("recipeForm").reset();
    
    // Clear dynamic ingredients list
    const ingContainer = document.getElementById("recipeFormIngredientsList");
    if (ingContainer) {
        ingContainer.innerHTML = "";
        // Default with 1 blank row
        addRecipeFormIngredientRow();
    }
    
    modal.classList.add("active");
};

window.closeRecipeFormModal = function() {
    const modal = document.getElementById("recipeFormModal");
    if (modal) modal.classList.remove("active");
};

// Close recipeFormModal on click outside
document.addEventListener("click", function (e) {
    const modal = document.getElementById("recipeFormModal");
    if (modal && e.target === modal) closeRecipeFormModal();
});

window.addRecipeFormIngredientRow = function(data = null) {
    const container = document.getElementById("recipeFormIngredientsList");
    if (!container) return;
    
    const row = document.createElement("div");
    row.className = "recipe-form-ingredient-row";
    row.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        width: 100%;
        background: rgba(255, 255, 255, 0.03);
        padding: 8px;
        border-radius: 8px;
        border: 1px solid var(--color-border);
        margin-bottom: 4px;
    `;
    
    row.innerHTML = `
        <input type="text" placeholder="Ingredient name *" class="ing-name" required style="flex: 2; min-width: 130px; padding: 8px; font-size: 13px;" value="${data?.name || ''}">
        <input type="number" step="any" min="0.001" placeholder="Qty *" class="ing-qty" required style="width: 70px; padding: 8px; font-size: 13px;" value="${data?.quantity_per_serving !== undefined ? data.quantity_per_serving : ''}">
        <select class="ing-unit" required style="width: 85px; padding: 8px; font-size: 13px;">
            ${["g", "kg", "ml", "l", "piece", "pack", "tin", "jar", "loaf", "box", "tbsp", "tsp", "whole", "pcs"]
                .map(unit => `<option value="${unit}" ${data?.unit === unit ? 'selected' : ''}>${unit}</option>`).join("")}
        </select>
        <select class="ing-category" required style="width: 100px; padding: 8px; font-size: 13px;">
            ${["produce", "protein", "dairy", "carbs", "pantry", "other"]
                .map(cat => `<option value="${cat}" ${data?.category === cat ? 'selected' : ''}>${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`).join("")}
        </select>
        <input type="text" placeholder="Notes (optional)" class="ing-notes" style="flex: 1.5; min-width: 100px; padding: 8px; font-size: 13px;" value="${data?.notes || ''}">
        <button type="button" class="btn-secondary remove-row-btn" onclick="this.closest('.recipe-form-ingredient-row').remove()" style="padding: 0; font-size: 13px; display: flex; align-items: center; justify-content: center; height: 35px; width: 35px; color: var(--color-danger); border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05);">🗑</button>
    `;
    
    container.appendChild(row);
};

window.showEditRecipeModal = function(recipeId) {
    const recipe = recipeBank.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const modal = document.getElementById("recipeFormModal");
    if (!modal) return;
    
    document.getElementById("recipeFormTitle").textContent = "✏️ Edit Custom Recipe";
    document.getElementById("recipeFormId").value = recipeId;
    
    document.getElementById("recipeFormName").value = recipe.name;
    document.getElementById("recipeFormDescription").value = recipe.description || "";
    
    // Parse time strings (e.g. "20 min") to numbers
    document.getElementById("recipeFormPrepTime").value = parseInt(recipe.prepTime) || 0;
    document.getElementById("recipeFormCookTime").value = parseInt(recipe.cookTime) || 0;
    document.getElementById("recipeFormBaseServings").value = recipe.servings;
    
    document.getElementById("recipeFormMinServings").value = recipe.min_servings !== null ? recipe.min_servings : "";
    document.getElementById("recipeFormMaxServings").value = recipe.max_servings !== null ? recipe.max_servings : "";
    document.getElementById("recipeFormEstimatedCost").value = recipe.estimated_cost_per_serving_gbp !== null ? recipe.estimated_cost_per_serving_gbp : "";
    
    // Scale macro base values (e.g. 1200 kcal for 2 servings) back to single serving (e.g. 600 kcal) for the form
    const servings = recipe.servings || 2;
    document.getElementById("recipeFormCalories").value = Math.round((recipe.macros?.calories || 0) / servings);
    document.getElementById("recipeFormProtein").value = Math.round(((recipe.macros?.protein_g || 0) / servings) * 10) / 10;
    document.getElementById("recipeFormCarbs").value = Math.round(((recipe.macros?.carbs_g || 0) / servings) * 10) / 10;
    document.getElementById("recipeFormFat").value = Math.round(((recipe.macros?.fat_g || 0) / servings) * 10) / 10;
    
    // Populate ingredients
    const ingContainer = document.getElementById("recipeFormIngredientsList");
    ingContainer.innerHTML = "";
    
    if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ing => addRecipeFormIngredientRow(ing));
    }
    
    if (ingContainer.children.length === 0) {
        addRecipeFormIngredientRow();
    }
    
    modal.classList.add("active");
};

window.handleRecipeFormSubmit = async function(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById("recipeFormSubmitBtn");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.7";
    }
    
    try {
        const recipeId = document.getElementById("recipeFormId").value;
        const name = document.getElementById("recipeFormName").value.trim();
        const description = document.getElementById("recipeFormDescription").value.trim();
        const prep_time_mins = parseInt(document.getElementById("recipeFormPrepTime").value) || 0;
        const cook_time_mins = parseInt(document.getElementById("recipeFormCookTime").value) || 0;
        const base_servings = parseInt(document.getElementById("recipeFormBaseServings").value) || 2;
        
        const min_servings = document.getElementById("recipeFormMinServings").value !== "" ? parseInt(document.getElementById("recipeFormMinServings").value) : null;
        const max_servings = document.getElementById("recipeFormMaxServings").value !== "" ? parseInt(document.getElementById("recipeFormMaxServings").value) : null;
        const estimated_cost_per_serving_gbp = document.getElementById("recipeFormEstimatedCost").value !== "" ? parseFloat(document.getElementById("recipeFormEstimatedCost").value) : null;
        
        const calories = parseInt(document.getElementById("recipeFormCalories").value) || 0;
        const protein = parseFloat(document.getElementById("recipeFormProtein").value) || 0;
        const carbs = parseFloat(document.getElementById("recipeFormCarbs").value) || 0;
        const fat = parseFloat(document.getElementById("recipeFormFat").value) || 0;
        
        // Retrieve and validate ingredient rows
        const rowEls = document.querySelectorAll(".recipe-form-ingredient-row");
        const ingredients = [];
        
        rowEls.forEach(row => {
            const ingName = row.querySelector(".ing-name").value.trim();
            const ingQty = parseFloat(row.querySelector(".ing-qty").value);
            const ingUnit = row.querySelector(".ing-unit").value;
            const ingCategory = row.querySelector(".ing-category").value;
            const ingNotes = row.querySelector(".ing-notes").value.trim();
            
            if (ingName && !isNaN(ingQty) && ingQty > 0) {
                ingredients.push({
                    name: ingName,
                    quantity_per_serving: ingQty,
                    unit: ingUnit,
                    category: ingCategory,
                    notes: ingNotes || null
                });
            }
        });
        
        if (!name) {
            alert("Recipe name is required.");
            throw new Error("Validation failed");
        }
        if (ingredients.length === 0) {
            alert("At least one valid ingredient is required.");
            throw new Error("Validation failed");
        }
        
        const payload = {
            name,
            description,
            prep_time_mins,
            cook_time_mins,
            base_servings,
            min_servings,
            max_servings,
            estimated_cost_per_serving_gbp,
            ingredients,
            macros_per_serving: {
                calories,
                protein_g: protein,
                carbs_g: carbs,
                fat_g: fat
            },
            tags: []
        };
        
        let responseRecipe;
        if (recipeId) {
            // Edit mode
            responseRecipe = await API.updateRecipe(recipeId, payload);
            
            // Update in recipeBank
            const index = recipeBank.findIndex(r => r.id === recipeId);
            if (index !== -1) {
                recipeBank[index] = responseRecipe;
            }
            showToast("Recipe updated successfully!", "success");
        } else {
            // Create mode
            responseRecipe = await API.saveRecipe(payload);
            recipeBank.push(responseRecipe);
            showToast("Recipe created successfully!", "success");
        }
        
        closeRecipeFormModal();
        State.renderAll();
    } catch (err) {
        console.error(err);
        if (err.message !== "Validation failed") {
            alert(`Error saving recipe: ${err.message}`);
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
        }
    }
};

window.deleteCustomRecipe = async function(recipeId, recipeName) {
    const ok = confirm(`Delete "${recipeName}"? This will remove it from your week plan.`);
    if (!ok) return;
    
    try {
        await API.deleteRecipe(recipeId);
        
        // Remove from recipeBank
        const index = recipeBank.findIndex(r => r.id === recipeId);
        if (index !== -1) {
            recipeBank.splice(index, 1);
        }
        
        // Remove from weekly plan
        if (State.weeklyPlan && Array.isArray(State.weeklyPlan.days)) {
            State.weeklyPlan.days.forEach(d => {
                if (d.recipeId === recipeId) d.recipeId = null;
            });
        }
        
        showToast("Recipe deleted successfully!", "success");
        State.renderAll();
    } catch (err) {
        console.error(err);
        alert(`Failed to delete recipe: ${err.message}`);
    }
};

// =========================
// 8. WEEKLY STAPLES (API PERSISTENCE)
// =========================

let cachedStaples = [];

function loadWeeklyStaples() {
    return State.staples;
}

function saveWeeklyStaples(items) {
    State.staples = items;
    State.renderAll();
}

async function syncStaples() {
    try {
        State.staples = await API.getStaples();
        State.renderAll();
    } catch (err) {
        console.error("Failed to sync staples:", err);
    }
}

function renderStaples() {
    const container = document.getElementById("staplesGrid");
    if (!container) return;

    const items = loadWeeklyStaples();
    container.innerHTML = "";

    const categories = { produce: [], protein: [], dairy: [], carbs: [], pantry: [], other: [] };
    items.forEach(item => {
        const key = categories.hasOwnProperty(item.category) ? item.category : "other";
        categories[key].push(item);
    });

    Object.values(categories).forEach(list => list.sort((a, b) => a.name.localeCompare(b.name)));

    function renderStaplesCategory(emoji, title, key) {
        const list = categories[key];
        if (!list.length) return;

        const group = document.createElement("div");
        group.className = "category-group";

        const titleDiv = document.createElement("div");
        titleDiv.className = "category-title";
        titleDiv.textContent = `${emoji} ${title}`;
        group.appendChild(titleDiv);

        const listDiv = document.createElement("div");
        listDiv.className = "item-list";

        list.forEach(item => {
            const row = document.createElement("div");
            row.className = "shop-item";
            row.style.display = "flex";
            row.style.alignItems = "center";
            row.style.gap = "6px";

            const nameSpan = document.createElement("span");
            nameSpan.style.flex = "2";
            nameSpan.textContent = item.name;

            const qtySpan = document.createElement("span");
            qtySpan.style.flex = "1";
            qtySpan.style.textAlign = "right";
            qtySpan.textContent = `${item.quantity} ${item.unit}`.trim();

            const removeBtn = document.createElement("button");
            removeBtn.className = "btn-secondary";
            removeBtn.textContent = "✕";
            removeBtn.style.padding = "2px 6px";
            removeBtn.style.fontSize = "11px";
            removeBtn.onclick = async () => {
                await API.deleteStapleItem(item.id);
                await syncStaples();
                renderStaples();
                recomputeShoppingData(); // so shopping list updates
            };

            row.appendChild(nameSpan);
            row.appendChild(qtySpan);
            row.appendChild(removeBtn);
            listDiv.appendChild(row);
        });

        group.appendChild(listDiv);
        container.appendChild(group);
    }

    renderStaplesCategory("🥬", "Fresh Produce", "produce");
    renderStaplesCategory("🍗", "Proteins", "protein");
    renderStaplesCategory("🥛", "Dairy & Alternatives", "dairy");
    renderStaplesCategory("🌾", "Grains & Carbs", "carbs");
    renderStaplesCategory("🏪", "Pantry Staples", "pantry");
    renderStaplesCategory("📦", "Other Items", "other");
}

async function addStapleItem() {
    const name = document.getElementById("stapleNameInput").value.trim();
    const quantity = parseFloat(document.getElementById("stapleQuantityInput").value) || 1;
    const unit = normaliseUnit(document.getElementById("stapleUnitSelect").value);
    const category = document.getElementById("stapleCategorySelect").value || "other";

    if (!name) {
        alert("Please enter an item name");
        return;
    }

    await syncStaples();
    const items = loadWeeklyStaples();
    const existing = items.find(
        i => i.name.toLowerCase() === name.toLowerCase() && i.unit === unit && i.category === category
    );

    let stapleToSave;
    if (existing) {
        existing.quantity += quantity;
        stapleToSave = existing;
    } else {
        stapleToSave = {
            id: `staple-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name,
            quantity,
            unit,
            category
        };
    }

    await API.saveStapleItem(stapleToSave);
    await syncStaples();
    renderStaples();
    recomputeShoppingData();

    document.getElementById("stapleNameInput").value = "";
    document.getElementById("stapleQuantityInput").value = "1";
    document.getElementById("stapleUnitSelect").value = "kg";
    document.getElementById("stapleCategorySelect").value = "pantry";
}

function exportWeeklyStaples() {
    const items = loadWeeklyStaples();
    const json = JSON.stringify(items, null, 2);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    a.href = url;
    a.download = `weekly-staples-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importWeeklyStaples() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";

    input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);

                if (!Array.isArray(data)) {
                    alert("Invalid staples.json file: expected an array of ingredient objects.");
                    return;
                }

                // Normalise incoming items
                const imported = data.map(item => ({
                    id: item.id || `staple-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    name: String(item.name || "").trim(),
                    quantity: Number(item.quantity) || 0,
                    unit: String(item.unit || "").trim() || "unit",
                    category: item.category || "other"
                }));

                // Merge with existing, summing duplicates by name+unit+category
                const existing = loadWeeklyStaples();
                const map = new Map();

                const addToMap = (list) => {
                    list.forEach(item => {
                        const key = `${item.category}::${item.name.toLowerCase()}::${item.unit.toLowerCase()}`;
                        const current = map.get(key);
                        if (!current) {
                            map.set(key, { ...item });
                        } else {
                            current.quantity += item.quantity;
                        }
                    });
                };

                addToMap(existing);
                addToMap(imported);

                const merged = Array.from(map.values());

                saveWeeklyStaples(merged);
                renderStaples();
                recomputeShoppingData();
                alert("Weekly staples.json imported and merged successfully.");
            } catch (e) {
                console.error(e);
                alert("Failed to import staples.json. Make sure it's a valid JSON export.");
            }
        };

        reader.readAsText(file);
    });

    input.click();
}

async function clearWeeklyStaples() {
    const confirmed = confirm("This will delete ALL weekly staples. Are you sure?");
    if (!confirmed) return;

    const items = loadWeeklyStaples();
    await Promise.all(items.map(item => API.deleteStapleItem(item.id)));
    await syncStaples();
    renderStaples();
    recomputeShoppingData();
}

// =========================
// Onboarding and Settings Overlays
// =========================

function hideOnboardingOverlay() {
    const el = document.getElementById("onboardingOverlay");
    if (el) el.remove();
}

function showOnboardingOverlay() {
    if (document.getElementById("onboardingOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "onboardingOverlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(18, 18, 24, 0.85);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #fff;
    `;

    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = `
        width: 100%;
        max-width: 650px;
        padding: 35px;
        background: rgba(33, 40, 50, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
        color: #fff;
        max-height: 90vh;
        overflow-y: auto;
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    let currentStep = 1;
    let memberCount = 1;
    let membersData = [];

    function renderStep() {
        card.innerHTML = "";

        if (currentStep === 1) {
            card.innerHTML = `
                <div style="text-align: center; margin-bottom: 25px;">
                    <span style="font-size: 45px;">🏡</span>
                    <h2 style="margin-top: 15px; font-weight: 700; background: linear-gradient(135deg, #10b981, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; border: none;">Set Up Your Household</h2>
                    <p style="color: rgba(255,255,255,0.7); margin-top: 5px; font-size: 14px;">Welcome! Let's get started by defining your household size.</p>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.6); margin-bottom: 10px;">How many people are in your household?</label>
                    <input type="number" id="memberCountInput" min="1" max="8" value="${memberCount}" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 16px; outline: none;" />
                    <p style="font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 6px;">You can set up custom macro goals and preferences for up to 8 members.</p>
                </div>

                <button id="step1NextBtn" class="btn-primary" style="width: 100%; padding: 14px; font-size: 16px;">Next: Member Details →</button>
            `;

            document.getElementById("step1NextBtn").onclick = () => {
                const val = parseInt(document.getElementById("memberCountInput").value);
                if (isNaN(val) || val < 1 || val > 8) {
                    alert("Please enter a valid number of members between 1 and 8.");
                    return;
                }
                memberCount = val;
                currentStep = 2;
                renderStep();
            };
        } 
        else if (currentStep === 2) {
            let memberCardsHtml = "";
            for (let i = 0; i < memberCount; i++) {
                const prev = membersData[i] || { name: i === 0 ? "You" : `Member ${i + 1}`, age: 25, sex: "male", weight_kg: 70, height_cm: 170, allergies: [] };
                memberCardsHtml += `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <h4 style="margin-top: 0; margin-bottom: 15px; color: #10b981; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">👤 Person ${i + 1}</h4>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 6px;">Name</label>
                                <input type="text" class="member-name" data-index="${i}" required value="${prev.name}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 14px;" />
                            </div>
                            <div>
                                <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 6px;">Age</label>
                                <input type="number" class="member-age" data-index="${i}" required min="1" max="120" value="${prev.age}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 14px;" />
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 6px;">Sex</label>
                                <select class="member-sex" data-index="${i}" style="width: 100%; padding: 10px; background: rgba(30,40,50,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 14px;">
                                    <option value="male" ${prev.sex === "male" ? "selected" : ""}>Male</option>
                                    <option value="female" ${prev.sex === "female" ? "selected" : ""}>Female</option>
                                    <option value="other" ${prev.sex === "other" ? "selected" : ""}>Other</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 6px;">Weight (kg)</label>
                                <input type="number" class="member-weight" data-index="${i}" required min="10" max="300" step="0.1" value="${prev.weight_kg}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 14px;" />
                            </div>
                            <div>
                                <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 6px;">Height (cm)</label>
                                <input type="number" class="member-height" data-index="${i}" required min="50" max="250" value="${prev.height_cm}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 14px;" />
                            </div>
                        </div>

                        <div>
                            <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 6px;">Allergies</label>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 12px;">
                                ${["gluten", "dairy", "nuts", "eggs", "soy", "shellfish", "fish"].map(allergy => {
                                    const checked = prev.allergies.includes(allergy) ? "checked" : "";
                                    return `
                                        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
                                            <input type="checkbox" class="member-allergy" data-index="${i}" value="${allergy}" ${checked} style="width:14px; height:14px; margin: 0;" />
                                            ${allergy}
                                        </label>
                                    `;
                                }).join("")}
                            </div>
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <h3 style="margin-top: 0; margin-bottom: 10px; font-weight: 600; color: #3b82f6;">Step 2: Household Members Details</h3>
                <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin-bottom: 20px;">Provide basic biometrics so we can calculate initial macro guidelines.</p>
                
                <form id="step2Form">
                    <div style="max-height: 48vh; overflow-y: auto; padding-right: 5px; margin-bottom: 20px;">
                        ${memberCardsHtml}
                    </div>

                    <div style="display: flex; gap: 15px;">
                        <button type="button" id="step2BackBtn" class="btn-secondary" style="flex: 1; padding: 12px; font-size: 15px;">← Back</button>
                        <button type="submit" class="btn-primary" style="flex: 2; padding: 12px; font-size: 15px;">Calculate Macro Targets →</button>
                    </div>
                </form>
            `;

            document.getElementById("step2BackBtn").onclick = () => {
                currentStep = 1;
                renderStep();
            };

            document.getElementById("step2Form").onsubmit = (e) => {
                e.preventDefault();
                membersData = [];

                const names = Array.from(card.querySelectorAll(".member-name")).map(el => el.value.trim());
                const ages = Array.from(card.querySelectorAll(".member-age")).map(el => parseInt(el.value));
                const sexes = Array.from(card.querySelectorAll(".member-sex")).map(el => el.value);
                const weights = Array.from(card.querySelectorAll(".member-weight")).map(el => parseFloat(el.value));
                const heights = Array.from(card.querySelectorAll(".member-height")).map(el => parseFloat(el.value));

                for (let i = 0; i < memberCount; i++) {
                    if (!names[i]) {
                        alert(`Please enter a name for Person ${i + 1}`);
                        return;
                    }

                    // Extract checked allergies
                    const allergyChecks = card.querySelectorAll(`.member-allergy[data-index="${i}"]:checked`);
                    const allergies = Array.from(allergyChecks).map(el => el.value);

                    // MIFFLIN-ST JEOR PRE-CALCULATIONS
                    const weight = weights[i];
                    const height = heights[i];
                    const age = ages[i];
                    const sex = sexes[i];

                    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + (sex === "male" ? 5 : sex === "female" ? -161 : -78);
                    const calories = Math.round(bmr * 1.375); // active baseline multiplier
                    const protein = Math.round((calories * 0.30) / 4);
                    const carbs = Math.round((calories * 0.40) / 4);
                    const fat = Math.round((calories * 0.30) / 9);

                    membersData.push({
                        name: names[i],
                        age: age,
                        sex: sex,
                        weight_kg: weight,
                        height_cm: height,
                        allergies: allergies,
                        macro_goals: {
                            calories: calories,
                            protein_g: protein,
                            carbs_g: carbs,
                            fat_g: fat
                        }
                    });
                }

                currentStep = 3;
                renderStep();
            };
        } 
        else if (currentStep === 3) {
            let memberMacrosHtml = "";
            membersData.forEach((m, i) => {
                memberMacrosHtml += `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <h4 style="margin-top: 0; margin-bottom: 15px; color: #3b82f6; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">📊 Target Macros for ${m.name}</h4>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 6px;">Daily Calories (kcal)</label>
                                <input type="number" class="macro-calories" data-index="${i}" required min="500" max="10000" value="${m.macro_goals.calories}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 14px;" />
                            </div>
                            <div>
                                <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 6px;">Protein (g)</label>
                                <input type="number" class="macro-protein" data-index="${i}" required min="10" max="500" value="${m.macro_goals.protein_g}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 14px;" />
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 6px;">Carbohydrates (g)</label>
                                <input type="number" class="macro-carbs" data-index="${i}" required min="10" max="1000" value="${m.macro_goals.carbs_g}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 14px;" />
                            </div>
                            <div>
                                <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 6px;">Fats (g)</label>
                                <input type="number" class="macro-fats" data-index="${i}" required min="5" max="300" value="${m.macro_goals.fat_g}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 14px;" />
                            </div>
                        </div>
                    </div>
                `;
            });

            card.innerHTML = `
                <h3 style="margin-top: 0; margin-bottom: 10px; font-weight: 600; color: #10b981;">Step 3: Review & Customise Macro Targets</h3>
                <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin-bottom: 20px;">We pre-filled target fields with Mifflin-St Jeor estimates. Adjust them as you wish.</p>
                
                <form id="step3Form">
                    <div style="max-height: 48vh; overflow-y: auto; padding-right: 5px; margin-bottom: 20px;">
                        ${memberMacrosHtml}
                    </div>

                    <div style="display: flex; gap: 15px;">
                        <button type="button" id="step3BackBtn" class="btn-secondary" style="flex: 1; padding: 12px; font-size: 15px;">← Back</button>
                        <button type="submit" id="onboardingSubmitBtn" class="btn-success" style="flex: 2; padding: 12px; font-size: 15px; font-weight: 700;">Complete Setup & Start Planning! 🎉</button>
                    </div>
                </form>
            `;

            document.getElementById("step3BackBtn").onclick = () => {
                currentStep = 2;
                renderStep();
            };

            document.getElementById("step3Form").onsubmit = (e) => {
                e.preventDefault();

                const caloriesVals = Array.from(card.querySelectorAll(".macro-calories")).map(el => parseInt(el.value));
                const proteinVals = Array.from(card.querySelectorAll(".macro-protein")).map(el => parseFloat(el.value));
                const carbsVals = Array.from(card.querySelectorAll(".macro-carbs")).map(el => parseFloat(el.value));
                const fatVals = Array.from(card.querySelectorAll(".macro-fats")).map(el => parseFloat(el.value));

                for (let i = 0; i < memberCount; i++) {
                    membersData[i].macro_goals = {
                        calories: caloriesVals[i],
                        protein_g: proteinVals[i],
                        carbs_g: carbsVals[i],
                        fat_g: fatVals[i]
                    };
                }

                currentStep = 4;
                renderStep();
            };
        }
        else if (currentStep === 4) {
            let packsHtml = "";
            STARTER_PACKS.forEach((pack, idx) => {
                const previewNames = pack.items.slice(0, 3).map(i => i.name).join(", ");
                packsHtml += `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 15px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong style="color: #fff; font-size: 14px;">${pack.name}</strong>
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12px; color: #10b981; margin: 0;">
                                <input type="checkbox" class="onboarding-pack-checkbox" data-index="${idx}" style="width: 16px; height: 16px; margin: 0;" /> Select
                            </label>
                        </div>
                        <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.6);">${pack.description}</p>
                        <span style="font-size: 11px; color: rgba(255,255,255,0.4);">Preview: ${previewNames}...</span>
                    </div>
                `;
            });

            card.innerHTML = `
                <h3 style="margin-top: 0; margin-bottom: 10px; font-weight: 600; color: #10b981;">Step 4: Select Starter Packs (Optional)</h3>
                <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin-bottom: 20px;">Instantly stock your pantry with standard items. You can choose none, one, or more.</p>
                
                <form id="step4Form">
                    <div style="max-height: 48vh; overflow-y: auto; padding-right: 5px; margin-bottom: 20px;">
                        ${packsHtml}
                    </div>

                    <div style="display: flex; gap: 15px;">
                        <button type="button" id="step4BackBtn" class="btn-secondary" style="flex: 1; padding: 12px; font-size: 15px;">← Back</button>
                        <button type="submit" id="onboardingSubmitBtn" class="btn-success" style="flex: 2; padding: 12px; font-size: 15px; font-weight: 700;">Complete Setup & Start Planning! 🎉</button>
                    </div>
                </form>
            `;

            document.getElementById("step4BackBtn").onclick = () => {
                currentStep = 3;
                renderStep();
            };

            document.getElementById("step4Form").onsubmit = async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById("onboardingSubmitBtn");
                submitBtn.disabled = true;
                submitBtn.style.opacity = "0.7";

                try {
                    // 1. Setup household
                    await API.setupHousehold({ members: membersData });

                    // 2. Add selected starter packs staples
                    const selectedChecks = card.querySelectorAll(".onboarding-pack-checkbox:checked");
                    const staplesToSave = [];
                    selectedChecks.forEach(cb => {
                        const packIndex = parseInt(cb.dataset.index);
                        const pack = STARTER_PACKS[packIndex];
                        if (pack) {
                            pack.items.forEach(item => {
                                staplesToSave.push({
                                    id: `staple-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                                    name: item.name,
                                    category: item.category,
                                    quantity: item.quantity,
                                    unit: item.unit
                                });
                            });
                        }
                    });

                    if (staplesToSave.length > 0) {
                        await API.bulkSaveStaples(staplesToSave);
                    }

                    hideOnboardingOverlay();
                    showToast("Household setup complete! Welcome to your Dashboard.", "success");
                    await syncAllData();
                } catch (err) {
                    alert(`Failed to complete onboarding: ${err.message}`);
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = "1";
                }
            };
        }
    }

    renderStep();
}

window.showSettingsModal = function() {
    const modal = document.getElementById("settingsModal");
    const container = document.getElementById("settingsContainer");
    if (!modal || !container) return;

    container.innerHTML = "";

    if (!State.household || !State.household.members || State.household.members.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--color-text-light);">No household data found.</div>`;
        modal.classList.add("active");
        return;
    }

    State.household.members.forEach((member) => {
        const { calories, protein_g, carbs_g, fat_g } = member.macro_goals || { calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65 };

        const form = document.createElement("form");
        form.style.cssText = `
            background: var(--color-bg);
            border: 1px solid var(--color-border);
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        `;

        form.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--color-border); padding-bottom:8px; margin-bottom:5px;">
                <h4 style="margin:0; color: var(--color-primary); font-size:16px;">👤 ${member.name}</h4>
                <button type="submit" id="saveMemberBtn-${member.id}" class="btn-success" style="padding: 6px 12px; font-size: 12px; border-radius: 6px;">Save Changes</button>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-text-light); margin-bottom: 6px;">Name</label>
                    <input type="text" class="edit-name" required value="${member.name}" />
                </div>
                <div>
                    <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-text-light); margin-bottom: 6px;">Age</label>
                    <input type="number" class="edit-age" required min="1" max="120" value="${member.age}" />
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <div>
                    <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-text-light); margin-bottom: 6px;">Sex</label>
                    <select class="edit-sex" style="padding: 10px; border-radius: 6px; border: 1px solid var(--color-border); font-size: 14px; width: 100%;">
                        <option value="male" ${member.sex === "male" ? "selected" : ""}>Male</option>
                        <option value="female" ${member.sex === "female" ? "selected" : ""}>Female</option>
                        <option value="other" ${member.sex === "other" ? "selected" : ""}>Other</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-text-light); margin-bottom: 6px;">Weight (kg)</label>
                    <input type="number" class="edit-weight" required min="10" max="300" step="0.1" value="${member.weight_kg}" />
                </div>
                <div>
                    <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-text-light); margin-bottom: 6px;">Height (cm)</label>
                    <input type="number" class="edit-height" required min="50" max="250" value="${member.height_cm}" />
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border-top: 1px solid var(--color-border); padding-top: 15px;">
                <div>
                    <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-text-light); margin-bottom: 6px;">Daily Calories (kcal)</label>
                    <input type="number" class="edit-calories" required min="500" max="10000" value="${calories}" />
                </div>
                <div>
                    <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-text-light); margin-bottom: 6px;">Protein (g)</label>
                    <input type="number" class="edit-protein" required min="10" max="500" value="${protein_g}" />
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-text-light); margin-bottom: 6px;">Carbs (g)</label>
                    <input type="number" class="edit-carbs" required min="10" max="1000" value="${carbs_g}" />
                </div>
                <div>
                    <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-text-light); margin-bottom: 6px;">Fats (g)</label>
                    <input type="number" class="edit-fats" required min="5" max="300" value="${fat_g}" />
                </div>
            </div>

            <div style="border-top: 1px solid var(--color-border); padding-top: 15px;">
                <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-text-light); margin-bottom: 6px;">Allergies</label>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 12px; color: var(--color-text);">
                    ${["gluten", "dairy", "nuts", "eggs", "soy", "shellfish", "fish"].map(allergy => {
                        const checked = member.allergies.includes(allergy) ? "checked" : "";
                        return `
                            <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
                                <input type="checkbox" class="edit-allergy" value="${allergy}" ${checked} style="width:14px; height:14px; margin: 0;" />
                                ${allergy}
                            </label>
                        `;
                    }).join("")}
                </div>
            </div>
        `;

        form.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById(`saveMemberBtn-${member.id}`);
            btn.disabled = true;
            btn.textContent = "Saving...";

            const payload = {
                name: form.querySelector(".edit-name").value.trim(),
                age: parseInt(form.querySelector(".edit-age").value),
                sex: form.querySelector(".edit-sex").value,
                weight_kg: parseFloat(form.querySelector(".edit-weight").value),
                height_cm: parseFloat(form.querySelector(".edit-height").value),
                macro_goals: {
                    calories: parseInt(form.querySelector(".edit-calories").value),
                    protein_g: parseFloat(form.querySelector(".edit-protein").value),
                    carbs_g: parseFloat(form.querySelector(".edit-carbs").value),
                    fat_g: parseFloat(form.querySelector(".edit-fats").value)
                },
                allergies: Array.from(form.querySelectorAll(".edit-allergy:checked")).map(el => el.value)
            };

            try {
                await API.updateHouseholdMember(member.id, payload);
                showToast(`Saved changes for ${payload.name}!`, "success");
                btn.disabled = false;
                btn.textContent = "Save Changes";
                await syncAllData();
            } catch (err) {
                alert(`Failed to save member updates: ${err.message}`);
                btn.disabled = false;
                btn.textContent = "Save Changes";
            }
        };

        container.appendChild(form);
    });

    // Also display a button to trigger Starter Packs from Settings
    const starterPackBtn = document.createElement("button");
    starterPackBtn.className = "btn-secondary";
    starterPackBtn.textContent = "📦 Open Starter Packs Onboarding";
    starterPackBtn.style.cssText = "width: 100%; padding: 12px; margin-top: 10px; font-weight: 600; border-color: var(--color-primary); color: var(--color-primary);";
    starterPackBtn.onclick = () => {
        closeSettingsModal();
        const staplesTabBtn = document.querySelector(".tab-btn[data-tab='staples']");
        if (staplesTabBtn) {
            staplesTabBtn.click();
            const grid = document.getElementById("starterPacksGrid");
            if (grid) grid.scrollIntoView({ behavior: 'smooth' });
        }
    };
    container.appendChild(starterPackBtn);

    modal.classList.add("active");
};

window.closeSettingsModal = function() {
    const modal = document.getElementById("settingsModal");
    if (modal) modal.classList.remove("active");
};

// Close modal when clicking outside
document.addEventListener("click", function (e) {
    const modal = document.getElementById("settingsModal");
    if (modal && e.target === modal) closeSettingsModal();
});

// =========================
// 9. SYNCHRONISATION & INITIALISATION
// =========================

let isSyncing = false;

async function syncAllData() {
    if (isSyncing) return;
    isSyncing = true;
    try {
        console.log("Syncing all data from D1 database...");
        
        // 1. Verify Authentication
        const session = await API.checkSession();
        if (!session.authenticated) {
            API.showLoginOverlay();
            return;
        }
        State.user = session.user;

        // Show header logout button
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) logoutBtn.style.display = "block";

        // 2. Fetch all data in parallel
        const [plan, inventoryList, staplesList, recipesList, checkedList, householdRes, favouritesList, preferencesRes] = await Promise.all([
            API.getWeeklyPlan(State.weeklyPlan.weekLabel),
            API.getInventory(),
            API.getStaples(),
            API.getRecipes(),
            API.getShoppingChecks(State.weeklyPlan.weekLabel),
            API.getHousehold().catch(err => {
                console.log("No household setup yet:", err);
                return null;
            }),
            API.getFavourites().catch(err => {
                console.log("No favourites setup yet:", err);
                return [];
            }),
            API.getPreferences().catch(err => {
                console.log("No preferences setup yet:", err);
                return { preferred_supermarket: "Tesco", show_staples_in_list: true };
            })
        ]);

        if (recipesList && recipesList.length > 0) {
            recipeBank.length = 0;
            recipeBank.push(...recipesList);
        }

        // Store into centralised State
        if (plan && plan.days) {
            const parsedDays = [
                "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
            ].map(day => ({
                day,
                recipeId: null,
                recipeIds: [null, null, null, null, null]
            }));

            plan.days.forEach(item => {
                const parts = item.day.split("-");
                const dayName = parts[0];
                const slotIndex = parts[1] ? parseInt(parts[1]) : 0;
                const dayObj = parsedDays.find(d => d.day === dayName);
                if (dayObj) {
                    if (slotIndex >= 0 && slotIndex < 5) {
                        dayObj.recipeIds[slotIndex] = item.recipeId;
                        if (slotIndex === 0) {
                            dayObj.recipeId = item.recipeId;
                        }
                    }
                }
            });
            State.weeklyPlan = { weekLabel: plan.weekLabel, days: parsedDays };
        } else {
            const defaultPlan = structuredClone(defaultWeeklyPlan);
            defaultPlan.days.forEach(d => {
                d.recipeIds = [null, null, null, null, null];
            });
            State.weeklyPlan = defaultPlan;
        }

        State.inventory = inventoryList || [];
        State.staples = staplesList || [];
        State.shoppingChecks = checkedList.reduce((acc, c) => {
            acc[c.item_key] = c.is_checked === 1;
            return acc;
        }, {});
        State.household = householdRes;
        State.favourites = favouritesList || [];
        State.preferences = preferencesRes || { preferred_supermarket: "Tesco", show_staples_in_list: true };

        // Apply preferred supermarket label
        if (State.preferences && typeof updateSupermarketLabels === "function") {
            updateSupermarketLabels(State.preferences.preferred_supermarket || "Tesco");
        }

        // Toggle Settings button in header
        const settingsBtn = document.getElementById("settingsBtn");
        if (settingsBtn) {
            settingsBtn.style.display = State.household ? "block" : "none";
        }

        // Onboarding Check: If authenticated but no household, enforce onboarding overlay
        if (!State.household || !State.household.members || State.household.members.length === 0) {
            showOnboardingOverlay();
            isSyncing = false;
            return;
        } else {
            hideOnboardingOverlay();
        }

        // 3. Render all UI modules using new server data
        State.renderAll();

    } catch (err) {
        console.error("Synchronization failed:", err);
    } finally {
        isSyncing = false;
    }
}

function restoreShoppingCheckboxes() {
    document.querySelectorAll("#shoppingList .shop-item").forEach(itemEl => {
        const checkbox = itemEl.querySelector("input[type='checkbox']");
        if (!checkbox) return;
        const key = checkbox.getAttribute("data-item-key");
        if (key && State.shoppingChecks && State.shoppingChecks[key]) {
            checkbox.checked = true;
            itemEl.classList.add("checked");
        } else {
            checkbox.checked = false;
            itemEl.classList.remove("checked");
        }
    });
}

function showToast(message, type = "error") {
    const container = document.getElementById("toastContainer") || (() => {
        const c = document.createElement("div");
        c.id = "toastContainer";
        c.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 1000000;
            pointer-events: none;
        `;
        document.body.appendChild(c);
        return c;
    })();

    const toast = document.createElement("div");
    toast.style.cssText = `
        padding: 12px 20px;
        background: ${type === "error" ? "rgba(239, 68, 68, 0.9)" : "rgba(16, 185, 129, 0.9)"};
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid ${type === "error" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"};
        color: white;
        border-radius: 10px;
        font-family: 'Outfit', 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: auto;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    // Trigger reflow
    toast.offsetHeight;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-20px)";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

document.addEventListener("DOMContentLoaded", async () => {
    renderProfiles();

    // Inject custom CSS styling for spinner and checked items
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .checked {
        text-decoration: line-through;
        opacity: 0.6;
      }
    `;
    document.head.appendChild(style);

    // Initial server sync
    await syncAllData();

});

// ==========================================
// CSV / JSON IMPORT & EXPORT UTILITIES
// ==========================================

async function downloadCSV(url, filename) {
    try {
        const response = await fetch(url, { credentials: "include" });
        if (!response.ok) {
            if (response.status === 401) {
                API.showLoginOverlay();
                throw new Error("Unauthorized. Please log in.");
            }
            throw new Error("Download failed");
        }
        const text = await response.text();
        const blob = new Blob([text], { type: "text/csv" });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
    } catch (err) {
        console.error(err);
        alert(`Failed to download file: ${err.message}`);
    }
}

async function downloadFile(url, filename) {
    try {
        const response = await fetch(url, { credentials: "include" });
        if (!response.ok) {
            if (response.status === 401) {
                API.showLoginOverlay();
                throw new Error("Unauthorized. Please log in.");
            }
            throw new Error("Download failed");
        }
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
    } catch (err) {
        console.error(err);
        showToast(`Failed to download file: ${err.message}`, "error");
    }
}

window.toggleRecipeImportExportDropdown = function(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById("recipeImportExportDropdown");
    if (dropdown) {
        const isHidden = dropdown.style.display === "none";
        dropdown.style.display = isHidden ? "block" : "none";
    }
};

window.hideRecipeImportExportDropdown = function() {
    const dropdown = document.getElementById("recipeImportExportDropdown");
    if (dropdown) {
        dropdown.style.display = "none";
    }
};

// Close recipe dropdown when clicking outside
document.addEventListener("click", function (e) {
    const btn = document.getElementById("recipeImportExportBtn");
    const dropdown = document.getElementById("recipeImportExportDropdown");
    if (dropdown && btn && e.target !== btn && !btn.contains(e.target) && e.target !== dropdown && !dropdown.contains(e.target)) {
        hideRecipeImportExportDropdown();
    }
});

window.exportRecipesJSON = function(event) {
    if (event) event.preventDefault();
    downloadFile(`${API_BASE_URL}/api/recipes/export/json`, "recipes-export.json");
    hideRecipeImportExportDropdown();
};

window.exportRecipesCSV = function(event) {
    if (event) event.preventDefault();
    downloadFile(`${API_BASE_URL}/api/recipes/export/csv`, "recipes-export.csv");
    hideRecipeImportExportDropdown();
};

window.downloadRecipesCSVTemplate = function(event) {
    if (event) event.preventDefault();
    const csvContent = "# Note: Tags should be separated by semicolons (;) since comma is the CSV delimiter.\n" +
        "recipe_name,description,prep_time_mins,cook_time_mins,base_servings,min_servings,max_servings,cost_per_serving_gbp,tags,calories,protein_g,carbs_g,fat_g,ingredient_name,ingredient_qty,ingredient_unit,ingredient_category,ingredient_notes\n" +
        "Chicken Stir Fry,Quick weeknight meal,10,20,2,,4,1.75,high-protein;quick,480,42,35,10,chicken breast,150,g,protein,sliced\n" +
        "Chicken Stir Fry,Quick weeknight meal,10,20,2,,4,1.75,high-protein;quick,480,42,35,10,soy sauce,15,ml,pantry,\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recipes_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    hideRecipeImportExportDropdown();
};

window.triggerRecipeJSONImportPicker = function(event) {
    if (event) event.preventDefault();
    document.getElementById("recipeJsonImportPicker").click();
    hideRecipeImportExportDropdown();
};

window.triggerRecipeCSVImportPicker = function(event) {
    if (event) event.preventDefault();
    document.getElementById("recipeCsvImportPicker").click();
    hideRecipeImportExportDropdown();
};

let pendingImportRecipes = [];
let pendingImportFile = null;
let pendingImportType = ""; // "json" or "csv"

window.closeRecipeImportPreviewModal = function() {
    const modal = document.getElementById("recipeImportPreviewModal");
    if (modal) modal.classList.remove("active");
    pendingImportRecipes = [];
    pendingImportFile = null;
    pendingImportType = "";
};

window.handleRecipeJSONImport = async function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const data = JSON.parse(reader.result);
            if (!data || data.version !== "2.0" || !Array.isArray(data.recipes)) {
                alert("Failed to import: Unsupported or invalid recipe file structure. Requires version '2.0' and recipes array.");
                return;
            }

            pendingImportRecipes = data.recipes;
            pendingImportType = "json";
            showRecipeImportPreview();
        } catch (e) {
            console.error(e);
            alert("Failed to parse recipe JSON file. Make sure it's a valid JSON export.");
        }
    };
    reader.readAsText(file);
    event.target.value = "";
};

window.handleRecipeCSVImport = async function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const rows = parseClientRecipesCSV(reader.result);
            const { recipes, error } = reconstructRecipesFromCSVRows(rows);
            if (error) {
                alert(error);
                return;
            }
            if (recipes.length === 0) {
                alert("No recipes found in CSV file.");
                return;
            }

            pendingImportRecipes = recipes;
            pendingImportType = "csv";
            pendingImportFile = file;
            showRecipeImportPreview();
        } catch (e) {
            console.error(e);
            alert("Failed to parse recipe CSV file. Make sure it's a valid CSV export.");
        }
    };
    reader.readAsText(file);
    event.target.value = "";
};

function parseClientRecipesCSV(text) {
    const lines = [];
    let row = [];
    let cell = "";
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        
        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    cell += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                cell += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                row.push(cell);
                cell = "";
            } else if (char === '\n' || char === '\r') {
                row.push(cell);
                cell = "";
                if (row.length > 0) {
                    if (!row[0].startsWith("#")) {
                        lines.push(row);
                    }
                }
                row = [];
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
            } else {
                cell += char;
            }
        }
    }
    if (cell !== "" || row.length > 0) {
        row.push(cell);
        if (!row[0].startsWith("#")) {
            lines.push(row);
        }
    }
    return lines;
}

function reconstructRecipesFromCSVRows(rows) {
    if (rows.length < 2) return { recipes: [], error: "CSV file is empty or missing data." };
    
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const expectedHeaders = [
        "recipe_name", "base_servings", "calories", "protein_g", "carbs_g", "fat_g",
        "ingredient_name", "ingredient_qty", "ingredient_unit", "ingredient_category"
    ];
    const missing = expectedHeaders.filter(h => !headers.includes(h));
    if (missing.length > 0) {
        return { recipes: [], error: `Invalid CSV headers. Missing required columns: ${missing.join(", ")}` };
    }
    
    const recipeNameIdx = headers.indexOf("recipe_name");
    const descIdx = headers.indexOf("description");
    const prepIdx = headers.indexOf("prep_time_mins");
    const cookIdx = headers.indexOf("cook_time_mins");
    const baseServingsIdx = headers.indexOf("base_servings");
    const minServingsIdx = headers.indexOf("min_servings");
    const maxServingsIdx = headers.indexOf("max_servings");
    const costIdx = headers.indexOf("cost_per_serving_gbp");
    const tagsIdx = headers.indexOf("tags");
    const calIdx = headers.indexOf("calories");
    const proteinIdx = headers.indexOf("protein_g");
    const carbsIdx = headers.indexOf("carbs_g");
    const fatIdx = headers.indexOf("fat_g");
    const ingNameIdx = headers.indexOf("ingredient_name");
    const ingQtyIdx = headers.indexOf("ingredient_qty");
    const ingUnitIdx = headers.indexOf("ingredient_unit");
    const ingCatIdx = headers.indexOf("ingredient_category");
    const ingNotesIdx = headers.indexOf("ingredient_notes");

    const recipeMap = new Map();
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;
        
        const name = row[recipeNameIdx] ? row[recipeNameIdx].trim() : "";
        if (!name) continue;
        
        const key = name.toLowerCase();
        if (!recipeMap.has(key)) {
            const recipe = {
                name: name,
                description: descIdx !== -1 && row[descIdx] ? row[descIdx].trim() : "",
                prep_time_mins: prepIdx !== -1 && row[prepIdx] !== "" ? Number(row[prepIdx]) : 0,
                cook_time_mins: cookIdx !== -1 && row[cookIdx] !== "" ? Number(row[cookIdx]) : 0,
                base_servings: baseServingsIdx !== -1 && row[baseServingsIdx] !== "" ? Number(row[baseServingsIdx]) : null,
                min_servings: minServingsIdx !== -1 && row[minServingsIdx] !== "" ? Number(row[minServingsIdx]) : null,
                max_servings: maxServingsIdx !== -1 && row[maxServingsIdx] !== "" ? Number(row[maxServingsIdx]) : null,
                estimated_cost_per_serving_gbp: costIdx !== -1 && row[costIdx] !== "" ? Number(row[costIdx]) : null,
                tags: tagsIdx !== -1 && row[tagsIdx] ? row[tagsIdx].split(";").map(t => t.trim()).filter(Boolean) : [],
                macros_per_serving: {
                    calories: calIdx !== -1 && row[calIdx] !== "" ? Number(row[calIdx]) : null,
                    protein_g: proteinIdx !== -1 && row[proteinIdx] !== "" ? Number(row[proteinIdx]) : null,
                    carbs_g: carbsIdx !== -1 && row[carbsIdx] !== "" ? Number(row[carbsIdx]) : null,
                    fat_g: fatIdx !== -1 && row[fatIdx] !== "" ? Number(row[fatIdx]) : null
                },
                ingredients: []
            };
            recipeMap.set(key, recipe);
        }
        
        const recipe = recipeMap.get(key);
        const ingName = ingNameIdx !== -1 && row[ingNameIdx] ? row[ingNameIdx].trim() : "";
        if (ingName) {
            recipe.ingredients.push({
                name: ingName,
                quantity_per_serving: ingQtyIdx !== -1 && row[ingQtyIdx] !== "" ? Number(row[ingQtyIdx]) : null,
                unit: ingUnitIdx !== -1 && row[ingUnitIdx] ? row[ingUnitIdx].trim().toLowerCase() : "",
                category: ingCatIdx !== -1 && row[ingCatIdx] ? row[ingCatIdx].trim().toLowerCase() : "",
                notes: ingNotesIdx !== -1 && row[ingNotesIdx] ? row[ingNotesIdx].trim() : ""
            });
        }
    }
    
    return { recipes: Array.from(recipeMap.values()), error: null };
}

function validateRecipeClient(recipe) {
    const errors = [];
    if (!recipe.name || typeof recipe.name !== "string" || recipe.name.trim().length === 0) {
        errors.push("Recipe name is required.");
    }
    
    if (recipe.base_servings === undefined || recipe.base_servings === null || recipe.base_servings === "") {
        errors.push("base_servings is required.");
    } else {
        const baseServings = Number(recipe.base_servings);
        if (isNaN(baseServings) || baseServings <= 0) {
            errors.push("base_servings must be a positive number.");
        }
    }

    if (!recipe.macros_per_serving) {
        errors.push("macros_per_serving is required.");
    } else {
        const { calories, protein_g, carbs_g, fat_g } = recipe.macros_per_serving;
        if (calories === undefined || calories === null || calories === "" || isNaN(Number(calories)) || Number(calories) < 0) {
            errors.push("macros_per_serving.calories must be a positive number.");
        }
        if (protein_g === undefined || protein_g === null || protein_g === "" || isNaN(Number(protein_g)) || Number(protein_g) < 0) {
            errors.push("macros_per_serving.protein_g must be a positive number.");
        }
        if (carbs_g === undefined || carbs_g === null || carbs_g === "" || isNaN(Number(carbs_g)) || Number(carbs_g) < 0) {
            errors.push("macros_per_serving.carbs_g must be a positive number.");
        }
        if (fat_g === undefined || fat_g === null || fat_g === "" || isNaN(Number(fat_g)) || Number(fat_g) < 0) {
            errors.push("macros_per_serving.fat_g must be a positive number.");
        }
    }

    if (recipe.min_servings !== undefined && recipe.min_servings !== null && recipe.min_servings !== "") {
        const minS = Number(recipe.min_servings);
        if (isNaN(minS) || minS <= 0) {
            errors.push("min_servings must be a positive number.");
        }
    }
    if (recipe.max_servings !== undefined && recipe.max_servings !== null && recipe.max_servings !== "") {
        const maxS = Number(recipe.max_servings);
        if (isNaN(maxS) || maxS <= 0) {
            errors.push("max_servings must be a positive number.");
        }
    }

    if (recipe.min_servings !== undefined && recipe.min_servings !== null && recipe.min_servings !== "" &&
        recipe.max_servings !== undefined && recipe.max_servings !== null && recipe.max_servings !== "") {
        const minS = Number(recipe.min_servings);
        const maxS = Number(recipe.max_servings);
        if (!isNaN(minS) && !isNaN(maxS) && minS > maxS) {
            errors.push(`min_servings (${minS}) must be ≤ max_servings (${maxS}).`);
        }
    }

    if (recipe.prep_time_mins !== undefined && recipe.prep_time_mins !== null && recipe.prep_time_mins !== "") {
        if (isNaN(Number(recipe.prep_time_mins)) || Number(recipe.prep_time_mins) < 0) {
            errors.push("prep_time_mins must be a positive number.");
        }
    }
    if (recipe.cook_time_mins !== undefined && recipe.cook_time_mins !== null && recipe.cook_time_mins !== "") {
        if (isNaN(Number(recipe.cook_time_mins)) || Number(recipe.cook_time_mins) < 0) {
            errors.push("cook_time_mins must be a positive number.");
        }
    }
    if (recipe.estimated_cost_per_serving_gbp !== undefined && recipe.estimated_cost_per_serving_gbp !== null && recipe.estimated_cost_per_serving_gbp !== "") {
        if (isNaN(Number(recipe.estimated_cost_per_serving_gbp)) || Number(recipe.estimated_cost_per_serving_gbp) < 0) {
            errors.push("estimated_cost_per_serving_gbp must be a positive number.");
        }
    }

    const ALLOWED_UNITS = new Set(["g", "kg", "ml", "l", "piece", "pack", "tin", "jar", "loaf", "box", "tbsp", "tsp", "whole", "pcs"]);

    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
        errors.push("At least one ingredient is required.");
    } else {
        recipe.ingredients.forEach((ing, i) => {
            const idx = i + 1;
            if (!ing.name || typeof ing.name !== "string" || ing.name.trim().length === 0) {
                errors.push(`Ingredient #${idx}: name is required.`);
            }
            if (ing.quantity_per_serving === undefined || ing.quantity_per_serving === null || ing.quantity_per_serving === "") {
                errors.push(`Ingredient #${idx} (${ing.name || "unnamed"}): quantity_per_serving is required.`);
            } else {
                const qty = Number(ing.quantity_per_serving);
                if (isNaN(qty) || qty <= 0) {
                    errors.push(`Ingredient #${idx} (${ing.name || "unnamed"}): quantity_per_serving must be a positive number.`);
                }
            }
            const unit = (ing.unit || "").trim().toLowerCase();
            if (!ALLOWED_UNITS.has(unit)) {
                errors.push(`Ingredient #${idx} (${ing.name || "unnamed"}): unit "${unit}" is invalid. Valid options are: ${Array.from(ALLOWED_UNITS).join(", ")}`);
            }
            if (!ing.category || typeof ing.category !== "string" || ing.category.trim().length === 0) {
                errors.push(`Ingredient #${idx} (${ing.name || "unnamed"}): category is required.`);
            }
        });
    }

    return errors;
}

function showRecipeImportPreview() {
    const modal = document.getElementById("recipeImportPreviewModal");
    const summaryText = document.getElementById("recipeImportPreviewSummary");
    const listContainer = document.getElementById("recipeImportPreviewList");
    const errorContainer = document.getElementById("recipeImportErrorContainer");
    const errorList = document.getElementById("recipeImportErrorList");
    const confirmBtn = document.getElementById("recipeImportConfirmBtn");

    listContainer.innerHTML = "";
    errorList.innerHTML = "";
    errorContainer.style.display = "none";

    let newCount = 0;
    let updateCount = 0;
    let invalidCount = 0;

    const validRecipes = [];

    pendingImportRecipes.forEach(recipe => {
        const errors = validateRecipeClient(recipe);
        const li = document.createElement("li");

        if (errors.length > 0) {
            invalidCount++;
            li.style.color = "var(--color-danger, #f87171)";
            li.innerHTML = `❌ <strong>${recipe.name || "Unnamed Recipe"}</strong> (invalid: ${errors.join(", ")})`;
            listContainer.appendChild(li);
        } else {
            validRecipes.push(recipe);
            const isUpdate = recipeBank.some(r => r.is_custom && r.name.trim().toLowerCase() === recipe.name.trim().toLowerCase());
            if (isUpdate) {
                updateCount++;
                li.style.color = "var(--color-warning, #fbbf24)";
                li.innerHTML = `⚠️ <strong>${recipe.name}</strong> (will be updated)`;
            } else {
                newCount++;
                li.style.color = "var(--color-success, #34d399)";
                li.innerHTML = `✅ <strong>${recipe.name}</strong> (new)`;
            }
            listContainer.appendChild(li);
        }
    });

    summaryText.textContent = `Found ${pendingImportRecipes.length} recipes — ${newCount} new, ${updateCount} will be updated${invalidCount > 0 ? `, ${invalidCount} invalid` : ""}.`;

    if (invalidCount > 0) {
        errorContainer.style.display = "block";
        pendingImportRecipes.forEach(recipe => {
            const errors = validateRecipeClient(recipe);
            if (errors.length > 0) {
                const li = document.createElement("li");
                li.innerHTML = `<strong>${recipe.name || "Unnamed Recipe"}:</strong> ${errors.join("; ")}`;
                errorList.appendChild(li);
            }
        });
    }

    if (validRecipes.length > 0) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.onclick = async () => {
            confirmBtn.disabled = true;
            confirmBtn.style.opacity = "0.7";
            confirmBtn.textContent = "Importing...";
            
            try {
                let res;
                if (pendingImportType === "json") {
                    res = await API.importRecipesJSON({
                        version: "2.0",
                        recipes: validRecipes
                    });
                } else {
                    const formData = new FormData();
                    formData.append("file", pendingImportFile);
                    res = await API.importRecipesCSV(formData);
                }

                if (res.errors && res.errors.length > 0) {
                    errorContainer.style.display = "block";
                    errorList.innerHTML = "";
                    res.errors.forEach(err => {
                        const li = document.createElement("li");
                        li.innerHTML = `<strong>${err.recipe}:</strong> ${err.errors.join("; ")}`;
                        errorList.appendChild(li);
                    });
                    confirmBtn.disabled = false;
                    confirmBtn.style.opacity = "1";
                    confirmBtn.textContent = "Confirm Import ✅";
                    showToast(`Import completed with errors.`, "error");
                } else {
                    closeRecipeImportPreviewModal();
                    await syncAllData();
                    showToast(`Imported ${res.imported + res.updated} recipes (${res.imported} new, ${res.updated} updated)`, "success");
                }
            } catch (err) {
                console.error(err);
                errorContainer.style.display = "block";
                errorList.innerHTML = `<li>Server Error: ${err.message || "Failed to submit import request."}</li>`;
                confirmBtn.disabled = false;
                confirmBtn.style.opacity = "1";
                confirmBtn.textContent = "Confirm Import ✅";
            }
        };
    } else {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.5";
        confirmBtn.onclick = null;
    }

    modal.classList.add("active");
}

window.exportFullJSONBackup = async function() {
    try {
        const data = await API.request("/api/export");
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `mealplanner-backup-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        alert(`Failed to export backup: ${err.message}`);
    }
};

window.exportStaplesCSV = function() {
    downloadCSV(`${API_BASE_URL}/api/export/staples.csv`, "staples.csv");
};

window.exportInventoryCSV = function() {
    downloadCSV(`${API_BASE_URL}/api/export/inventory.csv`, "inventory.csv");
};

window.triggerJSONImportPicker = function() {
    document.getElementById("jsonBackupImportPicker").click();
};

window.triggerStaplesCSVImportPicker = function() {
    document.getElementById("csvStaplesImportPicker").click();
};

window.triggerInventoryCSVImportPicker = function() {
    document.getElementById("csvInventoryImportPicker").click();
};

window.handleJSONBackupImport = async function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const data = JSON.parse(reader.result);
            if (!data.version || data.version !== "1.0") {
                alert("Failed to import JSON: Unsupported backup version. Only version '1.0' is supported.");
                return;
            }

            const res = await API.importBackup(data);
            if (res.success) {
                alert(`Import successful!\nImported: ${res.staplesCount} staples, ${res.inventoryCount} inventory items, ${res.recipesCount} recipes.`);
                await syncAllData();
            }
        } catch (e) {
            console.error(e);
            alert("Failed to parse JSON backup. Make sure it's a valid JSON export.");
        }
    };
    reader.readAsText(file);
    event.target.value = "";
};

window.downloadStaplesCSVTemplate = function(event) {
    if (event) event.preventDefault();
    const csvContent = "name,category,quantity,unit\nWhole milk,dairy,4,l\nFree range eggs,protein,12,pcs\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staples_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

window.downloadInventoryCSVTemplate = function(event) {
    if (event) event.preventDefault();
    const csvContent = "name,category,quantity,unit\nChicken breast fillets,protein,1.5,kg\nBasmati rice,carbs,1,kg\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const expectedHeaders = ["name", "category", "quantity", "unit"];
    
    const missing = expectedHeaders.filter(h => !headers.includes(h));
    if (missing.length > 0) {
        throw new Error(`Invalid CSV headers. Missing required columns: ${missing.join(", ")}`);
    }

    const items = [];
    for (let idx = 1; idx < lines.length; idx++) {
        const line = lines[idx].trim();
        if (!line) continue;

        const values = [];
        let current = "";
        let inQuotes = false;
        for (let charIdx = 0; charIdx < line.length; charIdx++) {
            const char = line[charIdx];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] !== undefined ? values[index].replace(/^"|"$/g, '').trim() : "";
        });

        if (!row.name) {
            throw new Error(`Row ${idx + 1}: Name is required.`);
        }
        if (!row.category) {
            throw new Error(`Row ${idx + 1}: Category is required for item "${row.name}".`);
        }
        const qty = parseFloat(row.quantity);
        if (isNaN(qty) || qty <= 0) {
            throw new Error(`Row ${idx + 1}: Quantity must be a positive number for item "${row.name}".`);
        }
        if (!row.unit) {
            throw new Error(`Row ${idx + 1}: Unit is required for item "${row.name}".`);
        }

        items.push({
            name: row.name,
            category: row.category.toLowerCase(),
            quantity: qty,
            unit: row.unit.toLowerCase()
        });
    }
    return items;
}

let pendingCSVType = "";
let pendingCSVItems = [];

window.handleCSVImport = function(event, type) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function() {
        try {
            const parsed = parseCSV(reader.result);
            if (parsed.length === 0) {
                alert("The CSV file is empty.");
                return;
            }

            pendingCSVType = type;
            pendingCSVItems = parsed;

            const modal = document.getElementById("csvPreviewModal");
            const subtitle = document.getElementById("csvPreviewSubtitle");
            const tableBody = document.getElementById("csvPreviewTableBody");
            const confirmBtn = document.getElementById("csvPreviewConfirmBtn");

            subtitle.textContent = `Found ${parsed.length} valid rows for ${type}. Please review them before uploading to D1.`;
            tableBody.innerHTML = "";

            parsed.forEach(item => {
                const tr = document.createElement("tr");
                tr.style.borderBottom = "1px solid var(--color-border)";
                tr.innerHTML = `
                    <td style="padding: 10px;">${item.name}</td>
                    <td style="padding: 10px; text-transform: capitalize;">${item.category}</td>
                    <td style="padding: 10px; text-align: right;">${item.quantity}</td>
                    <td style="padding: 10px;">${item.unit}</td>
                `;
                tableBody.appendChild(tr);
            });

            confirmBtn.onclick = async () => {
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = "0.7";
                try {
                    if (pendingCSVType === "staples") {
                        await API.bulkSaveStaples(pendingCSVItems);
                        alert(`Successfully uploaded ${pendingCSVItems.length} staples to D1!`);
                        await syncStaples();
                        renderStaples();
                        recomputeShoppingData();
                    } else {
                        await API.bulkSaveInventory(pendingCSVItems);
                        alert(`Successfully uploaded ${pendingCSVItems.length} inventory items to D1!`);
                        await syncInventory();
                        renderInventory();
                    }
                    closeCSVPreviewModal();
                } catch (err) {
                    alert(`Failed to save bulk items: ${err.message}`);
                } finally {
                    confirmBtn.disabled = false;
                    confirmBtn.style.opacity = "1";
                }
            };

            modal.classList.add("active");
        } catch (e) {
            console.error(e);
            alert(`CSV Parsing Error:\n${e.message}`);
        }
    };
    reader.readAsText(file);
    event.target.value = "";
};

window.closeCSVPreviewModal = function() {
    const modal = document.getElementById("csvPreviewModal");
    if (modal) modal.classList.remove("active");
    pendingCSVItems = [];
    pendingCSVType = "";
};

// ==========================================
// STARTER PACKS DEFINITION & ONBOARDING
// ==========================================

const STARTER_PACKS = [
    {
        id: "pack-uk-pantry",
        name: "🧂 Standard UK Pantry",
        description: "Oils, vinegars, dried pasta, rice, tinned tomatoes, stock cubes, spices",
        items: [
            { name: "Rapeseed oil", category: "pantry", quantity: 1, unit: "l" },
            { name: "Olive oil", category: "pantry", quantity: 500, unit: "ml" },
            { name: "Malt vinegar", category: "pantry", quantity: 350, unit: "ml" },
            { name: "Penne pasta", category: "carbs", quantity: 1, unit: "kg" },
            { name: "Basmati rice", category: "carbs", quantity: 1, unit: "kg" },
            { name: "Chopped tomatoes", category: "pantry", quantity: 4, unit: "tin" },
            { name: "Chicken stock cubes", category: "pantry", quantity: 1, unit: "pack" },
            { name: "Table salt", category: "pantry", quantity: 500, unit: "g" },
            { name: "Black pepper", category: "pantry", quantity: 100, unit: "g" },
            { name: "Dried oregano", category: "pantry", quantity: 50, unit: "g" },
            { name: "Smoked paprika", category: "pantry", quantity: 50, unit: "g" },
            { name: "Garlic granules", category: "pantry", quantity: 50, unit: "g" }
        ]
    },
    {
        id: "pack-gym-basics",
        name: "🏋️ Gym Kitchen Basics",
        description: "Protein powder, oats, rice cakes, peanut butter, Greek yoghurt",
        items: [
            { name: "Whey protein powder", category: "protein", quantity: 1, unit: "kg" },
            { name: "Porridge oats", category: "carbs", quantity: 1, unit: "kg" },
            { name: "White rice cakes", category: "carbs", quantity: 2, unit: "pack" },
            { name: "Peanut butter", category: "pantry", quantity: 400, unit: "g" },
            { name: "Greek yogurt", category: "dairy", quantity: 1, unit: "kg" },
            { name: "Eggs", category: "protein", quantity: 12, unit: "pcs" },
            { name: "Frozen broccoli", category: "produce", quantity: 1, unit: "kg" },
            { name: "Chicken breast", category: "protein", quantity: 1, unit: "kg" }
        ]
    },
    {
        id: "pack-baking-essentials",
        name: "🍞 Baking Essentials",
        description: "Flour, sugar, baking powder, butter, eggs, vanilla",
        items: [
            { name: "Plain flour", category: "pantry", quantity: 1.5, unit: "kg" },
            { name: "Caster sugar", category: "pantry", quantity: 1, unit: "kg" },
            { name: "Baking powder", category: "pantry", quantity: 150, unit: "g" },
            { name: "Unsalted butter", category: "dairy", quantity: 250, unit: "g" },
            { name: "Eggs", category: "protein", quantity: 6, unit: "pcs" },
            { name: "Vanilla extract", category: "pantry", quantity: 100, unit: "ml" },
            { name: "Cacao powder", category: "pantry", quantity: 250, unit: "g" }
        ]
    },
    {
        id: "pack-tins-jars",
        name: "🥫 Tins & Jars",
        description: "Chickpeas, kidney beans, coconut milk, chopped tomatoes, lentils",
        items: [
            { name: "Canned chickpeas", category: "protein", quantity: 3, unit: "tin" },
            { name: "Red kidney beans", category: "protein", quantity: 3, unit: "tin" },
            { name: "Light coconut milk", category: "pantry", quantity: 400, unit: "ml" },
            { name: "Chopped tomatoes", category: "pantry", quantity: 4, unit: "tin" },
            { name: "Green lentils", category: "protein", quantity: 500, unit: "g" },
            { name: "Canned sweetcorn", category: "produce", quantity: 3, unit: "tin" }
        ]
    }
];

window.renderStarterPacks = function() {
    const grid = document.getElementById("starterPacksGrid");
    if (!grid) return;

    grid.innerHTML = "";
    STARTER_PACKS.forEach(pack => {
        const card = document.createElement("div");
        card.style.cssText = `
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        
        card.onmouseover = () => {
            card.style.borderColor = "var(--color-primary)";
            card.style.background = "rgba(255, 255, 255, 0.05)";
        };
        card.onmouseout = () => {
            if (!card.classList.contains("selected")) {
                card.style.borderColor = "rgba(255, 255, 255, 0.06)";
                card.style.background = "rgba(255, 255, 255, 0.03)";
            }
        };

        const topRow = document.createElement("div");
        topRow.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        topRow.innerHTML = `
            <strong style="font-size: 14px; color: #fff;">${pack.name}</strong>
            <span style="font-size: 11px; background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 8px; color: var(--color-text-light);">${pack.items.length} items</span>
        `;

        const desc = document.createElement("p");
        desc.style.cssText = `
            margin: 0;
            font-size: 12px;
            color: var(--color-text-light);
            line-height: 1.4;
        `;
        desc.textContent = pack.description;

        const previewList = document.createElement("div");
        previewList.style.cssText = `
            font-size: 11px;
            color: rgba(255,255,255,0.4);
            margin-top: 5px;
        `;
        const previewNames = pack.items.slice(0, 3).map(i => i.name).join(", ");
        previewList.textContent = `Preview: ${previewNames}...`;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "starter-pack-checkbox";
        checkbox.dataset.packId = pack.id;
        checkbox.style.cssText = `
            margin-left: auto;
            width: 16px;
            height: 16px;
            cursor: pointer;
        `;

        card.appendChild(topRow);
        card.appendChild(desc);
        card.appendChild(previewList);
        card.appendChild(checkbox);

        card.onclick = (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            if (checkbox.checked) {
                card.classList.add("selected");
                card.style.borderColor = "var(--color-primary)";
                card.style.background = "rgba(16, 185, 129, 0.05)";
            } else {
                card.classList.remove("selected");
                card.style.borderColor = "rgba(255, 255, 255, 0.06)";
                card.style.background = "rgba(255, 255, 255, 0.03)";
            }
        };

        grid.appendChild(card);
    });
};

window.addSelectedStarterPacks = async function() {
    const checkboxes = document.querySelectorAll(".starter-pack-checkbox:checked");
    if (checkboxes.length === 0) {
        alert("Please select at least one starter pack.");
        return;
    }

    const itemsToSave = [];
    checkboxes.forEach(cb => {
        const pack = STARTER_PACKS.find(p => p.id === cb.dataset.packId);
        if (pack) {
            pack.items.forEach(item => {
                itemsToSave.push({
                    id: `staple-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    name: item.name,
                    category: item.category,
                    quantity: item.quantity,
                    unit: item.unit
                });
            });
        }
    });

    try {
        await API.bulkSaveStaples(itemsToSave);
        alert(`Successfully added ${itemsToSave.length} staples from selected Starter Packs!`);
        await syncStaples();
        renderStaples();
        recomputeShoppingData();
        
        document.querySelectorAll(".starter-pack-checkbox").forEach(cb => {
            cb.checked = false;
            const card = cb.closest("div");
            if (card) {
                card.classList.remove("selected");
                card.style.borderColor = "rgba(255, 255, 255, 0.06)";
                card.style.background = "rgba(255, 255, 255, 0.03)";
            }
        });
    } catch (err) {
        alert(`Failed to add starter packs: ${err.message}`);
    }
};

// ==========================================
// 8. SETTINGS & PREFERENCES LOGIC
// ==========================================

function getSlotNames(count) {
    if (count === 1) return ["Dinner"];
    if (count === 2) return ["Lunch", "Dinner"];
    if (count === 3) return ["Breakfast", "Lunch", "Dinner"];
    if (count === 4) return ["Breakfast", "Lunch", "Snack", "Dinner"];
    return ["Breakfast", "Snack 1", "Lunch", "Snack 2", "Dinner"];
}

window.renderAccentSwatches = function() {
    const container = document.getElementById("accentSwatchesContainer");
    if (!container) return;
    container.innerHTML = "";
    
    const currentAccent = localStorage.getItem("accentColor") || "ocean";
    
    Object.entries(ACCENT_PALETTES).forEach(([key, value]) => {
        const swatch = document.createElement("div");
        swatch.className = `accent-swatch ${key === currentAccent ? "active" : ""}`;
        swatch.style.backgroundColor = value.primary;
        swatch.title = key.charAt(0).toUpperCase() + key.slice(1);
        swatch.onclick = () => {
            localStorage.setItem("accentColor", key);
            applyAccentColor();
            renderAccentSwatches();
            showToast(`Applied ${swatch.title} accent colour!`, "success");
        };
        container.appendChild(swatch);
    });
};

window.initSettingsPage = async function() {
    renderAccentSwatches();
    
    // Theme Selector
    const themeSelector = document.getElementById("themeSelector");
    if (themeSelector) {
        themeSelector.value = localStorage.getItem("theme") || "System";
        themeSelector.onchange = () => {
            localStorage.setItem("theme", themeSelector.value);
            applyTheme();
            showToast(`Theme changed to ${themeSelector.value}`, "success");
        };
    }

    // Card Density Toggles
    const densityToggles = document.getElementsByName("densityToggle");
    const currentDensity = localStorage.getItem("density") || "comfortable";
    densityToggles.forEach(toggle => {
        toggle.checked = (toggle.value === currentDensity);
        toggle.onchange = () => {
            if (toggle.checked) {
                localStorage.setItem("density", toggle.value);
                applyDensity();
                showToast(`Layout density set to ${toggle.value}`, "success");
            }
        };
    });

    // Week Starts On
    const weekStartToggles = document.getElementsByName("weekStartToggle");
    const currentWeekStart = localStorage.getItem("weekStartDay") || "Monday";
    weekStartToggles.forEach(toggle => {
        toggle.checked = (toggle.value === currentWeekStart);
        toggle.onchange = () => {
            if (toggle.checked) {
                localStorage.setItem("weekStartDay", toggle.value);
                populateMealPlans();
                showToast(`Week starts on ${toggle.value}`, "success");
            }
        };
    });

    // Meals Per Day
    const mealsPerDayInput = document.getElementById("mealsPerDayInput");
    if (mealsPerDayInput) {
        mealsPerDayInput.value = localStorage.getItem("mealsPerDay") || "1";
        mealsPerDayInput.onchange = () => {
            const val = parseInt(mealsPerDayInput.value);
            if (isNaN(val) || val < 1 || val > 5) {
                alert("Meals per day must be between 1 and 5.");
                mealsPerDayInput.value = localStorage.getItem("mealsPerDay") || "1";
                return;
            }
            localStorage.setItem("mealsPerDay", val);
            populateMealPlans();
            showToast(`Meals per day set to ${val}`, "success");
        };
    }

    // Household Summary Info
    const summaryDiv = document.getElementById("settingsHouseholdSummary");
    try {
        const household = await API.getHousehold();
        State.household = household;
        if (household && household.members && household.members.length > 0) {
            const memberNames = household.members.map(m => m.name).join(", ");
            summaryDiv.innerHTML = `
                <p style="margin: 0;"><strong>Household:</strong> ${household.members.length} members (${memberNames})</p>
            `;
        } else {
            summaryDiv.innerHTML = `<p style="margin: 0;">No household setup found. Setup via onboarding.</p>`;
        }
    } catch (err) {
        summaryDiv.innerHTML = `<p style="margin: 0; color: var(--color-danger);">Failed to load household details.</p>`;
    }

    // Preferences Fetch (Supermarket & Staples visibility)
    try {
        const prefs = await API.getPreferences();
        State.preferences = prefs;

        const supermarketSelector = document.getElementById("supermarketSelector");
        const showStaplesCheckbox = document.getElementById("showStaplesCheckbox");

        if (supermarketSelector) {
            supermarketSelector.value = prefs.preferred_supermarket || "Tesco";
            supermarketSelector.onchange = () => {
                saveServerPreferencesDebounced(supermarketSelector.value, showStaplesCheckbox ? showStaplesCheckbox.checked : true);
            };
        }

        if (showStaplesCheckbox) {
            showStaplesCheckbox.checked = prefs.show_staples_in_list;
            showStaplesCheckbox.onchange = () => {
                saveServerPreferencesDebounced(supermarketSelector ? supermarketSelector.value : "Tesco", showStaplesCheckbox.checked);
            };
        }

        updateSupermarketLabels(prefs.preferred_supermarket || "Tesco");

    } catch (err) {
        console.error("Failed to load preferences:", err);
    }
};

window.updateSupermarketLabels = function(supermarket) {
    const titleEl = document.querySelector("#shopping h2");
    if (titleEl) {
        titleEl.textContent = `${supermarket} Shopping List`;
    }
    const subtitleEl = document.querySelector("#shopping p");
    if (subtitleEl) {
        subtitleEl.textContent = `Ready to order online • Based on ${supermarket} prices • Week of Feb 3–9, 2026`;
    }
};

let preferencesTimeout = null;
window.saveServerPreferencesDebounced = function(supermarket, showStaples) {
    if (preferencesTimeout) clearTimeout(preferencesTimeout);
    
    const saveIndicator = document.getElementById("pref-save-indicator");
    if (saveIndicator) {
        saveIndicator.textContent = "Saving...";
        saveIndicator.style.opacity = "1";
    }
    
    preferencesTimeout = setTimeout(async () => {
        try {
            await API.updatePreferences({
                preferred_supermarket: supermarket,
                show_staples_in_list: showStaples
            });
            
            State.preferences = {
                preferred_supermarket: supermarket,
                show_staples_in_list: showStaples
            };
            
            recomputeShoppingData();
            updateSupermarketLabels(supermarket);
            
            if (saveIndicator) {
                saveIndicator.textContent = "Saved ✓";
                setTimeout(() => {
                    if (saveIndicator.textContent === "Saved ✓") {
                        saveIndicator.style.opacity = "0";
                    }
                }, 1500);
            }
        } catch (err) {
            console.error("Failed to save preferences:", err);
            if (saveIndicator) {
                saveIndicator.textContent = "Error saving";
            }
        }
    }, 500);
};

// ==========================================
// 8.1 DANGER ZONE OPERATIONS
// ==========================================

window.confirmDeleteAllCustomRecipes = async function() {
    const confirmed = confirm("Are you absolutely sure you want to delete ALL your custom recipes? This action is permanent and cannot be undone.");
    if (!confirmed) return;
    
    try {
        await API.deleteCustomRecipes();
        showToast("Wiped all custom recipes.", "success");
        await syncAllData();
    } catch (err) {
        alert(`Failed to delete custom recipes: ${err.message}`);
    }
};

window.confirmResetHousehold = async function() {
    const confirmed = confirm("Are you absolutely sure you want to reset your household? All members and macro targets will be cleared. This cannot be undone.");
    if (!confirmed) return;
    
    try {
        await API.resetHousehold();
        showToast("Household details reset successfully.", "success");
        await syncAllData();
    } catch (err) {
        alert(`Failed to reset household: ${err.message}`);
    }
};

window.openDeleteAccountModal = function() {
    const modal = document.getElementById("deleteAccountModal");
    const input = document.getElementById("deleteAccountConfirmInput");
    const btn = document.getElementById("deleteAccountConfirmBtn");
    
    if (!modal || !input || !btn) return;
    
    input.value = "";
    btn.disabled = true;
    
    input.oninput = () => {
        btn.disabled = (input.value.trim() !== "DELETE");
    };
    
    modal.classList.add("active");
};

window.closeDeleteAccountModal = function() {
    const modal = document.getElementById("deleteAccountModal");
    if (modal) modal.classList.remove("active");
};

window.handleDeleteAccount = async function() {
    try {
        await API.deleteAccount();
        showToast("Account deleted successfully. Goodbye!", "success");
        closeDeleteAccountModal();
        window.location.reload();
    } catch (err) {
        alert(`Failed to delete account: ${err.message}`);
    }
};

window.confirmAndClearWeekPlan = async function() {
    const confirmed = confirm("This will remove all meals from your current week plan. This cannot be undone. Are you sure?");
    if (!confirmed) return;
    
    const fallbackPlan = structuredClone(State.weeklyPlan);
    
    // Clear locally
    State.weeklyPlan.days.forEach(d => {
        d.recipeId = null;
        d.recipeIds = [null, null, null, null, null];
    });
    
    State.renderAll();
    
    try {
        await API.deleteWeeklyPlan(State.weeklyPlan.weekLabel);
        showToast("Weekly plan cleared successfully.", "success");
    } catch (err) {
        showToast("Failed to clear weekly plan. Changes rolled back.", "error");
        State.weeklyPlan = fallbackPlan;
        State.renderAll();
    }
};

