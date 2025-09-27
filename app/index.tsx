
import React, { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { commonStyles, colors } from '../styles/commonStyles';
import SimpleBottomSheet from '../components/BottomSheet';
import IngredientInput from '../components/IngredientInput';
import DietaryStyleSelector from '../components/DietaryStyleSelector';
import ImageIngredientRecognition from '../components/ImageIngredientRecognition';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { generateRecipe } from '../data/mockData';

export default function GourmetNetHome() {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedDietaryStyle, setSelectedDietaryStyle] = useState<string>('Mediterranean');
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [isImageRecognitionVisible, setIsImageRecognitionVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  console.log('GourmetNet Home loaded');

  const handleGenerateRecipe = async () => {
    if (selectedIngredients.length === 0) {
      Alert.alert('Missing Ingredients', 'Please add at least one ingredient to generate a recipe.');
      return;
    }

    console.log('Generating recipe with:', { selectedIngredients, selectedDietaryStyle });
    setIsGenerating(true);

    try {
      // Generate recipe using Gemini AI
      const recipe = await generateRecipe(selectedIngredients, selectedDietaryStyle);
      console.log('Recipe generated:', recipe.title);
      
      setIsGenerating(false);
      
      // Navigate to recipe detail with the generated recipe data
      const ingredientsParam = selectedIngredients.join(',');
      router.push({
        pathname: '/recipe/[id]',
        params: {
          id: recipe.id,
          ingredients: ingredientsParam,
          style: selectedDietaryStyle,
          recipeData: JSON.stringify(recipe)
        }
      });
    } catch (error) {
      console.error('Error generating recipe:', error);
      setIsGenerating(false);
      
      Alert.alert(
        'Recipe Generation Failed',
        'There was an error generating your recipe. Please try again or check your internet connection.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleImageInput = () => {
    console.log('Opening image recognition');
    setIsImageRecognitionVisible(true);
  };

  const handleIngredientsRecognized = (recognizedIngredients: string[]) => {
    console.log('Adding recognized ingredients:', recognizedIngredients);
    
    // Merge with existing ingredients, avoiding duplicates
    const newIngredients = [...selectedIngredients];
    recognizedIngredients.forEach(ingredient => {
      if (!newIngredients.includes(ingredient)) {
        newIngredients.push(ingredient);
      }
    });
    
    setSelectedIngredients(newIngredients);
    setIsImageRecognitionVisible(false);
    
    Alert.alert(
      'Ingredients Added!',
      `Successfully recognized and added ${recognizedIngredients.length} ingredients.`,
      [{ text: 'OK' }]
    );
  };

  const handleOpenSettings = () => {
    console.log('Opening settings bottom sheet');
    setIsBottomSheetVisible(true);
  };

  const SettingsContent = () => (
    <View style={styles.settingsContent}>
      <Text style={styles.settingsTitle}>GourmetNet Settings</Text>
      
      <View style={styles.settingItem}>
        <Icon name="information-circle-outline" size={24} color={colors.accent} />
        <View style={styles.settingText}>
          <Text style={styles.settingLabel}>About GourmetNet</Text>
          <Text style={styles.settingDescription}>
            AI-powered recipe generation using Google Gemini
          </Text>
        </View>
      </View>

      <View style={styles.settingItem}>
        <Icon name="sparkles-outline" size={24} color={colors.accent} />
        <View style={styles.settingText}>
          <Text style={styles.settingLabel}>Gemini AI Integration</Text>
          <Text style={styles.settingDescription}>
            Advanced recipe generation with Google&apos;s Gemini AI model
          </Text>
        </View>
      </View>

      <View style={styles.settingItem}>
        <Icon name="camera-outline" size={24} color={colors.accent} />
        <View style={styles.settingText}>
          <Text style={styles.settingLabel}>Image Recognition</Text>
          <Text style={styles.settingDescription}>
            Upload photos to automatically identify ingredients
          </Text>
        </View>
      </View>

      <View style={styles.settingItem}>
        <Icon name="nutrition-outline" size={24} color={colors.accent} />
        <View style={styles.settingText}>
          <Text style={styles.settingLabel}>Nutrition Tracking</Text>
          <Text style={styles.settingDescription}>
            Detailed nutritional information for every recipe
          </Text>
        </View>
      </View>

      <View style={styles.apiKeyNotice}>
        <Icon name="key-outline" size={20} color={colors.warning} />
        <Text style={styles.apiKeyText}>
          To use Gemini AI, add your API key in services/geminiService.ts
        </Text>
      </View>

      <Button
        text="Close Settings"
        onPress={() => setIsBottomSheetVisible(false)}
        style={styles.closeButton}
      />
    </View>
  );

  const ImageRecognitionContent = () => (
    <ImageIngredientRecognition
      onIngredientsRecognized={handleIngredientsRecognized}
    />
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>GourmetNet</Text>
            <Text style={styles.appSubtitle}>AI-Powered Recipe Generation</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={handleOpenSettings}>
            <Icon name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>What&apos;s in your kitchen?</Text>
            <Text style={styles.heroSubtitle}>
              Add your ingredients and let Gemini AI create the perfect recipe for you
            </Text>
          </View>

          <View style={styles.inputSection}>
            <IngredientInput
              selectedIngredients={selectedIngredients}
              onIngredientsChange={setSelectedIngredients}
            />

            <DietaryStyleSelector
              selectedStyle={selectedDietaryStyle}
              onStyleChange={setSelectedDietaryStyle}
            />
          </View>

          <View style={styles.actionSection}>
            <Button
              text={isGenerating ? "Generating with Gemini AI..." : "Generate Recipe with AI"}
              onPress={handleGenerateRecipe}
              style={[
                styles.generateButton,
                isGenerating && styles.generatingButton
              ]}
            />

            <TouchableOpacity style={styles.imageButton} onPress={handleImageInput}>
              <Icon name="camera" size={24} color={colors.primary} />
              <Text style={styles.imageButtonText}>Recognize Ingredients</Text>
              <Text style={styles.imageButtonSubtext}>From Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Powered by Gemini AI</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Icon name="sparkles-outline" size={20} color={colors.accent} />
                <Text style={styles.featureText}>Advanced AI recipe generation</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="restaurant-outline" size={20} color={colors.accent} />
                <Text style={styles.featureText}>Personalized cooking instructions</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="camera-outline" size={20} color={colors.accent} />
                <Text style={styles.featureText}>Image ingredient recognition</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="fitness-outline" size={20} color={colors.accent} />
                <Text style={styles.featureText}>Accurate nutritional information</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="leaf-outline" size={20} color={colors.accent} />
                <Text style={styles.featureText}>Dietary preference support</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="time-outline" size={20} color={colors.accent} />
                <Text style={styles.featureText}>Realistic prep & cook times</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <SimpleBottomSheet
        isVisible={isBottomSheetVisible}
        onClose={() => setIsBottomSheetVisible(false)}
      >
        <SettingsContent />
      </SimpleBottomSheet>

      <SimpleBottomSheet
        isVisible={isImageRecognitionVisible}
        onClose={() => setIsImageRecognitionVisible(false)}
      >
        <ImageRecognitionContent />
      </SimpleBottomSheet>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  appSubtitle: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
  },
  content: {
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 32,
  },
  actionSection: {
    marginBottom: 32,
  },
  generateButton: {
    backgroundColor: colors.primary,
    marginBottom: 16,
  },
  generatingButton: {
    opacity: 0.7,
  },
  imageButton: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'solid',
  },
  imageButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  imageButtonSubtext: {
    color: colors.grey,
    fontSize: 12,
    marginTop: 4,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: {
    color: colors.text,
    fontSize: 16,
    marginLeft: 12,
  },
  settingsContent: {
    padding: 20,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 18,
  },
  apiKeyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  apiKeyText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  closeButton: {
    marginTop: 24,
  },
});
