import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Sparkles, Compass, Bookmark, User } from 'lucide-react-native';
import { useTheme, palette, radius, spacing } from '../../core/theme';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
          height: 60,
          paddingBottom: Platform.OS === 'web' ? 10 : 8,
          paddingTop: 6,
          ...(Platform.OS === 'web'
            ? {
                maxWidth: 800,
                alignSelf: 'center',
                width: '100%',
                borderRadius: radius.lg,
                marginBottom: spacing.md,
                borderWidth: 1,
                borderColor: colors.surfaceBorder,
                position: 'relative',
              }
            : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => <Bookmark color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
