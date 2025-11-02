-- Create enum types
create type public.app_role as enum ('admin', 'editor');
create type public.tool_status as enum ('active', 'testing', 'deprecated');
create type public.content_status as enum ('draft', 'review', 'published', 'archived');
create type public.funnel_stage as enum ('TOFU', 'MOFU', 'BOFU');
create type public.citation_status as enum ('valid', 'broken', 'outdated');

-- User roles table (security definer pattern)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Authors table
create table public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  bio text,
  credentials jsonb default '[]'::jsonb,
  linkedin_url text,
  photo_url text,
  expertise_areas text[] default array[]::text[],
  is_reviewer boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.authors enable row level security;

-- AI Tools table
create table public.ai_tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  url text,
  rating integer check (rating >= 1 and rating <= 5),
  use_case text,
  internal_notes text,
  api_key_required boolean default false,
  cost_per_month numeric(10,2),
  status tool_status default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

alter table public.ai_tools enable row level security;

-- Blog posts table
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  meta_description text,
  content text,
  funnel_stage funnel_stage,
  status content_status default 'draft',
  author_id uuid references public.authors(id),
  reviewed_by uuid references public.authors(id),
  published_at timestamptz,
  seo_score integer,
  schema_data jsonb,
  citations jsonb default '[]'::jsonb,
  category text,
  tags text[] default array[]::text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.blog_posts enable row level security;

-- QA articles table
create table public.qa_articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  question text not null,
  answer text not null,
  meta_description text,
  funnel_stage funnel_stage,
  status content_status default 'draft',
  author_id uuid references public.authors(id),
  reviewed_by uuid references public.authors(id),
  published_at timestamptz,
  faq_schema jsonb,
  citations jsonb default '[]'::jsonb,
  tags text[] default array[]::text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.qa_articles enable row level security;

-- Citations table
create table public.citations (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  title text,
  last_checked timestamptz,
  status citation_status default 'valid',
  authority_score integer,
  used_in_posts integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.citations enable row level security;

-- Content updates table
create table public.content_updates (
  id uuid primary key default gen_random_uuid(),
  post_id uuid,
  post_type text,
  change_type text,
  description text,
  changed_by uuid references auth.users(id),
  changed_at timestamptz default now()
);

alter table public.content_updates enable row level security;

-- Generated images table
create table public.generated_images (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  alt_text text,
  storage_url text,
  tool_used text,
  prompt_used text,
  used_in_posts uuid[] default array[]::uuid[],
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

alter table public.generated_images enable row level security;

-- RLS Policies
-- Public can read published content
create policy "Anyone can view published blog posts"
  on public.blog_posts for select
  using (status = 'published');

create policy "Anyone can view published QA articles"
  on public.qa_articles for select
  using (status = 'published');

create policy "Anyone can view authors"
  on public.authors for select
  using (true);

-- Only admins can manage content
create policy "Admins can manage blog posts"
  on public.blog_posts for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage QA articles"
  on public.qa_articles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage authors"
  on public.authors for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage AI tools"
  on public.ai_tools for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage citations"
  on public.citations for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view content updates"
  on public.content_updates for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage images"
  on public.generated_images for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage user roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_authors_updated_at before update on public.authors
  for each row execute function public.update_updated_at_column();

create trigger update_ai_tools_updated_at before update on public.ai_tools
  for each row execute function public.update_updated_at_column();

create trigger update_blog_posts_updated_at before update on public.blog_posts
  for each row execute function public.update_updated_at_column();

create trigger update_qa_articles_updated_at before update on public.qa_articles
  for each row execute function public.update_updated_at_column();

create trigger update_citations_updated_at before update on public.citations
  for each row execute function public.update_updated_at_column();