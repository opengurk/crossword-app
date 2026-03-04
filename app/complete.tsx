import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePuzzleStore } from '../src/store/puzzleStore';

const COLORS = {
  background: '#1a1f3c',
  surface: '#252b4a',
  accent: '#f5c518',
  textPrimary: '#ffffff',
  textSecondary: '#a0aec0',
  border: '#4a5568',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const MESSAGES = [
  'Brilliant solving! 🎉',
  'Absolutely nailed it! ⭐',
  'Word wizard detected! 🧙',
  "You're on fire! 🔥",
  'Impressive work! 🏆',
  'Master wordsmith! ✏️',
];

const CONFETTI = ['🎊', '🎉', '✨', '🌟', '⭐', '🎈', '🎁', '🏆'];

export default function CompleteScreen() {
  const router = useRouter();
  const difficulty = usePuzzleStore(s => s.difficulty);
  const timerSeconds = usePuzzleStore(s => s.timerSeconds);
  const history = usePuzzleStore(s => s.history);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous trophy bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const messageIndex = timerSeconds % MESSAGES.length;
  const message = MESSAGES[messageIndex];

  const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const diffColors: Record<string, string> = {
    easy: '#48bb78',
    medium: '#f5c518',
    hard: '#fc8181',
  };

  const latestRecord = history[0];

  // Random confetti positions
  const confettiItems = Array.from({ length: 12 }, (_, i) => ({
    emoji: CONFETTI[i % CONFETTI.length],
    left: `${(i * 8.33) % 100}%`,
    top: `${(i * 7.5) % 30}%`,
    size: 16 + (i % 3) * 8,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Confetti decorations */}
        <View style={styles.confettiLayer} pointerEvents="none">
          {confettiItems.map((item, i) => (
            <Text
              key={i}
              style={[styles.confettiItem, { left: item.left as any, top: item.top as any, fontSize: item.size }]}
            >
              {item.emoji}
            </Text>
          ))}
        </View>

        {/* Trophy */}
        <Animated.Text
          style={[
            styles.trophy,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: bounceAnim },
              ],
            },
          ]}
        >
          🏆
        </Animated.Text>

        {/* Message */}
        <Animated.View style={[styles.messageBlock, { opacity: fadeAnim }]}>
          <Text style={styles.congrats}>Puzzle Complete!</Text>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatTime(timerSeconds)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Difficulty</Text>
            <Text style={[styles.statValue, { color: diffColors[difficulty] }]}>
              {difficultyLabel}
            </Text>
          </View>
          {latestRecord && (
            <>
              <View style={styles.divider} />
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>With Reveals</Text>
                <Text style={styles.statValue}>
                  {latestRecord.revealed ? 'Yes' : 'No 🌟'}
                </Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.buttons, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/difficulty')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>🎯 New Puzzle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              router.replace('/(tabs)');
              // Navigate to stats tab
              setTimeout(() => router.push('/(tabs)/stats'), 100);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>📊 View Stats</Text>
          </TouchableOpacity>
        </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  confettiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  confettiItem: {
    position: 'absolute',
    opacity: 0.7,
  },
  trophy: {
    fontSize: 80,
    marginBottom: 24,
  },
  messageBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  congrats: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#1a1f3c',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
});
