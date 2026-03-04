import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  AppState,
  AppStateStatus,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePuzzleStore } from '../../src/store/puzzleStore';
import { CrosswordGrid } from '../../src/components/CrosswordGrid';
import { CluesList } from '../../src/components/CluesList';
import { Keyboard } from '../../src/components/Keyboard';
import type { Clue } from '../../src/types/crossword';

const COLORS = {
  background: '#1a1f3c',
  surface: '#252b4a',
  accent: '#f5c518',
  textPrimary: '#ffffff',
  textSecondary: '#a0aec0',
  border: '#4a5568',
  danger: '#fc8181',
  success: '#48bb78',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function cellKey(row: number, col: number) {
  return `${row},${col}`;
}

export default function PlayScreen() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>('active');

  const puzzle = usePuzzleStore(s => s.puzzle);
  const difficulty = usePuzzleStore(s => s.difficulty);
  const inputtedLetters = usePuzzleStore(s => s.inputtedLetters);
  const checkedCells = usePuzzleStore(s => s.checkedCells);
  const revealedCells = usePuzzleStore(s => s.revealedCells);
  const incorrectCells = usePuzzleStore(s => s.incorrectCells);
  const selectedCell = usePuzzleStore(s => s.selectedCell);
  const selectedDirection = usePuzzleStore(s => s.selectedDirection);
  const timerSeconds = usePuzzleStore(s => s.timerSeconds);
  const isComplete = usePuzzleStore(s => s.isComplete);

  const loadPuzzle = usePuzzleStore(s => s.loadPuzzle);
  const restoreInProgress = usePuzzleStore(s => s.restoreInProgress);
  const selectCell = usePuzzleStore(s => s.selectCell);
  const selectClue = usePuzzleStore(s => s.selectClue);
  const inputLetter = usePuzzleStore(s => s.inputLetter);
  const deleteLetter = usePuzzleStore(s => s.deleteLetter);
  const checkPuzzle = usePuzzleStore(s => s.checkPuzzle);
  const revealCell = usePuzzleStore(s => s.revealCell);
  const revealAll = usePuzzleStore(s => s.revealAll);
  const tick = usePuzzleStore(s => s.tick);
  const pauseTimer = usePuzzleStore(s => s.pauseTimer);
  const resumeTimer = usePuzzleStore(s => s.resumeTimer);

  // Initialize puzzle on mount
  useEffect(() => {
    const restored = restoreInProgress();
    if (!restored) {
      router.replace('/difficulty');
    }
  }, []);

  // Navigate to complete screen when puzzle is done
  useEffect(() => {
    if (isComplete) {
      router.push('/complete');
    }
  }, [isComplete]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      tick();
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tick]);

  // AppState handling
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current === 'active' && nextState !== 'active') {
        pauseTimer();
      } else if (appStateRef.current !== 'active' && nextState === 'active') {
        resumeTimer();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [pauseTimer, resumeTimer]);

  // Get word cells for the selected word
  const selectedWordCells = React.useMemo(() => {
    if (!puzzle || !selectedCell) return [];
    const cell = puzzle.grid[selectedCell.row][selectedCell.col];
    const wordId = selectedDirection === 'across' ? cell.acrossWord : cell.downWord;
    if (!wordId) return [];

    const clues = selectedDirection === 'across' ? puzzle.acrossClues : puzzle.downClues;
    const clue = clues.find(c => `${c.row},${c.col},${c.direction}` === wordId);
    if (!clue) return [];

    const dr = clue.direction === 'down' ? 1 : 0;
    const dc = clue.direction === 'across' ? 1 : 0;
    return Array.from({ length: clue.length }, (_, i) => ({
      row: clue.row + dr * i,
      col: clue.col + dc * i,
    }));
  }, [puzzle, selectedCell, selectedDirection]);

  // Get active clue
  const activeClue = React.useMemo(() => {
    if (!puzzle || !selectedCell) return null;
    const cell = puzzle.grid[selectedCell.row][selectedCell.col];
    const wordId = selectedDirection === 'across' ? cell.acrossWord : cell.downWord;
    if (!wordId) return null;
    const clues = selectedDirection === 'across' ? puzzle.acrossClues : puzzle.downClues;
    return clues.find(c => `${c.row},${c.col},${c.direction}` === wordId) ?? null;
  }, [puzzle, selectedCell, selectedDirection]);

  const handleNextInWord = useCallback(() => {
    if (!puzzle || !activeClue || !selectedCell) return;
    const dr = activeClue.direction === 'down' ? 1 : 0;
    const dc = activeClue.direction === 'across' ? 1 : 0;
    let posInWord = 0;
    for (let i = 0; i < activeClue.length; i++) {
      if (activeClue.row + dr * i === selectedCell.row && activeClue.col + dc * i === selectedCell.col) {
        posInWord = i;
        break;
      }
    }
    if (posInWord + 1 < activeClue.length) {
      selectCell(activeClue.row + dr * (posInWord + 1), activeClue.col + dc * (posInWord + 1));
    }
  }, [puzzle, activeClue, selectedCell, selectCell]);

  const handleCheck = () => {
    checkPuzzle();
  };

  const handleReveal = () => {
    Alert.alert(
      'Reveal',
      'Reveal the selected cell or the entire puzzle?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'This Cell', onPress: revealCell },
        { text: 'All', style: 'destructive', onPress: revealAll },
      ]
    );
  };

  const handleNewPuzzle = () => {
    router.push('/difficulty');
  };

  if (!puzzle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f5c518" />
          <Text style={styles.loadingText}>Generating puzzle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>✏️ CrossWord Daily</Text>
          <View style={[
            styles.diffBadge,
            difficulty === 'easy' ? styles.diff_easy :
            difficulty === 'hard' ? styles.diff_hard :
            styles.diff_medium,
          ]}>
            <Text style={styles.diffText}>{difficultyLabel}</Text>
          </View>
        </View>
        <Text style={styles.timer}>{formatTime(timerSeconds)}</Text>
      </View>

      {/* Active clue display */}
      {activeClue && (
        <View style={styles.activeClueBar}>
          <Text style={styles.activeClueNum}>{activeClue.number}{activeClue.direction === 'across' ? 'A' : 'D'}</Text>
          <Text style={styles.activeClueText} numberOfLines={2}>
            {activeClue.text}
          </Text>
        </View>
      )}

      {/* Grid */}
      <View style={styles.gridContainer}>
        <CrosswordGrid
          grid={puzzle.grid}
          size={puzzle.size}
          inputtedLetters={inputtedLetters}
          checkedCells={checkedCells}
          revealedCells={revealedCells}
          incorrectCells={incorrectCells}
          selectedCell={selectedCell}
          selectedWordCells={selectedWordCells}
          onCellPress={selectCell}
        />
      </View>

      {/* Action buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCheck} activeOpacity={0.7}>
          <Text style={styles.actionBtnText}>✓ Check</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={handleReveal} activeOpacity={0.7}>
          <Text style={styles.actionBtnText}>👁 Reveal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={handleNewPuzzle} activeOpacity={0.7}>
          <Text style={styles.actionBtnText}>↺ New</Text>
        </TouchableOpacity>
      </View>

      {/* Clues list */}
      <View style={styles.cluesContainer}>
        <CluesList
          acrossClues={puzzle.acrossClues}
          downClues={puzzle.downClues}
          activeClueId={activeClue?.id ?? null}
          onCluePress={selectClue}
        />
      </View>

      {/* Keyboard */}
      <Keyboard
        onLetter={inputLetter}
        onDelete={deleteLetter}
        onNext={handleNextInWord}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  diff_easy: { backgroundColor: '#48bb78' },
  diff_medium: { backgroundColor: '#f5c518' },
  diff_hard: { backgroundColor: '#fc8181' },
  diffText: {
    color: '#1a1f3c',
    fontSize: 11,
    fontWeight: '700',
  },
  timer: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  activeClueBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  activeClueNum: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 28,
  },
  activeClueText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  gridContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '700',
  },
  cluesContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
});


