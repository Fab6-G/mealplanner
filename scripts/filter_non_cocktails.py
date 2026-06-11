# Source data attribution: josephrmartinez/recipe-dataset (Epicurious, CC BY-SA 3.0)
# This script transforms the Epicurious recipe CSV dataset into the JSON format
# expected by the mealplanner application's JSON uploader.

import csv
import sys
import ast
import re
import json
from pathlib import Path

def slugify(text: str) -> str:
    text = text.lower()
    # Replace non-alphanumeric/non-space/non-hyphen characters
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    # Replace whitespace and multiple hyphens with a single hyphen
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')

def get_description(instructions_text: str) -> str:
    if not instructions_text:
        return ""
    # Split by sentence ending punctuation followed by whitespace,
    # avoiding common recipe abbreviations and single letter initials.
    pattern = r'(?<!\boz\.)(?<!\blb\.)(?<!\blbs\.)(?<!\btsp\.)(?<!\btbsp\.)(?<!\bTbsp\.)(?<!\bTsp\.)(?<!\bmin\.)(?<!\bmins\.)(?<!\bapprox\.)(?<!\bdeg\.)(?<!\btemp\.)(?<!\b[A-Za-z]\.)(?<=[.!?])\s+'
    sentences = re.split(pattern, instructions_text.strip())
    if sentences:
        first_sentence = sentences[0].strip()
        # Clean up any inner newlines/returns
        first_sentence = first_sentence.replace('\n', ' ').replace('\r', '')
        if len(first_sentence) > 200:
            first_sentence = first_sentence[:197] + "..."
        return first_sentence
    return ""


COCKTAIL_KEYWORDS = [
    "cocktail", "martini", "margarita", "negroni", "mojito", "spritz",
    "daiquiri", "manhattan", "sidecar", "highball", "old fashioned",
    "paloma", "gimlet", "sazerac", "sling", "collins", "toddy",
    "pisco sour", "whisky sour", "whiskey sour", "bloody mary",
    "sangria", "cosmopolitan", "cosmo", "caipirinha", "mint julep",
    "aperol", "mimosa", "bellini"
]

HARD_SPIRIT_KEYWORDS = [
    "vodka", "gin", "rum", "tequila", "bourbon",
    "whisky", "whiskey", "scotch",
    "brandy", "cognac",
    "triple sec", "vermouth", "campari",
    "amaretto", "cointreau",
    "absinthe", "liqueur", "liqueurs"
]

FRACTIONS = {
    '½': 0.5, '⅓': 0.33, '⅔': 0.67, '¼': 0.25, '¾': 0.75,
    '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
    '⅙': 0.17, '⅚': 0.83, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
}

UNIT_MAPPING = {
    "g": "g", "kg": "kg", "ml": "ml", "l": "l",
    "piece": "piece", "pieces": "piece", "pc": "piece", "pcs": "pcs",
    "pack": "pack", "packs": "pack", "package": "pack", "packages": "pack", "pkg": "pack",
    "tin": "tin", "tins": "tin", "can": "tin", "cans": "tin",
    "jar": "jar", "jars": "jar",
    "loaf": "loaf", "loaves": "loaf",
    "box": "box", "boxes": "box",
    "tbsp": "tbsp", "tablespoon": "tbsp", "tablespoons": "tbsp", "tb": "tbsp",
    "tsp": "tsp", "teaspoon": "tsp", "teaspoons": "tsp",
    "whole": "whole"
}

UNIT_CONVERSIONS = {
    "cup": ("tbsp", 16.0),
    "cups": ("tbsp", 16.0),
    "pound": ("g", 453.6),
    "pounds": ("g", 453.6),
    "lb": ("g", 453.6),
    "lbs": ("g", 453.6),
    "ounce": ("g", 28.35),
    "ounces": ("g", 28.35),
    "oz": ("g", 28.35),
    "clove": ("piece", 1.0),
    "cloves": ("piece", 1.0),
    "slice": ("piece", 1.0),
    "slices": ("piece", 1.0),
    "sprig": ("piece", 1.0),
    "sprigs": ("piece", 1.0),
    "stalk": ("piece", 1.0),
    "stalks": ("piece", 1.0),
    "head": ("piece", 1.0),
    "heads": ("piece", 1.0),
    "handful": ("piece", 1.0),
    "handfuls": ("piece", 1.0),
    "pinch": ("tsp", 0.06),
    "pinches": ("tsp", 0.06),
}

def is_cocktail_title(title: str) -> bool:
    if not title:
        return False
    lt = title.lower()
    return any(k in lt for k in COCKTAIL_KEYWORDS)

def has_hard_spirit(ingredients: str) -> bool:
    if not ingredients:
        return False
    li = ingredients.lower()
    return any(k in li for k in HARD_SPIRIT_KEYWORDS)

def replace_fractions(text: str) -> str:
    for frac_char, val in FRACTIONS.items():
        text = re.sub(rf'(\d+){frac_char}', lambda m: str(float(m.group(1)) + val), text)
        text = text.replace(frac_char, str(val))
    return text

def get_category(name: str) -> str:
    name_lower = name.lower()
    if any(k in name_lower for k in ["chicken", "beef", "pork", "lamb", "turkey", "fish", "salmon", "tuna", "shrimp", "prawn", "bacon", "sausage", "meat", "anchovy", "anchovies", "chorizo"]):
        return "protein"
    if any(k in name_lower for k in ["milk", "cheese", "butter", "yogurt", "cream", "cheddar"]):
        return "dairy"
    if any(k in name_lower for k in ["onion", "garlic", "squash", "sage", "rosemary", "thyme", "parsley", "cilantro", "ginger", "shallot", "lime", "lemon", "potato", "potatoes", "celery", "carrot", "carrots", "chile", "chiles", "herb", "herbs", "apple", "apples", "orange", "oranges", "avocado", "dill", "tarragon"]):
        return "veg"
    if any(k in name_lower for k in ["rice", "bread", "pasta", "macaroni", "noodle", "noodles", "barley", "flour"]):
        return "carb"
    if any(k in name_lower for k in ["vinegar", "sauce", "mustard", "mayonnaise", "mayo", "oil", "miso"]):
        return "condiment"
    if any(k in name_lower for k in ["salt", "pepper", "paprika", "turmeric", "cumin", "allspice", "cinnamon", "nutmeg", "masala", "curry"]):
        return "spice"
    return "pantry"

def parse_ingredient_line(ing_str: str):
    text = re.sub(r'\(.*?\)', '', ing_str).strip()
    text = replace_fractions(text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    match = re.match(r'^([\d\.\s\-\+/]+)\s*(.*)$', text)
    qty = 1.0
    rest = text
    
    if match:
        qty_str, potential_rest = match.groups()
        qty_str = qty_str.strip()
        if re.search(r'\d', qty_str):
            try:
                parts = re.split(r'[\s\-\+]+', qty_str)
                temp_qty = 0.0
                for part in parts:
                    if not part:
                        continue
                    if '/' in part:
                        num, denom = part.split('/')
                        temp_qty += float(num) / float(denom)
                    else:
                        temp_qty += float(part)
                if temp_qty > 0:
                    qty = temp_qty
                    rest = potential_rest
            except Exception:
                pass
                
    rest = re.sub(r'^[\s\-\,\.\:]+', '', rest).strip()
    if not rest:
        return 1.0, "piece", "ingredient", "pantry"
        
    words = rest.split()
    first_word = words[0]
    word_clean = re.sub(r'[\.\,\:\;]+$', '', first_word).lower()
    
    options = [word_clean]
    if word_clean.endswith('s') and len(word_clean) > 1:
        options.append(word_clean[:-1])
        
    matched_unit = None
    unit_multiplier = 1.0
    
    for opt in options:
        if opt in UNIT_CONVERSIONS:
            target_unit, mult = UNIT_CONVERSIONS[opt]
            matched_unit = target_unit
            unit_multiplier = mult
            break
        elif opt in UNIT_MAPPING:
            matched_unit = UNIT_MAPPING[opt]
            break
            
    if matched_unit:
        qty = qty * unit_multiplier
        name = rest[len(first_word):].strip()
        name = re.sub(r'^[\s\-\,\.\:]+', '', name).strip()
    else:
        matched_unit = "piece"
        name = rest
        
    name = re.sub(r'^of\s+', '', name, flags=re.IGNORECASE).strip()
    if not name:
        name = "ingredient"
        
    category = get_category(name)
    if qty <= 0:
        qty = 1.0
        
    return round(qty, 2), matched_unit, name, category

def main(input_path: str, output_path: str):
    input_path = Path(input_path)
    output_path = Path(output_path)

    total_rows = 0
    removed = 0
    skipped_invalid = 0
    recipes_list = []

    with input_path.open("r", newline="", encoding="utf-8") as infile:
        reader = csv.DictReader(infile)

        for row in reader:
            total_rows += 1
            title = row.get("Title", "").strip()
            if not title:
                title = row.get("title", "").strip()
                
            if not title or title.lower() == "unnamed recipe":
                skipped_invalid += 1
                continue

            ingredients_str = row.get("Cleaned_Ingredients", "").strip()
            if not ingredients_str:
                ingredients_str = row.get("Ingredients", "").strip()
            if not ingredients_str:
                ingredients_str = row.get("ingredients", "").strip()

            if is_cocktail_title(title) or has_hard_spirit(ingredients_str):
                removed += 1
                continue

            # Parse instructions
            instructions_str = row.get("Instructions", "").strip()
            if not instructions_str:
                instructions_str = row.get("instructions", "").strip()
            
            # Split instructions into steps
            steps = [step.strip() for step in instructions_str.split('\n') if step.strip()]

            # Derive description
            description = get_description(instructions_str)

            ingredients_list = []
            if ingredients_str:
                try:
                    ingredients_list = ast.literal_eval(ingredients_str)
                except Exception:
                    if ingredients_str.startswith('[') and ingredients_str.endswith(']'):
                        s = ingredients_str[1:-1]
                        ingredients_list = [item.strip().strip("'\"") for item in s.split(',')]
                    else:
                        ingredients_list = [ingredients_str]

            if not ingredients_list:
                ingredients_list = []

            base_servings = 4
            parsed_ingredients = []

            for ing_str in ingredients_list:
                ing_str = ing_str.strip()
                if not ing_str:
                    continue
                
                qty, unit, name, category = parse_ingredient_line(ing_str)
                
                # Calculate quantity per serving
                qty_per_serving = round(qty / base_servings, 4)
                
                parsed_ingredients.append({
                    "name": name,
                    "quantity_per_serving": qty_per_serving,
                    "unit": unit,
                    "category": category,
                    "notes": ""
                })
            
            if not parsed_ingredients:
                skipped_invalid += 1
                continue
            
            # Stable generated ID
            kept_index = len(recipes_list) + 1
            slug = slugify(title)
            recipe_id = f"import-{slug}-{kept_index}"

            recipe_obj = {
                "id": recipe_id,
                "name": title,
                "description": description,
                "prep_time_mins": 0,
                "cook_time_mins": 0,
                "base_servings": base_servings,
                "min_servings": None,
                "max_servings": None,
                "estimated_cost_per_serving_gbp": None,
                "tags": [],
                "macros_per_serving": {
                    "calories": 0,
                    "protein_g": 0,
                    "carbs_g": 0,
                    "fat_g": 0
                },
                "ingredients": parsed_ingredients,
                "instructions": steps
            }
            
            recipes_list.append(recipe_obj)

    # Wrap in JSON envelope version 2.0
    output_data = {
        "version": "2.0",
        "recipes": recipes_list
    }

    with output_path.open("w", encoding="utf-8") as outfile:
        json.dump(output_data, outfile, indent=2, ensure_ascii=False)

    print(f"Total rows processed: {total_rows}")
    print(f"Removed as cocktails/drinks: {removed}")
    print(f"Skipped as invalid (missing name or ingredients): {skipped_invalid}")
    print(f"Successfully written to JSON: {len(recipes_list)}")
    print(f"Output JSON written to: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: py filter_non_cocktails.py 13k-recipes.csv epicurious_import.json")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
