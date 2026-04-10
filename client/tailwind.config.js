/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#0F1117',
        surface: '#1A1D27',
        elevated: '#22263A',
        accent: '#E8845A',
        success: '#4CAF82',
        violet: '#7B6CF6',
        primary: '#F0EDE8',
        secondary: '#9A95A0',
        dimmed: '#5C5869',
        border: '#2A2D3E',
        fibre: '#B48C64',
        // Fill colors
        'success-fill': 'rgba(76, 175, 130, 0.15)',
        'accent-fill': 'rgba(232, 132, 90, 0.12)',
        'violet-fill': 'rgba(123, 108, 246, 0.12)',
        'fibre-fill': 'rgba(180, 140, 100, 0.15)',
      },
      fontFamily: {
        display: ['"Fraunces"', '"Playfair Display"', 'serif'],
        sans: ['"Inter"', '"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', '"JetBrains Mono"', 'monospace'],
      },
      maxWidth: {
        app: '480px'
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    }
  },
  plugins: []
};
