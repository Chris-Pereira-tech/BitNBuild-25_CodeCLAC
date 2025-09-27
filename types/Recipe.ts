
export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  preparation?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  dietaryTags: string[];
  nutrition: NutritionInfo;
  image?: string;
}

export interface DietaryStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
}
