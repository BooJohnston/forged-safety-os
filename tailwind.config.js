/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0a0e1a', 2: '#111827', 3: '#1a1f35', 4: '#0d1225' },
        bdr: { DEFAULT: '#2a3150', 2: '#3a4570' },
        t: { 1: '#e8ecf4', 2: '#8b95b0', 3: '#5a6480' },
        acc: { DEFAULT: '#f97316', 2: '#fb923c', dark: 'rgba(249,115,22,.12)' },
        sev: { low: '#22c55e', mod: '#fbbf24', high: '#f97316', crit: '#ef4444' }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    }
  },
  plugins: []
}
