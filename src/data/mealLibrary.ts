export interface MealPreset {
  id: string
  name: string
  emoji: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert'
  calories: number
  protein: number
  carbs: number
  fat: number
  description: string
}

export const MEAL_PRESETS: MealPreset[] = [
  // ─── Breakfast ────────────────────────────────────────────────────────────────
  {
    id: 'breakfast-yogurt-bowl',
    name: 'Yogurt & Oat Bowl',
    emoji: '🥣',
    category: 'breakfast',
    calories: 555,
    protein: 24,
    carbs: 68,
    fat: 20,
    description: 'Greek yogurt, berries, walnuts, oatmeal, cinnamon, maple syrup',
  },
  {
    id: 'breakfast-eggs-bacon',
    name: 'Eggs & Bacon',
    emoji: '🍳',
    category: 'breakfast',
    calories: 420,
    protein: 30,
    carbs: 2,
    fat: 32,
    description: '3 eggs, 3 strips bacon',
  },
  {
    id: 'breakfast-pancakes',
    name: 'Pancakes',
    emoji: '🥞',
    category: 'breakfast',
    calories: 490,
    protein: 9,
    carbs: 78,
    fat: 14,
    description: '3 pancakes, maple syrup, butter',
  },
  // ─── Snacks ───────────────────────────────────────────────────────────────────
  {
    id: 'snack-carrots-hummus',
    name: 'Carrots & Hummus',
    emoji: '🥕',
    category: 'snack',
    calories: 127,
    protein: 4,
    carbs: 20,
    fat: 4,
    description: '1 cup carrots, 3 tbsp hummus',
  },
  // ─── Lunch ────────────────────────────────────────────────────────────────────
  {
    id: 'lunch-chicken-salad',
    name: 'Chicken & Salad',
    emoji: '🥗',
    category: 'lunch',
    calories: 380,
    protein: 45,
    carbs: 10,
    fat: 16,
    description: 'Grilled chicken, mixed greens, olive oil dressing',
  },
  {
    id: 'lunch-sandwich',
    name: 'Sandwich',
    emoji: '🥪',
    category: 'lunch',
    calories: 450,
    protein: 30,
    carbs: 45,
    fat: 12,
    description: 'Chicken or turkey, bread, lettuce, tomato',
  },
  {
    id: 'lunch-big-salad',
    name: 'Big Salad',
    emoji: '🥬',
    category: 'lunch',
    calories: 300,
    protein: 18,
    carbs: 18,
    fat: 14,
    description: 'Mixed greens, protein, veggies, olive oil dressing',
  },
  // ─── Dinner ───────────────────────────────────────────────────────────────────
  {
    id: 'dinner-chicken',
    name: 'Chicken Dinner',
    emoji: '🍗',
    category: 'dinner',
    calories: 480,
    protein: 52,
    carbs: 30,
    fat: 14,
    description: 'Grilled chicken, roasted carrots, quinoa or salad',
  },
  {
    id: 'dinner-pizza',
    name: 'Pizza (2 slices)',
    emoji: '🍕',
    category: 'dinner',
    calories: 500,
    protein: 20,
    carbs: 60,
    fat: 18,
    description: '2 slices cheese pizza',
  },
  {
    id: 'dinner-meat',
    name: 'Meat & Sides',
    emoji: '🥩',
    category: 'dinner',
    calories: 520,
    protein: 48,
    carbs: 20,
    fat: 24,
    description: 'Steak or ground beef, vegetables, salad',
  },
  // ─── Dessert ──────────────────────────────────────────────────────────────────
  {
    id: 'dessert-cookies',
    name: 'Cookies (2)',
    emoji: '🍪',
    category: 'dessert',
    calories: 200,
    protein: 2,
    carbs: 28,
    fat: 10,
    description: '2 chocolate chip cookies',
  },
]

export function getPresetsByCategory(category: MealPreset['category']): MealPreset[] {
  return MEAL_PRESETS.filter((m) => m.category === category)
}

// Maps the agenda slot name to the nutrition log meal ID
export const SLOT_TO_MEAL_ID: Record<string, string> = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  snack: 'snacks',
  dessert: 'snacks',
}
