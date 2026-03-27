/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'hospital-blue': '#0056b3',
        'hospital-blue-dark': '#004494',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

