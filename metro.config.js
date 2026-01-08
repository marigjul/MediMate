const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add .cjs to source extensions to handle Firebase internal files
defaultConfig.resolver.sourceExts.push('cjs');

// Disable package exports for compatibility with older Firebase SDK patterns
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
