export interface ShoppingCategory {
  name: string;
  items: string[];
}

export const SHOPPING_LIST: ShoppingCategory[] = [
  {
    name: "Proteins",
    items: [
      "Eggs (36 pcs)",
      "Chicken breast boneless (1.2 kg)",
      "Chicken thigh skinless (400g)",
      "Chicken minced (800g)",
      "Fish rohu/tilapia/pomfret (1.2 kg)",
      "Tuna canned in water (4 cans)",
      "Paneer low fat (400g)",
      "Whey protein powder (500g tub)"
    ]
  },
  {
    name: "Dairy",
    items: [
      "Curd/dahi low fat (2 kg)",
      "Buttermilk thin chaas (2 L)",
      "Almond milk unsweetened (1 L)",
      "Low fat cheese slice (1 pack)"
    ]
  },
  {
    name: "Vegetables",
    items: [
      "Spinach/palak (500g)",
      "Cauliflower (2 heads)",
      "Broccoli (400g)",
      "Cabbage (1 head)",
      "Cucumber (6 pcs)",
      "Tomatoes (1 kg)",
      "Onions (1 kg)",
      "Capsicum mixed (4 pcs)",
      "Mushrooms button (400g)",
      "Zucchini (2 pcs)",
      "French beans (300g)",
      "Lettuce leaves (1 head)",
      "Green chillies (100g)",
      "Ginger (100g)",
      "Garlic (2 heads)"
    ]
  },
  {
    name: "Dry Goods",
    items: [
      "Chia seeds (200g)",
      "Flaxseeds (100g)",
      "Rolled oats (200g)",
      "Roasted chana (200g)",
      "Rajma kidney beans (250g)",
      "Makhana fox nuts (100g)",
      "Almonds (200g)",
      "Walnuts (100g)"
    ]
  },
  {
    name: "Pantry & Spices",
    items: [
      "Olive oil/Coconut oil (500ml)",
      "Turmeric powder (50g)",
      "Red chilli powder (50g)",
      "Cumin seeds (50g)",
      "Coriander powder (50g)",
      "Garam masala (30g)",
      "Black pepper (50g)",
      "Rock salt (200g)",
      "Mustard seeds (50g)",
      "Curry leaves (2 sprigs)",
      "Lemons (8 pcs)",
      "Green tea bags (1 box)",
      "Coffee black (as needed)",
      "Low sodium soy sauce (1 bottle)",
      "Chaat masala (30g)"
    ]
  },
  {
    name: "Supplements",
    items: [
      "Whey protein isolate (1 kg tub)",
      "Multivitamin (30 day supply)",
      "Omega-3 fish oil caps (60 caps)",
      "Vitamin D3 (60 caps)",
      "Electrolyte powder (1 pack)"
    ]
  }
];
