module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    ecmaVersion: 2018,
    sourceType: "module"
  },
  extends: [
    "typed-fp",
    "agile-digital",
  ],
  env: {
    "jest/globals": true,
    es6: true,
    browser: true,
  },
  plugins: [
    "jest",
    "react",
    "sonarjs",
    "functional",
    "jsx-a11y",
    "react-hooks",
    "@typescript-eslint",
    "prettier",
    "total-functions"
  ],
  rules: {},
  settings: {
    react: {
      version: "detect",
    },
  },
};
