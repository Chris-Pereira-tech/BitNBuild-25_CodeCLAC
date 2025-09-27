
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe, Ingredient, NutritionInfo } from '../types/Recipe';

// Note: In a production app, you should store the API key securely
// For now, we'll use a placeholder that users need to replace
const API_KEY = 'AIzaSyBIx8LlGYHWQtvMjINoSzsdvIhQ1uAT8ww';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (API_KEY && API_KEY !== 'AIzaSyBIx8LlGYHWQtvMjINoSzsdvIhQ1uAT8ww') {
      this.genAI = new GoogleGenerativeAI(API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  private isConfigured(): boolean {
    return this.genAI !== null && this.model !== null;
  }

  async generateRecipe(ingredients: string[], dietaryStyle: string): Promise<Recipe> {
    console.log('Generating recipe with Gemini:', { ingredients, dietaryStyle });

    if (!this.isConfigured()) {
      console.log('Gemini not configured, using fallback recipe generation');
      return this.generateFallbackRecipe(ingredients, dietaryStyle);
    }

    try {
      const prompt = this.createRecipePrompt(ingredients, dietaryStyle);
      console.log('Sending prompt to Gemini:', prompt);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('Gemini response received:', text.substring(0, 200) + '...');

      return this.parseGeminiResponse(text, ingredients, dietaryStyle);
    } catch (error) {
      console.error('Error generating recipe with Gemini:', error);
      console.log('Falling back to mock recipe generation');
      return this.generateFallbackRecipe(ingredients, dietaryStyle);
    }
  }

  private createRecipePrompt(ingredients: string[], dietaryStyle: string): string {
    const ingredientsList = ingredients.join(', ');
    
    return `Create a detailed ${dietaryStyle} recipe using these ingredients: ${ingredientsList}.

Please provide the response in the following JSON format:
{
  "title": "Recipe name",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": number,
      "unit": "measurement unit",
      "preparation": "preparation method (optional)"
    }
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction",
    "etc."
  ],
  "prepTime": number_in_minutes,
  "cookTime": number_in_minutes,
  "servings": number_of_servings,
  "difficulty": "Easy|Medium|Hard",
  "cuisine": "${dietaryStyle}",
  "nutrition": {
    "calories": estimated_calories_per_serving,
    "protein": protein_grams,
    "carbs": carbs_grams,
    "fat": fat_grams,
    "fiber": fiber_grams,
    "sugar": sugar_grams
  }
}

Make sure the recipe is practical, delicious, and follows ${dietaryStyle} cooking principles. Include all the provided ingredients in a meaningful way.`;
  }

  private parseGeminiResponse(text: string, ingredients: string[], dietaryStyle: string): Recipe {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const jsonText = jsonMatch[0];
      const parsedData = JSON.parse(jsonText);

      // Convert the parsed data to our Recipe format
      const recipeIngredients: Ingredient[] = parsedData.ingredients.map((ing: any, index: number) => ({
        id: `ing-${index}`,
        name: ing.name,
        quantity: ing.quantity || 1,
        unit: ing.unit || 'piece',
        preparation: ing.preparation || ''
      }));

      const nutrition: NutritionInfo = {
        calories: parsedData.nutrition?.calories || 300,
        protein: parsedData.nutrition?.protein || 15,
        carbs: parsedData.nutrition?.carbs || 30,
        fat: parsedData.nutrition?.fat || 10,
        fiber: parsedData.nutrition?.fiber || 5,
        sugar: parsedData.nutrition?.sugar || 8
      };

      return {
        id: `recipe-${Date.now()}`,
        title: parsedData.title || `${dietaryStyle} ${ingredients[0]} Recipe`,
        ingredients: recipeIngredients,
        instructions: parsedData.instructions || ['Prepare ingredients', 'Cook as desired', 'Serve hot'],
        prepTime: parsedData.prepTime || 15,
        cookTime: parsedData.cookTime || 30,
        servings: parsedData.servings || 4,
        difficulty: parsedData.difficulty || 'Medium',
        cuisine: parsedData.cuisine || dietaryStyle,
        dietaryTags: [dietaryStyle.toLowerCase()],
        nutrition,
        image: `https://images.unsplash.com/photo-${1565299624946 + Math.floor(Math.random() * 1000)}-${Math.random().toString(36).substring(7)}?w=400&h=300&fit=crop`
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.log('Using fallback recipe generation');
      return this.generateFallbackRecipe(ingredients, dietaryStyle);
    }
  }

  private generateFallbackRecipe(ingredients: string[], dietaryStyle: string): Recipe {
    console.log('Generating fallback recipe');
    
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
}

export const geminiService = new GeminiService();
