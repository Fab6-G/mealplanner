const recipeBank = [
    {
        id: "chicken-stir-fry-rice-bowls",
        name: "Chicken Stir-Fry Rice Bowls",
        emoji: "🍚",
        description: "High-protein chicken and vegetable stir-fry served over fluffy basmati rice for a quick weeknight dinner.",
        prepTime: "20 min",
        cookTime: "20 min",
        servings: 2,
        fabiansPortion: {
            quantity: "Large bowl",
            chicken: "220 g cooked chicken",
            rice: "220 g cooked rice",
            veg: "200 g mixed vegetables"
        },
        stefaniesPortion: {
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
            "Season with chilli flakes to taste and adjust sauce with a little more water if needed.",
            "Serve rice into two bowls, giving Fabian a larger portion, then top with the stir-fry, again giving Fabian more chicken.",
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
        fabiansPortion: {
            quantity: "Hearty slice",
            beef: "220 g cooked beef mince",
            pasta: "130 g dry pasta (cooked)",
            cheese: "20 g cheese"
        },
        stefaniesPortion: {
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
            "Add beef steak mince and cook until browned, breaking it into small pieces with a spoon.",
            "Stir in tomato puree, chopped tomatoes, tomato passata, dried oregano, dried Italian seasoning, and smoked paprika, then simmer for 10–15 minutes until slightly thickened.",
            "Add sliced mushrooms and cook for 3–4 minutes, then season with salt and black pepper.",
            "Stir cooked pasta into the sauce and transfer the mixture to an ovenproof dish.",
            "Sprinkle cheddar cheese evenly over the top.",
            "Bake at 190 °C (170 °C fan) for 15–20 minutes until bubbling and golden, then rest briefly before slicing and serving."
        ],
        tips: "Batch cook and freeze individual portions for easy future dinners. Add extra vegetables like courgette or spinach to increase volume without many additional calories."
    },
    {
        id: "salmon-sweet-potato-traybake",
        name: "Salmon with Sweet Potato & Greens Traybake",
        emoji: "🐟",
        description: "Omega-3 rich salmon traybake with roasted sweet potatoes and tenderstem broccoli for a balanced, high-protein meal.",
        prepTime: "15 min",
        cookTime: "25 min",
        servings: 2,
        fabiansPortion: {
            quantity: "1.5 fillets + large portion",
            salmon: "200 g raw salmon",
            sweetPotato: "250 g",
            greens: "150 g"
        },
        stefaniesPortion: {
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
            "Preheat oven to 200 °C (180 °C fan) and line a large baking tray.",
            "Peel and cube sweet potatoes, then slice red onion into wedges.",
            "Toss sweet potatoes and red onion with half the olive oil, smoked paprika, dried mixed herbs, salt, and black pepper on the tray.",
            "Roast for 15 minutes until the sweet potatoes start to soften.",
            "Remove the tray, stir the vegetables, then place salmon fillets on top and drizzle with remaining olive oil, honey, and half the lemon juice.",
            "Arrange tenderstem broccoli around the salmon.",
            "Roast for a further 12–15 minutes until salmon is cooked through and sweet potatoes are tender.",
            "Serve, giving Fabian one and a half fillets and a larger portion of sweet potatoes, and Stefanie one fillet and a smaller portion with extra broccoli.",
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
        fabiansPortion: {
            quantity: "3 loaded wraps",
            chicken: "220 g cooked chicken",
            tortillas: "3 tortillas",
            veg: "generous"
        },
        stefaniesPortion: {
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
            "Preheat oven to 200 °C (180 °C fan) and line a large baking tray.",
            "Slice chicken, peppers, and onion into strips.",
            "Toss chicken and vegetables with olive oil, fajita seasoning, salt, and black pepper.",
            "Spread the mixture evenly on the tray and roast for 20–25 minutes, stirring halfway, until chicken is cooked and vegetables are slightly charred.",
            "For a saucier filling, pour chopped tomatoes over the tray for the final 5–10 minutes of cooking.",
            "Wrap tortillas in foil and warm them in the oven for the last 5 minutes.",
            "Serve chicken, vegetables, warm tortillas, yoghurt, and salsa at the table.",
            "Build wraps, giving Fabian three tortillas with extra chicken and Stefanie two tortillas with a moderate chicken portion."
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
        fabiansPortion: {
            quantity: "Large bowl",
            eggs: "3 eggs",
            prawns: "150 g prawns",
            rice: "220 g cooked rice"
        },
        stefaniesPortion: {
            quantity: "Medium bowl",
            eggs: "2 eggs",
            prawns: "90 g prawns",
            rice: "130 g cooked rice"
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
            "Serve into bowls, giving Fabian a larger portion with more prawns and rice and Stefanie a moderate portion with plenty of vegetables."
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
        fabiansPortion: {
            quantity: "Large bowl + pitta",
            chicken: "220 g cooked chicken",
            potatoes: "250 g roasted potatoes",
            pitta: "1 large pitta"
        },
        stefaniesPortion: {
            quantity: "Medium bowl",
            chicken: "130 g cooked chicken",
            potatoes: "150 g roasted potatoes",
            pitta: "1 small pitta"
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
            "Build bowls with roasted potatoes, salad, chicken, and yoghurt dressing, serving Fabian a larger portion of chicken and potatoes and Stefanie a smaller portion with more salad."
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
        fabiansPortion: {
            quantity: "Large bowl",
            beef: "200 g cooked beef mince",
            lentils: "60 g dry lentils (cooked in)",
            rice: "200 g cooked rice"
        },
        stefaniesPortion: {
            quantity: "Medium bowl",
            beef: "110 g cooked beef mince",
            lentils: "40 g dry lentils (cooked in)",
            rice: "120 g cooked rice"
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
            "Serve over rice, giving Fabian a larger portion of both chilli and rice and Stefanie a smaller portion with more beans and peppers."
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
        fabiansPortion: {
            quantity: "Large plate",
            turkey: "220 g cooked turkey mince",
            pasta: "120 g dry pasta (cooked)",
            sauce: "generous"
        },
        stefaniesPortion: {
            quantity: "Medium plate",
            turkey: "130 g cooked turkey mince",
            pasta: "70 g dry pasta (cooked)",
            sauce: "moderate"
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
            "Serve the bolognese over pasta, giving Fabian a larger portion of both pasta and turkey sauce and Stefanie a smaller portion with extra vegetables if desired."
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
        fabiansPortion: {
            quantity: "Large bowl",
            chicken: "220 g cooked chicken",
            rice: "220 g cooked rice",
            sauce: "generous"
        },
        stefaniesPortion: {
            quantity: "Medium bowl",
            chicken: "130 g cooked chicken",
            rice: "140 g cooked rice",
            sauce: "moderate"
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
            "Serve over rice, giving Fabian a larger portion of both chicken and rice and Stefanie a slightly smaller portion."
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
        fabiansPortion: {
            quantity: "Large plate",
            fish: "180 g cod",
            veg: "250 g roasted vegetables",
            carbs: "optional side"
        },
        stefaniesPortion: {
            quantity: "Medium plate",
            fish: "130 g cod",
            veg: "200 g roasted vegetables",
            carbs: "minimal"
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
            "Serve vegetables and cod onto plates, giving Fabian a larger fish portion and more vegetables, and Stefanie a moderate portion.",
            "Squeeze remaining lemon juice over both portions before serving."
        ],
        tips: "Use frozen cod fillets for convenience; defrost them in the fridge beforehand. Add a small side of boiled potatoes if you want extra carbs for Fabian."
    },
    {
        id: "chicken-veg-sheet-pan-dinner",
        name: "Chicken & Veg Sheet-Pan Dinner",
        emoji: "🍗",
        description: "Simple sheet-pan chicken with mixed vegetables and potatoes for an easy, hands-off dinner.",
        prepTime: "15 min",
        cookTime: "35 min",
        servings: 2,
        fabiansPortion: {
            quantity: "Large plate",
            chicken: "220 g cooked chicken",
            potatoes: "250 g roasted potatoes",
            veg: "200 g vegetables"
        },
        stefaniesPortion: {
            quantity: "Medium plate",
            chicken: "130 g cooked chicken",
            potatoes: "150 g roasted potatoes",
            veg: "200 g vegetables"
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
            "Rest for a few minutes, then portion, giving Fabian more chicken and potatoes and Stefanie a smaller portion with extra vegetables."
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
        fabiansPortion: {
            quantity: "Large bowl",
            lentils: "70 g dry lentils (cooked in)",
            chickpeas: "150 g drained",
            rice: "200 g cooked rice"
        },
        stefaniesPortion: {
            quantity: "Medium bowl",
            lentils: "50 g dry lentils (cooked in)",
            chickpeas: "100 g drained",
            rice: "120 g cooked rice"
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
            "Serve curry over rice, giving Fabian a larger portion of both curry and rice and Stefanie a smaller portion with extra vegetables if desired."
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
        fabiansPortion: {
            quantity: "Large bowl",
            tofu: "180 g tofu",
            noodles: "150 g cooked noodles",
            veg: "200 g mixed vegetables"
        },
        stefaniesPortion: {
            quantity: "Medium bowl",
            tofu: "120 g tofu",
            noodles: "90 g cooked noodles",
            veg: "200 g mixed vegetables"
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
            "Serve in bowls, giving Fabian more tofu and noodles and Stefanie a slightly smaller portion with extra vegetables."
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
        fabiansPortion: {
            quantity: "Large bowl",
            chicken: "200 g cooked chicken",
            rice: "200 g cooked rice",
            salad: "large"
        },
        stefaniesPortion: {
            quantity: "Medium bowl",
            chicken: "130 g cooked chicken",
            rice: "120 g cooked rice",
            salad: "large"
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
            "Chop romaine lettuce, halve cherry tomatoes, and slice cucumber.",
            "In a small bowl, mix Greek yoghurt, finely grated garlic, lemon juice, Dijon mustard, Worcestershire sauce, grated Parmesan, salt, and black pepper to make a dressing.",
            "Divide rice between two bowls, giving Fabian a larger portion.",
            "Top with sliced chicken, plenty of salad vegetables, and a drizzle of dressing.",
            "Add more dressing for Fabian if desired and keep Stefanie’s dressing moderate."
        ],
        tips: "Grill extra chicken to keep in the fridge for quick lunches. Swap rice for quinoa if you want more fibre."
    },
    {
        id: "turkey-chilli-stuffed-peppers",
        name: "Turkey Chilli Stuffed Peppers",
        emoji: "🌶️",
        description: "Lean turkey chilli packed into roasted bell peppers and finished with a little cheese and yoghurt.",
        prepTime: "25 min",
        cookTime: "30 min",
        servings: 2,
        fabiansPortion: {
            quantity: "3 stuffed pepper halves",
            turkey: "220 g cooked turkey",
            beans: "120 g beans",
            cheese: "20 g cheese"
        },
        stefaniesPortion: {
            quantity: "2 stuffed pepper halves",
            turkey: "130 g cooked turkey",
            beans: "80 g beans",
            cheese: "15 g cheese"
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Red bell peppers", quantity: 5, unit: "piece" },
                { category: "produce", name: "Brown onion", quantity: 1, unit: "piece" },
                { category: "produce", name: "Garlic cloves", quantity: 2, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Turkey mince 5% fat", quantity: 400, unit: "g" },
                { category: "protein", name: "Black beans", quantity: 1, unit: "tin" },
                { category: "protein", name: "Cheddar cheese", quantity: 40, unit: "g" }
            ],
            dairy: [
                { category: "dairy", name: "Greek yoghurt", quantity: 80, unit: "g" }
            ],
            carbs: [
                { category: "carbs", name: "Chopped tomatoes", quantity: 200, unit: "g" }
            ],
            pantry: [
                { category: "pantry", name: "Tomato puree", quantity: 15, unit: "ml" },
                { category: "pantry", name: "Ground cumin", quantity: 5, unit: "g" },
                { category: "pantry", name: "Smoked paprika", quantity: 5, unit: "g" },
                { category: "pantry", name: "Chilli powder", quantity: 5, unit: "g" },
                { category: "pantry", name: "Olive oil", quantity: 15, unit: "ml" },
                { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
                { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
            ],
            other: []
        },
        instructions: [
            "Preheat oven to 190 °C (170 °C fan).",
            "Halve bell peppers lengthways and remove seeds, then place cut side up in a baking dish.",
            "Drizzle peppers with a little olive oil and bake for 10 minutes to soften.",
            "Meanwhile, finely chop onion and mince garlic.",
            "Heat remaining olive oil in a pan and cook onion for 5 minutes, then add garlic and cook for 1 minute.",
            "Add turkey mince and cook until browned, breaking it into small pieces.",
            "Stir in tomato puree, chopped tomatoes, drained black beans, ground cumin, smoked paprika, chilli powder, salt, and black pepper, then simmer for 10 minutes.",
            "Spoon turkey chilli into the softened pepper halves and top with grated cheddar cheese.",
            "Bake for a further 10–15 minutes until peppers are tender and cheese has melted, then serve topped with Greek yoghurt."
        ],
        tips: "Use any leftover chilli in wraps or over rice. You can prepare the filling in advance and stuff and bake the peppers when ready to eat."
    },
    {
        id: "sheet-pan-sausage-veg-traybake",
        name: "Sheet-Pan Chicken Sausage & Veg Traybake",
        emoji: "🥘",
        description: "Oven-roasted chicken sausages with potatoes and mixed vegetables for an easy traybake dinner.",
        prepTime: "15 min",
        cookTime: "30 min",
        servings: 2,
        fabiansPortion: {
            quantity: "Large plate",
            sausages: "3 chicken sausages",
            potatoes: "250 g roasted potatoes",
            veg: "200 g vegetables"
        },
        stefaniesPortion: {
            quantity: "Medium plate",
            sausages: "2 chicken sausages",
            potatoes: "150 g roasted potatoes",
            veg: "200 g vegetables"
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Baby potatoes", quantity: 450, unit: "g" },
                { category: "produce", name: "Red onion", quantity: 1, unit: "piece" },
                { category: "produce", name: "Carrots", quantity: 2, unit: "piece" },
                { category: "produce", name: "Green beans", quantity: 150, unit: "g" }
            ],
            protein: [
                { category: "protein", name: "Chicken sausages", quantity: 5, unit: "piece" }
            ],
            dairy: [],
            carbs: [],
            pantry: [
                { category: "pantry", name: "Olive oil", quantity: 25, unit: "ml" },
                { category: "pantry", name: "Dried rosemary", quantity: 5, unit: "g" },
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
            "Toss potatoes, carrots, green beans, and sliced red onion with olive oil, dried rosemary, garlic granules, paprika, salt, and black pepper.",
            "Spread the vegetables in an even layer on the tray.",
            "Place chicken sausages on top of the vegetables.",
            "Roast for 25–30 minutes, turning sausages and vegetables once, until sausages are cooked through and vegetables are tender and golden.",
            "Rest briefly, then serve, giving Fabian more sausages and potatoes and Stefanie a slightly smaller portion with extra vegetables."
        ],
        tips: "Choose lean chicken sausages to keep the fat content moderate. Leftover sausage and veg are great chopped into an omelette the next day."
    },
    {
        id: "spicy-prawn-tomato-pasta",
        name: "Spicy Prawn Tomato Pasta",
        emoji: "🍤",
        description: "Quick pasta dish with prawns in a spicy tomato and garlic sauce for a high-protein, satisfying meal.",
        prepTime: "15 min",
        cookTime: "15 min",
        servings: 2,
        fabiansPortion: {
            quantity: "Large bowl",
            prawns: "180 g prawns",
            pasta: "120 g dry pasta (cooked)",
            sauce: "generous"
        },
        stefaniesPortion: {
            quantity: "Medium bowl",
            prawns: "120 g prawns",
            pasta: "70 g dry pasta (cooked)",
            sauce: "moderate"
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Garlic cloves", quantity: 3, unit: "piece" },
                { category: "produce", name: "Cherry tomatoes", quantity: 150, unit: "g" },
                { category: "produce", name: "Fresh parsley bunch", quantity: 1, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Raw peeled prawns", quantity: 300, unit: "g" }
            ],
            dairy: [],
            carbs: [
                { category: "carbs", name: "Spaghetti or linguine", quantity: 200, unit: "g" },
                { category: "carbs", name: "Chopped tomatoes", quantity: 200, unit: "g" }
            ],
            pantry: [
                { category: "pantry", name: "Olive oil", quantity: 20, unit: "ml" },
                { category: "pantry", name: "Chilli flakes", quantity: 5, unit: "g" },
                { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
                { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
            ],
            other: []
        },
        instructions: [
            "Cook pasta in salted water according to packet instructions until al dente, then reserve a little cooking water and drain.",
            "Finely slice garlic and halve cherry tomatoes.",
            "Heat olive oil in a large frying pan, add garlic and chilli flakes, and cook for 1 minute until fragrant.",
            "Add prawns and cook for 2–3 minutes until they start to turn pink.",
            "Add chopped tomatoes and cherry tomatoes and simmer for 5 minutes until the sauce thickens slightly.",
            "Season with salt and black pepper and stir in chopped fresh parsley.",
            "Add cooked pasta to the pan with a splash of reserved cooking water and toss to coat in the sauce.",
            "Serve in bowls, giving Fabian more pasta and prawns and Stefanie a smaller portion with extra tomatoes."
        ],
        tips: "Use cooked prawns if you want to reduce cook time; just heat them through in the sauce. Adjust chilli flakes to your preferred spice level."
    },
    {
        id: "one-pot-chicken-rice-peas",
        name: "One-Pot Chicken, Rice & Peas",
        emoji: "🍲",
        description: "Simple one-pot dish with chicken thighs, rice, peas, and herbs for a comforting, low-cleanup dinner.",
        prepTime: "15 min",
        cookTime: "30 min",
        servings: 2,
        fabiansPortion: {
            quantity: "Large bowl",
            chicken: "220 g cooked chicken",
            rice: "220 g cooked rice",
            peas: "100 g peas"
        },
        stefaniesPortion: {
            quantity: "Medium bowl",
            chicken: "130 g cooked chicken",
            rice: "140 g cooked rice",
            peas: "80 g peas"
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Brown onion", quantity: 1, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Chicken thighs, skinless", quantity: 450, unit: "g" }
            ],
            dairy: [],
            carbs: [
                { category: "carbs", name: "Long grain rice", quantity: 220, unit: "g" },
                { category: "carbs", name: "Frozen peas", quantity: 150, unit: "g" }
            ],
            pantry: [
                { category: "pantry", name: "Chicken stock", quantity: 500, unit: "ml" },
                { category: "pantry", name: "Olive oil", quantity: 15, unit: "ml" },
                { category: "pantry", name: "Dried thyme", quantity: 5, unit: "g" },
                { category: "pantry", name: "Garlic granules", quantity: 5, unit: "g" },
                { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
                { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
            ],
            other: []
        },
        instructions: [
            "Finely chop the onion.",
            "Heat olive oil in a large lidded pan and brown chicken thighs on both sides for a few minutes, then remove and set aside.",
            "In the same pan, cook chopped onion for 5 minutes until softened.",
            "Add rice, dried thyme, garlic granules, and a pinch of salt and stir to coat the rice in the oil.",
            "Pour in chicken stock and bring to a gentle boil.",
            "Return chicken thighs to the pan, reduce heat to low, cover, and cook for 20 minutes.",
            "Add frozen peas, cover again, and cook for a further 5 minutes until rice is tender and chicken is cooked through.",
            "Season with salt and black pepper, then rest for a few minutes before serving, giving Fabian more chicken and rice and Stefanie a slightly smaller portion with extra peas."
        ],
        tips: "Use boneless chicken thighs for easier portioning. This dish reheats well, so you can save leftovers for lunch."
    },
    {
        id: "baked-chicken-parmesan-pasta",
        name: "Baked Chicken Parmesan Pasta",
        emoji: "🧀",
        description: "Oven-baked pasta with tomato sauce, sliced chicken breast, and a light Parmesan and mozzarella topping.",
        prepTime: "25 min",
        cookTime: "25 min",
        servings: 2,
        fabiansPortion: {
            quantity: "Large slice",
            chicken: "200 g cooked chicken",
            pasta: "120 g dry pasta (cooked)",
            cheese: "30 g cheese"
        },
        stefaniesPortion: {
            quantity: "Medium slice",
            chicken: "130 g cooked chicken",
            pasta: "70 g dry pasta (cooked)",
            cheese: "20 g cheese"
        },
        ingredients: {
            produce: [
                { category: "produce", name: "Brown onion", quantity: 1, unit: "piece" },
                { category: "produce", name: "Garlic cloves", quantity: 2, unit: "piece" }
            ],
            protein: [
                { category: "protein", name: "Chicken breast fillets", quantity: 400, unit: "g" },
                { category: "protein", name: "Mozzarella cheese", quantity: 40, unit: "g" },
                { category: "protein", name: "Parmesan cheese", quantity: 20, unit: "g" }
            ],
            dairy: [],
            carbs: [
                { category: "carbs", name: "Penne pasta", quantity: 200, unit: "g" },
                { category: "carbs", name: "Tomato passata", quantity: 300, unit: "ml" }
            ],
            pantry: [
                { category: "pantry", name: "Tomato puree", quantity: 15, unit: "ml" },
                { category: "pantry", name: "Dried basil", quantity: 5, unit: "g" },
                { category: "pantry", name: "Dried oregano", quantity: 5, unit: "g" },
                { category: "pantry", name: "Olive oil", quantity: 15, unit: "ml" },
                { category: "pantry", name: "Salt", quantity: 5, unit: "g" },
                { category: "pantry", name: "Black pepper", quantity: 2, unit: "g" }
            ],
            other: []
        },
        instructions: [
            "Cook penne pasta in salted water until al dente, then drain and set aside.",
            "Season chicken breasts with salt and black pepper and cook in a pan with a little olive oil for 6–7 minutes per side until cooked through, then slice.",
            "In the same pan, cook finely chopped onion for 5 minutes, then add minced garlic and cook for 1 minute.",
            "Stir in tomato passata, tomato puree, dried basil, and dried oregano and simmer for 10 minutes.",
            "Mix cooked pasta with the tomato sauce and transfer to an ovenproof dish.",
            "Arrange sliced chicken on top and sprinkle with grated mozzarella and Parmesan.",
            "Bake at 190 °C (170 °C fan) for 15–20 minutes until cheese is melted and golden in spots.",
            "Rest for a few minutes, then slice and serve, giving Fabian a larger portion of chicken and pasta and Stefanie a smaller portion."
        ],
        tips: "Use pre-cooked chicken to save time on busy nights. Add spinach or peas into the sauce for extra vegetables."
    }
];

// When you build allIngredients from recipes:
function getAllIngredientsNormalised(sourceRecipes) {
    const map = new Map();
    const recipesToUse = Array.isArray(sourceRecipes) ? sourceRecipes : recipeBank;

    for (const recipe of recipesToUse) {
        const ingByCat = recipe.ingredients;
        if (!ingByCat) continue;

        for (const category of ["produce", "protein", "dairy", "carbs", "pantry", "other"]) {
            const list = ingByCat[category] || [];
            for (const ing of list) {
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

const PROFILES = [
    {
        id: "fabian",
        name: "Fabian Goldie",
        sex: "male",
        age: 29,
        heightCm: 182,
        weightKg: 82,
        activityLevel: "very_active",           // UI label: "Very active"
        goal: "muscle_gain",                    // UI label: "Lean bulk (+500 kcal)"
        weeklyCalorieAdjustment: +3500,         // ≈ +500 kcal/day
        dailyCaloriesTarget: 3200,              // tweak after tracking
        macroTargets: {
            // Roughly 2.2 g/kg protein, 25% fat, rest carbs
            proteinGrams: 180,                    // ~2.2 g/kg
            carbsGrams: 360,                      // fills remaining calories
            fatsGrams: 90                         // ~25% of calories
        },
        macroDistributionPercent: {
            protein: 25,
            carbs: 45,
            fats: 30
        }
    },
    {
        id: "stefanie",
        name: "Stefanie Goldie",
        sex: "female",
        age: 27,
        heightCm: 165,
        weightKg: 65,
        activityLevel: "moderately_active",     // UI: "Moderately active"
        goal: "fat_loss",                       // UI: "Weight loss (−500 kcal)"
        weeklyCalorieAdjustment: -3500,         // ≈ −500 kcal/day
        dailyCaloriesTarget: 1700,              // tweak after tracking
        macroTargets: {
            // Higher protein bias for dieting: ~2.0 g/kg
            proteinGrams: 130,
            carbsGrams: 130,
            fatsGrams: 55
        },
        macroDistributionPercent: {
            protein: 30,
            carbs: 35,
            fats: 35
        }
    }
];