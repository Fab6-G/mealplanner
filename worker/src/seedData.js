// seedData.js
// Default seed data for Cloudflare D1 recipes and staples

export const defaultRecipes = [
  {
    id: "chicken-stir-fry-rice-bowls",
    name: "Chicken Stir-Fry Rice Bowls",
    emoji: "🍚",
    description: "High-protein chicken and vegetable stir-fry served over fluffy basmati rice for a quick weeknight dinner.",
    prep_time: "20 min",
    cook_time: "20 min",
    servings: 2,
    fabians_portion: {
      quantity: "Large bowl",
      chicken: "220 g cooked chicken",
      rice: "220 g cooked rice",
      veg: "200 g mixed vegetables"
    },
    stefanies_portion: {
      quantity: "Medium bowl",
      chicken: "140 g cooked chicken",
      rice: "140 g cooked rice",
      veg: "200 g mixed vegetables"
    },
    ingredients: {
      produce: [
        { category: "produce", name: "Red bell pepper", quantity: 1, unit: "piece" },
        { category: "produce", name: "Carrot", quantity: 1, unit: "piece" },
        { category: "produce", name: "Spring onions", quantity: 4, unit: "piece" }
      ],
      protein: [
        { category: "protein", name: "Chicken breast fillets", quantity: 450, unit: "g" }
      ],
      dairy: [],
      carbs: [
        { category: "carbs", name: "Basmati rice", quantity: 220, unit: "g" }
      ],
      pantry: [
        { category: "pantry", name: "Soy sauce", quantity: 30, unit: "ml" },
        { category: "pantry", name: "Oyster sauce", quantity: 20, unit: "ml" },
        { category: "pantry", name: "Rapeseed oil", quantity: 20, unit: "ml" },
        { category: "pantry", name: "Garlic paste", quantity: 10, unit: "g" },
        { category: "pantry", name: "Ginger paste", quantity: 10, unit: "g" },
        { category: "pantry", name: "Chilli flakes", quantity: 3, unit: "g" }
      ],
      other: []
    },
    instructions: [
      "Rinse basmati rice and cook according to packet instructions, then fluff and keep warm.",
      "Slice chicken breasts into thin strips and mix with half the soy sauce, garlic paste, and ginger paste.",
      "Slice red bell pepper and carrot into thin strips and finely slice spring onions.",
      "Heat rapeseed oil in a large wok over high heat and stir-fry the chicken until browned and cooked through, then remove to a plate.",
      "Add peppers, carrot, and most of the spring onions to the wok and stir-fry for 4–5 minutes until tender-crisp.",
      "Return chicken to the wok, add remaining soy sauce, oyster sauce, and a splash of water, then toss to coat and heat through.",
      "Garnish with remaining spring onions and serve immediately."
    ],
    tips: "Use a frozen stir-fry vegetable mix to cut prep time. Cook extra rice to keep chilled for future quick dinners."
  },
  {
    id: "beef-mince-pasta-bake",
    name: "Beef Mince Pasta Bake",
    emoji: "🍝",
    description: "Comforting lean beef mince pasta bake with tomato sauce, vegetables, and a light cheese topping.",
    prep_time: "20 min",
    cook_time: "25 min",
    servings: 2,
    fabians_portion: {
      quantity: "Hearty slice",
      beef: "220 g cooked beef mince",
      pasta: "130 g dry pasta (cooked)",
      cheese: "20 g cheese"
    },
    stefanies_portion: {
      quantity: "Moderate slice",
      beef: "110 g cooked beef mince",
      pasta: "70 g dry pasta (cooked)",
      cheese: "15 g cheese"
    },
    ingredients: {
      produce: [
        { category: "produce", name: "Brown onion", quantity: 1, unit: "piece" },
        { category: "produce", name: "Garlic cloves", quantity: 2, unit: "piece" },
        { category: "produce", name: "Red bell pepper", quantity: 1, unit: "piece" },
        { category: "produce", name: "Chestnut mushrooms", quantity: 150, unit: "g" }
      ],
      protein: [
        { category: "protein", name: "Beef steak mince 5% fat", quantity: 500, unit: "g" },
        { category: "protein", name: "Cheddar cheese", quantity: 40, unit: "g" }
      ],
      dairy: [],
      carbs: [
        { category: "carbs", name: "Penne pasta", quantity: 200, unit: "g" }
      ],
      pantry: [
        { category: "pantry", name: "Chopped tomatoes", quantity: 400, unit: "g" },
        { category: "pantry", name: "Tomato passata", quantity: 200, unit: "ml" },
        { category: "pantry", name: "Tomato puree", quantity: 15, unit: "ml" },
        { category: "pantry", name: "Dried oregano", quantity: 5, unit: "g" },
        { category: "pantry", name: "Dried Italian seasoning", quantity: 5, unit: "g" },
        { category: "pantry", name: "Smoked paprika", quantity: 5, unit: "g" },
        { category: "pantry", name: "Olive oil", quantity: 15, unit: "ml" },
        { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
        { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
      ],
      other: []
    },
    instructions: [
      "Cook penne pasta in salted water until al dente, then drain and set aside.",
      "Heat olive oil in a large pan and cook chopped onion and red bell pepper for 4–5 minutes until softened.",
      "Add minced garlic and cook for 1 minute until fragrant.",
      "Add beef steak mince and cook until browned, breaking it into small pieces.",
      "Stir in tomato puree, chopped tomatoes, tomato passata, and seasonings, then simmer.",
      "Stir cooked pasta into the sauce, transfer to a dish, top with cheese, and bake."
    ],
    tips: "Batch cook and freeze individual portions for easy future dinners."
  },
  {
    id: "salmon-sweet-potato-traybake",
    name: "Salmon with Sweet Potato & Greens Traybake",
    emoji: "🐟",
    description: "Omega-3 rich salmon traybake with roasted sweet potatoes and tenderstem broccoli for a balanced, high-protein meal.",
    prep_time: "15 min",
    cook_time: "25 min",
    servings: 2,
    fabians_portion: {
      quantity: "1.5 fillets + large portion",
      salmon: "200 g raw salmon",
      sweetPotato: "250 g",
      greens: "150 g"
    },
    stefanies_portion: {
      quantity: "1 fillet + moderate portion",
      salmon: "130 g raw salmon",
      sweetPotato: "150 g",
      greens: "150 g"
    },
    ingredients: {
      produce: [
        { category: "produce", name: "Sweet potatoes", quantity: 450, unit: "g" },
        { category: "produce", name: "Tenderstem broccoli", quantity: 200, unit: "g" },
        { category: "produce", name: "Red onion", quantity: 1, unit: "piece" },
        { category: "produce", name: "Lemon", quantity: 1, unit: "piece" }
      ],
      protein: [
        { category: "protein", name: "Salmon fillets", quantity: 400, unit: "g" }
      ],
      dairy: [],
      carbs: [],
      pantry: [
        { category: "pantry", name: "Olive oil", quantity: 30, unit: "ml" },
        { category: "pantry", name: "Honey", quantity: 15, unit: "ml" },
        { category: "pantry", name: "Smoked paprika", quantity: 5, unit: "g" },
        { category: "pantry", name: "Dried mixed herbs", quantity: 5, unit: "g" },
        { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
        { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
      ],
      other: []
    },
    instructions: [
      "Preheat oven to 200 °C and line a large baking tray.",
      "Toss cubed sweet potatoes and red onion wedges with half the olive oil and spices, roast for 15 minutes.",
      "Place salmon fillets on top, drizzle with remaining oil, honey, and lemon juice. Add tenderstem broccoli.",
      "Roast for a further 12-15 minutes until salmon is cooked through."
    ],
    tips: "Leftover salmon is excellent flaked into salads or wraps for the next day."
  },
  {
    id: "chicken-fajita-traybake-wraps",
    name: "Chicken Fajita Traybake Wraps",
    emoji: "🌯",
    description: "Tray-roasted fajita chicken with peppers and onions, served in soft tortillas with yoghurt and salsa.",
    prep_time: "15 min",
    cook_time: "25 min",
    servings: 2,
    fabians_portion: {
      quantity: "3 loaded wraps",
      chicken: "220 g cooked chicken",
      tortillas: "3 tortillas",
      veg: "generous"
    },
    stefanies_portion: {
      quantity: "2 moderate wraps",
      chicken: "130 g cooked chicken",
      tortillas: "2 tortillas",
      veg: "generous"
    },
    ingredients: {
      produce: [
        { category: "produce", name: "Mixed bell peppers", quantity: 2, unit: "piece" },
        { category: "produce", name: "Brown onion", quantity: 1, unit: "piece" }
      ],
      protein: [
        { category: "protein", name: "Chicken breast fillets", quantity: 500, unit: "g" }
      ],
      dairy: [
        { category: "dairy", name: "Natural yoghurt", quantity: 120, unit: "g" }
      ],
      carbs: [
        { category: "carbs", name: "Medium flour tortillas", quantity: 5, unit: "piece" }
      ],
      pantry: [
        { category: "pantry", name: "Fajita seasoning", quantity: 30, unit: "g" },
        { category: "pantry", name: "Chopped tomatoes", quantity: 200, unit: "g" },
        { category: "pantry", name: "Salsa", quantity: 1, unit: "jar" },
        { category: "pantry", name: "Olive oil", quantity: 30, unit: "ml" },
        { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
        { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
      ],
      other: []
    },
    instructions: [
      "Preheat oven to 200 °C and line a large baking tray.",
      "Toss sliced chicken, peppers, onion with olive oil and fajita seasoning, roast for 20-25 minutes.",
      "Serve warm with flour tortillas, yoghurt, and salsa."
    ],
    tips: "Marinate the chicken and vegetables earlier in the day for more flavour."
  }
];

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
