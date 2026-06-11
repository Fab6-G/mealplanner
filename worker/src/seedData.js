// seedData.js
// Default seed data for Cloudflare D1 recipes and staples imported from recipes_seed_300.json

import seedRecipesData from "./recipes_seed_300.json";

export const defaultRecipes = seedRecipesData.recipes;

export const defaultStaples = [
  { id: "staple-eggs", name: "Eggs", quantity: 24, unit: "pcs", category: "protein" },
  { id: "staple-milk", name: "Semi-skimmed milk", quantity: 4, unit: "l", category: "dairy" },
  { id: "staple-oats", name: "Porridge oats", quantity: 1.5, unit: "kg", category: "carbs" },
  { id: "staple-yogurt", name: "Greek yogurt", quantity: 1.5, unit: "kg", category: "dairy" },
  { id: "staple-bananas", name: "Bananas", quantity: 14, unit: "pcs", category: "produce" },
  { id: "staple-berries", name: "Mixed berries (frozen)", quantity: 1, unit: "kg", category: "produce" },
  { id: "staple-bread", name: "Wholemeal bread", quantity: 2, unit: "loaf", category: "carbs" },
  { id: "staple-chicken", name: "Chicken breast", quantity: 1.5, unit: "kg", category: "protein" },
  { id: "staple-rice", name: "Brown rice", quantity: 1, unit: "kg", category: "carbs" },
  { id: "staple-salad-mix", name: "Salad mix", quantity: 3, unit: "pack", category: "produce" },
  { id: "staple-tomatoes", name: "Cherry tomatoes", quantity: 3, unit: "pack", category: "produce" },
  { id: "staple-houmous", name: "Houmous", quantity: 500, unit: "g", category: "dairy" },
  { id: "staple-cheese", name: "Cheddar cheese", quantity: 400, unit: "g", category: "dairy" }
];
