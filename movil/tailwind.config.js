/**
 * One source of design tokens for Android and web.
 *
 * Colours are named by role rather than by hue — `brand`, `wash`,
 * `exito` — so a palette change is one edit here instead of a sweep
 * through hundreds of class strings. The names match the ones the web
 * app already uses, which is what lets its markup move across almost
 * unchanged.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1d4ed8', bright: '#2563eb', soft: '#dbeafe' },
        wash: '#f8fafc',
        exito: '#65a30d',
        alerta: '#d97706',
        error: '#e11d48',
      },
    },
  },
  plugins: [],
};
