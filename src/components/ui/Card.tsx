import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp, TouchableOpacityProps } from 'react-native';
import { useTheme, spacing, radius } from '../../core/theme';

export interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  bordered = true,
  ...props
}) => {
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderColor: bordered ? colors.surfaceBorder : 'transparent',
    borderWidth: bordered ? 1 : 0,
    borderRadius: radius.lg,
    padding: spacing.lg,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.card, containerStyle, style]}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, containerStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
