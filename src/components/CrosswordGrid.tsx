import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import type { Cell } from '../types/crossword';

const COLORS = {
  background: '#1a1f3c',
  surface: '#252b4a',
  cellWhite: '#f8f9fa',
  cellBlack: '#1a1f3c',
  cellSelected: '#f5c518',
  cellWord: '#fff3b0',
  cellCorrect: '#48bb78',
  cellIncorrect: '#fc8181',
  cellRevealed: '#bee3f8',
  textPrimary: '#ffffff',
  textDark: '#1a1f3c',
  border: '#4a5568',
};

interface CrosswordGridProps {
  grid: Cell[][];
  size: number;
  inputtedLetters: Record<string, string>;
  checkedCells: Record<string, boolean>;
  revealedCells: Record<string, boolean>;
  incorrectCells: Record<string, boolean>;
  selectedCell: { row: number; col: number } | null;
  selectedWordCells: Array<{ row: number; col: number }>;
  onCellPress: (row: number, col: number) => void;
}

function cellKey(row: number, col: number) {
  return `${row},${col}`;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CrosswordGrid: React.FC<CrosswordGridProps> = ({
  grid,
  size,
  inputtedLetters,
  checkedCells,
  revealedCells,
  incorrectCells,
  selectedCell,
  selectedWordCells,
  onCellPress,
}) => {
  // Minimum 36px per cell (NFR-004: accessibility tap targets)
  // ScrollView allows horizontal scroll for larger grids
  const cellSize = Math.max(
    36,
    Math.min(Math.floor((SCREEN_WIDTH - 32) / size), 44)
  );

  const getCellStyle = useCallback(
    (row: number, col: number, cell: Cell) => {
      if (cell.isBlack) {
        return [styles.cell, { width: cellSize, height: cellSize, backgroundColor: COLORS.cellBlack }];
      }

      const key = cellKey(row, col);
      const isSelected = selectedCell?.row === row && selectedCell?.col === col;
      const isInWord = selectedWordCells.some(c => c.row === row && c.col === col);
      const isIncorrect = incorrectCells[key];
      const isRevealed = revealedCells[key];
      const isCheckedCorrect = checkedCells[key] && !isIncorrect;

      let bgColor = COLORS.cellWhite;
      if (isSelected) bgColor = COLORS.cellSelected;
      else if (isInWord) bgColor = COLORS.cellWord;
      else if (isIncorrect) bgColor = COLORS.cellIncorrect;
      else if (isRevealed) bgColor = COLORS.cellRevealed;
      else if (isCheckedCorrect) bgColor = COLORS.cellCorrect;

      return [styles.cell, { width: cellSize, height: cellSize, backgroundColor: bgColor }];
    },
    [selectedCell, selectedWordCells, incorrectCells, revealedCells, checkedCells, cellSize]
  );

  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.scrollContent}
      showsHorizontalScrollIndicator={false}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.grid, { borderWidth: 2, borderColor: COLORS.border }]}>
          {grid.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((cell, colIdx) => {
                const key = cellKey(rowIdx, colIdx);
                const letter = cell.isBlack ? null : (inputtedLetters[key] ?? '');
                const cellStyle = getCellStyle(rowIdx, colIdx, cell);

                return (
                  <TouchableOpacity
                    key={colIdx}
                    onPress={() => !cell.isBlack && onCellPress(rowIdx, colIdx)}
                    disabled={cell.isBlack}
                    activeOpacity={cell.isBlack ? 1 : 0.7}
                    style={cellStyle}
                    hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
                    accessible={!cell.isBlack}
                    accessibilityRole="button"
                    accessibilityLabel={
                      cell.isBlack
                        ? undefined
                        : `Cell row ${rowIdx + 1} column ${colIdx + 1}${cell.number !== undefined ? `, number ${cell.number}` : ''}${inputtedLetters[key] ? `, letter ${inputtedLetters[key].toUpperCase()}` : ', empty'}`
                    }
                  >
                    {cell.number !== undefined && (
                      <Text
                        style={[
                          styles.cellNumber,
                          { fontSize: Math.max(6, cellSize * 0.25) },
                          { color: cell.isBlack ? COLORS.textPrimary : COLORS.textDark },
                        ]}
                      >
                        {cell.number}
                      </Text>
                    )}
                    {!cell.isBlack && letter ? (
                      <Text
                        style={[
                          styles.cellLetter,
                          {
                            fontSize: Math.max(10, cellSize * 0.55),
                            color: COLORS.textDark,
                          },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {letter.toUpperCase()}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cellNumber: {
    position: 'absolute',
    top: 1,
    left: 2,
    fontWeight: '700',
    lineHeight: 10,
  },
  cellLetter: {
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
});
