import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  Search,
  Sparkles,
  Globe,
  Layers,
  ShieldCheck,
  PlusCircle,
  Copy,
  Check,
  ArrowRight,
  Workflow as WorkflowIcon,
} from 'lucide-react-native';
import { useTheme, spacing, radius, palette } from '../../core/theme';
import { Input } from '../../components/ui/Input';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Container } from '../../components/ui/Container';
import { SkillCard } from '../../components/SkillCard';
import { useToast } from '../../components/ui/Toast';
import { skillService } from '../../features/skills/skillService';
import { workflowService } from '../../features/workflows/workflowService';
import { formatFullSkillPrompt } from '../../features/skills/skillFormatter';
import { CanonicalSkill, SkillCategory } from '../../types/skill';
import { Workflow } from '../../types/workflow';
import { PROVIDERS } from '../../types/provider';

const CATEGORIES: (SkillCategory | 'All')[] = [
  'All',
  'Coding',
  'AI',
  'Research',
  'Creator',
  'Business',
  'Design',
  'Testing',
  'Productivity',
];

type SearchMode = 'catalog' | 'workflows' | 'web_finder';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [searchMode, setSearchMode] = useState<SearchMode>('catalog');

  // Catalog State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'All'>('All');
  const [skills, setSkills] = useState<CanonicalSkill[]>([]);
  const [loading, setLoading] = useState(false);

  // Workflows State
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  // Web Finder State
  const [webQuery, setWebQuery] = useState('');
  const [webSkills, setWebSkills] = useState<CanonicalSkill[]>([]);
  const [webSearching, setWebSearching] = useState(false);
  const [webSearchElapsed, setWebSearchElapsed] = useState(0);
  const [importedSkillIds, setImportedSkillIds] = useState<Set<string>>(new Set());
  const [copiedSkillIds, setCopiedSkillIds] = useState<Set<string>>(new Set());

  // URL Import Modal State
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let timer: any;
    if (webSearching) {
      setWebSearchElapsed(0);
      timer = setInterval(() => {
        setWebSearchElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setWebSearchElapsed(0);
    }
    return () => clearInterval(timer);
  }, [webSearching]);

  useEffect(() => {
    if (searchMode === 'catalog') {
      fetchSkills();
    } else if (searchMode === 'workflows') {
      fetchWorkflows();
    }
  }, [searchQuery, selectedCategory, searchMode]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const data = await skillService.getSkills({
        category: selectedCategory,
        search: searchQuery,
      });
      setSkills(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflows = async () => {
    const data = await workflowService.getWorkflows();
    setWorkflows(data);
  };

  const handleWebSkillSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || webQuery;
    if (!q.trim()) return;

    console.log(`[Discover Screen] Initiating Web Skill Finder for topic: "${q}"`);
    setWebSearching(true);
    try {
      const results = await skillService.searchWebSkills(q);
      setWebSkills(results);
      if (results.length === 0) {
        showToast('No matching skills found on web. Try another keyword.', 'info');
      } else {
        showToast(`Discovered ${results.length} AI skills from web!`, 'success');
      }
    } catch (err: any) {
      console.error(`[Discover Screen] ❌ Web Skill Finder error:`, err.message);
      showToast(err.message || 'Web skill search failed', 'error');
    } finally {
      setWebSearching(false);
    }
  };

  const handleCopyPrompt = async (webSkill: CanonicalSkill) => {
    const fullPrompt = formatFullSkillPrompt(webSkill);
    await Clipboard.setStringAsync(fullPrompt);
    setCopiedSkillIds((prev) => new Set(prev).add(webSkill.id));
    showToast('Full skill prompt copied to clipboard!', 'success');
    setTimeout(() => {
      setCopiedSkillIds((prev) => {
        const next = new Set(prev);
        next.delete(webSkill.id);
        return next;
      });
    }, 3000);
  };

  const handleImportWebDiscoveredSkill = async (webSkill: CanonicalSkill) => {
    try {
      const created = await skillService.createSkill({
        name: webSkill.name,
        slug: webSkill.slug,
        description: webSkill.description,
        objective: webSkill.objective,
        instructions: webSkill.instructions,
        inputs: webSkill.inputs,
        prerequisites: webSkill.prerequisites,
        steps: webSkill.steps,
        rules: webSkill.rules,
        expected_output: webSkill.expected_output,
        visibility: 'public',
        version: 1,
        category: webSkill.category,
        tags: webSkill.tags,
        providerCompatibility: webSkill.providerCompatibility,
        source: webSkill.source,
      });

      setImportedSkillIds((prev) => new Set(prev).add(webSkill.id));
      showToast(`Imported "${created.name}" to your library!`, 'success');
      fetchSkills();
    } catch (err: any) {
      showToast(err.message || 'Failed to import skill', 'error');
    }
  };

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);

    try {
      const imported = await skillService.importSkillFromUrl(importUrl);
      setImportModalVisible(false);
      setImportUrl('');
      showToast(`Successfully imported "${imported.name}" from web!`, 'success');
      fetchSkills();
    } catch (err: any) {
      showToast(err.message || 'Failed to import skill from URL', 'error');
    } finally {
      setImporting(false);
    }
  };

  const WEB_SUGGESTION_TOPICS = [
    'React Native Performance Audit',
    'Next.js SEO & Web Vitals',
    'Python Scraper & Parser',
    'Stripe Billing Webhooks',
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Container maxWidth={960}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* HEADER SECTION */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Discover Skills & Workflows</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Browse catalog skills, active workflows, or search AI skills across the web.
                </Text>
              </View>

              <View style={styles.headerActionRow}>
                <Button
                  icon={<PlusCircle color={colors.textPrimary} size={14} />}
                  onPress={() => router.push('/skill/create')}
                  size="sm"
                  title="Create Skill"
                  variant="secondary"
                />

                <Button
                  icon={<Globe color="#FFFFFF" size={14} />}
                  onPress={() => setImportModalVisible(true)}
                  size="sm"
                  title="URL Import"
                />
              </View>
            </View>

            {/* MODE SEGMENT SWITCH */}
            <View style={[styles.modeSegment, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <TouchableOpacity
                onPress={() => setSearchMode('catalog')}
                style={[
                  styles.segmentBtn,
                  searchMode === 'catalog' && { backgroundColor: palette.primary },
                ]}
              >
                <Layers
                  color={searchMode === 'catalog' ? '#FFFFFF' : colors.textSecondary}
                  size={14}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: searchMode === 'catalog' ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  Catalog Skills ({skills.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSearchMode('workflows')}
                style={[
                  styles.segmentBtn,
                  searchMode === 'workflows' && { backgroundColor: palette.primary },
                ]}
              >
                <WorkflowIcon
                  color={searchMode === 'workflows' ? '#FFFFFF' : colors.textSecondary}
                  size={14}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: searchMode === 'workflows' ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  Workflows ({workflows.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSearchMode('web_finder')}
                style={[
                  styles.segmentBtn,
                  searchMode === 'web_finder' && { backgroundColor: palette.primary },
                ]}
              >
                <Sparkles
                  color={searchMode === 'web_finder' ? '#FFFFFF' : palette.primaryLight}
                  size={14}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: searchMode === 'web_finder' ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  🌐 Web Skill Finder
                </Text>
              </TouchableOpacity>
            </View>

            {/* MODE 1: CATALOG SEARCH */}
            {searchMode === 'catalog' && (
              <>
                <Input
                  containerStyle={styles.searchContainer}
                  leftIcon={<Search color={colors.textMuted} size={18} />}
                  onChangeText={setSearchQuery}
                  placeholder="Search catalog (e.g. 'React Native', 'Whisper', 'PRD', 'SaaS')..."
                  value={searchQuery}
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScroll}
                >
                  {CATEGORIES.map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      onPress={() => setSelectedCategory(category)}
                      selected={selectedCategory === category}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            {/* MODE 2: WEB AI SKILL FINDER */}
            {searchMode === 'web_finder' && (
              <Card style={styles.webSearchCard}>
                <View style={styles.webHeaderRow}>
                  <Sparkles color={palette.primaryLight} size={18} />
                  <Text style={[styles.webHeaderTitle, { color: colors.textPrimary }]}>
                    Search AI Skills Across the Web
                  </Text>
                </View>
                <Text style={[styles.webHeaderSub, { color: colors.textSecondary }]}>
                  Type any skill topic or technology. Veya AI will search & curate matching structured skills from the web prompt ecosystem!
                </Text>

                <Input
                  containerStyle={styles.searchContainer}
                  leftIcon={<Search color={colors.textMuted} size={18} />}
                  onChangeText={setWebQuery}
                  placeholder="e.g. 'Next.js SEO', 'React Native Memory Leaks', 'Python Fast API'..."
                  value={webQuery}
                />

                <Button
                  icon={webSearching ? undefined : <Search color="#FFFFFF" size={16} />}
                  loading={webSearching}
                  onPress={() => handleWebSkillSearch()}
                  title={webSearching ? `Searching Web AI... (${webSearchElapsed}s)` : '🔍 Discover Skills on Web'}
                />

                {webSearching && (
                  <View style={styles.progressStatusBox}>
                    <ActivityIndicator color={palette.primaryLight} size="small" />
                    <Text style={[styles.progressStatusText, { color: palette.primaryLight }]}>
                      Querying OpenRouter AI model ({webSearchElapsed}s)...
                    </Text>
                  </View>
                )}

                <Text style={[styles.quickTopicLabel, { color: colors.textMuted }]}>
                  POPULAR SKILL SEARCHES:
                </Text>
                <View style={styles.topicWrap}>
                  {WEB_SUGGESTION_TOPICS.map((topic, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setWebQuery(topic);
                        handleWebSkillSearch(topic);
                      }}
                      style={[styles.topicChip, { backgroundColor: colors.surfaceHover, borderColor: colors.surfaceBorder }]}
                    >
                      <Text style={[styles.topicChipText, { color: colors.textSecondary }]}>
                        {topic}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            )}
          </View>

          {/* RESULTS SECTION: CATALOG MODE */}
          {searchMode === 'catalog' && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                  {skills.length} {skills.length === 1 ? 'Skill' : 'Skills'} found
                </Text>
                <View style={styles.hybridBadge}>
                  <Sparkles color={palette.primaryLight} size={12} />
                  <Text style={[styles.hybridText, { color: palette.primaryLight }]}>Hybrid Search</Text>
                </View>
              </View>

              {skills.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Skills Found</Text>
                  <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                    Try adjusting your search filters or click "Web AI Skill Finder" above to discover new skills across the internet!
                  </Text>
                  <Button
                    icon={<Sparkles color="#FFFFFF" size={14} />}
                    onPress={() => setSearchMode('web_finder')}
                    style={{ marginTop: spacing.md }}
                    title="Try Web AI Skill Finder"
                  />
                </View>
              ) : (
                <View style={isDesktop ? styles.gridContainer : undefined}>
                  {skills.map((skill) => (
                    <View key={skill.id} style={isDesktop ? styles.gridCol : undefined}>
                      <SkillCard onSaveToggle={fetchSkills} skill={skill} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* RESULTS SECTION: WORKFLOWS MODE */}
          {searchMode === 'workflows' && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                  {workflows.length} {workflows.length === 1 ? 'Workflow' : 'Workflows'} saved
                </Text>
                <Button
                  icon={<PlusCircle color="#FFFFFF" size={14} />}
                  onPress={() => router.push('/(tabs)')}
                  size="sm"
                  title="Compose New Workflow"
                />
              </View>

              {workflows.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Layers color={colors.textMuted} size={36} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    No Saved Workflows Yet
                  </Text>
                  <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                    Compose your multi-step AI workflow on the Home screen or save your executed workflow output payload!
                  </Text>
                  <Button
                    icon={<Sparkles color="#FFFFFF" size={14} />}
                    onPress={() => router.push('/(tabs)')}
                    style={{ marginTop: spacing.md }}
                    title="Compose Workflow on Home"
                  />
                </View>
              ) : (
                <View style={isDesktop ? styles.gridContainer : undefined}>
                  {workflows.map((wf) => (
                    <View key={wf.id} style={isDesktop ? styles.gridCol : undefined}>
                      <Card
                        onPress={() =>
                          router.push({
                            pathname: '/workflow/[id]',
                            params: { id: wf.id, initialWorkflow: JSON.stringify(wf) },
                          })
                        }
                        style={styles.wfCard}
                      >
                        <View style={styles.wfCardHeader}>
                          <Badge label={`${wf.steps.length} Skills`} variant="primary" />
                          {wf.provider_id && (
                            <Badge
                              label={PROVIDERS[wf.provider_id]?.name || wf.provider_id}
                              variant="secondary"
                            />
                          )}
                        </View>

                        <Text style={[styles.wfCardTitle, { color: colors.textPrimary }]}>
                          {wf.name}
                        </Text>

                        <Text numberOfLines={2} style={[styles.wfCardGoal, { color: colors.textSecondary }]}>
                          "{wf.goal}"
                        </Text>

                        <View style={[styles.wfCardFooter, { borderColor: colors.surfaceBorder }]}>
                          <Text style={[styles.wfCardDate, { color: colors.textMuted }]}>
                            Updated: {new Date(wf.updated_at).toLocaleDateString()}
                          </Text>
                          <View style={styles.wfCardActionBtn}>
                            <Text style={[styles.wfCardActionText, { color: palette.primaryLight }]}>
                              Open Workflow
                            </Text>
                            <ArrowRight color={palette.primaryLight} size={14} />
                          </View>
                        </View>
                      </Card>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* RESULTS SECTION: WEB FINDER MODE */}
          {searchMode === 'web_finder' && (
            <View style={styles.resultsContainer}>
              {webSkills.length === 0 && !webSearching ? (
                <View style={styles.emptyContainer}>
                  <Globe color={colors.textMuted} size={36} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    Search Any Web Skill Topic Above
                  </Text>
                  <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                    Type what you want to achieve (e.g. 'React Native Performance', 'PRD', 'SaaS Pricing') and click Discover Skills!
                  </Text>
                </View>
              ) : (
                <View style={isDesktop ? styles.gridContainer : undefined}>
                  {webSkills.map((webSkill) => {
                    const isImported = importedSkillIds.has(webSkill.id);
                    const isCopied = copiedSkillIds.has(webSkill.id);
                    const fullPromptText = formatFullSkillPrompt(webSkill);

                    return (
                      <View key={webSkill.id} style={isDesktop ? styles.gridCol : undefined}>
                        <Card style={styles.webSkillCard}>
                          {/* TOP BADGES ROW */}
                          <View style={styles.webSkillHeader}>
                            <View style={styles.badgeRow}>
                              <Badge label={webSkill.category} variant="primary" />
                              <Badge
                                icon={<ShieldCheck color={colors.success} size={10} />}
                                label="Clean Scan"
                                variant="success"
                              />
                              <Badge label="Web Discovered" variant="secondary" />
                            </View>
                          </View>

                          <Text style={[styles.webSkillTitle, { color: colors.textPrimary }]}>
                            {webSkill.name}
                          </Text>

                          <Text style={[styles.webSkillDesc, { color: colors.textSecondary }]}>
                            {webSkill.description}
                          </Text>

                          {/* SCROLLABLE FULL FORMATTED PROMPT BOX */}
                          <View
                            style={[
                              styles.promptBox,
                              { backgroundColor: colors.surfaceHover, borderColor: colors.surfaceBorder },
                            ]}
                          >
                            <ScrollView
                              indicatorStyle="white"
                              nestedScrollEnabled
                              showsVerticalScrollIndicator={true}
                              style={styles.promptScrollView}
                            >
                              <Text selectable style={[styles.promptText, { color: colors.textPrimary }]}>
                                {fullPromptText}
                              </Text>
                            </ScrollView>
                          </View>

                          {/* FOOTER ROW WITH HASHTAGS & ACTION BUTTONS */}
                          <View style={[styles.cardFooterRow, { borderColor: colors.surfaceBorder }]}>
                            <View style={styles.tagWrap}>
                              {webSkill.tags.map((tag, idx) => (
                                <Text key={idx} style={[styles.tagText, { color: colors.textMuted }]}>
                                  #{tag}
                                </Text>
                              ))}
                            </View>

                            <View style={styles.webActionRow}>
                              <Button
                                icon={
                                  isCopied ? (
                                    <Check color={colors.success} size={14} />
                                  ) : (
                                    <Copy color={palette.primaryLight} size={14} />
                                  )
                                }
                                onPress={() => handleCopyPrompt(webSkill)}
                                size="sm"
                                title={isCopied ? 'Copied' : 'Copy Prompt'}
                                variant="outline"
                              />

                              <Button
                                disabled={isImported}
                                icon={
                                  isImported ? (
                                    <ShieldCheck color={colors.success} size={14} />
                                  ) : (
                                    <PlusCircle color="#FFFFFF" size={14} />
                                  )
                                }
                                onPress={() => handleImportWebDiscoveredSkill(webSkill)}
                                size="sm"
                                title={isImported ? 'Imported' : 'Import Skill'}
                                variant={isImported ? 'outline' : 'primary'}
                              />
                            </View>
                          </View>
                        </Card>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </Container>

      {/* Import Modal */}
      <Modal
        onClose={() => setImportModalVisible(false)}
        title="Import Skill from GitHub / Web URL"
        visible={importModalVisible}
      >
        <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
          Paste any raw GitHub prompt URL or public prompt link. OpenRouter AI will parse, security-scan, and normalize it into a Canonical Skill in your database.
        </Text>

        <Input
          label="Public Prompt URL / Raw GitHub Link"
          onChangeText={setImportUrl}
          placeholder="e.g. https://raw.githubusercontent.com/.../prompt.md"
          value={importUrl}
        />

        <Button
          loading={importing}
          onPress={handleImportFromUrl}
          title="Import & Save to Supabase"
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  modeSegment: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.xl,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    marginBottom: spacing.lg,
  },
  chipScroll: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  webSearchCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  webHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  webHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  webHeaderSub: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  progressStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  progressStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickTopicLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  topicWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  topicChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  topicChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  resultsContainer: {
    marginTop: spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  hybridBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  hybridText: {
    fontSize: 11,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 400,
  },
  wfCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  wfCardHeader: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  wfCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  wfCardGoal: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  wfCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
  },
  wfCardDate: {
    fontSize: 11,
  },
  wfCardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wfCardActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  webSkillCard: {
    marginBottom: spacing.xxl,
    padding: spacing.xl,
  },
  webSkillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    flex: 1,
  },
  webSkillTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.xs,
    lineHeight: 24,
  },
  webSkillDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  promptBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  promptScrollView: {
    maxHeight: 200,
  },
  promptText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 19,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  webActionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
});
