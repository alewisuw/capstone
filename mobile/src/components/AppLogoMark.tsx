import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { logoXml } from './AppLogo';

type AppLogoMarkProps = {
  size?: number;
};

const AppLogoMark: React.FC<AppLogoMarkProps> = ({ size = 44 }) => {
  const svgHeight = Math.round(size * 2.4);
  const translateY = Math.round(-size * 0.7);

  return (
    <View style={[styles.clip, { width: size, height: size }]}>
      <SvgXml
        xml={logoXml}
        width={size}
        height={svgHeight}
        style={{ transform: [{ translateY }] }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});

export default AppLogoMark;
