import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePuzzleStore } from '../src/store/puzzleStore';
import type { Difficulty } from '../src/types/crossword';

const COLORS = {
  background: '#1a1f3c',
  surface: '#252b4a',
  accent: '#f5c518',
  textPrimary: '#ffffff',
  textSecondary: '#a0aec0',
  border: '#4a5568',
};

interface DifficultyConfig {
  key: Difficulty;
  label: string;
  emoji: string;
  gridSize: string;
  estimatedTime: string;
  color: string;
  description: string;
}

const DIFFICULTIES: DifficultyConfig[] = [
  {
    key: 'easy',
    label: 'Easy',
    emoji: '🌱',
    gridSize: '9 × 9',
    estimatedTime: '5–10 min',
    color: '#48bb78',
    description: 'Small grid, common words. Perfect to warm up.',
  },
  {
    key: 'medium',
    label: 'Medium',
    emoji: '🌟',
    gridSize: '13 × 13',
    estimatedTime: '15–25 min',
    color: '#f5c518',
    description: 'Classic crossword size. A satisfying challenge.',
  },
  {
    key: 'hard',
    label: 'Hard',
    emoji: '🔥',
    gridSize: '15 × 15',
    estimatedTime: '30–45 min',
    color: '#fc8181',
    description: 'Full-size grid. Only for serious solvers.',
  },
];

export default function DifficultyScreen() {
  const router = useRouter();
  const loadPuzzle = usePuzzleStore(s => s.loadPuzzle);
  const [loading, setLoading] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<Difficulty | null>(null);

  const handleSelect = async (diff: Difficulty) => {
    setSelectedDiff(diff);
    setLoading(true);
    // Small delay to show loading state before heavy generation
    await new Promise(res => setTimeout(res, 50));
    loadPuzzle(diff);
    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.titleEmoji}>✏️</Text>
          <Text style={styles.title}>CrossWord Daily</Text>
          <Text style={styles.subtitle}>Choose your difficulty</Text>
        </View>

        {/* Difficulty Cards */}
        <View style={styles.cards}>
          {DIFFICULTIES.map((diff) => (
            <TouchableOpacity
              key={diff.key}
              style={[styles.card, { borderColor: diff.color }]}
              onPress={() => handleSelect(diff.key)}
              activeOpacity={0.8}
              disabled={loading}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>{diff.emoji}</Text>
                <View style={styles.cardTitleBlock}>
                  <Text style={[styles.cardLabel, { color: diff.color }]}>{diff.label}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardGrid}>{diff.gridSize}</Text>
                    <Text style={styles.cardDot}> · </Text>
                    <Text style={styles.cardTime}>{diff.estimatedTime}</Text>
                  </View>
                </View>
                {loading && selectedDiff === diff.key && (
                  <ActivityIndicator color={diff.color} />
                )}
              </View>
              <Text style={styles.cardDesc}>{diff.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.hint}>Puzzles are randomly generated on your device</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleEmoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 8,
  },
  cards: {
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardGrid: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  cardDot: {
    color: COLORS.border,
    fontSize: 13,
  },
  cardTime: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  cardDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  hint: {
    color: COLORS.border,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
