/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // LatentSee AI x E-Commerce Color Palette
        primary: {
          // Deep Space Indigo - depth, intelligence, latent space feel
          900: '#0f1120', // darker variant
          800: '#1B1F3B', // main color
          700: '#2a2f56', // lighter variant
          600: '#3a4071', // even lighter
        },
        accent: {
          // Aurora Teal - insight highlight, energetic
          500: '#00C6AE',
          400: '#1dd1bc',
          300: '#3ddcc9',
          200: '#66e6d7',
        },
        secondary: {
          // Solar Purple - creativity, neural net vibes
          500: '#6C63FF',
          400: '#847eff',
          300: '#9c99ff',
          200: '#b5b3ff',
        },
        neutral: {
          // Muted Sand - soft neutral background
          100: '#E0DCC8',
          200: '#d4ceb5',
          300: '#c8c0a2',
          400: '#bcb18f',
        },
        alert: {
          // Signal Coral - sparing use for anomalies/alerts
          500: '#FF6B6B',
          400: '#ff8a8a',
          300: '#ffa8a8',
          200: '#ffc7c7',
        },
      },
      fontFamily: {
        // Typography System
        'heading': ['var(--font-sora)', 'Sora', 'system-ui', 'sans-serif'], // Headings / Logo
        'body': ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'], // Body Text
        'sans': ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h1': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h2': ['2rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'h3': ['1.5rem', { lineHeight: '1.3' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 198, 174, 0.3)',
        'glow-purple': '0 0 20px rgba(108, 99, 255, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 198, 174, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 198, 174, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}