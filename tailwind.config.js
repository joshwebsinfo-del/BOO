/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#059669', // Emerald Green representing Zimbabwe's nature/wealth
          hover: '#047857',
          light: '#ecfdf5',
        },
        secondary: {
          DEFAULT: '#d97706', // Gold representing Zimbabwe's minerals
          hover: '#b45309',
        },
        accent: {
          DEFAULT: '#dc2626', // Red representing the struggle/blood
        },
      }
    },
  },
  plugins: [],
}
