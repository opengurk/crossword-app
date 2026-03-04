import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { usePuzzleStore } from '../../src/store/puzzleStore';
import type { CompletedPuzzle, Difficulty } from '../../src/types/crossword';

const COLORS = {
  background: '#1a1f3c',
  surface: '#252b4a',
  accent: '#f5c518',
  textPrimary: '#ffffff',
  textSecondary: '#a0aec0',
  border: '#4a5568',
  success: '#48bb78',
  danger: '#fc8181',
  easy: '#48bb78',
  medium: '#f5c518',
  hard: '#fc8181',
};

function formatTime(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function computeStreak(history: CompletedPuzzle[]): { current: number; best: number } {
  if (history.length === 0) return { current: 0, best: 0 };

  // Group completions by day
  const days = new Set(history.map(h => {
    const d = new Date(h.completedAt);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }));

  const sortedDays = Array.from(days).sort().reverse();
  let current = 0;
  let best = 0;
  let streak = 0;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  for (let i = 0; i < sortedDays.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedKey = `${expected.getFullYear()}-${expected.getMonth()}-${expected.getDate()}`;

    if (sortedDays[i] === expectedKey) {
      streak++;
      if (i === 0) current = streak;
    } else {
      break;
    }
    if (streak > best) best = streak;
  }

  return { current, best };
}

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <View style={statCardStyles.card}>
      <Text style={[statCardStyles.value, color ? { color } : {}]}>{value}</Text>
      <Text style={statCardStyles.label}>{label}</Text>
    </View>
  );
}

const statCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: 4,
    minWidth: 80,
  },
  value: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
});

interface DifficultyRowProps {
  label: string;
  puzzles: CompletedPuzzle[];
  bestTime: number | null;
  color: string;
}

function DifficultyRow({ label, puzzles, bestTime, color }: DifficultyRowProps) {
  const played = puzzles.length;
  const avgTime = played > 0
    ? Math.round(puzzles.reduce((sum, p) => sum + p.timeSeconds, 0) / played)
    : 0;

  return (
    <View style={diffRowStyles.row}>
      <View style={[diffRowStyles.dot, { backgroundColor: color }]} />
      <Text style={diffRowStyles.label}>{label}</Text>
      <Text style={diffRowStyles.value}>{played}</Text>
      <Text style={diffRowStyles.value}>{formatTime(avgTime)}</Text>
      <Text style={diffRowStyles.value}>{formatTime(bestTime ?? 0)}</Text>
    </View>
  );
}

const diffRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: 14,
    flex: 1,
    fontWeight: '600',
  },
  value: {
    color: COLORS.textSecondary,
    fontSize: 13,
    width: 64,
    textAlign: 'center',
  },
});

export default function StatsScreen() {
  const history = usePuzzleStore(s => s.history);
  const bestTimes = usePuzzleStore(s => s.bestTimes);

  const { current: currentStreak, best: bestStreak } = computeStreak(history);
  const totalPlayed = history.length;
  const winRate = totalPlayed > 0
    ? Math.round((history.filter(h => !h.revealed).length / totalPlayed) * 100)
    : 0;

  const byDifficulty = (diff: Difficulty) => history.filter(h => h.difficulty === diff);

  const recentPuzzles = history.slice(0, 15);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>📊 Statistics</Text>
        </View>

        {/* Summary cards */}
        <View style={styles.section}>
          <View style={styles.cardRow}>
            <StatCard label="Played" value={totalPlayed} />
            <StatCard label="Win Rate" value={`${winRate}%`} />
          </View>
          <View style={styles.cardRow}>
            <StatCard label="Streak 🔥" value={currentStreak} color="#f5c518" />
            <StatCard label="Best Streak" value={bestStreak} />
          </View>
        </View>

        {/* Per-difficulty breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Difficulty</Text>
          <View style={styles.tableCard}>
            {/* Header */}
            <View style={[diffRowStyles.row, { borderBottomWidth: 2, borderBottomColor: COLORS.border }]}>
              <View style={{ width: 16 }} />
              <Text style={[diffRowStyles.label, { color: COLORS.textSecondary, fontSize: 12 }]}>Level</Text>
              <Text style={[diffRowStyles.value, { color: COLORS.textSecondary, fontSize: 12 }]}>Played</Text>
              <Text style={[diffRowStyles.value, { color: COLORS.textSecondary, fontSize: 12 }]}>Avg</Text>
              <Text style={[diffRowStyles.value, { color: COLORS.textSecondary, fontSize: 12 }]}>Best</Text>
            </View>
            <DifficultyRow label="Easy" puzzles={byDifficulty('easy')} bestTime={bestTimes.easy} color={COLORS.easy} />
            <DifficultyRow label="Medium" puzzles={byDifficulty('medium')} bestTime={bestTimes.medium} color={COLORS.medium} />
            <DifficultyRow label="Hard" puzzles={byDifficulty('hard')} bestTime={bestTimes.hard} color={COLORS.hard} />
          </View>
        </View>

        {/* Recent puzzles */}
        {recentPuzzles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Puzzles</Text>
            <View style={styles.tableCard}>
              {recentPuzzles.map((puzzle) => (
                <View key={puzzle.id} style={styles.recentRow}>
                  <View style={styles.recentLeft}>
                    <View style={[
                      styles.diffDot,
                      {
                        backgroundColor:
                          puzzle.difficulty === 'easy' ? COLORS.easy :
                          puzzle.difficulty === 'medium' ? COLORS.medium :
                          COLORS.hard
                      }
                    ]} />
                    <View>
                      <Text style={styles.recentDiff}>
                        {puzzle.difficulty.charAt(0).toUpperCase() + puzzle.difficulty.slice(1)}
                        {puzzle.revealed ? ' 👁' : ''}
                      </Text>
                      <Text style={styles.recentDate}>{formatDate(puzzle.completedAt)}</Text>
                    </View>
                  </View>
                  <Text style={styles.recentTime}>{formatTime(puzzle.timeSeconds)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {totalPlayed === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyText}>No puzzles completed yet</Text>
            <Text style={styles.emptySubText}>Play your first crossword to see stats here!</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tableCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  diffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recentDiff: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  recentDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  recentTime: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
