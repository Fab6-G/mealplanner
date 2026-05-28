-- 0002_household_schema.sql
-- Database schema for households, household members, macro goals, and member allergies

-- 1. Households table (One household per user)
CREATE TABLE IF NOT EXISTS households (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 2. Household Members table
CREATE TABLE IF NOT EXISTS household_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    sex TEXT CHECK(sex IN ('male', 'female', 'other')) NOT NULL,
    weight_kg REAL NOT NULL,
    height_cm REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Macro Goals table (One macro goal configuration per household member)
CREATE TABLE IF NOT EXISTS macro_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
    calories INTEGER NOT NULL,
    protein_g REAL NOT NULL,
    carbs_g REAL NOT NULL,
    fat_g REAL NOT NULL,
    UNIQUE(member_id)
);

-- 4. Member Allergies table (Bonus: track allergies per household member)
CREATE TABLE IF NOT EXISTS member_allergies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
    allergy TEXT CHECK(allergy IN ('gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish')) NOT NULL,
    UNIQUE(member_id, allergy)
);
