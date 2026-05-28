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

function loadWeeklyPlan() {
    return State.weeklyPlan;
}

function saveWeeklyPlan(plan) {
    State.weeklyPlan = plan;
    API.saveWeeklyPlan(plan.weekLabel, plan.days).catch(console.error);
}

// Initial local plan copy reference
let weeklyPlan = State.weeklyPlan;

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
    if (!Array.isArray(PROFILES)) return;

    const fabian = PROFILES.find(p => p.id === "fabian");
    const stef = PROFILES.find(p => p.id === "stefanie");

    if (fabian) {
        const activity = formatActivity(fabian.activityLevel);
        const meta = `${fabian.age}M • ${fabian.heightCm}cm • ${fabian.weightKg}kg • ${activity}`;
        const goalText = formatGoal(fabian);
        const { proteinGrams, carbsGrams, fatsGrams } = fabian.macroTargets;
        const { protein, carbs, fats } = fabian.macroDistributionPercent;

        document.getElementById("fabian-name").textContent = fabian.name;
        document.getElementById("fabian-meta").textContent = meta;
        document.getElementById("fabian-goal").textContent = goalText;
        document.getElementById("fabian-calories").textContent = fabian.dailyCaloriesTarget.toLocaleString();
        document.getElementById("fabian-protein").textContent = `${proteinGrams}g`;
        document.getElementById("fabian-carbs").textContent = `${carbsGrams}g`;
        document.getElementById("fabian-fats").textContent = `${fatsGrams}g`;

        document.getElementById("fabian-protein-label").textContent =
            `Protein: ${proteinGrams}g (${protein}%)`;
        document.getElementById("fabian-carbs-label").textContent =
            `Carbs: ${carbsGrams}g (${carbs}%)`;
        document.getElementById("fabian-fats-label").textContent =
            `Fats: ${fatsGrams}g (${fats}%)`;

        document.getElementById("fabian-protein-bar").style.width = `${protein}%`;
        document.getElementById("fabian-protein-bar").textContent = `${protein}%`;
        document.getElementById("fabian-carbs-bar").style.width = `${carbs}%`;
        document.getElementById("fabian-carbs-bar").textContent = `${carbs}%`;
        document.getElementById("fabian-fats-bar").style.width = `${fats}%`;
        document.getElementById("fabian-fats-bar").textContent = `${fats}%`;
    }

    if (stef) {
        const activity = formatActivity(stef.activityLevel);
        const meta = `${stef.age}F • ${stef.heightCm}cm • ${stef.weightKg}kg • ${activity}`;
        const goalText = formatGoal(stef);
        const { proteinGrams, carbsGrams, fatsGrams } = stef.macroTargets;
        const { protein, carbs, fats } = stef.macroDistributionPercent;

        document.getElementById("stef-name").textContent = stef.name;
        document.getElementById("stef-meta").textContent = meta;
        document.getElementById("stef-goal").textContent = goalText;
        document.getElementById("stef-calories").textContent = stef.dailyCaloriesTarget.toLocaleString();
        document.getElementById("stef-protein").textContent = `${proteinGrams}g`;
        document.getElementById("stef-carbs").textContent = `${carbsGrams}g`;
        document.getElementById("stef-fats").textContent = `${fatsGrams}g`;

        document.getElementById("stef-protein-label").textContent =
            `Protein: ${proteinGrams}g (${protein}%)`;
        document.getElementById("stef-carbs-label").textContent =
            `Carbs: ${carbsGrams}g (${carbs}%)`;
        document.getElementById("stef-fats-label").textContent =
            `Fats: ${fatsGrams}g (${fats}%)`;

        document.getElementById("stef-protein-bar").style.width = `${protein}%`;
        document.getElementById("stef-protein-bar").textContent = `${protein}%`;
        document.getElementById("stef-carbs-bar").style.width = `${carbs}%`;
        document.getElementById("stef-carbs-bar").textContent = `${carbs}%`;
        document.getElementById("stef-fats-bar").style.width = `${fats}%`;
        document.getElementById("stef-fats-bar").textContent = `${fats}%`;
    }
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
                await API.saveShoppingCheck(weeklyPlan.weekLabel, itemKey, isChecked).catch(console.error);
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
        other: []
    };

    function addIngredientToCategories(ing) {
        const category = ing.category || "other";
        const targetCategory = categories[category] ? category : "other";
        const label = ing.name;
        const qty = ing.quantity ?? 1;
        const unit = ing.unit ?? "";

        if (!categories[targetCategory]) {
            categories[targetCategory] = [];
        }

        categories[targetCategory].push({
            label,
            quantityText: `${qty} ${unit}`.trim(),
            category,
            unit
        });
    }

    // From weekly recipes
    combinedIngredients.forEach(addIngredientToCategories);

    // From weekly staples.json in localStorage
    const weeklyStaples = loadWeeklyStaples();
    weeklyStaples.forEach(staple => {
        addIngredientToCategories({
            name: staple.name,
            quantity: staple.quantity,
            unit: staple.unit,
            category: staple.category
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

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";

            const itemKey = `${item.category}::${item.label.toLowerCase()}::${(item.unit || "").toLowerCase()}`;
            checkbox.setAttribute("data-item-key", itemKey);

            const nameSpan = document.createElement("span");
            nameSpan.style.flex = "2";
            nameSpan.textContent = item.label;

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

    updateCostSummary();
}

// Placeholder summary while you have no catalog
function updateCostSummary() {
    const weeklyStaples = loadWeeklyStaples();
    const totalLines = combinedIngredients.length + weeklyStaples.length;
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

    const mealsCountEl = document.getElementById("dashboard-meals-count");
    const ingredientsCountEl = document.getElementById("dashboard-ingredients-count");
    const costEl = document.getElementById("dashboard-cost");
    const prepDaysEl = document.getElementById("dashboard-prep-days");

    if (mealsCountEl) mealsCountEl.textContent = `${plannedDinnersCount * 2}`; // 2 people
    if (ingredientsCountEl) ingredientsCountEl.textContent = `${totalIngredientsCount}`;
    if (costEl) costEl.textContent = `~£${estimatedCost.toFixed(0)}`;
    
    const uniqueRecipesCount = new Set(State.weeklyPlan.days.map(d => d.recipeId).filter(Boolean)).size;
    if (prepDaysEl) {
        prepDaysEl.textContent = uniqueRecipesCount > 0 ? `${Math.max(1, Math.min(2, uniqueRecipesCount))}` : "0";
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

    itemLabels.forEach((itemEl, index) => {
        const checkbox = itemEl.querySelector("input[type='checkbox']");
        const spans = itemEl.querySelectorAll("span");
        const name = spans[0]?.textContent.trim() || "";
        const qtyText = spans[1]?.textContent.trim() || "";
        const ingredient = combinedIngredients[index];

        let quantity = 1;
        let unit = "";
        if (qtyText) {
            const parts = qtyText.split(/\s+/);
            const maybeQty = parseFloat(parts[0].replace(",", "."));
            if (!maybeQty || isNaN(maybeQty)) {
                unit = qtyText;
            } else {
                quantity = maybeQty;
                unit = parts.slice(1).join(" ") || "";
            }
        }

        const isChecked = checkbox && checkbox.checked;

        if (!isChecked && name && quantity > 0) {
            const category = ingredient && ingredient.category ? ingredient.category : "other";
            const existing = currentInventory.find(
                inv =>
                    inv.name.toLowerCase() === name.toLowerCase() &&
                    inv.unit === unit &&
                    inv.category === category
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

        if (checkbox) {
            checkbox.checked = true;
            itemEl.classList.add("checked");
        }
    });

    await Promise.all(itemsToSave.map(item => API.saveInventoryItem(item)));
    await syncInventory();
    renderInventory();
    alert("Remaining shopping list items have been added to inventory.");
}

// =========================
// 6. WEEKLY PLAN: UI + ADD FROM RECIPE BANK
// =========================

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
        const fabianPortion = clone.querySelector(".fabian-portion");
        const stefPortion = clone.querySelector(".stef-portion");
        const timeSpan = clone.querySelector(".recipe-time");
        const viewRecipeBtn = clone.querySelector(".view-recipe");
        const removeBtn = clone.querySelector(".remove-recipe");

        if (!recipe) {
            if (mealName) mealName.textContent = "No recipe selected";
            if (fabianPortion) fabianPortion.textContent = "";
            if (stefPortion) stefPortion.textContent = "";
            if (timeSpan) timeSpan.textContent = "N/A";
            if (viewRecipeBtn) viewRecipeBtn.disabled = true;
            if (removeBtn) removeBtn.style.display = "none";
        } else {
            if (mealName) mealName.textContent = `${recipe.emoji} ${recipe.name}`;

            if (fabianPortion && recipe.fabiansPortion) {
                fabianPortion.innerHTML = `<strong>👤 Fabian:</strong> ${recipe.fabiansPortion.quantity}`;
            }
            if (stefPortion && recipe.stefaniesPortion) {
                stefPortion.innerHTML = `<strong>👩 Stefanie:</strong> ${recipe.stefaniesPortion.quantity}`;
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
        }

        container.appendChild(clone);
    });
}

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

    recipeBank.forEach(recipe => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector(".meal-item");
        if (card) {
            card.setAttribute("data-recipe-id", recipe.id);
        }

        const badge = clone.querySelector(".plan-badge");
        const mealName = clone.querySelector(".meal-name");
        const fabianPortion = clone.querySelector(".fabian-portion");
        const stefPortion = clone.querySelector(".stef-portion");
        const timeSpan = clone.querySelector(".recipe-time");
        const viewRecipeBtn = clone.querySelector(".view-recipe");
        const addToPlanBtn = clone.querySelector(".add-to-plan");

        if (mealName) mealName.textContent = `${recipe.emoji} ${recipe.name}`;

        if (fabianPortion && recipe.fabiansPortion) {
            fabianPortion.innerHTML = `<strong>👤 Fabian:</strong> ${recipe.fabiansPortion.quantity}`;
        }
        if (stefPortion && recipe.stefaniesPortion) {
            stefPortion.innerHTML = `<strong>👩 Stefanie:</strong> ${recipe.stefaniesPortion.quantity}`;
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

        const usedDay = usageById[recipe.id];

        if (badge) {
            if (usedDay) {
                badge.textContent = `In plan (${usedDay})`;
                badge.style.display = "inline-block";
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

                // KEY CHANGE: pass the button into the wrapper
                addToPlanBtn.onclick = (e) => addRecipeToPlanFromButton(e.currentTarget);
            }
        }

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

    let ingredientsHtml = "";

    for (const [category, items] of Object.entries(recipe.ingredients || {})) {
        if (!items || !items.length) continue;
        const label = categoryLabels[category] || category;
        const listItems = items
            .map(ing => {
                const qty = ing.quantity ?? 0;
                const unit = ing.unit ? ` ${ing.unit}` : "";
                return `<li>${qty}${unit} ${ing.name}</li>`;
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

    const fabiansPortionLines = Object.entries(recipe.fabiansPortion || {})
        .filter(([key]) => key !== "quantity")
        .map(([, val]) => `<li style="padding-left: 15px; padding-top: 4px;">• ${val}</li>`)
        .join("");

    const stefaniesPortionLines = Object.entries(recipe.stefaniesPortion || {})
        .filter(([key]) => key !== "quantity")
        .map(([, val]) => `<li style="padding-left: 15px; padding-top: 4px;">• ${val}</li>`)
        .join("");

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
          <div class="stat-value" style="color: white; font-size: 14px;">${recipe.servings}</div>
        </div>
      </div>
    </div>

    <div class="recipe-sections">
      <div class="recipe-section">
        <h4>Ingredients</h4>
        <ul>${ingredientsHtml}</ul>
      </div>
      <div class="recipe-section">
        <h4>Portion Sizes</h4>
        <ul>
          <li><strong>👤 Fabian (${recipe.fabiansPortion?.quantity}):</strong></li>
          ${fabiansPortionLines}
          <li style="margin-top: 10px;"><strong>👩 Stefanie (${recipe.stefaniesPortion?.quantity}):</strong></li>
          ${stefaniesPortionLines}
        </ul>
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

        // Show header logout button
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) logoutBtn.style.display = "block";

        // 2. Fetch all data in parallel
        const [plan, inventoryList, staplesList, recipesList, checkedList] = await Promise.all([
            API.getWeeklyPlan(State.weeklyPlan.weekLabel),
            API.getInventory(),
            API.getStaples(),
            API.getRecipes(),
            API.getShoppingChecks(State.weeklyPlan.weekLabel)
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
