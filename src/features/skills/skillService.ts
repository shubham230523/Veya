import { CanonicalSkill, SkillCategory, SkillReview } from '../../types/skill';
import { SEED_SKILLS } from '../../core/database/seed';
import { scanSkillContent } from '../../core/security/securityScanner';
import { supabase, isSupabaseConfigured } from '../../core/database/supabase';
import { OpenRouterClient } from '../../core/ai/openrouterClient';

class SkillService {
  private skills: CanonicalSkill[] = [...SEED_SKILLS];
  private savedSkillIds: Set<string> = new Set();
  private reviews: Record<string, SkillReview[]> = {};

  async getSkills(filter?: {
    category?: SkillCategory | 'All';
    search?: string;
    tag?: string;
  }): Promise<CanonicalSkill[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('skills').select('*');

        if (filter?.category && filter.category !== 'All') {
          query = query.eq('category', filter.category);
        }

        if (filter?.search && filter.search.trim().length > 0) {
          query = query.or(
            `name.ilike.%${filter.search}%,description.ilike.%${filter.search}%,objective.ilike.%${filter.search}%`
          );
        }

        const { data, error } = await query;
        if (error) {
          console.warn('Supabase query error:', error.message);
        } else if (data) {
          return data as CanonicalSkill[];
        }
      } catch (err: any) {
        console.warn('Supabase query fallback error:', err.message);
      }
    }

    // In-Memory / Fallback Search (Used when Supabase is NOT configured)
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
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('skills').select('*').eq('id', id).single();
        if (!error && data) return data as CanonicalSkill;
        if (!error && !data) return undefined;
      } catch (err: any) {
        console.warn('Supabase getSkillById error:', err.message);
      }
    }
    return this.skills.find((s) => s.id === id);
  }

  async createSkill(
    data: Omit<
      CanonicalSkill,
      | 'id'
      | 'created_at'
      | 'updated_at'
      | 'rating_average'
      | 'rating_count'
      | 'usage_count'
      | 'save_count'
      | 'security_scan_status'
      | 'security_scanned_at'
    >
  ): Promise<CanonicalSkill> {
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

    if (isSupabaseConfigured()) {
      try {
        const dbPayload = {
          name: newSkill.name,
          slug: newSkill.slug,
          description: newSkill.description,
          objective: newSkill.objective,
          inputs: newSkill.inputs,
          prerequisites: newSkill.prerequisites,
          instructions: newSkill.instructions,
          steps: newSkill.steps,
          rules: newSkill.rules,
          expected_output: newSkill.expected_output,
          validation: newSkill.validation || null,
          category: newSkill.category,
          tags: newSkill.tags,
          visibility: newSkill.visibility,
          version: newSkill.version,
          rating_average: newSkill.rating_average,
          rating_count: newSkill.rating_count,
          usage_count: newSkill.usage_count,
          save_count: newSkill.save_count,
          security_scan_status: newSkill.security_scan_status,
          security_scanned_at: newSkill.security_scanned_at,
          creator_id: null,
        };

        const { data: inserted, error } = await supabase
          .from('skills')
          .insert([dbPayload])
          .select()
          .single();

        if (error) {
          console.warn('Supabase createSkill insert error:', error.message);
        } else if (inserted) {
          return inserted as CanonicalSkill;
        }
      } catch (err: any) {
        console.warn('Supabase createSkill error:', err.message);
      }
    }

    this.skills.unshift(newSkill);
    return newSkill;
  }

  async importSkillFromUrl(url: string): Promise<CanonicalSkill> {
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      throw new Error('Please enter a valid HTTP/HTTPS URL or raw GitHub prompt link.');
    }

    // Fetch raw content from public web/github
    const res = await fetch(cleanUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch URL (${res.status}): ${res.statusText}`);
    }
    const rawContent = await res.text();

    const systemInstruction = `You are Veya AI Skill Extractor.
Extract and normalize the raw prompt text into Veya Canonical Skill JSON format.

Return ONLY a JSON object with this schema:
{
  "name": "Concise Skill Name",
  "description": "Short description",
  "objective": "Clear goal statement",
  "instructions": "Full step-by-step instructions for LLM execution",
  "rules": ["Constraint 1", "Constraint 2"],
  "expectedOutput": "Expected deliverable format",
  "category": "One of: Coding, AI, Research, Learning, Creator, Productivity, Business, Design, Testing"
}`;

    const extracted = await OpenRouterClient.generateStructuredJSON<any>(
      systemInstruction,
      `URL SOURCE: ${cleanUrl}\n\nRAW CONTENT:\n${rawContent.slice(0, 4000)}`
    );

    const baseSlug = (extracted.name || 'imported-skill')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    return this.createSkill({
      name: extracted.name || 'Imported Web Skill',
      slug,
      description: extracted.description || `Imported skill from ${cleanUrl}`,
      objective: extracted.objective || 'External AI prompt skill',
      instructions: extracted.instructions || rawContent,
      inputs: [{ name: 'userContext', description: 'Context input', required: true }],
      prerequisites: ['External prompt source'],
      steps: [
        { number: 1, title: 'Input Ingestion' },
        { number: 2, title: 'Execution Pipeline' },
      ],
      rules: extracted.rules && Array.isArray(extracted.rules) ? extracted.rules : ['Follow web source specs'],
      expected_output: extracted.expectedOutput || 'Structured output deliverable.',
      visibility: 'public',
      version: 1,
      category: extracted.category || 'Coding',
      tags: [extracted.category || 'Coding', 'Imported', 'Web'],
      providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
      source: {
        type: 'imported',
        source_url: cleanUrl,
        source_name: 'External Web Import',
        author: 'Web Source',
      },
    });
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
