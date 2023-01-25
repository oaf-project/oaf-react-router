module.exports = {
  "roots": [
    "<rootDir>/src"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "testEnvironment": "jsdom",
  "collectCoverage": true,
  "coverageThreshold": {
    "global": {
      "branches": 100,
      "functions": 100,
      "lines": 100,
      "statements": 100
    }
  },
  // We mess with globals (window.document.title) in the tests so
  // this keeps them from interfering with each other.
  "maxConcurrency": 1
}
