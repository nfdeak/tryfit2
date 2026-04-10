export const COUNTRIES = [
  "India","United States","United Kingdom","Canada","Australia","Germany","France","Japan","Brazil","South Korea",
  "Singapore","UAE","Saudi Arabia","Indonesia","Thailand","Malaysia","Philippines","Vietnam","Nigeria","South Africa",
  "Mexico","Colombia","Argentina","Chile","Egypt","Turkey","Italy","Spain","Netherlands","Sweden","Norway","Denmark",
  "Finland","Poland","Switzerland","Austria","Belgium","Ireland","Portugal","New Zealand","Russia","China","Pakistan",
  "Bangladesh","Sri Lanka","Nepal","Kenya","Ghana","Tanzania","Ethiopia","Morocco","Israel","Qatar","Kuwait","Bahrain","Oman"
].sort();

export const ALLERGENS = [
  "Gluten", "Dairy", "Eggs", "Nuts", "Peanuts", "Shellfish", "Fish",
  "Soy", "Sesame", "Mustard", "Sulfites", "Corn", "Nightshades", "Fructose"
];

export const ALLERGEN_ICONS: Record<string, string> = {
  "Gluten": "🌾", "Dairy": "🥛", "Eggs": "🥚", "Nuts": "🥜", "Peanuts": "🥜",
  "Shellfish": "🦐", "Fish": "🐟", "Soy": "🫘", "Sesame": "🌿", "Mustard": "🟡",
  "Sulfites": "⚗️", "Corn": "🌽", "Nightshades": "🍆", "Fructose": "🍬"
};

export const INGREDIENT_ICONS: Record<string, string> = {
  // Proteins
  "Chicken": "🍗", "Eggs": "🥚", "Paneer": "🧀", "Fish": "🐟", "Tuna": "🐟",
  "Prawns": "🦐", "Mutton": "🥩", "Tofu": "🧊", "Lentils (Dal)": "🍲",
  "Chickpeas": "🥙", "Kidney Beans": "🫕", "Whey Protein": "🥛",
  // Vegetables
  "Spinach": "🥬", "Broccoli": "🥦", "Cauliflower": "🥦", "Zucchini": "🥒",
  "Capsicum": "🫑", "Mushroom": "🍄", "Cabbage": "🥬", "French Beans": "🫛",
  "Cucumber": "🥒", "Tomato": "🍅", "Onion": "🧅", "Carrot": "🥕", "Pumpkin": "🎃",
  // Fruits
  "Apple": "🍎", "Banana": "🍌", "Berries": "🫐", "Papaya": "🥭", "Guava": "🍐",
  "Orange": "🍊", "Watermelon": "🍉", "Pomegranate": "🫐",
  // Nuts & Seeds
  "Almonds": "🌰", "Walnuts": "🌰", "Chia Seeds": "🌱", "Flaxseeds": "🌱",
  "Pumpkin Seeds": "🌻", "Cashews": "🌰",
  // Dairy
  "Curd/Yogurt": "🥛", "Milk": "🥛", "Cheese": "🧀", "Butter": "🧈",
  "Ghee": "🫕", "Buttermilk": "🥛",
  // Grains & Carbs
  "Oats": "🥣", "Quinoa": "🌾", "Brown Rice": "🍚", "Sweet Potato": "🍠",
  "Whole Wheat Roti": "🫓"
};

export const INGREDIENT_CATEGORIES = [
  {
    name: "Proteins",
    items: ["Chicken", "Eggs", "Paneer", "Fish", "Tuna", "Prawns", "Mutton", "Tofu",
      "Lentils (Dal)", "Chickpeas", "Kidney Beans", "Whey Protein"]
  },
  {
    name: "Vegetables",
    items: ["Spinach", "Broccoli", "Cauliflower", "Zucchini", "Capsicum", "Mushroom",
      "Cabbage", "French Beans", "Cucumber", "Tomato", "Onion", "Carrot", "Pumpkin"]
  },
  {
    name: "Fruits",
    items: ["Apple", "Banana", "Berries", "Papaya", "Guava", "Orange", "Watermelon", "Pomegranate"]
  },
  {
    name: "Nuts & Seeds",
    items: ["Almonds", "Walnuts", "Chia Seeds", "Flaxseeds", "Pumpkin Seeds", "Cashews"]
  },
  {
    name: "Dairy",
    items: ["Curd/Yogurt", "Milk", "Cheese", "Butter", "Ghee", "Buttermilk"]
  },
  {
    name: "Grains & Carbs",
    items: ["Oats", "Quinoa", "Brown Rice", "Sweet Potato", "Whole Wheat Roti"]
  }
];

export const CUISINES = [
  "Indian", "South Indian", "North Indian", "Mediterranean",
  "Asian", "Continental", "Middle Eastern", "Mexican"
];

export const KITCHEN_EQUIPMENT = [
  "Stovetop", "Oven/OTG", "Air Fryer", "Microwave", "Blender", "No equipment"
];

export const EQUIPMENT_ICONS: Record<string, string> = {
  "Stovetop": "🔥", "Oven/OTG": "♨️", "Air Fryer": "🌀", "Microwave": "⏱️",
  "Blender": "🥤", "No equipment": "🚫"
};

export const HEALTH_CONDITIONS = [
  "Diabetes", "Thyroid", "PCOS", "Hypertension", "High Cholesterol", "IBS", "None"
];
