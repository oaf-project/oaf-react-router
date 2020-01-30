module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    ecmaVersion: 2018,
    sourceType: "module",
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:sonarjs/recommended",
    "plugin:functional/recommended",
    "plugin:functional/external-recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:jest/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier/@typescript-eslint",
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
    // TODO replace tslint's no-any and no-unsafe-any
    // See https://github.com/typescript-eslint/typescript-eslint/issues/791
  ],
  rules: {
    // Additional rules that are not part of `eslint:recommended`.
    // See https://eslint.org/docs/rules/
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-await-in-loop": "error",
    "no-new-wrappers": "error",
    "eqeqeq": "error",
    // https://reactjs.org/docs/hooks-rules.html
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
    // Don't need prop types when you have... actual types
    "react/prop-types": 0,
    // https://github.com/danielnixon/total-functions
    "no-array-subscript": "error",
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
