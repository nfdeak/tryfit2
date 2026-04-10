import { DayPlan } from '../types';

export const MEAL_PLAN: DayPlan[] = [
  {
    label: "Monday",
    meals: [
      { name: "Masala Egg White Scramble + Paneer Bhurji", description: "Spiced egg whites and soft paneer scramble with cumin, turmeric, and green chilli", time: "7:30 AM", calories: 280, protein: 42, carbs: 8, fat: 9 },
      { name: "Tandoori Chicken Breast + Cucumber Raita + Stir-Fried Cabbage", description: "Marinated tandoori chicken with cool raita and lightly stir-fried cabbage", time: "1:00 PM", calories: 360, protein: 55, carbs: 12, fat: 10 },
      { name: "Roasted Chana + Buttermilk", description: "Crunchy roasted chickpeas with a tall glass of spiced buttermilk", time: "5:00 PM", calories: 130, protein: 10, carbs: 14, fat: 3 },
      { name: "Grilled Fish + Sautéed Spinach + Tomato Soup", description: "Lemon-herb grilled fish with wilted spinach and a light tomato broth", time: "8:00 PM", calories: 310, protein: 46, carbs: 12, fat: 8 }
    ]
  },
  {
    label: "Tuesday",
    meals: [
      { name: "Greek Yogurt Bowl + Boiled Eggs", description: "Thick Greek yogurt with chia seeds topped with 2 hard-boiled eggs", time: "7:30 AM", calories: 300, protein: 34, carbs: 10, fat: 14 },
      { name: "Chicken Keema + Cauliflower Rice", description: "Spiced minced chicken cooked dry with grated cauliflower as a rice substitute", time: "1:00 PM", calories: 310, protein: 46, carbs: 10, fat: 9 },
      { name: "Boiled Egg Whites + Green Tea", description: "4 boiled egg whites with a cup of antioxidant-rich green tea", time: "5:00 PM", calories: 60, protein: 14, carbs: 1, fat: 0 },
      { name: "Chicken Clear Soup + Stir-Fried Broccoli + Paneer Tikka", description: "Light chicken broth with ginger, crispy broccoli, and grilled paneer tikka", time: "8:00 PM", calories: 320, protein: 44, carbs: 9, fat: 12 }
    ]
  },
  {
    label: "Wednesday",
    meals: [
      { name: "Omelette Wrap in Lettuce + Whey Shake", description: "Veggie-packed omelette wrapped in crisp lettuce leaves with a whey protein shake", time: "7:30 AM", calories: 380, protein: 52, carbs: 6, fat: 16 },
      { name: "Tuna Salad Bowl", description: "Canned tuna with cucumber, tomato, onion, lemon juice, and olive oil dressing", time: "1:00 PM", calories: 340, protein: 58, carbs: 8, fat: 8 },
      { name: "Cottage Cheese Cubes + Chaas", description: "Fresh paneer cubes with chaat masala and a glass of spiced buttermilk", time: "5:00 PM", calories: 175, protein: 18, carbs: 4, fat: 10 },
      { name: "Lemon Herb Chicken Thigh + Zucchini Stir-fry", description: "Baked chicken thigh with lemon-herb marinade and sautéed zucchini slices", time: "8:00 PM", calories: 295, protein: 42, carbs: 6, fat: 11 }
    ]
  },
  {
    label: "Thursday",
    meals: [
      { name: "Egg Bhurji + Cucumber Sticks", description: "Masala-spiced scrambled eggs with fresh crunchy cucumber sticks on the side", time: "7:30 AM", calories: 320, protein: 30, carbs: 8, fat: 18 },
      { name: "Chicken Kebabs + Mint Chutney + Onion Salad", description: "Grilled seekh kebabs with fresh mint chutney and crisp raw onion salad", time: "1:00 PM", calories: 320, protein: 52, carbs: 7, fat: 9 },
      { name: "Almonds + Walnuts + Green Tea", description: "A small handful of mixed nuts with a soothing cup of green tea", time: "5:00 PM", calories: 140, protein: 5, carbs: 5, fat: 12 },
      { name: "Baked Fish + Sautéed French Beans", description: "Oven-baked spiced fish fillet with garlic-tossed French beans", time: "8:00 PM", calories: 310, protein: 44, carbs: 10, fat: 10 }
    ]
  },
  {
    label: "Friday",
    meals: [
      { name: "Overnight Chia Pudding + Protein Shake", description: "Almond milk chia pudding soaked overnight with a vanilla whey protein shake", time: "7:30 AM", calories: 340, protein: 38, carbs: 12, fat: 16 },
      { name: "Chicken Pepper Fry + Mixed Veg + Raita", description: "Bold black pepper chicken dry fry with seasonal vegetables and cooling raita", time: "1:00 PM", calories: 375, protein: 52, carbs: 14, fat: 12 },
      { name: "Hard Boiled Eggs + Chaas", description: "2 hard-boiled eggs with spiced thin buttermilk for an afternoon protein boost", time: "5:00 PM", calories: 210, protein: 20, carbs: 4, fat: 12 },
      { name: "Egg White Stir Fry + Mushroom Masala Dry", description: "High-protein egg white stir fry with a spicy dry mushroom masala", time: "8:00 PM", calories: 220, protein: 36, carbs: 10, fat: 4 }
    ]
  },
  {
    label: "Saturday",
    meals: [
      { name: "Veggie Omelette (4 Egg) + Paneer Slice", description: "Fluffy 4-egg veggie omelette with capsicum, onion, and a slice of fresh paneer", time: "7:30 AM", calories: 390, protein: 42, carbs: 5, fat: 22 },
      { name: "Rajma Protein Bowl — no rice", description: "Spiced kidney bean curry served without rice, topped with onion and lemon", time: "1:00 PM", calories: 265, protein: 22, carbs: 32, fat: 5 },
      { name: "Roasted Makhana + Green Tea", description: "Lightly salted roasted fox nuts with a cup of antioxidant green tea", time: "5:00 PM", calories: 100, protein: 4, carbs: 20, fat: 0 },
      { name: "Steamed Fish + Stir-Fried Spinach", description: "Delicate steamed fish fillet with garlic-sautéed spinach and lemon", time: "8:00 PM", calories: 275, protein: 48, carbs: 7, fat: 6 }
    ]
  },
  {
    label: "Sunday",
    meals: [
      { name: "Masala Oats (Savoury) + Boiled Eggs", description: "Savoury oats cooked with veggies and spices, served with 2 boiled eggs", time: "7:30 AM", calories: 335, protein: 28, carbs: 28, fat: 12 },
      { name: "Whole Roast Chicken Leg + Salad Bar", description: "Roasted chicken leg with a large colourful salad of cucumber, tomato, and onion", time: "1:00 PM", calories: 345, protein: 45, carbs: 8, fat: 14 },
      { name: "Protein Shake + Almonds", description: "Chilled whey protein shake with a small serving of almonds for healthy fats", time: "5:00 PM", calories: 195, protein: 27, carbs: 5, fat: 8 },
      { name: "Egg White Frittata + Capsicum-Onion Stir Fry", description: "Baked egg white frittata with a vibrant capsicum and onion stir fry", time: "8:00 PM", calories: 245, protein: 38, carbs: 10, fat: 6 }
    ]
  }
];

export const MEAL_LABELS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
export const MEAL_ICONS = ['🌅', '☀️', '🍎', '🌙'];
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
