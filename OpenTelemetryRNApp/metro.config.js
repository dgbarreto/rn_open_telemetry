const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfills for Node.js modules that OpenTelemetry might need
config.resolver.alias = {
  ...config.resolver.alias,
  crypto: 'react-native-get-random-values',
  stream: 'readable-stream',
  url: 'react-native-url-polyfill',
};

// Ensure these extensions are resolved
config.resolver.sourceExts.push('cjs');

// Handle package resolution for OpenTelemetry
config.resolver.unstable_enablePackageExports = true;

// Add any additional transformations for OpenTelemetry packages
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
