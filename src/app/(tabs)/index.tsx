import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Sparkles, ArrowRight, Layers, Compass, PlusCircle } from 'lucide-react-native';
import { useTheme, spacing, radius, palette } from '../../core/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Container } from '../../components/ui/Container';
import { SkillCard } from '../../components/SkillCard';
import { skillService } from '../../features/skills/skillService';
import { workflowService } from '../../features/workflows/workflowService';
import { parseIntentWithAI } from '../../core/ai/intentParser';
import { WorkflowComposer } from '../../core/ai/workflowComposer';
import { CanonicalSkill } from '../../types/skill';
import { Workflow } from '../../types/workflow';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [goalPrompt, setGoalPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [streamProgress, setStreamProgress] = useState<string>('');
  const [popularSkills, setPopularSkills] = useState<CanonicalSkill[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<Workflow[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHomeScreenData();
    }, [])
  );

  const loadHomeScreenData = async () => {
    const skills = await skillService.getSkills();
    setPopularSkills(skills.slice(0, 4));

    const wfs = await workflowService.getWorkflows();
    setActiveWorkflows(wfs);
  };

  const handleComposeWorkflow = async (promptText?: string) => {
    const textToParse = promptText || goalPrompt;
    if (!textToParse.trim()) return;

    setLoading(true);
    setStreamProgress('⚡ Connecting to OpenRouter Stream...');
    try {
      // Dynamically research all required skills for this specific idea with streaming progress
      const researchedSkills = await skillService.researchWorkflowSkillsForIdea(
        textToParse,
        (accumulatedText) => {
          const cleanedText = accumulatedText.replace(/\s+/g, ' ');
          const previewText = cleanedText.length > 130
            ? '...' + cleanedText.slice(-130)
            : cleanedText;
          setStreamProgress(`Streaming AI Research: ${previewText}`);
        }
      );

      // Compose the multi-step workflow pipeline from researched skills
      const workflow = WorkflowComposer.composeFromResearchedSkills(textToParse, researchedSkills);

      // Save workflow for Library and Home persistence
      await workflowService.saveWorkflow(workflow);

      router.push({
        pathname: '/workflow/[id]',
        params: { id: workflow.id, initialWorkflow: JSON.stringify(workflow) },
      });
    } catch (err: any) {
      console.error('[Home Screen] Error in handleComposeWorkflow:', err.message);
    } finally {
      setLoading(false);
      setStreamProgress('');
    }
  };

  const QUICK_SUGGESTIONS = [
    'Build an AI note-taking app',
    'Architect a full-stack SaaS MVP',
    'Draft a YouTube channel strategy',
    'Perform code review & security audit',
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Container maxWidth={960}>
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={[styles.logoIcon, { backgroundColor: palette.primary }]}>
                <Sparkles color="#FFFFFF" size={20} />
              </View>
              <Text style={[styles.brandName, { color: colors.textPrimary }]}>VEYA</Text>
            </View>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>Universal AI Skill Engine</Text>
          </View>

          {/* HERO INTENT SECTION */}
          <Card style={styles.heroCard}>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
              What do you want to accomplish?
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Describe your goal in plain English. Veya will discover relevant Skills and compose an ordered Workflow.
            </Text>

            <TextInput
              multiline
              onBlur={() => setIsFocused(false)}
              onFocus={() => setIsFocused(true)}
              onChangeText={setGoalPrompt}
              placeholder="e.g. 'I want to build an AI-powered note-taking app that transcribes audio and organizes notes.'"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: isFocused ? colors.surface : colors.surfaceHover,
                  borderColor: isFocused ? palette.primary : colors.surfaceBorder,
                },
              ]}
              value={goalPrompt}
            />

            <Button
              disabled={loading}
              icon={loading ? undefined : <ArrowRight color="#FFFFFF" size={16} />}
              iconPosition="right"
              loading={loading}
              onPress={() => handleComposeWorkflow()}
              style={styles.actionButton}
              title={loading ? 'Composing AI Workflow...' : 'Compose Workflow'}
            />

            {loading && Boolean(streamProgress) && (
              <View style={[styles.streamProgressBox, { backgroundColor: colors.surfaceHover, borderColor: colors.surfaceBorder }]}>
                <Sparkles color={palette.primaryLight} size={16} />
                <Text numberOfLines={2} style={[styles.streamProgressText, { color: palette.primaryLight }]}>
                  {streamProgress}
                </Text>
              </View>
            )}

            {/* Quick suggestions */}
            <Text style={[styles.quickLabel, { color: colors.textMuted }]}>OR TRY A SUGGESTED GOAL:</Text>
            <View style={styles.suggestionsWrap}>
              {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setGoalPrompt(suggestion);
                    handleComposeWorkflow(suggestion);
                  }}
                  style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }]}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* QUICK ACCESS ACTIONS */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/discover')}
              style={[styles.quickBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            >
              <Compass color={palette.primaryLight} size={20} />
              <Text style={[styles.quickBoxText, { color: colors.textPrimary }]}>Explore Skills</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/skill/create')}
              style={[styles.quickBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            >
              <PlusCircle color={palette.accent} size={20} />
              <Text style={[styles.quickBoxText, { color: colors.textPrimary }]}>Create Skill</Text>
            </TouchableOpacity>
          </View>

          {/* RECOMMENDED WORKFLOWS */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Layers color={palette.primaryLight} size={18} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Featured Workflows</Text>
            </View>
          </View>

          {activeWorkflows.length === 0 ? (
            <Card style={{ marginBottom: spacing.xl, paddingVertical: spacing.lg, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                No saved workflows yet. Type a goal above to compose your first AI workflow!
              </Text>
            </Card>
          ) : (
            <View style={isDesktop ? styles.gridContainer : undefined}>
              {activeWorkflows.map((wf) => (
                <View key={wf.id} style={isDesktop ? styles.gridCol : undefined}>
                  <Card
                    onPress={() =>
                      router.push({
                        pathname: '/workflow/[id]',
                        params: { id: wf.id, initialWorkflow: JSON.stringify(wf) },
                      })
                    }
                    style={styles.workflowCard}
                  >
                    <View style={styles.wfHeader}>
                      <Text style={[styles.wfName, { color: colors.textPrimary }]}>{wf.name}</Text>
                      <Text style={[styles.wfStepsCount, { color: palette.primaryLight }]}>
                        {wf.steps.length} Skills
                      </Text>
                    </View>
                    <Text numberOfLines={2} style={[styles.wfGoal, { color: colors.textSecondary }]}>
                      "{wf.goal}"
                    </Text>
                    <View style={styles.wfFooter}>
                      <Text style={[styles.wfProvider, { color: colors.textMuted }]}>
                        Default: {wf.provider_id.toUpperCase()}
                      </Text>
                      <ArrowRight color={colors.textSecondary} size={14} />
                    </View>
                  </Card>
                </View>
              ))}
            </View>
          )}

          {/* POPULAR SKILLS */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Popular Skills</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/discover')}>
              <Text style={[styles.seeAllText, { color: palette.primaryLight }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {popularSkills.length === 0 ? (
            <Card style={{ marginBottom: spacing.xl, paddingVertical: spacing.lg, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                No skills found in database. Click "Create Skill" or seed your Supabase database to see skills!
              </Text>
            </Card>
          ) : (
            <View style={isDesktop ? styles.gridContainer : undefined}>
              {popularSkills.map((skill) => (
                <View key={skill.id} style={isDesktop ? styles.gridCol : undefined}>
                  <SkillCard onSaveToggle={loadHomeScreenData} skill={skill} />
                </View>
              ))}
            </View>
          )}
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 60,
  },
  header: {
    marginBottom: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  heroCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  textInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.lg,
    minHeight: 110,
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: 'top',
    outlineColor: 'transparent',
    outlineWidth: 0,
    ...({ outlineStyle: 'none' } as any),
  },
  actionButton: {
    marginBottom: spacing.md,
  },
  streamProgressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: spacing.xl,
  },
  streamProgressText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  quickBoxText: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  gridCol: {
    width: '50%',
    paddingHorizontal: spacing.xs,
  },
  workflowCard: {
    marginBottom: spacing.lg,
  },
  wfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  wfName: {
    fontSize: 16,
    fontWeight: '700',
  },
  wfStepsCount: {
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
  wfProvider: {
    fontSize: 11,
    fontWeight: '600',
  },
});
