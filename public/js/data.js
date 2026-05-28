const recipeBank = [
    {
        id: "chicken-stir-fry-rice-bowls",
        name: "Chicken Stir-Fry Rice Bowls",
        emoji: "🍚",
        description: "High-protein chicken and vegetable stir-fry served over fluffy basmati rice for a quick weeknight dinner.",
        prepTime: "20 min",
        cookTime: "20 min",
        servings: 2,
        macros: {
            calories: 1200,
            protein_g: 100,
            carbs_g: 130,
            fat_g: 25
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
            "Season with chilli flakes to taste and adjust sauce with a little more water if needed.",
            "Serve rice into bowls, then top with the stir-fry.",
            "Garnish with remaining spring onions and serve immediately."
        ],
        tips: "Use a frozen stir-fry vegetable mix to cut prep time. Cook extra rice to keep chilled for future quick dinners."
    },
    {
        id: "beef-mince-pasta-bake",
        name: "Beef Mince Pasta Bake",
        emoji: "🍝",
        description: "Comforting lean beef mince pasta bake with tomato sauce, vegetables, and a light cheese topping.",
        prepTime: "20 min",
        cookTime: "25 min",
        servings: 2,
        macros: {
            calories: 1400,
            protein_g: 110,
            carbs_g: 140,
            fat_g: 35
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
            "Add beef steak mince and cook until browned, breaking it into small pieces with a spoon.",
            "Stir in tomato puree, chopped tomatoes, tomato passata, dried oregano, dried Italian seasoning, and smoked paprika, then simmer for 10–15 minutes until slightly thickened.",
            "Add sliced mushrooms and cook for 3–4 minutes, then season with salt and black pepper.",
            "Stir cooked pasta into the sauce and transfer the mixture to an ovenproof dish.",
            "Sprinkle cheddar cheese evenly over the top.",
            "Bake at 190 °C (170 °C fan) for 15–20 minutes until bubbling and golden, then rest briefly before slicing and serving."
        ],
        tips: "Batch cook and freeze individual portions for easy future dinners. Add extra vegetables to increase volume without many additional calories."
    },
    {
        id: "salmon-sweet-potato-traybake",
        name: "Salmon with Sweet Potato & Greens Traybake",
        emoji: "🐟",
        description: "Omega-3 rich salmon traybake with roasted sweet potatoes and tenderstem broccoli for a balanced, high-protein meal.",
        prepTime: "15 min",
        cookTime: "25 min",
        servings: 2,
        macros: {
            calories: 1300,
            protein_g: 90,
            carbs_g: 100,
            fat_g: 50
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
            "Preheat oven to 200 °C (180 °C fan) and line a large baking tray.",
            "Peel and cube sweet potatoes, then slice red onion into wedges.",
            "Toss sweet potatoes and red onion with half the olive oil, smoked paprika, dried mixed herbs, salt, and black pepper on the tray.",
            "Roast for 15 minutes until the sweet potatoes start to soften.",
            "Remove the tray, stir the vegetables, then place salmon fillets on top and drizzle with remaining olive oil, honey, and half the lemon juice.",
            "Arrange tenderstem broccoli around the salmon.",
            "Roast for a further 12–15 minutes until salmon is cooked through and sweet potatoes are tender.",
            "Serve salmon and sweet potatoes onto plates with broccoli.",
            "Finish with remaining lemon juice over both plates."
        ],
        tips: "Use a 4-pack of salmon and freeze the extra fillet. Leftover salmon is excellent flaked into salads or wraps for the next day."
    },
    {
        id: "chicken-fajita-traybake-wraps",
        name: "Chicken Fajita Traybake Wraps",
        emoji: "🌯",
        description: "Tray-roasted fajita chicken with peppers and onions, served in soft tortillas with yoghurt and salsa.",
        prepTime: "15 min",
        cookTime: "25 min",
        servings: 2,
        macros: {
            calories: 1300,
            protein_g: 100,
            carbs_g: 120,
            fat_g: 30
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
            "Preheat oven to 200 °C (180 °C fan) and line a large baking tray.",
            "Slice chicken, peppers, and onion into strips.",
            "Toss chicken and vegetables with olive oil, fajita seasoning, salt, and black pepper.",
            "Spread the mixture evenly on the tray and roast for 20–25 minutes, stirring halfway, until chicken is cooked and vegetables are slightly charred.",
            "For a saucier filling, pour chopped tomatoes over the tray for the final 5–10 minutes of cooking.",
            "Wrap tortillas in foil and warm them in the oven for the last 5 minutes.",
            "Serve chicken, vegetables, warm tortillas, yoghurt, and salsa at the table.",
            "Build wraps with chicken and vegetables."
        ],
        tips: "Marinate the chicken and vegetables earlier in the day for more flavour. Leftover filling can be used over rice or salad for lunch."
    },
    {
        id: "egg-prawn-fried-rice-bowls",
        name: "Egg & Prawn Fried Rice Bowls",
        emoji: "🍤",
        description: "Fast wok-fried rice with prawns, eggs, peas, and mixed vegetables for a macro-friendly high-protein dinner.",
        prepTime: "10 min",
        cookTime: "15 min",
        servings: 2,
        macros: {
            calories: 1100,
            protein_g: 80,
            carbs_g: 120,
            fat_g: 25
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Brown onion", quantity: 1, unit: "piece" },
                { category: "produce", name: "Garlic cloves", quantity: 3, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Raw peeled prawns", quantity: 250, unit: "g" },
                { category: "protein", name: "Eggs", quantity: 5, unit: "piece" }
            ],
            dairy: [],
            carbs: [
                { category: "carbs", name: "Cooked chilled rice", quantity: 350, unit: "g" },
                { category: "carbs", name: "Frozen peas", quantity: 120, unit: "g" },
                { category: "carbs", name: "Frozen mixed vegetables", quantity: 120, unit: "g" }
            ],
            pantry: [
                { category: "pantry", name: "Soy sauce", quantity: 45, unit: "ml" },
                { category: "pantry", name: "Sesame oil", quantity: 15, unit: "ml" },
                { category: "pantry", name: "Rapeseed oil", quantity: 30, unit: "ml" },
                { category: "pantry", name: "Chilli flakes", quantity: 5, unit: "g" }
            ],
            other: []
        },
        instructions: [
            "Use fully cooled cooked rice and break up any clumps with a fork.",
            "Finely chop the onion and mince the garlic.",
            "Heat half the rapeseed oil in a large wok, beat the eggs, scramble until just set, then remove and set aside.",
            "Add remaining rapeseed oil to the wok and sauté onion and garlic for 1–2 minutes until softened.",
            "Add prawns and cook until they turn pink and opaque.",
            "Add frozen peas and mixed vegetables and stir-fry for 2–3 minutes until heated through.",
            "Add rice and stir-fry on high heat for 3–4 minutes, then stir in soy sauce and sesame oil.",
            "Return scrambled eggs to the wok and toss to combine, seasoning with chilli flakes to taste.",
            "Serve into bowls with prawns, rice and vegetables."
        ],
        tips: "Cook extra rice earlier in the week and refrigerate it for quick fried rice. You can replace prawns with leftover chicken or tofu for variation."
    },
    {
        id: "greek-chicken-pitta-bowls",
        name: "Greek-Style Chicken Pitta Bowls",
        emoji: "🥙",
        description: "Marinated chicken with roasted potatoes, fresh salad, and yoghurt-garlic dressing served with wholemeal pittas.",
        prepTime: "20 min",
        cookTime: "30 min",
        servings: 2,
        macros: {
            calories: 1300,
            protein_g: 100,
            carbs_g: 130,
            fat_g: 30
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Cucumber", quantity: 1, unit: "piece" },
                { category: "produce", name: "Tomatoes", quantity: 2, unit: "piece" },
                { category: "produce", name: "Red onion", quantity: 1, unit: "piece" },
                { category: "produce", name: "Garlic cloves", quantity: 2, unit: "piece" },
                { category: "produce", name: "Lemon", quantity: 1, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Chicken breast fillets", quantity: 500, unit: "g" }
            ],
            dairy: [
                { category: "dairy", name: "Greek yoghurt", quantity: 150, unit: "g" }
            ],
            carbs: [
                { category: "carbs", name: "Baby or white potatoes", quantity: 450, unit: "g" },
                { category: "carbs", name: "Wholemeal pittas", quantity: 3, unit: "piece" }
            ],
            pantry: [
                { category: "pantry", name: "Dried oregano", quantity: 5, unit: "g" },
                { category: "pantry", name: "Dried mint", quantity: 5, unit: "g" },
                { category: "pantry", name: "Olive oil", quantity: 30, unit: "ml" },
                { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
                { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
            ],
            other: []
        },
        instructions: [
            "Preheat oven to 200 °C (180 °C fan).",
            "Cut potatoes into wedges and toss with half the olive oil, salt, black pepper, and half the dried oregano, then spread on a baking tray.",
            "Roast potatoes for 25–30 minutes until golden and tender, turning once halfway.",
            "Cut chicken into chunks and marinate with remaining olive oil, lemon juice, remaining dried oregano, minced garlic, salt, and black pepper.",
            "After potatoes have roasted for 10 minutes, place chicken on a separate tray and roast for 15–18 minutes until cooked through.",
            "Mix Greek yoghurt with minced garlic, a little lemon juice, dried mint, salt, and black pepper to make a dressing.",
            "Chop cucumber and tomatoes and thinly slice red onion, then toss with a little salt and lemon juice.",
            "Warm pittas in the oven for the final 3–4 minutes.",
            "Build bowls with roasted potatoes, salad, chicken, and yoghurt dressing."
        ],
        tips: "Marinate the chicken the night before for deeper flavour. Swap white potatoes for sweet potatoes using the same method if you prefer."
    },
    {
        id: "beef-lentil-chilli-rice",
        name: "Beef & Lentil Chilli with Rice",
        emoji: "🍛",
        description: "Hearty lean beef and red lentil chilli with beans served over rice for a high-protein, filling dinner.",
        prepTime: "20 min",
        cookTime: "30 min",
        servings: 2,
        macros: {
            calories: 1400,
            protein_g: 110,
            carbs_g: 150,
            fat_g: 25
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Brown onion", quantity: 1, unit: "piece" },
                { category: "produce", name: "Garlic cloves", quantity: 2, unit: "piece" },
                { category: "produce", name: "Red bell pepper", quantity: 1, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Beef steak mince 5% fat", quantity: 500, unit: "g" },
                { category: "protein", name: "Red lentils", quantity: 120, unit: "g" },
                { category: "protein", name: "Kidney beans", quantity: 1, unit: "tin" }
            ],
            dairy: [],
            carbs: [
                { category: "carbs", name: "Long grain rice", quantity: 220, unit: "g" },
                { category: "carbs", name: "Chopped tomatoes", quantity: 400, unit: "g" }
            ],
            pantry: [
                { category: "pantry", name: "Tomato puree", quantity: 30, unit: "ml" },
                { category: "pantry", name: "Beef stock", quantity: 300, unit: "ml" },
                { category: "pantry", name: "Ground cumin", quantity: 10, unit: "g" },
                { category: "pantry", name: "Smoked paprika", quantity: 10, unit: "g" },
                { category: "pantry", name: "Chilli powder", quantity: 7, unit: "g" },
                { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
                { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
            ],
            other: []
        },
        instructions: [
            "Cook rice according to package instructions and keep warm.",
            "Chop the onion and pepper and mince the garlic.",
            "In a large pot, sauté onion and pepper in a little oil for 5–6 minutes until softened, then add garlic and cook for 1 minute.",
            "Add beef mince and cook until browned, breaking it into small pieces.",
            "Stir in tomato puree, ground cumin, smoked paprika, and chilli powder and cook for 1 minute.",
            "Add chopped tomatoes, rinsed red lentils, drained kidney beans, and beef stock, then bring to a boil.",
            "Reduce heat and simmer gently for 25–30 minutes until lentils are tender and the chilli has thickened, stirring occasionally.",
            "Season with salt and black pepper and adjust chilli powder to taste.",
            "Serve over rice."
        ],
        tips: "Chilli freezes very well. Double the recipe once, portion it into containers, and freeze for future quick dinners."
    },
    {
        id: "turkey-bolognese-wholewheat-pasta",
        name: "Turkey Bolognese with Wholewheat Pasta",
        emoji: "🍝",
        description: "Lean turkey mince cooked in a rich tomato sauce and served over wholewheat pasta for a lighter take on bolognese.",
        prepTime: "20 min",
        cookTime: "25 min",
        servings: 2,
        macros: {
            calories: 1200,
            protein_g: 100,
            carbs_g: 130,
            fat_g: 20
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Brown onion", quantity: 1, unit: "piece" },
                { category: "produce", name: "Carrot", quantity: 1, unit: "piece" },
                { category: "produce", name: "Celery stick", quantity: 1, unit: "piece" },
                { category: "produce", name: "Garlic cloves", quantity: 2, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Turkey mince 5% fat", quantity: 500, unit: "g" }
            ],
            dairy: [],
            carbs: [
                { category: "carbs", name: "Wholewheat spaghetti or penne", quantity: 200, unit: "g" },
                { category: "carbs", name: "Chopped tomatoes", quantity: 400, unit: "g" }
            ],
            pantry: [
                { category: "pantry", name: "Tomato puree", quantity: 15, unit: "ml" },
                { category: "pantry", name: "Vegetable stock", quantity: 200, unit: "ml" },
                { category: "pantry", name: "Dried oregano", quantity: 5, unit: "g" },
                { category: "pantry", name: "Dried basil", quantity: 5, unit: "g" },
                { category: "pantry", name: "Olive oil", quantity: 15, unit: "ml" },
                { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
                { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
            ],
            other: []
        },
        instructions: [
            "Cook wholewheat pasta according to packet instructions, then drain and set aside.",
            "Finely chop onion, carrot, and celery and mince the garlic.",
            "Heat olive oil in a large pan and cook the vegetables for 6–7 minutes until softened.",
            "Add turkey mince and cook until browned, breaking it up with a spoon.",
            "Stir in tomato puree and cook for 1 minute, then add chopped tomatoes, vegetable stock, dried oregano, and dried basil.",
            "Simmer for 15–20 minutes until the sauce thickens and flavours combine.",
            "Season with salt and black pepper to taste.",
            "Serve the bolognese over pasta."
        ],
        tips: "Make a double batch of the bolognese sauce and freeze half for another night. You can add lentils to the sauce for extra fibre and protein."
    },
    {
        id: "chicken-tikka-masala-rice",
        name: "Chicken Tikka Masala with Rice",
        emoji: "🍛",
        description: "Creamy-style chicken tikka masala lightened with yoghurt, served with fluffy basmati rice.",
        prepTime: "25 min",
        cookTime: "25 min",
        servings: 2,
        macros: {
            calories: 1300,
            protein_g: 100,
            carbs_g: 130,
            fat_g: 30
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Brown onion", quantity: 1, unit: "piece" },
                { category: "produce", name: "Garlic cloves", quantity: 3, unit: "piece" },
                { category: "produce", name: "Fresh ginger piece", quantity: 1, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Chicken breast fillets", quantity: 500, unit: "g" },
                { category: "protein", name: "Greek yoghurt", quantity: 150, unit: "g" }
            ],
            dairy: [],
            carbs: [
                { category: "carbs", name: "Basmati rice", quantity: 220, unit: "g" },
                { category: "carbs", name: "Chopped tomatoes", quantity: 400, unit: "g" }
            ],
            pantry: [
                { category: "pantry", name: "Tomato puree", quantity: 15, unit: "ml" },
                { category: "pantry", name: "Tikka masala spice mix", quantity: 20, unit: "g" },
                { category: "pantry", name: "Garam masala", quantity: 5, unit: "g" },
                { category: "pantry", name: "Rapeseed oil", quantity: 20, unit: "ml" },
                { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
                { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
            ],
            other: []
        },
        instructions: [
            "Cook basmati rice according to packet instructions and keep warm.",
            "Dice chicken into bite-sized pieces.",
            "Mix half the Greek yoghurt with half the tikka masala spice mix and a pinch of salt, then coat the chicken and set aside while you prepare the sauce.",
            "Finely chop the onion and mince the garlic and ginger.",
            "Heat rapeseed oil in a large pan and cook the onion for 5–6 minutes until softened.",
            "Add garlic, ginger, remaining tikka masala spice mix, and garam masala and cook for 1–2 minutes until fragrant.",
            "Stir in tomato puree and chopped tomatoes and simmer for 5 minutes.",
            "Add marinated chicken pieces to the sauce and cook for 12–15 minutes until the chicken is cooked through.",
            "Stir in the remaining Greek yoghurt off the heat to create a creamy texture and season with salt and black pepper.",
            "Serve over rice."
        ],
        tips: "Marinate the chicken in yoghurt and spices earlier in the day for better flavour. Serve with steamed green vegetables for extra fibre."
    },
    {
        id: "lemon-herb-cod-veg-traybake",
        name: "Lemon Herb Cod with Roasted Vegetables",
        emoji: "🐟",
        description: "Light baked cod fillets with a mix of roasted vegetables and a lemon-herb drizzle.",
        prepTime: "15 min",
        cookTime: "20 min",
        servings: 2,
        macros: {
            calories: 800,
            protein_g: 65,
            carbs_g: 60,
            fat_g: 20
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Carrots", quantity: 2, unit: "piece" },
                { category: "produce", name: "Courgette", quantity: 1, unit: "piece" },
                { category: "produce", name: "Red onion", quantity: 1, unit: "piece" },
                { category: "produce", name: "Cherry tomatoes", quantity: 150, unit: "g" },
                { category: "produce", name: "Lemon", quantity: 1, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Cod fillets", quantity: 300, unit: "g" }
            ],
            dairy: [],
            carbs: [],
            pantry: [
                { category: "pantry", name: "Olive oil", quantity: 20, unit: "ml" },
                { category: "pantry", name: "Dried mixed herbs", quantity: 5, unit: "g" },
                { category: "pantry", name: "Garlic granules", quantity: 5, unit: "g" },
                { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
                { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
            ],
            other: []
        },
        instructions: [
            "Preheat oven to 190 °C (170 °C fan) and line a baking tray with foil.",
            "Slice carrots and courgette into batons and cut red onion into wedges.",
            "Toss carrots, courgette, red onion, and cherry tomatoes with half the olive oil, dried mixed herbs, salt, and black pepper.",
            "Spread vegetables on the tray and roast for 10 minutes.",
            "Season cod fillets with garlic granules, salt, and black pepper.",
            "Place cod on top of the vegetables and drizzle with remaining olive oil and half the lemon juice.",
            "Roast for a further 10–12 minutes until cod flakes easily and vegetables are tender.",
            "Serve vegetables and cod onto plates.",
            "Squeeze remaining lemon juice over both portions before serving."
        ],
        tips: "Use frozen cod fillets for convenience; defrost them in the fridge beforehand. Add a small side of boiled potatoes if you want extra carbs."
    },
    {
        id: "chicken-veg-sheet-pan-dinner",
        name: "Chicken & Veg Sheet-Pan Dinner",
        emoji: "🍗",
        description: "Simple sheet-pan chicken with mixed vegetables and potatoes for an easy, hands-off dinner.",
        prepTime: "15 min",
        cookTime: "35 min",
        servings: 2,
        macros: {
            calories: 1100,
            protein_g: 90,
            carbs_g: 90,
            fat_g: 35
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Baby potatoes", quantity: 450, unit: "g" },
                { category: "produce", name: "Carrots", quantity: 2, unit: "piece" },
                { category: "produce", name: "Green beans", quantity: 150, unit: "g" },
                { category: "produce", name: "Red onion", quantity: 1, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Chicken thighs, skinless", quantity: 500, unit: "g" }
            ],
            dairy: [],
            carbs: [],
            pantry: [
                { category: "pantry", name: "Olive oil", quantity: 30, unit: "ml" },
                { category: "pantry", name: "Dried thyme", quantity: 5, unit: "g" },
                { category: "pantry", name: "Garlic granules", quantity: 5, unit: "g" },
                { category: "pantry", name: "Paprika", quantity: 5, unit: "g" },
                { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
                { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
            ],
            other: []
        },
        instructions: [
            "Preheat oven to 200 °C (180 °C fan) and line a large baking tray.",
            "Halve or quarter baby potatoes and slice carrots into batons.",
            "Toss potatoes, carrots, green beans, and sliced red onion with half the olive oil, dried thyme, garlic granules, paprika, salt, and black pepper.",
            "Spread vegetables on the tray in an even layer.",
            "Place chicken thighs on top, drizzle with remaining olive oil, and season lightly with salt and pepper.",
            "Roast for 30–35 minutes until chicken is cooked through and potatoes are crisp and tender, turning vegetables once halfway.",
            "Rest for a few minutes, then portion."
        ],
        tips: "Use pre-chopped mixed veg to save time. This recipe is flexible, so swap in other vegetables you have on hand like courgette or peppers."
    },
    {
        id: "lentil-chickpea-veggie-curry",
        name: "Lentil & Chickpea Veggie Curry",
        emoji: "🥘",
        description: "High-fibre vegetarian curry with red lentils, chickpeas, and mixed vegetables served with rice.",
        prepTime: "20 min",
        cookTime: "25 min",
        servings: 2,
        macros: {
            calories: 1200,
            protein_g: 50,
            carbs_g: 180,
            fat_g: 20
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Brown onion", quantity: 1, unit: "piece" },
                { category: "produce", name: "Carrot", quantity: 1, unit: "piece" },
                { category: "produce", name: "Red bell pepper", quantity: 1, unit: "piece" },
                { category: "produce", name: "Garlic cloves", quantity: 2, unit: "piece" },
                { category: "produce", name: "Fresh ginger piece", quantity: 1, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Red lentils", quantity: 120, unit: "g" },
                { category: "protein", name: "Chickpeas", quantity: 1, unit: "tin" }
            ],
            dairy: [],
            carbs: [
                { category: "carbs", name: "Basmati rice", quantity: 220, unit: "g" },
                { category: "carbs", name: "Chopped tomatoes", quantity: 400, unit: "g" }
            ],
            pantry: [
                { category: "pantry", name: "Coconut milk light", quantity: 200, unit: "ml" },
                { category: "pantry", name: "Curry powder", quantity: 15, unit: "g" },
                { category: "pantry", name: "Ground cumin", quantity: 5, unit: "g" },
                { category: "pantry", name: "Rapeseed oil", quantity: 15, unit: "ml" },
                { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
                { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
            ],
            other: []
        },
        instructions: [
            "Cook basmati rice according to packet instructions and keep warm.",
            "Finely chop onion and carrot and dice the red bell pepper, then mince the garlic and ginger.",
            "Heat rapeseed oil in a large pan and cook onion and carrot for 5–6 minutes until softened.",
            "Add garlic, ginger, curry powder, and ground cumin and cook for 1–2 minutes until fragrant.",
            "Stir in red lentils, chopped tomatoes, coconut milk, and drained chickpeas.",
            "Bring to a simmer and cook for 15–20 minutes until lentils are tender and the curry has thickened, stirring occasionally.",
            "Season with salt and black pepper to taste.",
            "Serve curry over rice."
        ],
        tips: "This curry tastes even better the next day, so make extra for lunches. You can add spinach or frozen peas near the end for more greens."
    },
    {
        id: "tofu-veggie-stir-fry-noodles",
        name: "Tofu Veggie Stir-Fry with Noodles",
        emoji: "🥡",
        description: "Vegetarian stir-fry with crispy tofu, mixed vegetables, and egg noodles in a savoury soy-ginger sauce.",
        prepTime: "20 min",
        cookTime: "15 min",
        servings: 2,
        macros: {
            calories: 1000,
            protein_g: 45,
            carbs_g: 130,
            fat_g: 25
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Broccoli florets", quantity: 150, unit: "g" },
                { category: "produce", name: "Carrot", quantity: 1, unit: "piece" },
                { category: "produce", name: "Red bell pepper", quantity: 1, unit: "piece" },
                { category: "produce", name: "Spring onions", quantity: 3, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Firm tofu", quantity: 300, unit: "g" }
            ],
            dairy: [],
            carbs: [
                { category: "carbs", name: "Egg noodles", quantity: 150, unit: "g" }
            ],
            pantry: [
                { category: "pantry", name: "Soy sauce", quantity: 40, unit: "ml" },
                { category: "pantry", name: "Sweet chilli sauce", quantity: 20, unit: "ml" },
                { category: "pantry", name: "Garlic paste", quantity: 10, unit: "g" },
                { category: "pantry", name: "Ginger paste", quantity: 10, unit: "g" },
                { category: "pantry", name: "Sesame oil", quantity: 10, unit: "ml" },
                { category: "pantry", name: "Rapeseed oil", quantity: 20, unit: "ml" }
            ],
            other: []
        },
        instructions: [
            "Cook egg noodles according to packet instructions, drain, and set aside.",
            "Press firm tofu to remove excess moisture, then cut into cubes.",
            "Toss tofu cubes with half the soy sauce and set aside while you chop vegetables.",
            "Slice carrot and red pepper into thin strips and cut broccoli into small florets, then slice spring onions.",
            "Heat rapeseed oil in a large wok and fry tofu cubes until golden on all sides, then remove and set aside.",
            "In the same wok, stir-fry broccoli, carrot, and red pepper for 4–5 minutes until tender-crisp.",
            "Add garlic paste and ginger paste and cook for 1 minute, then return tofu to the wok.",
            "Add cooked noodles, remaining soy sauce, sweet chilli sauce, and sesame oil, then toss everything together until hot.",
            "Serve in bowls with tofu and noodles."
        ],
        tips: "Use pre-cut stir-fry vegetables to reduce prep time. For a vegan version, use wheat noodles instead of egg noodles."
    },
    {
        id: "chicken-caesar-style-rice-bowl",
        name: "Chicken Caesar-Style Rice Bowl",
        emoji: "🥗",
        description: "Deconstructed Caesar-style bowl with grilled chicken, rice, crunchy lettuce, and a yoghurt-based dressing.",
        prepTime: "20 min",
        cookTime: "20 min",
        servings: 2,
        macros: {
            calories: 1100,
            protein_g: 90,
            carbs_g: 110,
            fat_g: 25
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Romaine lettuce", quantity: 1, unit: "piece" },
                { category: "produce", name: "Cherry tomatoes", quantity: 120, unit: "g" },
                { category: "produce", name: "Cucumber", quantity: 1, unit: "piece" },
                { category: "produce", name: "Garlic cloves", quantity: 1, unit: "piece" },
                { category: "produce", name: "Lemon", quantity: 1, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Chicken breast fillets", quantity: 400, unit: "g" }
            ],
            dairy: [
                { category: "dairy", name: "Greek yoghurt", quantity: 100, unit: "g" },
                { category: "dairy", name: "Parmesan cheese", quantity: 20, unit: "g" }
            ],
            carbs: [
                { category: "carbs", name: "Basmati rice", quantity: 200, unit: "g" }
            ],
            pantry: [
                { category: "pantry", name: "Olive oil", quantity: 20, unit: "ml" },
                { category: "pantry", name: "Dijon mustard", quantity: 10, unit: "g" },
                { category: "pantry", name: "Worcestershire sauce", quantity: 5, unit: "ml" },
                { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
                { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
            ],
            other: []
        },
        instructions: [
            "Cook basmati rice according to packet instructions and keep warm.",
            "Season chicken breasts with salt, black pepper, and a little olive oil.",
            "Grill or pan-fry chicken for 6–7 minutes per side until cooked through, then rest and slice.",
            "Chop romaine lettuce and cucumber, and halve cherry tomatoes.",
            "Mix Greek yoghurt, grated parmesan, minced garlic, lemon juice, Dijon mustard, and Worcestershire sauce to make the Caesar dressing. Season with salt and black pepper.",
            "Assemble bowls by placing rice at the bottom, then topping with lettuce, tomatoes, cucumber, and sliced chicken.",
            "Drizzle Caesar dressing over the bowls and garnish with extra parmesan."
        ],
        tips: "Use precooked chicken breasts or leftover roast chicken to make this extremely fast. Swap rice for croutons for a classic salad style."
    }
];

function calculateProportionalSplit(baseMacros, members) {
    if (!members || members.length === 0) return [];

    // Calculate total household calories
    let totalCaloriesGoal = 0;
    let hasAllCalorieGoals = true;

    for (const m of members) {
        const cal = m.macro_goals ? Number(m.macro_goals.calories) : 0;
        if (cal <= 0) {
            hasAllCalorieGoals = false;
        }
        totalCaloriesGoal += cal;
    }

    // If any member lacks a calorie goal or total calories is <= 0, do equal split
    const useEqualSplit = !hasAllCalorieGoals || totalCaloriesGoal <= 0;
    const numMembers = members.length;

    return members.map(m => {
        let scaleFactor = 0;
        if (useEqualSplit) {
            scaleFactor = 1 / numMembers;
        } else {
            scaleFactor = Number(m.macro_goals.calories) / totalCaloriesGoal;
        }

        return {
            member_id: m.id,
            name: m.name,
            macros: {
                calories: Math.round(baseMacros.calories * scaleFactor),
                protein_g: Math.round(baseMacros.protein_g * scaleFactor * 10) / 10,
                carbs_g: Math.round(baseMacros.carbs_g * scaleFactor * 10) / 10,
                fat_g: Math.round(baseMacros.fat_g * scaleFactor * 10) / 10
            }
        };
    });
}

function getAllIngredientsNormalised(recipes) {
    // Map key: "category::name::unit"
    const map = new Map();

    for (const r of recipes) {
        if (!r.ingredients) continue;
        for (const [category, items] of Object.entries(r.ingredients)) {
            if (!Array.isArray(items)) continue;
            for (const ing of items) {
                if (!ing || !ing.name) continue;
                const unit = normaliseUnit(ing.unit);
                const key = `${category}::${ing.name.toLowerCase()}::${unit}`;
                if (!map.has(key)) {
                    map.set(key, {
                        category,
                        name: ing.name,
                        quantity: ing.quantity || 0,
                        unit
                    });
                } else {
                    const existing = map.get(key);
                    existing.quantity += ing.quantity || 0;
                }
            }
        }
    }

    return Array.from(map.values());
}

function normaliseUnit(rawUnit) {
    if (!rawUnit) return "";

    const u = rawUnit.trim().toLowerCase();

    if (["g", "gram", "grams"].includes(u)) return "g";
    if (["kg", "kilogram", "kilograms"].includes(u)) return "kg";

    if (["ml", "millilitre", "millilitres"].includes(u)) return "ml";
    if (["l", "litre", "litres"].includes(u)) return "l";

    if (["pc", "piece", "pieces", "each"].includes(u)) return "piece";
    if (["pack", "packet", "pkt"].includes(u)) return "pack";
    if (["tin", "can"].includes(u)) return "tin";
    if (["jar"].includes(u)) return "jar";
    if (["loaf"].includes(u)) return "loaf";
    if (["box"].includes(u)) return "box";

    // fallback – leave as-is if you really want to see it
    return u;
}

function buildCombinedIngredients(allIngredients) {
    // Map key: "category::name::unit"
    const map = new Map();

    const addList = (list) => {
        if (!Array.isArray(list)) return;
        list.forEach(ing => {
            if (!ing || !ing.name) return;

            const category = ing.category || "other";
            const name = ing.name.trim();
            const unit = (ing.unit || "").trim();
            const quantity = Number(ing.quantity) || 0;

            const key = `${category}::${name.toLowerCase()}::${unit.toLowerCase()}`;

            if (!map.has(key)) {
                map.set(key, { category, name, quantity, unit });
            } else {
                map.get(key).quantity += quantity;
            }
        });
    };

    // Only recipe-derived ingredients now; staples.json are handled in app.js
    addList(allIngredients);

    // Group by category
    const grouped = {
        produce: [],
        protein: [],
        dairy: [],
        carbs: [],
        pantry: [],
        other: []
    };

    map.forEach(ing => {
        const cat = grouped.hasOwnProperty(ing.category) ? ing.category : "other";
        grouped[cat].push(ing);
    });

    // Sort each category alphabetically by name
    Object.values(grouped).forEach(list => {
        list.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Flatten back to one array in category order
    return [
        ...grouped.produce,
        ...grouped.protein,
        ...grouped.dairy,
        ...grouped.carbs,
        ...grouped.pantry,
        ...grouped.other
    ];
}