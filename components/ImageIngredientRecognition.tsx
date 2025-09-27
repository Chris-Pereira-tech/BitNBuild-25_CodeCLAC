
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { colors } from '../styles/commonStyles';
import Icon from './Icon';
import { ImageRecognitionService } from '../services/imageRecognitionService';

interface ImageIngredientRecognitionProps {
  onIngredientsRecognized: (ingredients: string[]) => void;
}

export default function ImageIngredientRecognition({ onIngredientsRecognized }: ImageIngredientRecognitionProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [recognizedIngredients, setRecognizedIngredients] = useState<string[]>([]);

  const pickImageFromLibrary = async () => {
    console.log('Picking image from library');
    try {
      const imageUri = await ImageRecognitionService.pickImageFromLibrary();
      console.log('Image picked from library:', imageUri);
      if (imageUri) {
        setSelectedImage(imageUri);
        analyzeImage(imageUri);
      } else {
        console.log('No image was selected from library');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Permission Required',
        'Please grant photo library permissions to use this feature. You can enable this in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const takePhoto = async () => {
    console.log('Taking photo with camera');
    try {
      const imageUri = await ImageRecognitionService.captureImage();
      console.log('Photo taken with camera:', imageUri);
      if (imageUri) {
        setSelectedImage(imageUri);
        analyzeImage(imageUri);
      } else {
        console.log('No photo was taken');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(
        'Permission Required',
        'Please grant camera permissions to use this feature. You can enable this in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const analyzeImage = async (imageUri: string) => {
    console.log('Starting image analysis for URI:', imageUri);
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setRecognizedIngredients([]);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      console.log('Calling ImageRecognitionService.analyzeImageAndRecognizeIngredients...');
      const ingredients = await ImageRecognitionService.analyzeImageAndRecognizeIngredients(imageUri);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      // Small delay to show 100% completion
      setTimeout(() => {
        setRecognizedIngredients(ingredients);
        console.log('Analysis complete, ingredients found:', ingredients);
      }, 300);
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert(
        'Analysis Failed',
        'Could not analyze the image. Please try again with a clearer image.',
        [{ text: 'OK' }]
      );
      setRecognizedIngredients([]);
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
      }, 500);
    }
  };

  const handleUseIngredients = () => {
    console.log('Using recognized ingredients:', recognizedIngredients);
    onIngredientsRecognized(recognizedIngredients);
    setSelectedImage(null);
    setRecognizedIngredients([]);
  };

  const handleRetry = () => {
    console.log('Retrying image selection');
    setSelectedImage(null);
    setRecognizedIngredients([]);
    setAnalysisProgress(0);
  };

  const showImageOptions = () => {
    console.log('Showing image options alert');
    Alert.alert(
      'Select Image Source',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImageFromLibrary },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  if (selectedImage) {
    return (
      <View style={styles.analysisContainer}>
        <Text style={styles.title}>Image Analysis</Text>
        
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
        </View>

        {isAnalyzing ? (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.analyzingText}>Analyzing ingredients...</Text>
            <Text style={styles.analyzingSubtext}>This may take a few seconds</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${analysisProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{analysisProgress}%</Text>
            </View>
          </View>
        ) : recognizedIngredients.length > 0 ? (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Recognized Ingredients:</Text>
            <View style={styles.ingredientsList}>
              {recognizedIngredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Icon name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.useButton} onPress={handleUseIngredients}>
                <Text style={styles.useButtonText}>Use These Ingredients</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Try Another Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={48} color={colors.error} />
            <Text style={styles.errorText}>No ingredients detected</Text>
            <Text style={styles.errorSubtext}>Try taking a clearer photo with better lighting</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingredient Recognition</Text>
      <Text style={styles.subtitle}>
        Take a photo or select an image to automatically identify ingredients
      </Text>

      <TouchableOpacity style={styles.imageButton} onPress={showImageOptions}>
        <Icon name="camera" size={48} color={colors.primary} />
        <Text style={styles.imageButtonText}>Add Image</Text>
        <Text style={styles.imageButtonSubtext}>Camera or Photo Library</Text>
      </TouchableOpacity>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Tips for better recognition:</Text>
        <View style={styles.tipItem}>
          <Icon name="bulb-outline" size={16} color={colors.accent} />
          <Text style={styles.tipText}>Use good lighting</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="bulb-outline" size={16} color={colors.accent} />
          <Text style={styles.tipText}>Keep ingredients clearly visible</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="bulb-outline" size={16} color={colors.accent} />
          <Text style={styles.tipText}>Avoid cluttered backgrounds</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  analysisContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  imageButton: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: 24,
    width: '100%',
  },
  imageButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '500',
    marginTop: 12,
  },
  imageButtonSubtext: {
    color: colors.grey,
    fontSize: 14,
    marginTop: 4,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
  },
  analyzingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginTop: 12,
  },
  analyzingSubtext: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 4,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  ingredientsList: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ingredientText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  actionButtons: {
    gap: 12,
  },
  useButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  useButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.error,
    marginTop: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: colors.grey,
    marginLeft: 8,
  },
  progressContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
});
