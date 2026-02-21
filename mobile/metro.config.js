// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('tsx', 'ts');
config.resolver.assetExts.push('ttf', 'otf');
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
