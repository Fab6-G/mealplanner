-- 0003_remove_hardcoded_portions.sql
-- Drop legacy hardcoded portion columns and add dynamic macros column to recipes table

CREATE TABLE IF NOT EXISTS recipes_new (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    description TEXT NOT NULL,
    prep_time TEXT NOT NULL,
    cook_time TEXT NOT NULL,
    servings INTEGER NOT NULL,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    tips TEXT NOT NULL,
    macros TEXT NOT NULL, -- JSON stringified base macros (calories, protein_g, carbs_g, fat_g)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing data, defaulting macros to a standard 2-person baseline
INSERT INTO recipes_new (
    id, name, emoji, description, prep_time, cook_time, servings, ingredients, instructions, tips, macros, created_at
)
SELECT 
    id, name, emoji, description, prep_time, cook_time, servings, ingredients, instructions, tips, 
    '{"calories":1200,"protein_g":100,"carbs_g":130,"fat_g":25}' AS macros, 
    created_at 
FROM recipes;

-- Drop legacy table and rename the modern one
DROP TABLE recipes;
ALTER TABLE recipes_new RENAME TO recipes;
