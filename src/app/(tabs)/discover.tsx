import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  FlatList,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { Search, Sparkles, Globe, Download } from 'lucide-react-native';
import { useTheme, spacing, radius, palette } from '../../core/theme';
import { Input } from '../../components/ui/Input';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Container } from '../../components/ui/Container';
import { SkillCard } from '../../components/SkillCard';
import { useToast } from '../../components/ui/Toast';
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
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'All'>('All');
  const [skills, setSkills] = useState<CanonicalSkill[]>([]);
  const [loading, setLoading] = useState(false);

  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Container maxWidth={960}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Discover Skills</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Search Supabase skills or import prompts from GitHub & Web.
              </Text>
            </View>

            <Button
              icon={<Globe color="#FFFFFF" size={14} />}
              onPress={() => setImportModalVisible(true)}
              size="sm"
              title="Import Web Skill"
            />
          </View>

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
                Try adjusting your search filters or click "Import Web Skill" to import any GitHub/web prompt URL!
              </Text>
              <Button
                icon={<Download color="#FFFFFF" size={14} />}
                onPress={() => setImportModalVisible(true)}
                style={{ marginTop: spacing.md }}
                title="Import Prompt from Web URL"
              />
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
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
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
    maxWidth: 400,
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
});
