import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { Search, Sparkles } from 'lucide-react-native';
import { useTheme, spacing, radius, palette } from '../../core/theme';
import { Input } from '../../components/ui/Input';
import { Chip } from '../../components/ui/Chip';
import { Container } from '../../components/ui/Container';
import { SkillCard } from '../../components/SkillCard';
import { skillService } from '../../features/skills/skillService';
import { CanonicalSkill, SkillCategory } from '../../types/skill';

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

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'All'>('All');
  const [skills, setSkills] = useState<CanonicalSkill[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, [searchQuery, selectedCategory]);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Container maxWidth={960}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Discover Skills</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Search and filter universal AI skills across categories.
          </Text>

          {/* Search Bar */}
          <Input
            containerStyle={styles.searchContainer}
            leftIcon={<Search color={colors.textMuted} size={18} />}
            onChangeText={setSearchQuery}
            placeholder="Search skills (e.g. 'React Native', 'Whisper', 'PRD', 'SaaS')..."
            value={searchQuery}
          />

          {/* Categories Chips */}
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
        </View>

        {/* Results Section Header */}
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
            {skills.length} {skills.length === 1 ? 'Skill' : 'Skills'} found
          </Text>
          <View style={styles.hybridBadge}>
            <Sparkles color={palette.primaryLight} size={12} />
            <Text style={[styles.hybridText, { color: palette.primaryLight }]}>Hybrid Search</Text>
          </View>
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={skills}
          key={isDesktop ? 'grid-2' : 'list-1'}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Skills Found</Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                Try adjusting your search filters or create a new custom skill.
              </Text>
            </View>
          }
          numColumns={isDesktop ? 2 : 1}
          renderItem={({ item }) => (
            <View style={isDesktop ? styles.gridCol : undefined}>
              <SkillCard onSaveToggle={fetchSkills} skill={item} />
            </View>
          )}
        />
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: spacing.md,
  },
  searchContainer: {
    marginBottom: spacing.sm,
  },
  chipScroll: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
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
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: 40,
  },
  gridCol: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
});
