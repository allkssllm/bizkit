/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bizkit-green': '#0bb385', // KasirKuliner primary green
        'kasir-green': '#0b8a6a', // Darker green for header/hover
        'kasir-gray': '#f3f4f6', // Main content background
        'kasir-table-header': '#e5e7eb', // Table header
        'bizkit-dark': '#1f2937',
        'bizkit-darker': '#111827',
      }
    },
  },
  plugins: [],
}
