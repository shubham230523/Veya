import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { User, Moon, Shield, Database, Sparkles, Code2 } from 'lucide-react-native';
import { useTheme, spacing, radius, palette } from '../../core/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { isSupabaseConfigured } from '../../core/database/supabase';

export default function ProfileScreen() {
  const { mode, toggleTheme, colors } = useTheme();
  const supabaseConnected = isSupabaseConfigured();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: palette.primary }]}>
              <User color="#FFFFFF" size={28} />
            </View>
            <View>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>Developer Account</Text>
              <Text style={[styles.userEmail, { color: colors.textMuted }]}>dev@veya.app</Text>
              <Badge label="Master Build Plan MVP" style={{ marginTop: 4 }} variant="primary" />
            </View>
          </View>
        </Card>

        {/* APP SETTINGS */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>App Preferences</Text>
        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Moon color={palette.primaryLight} size={20} />
              <View>
                <Text style={[styles.settingText, { color: colors.textPrimary }]}>Dark Aesthetic Mode</Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>Toggle between dark and light themes</Text>
              </View>
            </View>
            <Switch
              onValueChange={toggleTheme}
              thumbColor="#FFFFFF"
              trackColor={{ false: colors.surfaceHover, true: palette.primary }}
              value={mode === 'dark'}
            />
          </View>
        </Card>

        {/* SYSTEM DIAGNOSTICS */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>System Diagnostics</Text>

        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Database color={palette.accent} size={20} />
              <View>
                <Text style={[styles.settingText, { color: colors.textPrimary }]}>Supabase Backend</Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                  {supabaseConnected ? 'Connected to live Supabase cloud' : 'Offline / In-Memory Mock Active'}
                </Text>
              </View>
            </View>
            <Badge
              label={supabaseConnected ? 'Live' : 'Mock Mode'}
              variant={supabaseConnected ? 'success' : 'warning'}
            />
          </View>
        </Card>

        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Sparkles color={palette.gemini} size={20} />
              <View>
                <Text style={[styles.settingText, { color: colors.textPrimary }]}>OpenRouter AI Client</Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>Gemini, Claude 3.5 & GPT-4o Adapters</Text>
              </View>
            </View>
            <Badge label="Active" variant="success" />
          </View>
        </Card>

        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Shield color={colors.success} size={20} />
              <View>
                <Text style={[styles.settingText, { color: colors.textPrimary }]}>Security Scanner Engine</Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>Static prompt injection & credential heuristics</Text>
              </View>
            </View>
            <Badge label="Active" variant="success" />
          </View>
        </Card>

        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Code2 color={palette.claude} size={20} />
              <View>
                <Text style={[styles.settingText, { color: colors.textPrimary }]}>Veya Version</Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>v1.0.0 (Expo SDK 57 / RN 0.86)</Text>
              </View>
            </View>
            <Badge label="v1.0.0" variant="secondary" />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  userCard: {
    marginBottom: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  settingCard: {
    marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
