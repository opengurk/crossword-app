import type { Cell, Clue, CrosswordPuzzle, Difficulty } from '../types/crossword';
import wordListData from '../data/wordList.json';

const GRID_SIZES: Record<Difficulty, number> = {
  easy: 9,
  medium: 13,
  hard: 15,
};

const MAX_WORDS_PER_LENGTH: Record<Difficulty, number> = {
  easy: 80,
  medium: 150,
  hard: 200,
};

type WordList = Record<string, string[]>;
const wordList = wordListData as WordList;

// Simple seeded PRNG (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createEmptyGrid(size: number): Cell[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      letter: null,
      isBlack: true,
    }))
  );
}

interface PlacedWord {
  word: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

function canPlace(
  grid: Cell[][],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down',
  size: number
): boolean {
  const dr = direction === 'down' ? 1 : 0;
  const dc = direction === 'across' ? 1 : 0;

  // Check bounds
  const endRow = row + dr * (word.length - 1);
  const endCol = col + dc * (word.length - 1);
  if (endRow >= size || endCol >= size || row < 0 || col < 0) return false;

  // Check cell before word start (must be boundary or black)
  const prevRow = row - dr;
  const prevCol = col - dc;
  if (prevRow >= 0 && prevCol >= 0) {
    const prevCell = grid[prevRow][prevCol];
    if (!prevCell.isBlack) return false;
  }

  // Check cell after word end (must be boundary or black)
  const nextRow = row + dr * word.length;
  const nextCol = col + dc * word.length;
  if (nextRow < size && nextCol < size) {
    const nextCell = grid[nextRow][nextCol];
    if (!nextCell.isBlack) return false;
  }

  // Check each position
  let hasIntersection = false;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const cell = grid[r][c];

    if (cell.isBlack) {
      // Empty cell – check perpendicular neighbors don't create unwanted adjacency
      const perpR1 = r + dc;
      const perpC1 = c + dr;
      const perpR2 = r - dc;
      const perpC2 = c - dr;
      if (perpR1 < size && perpC1 < size && perpR1 >= 0 && perpC1 >= 0 && !grid[perpR1][perpC1].isBlack) {
        // Neighbor exists – we'd create an unintended word segment, disallow
        return false;
      }
      if (perpR2 >= 0 && perpC2 >= 0 && !grid[perpR2][perpC2].isBlack) {
        return false;
      }
    } else {
      // Cell already has a letter
      if (cell.letter !== word[i]) return false;
      hasIntersection = true;
    }
  }

  return hasIntersection || true; // allow first word without intersection
}

function placeWord(
  grid: Cell[][],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down'
): void {
  const dr = direction === 'down' ? 1 : 0;
  const dc = direction === 'across' ? 1 : 0;

  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    grid[r][c] = {
      ...grid[r][c],
      letter: word[i],
      isBlack: false,
    };
  }
}

function unplaceWord(
  grid: Cell[][],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down',
  originalCells: Array<{ r: number; c: number; cell: Cell }>
): void {
  for (const { r, c, cell } of originalCells) {
    grid[r][c] = cell;
  }
}

// Find positions where a new word can intersect existing words
function findIntersectionPositions(
  grid: Cell[][],
  word: string,
  direction: 'across' | 'down',
  size: number
): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = [];
  const dr = direction === 'down' ? 1 : 0;
  const dc = direction === 'across' ? 1 : 0;

  // For each cell in the grid that has a letter
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c].isBlack) continue;
      const existingLetter = grid[r][c].letter;
      if (!existingLetter) continue;

      // Try each position in the word that matches this letter
      for (let i = 0; i < word.length; i++) {
        if (word[i] !== existingLetter) continue;

        const startRow = r - dr * i;
        const startCol = c - dc * i;

        if (canPlaceWithIntersection(grid, word, startRow, startCol, direction, size)) {
          positions.push({ row: startRow, col: startCol });
        }
      }
    }
  }

  return positions;
}

function canPlaceWithIntersection(
  grid: Cell[][],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down',
  size: number
): boolean {
  const dr = direction === 'down' ? 1 : 0;
  const dc = direction === 'across' ? 1 : 0;

  // Check bounds
  const endRow = row + dr * (word.length - 1);
  const endCol = col + dc * (word.length - 1);
  if (endRow >= size || endCol >= size || row < 0 || col < 0) return false;

  // Check cell before word start
  const prevRow = row - dr;
  const prevCol = col - dc;
  if (prevRow >= 0 && prevCol >= 0 && !grid[prevRow][prevCol].isBlack) return false;

  // Check cell after word end
  const nextRow = row + dr * word.length;
  const nextCol = col + dc * word.length;
  if (nextRow < size && nextCol < size && !grid[nextRow][nextCol].isBlack) return false;

  let intersections = 0;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const cell = grid[r][c];

    if (!cell.isBlack) {
      if (cell.letter !== word[i]) return false;
      intersections++;
    } else {
      // Check perpendicular neighbors won't create adjacency issues
      const perpR1 = r + dc;
      const perpC1 = c + dr;
      const perpR2 = r - dc;
      const perpC2 = c - dr;
      if (perpR1 < size && perpC1 < size && perpR1 >= 0 && perpC1 >= 0 && !grid[perpR1][perpC1].isBlack) {
        return false;
      }
      if (perpR2 >= 0 && perpC2 >= 0 && perpR2 < size && perpC2 < size && !grid[perpR2][perpC2].isBlack) {
        return false;
      }
    }
  }

  return intersections > 0;
}

function numberGrid(grid: Cell[][], size: number): void {
  let num = 1;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c].isBlack) continue;

      const startsAcross =
        (c === 0 || grid[r][c - 1].isBlack) &&
        c + 1 < size &&
        !grid[r][c + 1].isBlack;

      const startsDown =
        (r === 0 || grid[r - 1][c].isBlack) &&
        r + 1 < size &&
        !grid[r + 1][c].isBlack;

      if (startsAcross || startsDown) {
        grid[r][c].number = num++;
      }
    }
  }
}

function extractClues(
  grid: Cell[][],
  size: number,
  placedWords: PlacedWord[]
): { across: Clue[]; down: Clue[] } {
  const across: Clue[] = [];
  const down: Clue[] = [];

  // Build lookup for placed words by position and direction
  const wordMap = new Map<string, string>();
  for (const pw of placedWords) {
    wordMap.set(`${pw.row},${pw.col},${pw.direction}`, pw.word);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = grid[r][c];
      if (cell.isBlack || !cell.number) continue;

      const num = cell.number;

      // Check across
      if ((c === 0 || grid[r][c - 1].isBlack) && c + 1 < size && !grid[r][c + 1].isBlack) {
        const word = wordMap.get(`${r},${c},across`) || extractWordFromGrid(grid, r, c, 'across', size);
        const clue: Clue = {
          id: `${num}-across`,
          number: num,
          direction: 'across',
          text: generateClue(word),
          answer: word,
          row: r,
          col: c,
          length: word.length,
        };
        across.push(clue);
      }

      // Check down
      if ((r === 0 || grid[r - 1][c].isBlack) && r + 1 < size && !grid[r + 1][c].isBlack) {
        const word = wordMap.get(`${r},${c},down`) || extractWordFromGrid(grid, r, c, 'down', size);
        const clue: Clue = {
          id: `${num}-down`,
          number: num,
          direction: 'down',
          text: generateClue(word),
          answer: word,
          row: r,
          col: c,
          length: word.length,
        };
        down.push(clue);
      }
    }
  }

  return { across, down };
}

function extractWordFromGrid(
  grid: Cell[][],
  row: number,
  col: number,
  direction: 'across' | 'down',
  size: number
): string {
  const dr = direction === 'down' ? 1 : 0;
  const dc = direction === 'across' ? 1 : 0;
  let word = '';
  let r = row;
  let c = col;
  while (r < size && c < size && !grid[r][c].isBlack) {
    word += grid[r][c].letter ?? '?';
    r += dr;
    c += dc;
  }
  return word;
}

function generateClue(word: string): string {
  const clueTemplates = [
    `${word.toUpperCase()} (${word.length} letters)`,
    `Common word: ___ (${word.length} letters)`,
    `Fill in: "${word[0]}${'_'.repeat(word.length - 1)}"`,
    `${word.length}-letter word starting with "${word[0].toUpperCase()}"`,
    `Word meaning something (${word.length} letters)`,
  ];
  const idx = word.charCodeAt(0) % clueTemplates.length;
  return clueTemplates[idx];
}

// Tag each cell with its word IDs
function tagCells(grid: Cell[][], placedWords: PlacedWord[], size: number): void {
  for (const pw of placedWords) {
    const dr = pw.direction === 'down' ? 1 : 0;
    const dc = pw.direction === 'across' ? 1 : 0;
    for (let i = 0; i < pw.word.length; i++) {
      const r = pw.row + dr * i;
      const c = pw.col + dc * i;
      if (pw.direction === 'across') {
        grid[r][c].acrossWord = `${pw.row},${pw.col},across`;
      } else {
        grid[r][c].downWord = `${pw.row},${pw.col},down`;
      }
    }
  }
}

export function generateCrossword(difficulty: Difficulty): CrosswordPuzzle {
  const _startTime = Date.now(); // NFR-001: generation time guard
  const size = GRID_SIZES[difficulty];
  const maxWords = MAX_WORDS_PER_LENGTH[difficulty];
  const seed = _startTime;
  const rng = mulberry32(seed);

  // Get candidate words for this grid size
  const candidateWords: string[] = [];
  for (let len = 3; len <= size; len++) {
    const words = (wordList[String(len)] ?? []).slice(0, maxWords);
    candidateWords.push(...words);
  }

  const shuffledWords = shuffle(candidateWords, rng);
  const grid = createEmptyGrid(size);
  const placedWords: PlacedWord[] = [];
  const usedWords = new Set<string>();

  // Place first word horizontally near the top
  const firstWord = shuffledWords.find(w => w.length >= Math.min(5, size - 2) && w.length <= size - 2);
  if (!firstWord) {
    // Fallback: use any word
    return generateFallbackPuzzle(difficulty);
  }

  const firstRow = 1;
  const firstCol = Math.floor((size - firstWord.length) / 2);
  placeWord(grid, firstWord, firstRow, firstCol, 'across');
  placedWords.push({ word: firstWord, row: firstRow, col: firstCol, direction: 'across' });
  usedWords.add(firstWord);

  // Try to place more words
  let attempts = 0;
  const maxAttempts = shuffledWords.length * 2;

  while (attempts < maxAttempts && placedWords.length < size * 2) {
    attempts++;
    const wordToPlace = shuffledWords[attempts % shuffledWords.length];
    if (!wordToPlace || usedWords.has(wordToPlace)) continue;

    // Alternate direction based on which is less common
    const acrossCount = placedWords.filter(w => w.direction === 'across').length;
    const downCount = placedWords.filter(w => w.direction === 'down').length;
    const preferredDir = acrossCount <= downCount ? 'across' : 'down';
    const directions: Array<'across' | 'down'> = [preferredDir, preferredDir === 'across' ? 'down' : 'across'];

    for (const dir of directions) {
      const positions = findIntersectionPositions(grid, wordToPlace, dir, size);
      if (positions.length === 0) continue;

      const shuffledPositions = shuffle(positions, rng);
      const pos = shuffledPositions[0];

      placeWord(grid, wordToPlace, pos.row, pos.col, dir);
      placedWords.push({ word: wordToPlace, row: pos.row, col: pos.col, direction: dir });
      usedWords.add(wordToPlace);
      break;
    }
  }

  // Must have at least some words
  if (placedWords.length < 4) {
    return generateFallbackPuzzle(difficulty);
  }

  // Tag cells with word IDs and number the grid
  tagCells(grid, placedWords, size);
  numberGrid(grid, size);

  const { across, down } = extractClues(grid, size, placedWords);

  // Need at least some clues of each type
  if (across.length < 2 || down.length < 2) {
    return generateFallbackPuzzle(difficulty);
  }

  const _elapsed = Date.now() - _startTime;
  if (_elapsed > 2000) {
    console.warn(`[CrosswordGenerator] Generation took ${_elapsed}ms (>2s threshold)`);
  }

  return {
    grid,
    acrossClues: across,
    downClues: down,
    size,
    difficulty,
  };
}

// Fallback: create a simple hand-crafted small puzzle if generation fails
function generateFallbackPuzzle(difficulty: Difficulty): CrosswordPuzzle {
  const size = GRID_SIZES[difficulty];
  const grid = createEmptyGrid(size);

  // Place a few words manually
  const words = [
    { word: 'PUZZLE', row: 1, col: 1, direction: 'across' as const },
    { word: 'PLAY', row: 1, col: 1, direction: 'down' as const },
    { word: 'GAME', row: 3, col: 3, direction: 'across' as const },
    { word: 'WORD', row: 1, col: 4, direction: 'down' as const },
  ].filter(w => w.col + (w.direction === 'across' ? w.word.length : 1) <= size &&
                w.row + (w.direction === 'down' ? w.word.length : 1) <= size);

  for (const { word, row, col, direction } of words) {
    placeWord(grid, word.toLowerCase(), row, col, direction);
  }

  tagCells(grid, words.map(w => ({ ...w, word: w.word.toLowerCase() })), size);
  numberGrid(grid, size);

  const { across, down } = extractClues(
    grid, size,
    words.map(w => ({ ...w, word: w.word.toLowerCase() }))
  );

  return {
    grid,
    acrossClues: across,
    downClues: down,
    size,
    difficulty,
  };
}
