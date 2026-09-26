import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Bookmark, PlusCircle, ArrowRight, Layers } from 'lucide-react-native';
import { useTheme, spacing, radius, palette } from '../../core/theme';
import { Card } from '../../components/ui/Card';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { SkillCard } from '../../components/SkillCard';
import { skillService } from '../../features/skills/skillService';
import { workflowService } from '../../features/workflows/workflowService';
import { CanonicalSkill } from '../../types/skill';
import { Workflow } from '../../types/workflow';

export default function LibraryScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'saved' | 'created' | 'workflows'>('saved');
  const [savedSkills, setSavedSkills] = useState<CanonicalSkill[]>([]);
  const [createdSkills, setCreatedSkills] = useState<CanonicalSkill[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    if (tab === 'created' || tab === 'saved' || tab === 'workflows') {
      setActiveTab(tab);
    }
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      loadLibraryData();
    }, [activeTab])
  );

  const loadLibraryData = async () => {
    const saved = await skillService.getSavedSkills();
    setSavedSkills(saved);

    const all = await skillService.getSkills();
    const custom = all.filter(
      (s) =>
        s.source?.type === 'user_created' ||
        s.source?.type === 'imported' ||
        s.id.startsWith('skill-custom-') ||
        s.id.startsWith('idea-skill-') ||
        s.id.startsWith('web-found-') ||
        s.tags?.includes('Custom') ||
        s.tags?.includes('Researched') ||
        s.tags?.includes('Imported') ||
        s.tags?.includes('Web Discovered')
    );
    setCreatedSkills(custom);

    const activeWfs = await workflowService.getWorkflows();
    setWorkflows(activeWfs);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Container maxWidth={960}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>My Library</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Your saved skills, custom creations, and active workflows.
          </Text>

          {/* Tab Segment Controls */}
          <View style={[styles.segmentContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <TouchableOpacity
              onPress={() => setActiveTab('saved')}
              style={[styles.segment, activeTab === 'saved' && { backgroundColor: palette.primary }]}
            >
              <Text style={[styles.segmentText, { color: activeTab === 'saved' ? '#FFFFFF' : colors.textSecondary }]}>
                Saved ({savedSkills.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('created')}
              style={[styles.segment, activeTab === 'created' && { backgroundColor: palette.primary }]}
            >
              <Text style={[styles.segmentText, { color: activeTab === 'created' ? '#FFFFFF' : colors.textSecondary }]}>
                Created ({createdSkills.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('workflows')}
              style={[styles.segment, activeTab === 'workflows' && { backgroundColor: palette.primary }]}
            >
              <Text style={[styles.segmentText, { color: activeTab === 'workflows' ? '#FFFFFF' : colors.textSecondary }]}>
                Workflows ({workflows.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Rendering */}
        {activeTab === 'saved' && (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={savedSkills}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Bookmark color={colors.textMuted} size={32} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Saved Skills Yet</Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                  Bookmark skills from Discover or Home to easily access them here.
                </Text>
                <Button onPress={() => router.push('/(tabs)/discover')} style={{ marginTop: spacing.md }} title="Browse Skills" />
              </View>
            }
            renderItem={({ item }) => <SkillCard onSaveToggle={loadLibraryData} skill={item} />}
          />
        )}

        {activeTab === 'created' && (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={createdSkills}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <PlusCircle color={colors.textMuted} size={32} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Custom Skills Built</Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                  Build your own structured AI skill using our guided creator.
                </Text>
                <Button onPress={() => router.push('/skill/create')} style={{ marginTop: spacing.md }} title="Create Custom Skill" />
              </View>
            }
            renderItem={({ item }) => <SkillCard onSaveToggle={loadLibraryData} skill={item} />}
          />
        )}

        {activeTab === 'workflows' && (
          <ScrollView contentContainerStyle={styles.listContent}>
            {workflows.length === 0 ? (
              <View style={styles.emptyBox}>
                <Layers color={colors.textMuted} size={32} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Active Workflows</Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                  Describe your idea on the Home screen to compose your first AI workflow!
                </Text>
                <Button onPress={() => router.push('/(tabs)')} style={{ marginTop: spacing.md }} title="Compose Workflow" />
              </View>
            ) : (
              workflows.map((wf) => (
                <Card
                  key={wf.id}
                  onPress={() =>
                    router.push({
                      pathname: '/workflow/[id]',
                      params: { id: wf.id, initialWorkflow: JSON.stringify(wf) },
                    })
                  }
                  style={styles.wfCard}
                >
                  <View style={styles.wfHeader}>
                    <Text style={[styles.wfTitle, { color: colors.textPrimary }]}>{wf.name}</Text>
                    <Text style={[styles.wfBadge, { color: palette.primaryLight }]}>{wf.steps.length} Skills</Text>
                  </View>
                  <Text numberOfLines={2} style={[styles.wfGoal, { color: colors.textSecondary }]}>
                    "{wf.goal}"
                  </Text>
                  <View style={styles.wfFooter}>
                    <Text style={[styles.wfDate, { color: colors.textMuted }]}>
                      Updated: {new Date(wf.updated_at).toLocaleDateString()}
                    </Text>
                    <ArrowRight color={colors.textSecondary} size={14} />
                  </View>
                </Card>
              ))
            )}
          </ScrollView>
        )}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: spacing.lg,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: 60,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
  wfCard: {
    marginBottom: spacing.lg,
  },
  wfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  wfTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  wfBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  wfGoal: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  wfFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wfDate: {
    fontSize: 11,
  },
});
