import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';

export interface ContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  maxWidth?: number;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  style,
  maxWidth = 1000,
}) => {
  return (
    <View
      style={[
        styles.wrapper,
        Platform.OS === 'web' && { maxWidth, alignSelf: 'center', width: '100%' },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
    paddingTop: Platform.OS === 'web' ? 32 : 20,
    paddingBottom: 24,
  },
});
