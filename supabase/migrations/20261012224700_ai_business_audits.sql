-- AI Business Audit: stores one row per client engagement so the admin can run,
-- list and reopen audits. Admin-only, matching the has_role(auth.uid(), 'admin')
-- pattern used by the other admin tables in this project.

create table public.ai_business_audits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  status text not null default 'draft' check (status in ('draft','sent','won','lost')),
  business_name text,
  industry text,
  contact text,
  assessment_date date,
  team_size int,
  consultant text default 'ANAMECHI Marketing',
  goals text,
  tools text,
  constraints text,
  workflows jsonb not null default '[]'::jsonb,
  pricing jsonb not null default '{}'::jsonb,
  price_in_report boolean not null default true
);

alter table public.ai_business_audits enable row level security;

create policy "Admins can manage ai business audits"
  on public.ai_business_audits
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger update_ai_business_audits_updated_at
  before update on public.ai_business_audits
  for each row execute function public.update_updated_at_column();

create index ai_business_audits_created_at_idx
  on public.ai_business_audits (created_at desc);
