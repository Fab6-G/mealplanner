-- 0001_schema.sql
-- Database schema for the couples meal planner app

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, -- Secure token string (UUID / Secure Token)
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL, -- UNIX timestamp
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Recipes
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    description TEXT NOT NULL,
    prep_time TEXT NOT NULL,
    cook_time TEXT NOT NULL,
    servings INTEGER NOT NULL,
    ingredients TEXT NOT NULL, -- JSON stringified ingredients object
    instructions TEXT NOT NULL, -- JSON stringified array of instructions
    tips TEXT NOT NULL,
    macros TEXT NOT NULL, -- JSON stringified base macros (calories, protein_g, carbs_g, fat_g)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Weekly Plans
CREATE TABLE IF NOT EXISTS weekly_plans (
    id TEXT PRIMARY KEY, -- e.g. "week-2026-05-26" or UUID
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_label TEXT NOT NULL, -- e.g. "Feb 3–9, 2026"
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, week_label)
);

-- 5. Weekly Plan Days
CREATE TABLE IF NOT EXISTS weekly_plan_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weekly_plan_id TEXT NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
    day TEXT NOT NULL, -- e.g. "Monday", "Tuesday"
    recipe_id TEXT REFERENCES recipes(id) ON DELETE SET NULL,
    UNIQUE(weekly_plan_id, day)
);

-- 6. Pantry / Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY, -- Client-side generated UUID
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    category TEXT NOT NULL,
    date_added TEXT NOT NULL
);

-- 7. Weekly Staples
CREATE TABLE IF NOT EXISTS weekly_staples (
    id TEXT PRIMARY KEY, -- Client-side generated UUID
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    category TEXT NOT NULL
);

-- 8. Shopping Item Checks
CREATE TABLE IF NOT EXISTS shopping_item_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_label TEXT NOT NULL,
    item_key TEXT NOT NULL, -- category::name::unit
    is_checked INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, week_label, item_key)
);
