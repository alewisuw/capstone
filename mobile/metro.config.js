// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Reduce the number of files Metro watches to prevent EMFILE errors
config.watchFolders = [__dirname];
config.resolver.sourceExts.push('tsx', 'ts');

// Exclude node_modules from watching in parent directories
config.watchFolders = config.watchFolders.filter(folder => {
  return !folder.includes('node_modules');
});

module.exports = config;

