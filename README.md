# CrossWord Daily — Frontend

React Native + Expo crossword puzzle app with on-device puzzle generation.

## Quick Start

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `a` for Android emulator, `i` for iOS simulator.

## Stack

- **Expo SDK** ~52
- **React Native** 0.76
- **TypeScript** (strict mode)
- **Expo Router** (file-based navigation)
- **NativeWind** (Tailwind-style styling)
- **Zustand** with AsyncStorage persistence

## Project Structure

```
frontend/
├── app/
│   ├── _layout.tsx           # Root layout (Stack navigator)
│   ├── difficulty.tsx         # Difficulty selection screen
│   ├── complete.tsx           # Congratulations screen
│   └── (tabs)/
│       ├── _layout.tsx        # Tab navigator
│       ├── index.tsx          # Play / Game screen
│       └── stats.tsx          # Statistics screen
├── src/
│   ├── components/
│   │   ├── CrosswordGrid.tsx  # Grid renderer
│   │   ├── CluesList.tsx      # Across/Down clues list
│   │   └── Keyboard.tsx       # Custom on-screen keyboard
│   ├── data/
│   │   └── wordList.json      # ~6380 English words grouped by length
│   ├── lib/
│   │   └── crosswordGenerator.ts  # On-device puzzle generator
│   ├── store/
│   │   └── puzzleStore.ts     # Zustand store (game state + persistence)
│   └── types/
│       └── crossword.ts       # TypeScript types
├── assets/                    # App icons and splash (placeholder)
├── app.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
└── global.css
```

## Environment Variables

None required — everything runs on-device.

## Features

- On-device crossword puzzle generator (backtracking algorithm)
- Three difficulty levels: Easy (9×9), Medium (13×13), Hard (15×15)
- Custom QWERTY keyboard with auto-advance cursor
- Check puzzle (highlights correct/incorrect in green/red)
- Reveal cell or full puzzle
- Timer with background pause
- Stats persisted via AsyncStorage
- Animated congratulations screen
