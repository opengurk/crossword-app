/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#1a1f3c',
        surface: '#252b4a',
        'cell-white': '#f8f9fa',
        'cell-black': '#1a1f3c',
        'cell-selected': '#f5c518',
        'cell-word': '#fff3b0',
        'cell-correct': '#48bb78',
        'cell-incorrect': '#fc8181',
        'text-primary': '#ffffff',
        'text-secondary': '#a0aec0',
        border: '#4a5568',
        accent: '#f5c518',
      },
    },
  },
  plugins: [],
};
