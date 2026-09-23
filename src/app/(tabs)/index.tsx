import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Sparkles, ArrowRight, Layers, Compass, PlusCircle } from 'lucide-react-native';
import { useTheme, spacing, radius, palette } from '../../core/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SkillCard } from '../../components/SkillCard';
import { skillService } from '../../features/skills/skillService';
import { parseIntentFromPrompt } from '../../core/ai/intentParser';
import { WorkflowComposer } from '../../core/ai/workflowComposer';
import { CanonicalSkill } from '../../types/skill';
import { SEED_WORKFLOWS } from '../../core/database/seed';

export default function HomeScreen() {
  const { colors } = useTheme();
  const [goalPrompt, setGoalPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [popularSkills, setPopularSkills] = useState<CanonicalSkill[]>([]);

  useEffect(() => {
    loadPopularSkills();
  }, []);

  const loadPopularSkills = async () => {
    const skills = await skillService.getSkills();
    setPopularSkills(skills.slice(0, 4));
  };

  const handleComposeWorkflow = async (promptText?: string) => {
    const textToParse = promptText || goalPrompt;
    if (!textToParse.trim()) return;

    setLoading(true);
    try {
      const allSkills = await skillService.getSkills();
      const parsedIntent = parseIntentFromPrompt(textToParse, allSkills);
      const workflow = WorkflowComposer.composeFromIntent(parsedIntent, allSkills);

      // Navigate straight to Workflow Editor
      router.push({
        pathname: '/workflow/[id]',
        params: { id: workflow.id, initialWorkflow: JSON.stringify(workflow) },
      });
    } finally {
      setLoading(false);
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

          <View style={[styles.inputBox, { backgroundColor: colors.surfaceHover, borderColor: colors.surfaceBorder }]}>
            <TextInput
              multiline
              onChangeText={setGoalPrompt}
              placeholder="e.g. 'I want to build an AI-powered note-taking app that transcribes audio and organizes notes.'"
              placeholderTextColor={colors.textMuted}
              style={[styles.textInput, { color: colors.textPrimary }]}
              value={goalPrompt}
            />
          </View>

          <Button
            icon={<ArrowRight color="#FFFFFF" size={16} />}
            iconPosition="right"
            loading={loading}
            onPress={() => handleComposeWorkflow()}
            style={styles.actionButton}
            title="Compose Workflow"
          />

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

        {SEED_WORKFLOWS.map((wf) => (
          <Card
            key={wf.id}
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
        ))}

        {/* POPULAR SKILLS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Popular Skills</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/discover')}>
            <Text style={[styles.seeAllText, { color: palette.primaryLight }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {popularSkills.map((skill) => (
          <SkillCard key={skill.id} onSaveToggle={loadPopularSkills} skill={skill} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  heroCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  inputBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 80,
  },
  textInput: {
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  actionButton: {
    marginBottom: spacing.lg,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
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
    marginBottom: spacing.lg,
  },
  quickBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  quickBoxText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
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
  workflowCard: {
    marginBottom: spacing.md,
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
