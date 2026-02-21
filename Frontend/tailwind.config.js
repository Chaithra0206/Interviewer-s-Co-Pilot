/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0A0A0A',
          surface: '#111111',
          border: '#1F1F1F',
          hover: '#1A1A1A',
        },
        'atomic-orange': {
          DEFAULT: '#FF6B35',
          light: '#FF8F65',
          dark: '#CC5529',
          glow: 'rgba(255,107,53,0.15)',
        },
        'electric-blue': {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
          glow: 'rgba(59,130,246,0.15)',
        },
        'savage-emerald': {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
          glow: 'rgba(16,185,129,0.15)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px 0 rgba(255,107,53,0.0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(255,107,53,0.25)' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}