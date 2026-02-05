// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Reduce the number of files Metro watches to prevent EMFILE errors
config.watchFolders = [__dirname];
config.resolver.sourceExts.push('tsx', 'ts');
config.resolver.assetExts.push('ttf', 'otf');
// Prefer React Native / browser builds over Node when resolving packages
config.resolver.resolverMainFields = ['react-native', 'browser', 'module', 'main'];
// Use legacy resolution to avoid pulling Node-specific builds (e.g., axios node bundle)
config.resolver.unstable_enablePackageExports = false;
// Force axios to resolve to the browser/RN build (avoid node/crypto)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'axios') {
    return context.resolveRequest(context, 'axios/dist/axios', platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Exclude node_modules from watching in parent directories
config.watchFolders = config.watchFolders.filter(folder => {
  return !folder.includes('node_modules');
});

module.exports = config;
