# Couples Meal Planner

This repository contains the couples meal planner application, which runs on **Cloudflare Workers + D1** (SQLite database) and is styled using a modern responsive glassmorphic UI.

## Recipe Filtering & Curation

We have imported ~8,100 recipes from the Epicurious CC-licensed dataset. To make these recipes practical for weeknight dinners, we have a Python script to filter them down to a high-quality subset of ~1,000 dinner-style mains.

### Filtering Script

The curation logic is implemented in [filter_imported_recipes.py](file:///c:/Users/fabia/WebstormProjects/mealplanner-1/scripts/filter_imported_recipes.py).

#### Example Usage

Run the script from the root of the project using the Python launcher (`py`):

```powershell
py scripts/filter_imported_recipes.py --input external/epicurious_import.json --output external/epicurious_import_curated.json
```

#### Filtering Criteria & Heuristics

1. **Title Keyword Exclusion (obvious non-dinners)**:
   - **Desserts & Baking**: Discards titles containing words like `cake`, `cookie`, `brownie`, `pie`, `tart`, `ice cream`, etc.
   - **Breakfast**: Discards titles containing `granola`, `oatmeal`, `smoothie`, etc. `toast` is only kept if it also includes a main protein keyword in the title.
   - **Pure Sauces & Condiments**: Discards standalone extras like `sauce`, `vinaigrette`, `mayo`, `glaze`, `marinade` unless the title also contains a protein keyword.
2. **Main Protein Ingredient Requirement**:
   - Ensures that the recipe's ingredient list contains at least one main protein.
   - **Animal Protein**: `chicken`, `beef`, `steak`, `pork`, `bacon`, `sausage`, `turkey`, `lamb`, `duck`, `ham`, `salmon`, `cod`, `haddock`, `tuna`, `mackerel`, `prawn`, `shrimp`, `scallop`, `mince`, etc.
   - **Plant Protein**: `lentil`, `chickpea`, `garbanzo`, `bean`, `soy`, `soya`, `paneer`, `halloumi`.
   - *Bean Exclusion*: To avoid classifying green beans, vanilla beans, bean sprouts, or coffee beans as protein sources, these terms are explicitly ignored during the plant protein check.
3. **Scoring & Selection (Top ~1,000)**:
   - **Exotic Penalty**: Subtracts `30` points for overly exotic or hard-to-source ingredients (e.g. `foie gras`, `truffles`, `caviar`, `roe`, `wagyu`, `kobe`, `rabbit`, `venison`, etc.).
   - **Simplicity Penalty (Ingredient Count)**: Prefers a weeknight-friendly range. It targets an ideal range of `10-14` ingredients. Deviating from this range incurs a penalty. Extreme counts (`<= 3` or `>= 25`) receive a large penalty of `50` points.
   - **Preferred Protein Bonus**: Adds `15` points to recipes featuring preferred ingredients like `chicken`, `turkey`, `salmon`, `fish`, `tofu`, or `lentil`.
   - **Jitter**: Adds a random jitter between `0` and `0.5` points to ensure a diverse, shuffled selection within identical score bands.
   - Recipes are sorted by score descending, and the top **1,000** are selected.

---

## Seeding & Import Flow

To load the curated recipes into the application, you can use either of the following methods:

### Method 1: Frontend JSON Uploader (Recommended)

The Web UI has a built-in recipe importer:
1. Start the local dev server (run `npm run dev` inside `worker/` or run the wrangler dev server).
2. Log into the application in your browser.
3. In the recipes dropdown menu, click **Import JSON**.
4. Select `external/epicurious_import_curated.json` and upload it.
5. The application will validate the recipes against the target schema and bulk-insert them into D1 as custom recipes under your account.

### Method 2: Curated 300-Recipe Seed Seeding (First 300 Curated Recipes)

We default our seeding dataset to the first 300 curated recipes of the 1,000 curated dataset.

#### Step 1: Generate the 300-recipe seed file
To select the first 300 curated recipes and save them as the seed payload:
```powershell
py scripts/select_seed_recipes.py --input external/epicurious_import_curated.json --output seed/recipes_seed_300.json --count 300
```
This script will produce `seed/recipes_seed_300.json`.

#### Step 2: Copy to Worker and Reseed
Make sure to copy it to the worker module path:
```powershell
copy seed/recipes_seed_300.json worker/src/recipes_seed_300.json
```
When a new user logs in for the first time, or when the database tables are empty of built-ins, the Worker automatically reads from `recipes_seed_300.json` and seeds the D1 tables.

#### Step 3: Local/Remote Reseeding and Database Reset Commands
To force D1 database resetting and reseeding:

* **Local Dev Reset & Reseed**:
  Wipe all local built-in recipes:
  ```powershell
  npm run db:reset:local
  ```
  On the next request/login, the Worker seeder will re-populate D1 with the 300 recipes.

* **Remote Production Reset & Reseed**:
  Wipe all remote built-in recipes:
  ```powershell
  npm run db:reset:remote
  ```
  On the next live request/login, the remote Worker seeder will re-populate D1.

* **Redeploying to Cloudflare**:
  To bundle and deploy the latest Worker code containing the new seed file:
  ```powershell
  npm run deploy
  ```

