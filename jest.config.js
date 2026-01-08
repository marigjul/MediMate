/**
 * Jest Configuration for MediMate
 */

module.exports = {
  preset: 'react-native',
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase|@firebase)",
  ],
  testTimeout: 20000,
};
