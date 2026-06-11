# Source data attribution: josephrmartinez/recipe-dataset (Epicurious, CC BY-SA 3.0)
# This script filters the large JSON of imported recipes from the Epicurious dataset
# down to a curated subset of ~1,000 dinner-style mains.

import json
import random
import argparse
import sys
from pathlib import Path

# Obvious non-dinners keywords (case-insensitive)
DESSERT_KEYWORDS = [
    "cake", "cookie", "brownie", "cupcake", "muffin", "pancake", "waffle",
    "pie", "tart", "crumble", "pudding", "scone", "donut", "doughnut",
    "ice cream", "sorbet", "granita", "fudge", "truffle", "candy", "toffee",
    "jam", "jelly", "meringue", "macaron", "cheesecake"
]

BREAKFAST_KEYWORDS = [
    "granola", "oatmeal", "porridge", "smoothie", "shake",
    "frittata", "omelet", "omelette", "muesli", "toast"
]

SAUCE_KEYWORDS = [
    "sauce", "vinaigrette", "aioli", "mayonnaise", "mayo",
    "dip", "salsa", "syrup", "frosting", "icing", "glaze", "marinade"
]

# Protein keywords
ANIMAL_PROTEIN = [
    "chicken", "beef", "steak", "pork", "bacon", "sausage", "turkey", "lamb",
    "duck", "ham", "salmon", "cod", "haddock", "tuna", "mackerel",
    "prawn", "shrimp", "scallop", "fish fillet", "mince", "minced beef", "minced pork"
]

PLANT_PROTEIN = [
    "lentil", "chickpea", "garbanzo", "bean",
    "kidney bean", "black bean", "pinto bean", "soy", "soya",
    "paneer", "halloumi"
]

ALL_PROTEINS = ANIMAL_PROTEIN + PLANT_PROTEIN

# Preferred proteins for bonus
PREFERRED_PROTEINS = [
    "chicken", "turkey", "salmon", "cod", "haddock", "tuna", "mackerel",
    "prawn", "shrimp", "fish", "tofu", "lentil"
]

# Exotic ingredients
EXOTIC_INGREDIENTS = [
    "foie gras", "truffle oil", "black truffle", "morel", "chanterelle", "porcini",
    "uni", "caviar", "roe", "wagyu", "kobe", "rabbit", "sweetbread", "squab",
    "pigeon", "quail", "venison", "elk", "bison", "octopus", "cuttlefish",
    "snail", "escargot", "alligator", "frog leg"
]

# Bean exclusion words to prevent veg beans/flavourings from being counted as protein
BEAN_EXCLUSIONS = [
    "green bean", "runner bean", "french bean", "vanilla bean", "bean sprout", "coffee bean"
]

def contains_any(text, keywords):
    t = text.lower()
    return any(k in t for k in keywords)

def is_obvious_non_dinner(name: str) -> bool:
    name_lower = name.lower()
    
    # Check desserts
    if any(k in name_lower for k in DESSERT_KEYWORDS):
        return True
        
    # Check breakfast (keep toast only if there is a main protein keyword in title)
    if any(k in name_lower for k in BREAKFAST_KEYWORDS):
        if "toast" in name_lower:
            # Only keep toast if it also contains protein terms in the title
            if any(p in name_lower for p in ALL_PROTEINS):
                return False
        return True
        
    # Check sauce / condiment / extras (when standalone)
    if any(k in name_lower for k in SAUCE_KEYWORDS):
        # If the title contains a sauce keyword, keep it only if it also contains a protein
        if not any(p in name_lower for p in ALL_PROTEINS):
            return True
            
    return False

def has_main_protein(recipe) -> bool:
    ingredients = recipe.get("ingredients", [])
    for ing in ingredients:
        name = ing.get("name", "").lower()
        # Check animal proteins
        if any(p in name for p in ANIMAL_PROTEIN):
            return True
            
        # Check plant proteins
        for p in PLANT_PROTEIN:
            if p in name:
                # Special handling for "bean" to exclude non-protein variants
                if p == "bean":
                    if any(ex in name for ex in BEAN_EXCLUSIONS):
                        continue
                return True
    return False

def has_exotic_ingredient(recipe) -> bool:
    ingredients = recipe.get("ingredients", [])
    for ing in ingredients:
        name = ing.get("name", "").lower()
        if any(ex in name for ex in EXOTIC_INGREDIENTS):
            return True
    return False

def has_preferred_protein(recipe) -> bool:
    name_lower = recipe.get("name", "").lower()
    if any(p in name_lower for p in PREFERRED_PROTEINS):
        return True
    ingredients = recipe.get("ingredients", [])
    for ing in ingredients:
        ing_name = ing.get("name", "").lower()
        if any(p in ing_name for p in PREFERRED_PROTEINS):
            return True
    return False

def compute_score(recipe) -> float:
    score = 100.0
    
    # 1. Exotic penalty
    if has_exotic_ingredient(recipe):
        score -= 30.0
        
    # 2. Ingredient count check
    ing_count = len(recipe.get("ingredients", []))
    
    # Distance from ideal range (10-14)
    if ing_count < 10:
        distance = 10 - ing_count
        score -= distance * 2.0
    elif ing_count > 14:
        distance = ing_count - 14
        score -= distance * 2.0
        
    # Extreme ingredient counts (prefer weeknight-friendly range: 5 to 18)
    if ing_count <= 3 or ing_count >= 25:
        score -= 50.0
        
    # 3. Preferred protein bonus
    if has_preferred_protein(recipe):
        score += 15.0
        
    # 4. Small random jitter to shuffle within similar score bands
    score += random.uniform(0.0, 0.5)
    
    return score

def main():
    parser = argparse.ArgumentParser(description="Filter imported recipes down to a curated subset of ~1,000 dinners.")
    parser.add_argument("--input", required=True, help="Path to the input JSON file of recipes")
    parser.add_argument("--output", required=True, help="Path to save the curated JSON output")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"Error: Input file '{input_path}' does not exist.")
        sys.exit(1)

    print(f"Loading recipes from: {input_path}")
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict) or "recipes" not in data:
        print("Error: Input JSON must contain a top-level 'recipes' array.")
        sys.exit(1)

    recipes = data["recipes"]
    total_recipes = len(recipes)
    print(f"Total recipes in input: {total_recipes}")

    # Stage 1: Drop obvious non-dinners by title
    filtered_stage1 = []
    removed_non_dinner = 0
    for r in recipes:
        name = r.get("name", "")
        if is_obvious_non_dinner(name):
            removed_non_dinner += 1
        else:
            filtered_stage1.append(r)

    print(f"Stage 1: Removed {removed_non_dinner} obvious non-dinners by title. Remaining: {len(filtered_stage1)}")

    # Stage 2: Require at least one main protein ingredient
    filtered_stage2 = []
    removed_no_protein = 0
    for r in filtered_stage1:
        if not has_main_protein(r):
            removed_no_protein += 1
        else:
            filtered_stage2.append(r)

    print(f"Stage 2: Removed {removed_no_protein} recipes lacking a main protein. Remaining: {len(filtered_stage2)}")

    # Stage 3: Scoring and selecting top ~1,000
    # Add random seed for reproducibility (using a fixed seed, or none for slight variation)
    random.seed(42) # Fixed seed to ensure stable results between runs of the script
    
    scored_recipes = []
    for r in filtered_stage2:
        score = compute_score(r)
        scored_recipes.append((score, r))

    # Sort descending by score
    scored_recipes.sort(key=lambda x: x[0], reverse=True)

    target_count = 1000
    if len(scored_recipes) <= target_count:
        curated_recipes = [r for _, r in scored_recipes]
    else:
        curated_recipes = [r for _, r in scored_recipes[:target_count]]

    removed_by_score = len(scored_recipes) - len(curated_recipes)
    print(f"Stage 3: Trimmed {removed_by_score} recipes by score rating. Selected top {len(curated_recipes)} recipes.")

    # Write output file
    output_data = {
        "version": data.get("version", "2.0"),
        "recipes": curated_recipes
    }

    # Ensure parent directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"Successfully wrote {len(curated_recipes)} curated recipes to: {output_path}")

if __name__ == "__main__":
    main()
