
import { Recipe, DietaryStyle, Ingredient, NutritionInfo } from '../types/Recipe';
import { geminiService } from '../services/geminiService';

export const dietaryStyles: DietaryStyle[] = [
  {
    id: '1',
    name: 'Mediterranean',
    description: 'Fresh, healthy ingredients with olive oil and herbs',
    icon: '🫒'
  },
  {
    id: '2',
    name: 'Asian Fusion',
    description: 'Bold flavors with soy, ginger, and spices',
    icon: '🥢'
  },
  {
    id: '3',
    name: 'Italian',
    description: 'Classic Italian with pasta, tomatoes, and cheese',
    icon: '🍝'
  },
  {
    id: '4',
    name: 'Mexican',
    description: 'Spicy and vibrant with peppers and lime',
    icon: '🌶️'
  },
  {
    id: '5',
    name: 'Vegetarian',
    description: 'Plant-based ingredients only',
    icon: '🥬'
  },
  {
    id: '6',
    name: 'Keto',
    description: 'Low-carb, high-fat recipes',
    icon: '🥑'
  }
];

export const commonIngredients: string[] = [
  'Chicken breast', 'Salmon', 'Ground beef', 'Eggs', 'Tofu',
  'Rice', 'Pasta', 'Quinoa', 'Bread', 'Potatoes',
  'Tomatoes', 'Onions', 'Garlic', 'Bell peppers', 'Spinach',
  'Broccoli', 'Carrots', 'Mushrooms', 'Avocado', 'Lemon',
  'Olive oil', 'Butter', 'Cheese', 'Milk', 'Yogurt',
  'Salt', 'Black pepper', 'Basil', 'Oregano', 'Paprika'
];

// Recipe generation function using Gemini AI
export const generateRecipe = async (ingredients: string[], dietaryStyle: string): Promise<Recipe> => {
  console.log('Generating recipe with ingredients:', ingredients, 'and style:', dietaryStyle);
  
  try {
    const recipe = await geminiService.generateRecipe(ingredients, dietaryStyle);
    console.log('Recipe generated successfully:', recipe.title);
    return recipe;
  } catch (error) {
    console.error('Error in generateRecipe:', error);
    
    // Fallback to mock generation if Gemini fails
    const recipeIngredients: Ingredient[] = ingredients.map((ingredient, index) => ({
      id: `ing-${index}`,
      name: ingredient,
      quantity: Math.floor(Math.random() * 3) + 1,
      unit: ['cup', 'tbsp', 'tsp', 'oz', 'lb', 'piece'][Math.floor(Math.random() * 6)],
      preparation: ['diced', 'chopped', 'sliced', 'minced', ''][Math.floor(Math.random() * 5)]
    }));

    const instructions = [
      'Preheat your cooking surface or oven to the appropriate temperature.',
      'Prepare all ingredients by washing, chopping, and measuring as needed.',
      'Heat oil in a large pan or pot over medium heat.',
      'Add aromatics like onions and garlic, cook until fragrant.',
      'Add main ingredients and cook according to their requirements.',
      'Season with salt, pepper, and other spices to taste.',
      'Continue cooking until ingredients are properly cooked through.',
      'Adjust seasoning and serve hot.'
    ];

    const nutrition: NutritionInfo = {
      calories: Math.floor(Math.random() * 400) + 200,
      protein: Math.floor(Math.random() * 30) + 10,
      carbs: Math.floor(Math.random() * 50) + 15,
      fat: Math.floor(Math.random() * 20) + 5,
      fiber: Math.floor(Math.random() * 10) + 2,
      sugar: Math.floor(Math.random() * 15) + 3
    };

    return {
      id: `recipe-${Date.now()}`,
      title: `${dietaryStyle} ${ingredients[0]} Delight`,
      ingredients: recipeIngredients,
      instructions,
      prepTime: Math.floor(Math.random() * 20) + 10,
      cookTime: Math.floor(Math.random() * 40) + 15,
      servings: Math.floor(Math.random() * 4) + 2,
      difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)] as 'Easy' | 'Medium' | 'Hard',
      cuisine: dietaryStyle,
      dietaryTags: [dietaryStyle.toLowerCase()],
      nutrition,
      image: `https://images.unsplash.com/photo-${1565299624946 + Math.floor(Math.random() * 1000)}-${Math.random().toString(36).substring(7)}?w=400&h=300&fit=crop`
    };
  }
};
