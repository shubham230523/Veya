import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  SlidersHorizontal,
} from 'lucide-react-native';
import { useTheme, spacing, radius, palette } from '../../core/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Container } from '../../components/ui/Container';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';
import { useToast } from '../../components/ui/Toast';
import { skillService } from '../../features/skills/skillService';
import { scanSkillContent } from '../../core/security/securityScanner';
import { OpenRouterClient } from '../../core/ai/openrouterClient';
import { formatFullSkillPrompt } from '../../features/skills/skillFormatter';
import { SkillCategory } from '../../types/skill';

const CATEGORIES: SkillCategory[] = [
  'Coding',
  'AI',
  'Research',
  'Learning',
  'Creator',
  'Productivity',
  'Business',
  'Design',
  'Testing',
];

interface DraftSkillPayload {
  name: string;
  description: string;
  objective: string;
  instructions: string;
  rules: string[];
  expectedOutput: string;
  category: SkillCategory;
}

export default function CreateSkillScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [aiPrompt, setAiPrompt] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [instructions, setInstructions] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [rules, setRules] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Coding');

  const scanResult = scanSkillContent({
    name,
    description,
    objective,
    instructions,
    rules: [rules],
  });

  const livePromptPreview = formatFullSkillPrompt({
    name: name || 'Untitled Skill',
    objective,
    instructions,
    rules: rules.split('\n').filter((r) => r.trim().length > 0),
    expected_output: expectedOutput,
  });

  const handleCopyPreview = async () => {
    if (!livePromptPreview) return;
    await Clipboard.setStringAsync(livePromptPreview);
    setCopied(true);
    showToast('Generated Skill Prompt copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleAiDraft = async () => {
    if (!aiPrompt.trim()) return;
    setDrafting(true);

    try {
      const systemInstruction = `You are Veya AI Skill Architect.
Draft a structured canonical AI Skill JSON object from the user's description.

Return ONLY a JSON object matching this schema:
{
  "name": "Concise title",
  "description": "Short summary of what this skill accomplishes",
  "objective": "Clear primary goal statement",
  "instructions": "Detailed step-by-step instructions for the LLM executing this skill",
  "rules": ["Rule 1 constraint", "Rule 2 constraint"],
  "expectedOutput": "Specific deliverable structure description",
  "category": "One of: Coding, AI, Research, Learning, Creator, Productivity, Business, Design, Testing"
}`;

      const draft = await OpenRouterClient.generateStructuredJSON<DraftSkillPayload>(
        systemInstruction,
        aiPrompt
      );

      if (draft.name) setName(draft.name);
      if (draft.description) setDescription(draft.description);
      if (draft.objective) setObjective(draft.objective);
      if (draft.instructions) setInstructions(draft.instructions);
      if (draft.expectedOutput) setExpectedOutput(draft.expectedOutput);
      if (draft.rules && Array.isArray(draft.rules)) setRules(draft.rules.join('\n'));
      if (draft.category && CATEGORIES.includes(draft.category)) setCategory(draft.category);

      showToast('AI Skill generated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'AI Skill generation failed', 'error');
    } finally {
      setDrafting(false);
    }
  };

  const handleSaveSkill = async () => {
    if (!name.trim() || !instructions.trim() || !objective.trim()) {
      showToast('Please fill in Name, Objective, and Instructions', 'error');
      return;
    }

    if (scanResult.status === 'flagged') {
      showToast('Cannot save skill: Security scanner flagged high-risk issues', 'error');
      return;
    }

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'custom-skill';
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const created = await skillService.createSkill({
      name,
      slug,
      description,
      objective,
      instructions,
      inputs: [{ name: 'userContext', description: 'Context or target file', required: true }],
      prerequisites: ['Basic domain context'],
      steps: [
        { number: 1, title: 'Input Validation & Setup' },
        { number: 2, title: 'Core Execution & Processing' },
        { number: 3, title: 'Verification & Formatting' },
      ],
      rules: rules.split('\n').filter((r) => r.trim().length > 0),
      expected_output: expectedOutput || 'Structured Markdown deliverable.',
      visibility: 'public',
      version: 1,
      category,
      tags: [category, 'Custom'],
      providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
      source: {
        type: 'user_created',
        source_name: 'Custom User Skill',
        author: 'You',
      },
    });

    showToast('Custom skill published!', 'success');
    router.replace(`/skill/${created.id}`);
  };

  const hasDraftContent = Boolean(name.trim() || objective.trim() || instructions.trim());

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Container maxWidth={960}>
        {/* Top Navbar */}
        <View style={[styles.navbar, { borderColor: colors.surfaceBorder }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Create Skill</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* AI DRAFT ASSISTANT - HIGHLIGHTED FOR ALL USERS */}
          <Card
            style={[
              styles.aiCard,
              { backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)' },
            ]}
          >
            <View style={styles.aiHeader}>
              <Sparkles color={palette.primaryLight} size={20} />
              <Text style={[styles.aiTitle, { color: colors.textPrimary }]}>
                1-Click AI Skill Generator
              </Text>
            </View>

            <Text style={[styles.aiSubtitle, { color: colors.textSecondary }]}>
              Simply type what you want your AI Skill to do in plain English. Veya AI will write the
              objective, instructions, rules, and output structure for you!
            </Text>

            <Input
              onChangeText={setAiPrompt}
              placeholder="e.g. 'Review React Native code for performance bottlenecks and memory leaks'"
              value={aiPrompt}
            />

            <Button
              icon={<Sparkles color="#FFFFFF" size={16} />}
              loading={drafting}
              onPress={handleAiDraft}
              title={drafting ? 'Generating Skill...' : '✨ Generate AI Skill'}
            />
          </Card>

          {/* LIVE GENERATED SKILL PROMPT PREVIEW */}
          {hasDraftContent && (
            <Card style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View style={styles.previewHeaderTitleRow}>
                  <Eye color={palette.primaryLight} size={18} />
                  <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>
                    Generated Skill Content
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleCopyPreview}
                  style={[
                    styles.copyPreviewBtn,
                    {
                      backgroundColor: copied
                        ? colors.successBg
                        : 'rgba(99,102,241,0.2)',
                      borderColor: copied ? colors.success : palette.primary,
                    },
                  ]}
                >
                  {copied ? (
                    <Check color={colors.success} size={14} />
                  ) : (
                    <Copy color={palette.primaryLight} size={14} />
                  )}
                  <Text
                    style={[
                      styles.copyPreviewBtnText,
                      { color: copied ? colors.success : palette.primaryLight },
                    ]}
                  >
                    {copied ? 'Copied' : 'Copy Prompt'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.previewSubtitle, { color: colors.textMuted }]}>
                This is the complete Skill Prompt generated by Veya. You can copy it directly or publish it below.
              </Text>

              <View
                style={[
                  styles.previewBox,
                  { backgroundColor: colors.surfaceHover, borderColor: colors.surfaceBorder },
                ]}
              >
                <Text selectable style={[styles.previewText, { color: colors.textPrimary }]}>
                  {livePromptPreview}
                </Text>
              </View>
            </Card>
          )}

          {/* SECURITY SCANNER STATUS */}
          {hasDraftContent && (
            <Card style={styles.scanCard}>
              <View style={styles.scanHeader}>
                {scanResult.status === 'clean' ? (
                  <ShieldCheck color={colors.success} size={18} />
                ) : (
                  <AlertTriangle color={colors.danger} size={18} />
                )}
                <Text style={[styles.scanTitle, { color: colors.textPrimary }]}>
                  Security Scan Status
                </Text>
              </View>
              <Badge
                label={scanResult.summary}
                variant={scanResult.status === 'clean' ? 'success' : 'danger'}
              />
            </Card>
          )}

          {/* EDITABLE FIELDS (EXPANDABLE FOR ADVANCED USERS) */}
          <TouchableOpacity
            onPress={() => setShowAdvanced(!showAdvanced)}
            style={[styles.advancedToggle, { borderColor: colors.surfaceBorder }]}
          >
            <SlidersHorizontal color={palette.primaryLight} size={16} />
            <Text style={[styles.advancedToggleText, { color: colors.textPrimary }]}>
              {showAdvanced ? 'Hide Edit Fields' : 'Customize / Edit Skill Fields'}
            </Text>
          </TouchableOpacity>

          {(showAdvanced || !hasDraftContent) && (
            <View style={styles.formBox}>
              <Input
                label="Skill Name"
                onChangeText={setName}
                placeholder="e.g. React Native Performance Audit"
                value={name}
              />
              <Input
                label="Short Description"
                onChangeText={setDescription}
                placeholder="Brief summary of what this skill achieves"
                value={description}
              />
              <Input
                label="Objective"
                multiline
                onChangeText={setObjective}
                placeholder="Clear objective statement"
                value={objective}
              />
              <Input
                label="Instructions"
                multiline
                onChangeText={setInstructions}
                placeholder="Detailed step-by-step instructions for the AI provider"
                value={instructions}
              />
              <Input
                label="Rules & Constraints (One per line)"
                multiline
                onChangeText={setRules}
                placeholder="e.g. Focus on React Native best practices"
                value={rules}
              />
              <Input
                label="Expected Output"
                onChangeText={setExpectedOutput}
                placeholder="e.g. Structured report with identified issues"
                value={expectedOutput}
              />

              {/* Category Picker */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.catScroll}
              >
                {CATEGORIES.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    onPress={() => setCategory(cat)}
                    selected={category === cat}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* PUBLISH BUTTON */}
          <Button
            onPress={handleSaveSkill}
            style={{ marginTop: spacing.md }}
            title="Publish & Save Skill"
          />
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 60,
  },
  aiCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  aiSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  previewCard: {
    marginBottom: spacing.xl,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  copyPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  copyPreviewBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewSubtitle: {
    fontSize: 12,
    marginBottom: spacing.md,
  },
  previewBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  previewText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 20,
  },
  scanCard: {
    marginBottom: spacing.xl,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  scanTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  advancedToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  formBox: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  catScroll: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
});
