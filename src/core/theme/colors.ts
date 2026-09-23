export const palette = {
  // Brand / Accent
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  accent: '#10B981', // Emerald
  accentLight: '#34D399',

  // Dark Theme Neutral
  darkBg: '#0F172A', // Slate 900
  darkSurface: '#1E293B', // Slate 800
  darkSurfaceBorder: '#334155', // Slate 700
  darkSurfaceHover: '#475569',
  darkTextPrimary: '#F8FAFC', // Slate 50
  darkTextSecondary: '#94A3B8', // Slate 400
  darkTextMuted: '#64748B', // Slate 500

  // Light Theme Neutral
  lightBg: '#F8FAFC',
  lightSurface: '#FFFFFF',
  lightSurfaceBorder: '#E2E8F0',
  lightSurfaceHover: '#F1F5F9',
  lightTextPrimary: '#0F172A',
  lightTextSecondary: '#475569',
  lightTextMuted: '#94A3B8',

  // Semantic
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.15)',

  // Providers
  gemini: '#8E75FF',
  claude: '#D97706',
  gpt: '#10A37F',
};

export type ThemeMode = 'dark' | 'light';

export const getThemeColors = (mode: ThemeMode = 'dark') => {
  const isDark = mode === 'dark';
  return {
    bg: isDark ? palette.darkBg : palette.lightBg,
    surface: isDark ? palette.darkSurface : palette.lightSurface,
    surfaceBorder: isDark ? palette.darkSurfaceBorder : palette.lightSurfaceBorder,
    surfaceHover: isDark ? palette.darkSurfaceHover : palette.lightSurfaceHover,
    textPrimary: isDark ? palette.darkTextPrimary : palette.lightTextPrimary,
    textSecondary: isDark ? palette.darkTextSecondary : palette.lightTextSecondary,
    textMuted: isDark ? palette.darkTextMuted : palette.lightTextMuted,
    primary: palette.primary,
    primaryLight: palette.primaryLight,
    accent: palette.accent,
    success: palette.success,
    successBg: palette.successBg,
    warning: palette.warning,
    warningBg: palette.warningBg,
    danger: palette.danger,
    dangerBg: palette.dangerBg,
    info: palette.info,
    infoBg: palette.infoBg,
  };
};
