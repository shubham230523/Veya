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
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  Bookmark,
  ShieldCheck,
  Layers,
  CheckCircle,
  Copy,
  Check,
  Sparkles,
  FileText,
  List,
  MessageSquare,
  Send,
} from 'lucide-react-native';
import { useTheme, spacing, radius, palette } from '../../core/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Container } from '../../components/ui/Container';
import { Badge } from '../../components/ui/Badge';
import { Rating } from '../../components/ui/Rating';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { skillService } from '../../features/skills/skillService';
import { formatFullSkillPrompt } from '../../features/skills/skillFormatter';
import { CanonicalSkill, SkillReview } from '../../types/skill';

type TabType = 'prompt' | 'breakdown' | 'reviews';

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [skill, setSkill] = useState<CanonicalSkill | null>(null);
  const [reviews, setReviews] = useState<SkillReview[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('prompt');

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');

  useEffect(() => {
    if (id) loadSkillData();
  }, [id]);

  const loadSkillData = async () => {
    const data = await skillService.getSkillById(id!);
    if (data) {
      setSkill(data);
      setIsSaved(skillService.isSaved(data.id));
      const revs = await skillService.getReviews(data.id);
      setReviews(revs);
    }
  };

  const fullPromptText = skill ? formatFullSkillPrompt(skill) : '';

  const handleCopyPrompt = async () => {
    if (!fullPromptText) return;
    await Clipboard.setStringAsync(fullPromptText);
    setCopied(true);
    showToast('Full Skill Prompt copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleToggleSave = async () => {
    if (!skill) return;
    const saved = await skillService.toggleSaveSkill(skill.id);
    setIsSaved(saved);
    showToast(saved ? 'Skill saved to library' : 'Skill removed from library', 'info');
  };

  const handleSubmitReview = async () => {
    if (!skill || !newReviewText.trim()) return;
    await skillService.addReview(skill.id, newRating, newReviewText.trim());
    setReviewModalVisible(false);
    setNewReviewText('');
    showToast('Review submitted successfully!', 'success');
    loadSkillData();
  };

  if (!skill) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textPrimary, padding: 20 }}>Loading skill...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Container maxWidth={960}>
        {/* Top Navbar */}
        <View style={[styles.navbar, { borderColor: colors.surfaceBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Skill Detail</Text>
          <TouchableOpacity onPress={handleToggleSave} style={styles.navButton}>
            <Bookmark
              color={isSaved ? palette.primary : colors.textMuted}
              fill={isSaved ? palette.primary : 'transparent'}
              size={22}
            />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header Box */}
          <View style={styles.headerBox}>
            <View style={styles.badgeRow}>
              <Badge label={skill.category} variant="primary" />
              <Badge label={`v${skill.version}`} variant="secondary" />
              {skill.security_scan_status === 'clean' && (
                <Badge
                  icon={<ShieldCheck color={colors.success} size={10} />}
                  label="No Security Issues"
                  variant="success"
                />
              )}
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>{skill.name}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {skill.description}
            </Text>

            {/* Quick Banner for Non-Technical Users */}
            <View
              style={[
                styles.appGeneratedBanner,
                { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)' },
              ]}
            >
              <Sparkles color={palette.primaryLight} size={18} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
                  Skill Generated by Veya AI
                </Text>

                <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
                  This is the complete AI Skill prompt created by Veya. Copy it in 1-click and paste
                  it into Antigravity, Cursor, ChatGPT, or Claude!
                </Text>
              </View>
            </View>

            {/* Primary Action Buttons */}
            <View style={styles.actionRow}>
              <Button
                icon={
                  copied ? (
                    <Check color="#FFFFFF" size={18} />
                  ) : (
                    <Copy color="#FFFFFF" size={18} />
                  )
                }
                onPress={handleCopyPrompt}
                style={styles.primaryCopyBtn}
                title={copied ? 'Prompt Copied!' : 'Copy Full Skill Prompt (1-Click)'}
              />

              <Button
                icon={<Layers color={colors.textPrimary} size={18} />}
                onPress={() => {
                  showToast('Adding skill to workflow composer...', 'success');
                  router.push('/');
                }}
                title="Use in Workflow"
                variant="outline"
              />
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={[styles.tabBar, { borderColor: colors.surfaceBorder }]}>
            <TouchableOpacity
              onPress={() => setActiveTab('prompt')}
              style={[
                styles.tabItem,
                activeTab === 'prompt' && [
                  styles.tabItemActive,
                  { borderBottomColor: palette.primary },
                ],
              ]}
            >
              <FileText
                color={activeTab === 'prompt' ? palette.primary : colors.textMuted}
                size={16}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === 'prompt' ? colors.textPrimary : colors.textMuted },
                ]}
              >
                Full Skill Prompt
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('breakdown')}
              style={[
                styles.tabItem,
                activeTab === 'breakdown' && [
                  styles.tabItemActive,
                  { borderBottomColor: palette.primary },
                ],
              ]}
            >
              <List
                color={activeTab === 'breakdown' ? palette.primary : colors.textMuted}
                size={16}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === 'breakdown' ? colors.textPrimary : colors.textMuted },
                ]}
              >
                Structured View
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('reviews')}
              style={[
                styles.tabItem,
                activeTab === 'reviews' && [
                  styles.tabItemActive,
                  { borderBottomColor: palette.primary },
                ],
              ]}
            >
              <MessageSquare
                color={activeTab === 'reviews' ? palette.primary : colors.textMuted}
                size={16}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === 'reviews' ? colors.textPrimary : colors.textMuted },
                ]}
              >
                Stats & Reviews
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: FULL GENERATED PROMPT (DEFAULT VIEW) */}
          {activeTab === 'prompt' && (
            <Card style={styles.promptCard}>
              <View style={styles.promptHeader}>
                <View style={styles.promptHeaderTitleRow}>
                  <Sparkles color={palette.primaryLight} size={16} />
                  <Text style={[styles.promptHeaderTitle, { color: colors.textPrimary }]}>
                    Complete Skill Content
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleCopyPrompt}
                  style={[
                    styles.miniCopyBtn,
                    {
                      backgroundColor: copied
                        ? colors.successBg
                        : 'rgba(99,102,241,0.15)',
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
                      styles.miniCopyText,
                      { color: copied ? colors.success : palette.primaryLight },
                    ]}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.promptBox,
                  { backgroundColor: colors.surfaceHover, borderColor: colors.surfaceBorder },
                ]}
              >
                <Text
                  selectable
                  style={[styles.promptText, { color: colors.textPrimary }]}
                >
                  {fullPromptText}
                </Text>
              </View>
            </Card>
          )}

          {/* TAB 2: STRUCTURED BREAKDOWN */}
          {activeTab === 'breakdown' && (
            <>
              {/* OBJECTIVE */}
              <Card style={styles.sectionCard}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Objective</Text>
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                  {skill.objective}
                </Text>

                {skill.prerequisites.length > 0 && (
                  <>
                    <Text style={[styles.sectionSubtitle, { color: colors.textPrimary }]}>
                      Prerequisites
                    </Text>
                    {skill.prerequisites.map((item, idx) => (
                      <Text key={idx} style={[styles.bulletText, { color: colors.textSecondary }]}>
                        • {item}
                      </Text>
                    ))}
                  </>
                )}
              </Card>

              {/* EXECUTION STEPS */}
              {skill.steps.length > 0 && (
                <Card style={styles.sectionCard}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Execution Steps
                  </Text>
                  {skill.steps.map((step) => (
                    <View key={step.number} style={styles.stepItem}>
                      <View style={[styles.stepNumberBadge, { backgroundColor: palette.primary }]}>
                        <Text style={styles.stepNumberText}>{step.number}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                          {step.title}
                        </Text>
                        {Boolean(step.description) && (
                          <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                            {step.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </Card>
              )}

              {/* RULES & CONSTRAINTS */}
              {skill.rules.length > 0 && (
                <Card style={styles.sectionCard}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Rules & Constraints
                  </Text>
                  {skill.rules.map((rule, idx) => (
                    <View key={idx} style={styles.ruleRow}>
                      <CheckCircle color={colors.success} size={14} style={styles.checkIcon} />
                      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{rule}</Text>
                    </View>
                  ))}
                </Card>
              )}

              {/* EXPECTED OUTPUT */}
              <Card style={styles.sectionCard}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Expected Output
                </Text>
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                  {skill.expected_output}
                </Text>
              </Card>
            </>
          )}

          {/* TAB 3: STATS & COMMUNITY REVIEWS */}
          {activeTab === 'reviews' && (
            <>
              {/* Trust Metrics Bar */}
              <Card style={styles.sectionCard}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Skill Statistics
                </Text>
                <View
                  style={[
                    styles.trustBar,
                    { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  ]}
                >
                  <View style={styles.trustItem}>
                    <Rating count={skill.rating_count} rating={skill.rating_average} size={14} />
                    <Text style={[styles.trustLabel, { color: colors.textMuted }]}>
                      Average Rating
                    </Text>
                  </View>
                  <View style={[styles.trustDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.trustItem}>
                    <Text style={[styles.trustValue, { color: colors.textPrimary }]}>
                      {skill.usage_count}
                    </Text>
                    <Text style={[styles.trustLabel, { color: colors.textMuted }]}>
                      Times Used
                    </Text>
                  </View>
                  <View style={[styles.trustDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.trustItem}>
                    <Text style={[styles.trustValue, { color: colors.textPrimary }]}>
                      {skill.save_count}
                    </Text>
                    <Text style={[styles.trustLabel, { color: colors.textMuted }]}>Saves</Text>
                  </View>
                </View>
              </Card>

              {/* Reviews Card */}
              <Card style={styles.sectionCard}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Community Reviews
                  </Text>
                  <Button
                    onPress={() => setReviewModalVisible(true)}
                    size="sm"
                    title="Write Review"
                    variant="outline"
                  />
                </View>

                {reviews.length === 0 ? (
                  <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                    No reviews yet. Be the first to rate this skill!
                  </Text>
                ) : (
                  reviews.map((rev) => (
                    <View
                      key={rev.id}
                      style={[styles.reviewBox, { borderColor: colors.surfaceBorder }]}
                    >
                      <View style={styles.revTop}>
                        <Text style={[styles.revUser, { color: colors.textPrimary }]}>
                          {rev.user_name}
                        </Text>
                        <Rating rating={rev.rating} size={10} />
                      </View>
                      <Text style={[styles.revText, { color: colors.textSecondary }]}>
                        {rev.content}
                      </Text>
                    </View>
                  ))
                )}
              </Card>
            </>
          )}
        </ScrollView>
      </Container>

      {/* Review Modal */}
      <Modal
        onClose={() => setReviewModalVisible(false)}
        title="Rate & Review Skill"
        visible={reviewModalVisible}
      >
        <View style={styles.modalContentBox}>
          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
            HOW WOULD YOU RATE THIS SKILL?
          </Text>

          <View
            style={[
              styles.ratingSelectBox,
              { backgroundColor: colors.surfaceHover, borderColor: colors.surfaceBorder },
            ]}
          >
            <Rating
              interactive
              onRatingChange={setNewRating}
              rating={newRating}
              showScoreLabel
              size={28}
            />
          </View>

          <Input
            containerStyle={{ marginTop: spacing.md }}
            label="YOUR REVIEW"
            multiline
            numberOfLines={4}
            onChangeText={setNewReviewText}
            placeholder="Share your experience, edge cases, or prompt optimization tips..."
            value={newReviewText}
          />

          <Button
            icon={<Send color="#FFFFFF" size={16} />}
            onPress={handleSubmitReview}
            style={{ marginTop: spacing.md }}
            title="Submit Review"
          />
        </View>
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
  navButton: {
    padding: spacing.xs,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 60,
  },
  headerBox: {
    marginBottom: spacing.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  appGeneratedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'column',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  primaryCopyBtn: {
    width: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: spacing.lg,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  promptCard: {
    marginBottom: spacing.lg,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  promptHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  promptHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  miniCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  miniCopyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  promptBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  promptText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 22,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 13,
    marginLeft: spacing.xs,
    marginBottom: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  checkIcon: {
    marginTop: 2,
  },
  trustBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  trustItem: {
    alignItems: 'center',
  },
  trustValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  trustLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  trustDivider: {
    width: 1,
    height: 24,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reviewBox: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    marginBottom: spacing.xs,
  },
  revTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  revUser: {
    fontSize: 12,
    fontWeight: '600',
  },
  revText: {
    fontSize: 12,
  },
  modalContentBox: {
    paddingVertical: spacing.xs,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  ratingSelectBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
});
