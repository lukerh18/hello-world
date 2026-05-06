import type { DayOfWeek } from '../types'

export interface MealItem {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving: string
}

export interface SuggestedMeal {
  id: string
  name: string
  time: string
  items: MealItem[]
}

export interface DayMealPlan {
  day: DayOfWeek
  meals: SuggestedMeal[]
}

// ─── Rotating Breakfasts ─────────────────────────────────────────────────────
const BREAKFASTS: Record<DayOfWeek, SuggestedMeal> = {
  monday: {
    id: 'breakfast', name: 'Breakfast', time: '7:30 AM',
    items: [
      { name: 'Fage 0% Greek Yogurt', calories: 130, protein: 22, carbs: 9, fat: 0, serving: '1 cup' },
      { name: 'Rolled Oats (dry)', calories: 150, protein: 5, carbs: 27, fat: 3, serving: '½ cup' },
      { name: 'Mixed Berries', calories: 45, protein: 1, carbs: 11, fat: 0, serving: '½ cup' },
      { name: 'Chia Seeds', calories: 60, protein: 2, carbs: 5, fat: 4, serving: '1 tbsp' },
      { name: 'Walnuts', calories: 65, protein: 2, carbs: 1, fat: 7, serving: '1 tbsp chopped' },
      { name: 'Honey', calories: 21, protein: 0, carbs: 6, fat: 0, serving: '1 tsp' },
    ],
  },
  tuesday: {
    id: 'breakfast', name: 'Breakfast', time: '7:30 AM',
    items: [
      { name: 'Egg Whites', calories: 100, protein: 21, carbs: 1, fat: 0, serving: '4 whites' },
      { name: 'Whole Egg', calories: 70, protein: 6, carbs: 0, fat: 5, serving: '1 large' },
      { name: 'Baby Spinach (wilted)', calories: 7, protein: 1, carbs: 1, fat: 0, serving: '1 cup' },
      { name: 'Salsa', calories: 20, protein: 1, carbs: 4, fat: 0, serving: '¼ cup' },
      { name: "Dave's Killer Bread (toasted)", calories: 210, protein: 10, carbs: 36, fat: 2, serving: '2 slices' },
      { name: 'Avocado', calories: 60, protein: 1, carbs: 3, fat: 5, serving: '¼ avocado' },
    ],
  },
  wednesday: {
    id: 'breakfast', name: 'Breakfast', time: '7:30 AM',
    items: [
      { name: 'Whey Protein (vanilla)', calories: 130, protein: 25, carbs: 3, fat: 2, serving: '1 scoop' },
      { name: 'Frozen Mixed Berries (blended)', calories: 80, protein: 1, carbs: 19, fat: 0, serving: '1 cup' },
      { name: 'Unsweetened Almond Milk', calories: 30, protein: 1, carbs: 1, fat: 3, serving: '½ cup' },
      { name: 'Old-Fashioned Oats (topping)', calories: 75, protein: 3, carbs: 13, fat: 1, serving: '2 tbsp' },
      { name: 'Ground Flaxseed', calories: 55, protein: 2, carbs: 3, fat: 4, serving: '1 tbsp' },
      { name: 'Walnuts', calories: 65, protein: 2, carbs: 1, fat: 7, serving: '1 tbsp' },
    ],
  },
  thursday: {
    id: 'breakfast', name: 'Breakfast', time: '7:30 AM',
    items: [
      { name: '2% Cottage Cheese', calories: 200, protein: 25, carbs: 8, fat: 5, serving: '1.5 cups' },
      { name: 'Pineapple Chunks or Blueberries', calories: 60, protein: 1, carbs: 15, fat: 0, serving: '½ cup' },
      { name: 'Sliced Almonds', calories: 90, protein: 3, carbs: 3, fat: 8, serving: '2 tbsp' },
      { name: 'Rice Cakes', calories: 70, protein: 2, carbs: 14, fat: 0, serving: '2 cakes' },
      { name: 'Honey drizzle', calories: 21, protein: 0, carbs: 6, fat: 0, serving: '1 tsp' },
    ],
  },
  friday: {
    id: 'breakfast', name: 'Breakfast', time: '7:30 AM',
    items: [
      { name: 'Whole Grain Bagel Thin', calories: 110, protein: 5, carbs: 22, fat: 1, serving: '1 toasted' },
      { name: 'Smoked Salmon (lox)', calories: 100, protein: 16, carbs: 0, fat: 4, serving: '3 oz' },
      { name: 'Light Cream Cheese', calories: 60, protein: 2, carbs: 3, fat: 5, serving: '2 tbsp' },
      { name: 'Capers + Red Onion + Cucumber', calories: 20, protein: 1, carbs: 4, fat: 0, serving: 'garnish' },
      { name: 'Orange (small)', calories: 60, protein: 1, carbs: 15, fat: 0, serving: '1 small' },
    ],
  },
  saturday: {
    id: 'breakfast', name: 'Breakfast', time: '7:30 AM',
    items: [
      { name: 'Whole Eggs', calories: 140, protein: 12, carbs: 0, fat: 10, serving: '2 large' },
      { name: 'Egg Whites', calories: 75, protein: 16, carbs: 1, fat: 0, serving: '3 whites' },
      { name: 'Baby Spinach', calories: 7, protein: 1, carbs: 1, fat: 0, serving: '½ cup' },
      { name: 'Diced Red Bell Pepper', calories: 20, protein: 1, carbs: 5, fat: 0, serving: '¼ cup' },
      { name: 'Pre-Sliced Mushrooms', calories: 10, protein: 1, carbs: 1, fat: 0, serving: '¼ cup' },
      { name: 'Crumbled Feta', calories: 75, protein: 4, carbs: 1, fat: 6, serving: '2 tbsp' },
      { name: 'Fresh Mixed Fruit', calories: 80, protein: 1, carbs: 20, fat: 0, serving: '1 cup' },
    ],
  },
  sunday: {
    id: 'breakfast', name: 'Breakfast', time: '7:30 AM',
    items: [
      { name: 'Kodiak Cakes Power Cakes Mix', calories: 280, protein: 28, carbs: 42, fat: 5, serving: '1 cup mix + water' },
      { name: 'Blueberries (folded in)', calories: 40, protein: 1, carbs: 10, fat: 0, serving: '½ cup' },
      { name: 'Light Maple Syrup', calories: 50, protein: 0, carbs: 13, fat: 0, serving: '1 tbsp' },
      { name: 'Plain Greek Yogurt', calories: 90, protein: 17, carbs: 6, fat: 0, serving: '½ cup, on side' },
    ],
  },
}

// ─── Rotating Lunches ─────────────────────────────────────────────────────────
const LUNCHES: Record<DayOfWeek, SuggestedMeal> = {
  monday: {
    id: 'lunch', name: 'Lunch', time: '12:30 PM',
    items: [
      { name: 'Albacore Tuna (canned, drained)', calories: 200, protein: 44, carbs: 0, fat: 2, serving: '2 cans' },
      { name: 'Avocado (mashed)', calories: 120, protein: 1, carbs: 6, fat: 11, serving: '½ medium' },
      { name: 'Whole Wheat Tortilla', calories: 140, protein: 4, carbs: 26, fat: 3, serving: '1 large' },
      { name: 'Romaine Lettuce', calories: 15, protein: 1, carbs: 3, fat: 0, serving: 'handful' },
      { name: 'Light Mayo + Lemon', calories: 45, protein: 0, carbs: 1, fat: 5, serving: '1 tbsp' },
      { name: 'Baby Carrots (side)', calories: 35, protein: 1, carbs: 8, fat: 0, serving: '½ cup' },
    ],
  },
  tuesday: {
    id: 'lunch', name: 'Lunch', time: '12:30 PM',
    items: [
      { name: 'Sliced Deli Turkey (no nitrates)', calories: 150, protein: 28, carbs: 2, fat: 3, serving: '5 oz' },
      { name: 'Hummus', calories: 130, protein: 6, carbs: 14, fat: 7, serving: '4 tbsp' },
      { name: 'Whole Wheat Pita', calories: 160, protein: 6, carbs: 32, fat: 1, serving: '1 pita' },
      { name: 'Bell Pepper Strips', calories: 25, protein: 1, carbs: 6, fat: 0, serving: '½ cup' },
      { name: 'Cucumber Slices', calories: 15, protein: 1, carbs: 3, fat: 0, serving: '½ cup' },
      { name: 'Cherry Tomatoes', calories: 25, protein: 1, carbs: 5, fat: 0, serving: '½ cup' },
    ],
  },
  wednesday: {
    id: 'lunch', name: 'Lunch', time: '12:30 PM',
    items: [
      { name: 'Canned Chickpeas (drained)', calories: 120, protein: 7, carbs: 22, fat: 2, serving: '1 can (15 oz)' },
      { name: 'Canned Chunk Chicken Breast', calories: 150, protein: 30, carbs: 0, fat: 3, serving: '1 can' },
      { name: 'Pre-Washed Arugula or Romaine', calories: 15, protein: 1, carbs: 2, fat: 0, serving: '2 cups' },
      { name: 'Cherry Tomatoes + Cucumber + Red Onion', calories: 40, protein: 2, carbs: 9, fat: 0, serving: '½ cup each' },
      { name: 'Olive Oil + Lemon Dressing', calories: 160, protein: 0, carbs: 1, fat: 18, serving: '2 tbsp olive oil' },
      { name: 'Crumbled Feta', calories: 75, protein: 4, carbs: 1, fat: 6, serving: '1 oz' },
    ],
  },
  thursday: {
    id: 'lunch', name: 'Lunch', time: '12:30 PM',
    items: [
      { name: 'Canned Sardines in Olive Oil (drained)', calories: 190, protein: 23, carbs: 0, fat: 11, serving: '1 can' },
      { name: 'Whole Grain Bread (toasted)', calories: 160, protein: 8, carbs: 28, fat: 2, serving: '2 slices' },
      { name: 'Avocado (mashed)', calories: 120, protein: 1, carbs: 6, fat: 11, serving: '½ medium' },
      { name: 'Lemon Juice + Red Pepper Flakes', calories: 5, protein: 0, carbs: 2, fat: 0, serving: 'to taste' },
      { name: 'Mixed Greens (side)', calories: 20, protein: 2, carbs: 3, fat: 0, serving: '1 cup' },
    ],
  },
  friday: {
    id: 'lunch', name: 'Lunch', time: '12:30 PM',
    items: [
      { name: 'Canned Chunk Chicken Breast', calories: 150, protein: 30, carbs: 0, fat: 3, serving: '1 can' },
      { name: 'Canned Black Beans (drained)', calories: 110, protein: 7, carbs: 20, fat: 1, serving: '½ cup' },
      { name: "Ben's Original Brown Rice Cup", calories: 210, protein: 5, carbs: 44, fat: 2, serving: '1 cup (microwaved)' },
      { name: 'Avocado', calories: 60, protein: 1, carbs: 3, fat: 5, serving: '¼ medium' },
      { name: 'Salsa + Lime + Cilantro', calories: 25, protein: 1, carbs: 5, fat: 0, serving: '¼ cup salsa' },
    ],
  },
  saturday: {
    id: 'lunch', name: 'Lunch', time: '12:30 PM',
    items: [
      { name: 'Rotisserie Chicken Breast (skin off)', calories: 280, protein: 52, carbs: 0, fat: 6, serving: '6 oz' },
      { name: 'Seeds of Change Quinoa Cup', calories: 220, protein: 8, carbs: 39, fat: 4, serving: '1 cup (microwaved)' },
      { name: 'Diced Cucumber + Cherry Tomatoes + Red Onion', calories: 40, protein: 2, carbs: 9, fat: 0, serving: '½ cup each' },
      { name: 'Hummus', calories: 65, protein: 3, carbs: 7, fat: 4, serving: '2 tbsp' },
      { name: 'Kalamata Olives + Lemon + Olive Oil drizzle', calories: 70, protein: 0, carbs: 2, fat: 7, serving: '5–6 olives + 1 tsp oil' },
    ],
  },
  sunday: {
    id: 'lunch', name: 'Lunch', time: '12:30 PM',
    items: [
      { name: 'Pre-Cooked Frozen Shrimp (thawed)', calories: 170, protein: 33, carbs: 1, fat: 2, serving: '6 oz' },
      { name: 'Avocado (diced)', calories: 120, protein: 1, carbs: 6, fat: 11, serving: '½ medium' },
      { name: 'Salsa Verde or Pico de Gallo', calories: 30, protein: 1, carbs: 7, fat: 0, serving: '¼ cup' },
      { name: 'Butter Lettuce Cups', calories: 10, protein: 1, carbs: 2, fat: 0, serving: '4–5 leaves' },
      { name: 'Lime Juice + Cilantro', calories: 5, protein: 0, carbs: 2, fat: 0, serving: 'to taste' },
      { name: 'Tortilla Chips', calories: 130, protein: 2, carbs: 18, fat: 6, serving: '1 oz' },
    ],
  },
}

// ─── Rotating Snacks ──────────────────────────────────────────────────────────
const SNACKS: Record<DayOfWeek, SuggestedMeal> = {
  monday: {
    id: 'snack', name: 'Snack', time: '3:30 PM',
    items: [
      { name: 'Greek Yogurt (plain)', calories: 90, protein: 17, carbs: 6, fat: 0, serving: '½ cup' },
      { name: 'Banana', calories: 90, protein: 1, carbs: 23, fat: 0, serving: '1 medium' },
      { name: 'Electrolytes', calories: 10, protein: 0, carbs: 2, fat: 0, serving: 'per label' },
    ],
  },
  tuesday: {
    id: 'snack', name: 'Snack', time: '3:30 PM',
    items: [
      { name: 'Mixed Walnuts & Almonds', calories: 180, protein: 5, carbs: 6, fat: 16, serving: '1 oz mixed' },
    ],
  },
  wednesday: {
    id: 'snack', name: 'Snack', time: '3:30 PM',
    items: [
      { name: 'Greek Yogurt (plain)', calories: 90, protein: 17, carbs: 6, fat: 0, serving: '½ cup' },
      { name: 'Banana', calories: 90, protein: 1, carbs: 23, fat: 0, serving: '1 medium' },
      { name: 'Electrolytes', calories: 10, protein: 0, carbs: 2, fat: 0, serving: 'per label' },
    ],
  },
  thursday: {
    id: 'snack', name: 'Snack', time: '3:30 PM',
    items: [
      { name: 'Hard-Boiled Egg', calories: 70, protein: 6, carbs: 0, fat: 5, serving: '1 egg' },
      { name: 'String Cheese', calories: 80, protein: 8, carbs: 1, fat: 5, serving: '1 stick' },
    ],
  },
  friday: {
    id: 'snack', name: 'Snack', time: '3:30 PM',
    items: [
      { name: 'Edamame', calories: 120, protein: 11, carbs: 9, fat: 5, serving: '1 cup in-shell' },
    ],
  },
  saturday: {
    id: 'snack', name: 'Snack', time: '3:30 PM',
    items: [
      { name: 'Apple', calories: 80, protein: 0, carbs: 21, fat: 0, serving: '1 medium' },
      { name: 'Almond Butter', calories: 100, protein: 3, carbs: 3, fat: 9, serving: '1 tbsp' },
    ],
  },
  sunday: {
    id: 'snack', name: 'Snack', time: '3:30 PM',
    items: [
      { name: 'Greek Yogurt (plain)', calories: 90, protein: 17, carbs: 6, fat: 0, serving: '½ cup' },
      { name: 'Mixed Berries', calories: 50, protein: 1, carbs: 12, fat: 0, serving: '½ cup' },
    ],
  },
}

// ─── Rotating Dinners ─────────────────────────────────────────────────────────
const DINNERS: Record<DayOfWeek, SuggestedMeal> = {
  monday: {
    id: 'dinner', name: 'Dinner', time: '6:00 PM',
    items: [
      { name: 'Rotisserie Chicken Breast (skin off)', calories: 280, protein: 52, carbs: 0, fat: 6, serving: '6 oz' },
      { name: "Ben's Original Brown Rice Cup", calories: 210, protein: 5, carbs: 44, fat: 2, serving: '1 cup (microwaved)' },
      { name: 'Frozen Broccoli (microwaved)', calories: 75, protein: 6, carbs: 14, fat: 1, serving: '1.5 cups' },
      { name: 'Olive Oil + Garlic Powder + Lemon', calories: 120, protein: 0, carbs: 1, fat: 14, serving: '1 tbsp olive oil' },
    ],
  },
  tuesday: {
    id: 'dinner', name: 'Dinner', time: '6:00 PM',
    items: [
      { name: 'Canned Wild-Caught Salmon (drained)', calories: 220, protein: 38, carbs: 0, fat: 8, serving: '2 cans' },
      { name: 'Seeds of Change Quinoa Cup', calories: 220, protein: 8, carbs: 39, fat: 4, serving: '1 cup (microwaved)' },
      { name: 'Frozen Green Beans (microwaved)', calories: 60, protein: 4, carbs: 13, fat: 0, serving: '1.5 cups' },
      { name: 'Olive Oil + Lemon + Capers', calories: 130, protein: 0, carbs: 1, fat: 14, serving: '1 tbsp oil + garnish' },
    ],
  },
  wednesday: {
    id: 'dinner', name: 'Dinner', time: '6:00 PM',
    items: [
      { name: 'Pre-Cooked Frozen Shrimp (thawed)', calories: 170, protein: 33, carbs: 1, fat: 2, serving: '6 oz' },
      { name: 'Microwave Stir-Fry Veggie Mix', calories: 80, protein: 4, carbs: 16, fat: 0, serving: '1 bag' },
      { name: "Ben's Original Brown Rice Cup", calories: 210, protein: 5, carbs: 44, fat: 2, serving: '1 cup' },
      { name: 'Low-Sodium Teriyaki Sauce', calories: 60, protein: 1, carbs: 14, fat: 0, serving: '2 tbsp' },
    ],
  },
  thursday: {
    id: 'dinner', name: 'Dinner', time: '6:00 PM',
    items: [
      { name: 'Pre-Packaged Caesar Salad Kit', calories: 180, protein: 4, carbs: 12, fat: 14, serving: '1 large serving' },
      { name: 'Rotisserie Chicken (added to salad)', calories: 230, protein: 43, carbs: 0, fat: 5, serving: '5 oz' },
      { name: "Amy's Lentil Soup (canned)", calories: 180, protein: 11, carbs: 30, fat: 3, serving: '1 cup' },
    ],
  },
  friday: {
    id: 'dinner', name: 'Dinner', time: '6:00 PM',
    items: [
      { name: 'Turkey Meatballs (pre-made)', calories: 250, protein: 28, carbs: 8, fat: 12, serving: '5–6 meatballs' },
      { name: 'Whole Grain Sub Roll', calories: 200, protein: 8, carbs: 38, fat: 3, serving: '1 roll' },
      { name: 'Low-Sodium Marinara Sauce', calories: 70, protein: 3, carbs: 14, fat: 1, serving: '½ cup' },
      { name: 'Pre-Bagged Italian Salad Kit', calories: 100, protein: 3, carbs: 8, fat: 7, serving: '1 serving' },
    ],
  },
  saturday: {
    id: 'dinner', name: 'Dinner', time: '6:00 PM',
    items: [
      { name: 'Canned Wild Salmon (formed into patties)', calories: 220, protein: 38, carbs: 0, fat: 8, serving: '2 cans' },
      { name: 'Egg (binder for patties)', calories: 70, protein: 6, carbs: 0, fat: 5, serving: '1 egg' },
      { name: 'Sweet Potato (microwaved)', calories: 130, protein: 3, carbs: 30, fat: 0, serving: '1 medium' },
      { name: 'Pre-Bagged Caesar Salad Kit', calories: 150, protein: 4, carbs: 10, fat: 11, serving: '1 serving' },
    ],
  },
  sunday: {
    id: 'dinner', name: 'Dinner', time: '6:00 PM',
    items: [
      { name: '93/7 Ground Turkey', calories: 230, protein: 35, carbs: 0, fat: 9, serving: '6 oz (browned)' },
      { name: 'Canned Black Beans (drained)', calories: 110, protein: 7, carbs: 20, fat: 1, serving: '½ cup' },
      { name: 'Shredded Romaine', calories: 15, protein: 1, carbs: 3, fat: 0, serving: '1 cup' },
      { name: 'Salsa + Lime', calories: 25, protein: 1, carbs: 5, fat: 0, serving: '¼ cup salsa' },
      { name: 'Mexican Blend Cheese', calories: 110, protein: 7, carbs: 1, fat: 9, serving: '1 oz' },
      { name: 'Small Corn Tortillas', calories: 120, protein: 3, carbs: 24, fat: 2, serving: '2 tortillas' },
    ],
  },
}

export function getMealsForDay(day: DayOfWeek): SuggestedMeal[] {
  return [BREAKFASTS[day], LUNCHES[day], SNACKS[day], DINNERS[day]]
}

export function getMealTotals(meal: SuggestedMeal) {
  return meal.items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}
