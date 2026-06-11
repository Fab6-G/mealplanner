import json
import argparse
from pathlib import Path
import sys

def main():
    parser = argparse.ArgumentParser(description="Extract the first N recipes for seeding.")
    parser.add_argument("--input", default="external/epicurious_import_curated.json", help="Path to curated JSON")
    parser.add_argument("--output", default="seed/recipes_seed_300.json", help="Path to write the 300 seed JSON")
    parser.add_argument("--count", type=int, default=300, help="Number of recipes to extract")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"Error: Curated JSON file '{input_path}' not found.")
        sys.exit(1)

    print(f"Reading curated recipes from: {input_path}")
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict) or "recipes" not in data:
        print("Error: Input JSON format is invalid. Must have 'recipes' list.")
        sys.exit(1)

    recipes = data["recipes"]
    total = len(recipes)
    print(f"Total curated recipes in input: {total}")

    selected = recipes[:args.count]
    print(f"Selected first {len(selected)} recipes.")

    output_data = {
        "version": data.get("version", "2.0"),
        "recipes": selected
    }

    # Ensure parent directory of output exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"Successfully wrote {len(selected)} seed recipes to: {output_path}")

if __name__ == "__main__":
    main()
