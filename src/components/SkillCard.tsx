import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Bookmark, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { CanonicalSkill } from '../types/skill';
import { useTheme, spacing, radius, palette } from '../core/theme';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Rating } from './ui/Rating';
import { skillService } from '../features/skills/skillService';

export interface SkillCardProps {
  skill: CanonicalSkill;
  onSaveToggle?: () => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill, onSaveToggle }) => {
  const { colors } = useTheme();
  const isSaved = skillService.isSaved(skill.id);

  return (
    <Card
      onPress={() => router.push(`/skill/${skill.id}`)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Badge label={skill.category} variant="primary" />
          {skill.security_scan_status === 'clean' && (
            <Badge
              icon={<ShieldCheck color={colors.success} size={10} />}
              label="Clean Scan"
              variant="success"
            />
          )}
        </View>
        <Card
          onPress={() => {
            skillService.toggleSaveSkill(skill.id, skill);
            onSaveToggle?.();
          }}
          bordered={false}
          style={[
            styles.saveButton,
            { backgroundColor: isSaved ? 'rgba(99,102,241,0.2)' : colors.surfaceHover },
          ]}
        >
          <Bookmark
            color={isSaved ? palette.primary : colors.textMuted}
            fill={isSaved ? palette.primary : 'transparent'}
            size={16}
          />
        </Card>
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>{skill.name}</Text>
      <Text
        numberOfLines={2}
        style={[styles.description, { color: colors.textSecondary }]}
      >
        {skill.description}
      </Text>

      <View style={styles.footer}>
        <Rating count={skill.rating_count} rating={skill.rating_average} />
        <View style={styles.usesRow}>
          <Text style={[styles.usesText, { color: colors.textMuted }]}>
            {skill.usage_count} uses
          </Text>
          <ArrowRight color={colors.textSecondary} size={14} style={styles.arrow} />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  saveButton: {
    padding: spacing.xs,
    borderRadius: radius.full,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  arrow: {
    marginLeft: 4,
  },
});
