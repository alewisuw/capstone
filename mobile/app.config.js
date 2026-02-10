const appJson = require('./app.json');
const { execSync } = require('child_process');

const getMapsKey = () => {
  const fromEnv = process.env.EXPO_PUBLIC_MAPS_ANDROID_KEY;
  if (fromEnv) return fromEnv;
  try {
    const value = execSync(
      'aws ssm get-parameter --name /billBoard/MAPS_ANDROID_KEY --with-decryption --query Parameter.Value --output text',
      { stdio: ['ignore', 'pipe', 'ignore'] }
    )
      .toString()
      .trim();
    return value || '';
  } catch (err) {
    return '';
  }
};

module.exports = () => {
  const base = appJson.expo || {};
  const android = base.android || {};

  return {
    ...base,
    android: {
      ...android,
      config: {
        ...(android.config || {}),
        googleMaps: {
          apiKey: getMapsKey(),
        },
      },
    },
  };
};
