/**
 * Tailwind theme configuration for the cpu-scheduler design system.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0d1117',
          1: '#161b22',
          2: '#21262d',
          3: '#30363d',
        },
        border: '#30363d',
        accent: {
          cyan: '#22d3ee',
          amber: '#f59e0b',
          green: '#22c55e',
          red: '#ef4444',
          purple: '#a855f7',
        },
        text: {
          primary: '#e6edf3',
          muted: '#8b949e',
          faint: '#484f58',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            opacity: '0.75',
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(34, 211, 238, 0.12)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.02)',
            boxShadow: '0 0 40px 8px rgba(34, 211, 238, 0.12)',
          },
        },
        'slide-in-left': {
          '0%': {
            opacity: '0',
            transform: 'translateX(-18px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'fade-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(16px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.5s ease-out both',
        'fade-up': 'fade-up 0.55s ease-out both',
      },
    },
  },
  plugins: [],
}

