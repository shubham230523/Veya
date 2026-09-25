import React from 'react';
import { Stack, DefaultTheme, DarkTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '../core/theme';
import { ToastProvider } from '../components/ui/Toast';
import '../global.css';

const queryClient = new QueryClient();

function RootContent() {
  const { mode, colors } = useTheme();

  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

  const dynamicNavTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.bg,
      card: colors.bg,
      border: colors.surfaceBorder,
      text: colors.textPrimary,
    },
  };

  return (
    <NavThemeProvider value={dynamicNavTheme}>
      <ToastProvider>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="skill/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="skill/create" options={{ headerShown: false }} />
          <Stack.Screen name="workflow/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="workflow/output" options={{ headerShown: false }} />
        </Stack>
      </ToastProvider>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
