/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        surface: '#111827',
        
        border: 'rgba(255, 255, 255, 0.08)',
        
        primary: '#3B82F6',
        cyan: '#06B6D4',
        success: '#22C55E',
        warning: '#F97316',
        purple: '#8B5CF6',
        error: '#EF4444',
        
        'text-main': '#FFFFFF',
        'text-secondary': '#A1A1AA',
        'text-muted': '#71717A',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
        'gradient-success': 'linear-gradient(135deg, #22C55E, #06B6D4)',
        'gradient-revenue': 'linear-gradient(135deg, #F97316, #EF4444)',
      },
      borderRadius: {
        "DEFAULT": "8px",
        "lg": "12px",
        "xl": "16px",
        "2xl": "24px",
        "full": "9999px"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Geist", "sans-serif"],
      },
      boxShadow: {
        'glass-layered': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glow-primary': '0 0 20px rgba(59, 130, 246, 0.3)',
      }
    }
  },
  plugins: [],
}
