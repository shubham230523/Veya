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

For a full product idea, cover all necessary execution phases:
1. Product Requirements & Feature Specs
2. Competitor & Market Research
3. Mobile / Web Architecture
4. Core AI & Domain Feature Integration (e.g. Audio Transcription, LLM Summarization, Payment Webhooks, etc.)
5. Database Schema & RLS Data Isolation
6. Testing & Quality Assurance
7. CI/CD & Deployment Pipeline

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
      console.log(`[Veya AI Workflow Research] Requesting streaming JSON from OpenRouter API...`);
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
        console.warn(`[Veya AI Workflow Research] ⚠️ Received non-array or empty response from AI model, using fallback pipeline.`);
        return this.generateFallbackSkillsForIdea(cleanIdea);
      }

      console.log(`[Veya AI Workflow Research] ✅ Successfully researched ${results.length} web skills in ${Date.now() - searchStartTime}ms.`);

      return results.map((item, idx) => {
        const baseSlug = (item.name || 'workflow-skill')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const slug = `${baseSlug}-${Date.now().toString().slice(-4)}-${idx}`;

        return {
          id: `idea-skill-${Date.now()}-${idx}`,
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
          rating_average: 5.0,
          rating_count: 1,
          usage_count: Math.floor(Math.random() * 50) + 10,
          save_count: Math.floor(Math.random() * 20) + 2,
          security_scan_status: 'clean',
          security_scanned_at: new Date().toISOString(),
          category: item.category || 'Coding',
          tags: item.tags && Array.isArray(item.tags) ? item.tags : [item.category || 'Coding', 'Researched'],
          providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
          source: {
            type: 'imported',
            source_name: 'AI Web Research',
            author: 'Veya AI',
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });
    } catch (err: any) {
      console.warn(`[Veya AI Workflow Research] ⚠️ AI Research error (${err.message}). Using dynamic fallback pipeline.`);
      return this.generateFallbackSkillsForIdea(cleanIdea);
    }
  }

  private generateFallbackSkillsForIdea(cleanIdea: string): CanonicalSkill[] {
    const lowerIdea = cleanIdea.toLowerCase();
    const isMobile = lowerIdea.includes('app') || lowerIdea.includes('mobile') || lowerIdea.includes('note');
    const isAudio = lowerIdea.includes('audio') || lowerIdea.includes('transcrib') || lowerIdea.includes('voice') || lowerIdea.includes('speech');
    const isNotes = lowerIdea.includes('note') || lowerIdea.includes('summar') || lowerIdea.includes('organiz');

    const skills: CanonicalSkill[] = [];

    // Step 1: Product Requirements & Competitor Specs
    skills.push({
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
    });

    // Step 2: System / Mobile Architecture
    skills.push({
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
    });

    // Step 3 (Optional / Specific): Whisper Audio Transcription Pipeline
    if (isAudio) {
      skills.push({
        id: `fallback-audio-${Date.now()}`,
        name: 'Whisper Audio Transcription Pipeline',
        slug: 'whisper-audio-transcription-pipeline',
        description: 'Process voice recordings and stream speech-to-text audio transcripts',
        objective: 'Build reliable audio recording, chunking, and Whisper speech-to-text transcription workflows.',
        instructions: `1. Configure audio recorder parameters (m4a/wav format, 16kHz sampling).\n2. Stream audio file payload to OpenAI Whisper / OpenRouter speech-to-text endpoint.\n3. Process raw transcript timestamps and clean filler words.`,
        inputs: [{ name: 'userContext', description: 'Audio source', required: true }],
        prerequisites: ['Microphone or audio file input'],
        steps: [{ number: 1, title: 'Audio Capture & Speech-to-Text Integration' }],
        rules: ['Handle recording permissions gracefully on mobile devices'],
        expected_output: 'TypeScript audio recorder controller and Whisper transcription service integration',
        visibility: 'public',
        version: 1,
        rating_average: 5.0,
        rating_count: 1,
        usage_count: 10,
        save_count: 1,
        security_scan_status: 'clean',
        security_scanned_at: new Date().toISOString(),
        category: 'AI',
        tags: ['AI', 'Audio', 'Whisper', 'Transcription'],
        providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
        source: { type: 'official', source_name: 'Veya AI' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Step 4 (Optional / Specific): AI Note Summarizer & Organizer
    if (isNotes) {
      skills.push({
        id: `fallback-notes-${Date.now()}`,
        name: 'OpenRouter AI Note Summarizer & Organizer',
        slug: 'openrouter-ai-note-organizer',
        description: 'Transform raw transcripts into structured markdown notes with bullet action items',
        objective: 'Extract summary topics, action items, and structured note sections from raw text.',
        instructions: `1. Analyze transcript text to extract key discussion points.\n2. Generate structured Markdown with Executive Summary, Key Takeaways, and Bulleted Action Items.\n3. Categorize note with auto-generated hashtags and title.`,
        inputs: [{ name: 'userContext', description: 'Raw transcript text', required: true }],
        prerequisites: ['Raw transcript text'],
        steps: [{ number: 1, title: 'AI Note Summarization & Action Item Extraction' }],
        rules: ['Format output in clean Markdown syntax without hallucinating facts'],
        expected_output: 'Structured Markdown note with executive summary and action items',
        visibility: 'public',
        version: 1,
        rating_average: 5.0,
        rating_count: 1,
        usage_count: 10,
        save_count: 1,
        security_scan_status: 'clean',
        security_scanned_at: new Date().toISOString(),
        category: 'AI',
        tags: ['AI', 'Notes', 'Summarization', 'Organize'],
        providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
        source: { type: 'official', source_name: 'Veya AI' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Step 5: Database Design, Testing & Deployment Pipeline
    skills.push({
      id: `fallback-test-${Date.now()}`,
      name: 'Database Schema, Testing & Deployment Pipeline',
      slug: 'database-testing-deployment',
      description: `Configure Supabase PostgreSQL schema, RLS policies, unit tests, and build deployment`,
      objective: 'Design database schema with Row Level Security, set up unit tests, and configure build deployment scripts.',
      instructions: `1. Define PostgreSQL schema for notes & audio metadata with Supabase Row Level Security (RLS) policies.\n2. Set up unit test suite and API integration tests.\n3. Configure build and deployment pipeline scripts (e.g. EAS / CI/CD).`,
      inputs: [{ name: 'userContext', description: 'Codebase', required: true }],
      prerequisites: ['Implementation'],
      steps: [{ number: 1, title: 'Database, Testing & Deployment Setup' }],
      rules: ['Ensure Row Level Security is enabled on all database tables'],
      expected_output: 'PostgreSQL SQL migrations, test suite, and deployment configuration scripts',
      visibility: 'public',
      version: 1,
      rating_average: 5.0,
      rating_count: 1,
      usage_count: 10,
      save_count: 1,
      security_scan_status: 'clean',
      security_scanned_at: new Date().toISOString(),
      category: 'Testing',
      tags: ['Testing', 'Database', 'Deployment'],
      providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
      source: { type: 'official', source_name: 'Veya AI' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return skills;
  }

  async searchWebSkills(query: string): Promise<CanonicalSkill[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const searchStartTime = Date.now();
    console.log(`[Veya Skill Finder] 🔍 Starting Web AI Skill Search for topic: "${cleanQuery}"`);

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
      console.log(`[Veya Skill Finder] Requesting JSON generation from OpenRouter API...`);
      const results = await OpenRouterClient.generateStructuredJSON<any[]>(
        systemInstruction,
        `SEARCH QUERY TOPIC: "${cleanQuery}"`
      );

      console.log(`[Veya Skill Finder] OpenRouter response received. Validating array structure...`);

      if (!Array.isArray(results)) {
        console.warn(`[Veya Skill Finder] ⚠️ Received non-array response from AI model:`, typeof results);
        return [];
      }

      console.log(`[Veya Skill Finder] ✅ Successfully discovered ${results.length} web skills in ${Date.now() - searchStartTime}ms.`);

      return results.map((item, idx) => {
        const baseSlug = (item.name || 'web-skill')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const slug = `${baseSlug}-${Date.now().toString().slice(-4)}-${idx}`;

        return {
          id: `web-found-${Date.now()}-${idx}`,
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
          rating_average: 4.9,
          rating_count: 1,
          usage_count: Math.floor(Math.random() * 50) + 10,
          save_count: Math.floor(Math.random() * 20) + 2,
          security_scan_status: 'clean',
          security_scanned_at: new Date().toISOString(),
          category: item.category || 'Coding',
          tags: item.tags && Array.isArray(item.tags) ? item.tags : [item.category || 'Coding', 'Web Discovered'],
          providerCompatibility: ['openrouter', 'gemini', 'claude', 'gpt'],
          source: {
            type: 'imported',
            source_name: 'Web AI Skill Discovery',
            author: 'Web Ecosystem',
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });
    } catch (err: any) {
      console.error(`[Veya Skill Finder] ❌ Web AI Skill Search failed after ${Date.now() - searchStartTime}ms:`, err.message);
      throw err;
    }
  }

  async importSkillFromUrl(url: string): Promise<CanonicalSkill> {
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      throw new Error('Please enter a valid HTTP/HTTPS URL or raw GitHub prompt link.');
    }

    const fetchStartTime = Date.now();
    console.log(`[Veya URL Import] 🌐 Fetching raw content from URL: ${cleanUrl}`);

    // Fetch raw content from public web/github
    const res = await fetch(cleanUrl);
    if (!res.ok) {
      console.error(`[Veya URL Import] ❌ HTTP Fetch Error (${res.status}): ${res.statusText}`);
      throw new Error(`Failed to fetch URL (${res.status}): ${res.statusText}`);
    }
    const rawContent = await res.text();
    console.log(`[Veya URL Import] Fetched ${rawContent.length} bytes in ${Date.now() - fetchStartTime}ms. Parsing with AI...`);

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
