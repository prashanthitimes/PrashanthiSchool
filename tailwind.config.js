/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#8f1e7a",
          light: "#a63d93",
          soft: "#e9d1e4", // Added this very light version
          accent: "#F3E8F1", 
          dark: "#6b165c",
        },
      },
    },
  },
  plugins: [],
};