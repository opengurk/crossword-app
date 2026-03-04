export type Direction = 'across' | 'down';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Cell {
  letter: string | null;
  isBlack: boolean;
  number?: number;
  acrossWord?: string;  // word id for across word this cell belongs to
  downWord?: string;    // word id for down word this cell belongs to
}

export interface Clue {
  id: string;          // e.g. "3-across" or "5-down"
  number: number;
  direction: Direction;
  text: string;
  answer: string;
  row: number;
  col: number;
  length: number;
}

export interface CrosswordPuzzle {
  grid: Cell[][];
  acrossClues: Clue[];
  downClues: Clue[];
  size: number;
  difficulty: Difficulty;
}

export interface CompletedPuzzle {
  id: string;
  difficulty: Difficulty;
  completedAt: number;  // timestamp
  timeSeconds: number;
  revealed: boolean;
}
