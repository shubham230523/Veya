import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme, spacing, radius, palette } from '../../core/theme';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gemini'
  | 'claude'
  | 'gpt';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'secondary',
  style,
  icon,
}) => {
  const { colors } = useTheme();

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: 'rgba(99, 102, 241, 0.15)', text: palette.primaryLight };
      case 'success':
        return { bg: colors.successBg, text: colors.success };
      case 'warning':
        return { bg: colors.warningBg, text: colors.warning };
      case 'danger':
        return { bg: colors.dangerBg, text: colors.danger };
      case 'info':
        return { bg: colors.infoBg, text: colors.info };
      case 'gemini':
        return { bg: 'rgba(142, 117, 255, 0.15)', text: palette.gemini };
      case 'claude':
        return { bg: 'rgba(217, 119, 6, 0.15)', text: palette.claude };
      case 'gpt':
        return { bg: 'rgba(16, 163, 127, 0.15)', text: palette.gpt };
      case 'secondary':
      default:
        return { bg: colors.surfaceHover, text: colors.textSecondary };
    }
  };

  const colorScheme = getVariantColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colorScheme.bg },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.label, { color: colorScheme.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  icon: {
    marginRight: 4,
  },
});
