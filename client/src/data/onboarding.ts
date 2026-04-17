// Country name → ISO2 code mapping (subset of popular countries)
export const COUNTRY_CODES: Record<string, string> = {
  "India": "IN", "United States": "US", "United Kingdom": "GB", "Canada": "CA",
  "Australia": "AU", "Germany": "DE", "France": "FR", "Japan": "JP", "Brazil": "BR",
  "South Korea": "KR", "Singapore": "SG", "UAE": "AE", "Saudi Arabia": "SA",
  "Indonesia": "ID", "Thailand": "TH", "Malaysia": "MY", "Philippines": "PH",
  "Vietnam": "VN", "Nigeria": "NG", "South Africa": "ZA", "Mexico": "MX",
  "Colombia": "CO", "Argentina": "AR", "Chile": "CL", "Egypt": "EG", "Turkey": "TR",
  "Italy": "IT", "Spain": "ES", "Netherlands": "NL", "Sweden": "SE", "Norway": "NO",
  "Denmark": "DK", "Finland": "FI", "Poland": "PL", "Switzerland": "CH", "Austria": "AT",
  "Belgium": "BE", "Ireland": "IE", "Portugal": "PT", "New Zealand": "NZ", "Russia": "RU",
  "China": "CN", "Pakistan": "PK", "Bangladesh": "BD", "Sri Lanka": "LK", "Nepal": "NP",
  "Kenya": "KE", "Ghana": "GH", "Tanzania": "TZ", "Ethiopia": "ET", "Morocco": "MA",
  "Israel": "IL", "Qatar": "QA", "Kuwait": "KW", "Bahrain": "BH", "Oman": "OM"
};

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

export const CUISINE_OPTIONS = [
  // South Asia
  { value: 'South Indian',    label: 'South Indian',       region: 'South Asia' },
  { value: 'North Indian',    label: 'North Indian',        region: 'South Asia' },
  { value: 'Mughlai',         label: 'Mughlai',             region: 'South Asia' },
  { value: 'Gujarati',        label: 'Gujarati',            region: 'South Asia' },
  { value: 'Maharashtrian',   label: 'Maharashtrian',       region: 'South Asia' },
  { value: 'Bengali',         label: 'Bengali',             region: 'South Asia' },
  { value: 'Rajasthani',      label: 'Rajasthani',          region: 'South Asia' },
  { value: 'Kerala',          label: 'Kerala',              region: 'South Asia' },
  { value: 'Punjabi',         label: 'Punjabi',             region: 'South Asia' },
  { value: 'Hyderabadi',      label: 'Hyderabadi',          region: 'South Asia' },
  { value: 'Sri Lankan',      label: 'Sri Lankan',          region: 'South Asia' },
  { value: 'Pakistani',       label: 'Pakistani',           region: 'South Asia' },
  { value: 'Nepali',          label: 'Nepali',              region: 'South Asia' },
  // East Asia
  { value: 'Chinese',         label: 'Chinese',             region: 'East Asia' },
  { value: 'Japanese',        label: 'Japanese',            region: 'East Asia' },
  { value: 'Korean',          label: 'Korean',              region: 'East Asia' },
  { value: 'Taiwanese',       label: 'Taiwanese',           region: 'East Asia' },
  { value: 'Cantonese',       label: 'Cantonese',           region: 'East Asia' },
  { value: 'Sichuan',         label: 'Sichuan',             region: 'East Asia' },
  // Southeast Asia
  { value: 'Thai',            label: 'Thai',                region: 'Southeast Asia' },
  { value: 'Vietnamese',      label: 'Vietnamese',          region: 'Southeast Asia' },
  { value: 'Indonesian',      label: 'Indonesian',          region: 'Southeast Asia' },
  { value: 'Malaysian',       label: 'Malaysian',           region: 'Southeast Asia' },
  { value: 'Filipino',        label: 'Filipino',            region: 'Southeast Asia' },
  { value: 'Singaporean',     label: 'Singaporean',         region: 'Southeast Asia' },
  { value: 'Burmese',         label: 'Burmese',             region: 'Southeast Asia' },
  // Middle East & North Africa
  { value: 'Lebanese',        label: 'Lebanese',            region: 'Middle East' },
  { value: 'Turkish',         label: 'Turkish',             region: 'Middle East' },
  { value: 'Persian',         label: 'Persian / Iranian',   region: 'Middle East' },
  { value: 'Arabic',          label: 'Arabic',              region: 'Middle East' },
  { value: 'Israeli',         label: 'Israeli',             region: 'Middle East' },
  { value: 'Moroccan',        label: 'Moroccan',            region: 'North Africa' },
  { value: 'Egyptian',        label: 'Egyptian',            region: 'North Africa' },
  { value: 'Yemeni',          label: 'Yemeni',              region: 'Middle East' },
  { value: 'Saudi Arabian',   label: 'Saudi Arabian',       region: 'Middle East' },
  // Mediterranean & Southern Europe
  { value: 'Mediterranean',   label: 'Mediterranean',       region: 'Mediterranean' },
  { value: 'Italian',         label: 'Italian',             region: 'Mediterranean' },
  { value: 'Greek',           label: 'Greek',               region: 'Mediterranean' },
  { value: 'Spanish',         label: 'Spanish',             region: 'Mediterranean' },
  { value: 'Portuguese',      label: 'Portuguese',          region: 'Mediterranean' },
  // Western & Northern Europe
  { value: 'French',          label: 'French',              region: 'Europe' },
  { value: 'British',         label: 'British',             region: 'Europe' },
  { value: 'German',          label: 'German',              region: 'Europe' },
  { value: 'Scandinavian',    label: 'Scandinavian',        region: 'Europe' },
  { value: 'Polish',          label: 'Polish',              region: 'Europe' },
  { value: 'Russian',         label: 'Russian',             region: 'Europe' },
  // Americas
  { value: 'American',        label: 'American',            region: 'Americas' },
  { value: 'Mexican',         label: 'Mexican',             region: 'Americas' },
  { value: 'Peruvian',        label: 'Peruvian',            region: 'Americas' },
  { value: 'Brazilian',       label: 'Brazilian',           region: 'Americas' },
  { value: 'Caribbean',       label: 'Caribbean',           region: 'Americas' },
  { value: 'Colombian',       label: 'Colombian',           region: 'Americas' },
  // Africa (Sub-Saharan)
  { value: 'Ethiopian',       label: 'Ethiopian',           region: 'Africa' },
  { value: 'Nigerian',        label: 'Nigerian',            region: 'Africa' },
  { value: 'West African',    label: 'West African',        region: 'Africa' },
  { value: 'East African',    label: 'East African',        region: 'Africa' },
  // Central Asia & Caucasus
  { value: 'Georgian',        label: 'Georgian',            region: 'Caucasus' },
  { value: 'Uzbek',           label: 'Uzbek / Central Asian', region: 'Central Asia' },
] as const;

// Flat array of cuisine labels for backward compat
export const CUISINES = CUISINE_OPTIONS.map(c => c.value);

// Unique regions in order
export const CUISINE_REGIONS = Array.from(
  new Set(CUISINE_OPTIONS.map(c => c.region))
);

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
