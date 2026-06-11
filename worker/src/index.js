// index.js
// Cloudflare Worker API for Couples Meal Planner

import { defaultRecipes, defaultStaples } from "./seedData.js";

// Controlled vocabulary for recipe ingredient units
const ALLOWED_UNITS = new Set(["g", "kg", "ml", "l", "piece", "pack", "tin", "jar", "loaf", "box", "tbsp", "tsp", "whole", "pcs"]);

// Helper to hash password using PBKDF2 (built-in Web Crypto API)
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    passwordKey,
    256
  );
  const hashArray = Array.from(new Uint8Array(derivedBits));
  return btoa(hashArray.map(b => String.fromCharCode(b)).join(""));
}

// Helper to extract session ID from cookie
function getSessionFromCookie(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const parts = cookie.trim().split("=");
    if (parts.length >= 2) {
      const name = parts[0];
      const value = parts.slice(1).join("=");
      acc[name] = value;
    }
    return acc;
  }, {});
  return cookies["session"] || null;
}

// Helper to validate session and return user
async function getSessionUser(db, sessionId) {
  if (!sessionId) return null;
  const now = Math.floor(Date.now() / 1000);
  try {
    const session = await db.prepare(
      "SELECT s.id, s.user_id, u.username FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > ?"
    ).bind(sessionId, now).first();
    return session || null;
  } catch (err) {
    console.error("Session lookup failed:", err);
    return null;
  }
}

// CORS Headers Helper
function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Cookie",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json"
  };
}

// Seed helper functions
async function seedRecipesIfEmpty(db) {
  try {
    const count = await db.prepare("SELECT COUNT(*) as cnt FROM recipes WHERE is_custom = 0").first("cnt");
    if (count === 0) {
      console.log("Seeding recipes...");
      
      // Clear out any existing built-in recipes to avoid duplication
      await db.prepare("DELETE FROM recipes WHERE is_custom = 0").run();
      
      const statements = [];
      for (const r of defaultRecipes) {
        // Compute base macros
        const baseServings = Number(r.base_servings || r.servings || 4);
        const baseMacros = {
          calories: Math.round((Number(r.macros_per_serving?.calories) || 0) * baseServings),
          protein_g: Math.round((Number(r.macros_per_serving?.protein_g) || 0) * baseServings * 10) / 10,
          carbs_g: Math.round((Number(r.macros_per_serving?.carbs_g) || 0) * baseServings * 10) / 10,
          fat_g: Math.round((Number(r.macros_per_serving?.fat_g) || 0) * baseServings * 10) / 10
        };

        const prepTime = typeof r.prep_time_mins === "number" ? `${r.prep_time_mins} min` : (r.prep_time || "0 min");
        const cookTime = typeof r.cook_time_mins === "number" ? `${r.cook_time_mins} min` : (r.cook_time || "0 min");
        const minServings = r.min_servings !== undefined && r.min_servings !== null ? Number(r.min_servings) : null;
        const maxServings = r.max_servings !== undefined && r.max_servings !== null ? Number(r.max_servings) : null;
        const estimatedCost = r.estimated_cost_per_serving_gbp !== undefined && r.estimated_cost_per_serving_gbp !== null ? Number(r.estimated_cost_per_serving_gbp) : null;
        const tags = Array.isArray(r.tags) ? JSON.stringify(r.tags) : "[]";

        statements.push(
          db.prepare(
            `INSERT INTO recipes (
              id, name, emoji, description, prep_time, cook_time, servings, 
              ingredients, instructions, tips, macros, min_servings, max_servings, 
              is_custom, created_by_user_id, estimated_cost_per_serving_gbp, tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)`
          ).bind(
            r.id,
            r.name,
            r.emoji || "🍳",
            r.description || "",
            prepTime,
            cookTime,
            baseServings,
            JSON.stringify(r.ingredients || []),
            JSON.stringify(r.instructions || []),
            r.tips || "",
            JSON.stringify(baseMacros),
            minServings,
            maxServings,
            estimatedCost,
            tags
          )
        );

        if (Array.isArray(r.ingredients)) {
          for (const ing of r.ingredients) {
            statements.push(
              db.prepare(
                "INSERT INTO recipe_ingredients (recipe_id, name, quantity_per_serving, unit, notes, category) VALUES (?, ?, ?, ?, ?, ?)"
              ).bind(
                r.id,
                ing.name,
                Number(ing.quantity_per_serving),
                ing.unit,
                ing.notes || null,
                ing.category
              )
            );
          }
        }
      }
      if (statements.length > 0) {
        await db.batch(statements);
        console.log("Successfully seeded", defaultRecipes.length, "recipes");
      }
    }
  } catch (err) {
    console.error("Error seeding recipes:", err);
  }
}

async function seedStaplesIfEmpty(db, userId) {
  try {
    const count = await db.prepare("SELECT COUNT(*) as cnt FROM staples WHERE user_id = ?").bind(userId).first("cnt");
    if (count === 0) {
      console.log("Seeding staples for user:", userId);
      const statements = [];
      for (const s of defaultStaples) {
        statements.push(
          db.prepare(
            "INSERT INTO staples (id, user_id, name, quantity, unit, category) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(
            s.id,
            userId,
            s.name,
            s.quantity,
            s.unit,
            s.category
          )
        );
      }
      if (statements.length > 0) {
        await db.batch(statements);
      }
    }
  } catch (err) {
    console.error("Error seeding staples:", err);
  }
}

function calculateProportionalSplit(baseMacros, members) {
  if (!members || members.length === 0) return [];

  // Calculate total household calories
  let totalCaloriesGoal = 0;
  let hasAllCalorieGoals = true;

  for (const m of members) {
    const cal = m.macro_goals ? Number(m.macro_goals.calories) : 0;
    if (cal <= 0) {
      hasAllCalorieGoals = false;
    }
    totalCaloriesGoal += cal;
  }

  // If any member lacks a calorie goal or total calories is <= 0, do equal split
  const useEqualSplit = !hasAllCalorieGoals || totalCaloriesGoal <= 0;
  const numMembers = members.length;

  return members.map(m => {
    let scaleFactor = 0;
    if (useEqualSplit) {
      scaleFactor = 1 / numMembers;
    } else {
      scaleFactor = Number(m.macro_goals.calories) / totalCaloriesGoal;
    }

    return {
      member_id: m.id,
      name: m.name,
      macros: {
        calories: Math.round(baseMacros.calories * scaleFactor),
        protein_g: Math.round(baseMacros.protein_g * scaleFactor * 10) / 10,
        carbs_g: Math.round(baseMacros.carbs_g * scaleFactor * 10) / 10,
        fat_g: Math.round(baseMacros.fat_g * scaleFactor * 10) / 10
      }
    };
  });
}

function validateRecipe(recipe) {
  const errors = [];
  if (!recipe.name || typeof recipe.name !== "string" || recipe.name.trim().length === 0) {
    errors.push("Recipe name is required.");
  }
  
  if (recipe.base_servings === undefined || recipe.base_servings === null) {
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
    if (calories === undefined || calories === null || isNaN(Number(calories)) || Number(calories) < 0) {
      errors.push("macros_per_serving.calories must be a positive number.");
    }
    if (protein_g === undefined || protein_g === null || isNaN(Number(protein_g)) || Number(protein_g) < 0) {
      errors.push("macros_per_serving.protein_g must be a positive number.");
    }
    if (carbs_g === undefined || carbs_g === null || isNaN(Number(carbs_g)) || Number(carbs_g) < 0) {
      errors.push("macros_per_serving.carbs_g must be a positive number.");
    }
    if (fat_g === undefined || fat_g === null || isNaN(Number(fat_g)) || Number(fat_g) < 0) {
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

function parseCSV(text) {
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

function escapeCSV(val) {
  if (val === undefined || val === null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = getCorsHeaders(request);

    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: "Database binding DB missing." }), {
        status: 500,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // ==========================================
      // AUTH ENDPOINTS (Open / Public)
      // ==========================================

      // Register User
      if (method === "POST" && path === "/api/auth/register") {
        const { username, password } = await request.json();
        if (!username || !password || username.trim().length < 3 || password.trim().length < 5) {
          return new Response(JSON.stringify({ error: "Username (min 3 chars) and password (min 5 chars) required." }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Check if exists
        const existing = await db.prepare("SELECT id FROM users WHERE username = ?").bind(username.toLowerCase()).first();
        if (existing) {
          return new Response(JSON.stringify({ error: "Username already exists." }), {
            status: 409,
            headers: corsHeaders
          });
        }

        const salt = crypto.randomUUID();
        const hash = await hashPassword(password, salt);

        await db.prepare("INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)")
          .bind(username.toLowerCase(), hash, salt)
          .run();

        return new Response(JSON.stringify({ success: true, message: "Registration successful!" }), {
          status: 201,
          headers: corsHeaders
        });
      }

      // Login User
      if (method === "POST" && path === "/api/auth/login") {
        const { username, password } = await request.json();
        if (!username || !password) {
          return new Response(JSON.stringify({ error: "Username and password required." }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username.toLowerCase()).first();
        if (!user) {
          return new Response(JSON.stringify({ error: "Invalid username or password." }), {
            status: 401,
            headers: corsHeaders
          });
        }

        const computedHash = await hashPassword(password, user.salt);
        if (computedHash !== user.password_hash) {
          return new Response(JSON.stringify({ error: "Invalid username or password." }), {
            status: 401,
            headers: corsHeaders
          });
        }

        // Generate Session
        const sessionId = crypto.randomUUID();
        const maxAge = 30 * 24 * 60 * 60; // 30 days
        const expiresAt = Math.floor(Date.now() / 1000) + maxAge;

        await db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
          .bind(sessionId, user.id, expiresAt)
          .run();

        // Dynamically seed standard recipes/staples on first login so client gets standard ones automatically
        ctx.waitUntil(seedRecipesIfEmpty(db));
        ctx.waitUntil(seedStaplesIfEmpty(db, user.id));

        const responseHeaders = { ...corsHeaders };
        // Set HTTP-Only Cookie. Works cross-site using SameSite=None and Secure.
        responseHeaders["Set-Cookie"] = `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`;

        return new Response(JSON.stringify({
          success: true,
          user: { id: user.id, username: user.username }
        }), {
          status: 200,
          headers: responseHeaders
        });
      }

      // Logout User
      if (method === "POST" && path === "/api/auth/logout") {
        const sessionId = getSessionFromCookie(request);
        if (sessionId) {
          await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
        }

        const responseHeaders = { ...corsHeaders };
        responseHeaders["Set-Cookie"] = `session=; Path=/; HttpOnly; Secure; SameSite=None; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: responseHeaders
        });
      }

      // Check current session
      if (method === "GET" && path === "/api/auth/session") {
        const sessionId = getSessionFromCookie(request);
        const user = await getSessionUser(db, sessionId);

        if (!user) {
          return new Response(JSON.stringify({ authenticated: false }), {
            status: 200,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({
          authenticated: true,
          user: { id: user.user_id, username: user.username }
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // ==========================================
      // SECURE ENDPOINTS (Requires Active Session)
      // ==========================================
      const sessionId = getSessionFromCookie(request);
      const user = await getSessionUser(db, sessionId);

      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized. Please log in." }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const userId = user.user_id;

      // ==========================================
      // User Preferences & Settings Endpoints
      // ==========================================
      if (path === "/api/preferences") {
        if (method === "GET") {
          let prefs = await db.prepare("SELECT * FROM user_preferences WHERE user_id = ?").bind(userId).first();
          if (!prefs) {
            prefs = { preferred_supermarket: null, show_staples_in_list: 1 };
          }
          return new Response(JSON.stringify({
            preferred_supermarket: prefs.preferred_supermarket,
            show_staples_in_list: prefs.show_staples_in_list === 1
          }), { status: 200, headers: corsHeaders });
        }

        if (method === "PUT") {
          const { preferred_supermarket, show_staples_in_list } = await request.json();
          await db.prepare(`
            INSERT INTO user_preferences (user_id, preferred_supermarket, show_staples_in_list, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
              preferred_supermarket = excluded.preferred_supermarket,
              show_staples_in_list = excluded.show_staples_in_list,
              updated_at = CURRENT_TIMESTAMP
          `).bind(
            userId,
            preferred_supermarket !== undefined ? preferred_supermarket : null,
            show_staples_in_list ? 1 : 0
          ).run();
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }
      }

      if (path === "/api/recipes/custom" && method === "DELETE") {
        const statements = [
          db.prepare("UPDATE weekly_plan_days SET recipe_id = NULL WHERE recipe_id IN (SELECT id FROM recipes WHERE created_by_user_id = ? AND is_custom = 1)").bind(userId),
          db.prepare("DELETE FROM recipe_favourites WHERE recipe_id IN (SELECT id FROM recipes WHERE created_by_user_id = ? AND is_custom = 1)").bind(userId),
          db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE created_by_user_id = ? AND is_custom = 1)").bind(userId),
          db.prepare("DELETE FROM recipes WHERE created_by_user_id = ? AND is_custom = 1").bind(userId)
        ];
        await db.batch(statements);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }

      if (path === "/api/household" && method === "DELETE") {
        await db.prepare("DELETE FROM households WHERE user_id = ?").bind(userId).run();
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }

      if (path === "/api/auth/account" && method === "DELETE") {
        const statements = [
          db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE created_by_user_id = ?)").bind(userId),
          db.prepare("DELETE FROM recipes WHERE created_by_user_id = ?").bind(userId),
          db.prepare("DELETE FROM users WHERE id = ?").bind(userId)
        ];
        await db.batch(statements);
        
        const responseHeaders = { ...corsHeaders };
        responseHeaders["Set-Cookie"] = `session=; Path=/; HttpOnly; Secure; SameSite=None; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: responseHeaders });
      }

      if (path === "/api/week-plan" && method === "DELETE") {
        const weekLabel = url.searchParams.get("week_label") || "This week";
        const plan = await db.prepare("SELECT id FROM weekly_plans WHERE user_id = ? AND week_label = ?")
          .bind(userId, weekLabel)
          .first();
        if (plan) {
          await db.prepare("DELETE FROM weekly_plan_days WHERE weekly_plan_id = ?").bind(plan.id).run();
        }
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }


      // ==========================================
      // Favourites Endpoints
      // ==========================================
      if (path === "/api/favourites") {
        if (method === "GET") {
          const res = await db.prepare("SELECT recipe_id FROM recipe_favourites WHERE user_id = ?")
            .bind(userId)
            .all();
          const list = res.results.map(r => r.recipe_id);
          return new Response(JSON.stringify(list), { status: 200, headers: corsHeaders });
        }
      }

      if (path.startsWith("/api/favourites/")) {
        const recipeId = path.split("/").pop();
        if (!recipeId) {
          return new Response(JSON.stringify({ error: "Recipe ID required." }), { status: 400, headers: corsHeaders });
        }

        if (method === "POST") {
          await db.prepare(
            "INSERT OR IGNORE INTO recipe_favourites (user_id, recipe_id) VALUES (?, ?)"
          ).bind(userId, recipeId).run();
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }

        if (method === "DELETE") {
          await db.prepare(
            "DELETE FROM recipe_favourites WHERE user_id = ? AND recipe_id = ?"
          ).bind(userId, recipeId).run();
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }
      }

      // 1. Recipes CRUD
      if (path === "/api/recipes") {
        if (method === "GET") {
          const source = url.searchParams.get("source");
          let recipes;
          
          if (source === "custom") {
            recipes = await db.prepare(`
              SELECT r.*,
                     (SELECT json_group_array(json_object(
                        'id', ri.id,
                        'name', ri.name,
                        'quantity_per_serving', ri.quantity_per_serving,
                        'unit', ri.unit,
                        'notes', ri.notes,
                        'category', ri.category
                     )) FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) AS ingredients_json
              FROM recipes r
              WHERE r.is_custom = 1 AND r.created_by_user_id = ?
              ORDER BY r.name ASC
            `).bind(userId).all();
          } else {
            recipes = await db.prepare(`
              SELECT r.*,
                     (SELECT json_group_array(json_object(
                        'id', ri.id,
                        'name', ri.name,
                        'quantity_per_serving', ri.quantity_per_serving,
                        'unit', ri.unit,
                        'notes', ri.notes,
                        'category', ri.category
                     )) FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) AS ingredients_json
              FROM recipes r
              WHERE r.is_custom = 0 OR (r.is_custom = 1 AND r.created_by_user_id = ?)
              ORDER BY r.name ASC
            `).bind(userId).all();
          }
          
          const list = recipes.results.map(r => ({
            id: r.id,
            name: r.name,
            emoji: r.emoji,
            description: r.description,
            prepTime: r.prep_time,
            cookTime: r.cook_time,
            servings: r.servings,
            min_servings: r.min_servings,
            max_servings: r.max_servings,
            ingredients: JSON.parse(r.ingredients_json || "[]"),
            instructions: JSON.parse(r.instructions || "[]"),
            tips: r.tips || "",
            macros: JSON.parse(r.macros || "{}"),
            is_custom: r.is_custom === 1,
            created_by_user_id: r.created_by_user_id,
            estimated_cost_per_serving_gbp: r.estimated_cost_per_serving_gbp,
            tags: JSON.parse(r.tags || "[]")
          }));

          return new Response(JSON.stringify(list), { status: 200, headers: corsHeaders });
        }

        if (method === "POST") {
          const body = await request.json();
          
          // Validation
          if (!body.name || body.name.trim().length === 0) {
            return new Response(JSON.stringify({ error: "Recipe name is required." }), { status: 400, headers: corsHeaders });
          }
          if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
            return new Response(JSON.stringify({ error: "At least one ingredient is required." }), { status: 400, headers: corsHeaders });
          }
          if (!body.macros_per_serving || 
              body.macros_per_serving.calories === undefined || 
              body.macros_per_serving.protein_g === undefined || 
              body.macros_per_serving.carbs_g === undefined || 
              body.macros_per_serving.fat_g === undefined) {
            return new Response(JSON.stringify({ error: "All macro fields are required." }), { status: 400, headers: corsHeaders });
          }
          
          const baseServings = body.base_servings !== undefined ? Number(body.base_servings) : 2;
          if (isNaN(baseServings) || baseServings <= 0) {
            return new Response(JSON.stringify({ error: "Base servings must be a positive number." }), { status: 400, headers: corsHeaders });
          }

          // Validate ingredients
          for (const ing of body.ingredients) {
            if (!ing.name || ing.name.trim().length === 0) {
              return new Response(JSON.stringify({ error: "Ingredient name is required." }), { status: 400, headers: corsHeaders });
            }
            const qty = Number(ing.quantity_per_serving);
            if (isNaN(qty) || qty <= 0) {
              return new Response(JSON.stringify({ error: `Ingredient "${ing.name}" must have a positive quantity per serving.` }), { status: 400, headers: corsHeaders });
            }
            const unit = (ing.unit || "").trim().toLowerCase();
            if (!ALLOWED_UNITS.has(unit)) {
              return new Response(
                JSON.stringify({ error: `Invalid unit: "${unit}". Allowed units are: ${Array.from(ALLOWED_UNITS).join(", ")}` }),
                { status: 400, headers: corsHeaders }
              );
            }
            if (!ing.category) {
              return new Response(JSON.stringify({ error: `Ingredient "${ing.name}" must have a category.` }), { status: 400, headers: corsHeaders });
            }
          }

          const recipeId = "custom-" + crypto.randomUUID();
          
          // Multiply macros_per_serving by base_servings to get total base macros, matching standard recipe data format
          const baseMacros = {
            calories: Math.round((Number(body.macros_per_serving.calories) || 0) * baseServings),
            protein_g: Math.round((Number(body.macros_per_serving.protein_g) || 0) * baseServings * 10) / 10,
            carbs_g: Math.round((Number(body.macros_per_serving.carbs_g) || 0) * baseServings * 10) / 10,
            fat_g: Math.round((Number(body.macros_per_serving.fat_g) || 0) * baseServings * 10) / 10
          };

          const minServings = body.min_servings !== undefined && body.min_servings !== null && body.min_servings !== "" ? Number(body.min_servings) : null;
          const maxServings = body.max_servings !== undefined && body.max_servings !== null && body.max_servings !== "" ? Number(body.max_servings) : null;
          const estimatedCost = body.estimated_cost_per_serving_gbp !== undefined && body.estimated_cost_per_serving_gbp !== null && body.estimated_cost_per_serving_gbp !== "" ? Number(body.estimated_cost_per_serving_gbp) : null;

          const statements = [
            db.prepare(`
              INSERT INTO recipes (
                id, name, emoji, description, prep_time, cook_time, servings, 
                ingredients, instructions, tips, macros, min_servings, max_servings, 
                is_custom, created_by_user_id, estimated_cost_per_serving_gbp, tags
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
            `).bind(
              recipeId,
              body.name,
              body.emoji || "🍳",
              body.description || "",
              `${body.prep_time_mins || 0} min`,
              `${body.cook_time_mins || 0} min`,
              baseServings,
              JSON.stringify(body.ingredients || []),
              JSON.stringify(body.instructions || []),
              body.tips || "",
              JSON.stringify(baseMacros),
              minServings,
              maxServings,
              userId,
              estimatedCost,
              JSON.stringify(body.tags || [])
            )
          ];

          for (const ing of body.ingredients) {
            statements.push(
              db.prepare(
                "INSERT INTO recipe_ingredients (recipe_id, name, quantity_per_serving, unit, notes, category) VALUES (?, ?, ?, ?, ?, ?)"
              ).bind(
                recipeId,
                ing.name,
                Number(ing.quantity_per_serving),
                ing.unit.trim().toLowerCase(),
                ing.notes || null,
                ing.category
              )
            );
          }

          await db.batch(statements);
          
          // Return the full created recipe object for the frontend to render immediately
          const createdRecipe = {
            id: recipeId,
            name: body.name,
            emoji: body.emoji || "🍳",
            description: body.description || "",
            prepTime: `${body.prep_time_mins || 0} min`,
            cookTime: `${body.cook_time_mins || 0} min`,
            servings: baseServings,
            min_servings: minServings,
            max_servings: maxServings,
            ingredients: body.ingredients.map((ing, index) => ({ id: index + 1, ...ing, notes: ing.notes || null })),
            instructions: body.instructions || [],
            tips: body.tips || "",
            macros: baseMacros,
            is_custom: true,
            created_by_user_id: userId,
            estimated_cost_per_serving_gbp: estimatedCost,
            tags: body.tags || []
          };

          return new Response(JSON.stringify(createdRecipe), { status: 200, headers: corsHeaders });
        }
      }

      // GET /api/recipes/:id
      if (method === "GET" && path.startsWith("/api/recipes/") && !path.endsWith("/portions") && !path.startsWith("/api/recipes/export/")) {
        const parts = path.split("/");
        const recipeId = parts[3];

        const r = await db.prepare(`
          SELECT r.*,
                 (SELECT json_group_array(json_object(
                    'id', ri.id,
                    'name', ri.name,
                    'quantity_per_serving', ri.quantity_per_serving,
                    'unit', ri.unit,
                    'notes', ri.notes,
                    'category', ri.category
                 )) FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) AS ingredients_json
          FROM recipes r
          WHERE r.id = ? AND (r.is_custom = 0 OR r.created_by_user_id = ?)
        `).bind(recipeId, userId).first();

        if (!r) {
          return new Response(JSON.stringify({ error: "Recipe not found." }), { status: 404, headers: corsHeaders });
        }

        const recipe = {
          id: r.id,
          name: r.name,
          emoji: r.emoji,
          description: r.description,
          prepTime: r.prep_time,
          cookTime: r.cook_time,
          servings: r.servings,
          min_servings: r.min_servings,
          max_servings: r.max_servings,
          ingredients: JSON.parse(r.ingredients_json || "[]"),
          instructions: JSON.parse(r.instructions || "[]"),
          tips: r.tips || "",
          macros: JSON.parse(r.macros || "{}"),
          is_custom: r.is_custom === 1,
          created_by_user_id: r.created_by_user_id,
          estimated_cost_per_serving_gbp: r.estimated_cost_per_serving_gbp,
          tags: JSON.parse(r.tags || "[]")
        };

        return new Response(JSON.stringify(recipe), { status: 200, headers: corsHeaders });
      }

      // PUT /api/recipes/:id
      if (method === "PUT" && path.startsWith("/api/recipes/")) {
        const parts = path.split("/");
        const recipeId = parts[3];

        const existing = await db.prepare("SELECT * FROM recipes WHERE id = ?").bind(recipeId).first();
        if (!existing) {
          return new Response(JSON.stringify({ error: "Recipe not found." }), { status: 404, headers: corsHeaders });
        }

        if (existing.is_custom !== 1 || existing.created_by_user_id !== userId) {
          return new Response(JSON.stringify({ error: "Unauthorized. You cannot modify built-in or other users' recipes." }), {
            status: 403,
            headers: corsHeaders
          });
        }

        const body = await request.json();
        
        // Validation
        if (!body.name || body.name.trim().length === 0) {
          return new Response(JSON.stringify({ error: "Recipe name is required." }), { status: 400, headers: corsHeaders });
        }
        if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
          return new Response(JSON.stringify({ error: "At least one ingredient is required." }), { status: 400, headers: corsHeaders });
        }
        if (!body.macros_per_serving || 
            body.macros_per_serving.calories === undefined || 
            body.macros_per_serving.protein_g === undefined || 
            body.macros_per_serving.carbs_g === undefined || 
            body.macros_per_serving.fat_g === undefined) {
          return new Response(JSON.stringify({ error: "All macro fields are required." }), { status: 400, headers: corsHeaders });
        }
        
        const baseServings = body.base_servings !== undefined ? Number(body.base_servings) : 2;
        if (isNaN(baseServings) || baseServings <= 0) {
          return new Response(JSON.stringify({ error: "Base servings must be a positive number." }), { status: 400, headers: corsHeaders });
        }

        // Validate ingredients
        for (const ing of body.ingredients) {
          if (!ing.name || ing.name.trim().length === 0) {
            return new Response(JSON.stringify({ error: "Ingredient name is required." }), { status: 400, headers: corsHeaders });
          }
          const qty = Number(ing.quantity_per_serving);
          if (isNaN(qty) || qty <= 0) {
            return new Response(JSON.stringify({ error: `Ingredient "${ing.name}" must have a positive quantity per serving.` }), { status: 400, headers: corsHeaders });
          }
          const unit = (ing.unit || "").trim().toLowerCase();
          if (!ALLOWED_UNITS.has(unit)) {
            return new Response(
              JSON.stringify({ error: `Invalid unit: "${unit}". Allowed units are: ${Array.from(ALLOWED_UNITS).join(", ")}` }),
              { status: 400, headers: corsHeaders }
            );
          }
          if (!ing.category) {
            return new Response(JSON.stringify({ error: `Ingredient "${ing.name}" must have a category.` }), { status: 400, headers: corsHeaders });
          }
        }

        // Base macros calculation
        const baseMacros = {
          calories: Math.round((Number(body.macros_per_serving.calories) || 0) * baseServings),
          protein_g: Math.round((Number(body.macros_per_serving.protein_g) || 0) * baseServings * 10) / 10,
          carbs_g: Math.round((Number(body.macros_per_serving.carbs_g) || 0) * baseServings * 10) / 10,
          fat_g: Math.round((Number(body.macros_per_serving.fat_g) || 0) * baseServings * 10) / 10
        };

        const minServings = body.min_servings !== undefined && body.min_servings !== null && body.min_servings !== "" ? Number(body.min_servings) : null;
        const maxServings = body.max_servings !== undefined && body.max_servings !== null && body.max_servings !== "" ? Number(body.max_servings) : null;
        const estimatedCost = body.estimated_cost_per_serving_gbp !== undefined && body.estimated_cost_per_serving_gbp !== null && body.estimated_cost_per_serving_gbp !== "" ? Number(body.estimated_cost_per_serving_gbp) : null;

        const statements = [
          db.prepare(`
            UPDATE recipes SET 
              name = ?, emoji = ?, description = ?, prep_time = ?, cook_time = ?, servings = ?, 
              ingredients = ?, instructions = ?, tips = ?, macros = ?, min_servings = ?, max_servings = ?, 
              estimated_cost_per_serving_gbp = ?, tags = ?
            WHERE id = ?
          `).bind(
            body.name,
            body.emoji || existing.emoji || "🍳",
            body.description || "",
            `${body.prep_time_mins || 0} min`,
            `${body.cook_time_mins || 0} min`,
            baseServings,
            JSON.stringify(body.ingredients || []),
            JSON.stringify(body.instructions || []),
            body.tips || "",
            JSON.stringify(baseMacros),
            minServings,
            maxServings,
            estimatedCost,
            JSON.stringify(body.tags || []),
            recipeId
          ),
          db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").bind(recipeId)
        ];

        for (const ing of body.ingredients) {
          statements.push(
            db.prepare(
              "INSERT INTO recipe_ingredients (recipe_id, name, quantity_per_serving, unit, notes, category) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(
              recipeId,
              ing.name,
              Number(ing.quantity_per_serving),
              ing.unit.trim().toLowerCase(),
              ing.notes || null,
              ing.category
            )
          );
        }

        await db.batch(statements);
        
        // Return full updated recipe object
        const updatedRecipe = {
          id: recipeId,
          name: body.name,
          emoji: body.emoji || existing.emoji || "🍳",
          description: body.description || "",
          prepTime: `${body.prep_time_mins || 0} min`,
          cookTime: `${body.cook_time_mins || 0} min`,
          servings: baseServings,
          min_servings: minServings,
          max_servings: maxServings,
          ingredients: body.ingredients.map((ing, index) => ({ id: index + 1, ...ing, notes: ing.notes || null })),
          instructions: body.instructions || [],
          tips: body.tips || "",
          macros: baseMacros,
          is_custom: true,
          created_by_user_id: userId,
          estimated_cost_per_serving_gbp: estimatedCost,
          tags: body.tags || []
        };

        return new Response(JSON.stringify(updatedRecipe), { status: 200, headers: corsHeaders });
      }

      // DELETE /api/recipes/:id
      if (method === "DELETE" && path.startsWith("/api/recipes/")) {
        const parts = path.split("/");
        const recipeId = parts[3];

        const existing = await db.prepare("SELECT * FROM recipes WHERE id = ?").bind(recipeId).first();
        if (!existing) {
          return new Response(JSON.stringify({ error: "Recipe not found." }), { status: 404, headers: corsHeaders });
        }

        if (existing.is_custom !== 1 || existing.created_by_user_id !== userId) {
          return new Response(JSON.stringify({ error: "Unauthorized. You cannot delete built-in or other users' recipes." }), {
            status: 403,
            headers: corsHeaders
          });
        }

        const statements = [
          db.prepare("DELETE FROM recipes WHERE id = ?").bind(recipeId),
          db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").bind(recipeId),
          db.prepare("DELETE FROM recipe_favourites WHERE recipe_id = ?").bind(recipeId),
          db.prepare("UPDATE weekly_plan_days SET recipe_id = NULL WHERE recipe_id = ?").bind(recipeId)
        ];

        await db.batch(statements);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }

      // GET /api/recipes/:id/portions
      if (method === "GET" && path.startsWith("/api/recipes/") && path.endsWith("/portions")) {
        const parts = path.split("/");
        const recipeId = parts[3];

        const recipe = await db.prepare("SELECT * FROM recipes WHERE id = ?").bind(recipeId).first();
        if (!recipe) {
          return new Response(JSON.stringify({ error: "Recipe not found." }), { status: 404, headers: corsHeaders });
        }

        const household = await db.prepare("SELECT * FROM households WHERE user_id = ?").bind(userId).first();
        if (!household) {
          return new Response(JSON.stringify({ portions: [], clamped: false, servings: recipe.servings }), { status: 200, headers: corsHeaders });
        }

        const membersRes = await db.prepare("SELECT * FROM household_members WHERE household_id = ? ORDER BY id ASC").bind(household.id).all();
        const membersList = [];

        for (const member of membersRes.results) {
          const macros = await db.prepare("SELECT * FROM macro_goals WHERE member_id = ?").bind(member.id).first();
          membersList.push({
            id: member.id,
            name: member.name,
            macro_goals: macros ? {
              calories: macros.calories,
              protein_g: macros.protein_g,
              carbs_g: macros.carbs_g,
              fat_g: macros.fat_g
            } : null
          });
        }

        const baseMacros = JSON.parse(recipe.macros || '{"calories":800,"protein_g":70,"carbs_g":80,"fat_g":25}');
        const householdSize = membersList.length;
        const minServings = recipe.min_servings;
        const maxServings = recipe.max_servings;

        let targetServings = householdSize;
        let clamped = false;
        let clampType = null;

        if (minServings !== null && targetServings < minServings) {
          targetServings = minServings;
          clamped = true;
          clampType = 'min';
        } else if (maxServings !== null && targetServings > maxServings) {
          targetServings = maxServings;
          clamped = true;
          clampType = 'max';
        }

        const scaleFactor = targetServings / recipe.servings;
        const scaledMacros = {
          calories: baseMacros.calories * scaleFactor,
          protein_g: baseMacros.protein_g * scaleFactor,
          carbs_g: baseMacros.carbs_g * scaleFactor,
          fat_g: baseMacros.fat_g * scaleFactor
        };

        const splitPortions = calculateProportionalSplit(scaledMacros, membersList);

        return new Response(JSON.stringify({
          portions: splitPortions,
          clamped,
          clampType,
          servings: targetServings
        }), { status: 200, headers: corsHeaders });
      }

      // 2. Weekly Plan CRUD
      if (path === "/api/weekly-plan") {
        if (method === "GET") {
          const weekLabel = url.searchParams.get("week_label") || "This week";
          
          // Get weekly plan header
          const plan = await db.prepare("SELECT id, week_label FROM weekly_plans WHERE user_id = ? AND week_label = ?")
            .bind(userId, weekLabel)
            .first();

          if (!plan) {
            // Return empty plan if none exists
            return new Response(JSON.stringify({
              weekLabel,
              days: [
                { day: "Monday", recipeId: null },
                { day: "Tuesday", recipeId: null },
                { day: "Wednesday", recipeId: null },
                { day: "Thursday", recipeId: null },
                { day: "Friday", recipeId: null },
                { day: "Saturday", recipeId: null },
                { day: "Sunday", recipeId: null }
              ]
            }), { status: 200, headers: corsHeaders });
          }

          // Fetch days
          const days = await db.prepare("SELECT day, recipe_id FROM weekly_plan_days WHERE weekly_plan_id = ?")
            .bind(plan.id)
            .all();

          // Match day names
          const dayMap = days.results.reduce((acc, d) => {
            acc[d.day] = d.recipe_id;
            return acc;
          }, {});

          const formattedDays = [
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
          ].map(day => ({
            day,
            recipeId: dayMap[day] || null
          }));

          return new Response(JSON.stringify({
            weekLabel: plan.week_label,
            days: formattedDays
          }), { status: 200, headers: corsHeaders });
        }

        if (method === "POST") {
          const { week_label, days } = await request.json();
          if (!week_label || !Array.isArray(days)) {
            return new Response(JSON.stringify({ error: "week_label and days array required." }), {
              status: 400,
              headers: corsHeaders
            });
          }

          const planId = `week-${userId}-${week_label.replace(/\s+/g, "_")}`;

          // Create transaction batch
          const stmts = [
            // Insert plan header
            db.prepare("INSERT OR IGNORE INTO weekly_plans (id, user_id, week_label) VALUES (?, ?, ?)")
              .bind(planId, userId, week_label),
            // Delete existing days
            db.prepare("DELETE FROM weekly_plan_days WHERE weekly_plan_id = ?").bind(planId)
          ];

          // Insert new days
          for (const d of days) {
            stmts.push(
              db.prepare("INSERT INTO weekly_plan_days (weekly_plan_id, day, recipe_id) VALUES (?, ?, ?)")
                .bind(planId, d.day, d.recipeId || null)
            );
          }

          await db.batch(stmts);
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }
      }

      // 3. Pantry/Inventory CRUD
      if (path === "/api/inventory") {
        if (method === "GET") {
          const items = await db.prepare("SELECT * FROM food_inventory WHERE user_id = ? ORDER BY name ASC").bind(userId).all();
          const results = items.results.map(i => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            category: i.category,
            expires_at: i.expires_at,
            created_at: i.created_at
          }));
          return new Response(JSON.stringify(results), { status: 200, headers: corsHeaders });
        }

        if (method === "POST") {
          const item = await request.json();
          if (!item.id || !item.name) {
            return new Response(JSON.stringify({ error: "Invalid item payload." }), { status: 400, headers: corsHeaders });
          }

          await db.prepare(
            "INSERT INTO food_inventory (id, user_id, name, quantity, unit, category, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, name) DO UPDATE SET quantity = excluded.quantity, unit = excluded.unit, category = excluded.category, expires_at = excluded.expires_at"
          ).bind(
            item.id,
            userId,
            item.name,
            Number(item.quantity) || 0,
            item.unit,
            item.category,
            item.expires_at || null,
            item.created_at || new Date().toISOString()
          ).run();

          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }
      }

      // Bulk Inventory POST
      if (method === "POST" && path === "/api/inventory/bulk") {
        const list = await request.json();
        if (!Array.isArray(list)) {
          return new Response(JSON.stringify({ error: "Expected an array of inventory items." }), { status: 400, headers: corsHeaders });
        }

        const statements = [];
        for (const i of list) {
          const id = i.id || `inv-${crypto.randomUUID()}`;
          const qty = Number(i.quantity) || 0;
          const unit = String(i.unit || "unit");
          const expires_at = i.expires_at || null;
          const created_at = i.created_at || new Date().toISOString();

          statements.push(
            db.prepare(`
              INSERT INTO food_inventory (id, user_id, name, category, quantity, unit, expires_at, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(user_id, name) DO UPDATE SET
                quantity = excluded.quantity,
                unit = excluded.unit,
                category = excluded.category,
                expires_at = COALESCE(excluded.expires_at, food_inventory.expires_at),
                created_at = COALESCE(excluded.created_at, food_inventory.created_at)
            `).bind(id, userId, i.name, i.category, qty, unit, expires_at, created_at)
          );
        }

        if (statements.length > 0) {
          await db.batch(statements);
        }
        return new Response(JSON.stringify({ success: true, count: list.length }), { status: 200, headers: corsHeaders });
      }

      // Update Inventory Item
      if (method === "PUT" && path.startsWith("/api/inventory/")) {
        const id = path.split("/").pop();
        const body = await request.json();
        const qty = Number(body.quantity) || 0;
        const expires_at = body.expires_at || null;

        const result = await db.prepare(
          "UPDATE food_inventory SET name = ?, category = ?, quantity = ?, unit = ?, expires_at = ? WHERE id = ? AND user_id = ?"
        ).bind(body.name, body.category, qty, body.unit, expires_at, id, userId).run();

        if (result.meta.changes === 0) {
          return new Response(JSON.stringify({ error: "Inventory item not found or unauthorized." }), { status: 404, headers: corsHeaders });
        }
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }

      // Delete Inventory Item
      if (method === "DELETE" && path.startsWith("/api/inventory/")) {
        const itemId = path.split("/").pop();
        if (itemId) {
          await db.prepare("DELETE FROM food_inventory WHERE id = ? AND user_id = ?").bind(itemId, userId).run();
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }
      }

      // 4. Staples CRUD
      if (path === "/api/staples") {
        if (method === "GET") {
          const items = await db.prepare("SELECT * FROM staples WHERE user_id = ? ORDER BY name ASC").bind(userId).all();
          return new Response(JSON.stringify(items.results), { status: 200, headers: corsHeaders });
        }

        if (method === "POST") {
          const staple = await request.json();
          if (!staple.id || !staple.name) {
            return new Response(JSON.stringify({ error: "Invalid staple payload." }), { status: 400, headers: corsHeaders });
          }

          const qty = staple.quantity !== undefined && staple.quantity !== null && staple.quantity !== "" ? Number(staple.quantity) : null;
          const unit = staple.unit !== undefined && staple.unit !== null && staple.unit !== "" ? String(staple.unit) : null;

          await db.prepare(
            "INSERT INTO staples (id, user_id, name, category, quantity, unit) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, name) DO UPDATE SET quantity = excluded.quantity, unit = excluded.unit, category = excluded.category"
          ).bind(
            staple.id,
            userId,
            staple.name,
            staple.category,
            qty,
            unit
          ).run();

          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }
      }

      // Bulk Staples POST
      if (method === "POST" && path === "/api/staples/bulk") {
        const list = await request.json();
        if (!Array.isArray(list)) {
          return new Response(JSON.stringify({ error: "Expected an array of staples." }), { status: 400, headers: corsHeaders });
        }

        const statements = [];
        for (const s of list) {
          const id = s.id || `staple-${crypto.randomUUID()}`;
          const qty = s.quantity !== undefined && s.quantity !== null && s.quantity !== "" ? Number(s.quantity) : null;
          const unit = s.unit !== undefined && s.unit !== null && s.unit !== "" ? String(s.unit) : null;

          statements.push(
            db.prepare(`
              INSERT INTO staples (id, user_id, name, category, quantity, unit)
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(user_id, name) DO UPDATE SET
                quantity = excluded.quantity,
                unit = excluded.unit,
                category = excluded.category
            `).bind(id, userId, s.name, s.category, qty, unit)
          );
        }

        if (statements.length > 0) {
          await db.batch(statements);
        }
        return new Response(JSON.stringify({ success: true, count: list.length }), { status: 200, headers: corsHeaders });
      }

      // Update Staple Item
      if (method === "PUT" && path.startsWith("/api/staples/")) {
        const id = path.split("/").pop();
        const body = await request.json();
        const qty = body.quantity !== undefined && body.quantity !== null && body.quantity !== "" ? Number(body.quantity) : null;
        const unit = body.unit !== undefined && body.unit !== null && body.unit !== "" ? String(body.unit) : null;

        const result = await db.prepare(
          "UPDATE staples SET name = ?, category = ?, quantity = ?, unit = ? WHERE id = ? AND user_id = ?"
        ).bind(body.name, body.category, qty, unit, id, userId).run();

        if (result.meta.changes === 0) {
          return new Response(JSON.stringify({ error: "Staple not found or unauthorized." }), { status: 404, headers: corsHeaders });
        }
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }

      // Delete Staple Item
      if (method === "DELETE" && path.startsWith("/api/staples/")) {
        const stapleId = path.split("/").pop();
        if (stapleId) {
          await db.prepare("DELETE FROM staples WHERE id = ? AND user_id = ?").bind(stapleId, userId).run();
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }
      }

      // Export APIs
      if (method === "GET" && path === "/api/export") {
        const staples = await db.prepare("SELECT * FROM staples WHERE user_id = ? ORDER BY name ASC").bind(userId).all();
        const inventory = await db.prepare("SELECT * FROM food_inventory WHERE user_id = ? ORDER BY name ASC").bind(userId).all();

        const recipes = await db.prepare(`
          SELECT r.*,
                 (SELECT json_group_array(json_object(
                    'id', ri.id,
                    'name', ri.name,
                    'quantity_per_serving', ri.quantity_per_serving,
                    'unit', ri.unit,
                    'notes', ri.notes,
                    'category', ri.category
                 )) FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) AS ingredients_json
          FROM recipes r
          WHERE r.is_custom = 1 AND r.created_by_user_id = ?
          ORDER BY r.name ASC
        `).bind(userId).all();

        const custom_recipes = recipes.results.map(r => ({
          id: r.id,
          name: r.name,
          emoji: r.emoji,
          description: r.description,
          prepTime: r.prep_time,
          cookTime: r.cook_time,
          servings: r.servings,
          min_servings: r.min_servings,
          max_servings: r.max_servings,
          ingredients: JSON.parse(r.ingredients_json || "[]"),
          instructions: JSON.parse(r.instructions || "[]"),
          tips: r.tips || "",
          macros: JSON.parse(r.macros || "{}"),
          is_custom: true,
          created_by_user_id: r.created_by_user_id,
          estimated_cost_per_serving_gbp: r.estimated_cost_per_serving_gbp,
          tags: JSON.parse(r.tags || "[]")
        }));

        return new Response(JSON.stringify({
          version: "2.0",
          exported_at: new Date().toISOString(),
          staples: staples.results.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category,
            quantity: s.quantity,
            unit: s.unit
          })),
          inventory: inventory.results.map(i => ({
            id: i.id,
            name: i.name,
            category: i.category,
            quantity: i.quantity,
            unit: i.unit,
            expires_at: i.expires_at,
            created_at: i.created_at
          })),
          custom_recipes
        }), { status: 200, headers: corsHeaders });
      }

      if (method === "GET" && path === "/api/export/staples.csv") {
        const staples = await db.prepare("SELECT * FROM staples WHERE user_id = ? ORDER BY name ASC").bind(userId).all();
        let csv = "name,category,quantity,unit\n";
        for (const s of staples.results) {
          const name = s.name.includes(",") || s.name.includes('"') ? `"${s.name.replace(/"/g, '""')}"` : s.name;
          const qty = s.quantity !== null ? s.quantity : "";
          const unit = s.unit !== null ? s.unit : "";
          csv += `${name},${s.category},${qty},${unit}\n`;
        }

        return new Response(csv, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="staples.csv"'
          }
        });
      }

      if (method === "GET" && path === "/api/export/inventory.csv") {
        const inventory = await db.prepare("SELECT * FROM food_inventory WHERE user_id = ? ORDER BY name ASC").bind(userId).all();
        let csv = "name,category,quantity,unit\n";
        for (const i of inventory.results) {
          const name = i.name.includes(",") || i.name.includes('"') ? `"${i.name.replace(/"/g, '""')}"` : i.name;
          csv += `${name},${i.category},${i.quantity},${i.unit}\n`;
        }

        return new Response(csv, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="inventory.csv"'
          }
        });
      }

      // Import JSON API
      if (method === "POST" && path === "/api/import") {
        const body = await request.json();
        if (!body || (body.version !== "1.0" && body.version !== "2.0")) {
          return new Response(JSON.stringify({ error: "Invalid backup file: Unsupported version. Only version '1.0' and '2.0' are supported." }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const statements = [];
        let staplesCount = 0;
        let inventoryCount = 0;
        let recipesCount = 0;

        // 1. Staples
        if (Array.isArray(body.staples)) {
          staplesCount = body.staples.length;
          for (const s of body.staples) {
            const id = s.id || `staple-${crypto.randomUUID()}`;
            const qty = s.quantity !== undefined && s.quantity !== null && s.quantity !== "" ? Number(s.quantity) : null;
            const unit = s.unit !== undefined && s.unit !== null && s.unit !== "" ? String(s.unit) : null;

            statements.push(
              db.prepare(`
                INSERT INTO staples (id, user_id, name, category, quantity, unit)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, name) DO UPDATE SET
                  quantity = excluded.quantity,
                  unit = excluded.unit,
                  category = excluded.category
              `).bind(id, userId, s.name, s.category, qty, unit)
            );
          }
        }

        // 2. Inventory
        if (Array.isArray(body.inventory)) {
          inventoryCount = body.inventory.length;
          for (const i of body.inventory) {
            const id = i.id || `inv-${crypto.randomUUID()}`;
            const qty = Number(i.quantity) || 0;
            const unit = String(i.unit || "unit");
            const expires_at = i.expires_at || null;
            const created_at = i.created_at || new Date().toISOString();

            statements.push(
              db.prepare(`
                INSERT INTO food_inventory (id, user_id, name, category, quantity, unit, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, name) DO UPDATE SET
                  quantity = excluded.quantity,
                  unit = excluded.unit,
                  category = excluded.category,
                  expires_at = COALESCE(excluded.expires_at, food_inventory.expires_at),
                  created_at = COALESCE(excluded.created_at, food_inventory.created_at)
              `).bind(id, userId, i.name, i.category, qty, unit, expires_at, created_at)
            );
          }
        }

        // 3. Recipes
        if (Array.isArray(body.custom_recipes)) {
          recipesCount = body.custom_recipes.length;
          
          const existingRecipes = await db.prepare("SELECT id, name FROM recipes WHERE created_by_user_id = ? AND is_custom = 1").bind(userId).all();
          const nameMap = new Map();
          const idMap = new Map();
          for (const row of existingRecipes.results) {
            nameMap.set(row.name.trim().toLowerCase(), row.id);
            idMap.set(row.id, row.name);
          }

          for (const r of body.custom_recipes) {
            const nameKey = r.name.trim().toLowerCase();
            let recipeId;
            if (nameMap.has(nameKey)) {
              recipeId = nameMap.get(nameKey);
            } else if (r.id && idMap.has(r.id)) {
              recipeId = r.id;
              nameMap.set(nameKey, recipeId);
            } else {
              recipeId = "custom-" + crypto.randomUUID();
              nameMap.set(nameKey, recipeId);
              idMap.set(recipeId, r.name);
            }

            statements.push(
              db.prepare(`
                INSERT INTO recipes (
                  id, name, emoji, description, prep_time, cook_time, servings, 
                  ingredients, instructions, tips, macros, min_servings, max_servings, 
                  is_custom, created_by_user_id, estimated_cost_per_serving_gbp, tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  name = excluded.name,
                  emoji = excluded.emoji,
                  description = excluded.description,
                  prep_time = excluded.prep_time,
                  cook_time = excluded.cook_time,
                  servings = excluded.servings,
                  ingredients = excluded.ingredients,
                  instructions = excluded.instructions,
                  tips = excluded.tips,
                  macros = excluded.macros,
                  min_servings = excluded.min_servings,
                  max_servings = excluded.max_servings,
                  is_custom = 1,
                  created_by_user_id = ?,
                  estimated_cost_per_serving_gbp = excluded.estimated_cost_per_serving_gbp,
                  tags = excluded.tags
              `).bind(
                recipeId,
                r.name,
                r.emoji || "🍳",
                r.description || "",
                r.prepTime || "0 min",
                r.cookTime || "0 min",
                r.servings || 2,
                JSON.stringify(r.ingredients || []),
                JSON.stringify(r.instructions || []),
                r.tips || "",
                JSON.stringify(r.macros || {}),
                r.min_servings !== undefined ? r.min_servings : null,
                r.max_servings !== undefined ? r.max_servings : null,
                userId,
                r.estimated_cost_per_serving_gbp !== undefined ? r.estimated_cost_per_serving_gbp : null,
                JSON.stringify(r.tags || []),
                userId
              )
            );

            statements.push(
              db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").bind(recipeId)
            );

            if (Array.isArray(r.ingredients)) {
              for (const ing of r.ingredients) {
                statements.push(
                  db.prepare(`
                    INSERT INTO recipe_ingredients (recipe_id, name, quantity_per_serving, unit, notes, category)
                    VALUES (?, ?, ?, ?, ?, ?)
                  `).bind(
                    recipeId,
                    ing.name,
                    Number(ing.quantity_per_serving),
                    ing.unit,
                    ing.notes || null,
                    ing.category
                  )
                );
              }
            }
          }
        }

        if (statements.length > 0) {
          await db.batch(statements);
        }

        return new Response(JSON.stringify({
          success: true,
          staplesCount,
          inventoryCount,
          recipesCount
        }), { status: 200, headers: corsHeaders });
      }

      // Recipe-specific Export/Import APIs
      if (method === "GET" && path === "/api/recipes/export/json") {
        const recipes = await db.prepare(`
          SELECT r.*,
                 (SELECT json_group_array(json_object(
                    'name', ri.name,
                    'quantity_per_serving', ri.quantity_per_serving,
                    'unit', ri.unit,
                    'notes', ri.notes,
                    'category', ri.category
                 )) FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) AS ingredients_json
          FROM recipes r
          WHERE r.is_custom = 1 AND r.created_by_user_id = ?
          ORDER BY r.name ASC
        `).bind(userId).all();

        const formattedRecipes = recipes.results.map(r => {
          const baseServings = r.servings || 2;
          const baseMacros = JSON.parse(r.macros || "{}");
          const macros_per_serving = {
            calories: Math.round((baseMacros.calories || 0) / baseServings),
            protein_g: Math.round(((baseMacros.protein_g || 0) / baseServings) * 10) / 10,
            carbs_g: Math.round(((baseMacros.carbs_g || 0) / baseServings) * 10) / 10,
            fat_g: Math.round(((baseMacros.fat_g || 0) / baseServings) * 10) / 10
          };
          const ingredients = JSON.parse(r.ingredients_json || "[]").map(ing => ({
            name: ing.name,
            quantity_per_serving: ing.quantity_per_serving,
            unit: ing.unit,
            category: ing.category,
            notes: ing.notes || ""
          }));
          return {
            name: r.name,
            description: r.description || "",
            prep_time_mins: parseInt(r.prep_time) || 0,
            cook_time_mins: parseInt(r.cook_time) || 0,
            base_servings: baseServings,
            min_servings: r.min_servings,
            max_servings: r.max_servings,
            estimated_cost_per_serving_gbp: r.estimated_cost_per_serving_gbp,
            tags: JSON.parse(r.tags || "[]"),
            macros_per_serving,
            ingredients
          };
        });

        return new Response(JSON.stringify({
          version: "2.0",
          exported_at: new Date().toISOString(),
          recipes: formattedRecipes
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Content-Disposition": 'attachment; filename="recipes-export.json"'
          }
        });
      }

      if (method === "GET" && path === "/api/recipes/export/csv") {
        const recipes = await db.prepare(`
          SELECT r.*,
                 (SELECT json_group_array(json_object(
                    'name', ri.name,
                    'quantity_per_serving', ri.quantity_per_serving,
                    'unit', ri.unit,
                    'notes', ri.notes,
                    'category', ri.category
                 )) FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) AS ingredients_json
          FROM recipes r
          WHERE r.is_custom = 1 AND r.created_by_user_id = ?
          ORDER BY r.name ASC
        `).bind(userId).all();

        const csvRows = [];
        csvRows.push([
          "recipe_name", "description", "prep_time_mins", "cook_time_mins", "base_servings",
          "min_servings", "max_servings", "cost_per_serving_gbp", "tags",
          "calories", "protein_g", "carbs_g", "fat_g",
          "ingredient_name", "ingredient_qty", "ingredient_unit", "ingredient_category", "ingredient_notes"
        ].join(","));

        for (const r of recipes.results) {
          const baseServings = r.servings || 2;
          const baseMacros = JSON.parse(r.macros || "{}");
          const calories = Math.round((baseMacros.calories || 0) / baseServings);
          const protein_g = Math.round(((baseMacros.protein_g || 0) / baseServings) * 10) / 10;
          const carbs_g = Math.round(((baseMacros.carbs_g || 0) / baseServings) * 10) / 10;
          const fat_g = Math.round(((baseMacros.fat_g || 0) / baseServings) * 10) / 10;

          const tagsArr = JSON.parse(r.tags || "[]");
          const tagsStr = tagsArr.join(";");

          const ingredients = JSON.parse(r.ingredients_json || "[]");

          for (const ing of ingredients) {
            const row = [
              escapeCSV(r.name),
              escapeCSV(r.description || ""),
              escapeCSV(parseInt(r.prep_time) || 0),
              escapeCSV(parseInt(r.cook_time) || 0),
              escapeCSV(baseServings),
              escapeCSV(r.min_servings),
              escapeCSV(r.max_servings),
              escapeCSV(r.estimated_cost_per_serving_gbp),
              escapeCSV(tagsStr),
              escapeCSV(calories),
              escapeCSV(protein_g),
              escapeCSV(carbs_g),
              escapeCSV(fat_g),
              escapeCSV(ing.name),
              escapeCSV(ing.quantity_per_serving),
              escapeCSV(ing.unit),
              escapeCSV(ing.category),
              escapeCSV(ing.notes || "")
            ];
            csvRows.push(row.join(","));
          }
        }

        return new Response(csvRows.join("\n"), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="recipes-export.csv"'
          }
        });
      }

      if (method === "POST" && path === "/api/recipes/import/json") {
        const body = await request.json();
        if (!body || body.version !== "2.0" || !Array.isArray(body.recipes)) {
          return new Response(JSON.stringify({ error: "Invalid payload: version '2.0' and recipes array required." }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const existingRecipes = await db.prepare("SELECT id, name FROM recipes WHERE created_by_user_id = ? AND is_custom = 1").bind(userId).all();
        const nameMap = new Map();
        const idMap = new Map();
        for (const row of existingRecipes.results) {
          nameMap.set(row.name.trim().toLowerCase(), row.id);
          idMap.set(row.id, row.name);
        }

        const statements = [];
        let imported = 0;
        let updated = 0;
        let skipped = 0;
        const errors = [];

        for (const r of body.recipes) {
          const valErrors = validateRecipe(r);
          if (valErrors.length > 0) {
            skipped++;
            errors.push({ recipe: r.name || "Unnamed Recipe", errors: valErrors });
            continue;
          }

          const nameKey = r.name.trim().toLowerCase();
          let recipeId;
          let isUpdate = false;

          if (nameMap.has(nameKey)) {
            recipeId = nameMap.get(nameKey);
            isUpdate = true;
          } else if (r.id && idMap.has(r.id)) {
            recipeId = r.id;
            isUpdate = true;
            nameMap.set(nameKey, recipeId);
          } else {
            recipeId = "custom-" + crypto.randomUUID();
            nameMap.set(nameKey, recipeId);
            idMap.set(recipeId, r.name);
          }

          if (isUpdate) {
            updated++;
          } else {
            imported++;
          }

          const baseServings = Number(r.base_servings);
          const baseMacros = {
            calories: Math.round((Number(r.macros_per_serving.calories) || 0) * baseServings),
            protein_g: Math.round((Number(r.macros_per_serving.protein_g) || 0) * baseServings * 10) / 10,
            carbs_g: Math.round((Number(r.macros_per_serving.carbs_g) || 0) * baseServings * 10) / 10,
            fat_g: Math.round((Number(r.macros_per_serving.fat_g) || 0) * baseServings * 10) / 10
          };

          const minServings = r.min_servings !== undefined && r.min_servings !== null && r.min_servings !== "" ? Number(r.min_servings) : null;
          const maxServings = r.max_servings !== undefined && r.max_servings !== null && r.max_servings !== "" ? Number(r.max_servings) : null;
          const estimatedCost = r.estimated_cost_per_serving_gbp !== undefined && r.estimated_cost_per_serving_gbp !== null && r.estimated_cost_per_serving_gbp !== "" ? Number(r.estimated_cost_per_serving_gbp) : null;

          statements.push(
            db.prepare(`
              INSERT INTO recipes (
                id, name, emoji, description, prep_time, cook_time, servings, 
                ingredients, instructions, tips, macros, min_servings, max_servings, 
                is_custom, created_by_user_id, estimated_cost_per_serving_gbp, tags
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                emoji = excluded.emoji,
                description = excluded.description,
                prep_time = excluded.prep_time,
                cook_time = excluded.cook_time,
                servings = excluded.servings,
                ingredients = excluded.ingredients,
                instructions = excluded.instructions,
                tips = excluded.tips,
                macros = excluded.macros,
                min_servings = excluded.min_servings,
                max_servings = excluded.max_servings,
                is_custom = 1,
                created_by_user_id = ?,
                estimated_cost_per_serving_gbp = excluded.estimated_cost_per_serving_gbp,
                tags = excluded.tags
            `).bind(
              recipeId,
              r.name,
              r.emoji || "🍳",
              r.description || "",
              `${r.prep_time_mins || 0} min`,
              `${r.cook_time_mins || 0} min`,
              baseServings,
              JSON.stringify(r.ingredients || []),
              JSON.stringify(r.instructions || []),
              r.tips || "",
              JSON.stringify(baseMacros),
              minServings,
              maxServings,
              userId,
              estimatedCost,
              JSON.stringify(r.tags || []),
              userId
            )
          );

          statements.push(
            db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").bind(recipeId)
          );

          for (const ing of r.ingredients) {
            statements.push(
              db.prepare(
                "INSERT INTO recipe_ingredients (recipe_id, name, quantity_per_serving, unit, notes, category) VALUES (?, ?, ?, ?, ?, ?)"
              ).bind(
                recipeId,
                ing.name,
                Number(ing.quantity_per_serving),
                ing.unit.trim().toLowerCase(),
                ing.notes || null,
                ing.category
              )
            );
          }
        }

        if (statements.length > 0) {
          await db.batch(statements);
        }

        return new Response(JSON.stringify({
          imported,
          updated,
          skipped,
          errors
        }), { status: 200, headers: corsHeaders });
      }

      if (method === "POST" && path === "/api/recipes/import/csv") {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file) {
          return new Response(JSON.stringify({ error: "No file uploaded." }), { status: 400, headers: corsHeaders });
        }
        const text = await file.text();
        const rows = parseCSV(text);
        
        if (rows.length < 2) {
          return new Response(JSON.stringify({ error: "CSV file is empty or missing data." }), { status: 400, headers: corsHeaders });
        }
        
        const headers = rows[0].map(h => h.trim().toLowerCase());
        const expectedHeaders = [
          "recipe_name", "base_servings", "calories", "protein_g", "carbs_g", "fat_g",
          "ingredient_name", "ingredient_qty", "ingredient_unit", "ingredient_category"
        ];
        const missing = expectedHeaders.filter(h => !headers.includes(h));
        if (missing.length > 0) {
          return new Response(JSON.stringify({ error: `Invalid CSV headers. Missing required columns: ${missing.join(", ")}` }), { status: 400, headers: corsHeaders });
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
        
        const recipesList = Array.from(recipeMap.values());
        
        const existingRecipes = await db.prepare("SELECT id, name FROM recipes WHERE created_by_user_id = ? AND is_custom = 1").bind(userId).all();
        const nameMap = new Map();
        const idMap = new Map();
        for (const row of existingRecipes.results) {
          nameMap.set(row.name.trim().toLowerCase(), row.id);
          idMap.set(row.id, row.name);
        }

        const statements = [];
        let imported = 0;
        let updated = 0;
        let skipped = 0;
        const errors = [];

        for (const r of recipesList) {
          const valErrors = validateRecipe(r);
          if (valErrors.length > 0) {
            skipped++;
            errors.push({ recipe: r.name || "Unnamed Recipe", errors: valErrors });
            continue;
          }

          const nameKey = r.name.trim().toLowerCase();
          let recipeId;
          let isUpdate = false;

          if (nameMap.has(nameKey)) {
            recipeId = nameMap.get(nameKey);
            isUpdate = true;
          } else if (r.id && idMap.has(r.id)) {
            recipeId = r.id;
            isUpdate = true;
            nameMap.set(nameKey, recipeId);
          } else {
            recipeId = "custom-" + crypto.randomUUID();
            nameMap.set(nameKey, recipeId);
            idMap.set(recipeId, r.name);
          }

          if (isUpdate) {
            updated++;
          } else {
            imported++;
          }

          const baseServings = Number(r.base_servings);
          const baseMacros = {
            calories: Math.round((Number(r.macros_per_serving.calories) || 0) * baseServings),
            protein_g: Math.round((Number(r.macros_per_serving.protein_g) || 0) * baseServings * 10) / 10,
            carbs_g: Math.round((Number(r.macros_per_serving.carbs_g) || 0) * baseServings * 10) / 10,
            fat_g: Math.round((Number(r.macros_per_serving.fat_g) || 0) * baseServings * 10) / 10
          };

          const minServings = r.min_servings !== undefined && r.min_servings !== null && r.min_servings !== "" ? Number(r.min_servings) : null;
          const maxServings = r.max_servings !== undefined && r.max_servings !== null && r.max_servings !== "" ? Number(r.max_servings) : null;
          const estimatedCost = r.estimated_cost_per_serving_gbp !== undefined && r.estimated_cost_per_serving_gbp !== null && r.estimated_cost_per_serving_gbp !== "" ? Number(r.estimated_cost_per_serving_gbp) : null;

          statements.push(
            db.prepare(`
              INSERT INTO recipes (
                id, name, emoji, description, prep_time, cook_time, servings, 
                ingredients, instructions, tips, macros, min_servings, max_servings, 
                is_custom, created_by_user_id, estimated_cost_per_serving_gbp, tags
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                emoji = excluded.emoji,
                description = excluded.description,
                prep_time = excluded.prep_time,
                cook_time = excluded.cook_time,
                servings = excluded.servings,
                ingredients = excluded.ingredients,
                instructions = excluded.instructions,
                tips = excluded.tips,
                macros = excluded.macros,
                min_servings = excluded.min_servings,
                max_servings = excluded.max_servings,
                is_custom = 1,
                created_by_user_id = ?,
                estimated_cost_per_serving_gbp = excluded.estimated_cost_per_serving_gbp,
                tags = excluded.tags
            `).bind(
              recipeId,
              r.name,
              r.emoji || "🍳",
              r.description || "",
              `${r.prep_time_mins || 0} min`,
              `${r.cook_time_mins || 0} min`,
              baseServings,
              JSON.stringify(r.ingredients || []),
              JSON.stringify(r.instructions || []),
              r.tips || "",
              JSON.stringify(baseMacros),
              minServings,
              maxServings,
              userId,
              estimatedCost,
              JSON.stringify(r.tags || []),
              userId
            )
          );

          statements.push(
            db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").bind(recipeId)
          );

          for (const ing of r.ingredients) {
            statements.push(
              db.prepare(
                "INSERT INTO recipe_ingredients (recipe_id, name, quantity_per_serving, unit, notes, category) VALUES (?, ?, ?, ?, ?, ?)"
              ).bind(
                recipeId,
                ing.name,
                Number(ing.quantity_per_serving),
                ing.unit.trim().toLowerCase(),
                ing.notes || null,
                ing.category
              )
            );
          }
        }

        if (statements.length > 0) {
          await db.batch(statements);
        }

        return new Response(JSON.stringify({
          imported,
          updated,
          skipped,
          errors
        }), { status: 200, headers: corsHeaders });
      }

      // 5. Shopping Checked State Tracking
      if (path === "/api/shopping/checks") {
        if (method === "GET") {
          const weekLabel = url.searchParams.get("week_label") || "This week";
          const checks = await db.prepare("SELECT item_key, is_checked FROM shopping_item_checks WHERE user_id = ? AND week_label = ?")
            .bind(userId, weekLabel)
            .all();
          return new Response(JSON.stringify(checks.results), { status: 200, headers: corsHeaders });
        }

        if (method === "POST") {
          const { week_label, item_key, is_checked } = await request.json();
          if (!week_label || !item_key) {
            return new Response(JSON.stringify({ error: "week_label and item_key required." }), { status: 400, headers: corsHeaders });
          }

          await db.prepare(
            "INSERT OR REPLACE INTO shopping_item_checks (user_id, week_label, item_key, is_checked) VALUES (?, ?, ?, ?)"
          ).bind(
            userId,
            week_label,
            item_key,
            is_checked ? 1 : 0
          ).run();

          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }
      }

      // 6. Household API Endpoints
      // POST /api/household/setup
      if (method === "POST" && path === "/api/household/setup") {
        const { members } = await request.json();
        if (!Array.isArray(members) || members.length === 0) {
          return new Response(JSON.stringify({ error: "members array required." }), { status: 400, headers: corsHeaders });
        }

        // Clean up any existing household (cascade delete handles members, macros, allergies)
        await db.prepare("DELETE FROM households WHERE user_id = ?").bind(userId).run();

        // Create household
        const householdRes = await db.prepare("INSERT INTO households (user_id) VALUES (?)").bind(userId).run();
        const householdId = householdRes.meta.last_row_id;

        // Create members, macro goals, and allergies
        for (const m of members) {
          if (!m.name || !m.age || !m.sex || !m.weight_kg || !m.height_cm || !m.macro_goals) {
            return new Response(JSON.stringify({ error: "Missing member required fields (name, age, sex, weight_kg, height_cm, macro_goals)." }), {
              status: 400,
              headers: corsHeaders
            });
          }

          const memberRes = await db.prepare(
            "INSERT INTO household_members (household_id, name, age, sex, weight_kg, height_cm) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(householdId, m.name, Number(m.age), m.sex, Number(m.weight_kg), Number(m.height_cm)).run();
          const memberId = memberRes.meta.last_row_id;

          const { calories, protein_g, carbs_g, fat_g } = m.macro_goals;
          await db.prepare(
            "INSERT INTO macro_goals (member_id, calories, protein_g, carbs_g, fat_g) VALUES (?, ?, ?, ?, ?)"
          ).bind(memberId, Number(calories), Number(protein_g), Number(carbs_g), Number(fat_g)).run();

          if (Array.isArray(m.allergies)) {
            for (const allergy of m.allergies) {
              await db.prepare(
                "INSERT INTO member_allergies (member_id, allergy) VALUES (?, ?)"
              ).bind(memberId, allergy).run();
            }
          }
        }

        return new Response(JSON.stringify({ success: true, message: "Household setup complete." }), { status: 201, headers: corsHeaders });
      }

      // GET /api/household
      if (method === "GET" && path === "/api/household") {
        const household = await db.prepare("SELECT * FROM households WHERE user_id = ?").bind(userId).first();
        if (!household) {
          return new Response(JSON.stringify({ error: "Household not found." }), { status: 404, headers: corsHeaders });
        }

        const members = await db.prepare("SELECT * FROM household_members WHERE household_id = ? ORDER BY id ASC").bind(household.id).all();
        const membersList = [];

        for (const member of members.results) {
          const macros = await db.prepare("SELECT * FROM macro_goals WHERE member_id = ?").bind(member.id).first();
          const allergies = await db.prepare("SELECT allergy FROM member_allergies WHERE member_id = ?").bind(member.id).all();

          membersList.push({
            id: member.id,
            name: member.name,
            age: member.age,
            sex: member.sex,
            weight_kg: member.weight_kg,
            height_cm: member.height_cm,
            macro_goals: macros ? {
              calories: macros.calories,
              protein_g: macros.protein_g,
              carbs_g: macros.carbs_g,
              fat_g: macros.fat_g
            } : null,
            allergies: allergies.results.map(a => a.allergy)
          });
        }

        return new Response(JSON.stringify({
          id: household.id,
          user_id: household.user_id,
          created_at: household.created_at,
          members: membersList
        }), { status: 200, headers: corsHeaders });
      }

      // PUT /api/household/member/:id
      if (method === "PUT" && path.startsWith("/api/household/member/")) {
        const memberId = parseInt(path.split("/").pop());
        if (!memberId || isNaN(memberId)) {
          return new Response(JSON.stringify({ error: "Invalid member ID." }), { status: 400, headers: corsHeaders });
        }

        const { name, age, sex, weight_kg, height_cm, macro_goals, allergies } = await request.json();

        // Security check: Verify member belongs to logged-in user's household
        const member = await db.prepare(
          "SELECT hm.id FROM household_members hm JOIN households h ON hm.household_id = h.id WHERE hm.id = ? AND h.user_id = ?"
        ).bind(memberId, userId).first();

        if (!member) {
          return new Response(JSON.stringify({ error: "Member not found or unauthorized." }), { status: 404, headers: corsHeaders });
        }

        // Update basic fields
        await db.prepare(
          "UPDATE household_members SET name = ?, age = ?, sex = ?, weight_kg = ?, height_cm = ? WHERE id = ?"
        ).bind(name, Number(age), sex, Number(weight_kg), Number(height_cm), memberId).run();

        // Update macro targets
        if (macro_goals) {
          await db.prepare(
            "INSERT OR REPLACE INTO macro_goals (member_id, calories, protein_g, carbs_g, fat_g) VALUES (?, ?, ?, ?, ?)"
          ).bind(memberId, Number(macro_goals.calories), Number(macro_goals.protein_g), Number(macro_goals.carbs_g), Number(macro_goals.fat_g)).run();
        }

        // Update allergies (if specified)
        if (Array.isArray(allergies)) {
          await db.prepare("DELETE FROM member_allergies WHERE member_id = ?").bind(memberId).run();
          for (const allergy of allergies) {
            await db.prepare("INSERT INTO member_allergies (member_id, allergy) VALUES (?, ?)")
              .bind(memberId, allergy)
              .run();
          }
        }

        return new Response(JSON.stringify({ success: true, message: "Member updated successfully." }), { status: 200, headers: corsHeaders });
      }

      // 404 Route Not Found
      return new Response(JSON.stringify({ error: "API Endpoint not found." }), {
        status: 404,
        headers: corsHeaders
      });

    } catch (err) {
      console.error("Worker Execution Error:", err);
      return new Response(JSON.stringify({ error: err.message || "Internal server error." }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};
