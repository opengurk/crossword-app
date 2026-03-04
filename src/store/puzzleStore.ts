import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import type { Cell, Clue, CrosswordPuzzle, Difficulty, Direction, CompletedPuzzle } from '../types/crossword';
import { generateCrossword } from '../lib/crosswordGenerator';

interface PuzzleState {
  // Current puzzle
  puzzle: CrosswordPuzzle | null;
  difficulty: Difficulty;

  // User input
  inputtedLetters: Record<string, string>; // key: "row,col" -> letter
  checkedCells: Record<string, boolean>;   // key: "row,col" -> true if checked
  revealedCells: Record<string, boolean>;  // key: "row,col" -> true if revealed
  incorrectCells: Record<string, boolean>; // key: "row,col" -> true if wrong after check

  // Selection
  selectedCell: { row: number; col: number } | null;
  selectedDirection: Direction;

  // Timer
  timerSeconds: number;
  timerRunning: boolean;

  // Completion
  isComplete: boolean;

  // Persisted history
  history: CompletedPuzzle[];
  bestTimes: Record<Difficulty, number | null>;

  // In-progress puzzle (persisted)
  inProgressPuzzle: CrosswordPuzzle | null;
  inProgressLetters: Record<string, string>;
  inProgressDifficulty: Difficulty;
  inProgressTimer: number;
}

interface PuzzleActions {
  // Puzzle management
  loadPuzzle: (difficulty: Difficulty) => void;
  restoreInProgress: () => boolean;
  newPuzzle: (difficulty: Difficulty) => void;

  // Navigation/Selection
  selectCell: (row: number, col: number) => void;
  selectClue: (clue: Clue) => void;
  moveSelection: (dr: number, dc: number) => void;

  // Input
  inputLetter: (letter: string) => void;
  deleteLetter: () => void;

  // Game actions
  checkPuzzle: () => void;
  revealCell: () => void;
  revealAll: () => void;
  clearChecks: () => void;

  // Timer
  tick: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;

  // Completion
  checkCompletion: () => boolean;
  completePuzzle: () => void;
}

function cellKey(row: number, col: number) {
  return `${row},${col}`;
}

function getActiveClue(
  puzzle: CrosswordPuzzle,
  row: number,
  col: number,
  direction: Direction
): Clue | null {
  const clues = direction === 'across' ? puzzle.acrossClues : puzzle.downClues;
  const cell = puzzle.grid[row][col];
  const wordId = direction === 'across' ? cell.acrossWord : cell.downWord;
  if (!wordId) return null;

  return clues.find(c => `${c.row},${c.col},${c.direction}` === wordId) ?? null;
}

function findNextEmptyInWord(
  puzzle: CrosswordPuzzle,
  inputted: Record<string, string>,
  clue: Clue
): { row: number; col: number } | null {
  const dr = clue.direction === 'down' ? 1 : 0;
  const dc = clue.direction === 'across' ? 1 : 0;
  for (let i = 0; i < clue.length; i++) {
    const r = clue.row + dr * i;
    const c = clue.col + dc * i;
    if (!inputted[cellKey(r, c)]) {
      return { row: r, col: c };
    }
  }
  return null;
}

function advanceCursor(
  puzzle: CrosswordPuzzle,
  inputted: Record<string, string>,
  row: number,
  col: number,
  direction: Direction
): { row: number; col: number } {
  const clue = getActiveClue(puzzle, row, col, direction);
  if (!clue) return { row, col };

  const dr = direction === 'down' ? 1 : 0;
  const dc = direction === 'across' ? 1 : 0;

  // Find the position of current cell in the word
  let posInWord = 0;
  for (let i = 0; i < clue.length; i++) {
    if (clue.row + dr * i === row && clue.col + dc * i === col) {
      posInWord = i;
      break;
    }
  }

  // Advance to next EMPTY cell after current position (REQ-012)
  for (let i = posInWord + 1; i < clue.length; i++) {
    const r = clue.row + dr * i;
    const c = clue.col + dc * i;
    if (!inputted[cellKey(r, c)]) {
      return { row: r, col: c };
    }
  }

  // All cells after are filled — find first empty cell from beginning of word
  const next = findNextEmptyInWord(puzzle, inputted, clue);
  if (next) return next;

  // Word fully filled — stay on current cell
  return { row, col };
}

export const usePuzzleStore = create<PuzzleState & PuzzleActions>()(
  persist(
    (set, get) => ({
      // Initial state
      puzzle: null,
      difficulty: 'medium',
      inputtedLetters: {},
      checkedCells: {},
      revealedCells: {},
      incorrectCells: {},
      selectedCell: null,
      selectedDirection: 'across',
      timerSeconds: 0,
      timerRunning: false,
      isComplete: false,
      history: [],
      bestTimes: { easy: null, medium: null, hard: null },
      inProgressPuzzle: null,
      inProgressLetters: {},
      inProgressDifficulty: 'medium',
      inProgressTimer: 0,

      loadPuzzle: (difficulty) => {
        const puzzle = generateCrossword(difficulty);
        set({
          puzzle,
          difficulty,
          inputtedLetters: {},
          checkedCells: {},
          revealedCells: {},
          incorrectCells: {},
          selectedCell: null,
          selectedDirection: 'across',
          timerSeconds: 0,
          timerRunning: true,
          isComplete: false,
          inProgressPuzzle: puzzle,
          inProgressLetters: {},
          inProgressDifficulty: difficulty,
          inProgressTimer: 0,
        });
      },

      restoreInProgress: () => {
        const state = get();
        if (!state.inProgressPuzzle || state.isComplete) return false;
        set({
          puzzle: state.inProgressPuzzle,
          difficulty: state.inProgressDifficulty,
          inputtedLetters: state.inProgressLetters,
          timerSeconds: state.inProgressTimer,
          timerRunning: true,
          isComplete: false,
          checkedCells: {},
          revealedCells: {},
          incorrectCells: {},
        });
        return true;
      },

      newPuzzle: (difficulty) => {
        get().loadPuzzle(difficulty);
      },

      selectCell: (row, col) => {
        const { puzzle, selectedCell, selectedDirection } = get();
        if (!puzzle) return;

        const cell = puzzle.grid[row][col];
        if (cell.isBlack) return;

        // If same cell tapped again, toggle direction
        if (selectedCell?.row === row && selectedCell?.col === col) {
          const newDir: Direction = selectedDirection === 'across' ? 'down' : 'across';
          // Only toggle if there's a word in that direction
          const hasWord = newDir === 'across' ? !!cell.acrossWord : !!cell.downWord;
          if (hasWord) {
            set({ selectedDirection: newDir });
          }
          return;
        }

        // New cell selected
        let dir = selectedDirection;
        const hasAcross = !!cell.acrossWord;
        const hasDown = !!cell.downWord;

        if (!hasAcross && hasDown) dir = 'down';
        else if (hasAcross && !hasDown) dir = 'across';

        set({ selectedCell: { row, col }, selectedDirection: dir });
      },

      selectClue: (clue) => {
        set({
          selectedCell: { row: clue.row, col: clue.col },
          selectedDirection: clue.direction,
        });
        // Move to first empty cell in this clue
        const { puzzle, inputtedLetters } = get();
        if (!puzzle) return;
        const next = findNextEmptyInWord(puzzle, inputtedLetters, clue);
        if (next) {
          set({ selectedCell: next });
        }
      },

      moveSelection: (dr, dc) => {
        const { puzzle, selectedCell, selectedDirection } = get();
        if (!puzzle || !selectedCell) return;
        const { row, col } = selectedCell;
        const nr = row + dr;
        const nc = col + dc;
        if (nr < 0 || nr >= puzzle.size || nc < 0 || nc >= puzzle.size) return;
        if (puzzle.grid[nr][nc].isBlack) return;
        set({ selectedCell: { row: nr, col: nc } });
      },

      inputLetter: (letter) => {
        const { puzzle, selectedCell, selectedDirection, inputtedLetters, revealedCells } = get();
        if (!puzzle || !selectedCell) return;
        const { row, col } = selectedCell;
        const key = cellKey(row, col);

        // Don't overwrite revealed cells
        if (revealedCells[key]) return;

        const newInputted = { ...inputtedLetters, [key]: letter.toLowerCase() };

        // Auto-advance
        const clue = getActiveClue(puzzle, row, col, selectedDirection);
        let nextCell = selectedCell;
        if (clue) {
          nextCell = advanceCursor(puzzle, newInputted, row, col, selectedDirection);
        }

        set({
          inputtedLetters: newInputted,
          selectedCell: nextCell,
          incorrectCells: { ...get().incorrectCells, [key]: false },
        });

        // Save in-progress
        set({ inProgressLetters: newInputted });

        // Check completion
        get().checkCompletion();
      },

      deleteLetter: () => {
        const { puzzle, selectedCell, selectedDirection, inputtedLetters, revealedCells } = get();
        if (!puzzle || !selectedCell) return;
        const { row, col } = selectedCell;
        const key = cellKey(row, col);

        if (revealedCells[key]) return;

        if (inputtedLetters[key]) {
          // Delete current cell
          const newInputted = { ...inputtedLetters };
          delete newInputted[key];
          set({ inputtedLetters: newInputted, inProgressLetters: newInputted });
        } else {
          // Move back and delete previous
          const clue = getActiveClue(puzzle, row, col, selectedDirection);
          if (!clue) return;

          const dr = selectedDirection === 'down' ? 1 : 0;
          const dc = selectedDirection === 'across' ? 1 : 0;

          let posInWord = 0;
          for (let i = 0; i < clue.length; i++) {
            if (clue.row + dr * i === row && clue.col + dc * i === col) {
              posInWord = i;
              break;
            }
          }

          if (posInWord > 0) {
            const prevRow = clue.row + dr * (posInWord - 1);
            const prevCol = clue.col + dc * (posInWord - 1);
            const prevKey = cellKey(prevRow, prevCol);
            if (!revealedCells[prevKey]) {
              const newInputted = { ...inputtedLetters };
              delete newInputted[prevKey];
              set({
                inputtedLetters: newInputted,
                selectedCell: { row: prevRow, col: prevCol },
                inProgressLetters: newInputted,
              });
            }
          }
        }
      },

      checkPuzzle: () => {
        const { puzzle, inputtedLetters, revealedCells } = get();
        if (!puzzle) return;

        const incorrect: Record<string, boolean> = {};
        const checked: Record<string, boolean> = {};

        for (let r = 0; r < puzzle.size; r++) {
          for (let c = 0; c < puzzle.size; c++) {
            const cell = puzzle.grid[r][c];
            if (cell.isBlack || !cell.letter) continue;
            const key = cellKey(r, c);
            if (revealedCells[key]) continue;

            const userLetter = inputtedLetters[key];
            if (userLetter) {
              checked[key] = true;
              if (userLetter !== cell.letter) {
                incorrect[key] = true;
              }
            }
          }
        }

        set({ checkedCells: checked, incorrectCells: incorrect });
      },

      revealCell: () => {
        const { puzzle, selectedCell, inputtedLetters, revealedCells } = get();
        if (!puzzle || !selectedCell) return;
        const { row, col } = selectedCell;
        const key = cellKey(row, col);
        const cell = puzzle.grid[row][col];
        if (cell.isBlack || !cell.letter) return;

        set({
          inputtedLetters: { ...inputtedLetters, [key]: cell.letter },
          revealedCells: { ...revealedCells, [key]: true },
          incorrectCells: { ...get().incorrectCells, [key]: false },
        });

        get().checkCompletion();
      },

      revealAll: () => {
        const { puzzle, inputtedLetters, revealedCells } = get();
        if (!puzzle) return;

        const newInputted = { ...inputtedLetters };
        const newRevealed = { ...revealedCells };
        const newIncorrect: Record<string, boolean> = {};

        for (let r = 0; r < puzzle.size; r++) {
          for (let c = 0; c < puzzle.size; c++) {
            const cell = puzzle.grid[r][c];
            if (!cell.isBlack && cell.letter) {
              const key = cellKey(r, c);
              newInputted[key] = cell.letter;
              newRevealed[key] = true;
              newIncorrect[key] = false;
            }
          }
        }

        set({
          inputtedLetters: newInputted,
          revealedCells: newRevealed,
          incorrectCells: newIncorrect,
        });

        get().completePuzzle();
      },

      clearChecks: () => {
        set({ checkedCells: {}, incorrectCells: {} });
      },

      tick: () => {
        const { timerRunning, isComplete } = get();
        if (!timerRunning || isComplete) return;
        const newTime = get().timerSeconds + 1;
        set({ timerSeconds: newTime, inProgressTimer: newTime });
      },

      pauseTimer: () => set({ timerRunning: false }),
      resumeTimer: () => {
        const { isComplete } = get();
        if (!isComplete) set({ timerRunning: true });
      },

      checkCompletion: () => {
        const { puzzle, inputtedLetters } = get();
        if (!puzzle) return false;

        for (let r = 0; r < puzzle.size; r++) {
          for (let c = 0; c < puzzle.size; c++) {
            const cell = puzzle.grid[r][c];
            if (cell.isBlack || !cell.letter) continue;
            const key = cellKey(r, c);
            if (inputtedLetters[key] !== cell.letter) return false;
          }
        }

        get().completePuzzle();
        return true;
      },

      completePuzzle: () => {
        const { puzzle, difficulty, timerSeconds, history, bestTimes, revealedCells } = get();
        if (!puzzle) return;

        const hasReveals = Object.values(revealedCells).some(Boolean);
        const record: CompletedPuzzle = {
          id: `${Date.now()}`,
          difficulty,
          completedAt: Date.now(),
          timeSeconds: timerSeconds,
          revealed: hasReveals,
        };

        const newBestTimes = { ...bestTimes };
        if (!newBestTimes[difficulty] || timerSeconds < (newBestTimes[difficulty] ?? Infinity)) {
          newBestTimes[difficulty] = timerSeconds;
        }

        set({
          isComplete: true,
          timerRunning: false,
          history: [record, ...history].slice(0, 100),
          bestTimes: newBestTimes,
          inProgressPuzzle: null,
          inProgressLetters: {},
          inProgressTimer: 0,
        });
      },
    }),
    {
      name: 'crossword-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        history: state.history,
        bestTimes: state.bestTimes,
        inProgressPuzzle: state.inProgressPuzzle,
        inProgressLetters: state.inProgressLetters,
        inProgressDifficulty: state.inProgressDifficulty,
        inProgressTimer: state.inProgressTimer,
      }),
    }
  )
);
