-- 0007_staples_and_inventory.sql
-- Add D1 Staples and Food Inventory tables and migrate existing records

CREATE TABLE IF NOT EXISTS staples (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL,
    unit TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS food_inventory (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    expires_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Migrate existing weekly_staples data if any exists
INSERT OR IGNORE INTO staples (id, user_id, name, category, quantity, unit)
SELECT id, user_id, name, category, quantity, unit FROM weekly_staples;

-- Migrate existing inventory_items data if any exists
INSERT OR IGNORE INTO food_inventory (id, user_id, name, category, quantity, unit, created_at)
SELECT id, user_id, name, category, quantity, unit, date_added FROM inventory_items;
