module.exports = {
  packageManager: "yarn",
  reporters: ["clear-text", "progress", "dashboard"],
  testRunner: "jest",
  coverageAnalysis: "perTest",
  // checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  mutate: ["src/**/*.ts", "!src/**/*.test.ts"],
  thresholds: { high: 80, low: 60, break: 40 }
};
