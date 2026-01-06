/**
 * Jest Configuration for MediMate
 *
 * Status: Configured and ready for testing implementation
 *
 * This configuration is set up for Expo + Firebase testing.
 * Tests will be implemented after core features are complete.
 *
 * To run tests: npm test
 */

module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/app/services/__tests__/setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase)",
  ],
  moduleNameMapper: {
    "^@env$": "<rootDir>/__mocks__/@env.js",
  },
  collectCoverageFrom: [
    "app/**/*.{js,jsx}",
    "!app/**/*.test.{js,jsx}",
    "!app/**/index.{js,jsx}",
  ],
  testTimeout: 20000,
  testPathIgnorePatterns: [
    "/node_modules/",
    "/app/services/__tests__/setup.js", // Ignorer setup.js som test
  ],
};
