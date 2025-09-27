
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { colors } from '../styles/commonStyles';
import { dietaryStyles } from '../data/mockData';

interface DietaryStyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
}

export default function DietaryStyleSelector({ selectedStyle, onStyleChange }: DietaryStyleSelectorProps) {
  console.log('Current selected style:', selectedStyle);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Dietary Style</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {dietaryStyles.map((style) => (
          <TouchableOpacity
            key={style.id}
            style={[
              styles.styleCard,
              selectedStyle === style.name && styles.selectedCard
            ]}
            onPress={() => {
              console.log('Selected dietary style:', style.name);
              onStyleChange(style.name);
            }}
          >
            <Text style={styles.styleIcon}>{style.icon}</Text>
            <Text style={[
              styles.styleName,
              selectedStyle === style.name && styles.selectedText
            ]}>
              {style.name}
            </Text>
            <Text style={[
              styles.styleDescription,
              selectedStyle === style.name && styles.selectedDescription
            ]}>
              {style.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  scrollView: {
    flexDirection: 'row',
  },
  styleCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 140,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    backgroundColor: colors.primary,
    borderColor: colors.accent,
  },
  styleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  styleName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedText: {
    color: '#fff',
  },
  styleDescription: {
    fontSize: 12,
    color: colors.grey,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedDescription: {
    color: '#fff',
    opacity: 0.9,
  },
});
