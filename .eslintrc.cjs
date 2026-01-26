module.exports = {
  ignorePatterns: ["sacro-app/dist", "sacro-app/out"],
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["airbnb-base", "prettier", "plugin:cypress/recommended"],
  plugins: ["prettier", "cypress"],
  overrides: [
    {
      files: ["sacro-app/**/*.js"],
      rules: {
        "no-console": ["off"],
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  settings: {
    "import/core-modules": ["electron", "electron-log", "portfinder"],
  },
  rules: {
    "prettier/prettier": "error",
    "import/order": [
      "error",
      {
        groups: [
          ["builtin", "external", "internal"],
          "parent",
          "sibling",
          "index",
        ],
        "newlines-between": "never",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
  },
};
