const tailwindForms = require("@tailwindcss/forms");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["sacro/templates/**/*.html"],
  theme: {
    extend: {},
  },
  plugins: [tailwindForms],
};
