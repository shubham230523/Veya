import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme, spacing, radius } from '../../core/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  placeholderTextColor,
  multiline,
  ...props
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.surfaceBorder,
            minHeight: multiline ? 96 : 48,
            alignItems: multiline ? 'flex-start' : 'center',
            paddingVertical: multiline ? spacing.xs : 0,
          },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          multiline={multiline}
          placeholderTextColor={placeholderTextColor || colors.textMuted}
          style={[
            styles.input,
            { color: colors.textPrimary },
            multiline && { textAlignVertical: 'top' },
            inputStyle,
          ]}
          {...props}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
      {hint && !error && <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: spacing.xs,
  },
  iconLeft: {
    marginRight: spacing.sm,
    marginTop: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  error: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  hint: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
