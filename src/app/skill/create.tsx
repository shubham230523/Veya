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
import { ArrowLeft, Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react-native';
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

export default function CreateSkillScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [aiPrompt, setAiPrompt] = useState('');
  const [drafting, setDrafting] = useState(false);

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

  const handleAiDraft = () => {
    if (!aiPrompt.trim()) return;
    setDrafting(true);

    setTimeout(() => {
      setName(`AI Draft: ${aiPrompt.slice(0, 25)}`);
      setDescription(`Automated canonical skill generated for: "${aiPrompt}"`);
      setObjective(`Provide structured strategy and code implementation for ${aiPrompt}.`);
      setInstructions(`Analyze input requirements, validate environment prerequisites, and execute step-by-step logic for ${aiPrompt}.`);
      setExpectedOutput(`Clean, actionable code, documentation, or design specs.`);
      setRules(`Do not generate secrets or unsafe system code.\nEnsure cross-platform mobile compatibility.`);
      setDrafting(false);
      showToast('AI Skill draft created!', 'success');
    }, 1000);
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

    const created = await skillService.createSkill({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
      providerCompatibility: ['gemini', 'claude', 'gpt'],
      source: {
        type: 'user_created',
        source_name: 'Custom User Skill',
        author: 'You',
      },
    });

    showToast('Custom skill published!', 'success');
    router.replace(`/skill/${created.id}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Container maxWidth={960}>
        {/* Top Navbar */}
        <View style={[styles.navbar, { borderColor: colors.surfaceBorder }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Create Custom Skill</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* AI DRAFT ASSISTANT */}
          <Card style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Sparkles color={palette.primaryLight} size={18} />
              <Text style={[styles.aiTitle, { color: colors.textPrimary }]}>AI Skill Assistant</Text>
            </View>
            <Text style={[styles.aiSubtitle, { color: colors.textSecondary }]}>
              Describe what you want this Skill to do, and AI will generate a structured draft.
            </Text>
            <Input
              onChangeText={setAiPrompt}
              placeholder="e.g. 'Review React Native code for performance and memory leaks'"
              value={aiPrompt}
            />
            <Button
              loading={drafting}
              onPress={handleAiDraft}
              size="sm"
              title="Generate AI Draft"
              variant="secondary"
            />
          </Card>

          {/* SECURITY SCANNER RESULTS */}
          <Card style={styles.scanCard}>
            <View style={styles.scanHeader}>
              {scanResult.status === 'clean' ? (
                <ShieldCheck color={colors.success} size={18} />
              ) : (
                <AlertTriangle color={colors.danger} size={18} />
              )}
              <Text style={[styles.scanTitle, { color: colors.textPrimary }]}>Security Scan Status</Text>
            </View>
            <Badge
              label={scanResult.summary}
              variant={scanResult.status === 'clean' ? 'success' : 'danger'}
            />
          </Card>

          {/* FORM INPUTS */}
          <Input label="Skill Name" onChangeText={setName} placeholder="e.g. React Native Performance Audit" value={name} />
          <Input label="Short Description" onChangeText={setDescription} placeholder="Brief summary of what this skill achieves" value={description} />
          <Input label="Objective" multiline onChangeText={setObjective} placeholder="Clear objective statement" value={objective} />
          <Input label="Instructions" multiline onChangeText={setInstructions} placeholder="Detailed step-by-step instructions for the AI provider" value={instructions} />
          <Input label="Rules & Constraints (One per line)" multiline onChangeText={setRules} placeholder="e.g. Do not use legacy Class components" value={rules} />
          <Input label="Expected Output" onChangeText={setExpectedOutput} placeholder="e.g. Clean refactored code block with explanation" value={expectedOutput} />

          {/* Category Picker */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                onPress={() => setCategory(cat)}
                selected={category === cat}
              />
            ))}
          </ScrollView>

          <Button onPress={handleSaveSkill} style={{ marginTop: spacing.lg }} title="Publish Custom Skill" />
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
    padding: spacing.lg,
    paddingBottom: 40,
  },
  aiCard: {
    marginBottom: spacing.md,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  aiSubtitle: {
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  scanCard: {
    marginBottom: spacing.md,
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  catScroll: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
});
