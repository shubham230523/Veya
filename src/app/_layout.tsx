import React from 'react';
import { Stack, DarkTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, palette } from '../core/theme';
import { ToastProvider } from '../components/ui/Toast';

const queryClient = new QueryClient();

const VeyaNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.darkBg,
    card: palette.darkBg,
    border: palette.darkSurfaceBorder,
    text: palette.darkTextPrimary,
  },
};

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NavThemeProvider value={VeyaNavTheme}>
          <ToastProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.darkBg } }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="skill/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="skill/create" options={{ headerShown: false }} />
              <Stack.Screen name="workflow/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="workflow/output" options={{ headerShown: false }} />
            </Stack>
          </ToastProvider>
        </NavThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
