import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Trash2,
  Play,
  Edit3,
} from 'lucide-react-native';
import { useTheme, spacing, radius, palette } from '../../core/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Container } from '../../components/ui/Container';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Workflow, WorkflowStep } from '../../types/workflow';
import { ProviderType } from '../../types/skill';
import { PROVIDERS } from '../../types/provider';
import { WorkflowComposer } from '../../core/ai/workflowComposer';
import { workflowService } from '../../features/workflows/workflowService';

export default function WorkflowEditorScreen() {
  const { id, initialWorkflow } = useLocalSearchParams<{ id: string; initialWorkflow?: string }>();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('claude');
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [editInstruction, setEditInstruction] = useState('');

  useEffect(() => {
    async function loadWf() {
      if (initialWorkflow) {
        try {
          const parsed = JSON.parse(initialWorkflow);
          setWorkflow(parsed);
          setSelectedProvider(parsed.provider_id || 'claude');
          await workflowService.saveWorkflow(parsed);
          return;
        } catch (err) {
          console.warn('Could not parse initial workflow:', err);
        }
      }

      const found = await workflowService.getWorkflowById(id);
      if (found) {
        setWorkflow(found);
        setSelectedProvider(found.provider_id || 'claude');
      }
    }
    loadWf();
  }, [id, initialWorkflow]);

  if (!workflow) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textPrimary, padding: 20 }}>Loading Workflow...</Text>
      </SafeAreaView>
    );
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= workflow.steps.length) return;

    const newSteps = WorkflowComposer.reorderSteps(workflow.steps, index, targetIndex);
    const updated = { ...workflow, steps: newSteps };
    setWorkflow(updated);
    workflowService.saveWorkflow(updated);
    showToast(`Reordered step to position ${targetIndex + 1}`, 'info');
  };

  const handleToggleStep = (stepId: string) => {
    const updatedSteps = workflow.steps.map((s) => (s.id === stepId ? { ...s, enabled: !s.enabled } : s));
    const updated = { ...workflow, steps: updatedSteps };
    setWorkflow(updated);
    workflowService.saveWorkflow(updated);
  };

  const handleRemoveStep = (stepId: string) => {
    const filtered = workflow.steps
      .filter((s) => s.id !== stepId)
      .map((s, idx) => ({ ...s, position: idx + 1 }));
    const updated = { ...workflow, steps: filtered };
    setWorkflow(updated);
    workflowService.saveWorkflow(updated);
    showToast('Step removed from workflow', 'info');
  };

  const handleSaveStepInstructions = () => {
    if (!editingStep) return;
    const updatedSteps = workflow.steps.map((s) =>
      s.id === editingStep.id ? { ...s, customInstructions: editInstruction } : s
    );
    const updated = { ...workflow, steps: updatedSteps };
    setWorkflow(updated);
    workflowService.saveWorkflow(updated);
    setEditingStep(null);
    showToast('Custom step instructions updated', 'success');
  };

  const handleGenerateOutput = () => {
    const activeSteps = workflow.steps.filter((s) => s.enabled);
    if (activeSteps.length === 0) {
      showToast('At least one step must be enabled to generate output', 'error');
      return;
    }

    router.push({
      pathname: '/workflow/output',
      params: {
        workflowJson: JSON.stringify({ ...workflow, provider_id: selectedProvider }),
        provider: selectedProvider,
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Container maxWidth={960}>
        {/* Top Navbar */}
        <View style={[styles.navbar, { borderColor: colors.surfaceBorder }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Workflow Editor</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* WORKFLOW GOAL HEADER */}
          <Card style={styles.headerCard}>
            <Text style={[styles.goalLabel, { color: palette.primaryLight }]}>WORKFLOW GOAL</Text>
            <Text style={[styles.goalText, { color: colors.textPrimary }]}>"{workflow.goal}"</Text>
          </Card>

          {/* PROVIDER SELECTOR */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Target AI Provider</Text>
          <View style={styles.providerRow}>
            {(['claude', 'gemini', 'gpt'] as ProviderType[]).map((prov) => {
              const info = PROVIDERS[prov];
              const isSelected = selectedProvider === prov;

              return (
                <TouchableOpacity
                  key={prov}
                  onPress={() => setSelectedProvider(prov)}
                  style={[
                    styles.providerBox,
                    {
                      backgroundColor: isSelected ? 'rgba(99,102,241,0.2)' : colors.surface,
                      borderColor: isSelected ? palette.primary : colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.provName, { color: isSelected ? palette.primaryLight : colors.textPrimary }]}>
                    {info.name.split(' ')[0]}
                  </Text>
                  <Text style={[styles.provVendor, { color: colors.textMuted }]}>{info.vendor}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* STEPS PIPELINE */}
          <View style={styles.stepsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Workflow Steps Pipeline</Text>
            <Text style={[styles.stepCountText, { color: colors.textMuted }]}>
              {workflow.steps.filter((s) => s.enabled).length} Enabled
            </Text>
          </View>

          {workflow.steps.map((step, index) => (
            <Card
              key={step.id}
              style={[
                styles.stepCard,
                { opacity: step.enabled ? 1 : 0.5, borderColor: step.enabled ? colors.surfaceBorder : colors.dangerBg },
              ]}
            >
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepPosBadge}>
                  <Text style={styles.stepPosText}>0{step.position}</Text>
                </View>
                <Text style={[styles.stepSkillName, { color: colors.textPrimary }]}>
                  {step.skill?.name || 'Custom Execution Step'}
                </Text>
                <Switch
                  onValueChange={() => handleToggleStep(step.id)}
                  thumbColor="#FFFFFF"
                  trackColor={{ false: colors.surfaceHover, true: palette.primary }}
                  value={step.enabled}
                />
              </View>

              <Text numberOfLines={2} style={[styles.stepObjective, { color: colors.textSecondary }]}>
                {step.skill?.objective || 'Custom step objective'}
              </Text>

              {step.customInstructions ? (
                <View style={[styles.customInstructionBox, { backgroundColor: colors.surfaceHover }]}>
                  <Text style={[styles.customInstructionText, { color: palette.primaryLight }]}>
                    Custom Override: {step.customInstructions}
                  </Text>
                </View>
              ) : null}

              {/* STEP CONTROL ACTIONS */}
              <View style={styles.stepControlsRow}>
                <View style={styles.reorderButtons}>
                  <TouchableOpacity
                    disabled={index === 0}
                    onPress={() => handleMoveStep(index, 'up')}
                    style={[styles.iconControl, { opacity: index === 0 ? 0.3 : 1 }]}
                  >
                    <ChevronUp color={colors.textPrimary} size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={index === workflow.steps.length - 1}
                    onPress={() => handleMoveStep(index, 'down')}
                    style={[styles.iconControl, { opacity: index === workflow.steps.length - 1 ? 0.3 : 1 }]}
                  >
                    <ChevronDown color={colors.textPrimary} size={18} />
                  </TouchableOpacity>
                </View>

                <View style={styles.rightControls}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingStep(step);
                      setEditInstruction(step.customInstructions || '');
                    }}
                    style={styles.actionIconButton}
                  >
                    <Edit3 color={palette.primaryLight} size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoveStep(step.id)} style={styles.actionIconButton}>
                    <Trash2 color={colors.danger} size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}

          {/* PRIMARY GENERATE BUTTON */}
          <Button
            icon={<Play color="#FFFFFF" size={18} />}
            onPress={handleGenerateOutput}
            style={styles.generateButton}
            title={`Generate ${PROVIDERS[selectedProvider].name} Output`}
          />
        </ScrollView>
      </Container>

      {/* Custom Instruction Edit Modal */}
      <Modal
        onClose={() => setEditingStep(null)}
        title="Edit Step Instructions"
        visible={editingStep !== null}
      >
        <Text style={[styles.modalSkillName, { color: colors.textPrimary }]}>
          Skill: {editingStep?.skill?.name}
        </Text>
        <Input
          label="Custom Instruction Override"
          multiline
          onChangeText={setEditInstruction}
          placeholder="e.g. Focus on audio recording waveforms and Whisper API performance"
          value={editInstruction}
        />
        <Button onPress={handleSaveStepInstructions} title="Save Step Instructions" />
      </Modal>
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
  headerCard: {
    marginBottom: spacing.xl,
  },
  goalLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  goalText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  providerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  providerBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  provName: {
    fontSize: 14,
    fontWeight: '700',
  },
  provVendor: {
    fontSize: 10,
    marginTop: 2,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepCard: {
    marginBottom: spacing.lg,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  stepPosBadge: {
    backgroundColor: palette.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  stepPosText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepSkillName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  stepObjective: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  customInstructionBox: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  customInstructionText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  stepControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  reorderButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconControl: {
    padding: 4,
  },
  rightControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionIconButton: {
    padding: 4,
  },
  generateButton: {
    marginTop: spacing.lg,
  },
  modalSkillName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
});
