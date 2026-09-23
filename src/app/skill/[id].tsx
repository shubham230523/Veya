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
import { ArrowLeft, Bookmark, ShieldCheck, Layers, CheckCircle } from 'lucide-react-native';
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
import { CanonicalSkill, SkillReview } from '../../types/skill';

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [skill, setSkill] = useState<CanonicalSkill | null>(null);
  const [reviews, setReviews] = useState<SkillReview[]>([]);
  const [isSaved, setIsSaved] = useState(false);
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
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Skill Detail</Text>
          <TouchableOpacity onPress={handleToggleSave}>
            <Bookmark
              color={isSaved ? palette.primary : colors.textMuted}
              fill={isSaved ? palette.primary : 'transparent'}
              size={22}
            />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title & Metadata */}
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

            {/* Trust Metrics Bar */}
            <View style={[styles.trustBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <View style={styles.trustItem}>
                <Rating count={skill.rating_count} rating={skill.rating_average} size={12} />
                <Text style={[styles.trustLabel, { color: colors.textMuted }]}>Average Rating</Text>
              </View>
              <View style={[styles.trustDivider, { backgroundColor: colors.surfaceBorder }]} />
              <View style={styles.trustItem}>
                <Text style={[styles.trustValue, { color: colors.textPrimary }]}>{skill.usage_count}</Text>
                <Text style={[styles.trustLabel, { color: colors.textMuted }]}>Times Used</Text>
              </View>
              <View style={[styles.trustDivider, { backgroundColor: colors.surfaceBorder }]} />
              <View style={styles.trustItem}>
                <Text style={[styles.trustValue, { color: colors.textPrimary }]}>{skill.save_count}</Text>
                <Text style={[styles.trustLabel, { color: colors.textMuted }]}>Saves</Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <Button
            icon={<Layers color="#FFFFFF" size={18} />}
            onPress={() => {
              showToast('Adding skill to workflow composer...', 'success');
              router.push('/');
            }}
            style={styles.useButton}
            title="Use Skill in Workflow"
          />

          {/* OBJECTIVE & PREREQUISITES */}
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Objective</Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{skill.objective}</Text>

            {skill.prerequisites.length > 0 && (
              <>
                <Text style={[styles.sectionSubtitle, { color: colors.textPrimary }]}>Prerequisites</Text>
                {skill.prerequisites.map((item, idx) => (
                  <Text key={idx} style={[styles.bulletText, { color: colors.textSecondary }]}>
                    • {item}
                  </Text>
                ))}
              </>
            )}
          </Card>

          {/* STEPS BREAKDOWN */}
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Execution Steps</Text>
            {skill.steps.map((step) => (
              <View key={step.number} style={styles.stepItem}>
                <View style={[styles.stepNumberBadge, { backgroundColor: palette.primary }]}>
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>{step.title}</Text>
                  {step.description && (
                    <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                      {step.description}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card>

          {/* RULES & CONSTRAINTS */}
          {skill.rules.length > 0 && (
            <Card style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Rules & Constraints</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Expected Output</Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              {skill.expected_output}
            </Text>
          </Card>

          {/* REVIEWS & RATINGS */}
          <Card style={styles.sectionCard}>
            <View style={styles.reviewHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Community Reviews</Text>
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
                <View key={rev.id} style={[styles.reviewBox, { borderColor: colors.surfaceBorder }]}>
                  <View style={styles.revTop}>
                    <Text style={[styles.revUser, { color: colors.textPrimary }]}>{rev.user_name}</Text>
                    <Rating rating={rev.rating} size={10} />
                  </View>
                  <Text style={[styles.revText, { color: colors.textSecondary }]}>{rev.content}</Text>
                </View>
              ))
            )}
          </Card>
        </ScrollView>
      </Container>

      {/* Review Modal */}
      <Modal
        onClose={() => setReviewModalVisible(false)}
        title="Rate & Review Skill"
        visible={reviewModalVisible}
      >
        <Text style={[styles.label, { color: colors.textSecondary }]}>Rating (1-5 Stars)</Text>
        <Rating interactive onRatingChange={setNewRating} rating={newRating} size={24} />

        <Input
          containerStyle={{ marginTop: spacing.md }}
          label="Your Review"
          multiline
          onChangeText={setNewReviewText}
          placeholder="Share your experience using this skill..."
          value={newReviewText}
        />

        <Button onPress={handleSubmitReview} title="Submit Review" />
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
    padding: spacing.lg,
    paddingBottom: 40,
  },
  headerBox: {
    marginBottom: spacing.lg,
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
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  trustBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
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
  useButton: {
    marginBottom: spacing.lg,
  },
  sectionCard: {
    marginBottom: spacing.md,
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
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 13,
    marginLeft: spacing.xs,
    marginBottom: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewBox: {
    paddingVertical: spacing.xs,
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
});
