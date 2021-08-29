module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    ecmaVersion: 2018,
    sourceType: "module"
  },
  extends: [
    "typed-fp",
    "plugin:react/recommended",
    "plugin:sonarjs/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:jest/recommended",
    "plugin:prettier/recommended",
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
  rules: {
    // https://reactjs.org/docs/hooks-rules.html
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
    // Don't need prop types when you have... actual types
    "react/prop-types": 0,
    "@typescript-eslint/ban-types": [
      "error",
      {
        types: {
          // https://github.com/danielnixon/readonly-types
          URL: {
            fixWith: "ReadonlyURL",
          },
          URLSearchParams: {
            fixWith: "ReadonlyURLSearchParams",
          },
          Date: {
            fixWith: "ReadonlyDate",
          },
          // https://github.com/pelotom/type-zoo
          Omit: {
            fixWith: "OmitStrict",
          },
          Exclude: {
            fixWith: "ExcludeStrict",
          },
        },
      },
    ],
    "no-restricted-globals": [
      "error",
      // Browser globals
      { name: "document" },
      { name: "window" },
      { name: "navigator" },
      // https://github.com/danielnixon/readonly-types
      { name: "URL" },
      { name: "URLSearchParams" },
      { name: "Date" },
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
