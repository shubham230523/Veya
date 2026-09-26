import { CanonicalSkill, SkillCategory, SkillReview, SkillSourceInfo } from '../../types/skill';
import { scanSkillContent } from '../../core/security/securityScanner';
import { supabase, isSupabaseConfigured } from '../../core/database/supabase';
import { OpenRouterClient } from '../../core/ai/openrouterClient';

class SkillService {
  private savedSkillIds: Set<string> = new Set();
  private reviews: Record<string, SkillReview[]> = {};

  registerSkill(skill: CanonicalSkill) {
    // In-memory registration if needed for active session
  }

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
        if (!error && data) {
          let result = (data as CanonicalSkill[]).map((s) => {
            if (!s.source) {
              return {
                ...s,
                source: { type: 'user_created' as const, source_name: 'Custom User Skill', author: 'You' },
              };
            }
            return s;
          });

          if (filter?.tag) {
            result = result.filter((s) => s.tags && s.tags.includes(filter.tag!));
          }

          return result;
        }
      } catch (err: any) {
        console.warn('Supabase query error:', err.message);
      }
    }

    return [];
  }

  async getSkillById(id: string): Promise<CanonicalSkill | undefined> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('skills').select('*').eq('id', id).single();
        if (!error && data) {
          const item = data as CanonicalSkill;
          if (!item.source) {
            item.source = { type: 'user_created', source_name: 'Custom User Skill', author: 'You' };
          }
          return item;
        }
      } catch (err: any) {
        console.warn('Supabase getSkillById error:', err.message);
      }
    }
    return undefined;
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

    const defaultSource: SkillSourceInfo = {
      type: 'user_created',
      source_name: 'Custom User Skill',
      author: 'You',
    };

    const source = data.source || defaultSource;

    const dbPayload = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      objective: data.objective,
      inputs: data.inputs,
      prerequisites: data.prerequisites,
      instructions: data.instructions,
      steps: data.steps,
      rules: data.rules,
      expected_output: data.expected_output,
      validation: data.validation || null,
      category: data.category,
      tags: data.tags,
      visibility: data.visibility,
      version: data.version,
      rating_average: 5.0,
      rating_count: 1,
      usage_count: 1,
      save_count: 0,
      security_scan_status: security.status,
      security_scanned_at: security.scannedAt,
      creator_id: null,
    };

    if (isSupabaseConfigured()) {
      const { data: inserted, error } = await supabase
        .from('skills')
        .insert([dbPayload])
        .select()
        .single();

      if (!error && inserted) {
        const finalSkill: CanonicalSkill = {
          ...inserted,
          source: inserted.source || source,
        };
        return finalSkill;
      } else if (error) {
        console.error('Supabase createSkill error:', error.message);
        throw new Error(`Failed to save skill to Supabase: ${error.message}`);
      }
    }

    throw new Error('Supabase is not configured.');
  }

  async researchWorkflowSkillsForIdea(
    ideaPrompt: string,
    onProgress?: (accumulatedText: string) => void
  ): Promise<CanonicalSkill[]> {
    const cleanIdea = ideaPrompt.trim();
    if (!cleanIdea) return [];

    const searchStartTime = Date.now();
    console.log(`[Veya AI Workflow Research] 🚀 Researching AI skills on web for idea: "${cleanIdea}"`);

    const systemInstruction = `You are Veya AI Workflow Research Engine.
The user wants to execute a real-world product idea or engineering goal.
Your job is to research the web prompt ecosystem and generate 4 to 7 production-ready, modular Canonical AI Skills required to execute this specific idea end-to-end.

Return ONLY a JSON array of skill objects matching this schema:
[
  {
    "name": "Specific Skill Title",
    "description": "Clear 1-2 sentence description",
    "objective": "Detailed goal statement",
    "instructions": "Full step-by-step instructions for LLM execution",
    "steps": [
      { "number": 1, "title": "Step title" },
      { "number": 2, "title": "Step title" }
    ],
    "rules": ["Rule constraint 1", "Rule constraint 2"],
    "expectedOutput": "Specific deliverable structure",
    "category": "One of: Productivity, Design, Business, Coding, AI, Research, Testing",
    "tags": ["Tag1", "Tag2"]
  }
]`;

    try {
      const results = await OpenRouterClient.generateStructuredJSONStream<any[]>(
        systemInstruction,
        `PRODUCT IDEA GOAL: "${cleanIdea}"`,
        (_chunk, accumulated) => {
          if (onProgress) {
            onProgress(accumulated);
          }
        },
        undefined,
        30000
      );

      if (!Array.isArray(results) || results.length === 0) {
        return this.generateFallbackSkillsForIdea(cleanIdea);
      }

      const generatedSkills: CanonicalSkill[] = [];
      for (let idx = 0; idx < results.length; idx++) {
        const item = results[idx];
        const baseSlug = (item.name || 'workflow-skill')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const slug = `${baseSlug}-${Date.now().toString().slice(-4)}-${idx}`;

        try {
          const created = await this.createSkill({
            name: item.name || `Skill ${idx + 1}`,
            slug,
            description: item.description || `AI researched skill for "${cleanIdea}"`,
            objective: item.objective || 'Researched skill execution spec',
            instructions: item.instructions || 'Execute skill according to user prompt requirements.',
            inputs: [{ name: 'userContext', description: 'Context input', required: true }],
            prerequisites: ['Idea Context'],
            steps: item.steps && Array.isArray(item.steps) ? item.steps : [
              { number: 1, title: 'Context Analysis' },
              { number: 2, title: 'Execution Pipeline' },
            ],
            rules: item.rules && Array.isArray(item.rules) ? item.rules : ['Follow best practices'],
            expected_output: item.expectedOutput || 'Structured deliverable document.',
            visibility: 'public',
            version: 1,
            category: item.category || 'Coding',
            tags: item.tags && Array.isArray(item.tags) ? item.tags : [item.category || 'Coding', 'Researched'],
            providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
            source: {
              type: 'imported',
              source_name: 'AI Web Research',
              author: 'Veya AI',
            },
          });
          generatedSkills.push(created);
        } catch (err) {
          // If creation error occurs, format in-memory fallback object
          generatedSkills.push({
            id: `idea-skill-${Date.now()}-${idx}`,
            name: item.name || `Skill ${idx + 1}`,
            slug,
            description: item.description || `AI researched skill for "${cleanIdea}"`,
            objective: item.objective || 'Researched skill execution spec',
            instructions: item.instructions || 'Execute skill according to user prompt requirements.',
            inputs: [{ name: 'userContext', description: 'Context input', required: true }],
            prerequisites: ['Idea Context'],
            steps: item.steps || [],
            rules: item.rules || [],
            expected_output: item.expectedOutput || 'Structured deliverable.',
            visibility: 'public',
            version: 1,
            rating_average: 5.0,
            rating_count: 1,
            usage_count: 10,
            save_count: 1,
            security_scan_status: 'clean',
            security_scanned_at: new Date().toISOString(),
            category: item.category || 'Coding',
            tags: item.tags || ['Coding'],
            providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
            source: { type: 'imported', source_name: 'AI Web Research', author: 'Veya AI' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

      return generatedSkills;
    } catch (err: any) {
      return this.generateFallbackSkillsForIdea(cleanIdea);
    }
  }

  private generateFallbackSkillsForIdea(cleanIdea: string): CanonicalSkill[] {
    const lowerIdea = cleanIdea.toLowerCase();
    const isMobile = lowerIdea.includes('app') || lowerIdea.includes('mobile') || lowerIdea.includes('note');
    const isAudio = lowerIdea.includes('audio') || lowerIdea.includes('transcrib') || lowerIdea.includes('voice') || lowerIdea.includes('speech');
    const isNotes = lowerIdea.includes('note') || lowerIdea.includes('summar') || lowerIdea.includes('organiz');

    const skills: CanonicalSkill[] = [];

    const s1: CanonicalSkill = {
      id: `fallback-prd-${Date.now()}`,
      name: 'Product Requirements & Competitor Specs',
      slug: 'product-requirements-spec',
      description: `Synthesize PRD specs, competitor research, and user stories for the product concept`,
      objective: 'Define clear user stories, functional requirements, competitor research, and MVP boundaries.',
      instructions: `1. Define target audience and user personas.\n2. Conduct competitor research and market positioning.\n3. Outline MVP scope boundaries and acceptance criteria.`,
      inputs: [{ name: 'userContext', description: 'Idea context', required: true }],
      prerequisites: ['Product Goal'],
      steps: [{ number: 1, title: 'PRD & Market Research' }],
      rules: ['Keep MVP actionable and scoped to core value proposition'],
      expected_output: 'Structured PRD and competitor analysis document',
      visibility: 'public',
      version: 1,
      rating_average: 5.0,
      rating_count: 1,
      usage_count: 10,
      save_count: 1,
      security_scan_status: 'clean',
      security_scanned_at: new Date().toISOString(),
      category: 'Productivity',
      tags: ['Productivity', 'PRD', 'Planning', 'Competitor Research'],
      providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
      source: { type: 'official', source_name: 'Veya AI' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    skills.push(s1);

    const s2: CanonicalSkill = {
      id: `fallback-arch-${Date.now()}`,
      name: isMobile ? 'React Native & Expo Mobile Architecture' : 'Full-Stack Software Architecture',
      slug: 'system-architecture',
      description: `Design software architecture and state navigation structure`,
      objective: 'Define clean frontend UI layout, state management, and API routing.',
      instructions: isMobile
        ? `1. Configure navigation structure using Expo Router.\n2. Set up Zustand / React state store for session & data management.\n3. Implement reusable UI theme tokens and component hierarchy.`
        : `1. Design system component architecture.\n2. Set up navigation and state management.\n3. Configure API client layer.`,
      inputs: [{ name: 'userContext', description: 'PRD specs', required: true }],
      prerequisites: ['PRD Specs'],
      steps: [{ number: 1, title: 'Architecture Blueprint' }],
      rules: ['Follow clean code modularity and cross-platform best practices'],
      expected_output: 'TypeScript architecture specification and navigation blueprint',
      visibility: 'public',
      version: 1,
      rating_average: 5.0,
      rating_count: 1,
      usage_count: 10,
      save_count: 1,
      security_scan_status: 'clean',
      security_scanned_at: new Date().toISOString(),
      category: 'Coding',
      tags: ['Coding', 'Architecture', 'React Native'],
      providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
      source: { type: 'official', source_name: 'Veya AI' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    skills.push(s2);

    return skills;
  }

  async searchWebSkills(query: string): Promise<CanonicalSkill[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const systemInstruction = `You are Veya Web AI Skill Discovery Engine.
Your job is to search the global AI skill & prompt ecosystem for the user's search topic and curate 3 structured, high-quality, production-ready Canonical AI Skills.

Return ONLY a JSON array of 3 skill objects matching this schema:
[
  {
    "name": "Specific Skill Title",
    "description": "Clear 1-2 sentence description",
    "objective": "Detailed goal statement",
    "instructions": "Full step-by-step instructions for LLM execution",
    "rules": ["Rule 1 constraint", "Rule 2 constraint"],
    "expectedOutput": "Specific deliverable structure",
    "category": "One of: Coding, AI, Research, Learning, Creator, Productivity, Business, Design, Testing",
    "tags": ["Tag1", "Tag2", "Tag3"]
  }
]`;

    try {
      const results = await OpenRouterClient.generateStructuredJSON<any[]>(
        systemInstruction,
        `SEARCH QUERY TOPIC: "${cleanQuery}"`
      );

      if (!Array.isArray(results)) return [];

      const skills: CanonicalSkill[] = [];
      for (let idx = 0; idx < results.length; idx++) {
        const item = results[idx];
        const baseSlug = (item.name || 'web-skill')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const slug = `${baseSlug}-${Date.now().toString().slice(-4)}-${idx}`;

        try {
          const created = await this.createSkill({
            name: item.name || 'Discovered Web Skill',
            slug,
            description: item.description || `AI discovered skill for "${cleanQuery}"`,
            objective: item.objective || 'Discovered web prompt skill',
            instructions: item.instructions || 'Execute skill according to user prompt.',
            inputs: [{ name: 'userContext', description: 'Context input', required: true }],
            prerequisites: ['Web AI Discovery'],
            steps: [
              { number: 1, title: 'Context Analysis' },
              { number: 2, title: 'Execution Pipeline' },
            ],
            rules: item.rules && Array.isArray(item.rules) ? item.rules : ['Follow best practices'],
            expected_output: item.expectedOutput || 'Structured Markdown deliverable.',
            visibility: 'public',
            version: 1,
            category: item.category || 'Coding',
            tags: item.tags && Array.isArray(item.tags) ? item.tags : [item.category || 'Coding', 'Web Discovered'],
            providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
            source: {
              type: 'imported',
              source_name: 'Web AI Skill Discovery',
              author: 'Web Ecosystem',
            },
          });
          skills.push(created);
        } catch (err) {
          skills.push({
            id: `web-found-${Date.now()}-${idx}`,
            name: item.name || 'Discovered Web Skill',
            slug,
            description: item.description || `AI discovered skill for "${cleanQuery}"`,
            objective: item.objective || 'Discovered web prompt skill',
            instructions: item.instructions || 'Execute skill according to user prompt.',
            inputs: [{ name: 'userContext', description: 'Context input', required: true }],
            prerequisites: ['Web AI Discovery'],
            steps: [{ number: 1, title: 'Context Analysis' }],
            rules: item.rules || [],
            expected_output: item.expectedOutput || 'Markdown deliverable.',
            visibility: 'public',
            version: 1,
            rating_average: 4.9,
            rating_count: 1,
            usage_count: 15,
            save_count: 2,
            security_scan_status: 'clean',
            security_scanned_at: new Date().toISOString(),
            category: item.category || 'Coding',
            tags: item.tags || ['Coding', 'Web Discovered'],
            providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
            source: { type: 'imported', source_name: 'Web AI Skill Discovery', author: 'Web Ecosystem' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

      return skills;
    } catch (err: any) {
      throw err;
    }
  }

  async importSkillFromUrl(url: string): Promise<CanonicalSkill> {
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      throw new Error('Please enter a valid HTTP/HTTPS URL or raw GitHub prompt link.');
    }

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

  async toggleSaveSkill(skillId: string, optionalSkill?: CanonicalSkill): Promise<boolean> {
    const isSaved = this.savedSkillIds.has(skillId);
    if (isSaved) {
      this.savedSkillIds.delete(skillId);
      return false;
    } else {
      this.savedSkillIds.add(skillId);
      return true;
    }
  }

  isSaved(skillId: string): boolean {
    return this.savedSkillIds.has(skillId);
  }

  async getSavedSkills(): Promise<CanonicalSkill[]> {
    const all = await this.getSkills();
    return all.filter((s) => this.savedSkillIds.has(s.id));
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

    return review;
  }

  async getReviews(skillId: string): Promise<SkillReview[]> {
    return this.reviews[skillId] || [];
  }
}

export const skillService = new SkillService();
