/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#F1EFE9',
        canvas: '#F6F4EE',
        surface: '#FFFFFF',
        'surface-alt': '#F4F2EC',
        ink: '#16140F',
        'ink-muted': 'rgba(22,20,15,0.58)',
        'ink-faint': 'rgba(22,20,15,0.38)',
        line: 'rgba(20,16,10,0.08)',
        'line-strong': 'rgba(20,16,10,0.14)',
        success: '#1F8A5B',
        danger: '#D04F3C',
        'map-bg': '#EAE7DF',
        road: '#FFFFFF',
        block: '#E0DDD2',
        brand: '#3A5BD9',
        warm: '#F5A524',
      },
    },
  },
  plugins: [],
};
