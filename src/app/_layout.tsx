import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../core/theme';
import { ToastProvider } from '../components/ui/Toast';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="skill/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="skill/create" options={{ headerShown: false }} />
            <Stack.Screen name="workflow/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="workflow/output" options={{ headerShown: false }} />
          </Stack>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
