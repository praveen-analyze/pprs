/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#EFF6FF',100:'#DBEAFE',200:'#BFDBFE',300:'#93C5FD',400:'#60A5FA',500:'#3B82F6',600:'#185FA5',700:'#1D4ED8',800:'#1E40AF',900:'#1E3A8A' },
      },
      animation: {
        'fade-in' : 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn  : { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp : { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      boxShadow: {
        card : '0 1px 3px 0 rgba(0,0,0,0.08)',
        panel: '0 4px 6px -1px rgba(0,0,0,0.07)',
      },
    },
  },
  plugins: [],
};
