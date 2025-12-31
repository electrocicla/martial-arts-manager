/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        'dojo-red': '#E0022A',
        'dojo-orange': '#F97316',
        'dojo-dark': '#0F0F0F',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'particle': 'particle 20s linear infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #DC2626, 0 0 10px #DC2626, 0 0 15px #DC2626' },
          '100%': { boxShadow: '0 0 10px #DC2626, 0 0 20px #DC2626, 0 0 30px #DC2626' },
        },
        particle: {
          '0%': { transform: 'translateY(100vh) translateX(0px)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100px) translateX(100px)', opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backdropBlur: {
        xs: '2px',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  daisyui: {
    themes: [
      {
        martial: {
          "primary": "#E0022A",
          "primary-focus": "#B90023",
          "primary-content": "#FFFFFF",
          
          "secondary": "#F97316",
          "secondary-focus": "#EA580C",
          "secondary-content": "#FFFFFF",
          
          "accent": "#FCD34D",
          "accent-focus": "#FBBF24",
          "accent-content": "#000000",
          
          "neutral": "#1F2937",
          "neutral-focus": "#111827",
          "neutral-content": "#F3F4F6",
          
          "base-100": "#0F0F0F",
          "base-200": "#1A1A1A",
          "base-300": "#242424",
          "base-content": "#E5E7EB",
          
          "info": "#0EA5E9",
          "info-content": "#FFFFFF",
          
          "success": "#22C55E",
          "success-content": "#FFFFFF",
          
          "warning": "#F59E0B",
          "warning-content": "#000000",
          
          "error": "#DC2626",
          "error-content": "#FFFFFF",
          
          "--rounded-box": "0.75rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.98",
          "--border-btn": "2px",
          "--tab-border": "2px",
          "--tab-radius": "0.5rem",
        },
      },
    ],
    darkTheme: "martial",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
  },
  plugins: [
    require('tailwindcss-animate'),
    require('daisyui'),
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      });
    },
  ],
}
