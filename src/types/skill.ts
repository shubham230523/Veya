export type ProviderType = 'gemini' | 'claude' | 'gpt';

export type SkillVisibility = 'public' | 'private' | 'unlisted';

export type SecurityScanStatus = 'clean' | 'warning' | 'flagged';

export type SkillCategory =
  | 'Coding'
  | 'AI'
  | 'Research'
  | 'Learning'
  | 'Creator'
  | 'Productivity'
  | 'Business'
  | 'Design'
  | 'Testing';

export interface SkillInputParam {
  name: string;
  description: string;
  required: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array';
  defaultValue?: string;
}

export interface SkillStepItem {
  number: number;
  title: string;
  description?: string;
}

export interface SkillSourceInfo {
  type: 'community' | 'github' | 'official' | 'user_created' | 'imported';
  source_url?: string;
  source_name: string;
  author?: string;
  published_at?: string;
}

export interface CanonicalSkill {
  id: string;
  creator_id?: string;
  name: string;
  slug: string;
  description: string;
  objective: string;
  inputs: SkillInputParam[];
  prerequisites: string[];
  instructions: string;
  steps: SkillStepItem[];
  rules: string[];
  expected_output: string;
  validation?: string;
  visibility: SkillVisibility;
  version: number;
  rating_average: number;
  rating_count: number;
  usage_count: number;
  save_count: number;
  security_scan_status: SecurityScanStatus;
  security_scanned_at: string;
  category: SkillCategory;
  tags: string[];
  providerCompatibility: ProviderType[];
  source: SkillSourceInfo;
  created_at: string;
  updated_at: string;
}

export interface SkillReview {
  id: string;
  skill_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  content: string;
  created_at: string;
}
