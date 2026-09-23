import { CanonicalSkill, SkillCategory, SkillReview } from '../../types/skill';
import { SEED_SKILLS } from '../../core/database/seed';
import { scanSkillContent } from '../../core/security/securityScanner';

class SkillService {
  private skills: CanonicalSkill[] = [...SEED_SKILLS];
  private savedSkillIds: Set<string> = new Set();
  private reviews: Record<string, SkillReview[]> = {};

  async getSkills(filter?: {
    category?: SkillCategory | 'All';
    search?: string;
    tag?: string;
  }): Promise<CanonicalSkill[]> {
    let result = [...this.skills];

    if (filter?.category && filter.category !== 'All') {
      result = result.filter((s) => s.category === filter.category);
    }

    if (filter?.tag) {
      result = result.filter((s) => s.tags.includes(filter.tag!));
    }

    if (filter?.search && filter.search.trim().length > 0) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.objective.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }

  async getSkillById(id: string): Promise<CanonicalSkill | undefined> {
    return this.skills.find((s) => s.id === id);
  }

  async createSkill(data: Omit<CanonicalSkill, 'id' | 'created_at' | 'updated_at' | 'rating_average' | 'rating_count' | 'usage_count' | 'save_count' | 'security_scan_status' | 'security_scanned_at'>): Promise<CanonicalSkill> {
    const security = scanSkillContent({
      name: data.name,
      description: data.description,
      objective: data.objective,
      instructions: data.instructions,
      rules: data.rules,
    });

    const newSkill: CanonicalSkill = {
      ...data,
      id: `skill-custom-${Date.now()}`,
      rating_average: 5.0,
      rating_count: 1,
      usage_count: 1,
      save_count: 0,
      security_scan_status: security.status,
      security_scanned_at: security.scannedAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.skills.unshift(newSkill);
    return newSkill;
  }

  async toggleSaveSkill(skillId: string): Promise<boolean> {
    const isSaved = this.savedSkillIds.has(skillId);
    const skill = await this.getSkillById(skillId);

    if (isSaved) {
      this.savedSkillIds.delete(skillId);
      if (skill) skill.save_count = Math.max(0, skill.save_count - 1);
      return false;
    } else {
      this.savedSkillIds.add(skillId);
      if (skill) skill.save_count += 1;
      return true;
    }
  }

  isSaved(skillId: string): boolean {
    return this.savedSkillIds.has(skillId);
  }

  async getSavedSkills(): Promise<CanonicalSkill[]> {
    return this.skills.filter((s) => this.savedSkillIds.has(s.id));
  }

  async addReview(skillId: string, rating: number, content: string): Promise<SkillReview> {
    const review: SkillReview = {
      id: `rev-${Date.now()}`,
      skill_id: skillId,
      user_id: 'user-current',
      user_name: 'You',
      rating,
      content,
      created_at: new Date().toISOString(),
    };

    if (!this.reviews[skillId]) {
      this.reviews[skillId] = [];
    }
    this.reviews[skillId].unshift(review);

    // Update Skill rating average
    const skill = await this.getSkillById(skillId);
    if (skill) {
      const currentTotal = skill.rating_average * skill.rating_count;
      skill.rating_count += 1;
      skill.rating_average = Number(((currentTotal + rating) / skill.rating_count).toFixed(2));
    }

    return review;
  }

  async getReviews(skillId: string): Promise<SkillReview[]> {
    return this.reviews[skillId] || [];
  }
}

export const skillService = new SkillService();
