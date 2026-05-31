-- 0005_recipe_ingredients.sql
-- Create recipe_ingredients table and add min_servings / max_servings columns to recipes

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity_per_serving REAL NOT NULL,
    unit TEXT NOT NULL,
    notes TEXT,
    category TEXT NOT NULL
);

ALTER TABLE recipes ADD COLUMN min_servings INTEGER DEFAULT NULL;
ALTER TABLE recipes ADD COLUMN max_servings INTEGER DEFAULT NULL;

-- Automatically migrate existing recipes' JSON ingredients to the new structured table
INSERT INTO recipe_ingredients (recipe_id, name, quantity_per_serving, unit, notes, category)
SELECT 
    r.id AS recipe_id,
    json_extract(ing.value, '$.name') AS name,
    (CAST(json_extract(ing.value, '$.quantity') AS REAL) / CAST(r.servings AS REAL)) AS quantity_per_serving,
    json_extract(ing.value, '$.unit') AS unit,
    NULL AS notes,
    COALESCE(json_extract(ing.value, '$.category'), cat.key) AS category
FROM recipes r,
json_each(r.ingredients) cat,
json_each(cat.value) ing;

-- Apply sensible default locks to existing base recipes
UPDATE recipes SET min_servings = 2, max_servings = 6 WHERE id = 'chicken-stir-fry-rice-bowls';
UPDATE recipes SET min_servings = 2, max_servings = 8 WHERE id = 'beef-mince-pasta-bake';
UPDATE recipes SET min_servings = 1, max_servings = 4 WHERE id = 'salmon-sweet-potato-traybake';
UPDATE recipes SET min_servings = 1, max_servings = 6 WHERE id = 'chicken-fajita-traybake-wraps';
