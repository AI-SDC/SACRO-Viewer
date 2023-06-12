const tailwindForms = require("@tailwindcss/forms");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["sacro/templates/**/*.html"],
  theme: {
    extend: {
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1rem",
          lg: "2rem",
          xl: "3rem",
          "2xl": "3rem",
        },
      },
    },
  },
  plugins: [tailwindForms],
};
