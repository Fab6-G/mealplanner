// index.js
// Cloudflare Worker API for Couples Meal Planner

import { defaultRecipes, defaultStaples } from "./seedData.js";

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
    const count = await db.prepare("SELECT COUNT(*) as cnt FROM recipes").first("cnt");
    if (count === 0) {
      console.log("Seeding recipes...");
      const statements = [];
      for (const r of defaultRecipes) {
        statements.push(
          db.prepare(
            "INSERT INTO recipes (id, name, emoji, description, prep_time, cook_time, servings, ingredients, instructions, tips, macros) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(
            r.id,
            r.name,
            r.emoji,
            r.description,
            r.prep_time,
            r.cook_time,
            r.servings,
            JSON.stringify(r.ingredients),
            JSON.stringify(r.instructions),
            r.tips,
            JSON.stringify(r.macros)
          )
        );
      }
      if (statements.length > 0) {
        await db.batch(statements);
        console.log("Successfully seeded", statements.length, "recipes");
      }
    }
  } catch (err) {
    console.error("Error seeding recipes:", err);
  }
}

async function seedStaplesIfEmpty(db, userId) {
  try {
    const count = await db.prepare("SELECT COUNT(*) as cnt FROM weekly_staples WHERE user_id = ?").bind(userId).first("cnt");
    if (count === 0) {
      console.log("Seeding weekly staples for user:", userId);
      const statements = [];
      for (const s of defaultStaples) {
        statements.push(
          db.prepare(
            "INSERT INTO weekly_staples (id, user_id, name, quantity, unit, category) VALUES (?, ?, ?, ?, ?, ?)"
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

      // 1. Recipes CRUD
      if (path === "/api/recipes") {
        if (method === "GET") {
          // Fetch recipes from D1
          const recipes = await db.prepare("SELECT * FROM recipes ORDER BY name ASC").all();
          
          // Map stored JSON back to object properties
          const list = recipes.results.map(r => ({
            id: r.id,
            name: r.name,
            emoji: r.emoji,
            description: r.description,
            prepTime: r.prep_time,
            cookTime: r.cook_time,
            servings: r.servings,
            ingredients: JSON.parse(r.ingredients),
            instructions: JSON.parse(r.instructions),
            tips: r.tips,
            macros: JSON.parse(r.macros)
          }));

          return new Response(JSON.stringify(list), { status: 200, headers: corsHeaders });
        }

        if (method === "POST") {
          const r = await request.json();
          await db.prepare(
            "INSERT OR REPLACE INTO recipes (id, name, emoji, description, prep_time, cook_time, servings, ingredients, instructions, tips, macros) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(
            r.id,
            r.name,
            r.emoji,
            r.description,
            r.prepTime || r.prep_time,
            r.cookTime || r.cook_time,
            r.servings,
            JSON.stringify(r.ingredients),
            JSON.stringify(r.instructions),
            r.tips,
            JSON.stringify(r.macros)
          ).run();

          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }
      }

      // GET /api/recipes/:id/portions
      if (method === "GET" && path.startsWith("/api/recipes/") && path.endsWith("/portions")) {
        const parts = path.split("/");
        // path is /api/recipes/:id/portions
        const recipeId = parts[3];

        const recipe = await db.prepare("SELECT * FROM recipes WHERE id = ?").bind(recipeId).first();
        if (!recipe) {
          return new Response(JSON.stringify({ error: "Recipe not found." }), { status: 404, headers: corsHeaders });
        }

        const household = await db.prepare("SELECT * FROM households WHERE user_id = ?").bind(userId).first();
        if (!household) {
          return new Response(JSON.stringify([]), { status: 200, headers: corsHeaders });
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
        const splitPortions = calculateProportionalSplit(baseMacros, membersList);

        return new Response(JSON.stringify(splitPortions), { status: 200, headers: corsHeaders });
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
          const items = await db.prepare("SELECT * FROM inventory_items WHERE user_id = ? ORDER BY name ASC").bind(userId).all();
          const results = items.results.map(i => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            category: i.category,
            dateAdded: i.date_added
          }));
          return new Response(JSON.stringify(results), { status: 200, headers: corsHeaders });
        }

        if (method === "POST") {
          const item = await request.json();
          if (!item.id || !item.name) {
            return new Response(JSON.stringify({ error: "Invalid item payload." }), { status: 400, headers: corsHeaders });
          }

          await db.prepare(
            "INSERT OR REPLACE INTO inventory_items (id, user_id, name, quantity, unit, category, date_added) VALUES (?, ?, ?, ?, ?, ?, ?)"
          ).bind(
            item.id,
            userId,
            item.name,
            Number(item.quantity) || 0,
            item.unit,
            item.category,
            item.dateAdded || new Date().toISOString()
          ).run();

          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }
      }

      // Delete Inventory Item
      if (method === "DELETE" && path.startsWith("/api/inventory/")) {
        const itemId = path.split("/").pop();
        if (itemId) {
          await db.prepare("DELETE FROM inventory_items WHERE id = ? AND user_id = ?").bind(itemId, userId).run();
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }
      }

      // 4. Weekly Staples CRUD
      if (path === "/api/staples") {
        if (method === "GET") {
          const items = await db.prepare("SELECT * FROM weekly_staples WHERE user_id = ? ORDER BY name ASC").bind(userId).all();
          return new Response(JSON.stringify(items.results), { status: 200, headers: corsHeaders });
        }

        if (method === "POST") {
          const staple = await request.json();
          if (!staple.id || !staple.name) {
            return new Response(JSON.stringify({ error: "Invalid staple payload." }), { status: 400, headers: corsHeaders });
          }

          await db.prepare(
            "INSERT OR REPLACE INTO weekly_staples (id, user_id, name, quantity, unit, category) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(
            staple.id,
            userId,
            staple.name,
            Number(staple.quantity) || 0,
            staple.unit,
            staple.category
          ).run();

          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }
      }

      // Delete Staple Item
      if (method === "DELETE" && path.startsWith("/api/staples/")) {
        const stapleId = path.split("/").pop();
        if (stapleId) {
          await db.prepare("DELETE FROM weekly_staples WHERE id = ? AND user_id = ?").bind(stapleId, userId).run();
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }
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
