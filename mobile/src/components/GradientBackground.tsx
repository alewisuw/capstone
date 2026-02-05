import React from 'react';
import { ImageBackground, StyleProp, ViewStyle, ImageStyle } from 'react-native';

type GradientBackgroundProps = {
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  children?: React.ReactNode;
};

const gradientImage = require('../../assets/background_gradient.jpeg');

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  style,
  imageStyle,
  children,
}) => {
  return (
    <ImageBackground
      source={gradientImage}
      style={style}
      imageStyle={[{ resizeMode: 'cover' }, imageStyle]}
    >
      {children}
    </ImageBackground>
  );
};

export default GradientBackground;
