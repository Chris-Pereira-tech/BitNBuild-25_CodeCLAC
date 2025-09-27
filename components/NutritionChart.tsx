
import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import { colors } from '../styles/commonStyles';
import { NutritionInfo } from '../types/Recipe';

interface NutritionChartProps {
  nutrition: NutritionInfo;
}

export default function NutritionChart({ nutrition }: NutritionChartProps) {
  const totalMacros = nutrition.protein + nutrition.carbs + nutrition.fat;
  
  const proteinPercentage = (nutrition.protein / totalMacros) * 100;
  const carbsPercentage = (nutrition.carbs / totalMacros) * 100;
  const fatPercentage = (nutrition.fat / totalMacros) * 100;

  const NutritionBar = ({ label, value, percentage, color }: {
    label: string;
    value: number;
    percentage: number;
    color: string;
  }) => (
    <View style={styles.nutritionItem}>
      <View style={styles.nutritionHeader}>
        <Text style={styles.nutritionLabel}>{label}</Text>
        <Text style={styles.nutritionValue}>{value}g</Text>
      </View>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${percentage}%`, backgroundColor: color }
          ]} 
        />
      </View>
      <Text style={styles.percentageText}>{percentage.toFixed(1)}%</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition Information</Text>
      
      <View style={styles.caloriesContainer}>
        <Text style={styles.caloriesNumber}>{nutrition.calories}</Text>
        <Text style={styles.caloriesLabel}>Calories</Text>
      </View>

      <View style={styles.macrosContainer}>
        <NutritionBar
          label="Protein"
          value={nutrition.protein}
          percentage={proteinPercentage}
          color="#4CAF50"
        />
        <NutritionBar
          label="Carbs"
          value={nutrition.carbs}
          percentage={carbsPercentage}
          color="#2196F3"
        />
        <NutritionBar
          label="Fat"
          value={nutrition.fat}
          percentage={fatPercentage}
          color="#FF9800"
        />
      </View>

      <View style={styles.additionalInfo}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Fiber</Text>
          <Text style={styles.infoValue}>{nutrition.fiber}g</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Sugar</Text>
          <Text style={styles.infoValue}>{nutrition.sugar}g</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  caloriesContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  caloriesNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.accent,
  },
  caloriesLabel: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 4,
  },
  macrosContainer: {
    marginBottom: 16,
  },
  nutritionItem: {
    marginBottom: 12,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    color: colors.grey,
    textAlign: 'right',
  },
  additionalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: colors.grey,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
