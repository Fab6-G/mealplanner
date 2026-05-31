-- 0006_custom_recipes.sql
-- Add custom recipe, ownership, cost, and tags columns to the recipes table

ALTER TABLE recipes ADD COLUMN is_custom INTEGER NOT NULL DEFAULT 0;
ALTER TABLE recipes ADD COLUMN created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL;
ALTER TABLE recipes ADD COLUMN estimated_cost_per_serving_gbp REAL DEFAULT NULL;
ALTER TABLE recipes ADD COLUMN tags TEXT DEFAULT NULL;
