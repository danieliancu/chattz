/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // Include toate fișierele din src care folosesc React (jsx și tsx)
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
