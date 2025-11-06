export type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU';
export type ContentStatus = 'draft' | 'published' | 'archived';

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  funnel_stage: FunnelStage | null;
  keywords: string[];
  author_id: string | null;
  published_at: string | null;
  updated_at: string;
  meta_description: string | null;
  schema_data: object | null;
  featured_image_url?: string | null;
  reading_time: number;
  citations: Citation[];
  status: ContentStatus;
  category?: string | null;
  tags?: string[];
}

export interface Citation {
  id: string;
  url: string;
  title: string | null;
  last_checked: string | null;
  status: 'valid' | 'broken' | 'redirected' | 'pending';
  authority_score?: number | null;
}

export interface MasterPrompt {
  id: string;
  name: string;
  category: 'blog' | 'qa' | 'image' | 'diagram' | 'faq';
  prompt_text: string;
  variables: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ImageGeneration {
  id: string;
  prompt: string | null;
  alt_text: string | null;
  filename: string;
  storage_url: string | null;
  tool_used: string | null;
  created_at: string;
  created_by: string | null;
  used_in_posts: string[];
}

export interface DiagramGeneration {
  id: string;
  title: string;
  mermaid_code: string;
  svg_url?: string | null;
  created_at: string;
  created_by?: string | null;
  used_in_posts?: string[];
}
