// =========================
// 0. DEBUG OVERLAY + TABS
// =========================

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

    // Tab switching
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
    };

    document.querySelectorAll(".tab-btn").forEach(button => {
        button.addEventListener("click", function (e) {
            e.preventDefault();
            switchTab(this.getAttribute("data-tab"));
        });
        button.addEventListener("touchstart", function (e) {
            e.preventDefault();
            switchTab(this.getAttribute("data-tab"));
        });
    });
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
        badge.style.cssText = `
            background: rgba(245, 158, 11, 0.12);
            border: 1px solid rgba(245, 158, 11, 0.25);
            color: #fbbf24;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 600;
            margin-top: 8px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            width: fit-content;
        `;
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
    collapsibleBtn.style.cssText = `
        width: 100%;
        margin-top: 8px;
        font-size: 11px;
        padding: 6px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 6px;
    `;
    collapsibleBtn.innerHTML = `<span>🧑‍🍳 Ingredients (${(recipe.ingredients || []).length})</span><span class="toggle-icon">▼</span>`;
    
    collapsibleList = document.createElement("div");
    collapsibleList.className = "card-ingredients-list";
    collapsibleList.style.cssText = `
        display: none;
        background: rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        padding: 10px;
        margin-top: 4px;
        max-height: 180px;
        overflow-y: auto;
        text-align: left;
        font-size: 11px;
    `;
    
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

    // Map to combine/aggregate staples to avoid duplication
    const staplesMap = new Map();

    // First, process recipe-derived ingredients
    combinedIngredients.forEach(ing => {
        const isStaple = stapleNames.has(ing.name.toLowerCase().trim());
        if (isStaple) {
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

    // Populate the staples category array
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
        container.innerHTML = `<span style="color: var(--color-text-light); font-size: 11px; padding: 6px 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; display: inline-block;">Set up your household in Settings to see portions</span>`;
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
        card.style.cssText = `
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 11px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 110px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        `;

        const labelText = members.length > 1 ? `<strong>👤 ${split.name}:</strong> ` : "";
        card.innerHTML = `
            <div>${labelText}${split.macros.calories} kcal</div>
            <div style="color: rgba(255,255,255,0.6); font-size: 10px; white-space: nowrap;">
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

    State.weeklyPlan.days.forEach((entry, index) => {
        const recipe = entry.recipeId ? getRecipeById(entry.recipeId) : null;
        const clone = template.content.cloneNode(true);

        const dayHeading = clone.querySelector("h3");
        if (dayHeading) dayHeading.textContent = entry.day;

        const mealName = clone.querySelector(".meal-name");
        const portionsContainer = clone.querySelector(".portions-container");
        const timeSpan = clone.querySelector(".recipe-time");
        const viewRecipeBtn = clone.querySelector(".view-recipe");
        const removeBtn = clone.querySelector(".remove-recipe");

        if (!recipe) {
            if (mealName) mealName.textContent = "No recipe selected";
            if (portionsContainer) portionsContainer.innerHTML = "";
            if (timeSpan) timeSpan.textContent = "N/A";
            if (viewRecipeBtn) viewRecipeBtn.disabled = true;
            if (removeBtn) removeBtn.style.display = "none";
        } else {
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
                viewRecipeBtn.disabled = false;
                viewRecipeBtn.onclick = () => showRecipeModal(recipe);
            }

            if (removeBtn) {
                removeBtn.style.display = "block";
                removeBtn.onclick = () => removeRecipeFromPlan(index);
            }

            setupRecipeCardIngredientsAndWarnings(clone.querySelector(".meal-item"), recipe, portionsContainer, viewRecipeBtn);
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
                
                const customBadge = document.createElement("div");
                customBadge.className = "custom-recipe-badge";
                customBadge.textContent = "Custom";
                customBadge.style.cssText = `
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    background: linear-gradient(135deg, #8e44ad, #9b59b6);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 9px;
                    font-weight: 600;
                    text-transform: uppercase;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    z-index: 10;
                `;
                card.appendChild(customBadge);
            }
        }

        // Show edit/delete icon controls on custom recipes owned by the logged-in user
        if (recipe.is_custom && State.user && recipe.created_by_user_id === State.user.id) {
            if (card) {
                const controlsContainer = document.createElement("div");
                controlsContainer.className = "recipe-card-controls";
                controlsContainer.style.cssText = `
                    position: absolute;
                    top: 8px;
                    right: 42px;
                    display: flex;
                    gap: 6px;
                    z-index: 15;
                `;
                
                const editBtn = document.createElement("button");
                editBtn.className = "card-control-btn edit-btn";
                editBtn.innerHTML = "✏️";
                editBtn.title = "Edit recipe";
                editBtn.style.cssText = `
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 50%;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 12px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                `;
                editBtn.onclick = (e) => {
                    e.stopPropagation();
                    showEditRecipeModal(recipe.id);
                };
                
                const deleteBtn = document.createElement("button");
                deleteBtn.className = "card-control-btn delete-btn";
                deleteBtn.innerHTML = "🗑️";
                deleteBtn.title = "Delete recipe";
                deleteBtn.style.cssText = `
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 50%;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 12px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                `;
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    deleteCustomRecipe(recipe.id, recipe.name);
                };

                editBtn.onmouseenter = () => editBtn.style.transform = "scale(1.15)";
                editBtn.onmouseleave = () => editBtn.style.transform = "scale(1)";
                deleteBtn.onmouseenter = () => deleteBtn.style.transform = "scale(1.15)";
                deleteBtn.onmouseleave = () => deleteBtn.style.transform = "scale(1)";
                
                controlsContainer.appendChild(editBtn);
                controlsContainer.appendChild(deleteBtn);
                card.appendChild(controlsContainer);
            }
        }

        if (badge) {
            if (usedDay) {
                badge.textContent = `In plan (${usedDay})`;
                badge.style.display = "inline-block";
                // Prevent overlap with custom edit/delete buttons if present
                if (recipe.is_custom && State.user && recipe.created_by_user_id === State.user.id) {
                    badge.style.right = "108px";
                } else {
                    badge.style.right = "42px";
                }
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

// Add/clear/remove dinners optimistically
async function addRecipeToPlan(recipeId) {
    if (!State.weeklyPlan || !Array.isArray(State.weeklyPlan.days)) {
        State.weeklyPlan = structuredClone(defaultWeeklyPlan);
    }

    const firstEmptyIndex = State.weeklyPlan.days.findIndex(d => !d.recipeId);
    if (firstEmptyIndex === -1) {
        alert("This week's plan is full (Monday–Sunday). Clear or edit it before adding more.");
        return;
    }

    // 1. Fallback for rollback
    const fallbackPlan = structuredClone(State.weeklyPlan);

    // 2. Mutate state optimistically
    State.weeklyPlan.days[firstEmptyIndex].recipeId = recipeId;
    
    // 3. Immediately re-render
    State.renderAll();

    // 4. Save to API in background
    try {
        await API.saveWeeklyPlan(State.weeklyPlan.weekLabel, State.weeklyPlan.days);
    } catch (err) {
        // 5. Rollback on failure
        showToast("Failed to save meal plan. Changes rolled back.", "error");
        State.weeklyPlan = fallbackPlan;
        State.renderAll();
    }
}

async function removeRecipeFromPlan(dayIndex) {
    if (!State.weeklyPlan || !Array.isArray(State.weeklyPlan.days)) return;

    // 1. Fallback for rollback
    const fallbackPlan = structuredClone(State.weeklyPlan);

    // 2. Mutate state optimistically
    State.weeklyPlan.days[dayIndex].recipeId = null;

    // 3. Immediately re-render
    State.renderAll();

    // 4. Save to API in background
    try {
        await API.saveWeeklyPlan(State.weeklyPlan.weekLabel, State.weeklyPlan.days);
    } catch (err) {
        // 5. Rollback on failure
        showToast("Failed to remove recipe. Changes rolled back.", "error");
        State.weeklyPlan = fallbackPlan;
        State.renderAll();
    }
}

async function clearWeeklyPlan() {
    const ok = confirm("Clear all planned dinners for this week?");
    if (!ok) return;

    // 1. Fallback for rollback
    const fallbackPlan = structuredClone(State.weeklyPlan);

    // 2. Mutate state optimistically
    State.weeklyPlan = structuredClone(defaultWeeklyPlan);

    // 3. Immediately re-render
    State.renderAll();

    // 4. Save to API in background
    try {
        await API.saveWeeklyPlan(State.weeklyPlan.weekLabel, State.weeklyPlan.days);
    } catch (err) {
        // 5. Rollback on failure
        showToast("Failed to clear week plan. Changes rolled back.", "error");
        State.weeklyPlan = fallbackPlan;
        State.renderAll();
    }
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

    <div class="instructions-list">
      <h4 style="color: var(--color-primary); margin-bottom: 15px;">📖 Instructions</h4>
      <ol>${instructionsHtml}</ol>
    </div>

    <div style="background: var(--color-primary-light); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 13px; color: var(--color-text);">
        <strong>💡 ${recipe.tips}</strong>
      </p>
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

            document.getElementById("step3Form").onsubmit = async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById("onboardingSubmitBtn");
                submitBtn.disabled = true;
                submitBtn.style.opacity = "0.7";

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

                try {
                    await API.setupHousehold({ members: membersData });
                    hideOnboardingOverlay();
                    showToast("Household setup complete! Welcome to your Dashboard.", "success");
                    await syncAllData();
                } catch (err) {
                    alert(`Failed to save household: ${err.message}`);
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
        const [plan, inventoryList, staplesList, recipesList, checkedList, householdRes, favouritesList] = await Promise.all([
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
            })
        ]);

        if (recipesList && recipesList.length > 0) {
            recipeBank.length = 0;
            recipeBank.push(...recipesList);
        }

        // Store into centralised State
        State.weeklyPlan = plan || structuredClone(defaultWeeklyPlan);
        State.inventory = inventoryList || [];
        State.staples = staplesList || [];
        State.shoppingChecks = checkedList.reduce((acc, c) => {
            acc[c.item_key] = c.is_checked === 1;
            return acc;
        }, {});
        State.household = householdRes;
        State.favourites = favouritesList || [];

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

    // Dynamic focus synching for multi-device freshness
    window.addEventListener("focus", async () => {
        console.log("Window focused - synchronizing state in background...");
        await syncAllData();
    });
});
