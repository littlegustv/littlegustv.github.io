/** @type {import('tailwindcss').Config} */
module.exports = {
  // content: ["./*.html", "./_layouts/*.html", "./_includes/*.html"],
  content: ["./_site/**/*.html"],
  theme: {
    fontFamily: {
      body: ["Inter", "sans-serif"],
      display: ["Tilt Warp", "sans-serif"]
    },
    container: {
      center: true,
      padding: "1rem",
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      }
    },
    extend: {},
  },
  plugins: [],
};
