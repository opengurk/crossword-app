import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['DEL', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '→'],
];

const COLORS = {
  keyBg: '#2d3561',
  keyText: '#ffffff',
  specialBg: '#4a5568',
  specialText: '#f5c518',
  border: '#4a5568',
};

interface KeyboardProps {
  onLetter: (letter: string) => void;
  onDelete: () => void;
  onNext: () => void;
}

export const Keyboard: React.FC<KeyboardProps> = ({ onLetter, onDelete, onNext }) => {
  const handlePress = (key: string) => {
    if (key === 'DEL') onDelete();
    else if (key === '→') onNext();
    else onLetter(key);
  };

  return (
    <View style={styles.container}>
      {ROWS.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((key) => {
            const isSpecial = key === 'DEL' || key === '→';
            return (
              <TouchableOpacity
                key={key}
                onPress={() => handlePress(key)}
                style={[styles.key, isSpecial && styles.specialKey]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={
                  key === 'DEL' ? 'Delete' : key === '→' ? 'Next cell' : `Letter ${key}`
                }
              >
                <Text style={[styles.keyText, isSpecial && styles.specialKeyText]}>
                  {key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: '#1a1f3c',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  key: {
    backgroundColor: COLORS.keyBg,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 10,
    marginHorizontal: 3,
    minWidth: 30,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  specialKey: {
    backgroundColor: COLORS.specialBg,
    paddingHorizontal: 8,
  },
  keyText: {
    color: COLORS.keyText,
    fontSize: 13,
    fontWeight: '700',
  },
  specialKeyText: {
    color: COLORS.specialText,
    fontSize: 12,
  },
});
