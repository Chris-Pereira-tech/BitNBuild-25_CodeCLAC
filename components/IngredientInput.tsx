
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { colors } from '../styles/commonStyles';
import { commonIngredients } from '../data/mockData';
import Icon from './Icon';

interface IngredientInputProps {
  selectedIngredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
}

export default function IngredientInput({ selectedIngredients, onIngredientsChange }: IngredientInputProps) {
  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = commonIngredients.filter(ingredient =>
    ingredient.toLowerCase().includes(inputText.toLowerCase()) &&
    !selectedIngredients.includes(ingredient)
  );

  const addIngredient = (ingredient: string) => {
    console.log('Adding ingredient:', ingredient);
    if (!selectedIngredients.includes(ingredient) && ingredient.trim()) {
      onIngredientsChange([...selectedIngredients, ingredient]);
      setInputText('');
      setShowSuggestions(false);
    }
  };

  const removeIngredient = (ingredient: string) => {
    console.log('Removing ingredient:', ingredient);
    onIngredientsChange(selectedIngredients.filter(item => item !== ingredient));
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    setShowSuggestions(text.length > 0);
  };

  const handleAddCustom = () => {
    if (inputText.trim()) {
      addIngredient(inputText.trim());
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Ingredients</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleInputChange}
          placeholder="Type an ingredient..."
          placeholderTextColor={colors.grey}
          onFocus={() => setShowSuggestions(inputText.length > 0)}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddCustom}>
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
          {filteredSuggestions.slice(0, 8).map((ingredient, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => addIngredient(ingredient)}
            >
              <Text style={styles.suggestionText}>{ingredient}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedIngredients.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>Selected Ingredients:</Text>
          <View style={styles.ingredientTags}>
            {selectedIngredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientTag}>
                <Text style={styles.ingredientTagText}>{ingredient}</Text>
                <TouchableOpacity
                  onPress={() => removeIngredient(ingredient)}
                  style={styles.removeButton}
                >
                  <Icon name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    maxHeight: 200,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    marginBottom: 10,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  suggestionText: {
    color: colors.text,
    fontSize: 16,
  },
  selectedContainer: {
    marginTop: 10,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  ingredientTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientTag: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ingredientTagText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 6,
  },
  removeButton: {
    padding: 2,
  },
});
