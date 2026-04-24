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

// ─── Fixed meals (same every day) ────────────────────────────────────────────

const BREAKFAST: SuggestedMeal = {
  id: 'breakfast',
  name: 'Breakfast',
  time: '7:30 AM',
  items: [
    { name: 'Non-fat Greek Yogurt', calories: 130, protein: 22, carbs: 9, fat: 0, serving: '1 cup' },
    { name: 'Mixed Berries', calories: 85, protein: 1, carbs: 21, fat: 0, serving: '1 cup' },
    { name: 'Granola', calories: 300, protein: 7, carbs: 45, fat: 6, serving: '½ cup' },
  ],
}

const LUNCH: SuggestedMeal = {
  id: 'lunch',
  name: 'Lunch',
  time: '12:30 PM',
  items: [
    { name: 'Cooked Quinoa', calories: 220, protein: 8, carbs: 39, fat: 4, serving: '1 cup' },
    { name: 'Grilled Chicken Breast', calories: 280, protein: 52, carbs: 0, fat: 6, serving: '6 oz' },
    { name: 'Olive Oil', calories: 120, protein: 0, carbs: 0, fat: 14, serving: '1 tbsp' },
  ],
}

const SNACK: SuggestedMeal = {
  id: 'snack',
  name: 'Snack',
  time: '3:30 PM',
  items: [
    { name: 'Hummus', calories: 75, protein: 3, carbs: 8, fat: 4, serving: '3 tbsp' },
    { name: 'Raw Carrots', calories: 52, protein: 1, carbs: 12, fat: 0, serving: '1 cup' },
  ],
}

// ─── Rotating dinners ─────────────────────────────────────────────────────────

const DINNERS: Record<DayOfWeek, SuggestedMeal> = {
  monday: {
    id: 'dinner',
    name: 'Dinner',
    time: '7:00 PM',
    items: [
      { name: 'Red Lentil Soup', calories: 230, protein: 14, carbs: 36, fat: 3, serving: '1.5 cups' },
      { name: 'Roasted Carrots', calories: 80, protein: 2, carbs: 18, fat: 3, serving: '1 cup' },
      { name: 'Mixed Greens Salad', calories: 25, protein: 2, carbs: 4, fat: 0, serving: '2 cups' },
      { name: 'Olive Oil & Lemon Dressing', calories: 80, protein: 0, carbs: 1, fat: 9, serving: '2 tsp' },
    ],
  },
  tuesday: {
    id: 'dinner',
    name: 'Dinner',
    time: '7:00 PM',
    items: [
      { name: 'Grilled Chicken Breast', calories: 230, protein: 43, carbs: 0, fat: 5, serving: '5 oz' },
      { name: 'Big Mixed Salad', calories: 40, protein: 3, carbs: 7, fat: 0, serving: '3 cups' },
      { name: 'Hummus', calories: 100, protein: 4, carbs: 11, fat: 5, serving: '4 tbsp' },
      { name: 'Olive Oil Dressing', calories: 60, protein: 0, carbs: 0, fat: 7, serving: '1.5 tsp' },
    ],
  },
  wednesday: {
    id: 'dinner',
    name: 'Dinner',
    time: '7:00 PM',
    items: [
      { name: 'Green Lentils', calories: 200, protein: 15, carbs: 34, fat: 1, serving: '¾ cup cooked' },
      { name: 'Cooked Quinoa', calories: 150, protein: 6, carbs: 27, fat: 2, serving: '⅔ cup' },
      { name: 'Roasted Carrots', calories: 80, protein: 2, carbs: 18, fat: 3, serving: '1 cup' },
    ],
  },
  thursday: {
    id: 'dinner',
    name: 'Dinner',
    time: '7:00 PM',
    items: [
      { name: 'Grilled Chicken Breast', calories: 230, protein: 43, carbs: 0, fat: 5, serving: '5 oz' },
      { name: 'Mixed Greens Salad', calories: 30, protein: 2, carbs: 5, fat: 0, serving: '2.5 cups' },
      { name: 'Roasted Carrots', calories: 80, protein: 2, carbs: 18, fat: 3, serving: '1 cup' },
      { name: 'Olive Oil Dressing', calories: 80, protein: 0, carbs: 0, fat: 9, serving: '2 tsp' },
    ],
  },
  friday: {
    id: 'dinner',
    name: 'Dinner',
    time: '7:00 PM',
    items: [
      { name: 'Lentil & Spinach Stew', calories: 260, protein: 16, carbs: 40, fat: 4, serving: '1.5 cups' },
      { name: 'Cooked Quinoa', calories: 150, protein: 6, carbs: 27, fat: 2, serving: '⅔ cup' },
      { name: 'Hummus', calories: 75, protein: 3, carbs: 8, fat: 4, serving: '3 tbsp' },
    ],
  },
  saturday: {
    id: 'dinner',
    name: 'Dinner',
    time: '7:00 PM',
    items: [
      { name: 'Grilled Chicken Breast', calories: 280, protein: 52, carbs: 0, fat: 6, serving: '6 oz' },
      { name: 'Cooked Quinoa', calories: 150, protein: 6, carbs: 27, fat: 2, serving: '⅔ cup' },
      { name: 'Big Mixed Salad', calories: 40, protein: 3, carbs: 7, fat: 0, serving: '3 cups' },
      { name: 'Olive Oil & Lemon', calories: 60, protein: 0, carbs: 1, fat: 7, serving: '1.5 tsp oil' },
    ],
  },
  sunday: {
    id: 'dinner',
    name: 'Dinner',
    time: '7:00 PM',
    items: [
      { name: 'Grilled Chicken Breast', calories: 230, protein: 43, carbs: 0, fat: 5, serving: '5 oz' },
      { name: 'Green Lentils', calories: 160, protein: 12, carbs: 27, fat: 1, serving: '⅔ cup cooked' },
      { name: 'Roasted Carrots', calories: 80, protein: 2, carbs: 18, fat: 3, serving: '1 cup' },
    ],
  },
}

export function getMealsForDay(day: DayOfWeek): SuggestedMeal[] {
  return [BREAKFAST, LUNCH, SNACK, DINNERS[day]]
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

// ─── Weekly shopping list ─────────────────────────────────────────────────────

export interface ShoppingItem {
  category: string
  name: string
  quantity: string
  note?: string
}

export const WEEKLY_SHOPPING_LIST: ShoppingItem[] = [
  // Protein
  { category: 'Protein', name: 'Chicken Breast', quantity: '3.5 lbs', note: 'Grill/batch cook Sunday' },
  { category: 'Protein', name: 'Non-fat Greek Yogurt', quantity: '7 cups (large tub)', note: 'Or 7 individual cups' },
  // Grains & Legumes
  { category: 'Grains & Legumes', name: 'Quinoa', quantity: '2 cups dry', note: 'Cook 4 cups at start of week' },
  { category: 'Grains & Legumes', name: 'Red Lentils', quantity: '1 cup dry', note: 'For lentil soup (Monday)' },
  { category: 'Grains & Legumes', name: 'Green Lentils', quantity: '1.5 cups dry', note: 'Wed, Fri, Sun dinners' },
  { category: 'Grains & Legumes', name: 'Granola', quantity: '1 bag (≈ 3.5 cups)', note: '½ cup per day' },
  // Produce
  { category: 'Produce', name: 'Mixed Berries', quantity: '2 lbs', note: 'Fresh or frozen — 1 cup/day' },
  { category: 'Produce', name: 'Carrots', quantity: '3 lbs', note: 'Snack + roasted in dinners' },
  { category: 'Produce', name: 'Mixed Salad Greens', quantity: '3 bags (5 oz each)', note: 'Tue, Thu, Sat, Sun' },
  { category: 'Produce', name: 'Baby Spinach', quantity: '1 bag (5 oz)', note: 'Lentil stew (Friday)' },
  { category: 'Produce', name: 'Cherry Tomatoes', quantity: '1 pint', note: 'For salads' },
  { category: 'Produce', name: 'Cucumber', quantity: '2 medium', note: 'For salads' },
  { category: 'Produce', name: 'Lemons', quantity: '4', note: 'Dressings + flavor' },
  // Pantry
  { category: 'Pantry', name: 'Hummus', quantity: '2 containers (10 oz each)', note: 'Snack + dinner' },
  { category: 'Pantry', name: 'Olive Oil', quantity: '1 bottle', note: 'If running low' },
  { category: 'Pantry', name: 'Canned Diced Tomatoes', quantity: '2 cans (14.5 oz)', note: 'For lentil soup + stew' },
  { category: 'Pantry', name: 'Vegetable Broth', quantity: '1 carton (32 oz)', note: 'For soups' },
]

export const SHOPPING_CATEGORIES = ['Protein', 'Grains & Legumes', 'Produce', 'Pantry']

export const MEAL_PREP_TIPS = [
  'Sunday: Grill 3.5 lbs chicken breast — portion into 5 oz containers for Mon–Fri lunches + dinners',
  'Sunday: Cook 2 cups dry quinoa — yields ~6 cups cooked for the week',
  'Monday: Make a big batch of red lentil soup — lunch leftovers too',
  'Wash and portion salad greens into containers at the start of the week',
]
