import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Copy, Check, Sparkles } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme, spacing, radius, palette } from '../../core/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Container } from '../../components/ui/Container';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { ProviderAdapterEngine, GeneratedOutput } from '../../core/ai/providerAdapters';
import { OpenRouterClient } from '../../core/ai/openrouterClient';
import { ProviderType } from '../../types/skill';
import { Workflow } from '../../types/workflow';

export default function GeneratedOutputScreen() {
  const { workflowJson, provider } = useLocalSearchParams<{
    workflowJson: string;
    provider: ProviderType;
  }>();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [output, setOutput] = useState<GeneratedOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [runningAi, setRunningAi] = useState(false);

  useEffect(() => {
    if (workflowJson) {
      try {
        const wf: Workflow = JSON.parse(workflowJson);
        const adapted = ProviderAdapterEngine.adaptWorkflow(wf, provider || 'claude');
        setOutput(adapted);
      } catch (err) {
        console.warn('Error adapting workflow output:', err);
      }
    }
  }, [workflowJson, provider]);

  if (!output) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textPrimary, padding: 20 }}>Generating provider adapter payload...</Text>
      </SafeAreaView>
    );
  }

  const handleCopyToClipboard = async () => {
    await Clipboard.setStringAsync(output.formattedPrompt);
    setCopied(true);
    showToast('Provider prompt copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunAiSimulation = async () => {
    setRunningAi(true);
    setAiResult('⚡ Connecting to OpenRouter stream...');
    try {
      await OpenRouterClient.generatePromptResponseStream(
        output.formattedPrompt,
        (_chunk, accumulated) => {
          setAiResult(accumulated);
        },
        provider
      );
      showToast('AI Model Streaming Execution Complete', 'success');
    } catch (err: any) {
      showToast(err.message || 'AI streaming failed', 'error');
    } finally {
      setRunningAi(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Container maxWidth={960}>
        {/* Top Navbar */}
        <View style={[styles.navbar, { borderColor: colors.surfaceBorder }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Generated Output</Text>
          <TouchableOpacity onPress={handleCopyToClipboard}>
            {copied ? <Check color={colors.success} size={22} /> : <Copy color={colors.textPrimary} size={22} />}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* PROVIDER METADATA HEADER */}
          <Card style={styles.headerCard}>
            <View style={styles.metaRow}>
              <Badge label={`Adapted for ${output.providerName}`} variant="primary" />
              <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                {new Date(output.generatedAt).toLocaleTimeString()}
              </Text>
            </View>
            <Text style={[styles.readyTitle, { color: colors.textPrimary }]}>
              Provider Prompt Payload Ready
            </Text>
            <Text style={[styles.readySubtitle, { color: colors.textSecondary }]}>
              Copy and paste this structured prompt into your LLM workspace or execute via OpenRouter API.
            </Text>

            <View style={styles.buttonRow}>
              <Button
                icon={copied ? <Check color="#FFFFFF" size={16} /> : <Copy color="#FFFFFF" size={16} />}
                onPress={handleCopyToClipboard}
                style={{ flex: 1 }}
                title={copied ? 'Copied!' : 'Copy Prompt'}
              />
              <Button
                icon={<Sparkles color={colors.textPrimary} size={16} />}
                loading={runningAi}
                onPress={handleRunAiSimulation}
                style={{ flex: 1 }}
                title="Test AI Call"
                variant="secondary"
              />
            </View>
          </Card>

          {/* AI MODEL EXECUTION PREVIEW */}
          {Boolean(aiResult) && (
            <Card style={styles.aiResultCard}>
              <View style={styles.aiResultHeader}>
                <Sparkles color={palette.primaryLight} size={16} />
                <Text style={[styles.aiResultTitle, { color: colors.textPrimary }]}>
                  OpenRouter AI Response Preview
                </Text>
              </View>
              <Text style={[styles.aiResultBody, { color: colors.textSecondary }]}>{aiResult}</Text>
            </Card>
          )}

          {/* PROMPT PAYLOAD PREVIEW */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Formatted System Prompt Payload
          </Text>
          <Card style={[styles.codeBox, { backgroundColor: '#0B0F19', borderColor: colors.surfaceBorder }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.codeText}>{output.formattedPrompt}</Text>
            </ScrollView>
          </Card>
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
  headerCard: {
    marginBottom: spacing.xl,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timestamp: {
    fontSize: 11,
  },
  readyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  readySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  aiResultCard: {
    marginBottom: spacing.xl,
    borderColor: palette.primary,
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  aiResultTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  aiResultBody: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  codeBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#A5B4FC',
    lineHeight: 20,
  },
});
