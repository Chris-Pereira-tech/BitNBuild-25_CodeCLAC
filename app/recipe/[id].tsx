
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Button from '../../components/Button';
import { generateRecipe } from '../../data/mockData';
import NutritionChart from '../../components/NutritionChart';
import { colors, commonStyles } from '../../styles/commonStyles';
import Icon from '../../components/Icon';
import { Recipe } from '../../types/Recipe';

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy':
      return colors.success;
    case 'Medium':
      return colors.warning;
    case 'Hard':
      return colors.error;
    default:
      return colors.grey;
  }
};

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams();
  console.log('Recipe detail params:', params);

  let recipe: Recipe;

  try {
    // Try to parse the recipe data if it was passed directly
    if (params.recipeData && typeof params.recipeData === 'string') {
      recipe = JSON.parse(params.recipeData);
      console.log('Using passed recipe data:', recipe.title);
    } else {
      // Fallback to generating a new recipe (for backward compatibility)
      const ingredients = typeof params.ingredients === 'string' 
        ? params.ingredients.split(',') 
        : ['chicken', 'rice'];
      const style = typeof params.style === 'string' ? params.style : 'Mediterranean';
      
      console.log('Generating fallback recipe with:', { ingredients, style });
      
      // Note: This is now async, but we'll use a synchronous fallback for the UI
      // In a real app, you'd want to handle this with proper loading states
      recipe = {
        id: `recipe-${Date.now()}`,
        title: `${style} ${ingredients[0]} Recipe`,
        ingredients: ingredients.map((ingredient, index) => ({
          id: `ing-${index}`,
          name: ingredient.trim(),
          quantity: 1,
          unit: 'cup',
          preparation: ''
        })),
        instructions: [
          'Prepare all ingredients according to the recipe requirements.',
          'Follow the cooking method appropriate for your chosen style.',
          'Season to taste and serve when ready.'
        ],
        prepTime: 15,
        cookTime: 30,
        servings: 4,
        difficulty: 'Medium' as const,
        cuisine: style,
        dietaryTags: [style.toLowerCase()],
        nutrition: {
          calories: 350,
          protein: 25,
          carbs: 30,
          fat: 12,
          fiber: 5,
          sugar: 8
        },
        image: `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop`
      };
    }
  } catch (error) {
    console.error('Error parsing recipe data:', error);
    
    // Ultimate fallback recipe
    recipe = {
      id: 'fallback-recipe',
      title: 'Simple Recipe',
      ingredients: [
        { id: 'ing-1', name: 'Main ingredient', quantity: 1, unit: 'cup', preparation: '' }
      ],
      instructions: ['Prepare and cook as desired.'],
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      difficulty: 'Easy' as const,
      cuisine: 'General',
      dietaryTags: ['general'],
      nutrition: {
        calories: 300,
        protein: 20,
        carbs: 25,
        fat: 10,
        fiber: 4,
        sugar: 6
      },
      image: `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop`
    };
  }

  const handleBack = () => {
    console.log('Navigating back to home');
    router.back();
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Details</Text>
          <View style={styles.placeholder} />
        </View>

        {recipe.image && (
          <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
        )}

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Icon name="time-outline" size={16} color={colors.grey} />
                <Text style={styles.metaText}>
                  {recipe.prepTime + recipe.cookTime} min
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="people-outline" size={16} color={colors.grey} />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
                <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
              </View>
            </View>
          </View>

          <View style={styles.timingSection}>
            <View style={styles.timingItem}>
              <Icon name="hourglass-outline" size={20} color={colors.accent} />
              <Text style={styles.timingLabel}>Prep Time</Text>
              <Text style={styles.timingValue}>{recipe.prepTime} min</Text>
            </View>
            <View style={styles.timingItem}>
              <Icon name="flame-outline" size={20} color={colors.accent} />
              <Text style={styles.timingLabel}>Cook Time</Text>
              <Text style={styles.timingValue}>{recipe.cookTime} min</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ingredient) => (
                <View key={ingredient.id} style={styles.ingredientItem}>
                  <View style={styles.ingredientBullet} />
                  <Text style={styles.ingredientText}>
                    {ingredient.quantity} {ingredient.unit} {ingredient.name}
                    {ingredient.preparation ? `, ${ingredient.preparation}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.instructionsList}>
              {recipe.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition Information</Text>
            <NutritionChart nutrition={recipe.nutrition} />
          </View>

          <View style={styles.cuisineSection}>
            <Text style={styles.cuisineLabel}>Cuisine Style</Text>
            <Text style={styles.cuisineValue}>{recipe.cuisine}</Text>
            {recipe.dietaryTags.length > 0 && (
              <View style={styles.tagsContainer}>
                {recipe.dietaryTags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.aiNotice}>
            <Icon name="sparkles" size={20} color={colors.accent} />
            <Text style={styles.aiNoticeText}>
              This recipe was generated using Google Gemini AI
            </Text>
          </View>

          <Button
            text="Generate Another Recipe"
            onPress={handleBack}
            style={styles.generateButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  recipeImage: {
    width: '100%',
    height: 250,
    backgroundColor: colors.backgroundAlt,
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    lineHeight: 34,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: colors.grey,
    marginLeft: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  timingSection: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  timingItem: {
    flex: 1,
    alignItems: 'center',
  },
  timingLabel: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 4,
  },
  timingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  ingredientsList: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 8,
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  instructionsList: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  instructionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  cuisineSection: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  cuisineLabel: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 4,
  },
  cuisineValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.background,
  },
  aiNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  aiNoticeText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  generateButton: {
    backgroundColor: colors.primary,
    marginBottom: 20,
  },
});
