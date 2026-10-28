-- Additive ANAMECHI inbox boundary. No existing role or brain grants change.
create schema anamechi_mail;
revoke all on schema anamechi_mail from public, anon;
grant usage on schema anamechi_mail to authenticated, service_role;

create table public.anamechi_email_items (
  id uuid primary key default gen_random_uuid(),
  account text not null default 'deanna.romulus@anamechimarketing.com'
    check (account = 'deanna.romulus@anamechimarketing.com'),
  message_id text not null,
  thread_id text not null,
  draft_id text,
  version integer not null default 1 check (version > 0),
  subject text not null default '',
  from_address text not null default '',
  recipients jsonb not null default '{"to":[],"cc":[],"bcc":[]}',
  thread_messages jsonb not null default '[]' check (jsonb_typeof(thread_messages)='array'),
  draft_body text not null default '',
  -- Exact provider draft and thread fingerprints are supplied by the worker.
  provider_fingerprint text,
  thread_fingerprint text,
  attachment_count integer not null default 0 check (attachment_count >= 0),
  synced_at timestamptz,
  received_at timestamptz not null default now(),
  work_status text not null default 'needs_deanna' check (work_status in
    ('needs_deanna','draft_ready','team_action','waiting_on_client','completed')),
  priority text not null default 'normal' check (priority in ('urgent','high','normal','low')),
  decision_needed text not null default '',
  next_action text not null default '',
  action_owner text not null default '',
  due_at timestamptz,
  waiting_on text not null default '',
  completion_evidence text not null default '',
  sent_message_id text,
  sent_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(account,message_id)
);

create table public.anamechi_email_jobs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null,
  item_id uuid not null references public.anamechi_email_items(id),
  version integer not null,
  approved_snapshot jsonb not null,
  approved_by uuid not null references auth.users(id),
  approved_at timestamptz not null default now(),
  channel text not null check(channel in ('dashboard','telegram')),
  status text not null default 'queued' check(status in
    ('queued','sending','sent','failed','changed','outcome_unknown','cancelled')),
  claimed_at timestamptz,
  finished_at timestamptz,
  provider_message_id text,
  error text,
  unique(item_id,version)
);

create table public.anamechi_email_events (
  id bigint generated always as identity primary key,
  item_id uuid references public.anamechi_email_items(id),
  job_id uuid references public.anamechi_email_jobs(id),
  actor uuid,
  kind text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index anamechi_email_items_queue on public.anamechi_email_items(work_status,priority,received_at desc);
create index anamechi_email_items_due on public.anamechi_email_items(due_at) where work_status <> 'completed';
create index anamechi_email_jobs_queue on public.anamechi_email_jobs(approved_at) where status='queued';
create index anamechi_email_events_item on public.anamechi_email_events(item_id,created_at desc);

alter table public.anamechi_email_items enable row level security;
alter table public.anamechi_email_jobs enable row level security;
alter table public.anamechi_email_events enable row level security;
revoke all on public.anamechi_email_items,public.anamechi_email_jobs,public.anamechi_email_events from public,anon,authenticated;
grant select on public.anamechi_email_items,public.anamechi_email_jobs,public.anamechi_email_events to authenticated;
grant all on public.anamechi_email_items,public.anamechi_email_jobs,public.anamechi_email_events to service_role;
grant usage,select on sequence public.anamechi_email_events_id_seq to service_role;
create policy inbox_owner_read on public.anamechi_email_items for select to authenticated using (public.is_super_admin((select auth.uid())));
create policy inbox_owner_jobs on public.anamechi_email_jobs for select to authenticated using (public.is_super_admin((select auth.uid())));
create policy inbox_owner_events on public.anamechi_email_events for select to authenticated using (public.is_super_admin((select auth.uid())));

-- Privileged commands live in an unexposed schema. Both the wrapper and private
-- command reject non-owner requests; callers cannot write approval tables directly.
create function anamechi_mail.command(action text, payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor uuid := auth.uid();
  item public.anamechi_email_items;
  selected jsonb;
  batch uuid := gen_random_uuid();
  job uuid;
  output jsonb := '[]';
begin
  if actor is null or not public.is_super_admin(actor) then
    raise exception 'Super Admin access required' using errcode='42501';
  end if;
  if action='approve' then
    if jsonb_typeof(payload->'items') is distinct from 'array'
       or jsonb_array_length(payload->'items') not between 1 and 100 then
      raise exception 'Select between 1 and 100 reviewed drafts';
    end if;
    if (select count(*) <> count(distinct x->>'id') from jsonb_array_elements(payload->'items') x) then
      raise exception 'Duplicate selection';
    end if;
    -- Fixed lock order prevents competing batch requests from deadlocking.
    for selected in select value from jsonb_array_elements(payload->'items') order by value->>'id' loop
      select * into item from public.anamechi_email_items where id=(selected->>'id')::uuid for update;
      if not found or item.version <> (selected->>'version')::integer then raise exception 'Draft changed. Refresh and review again.'; end if;
      if item.sent_at is not null or item.work_status <> 'draft_ready' or item.draft_id is null or btrim(item.draft_body)='' then
        raise exception 'Only current unsent drafts marked Draft Ready can be approved';
      end if;
      if item.provider_fingerprint is null or item.thread_fingerprint is null or item.synced_at is null then
        raise exception 'Draft must be synchronized with Gmail before approval';
      end if;
      -- Attachment support is intentionally fail closed until separately tested.
      if item.attachment_count <> 0 then raise exception 'Review and send drafts with attachments directly in Gmail'; end if;
      insert into public.anamechi_email_jobs(batch_id,item_id,version,approved_snapshot,approved_by,channel)
      values(batch,item.id,item.version,to_jsonb(item),actor,'dashboard') returning id into job;
      insert into public.anamechi_email_events(item_id,job_id,actor,kind) values(item.id,job,actor,'approved');
      output := output || jsonb_build_array(jsonb_build_object('item_id',item.id,'job_id',job));
    end loop;
    return jsonb_build_object('batch_id',batch,'jobs',output);
  elsif action in ('save','work','hold') then
    select * into item from public.anamechi_email_items where id=(payload->>'id')::uuid for update;
    if not found or item.version <> (payload->>'version')::integer then raise exception 'Item changed. Refresh and review again.'; end if;
    if exists(select 1 from public.anamechi_email_jobs where item_id=item.id and status in ('queued','sending','outcome_unknown')) then
      raise exception 'This item has an active or unresolved send job';
    end if;
    if action='save' then
      if item.sent_at is not null then raise exception 'Sent messages cannot be edited'; end if;
      if length(coalesce(payload->>'draft_body','')) not between 1 and 50000 then raise exception 'Enter a reply between 1 and 50000 characters'; end if;
      update public.anamechi_email_items set draft_body=payload->>'draft_body',version=version+1,updated_at=now() where id=item.id;
    elsif action='hold' then
      update public.anamechi_email_items set work_status='needs_deanna',version=version+1,updated_at=now() where id=item.id;
    else
      if payload->>'work_status'='completed' and btrim(coalesce(payload->>'completion_evidence',''))='' then
        raise exception 'Record completion evidence before completing this item';
      end if;
      if payload->>'work_status'='waiting_on_client' and item.sent_at is null then
        raise exception 'Waiting on Client requires a verified sent reply';
      end if;
      if payload->>'work_status'='team_action' and btrim(coalesce(payload->>'action_owner',''))='' then
        raise exception 'Team Action needs an accountable owner';
      end if;
      update public.anamechi_email_items set
        work_status=payload->>'work_status', priority=payload->>'priority',
        decision_needed=left(coalesce(payload->>'decision_needed',''),10000),
        next_action=left(coalesce(payload->>'next_action',''),10000),
        action_owner=left(coalesce(payload->>'action_owner',''),300),
        waiting_on=left(coalesce(payload->>'waiting_on',''),1000),
        due_at=nullif(payload->>'due_at','')::timestamptz,
        completion_evidence=left(coalesce(payload->>'completion_evidence',''),10000),
        version=version+1,updated_at=now() where id=item.id;
    end if;
    insert into public.anamechi_email_events(item_id,actor,kind) values(item.id,actor,action);
    return jsonb_build_object('ok',true);
  end if;
  raise exception 'Unsupported inbox command';
end $$;
revoke all on function anamechi_mail.command(text,jsonb) from public,anon;
grant execute on function anamechi_mail.command(text,jsonb) to authenticated;
create function public.anamechi_email_command(action text,payload jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null or not public.is_super_admin(auth.uid()) then
    raise exception 'Super Admin access required' using errcode='42501';
  end if;
  return anamechi_mail.command(action,payload);
end $$;
revoke all on function public.anamechi_email_command(text,jsonb) from public,anon;
grant execute on function public.anamechi_email_command(text,jsonb) to authenticated;

-- Worker functions are never executable by web/app users. Existing n8n backend
-- credentials call these through PostgreSQL; no browser credential is introduced.
create function public.anamechi_email_claim_job()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare j public.anamechi_email_jobs; i public.anamechi_email_items;
begin
  -- A crashed in-flight attempt is ambiguous. Never automatically retry it.
  update public.anamechi_email_jobs set status='outcome_unknown',error='Worker stopped before a final Gmail result',finished_at=now()
    where status='sending' and claimed_at < now()-interval '15 minutes';
  select * into j from public.anamechi_email_jobs where status='queued' order by approved_at for update skip locked limit 1;
  if not found then return null; end if;
  select * into i from public.anamechi_email_items where id=j.item_id for update;
  if i.version <> j.version or i.sent_at is not null or not public.is_super_admin(j.approved_by) then
    update public.anamechi_email_jobs set status='changed',error='Approval, draft version or owner role changed',finished_at=now() where id=j.id;
    return null;
  end if;
  update public.anamechi_email_jobs set status='sending',claimed_at=now() where id=j.id;
  return to_jsonb(j) || jsonb_build_object('status','sending');
end $$;
revoke all on function public.anamechi_email_claim_job() from public,anon,authenticated;
grant execute on function public.anamechi_email_claim_job() to service_role;

create function public.anamechi_email_finish_job(job_id uuid,outcome text,provider_id text default null,error_detail text default null)
returns void language plpgsql security invoker set search_path='' as $$
declare j public.anamechi_email_jobs;
begin
  if outcome not in ('sent','failed','changed','outcome_unknown') then raise exception 'Invalid send outcome'; end if;
  select * into j from public.anamechi_email_jobs where id=job_id for update;
  if not found or j.status <> 'sending' then raise exception 'Job is not claimed'; end if;
  if outcome='sent' and nullif(provider_id,'') is null then raise exception 'Gmail message ID required'; end if;
  update public.anamechi_email_jobs set status=outcome,provider_message_id=provider_id,error=left(error_detail,2000),finished_at=now() where id=j.id;
  if outcome='sent' then
    update public.anamechi_email_items set sent_at=now(),sent_message_id=provider_id,
      work_status=case when waiting_on<>'' then 'waiting_on_client' else 'needs_deanna' end,updated_at=now() where id=j.item_id;
  end if;
  insert into public.anamechi_email_events(item_id,job_id,kind,detail)
    values(j.item_id,j.id,outcome,jsonb_build_object('provider_message_id',provider_id,'error',left(error_detail,2000)));
end $$;
revoke all on function public.anamechi_email_finish_job(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.anamechi_email_finish_job(uuid,text,text,text) to service_role;

create function public.anamechi_email_sync_item(payload jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare existing public.anamechi_email_items; saved uuid; fingerprint text;
begin
  if payload->>'account' is distinct from 'deanna.romulus@anamechimarketing.com' then raise exception 'Wrong inbox'; end if;
  if nullif(payload->>'message_id','') is null or nullif(payload->>'thread_id','') is null then raise exception 'Message and thread IDs required'; end if;
  fingerprint := md5(payload->>'raw');
  select * into existing from public.anamechi_email_items
    where account=payload->>'account' and message_id=payload->>'message_id' for update;
  if found then
    if existing.sent_at is not null then return existing.id; end if;
    -- Sync never overwrites owner edits. A changed provider draft invalidates
    -- the review and needs a deliberate fresh review.
    if existing.provider_fingerprint is distinct from fingerprint then
      update public.anamechi_email_items set provider_fingerprint=fingerprint,
        draft_body=coalesce(payload->>'draft_body',''),version=version+1,
        thread_fingerprint=md5((payload->'thread_ids')::text),
        thread_messages=coalesce(payload->'thread_messages','[]'),
        recipients=payload->'recipients', attachment_count=coalesce((payload->>'attachment_count')::int,0),
        work_status='needs_deanna',synced_at=now(),updated_at=now() where id=existing.id;
    else
      update public.anamechi_email_items set synced_at=now() where id=existing.id;
    end if;
    return existing.id;
  end if;
  insert into public.anamechi_email_items(account,message_id,thread_id,draft_id,subject,from_address,
    recipients,thread_messages,draft_body,provider_fingerprint,thread_fingerprint,attachment_count,synced_at,
    priority,decision_needed,next_action,action_owner,work_status)
  values(payload->>'account',payload->>'message_id',payload->>'thread_id',payload->>'draft_id',
    coalesce(payload->>'subject',''),coalesce(payload->>'from_address',''),payload->'recipients',
    coalesce(payload->'thread_messages','[]'),coalesce(payload->>'draft_body',''),fingerprint,
    md5((payload->'thread_ids')::text),coalesce((payload->>'attachment_count')::int,0),now(),
    coalesce(payload->>'priority','normal'),coalesce(payload->>'decision_needed',''),
    coalesce(payload->>'next_action',''),coalesce(payload->>'action_owner',''),
    case when nullif(payload->>'draft_id','') is null then 'needs_deanna' else 'draft_ready' end)
  returning id into saved;
  insert into public.anamechi_email_events(item_id,kind) values(saved,'ingested');
  return saved;
end $$;
revoke all on function public.anamechi_email_sync_item(jsonb) from public,anon,authenticated;
grant execute on function public.anamechi_email_sync_item(jsonb) to service_role;

create function public.anamechi_email_validate_job(job_id uuid,raw text,thread_ids jsonb)
returns boolean language plpgsql security invoker set search_path='' as $$
declare j public.anamechi_email_jobs; i public.anamechi_email_items;
begin
  select * into j from public.anamechi_email_jobs where id=job_id for update;
  if not found or j.status <> 'sending' then return false; end if;
  select * into i from public.anamechi_email_items where id=j.item_id for update;
  if i.version<>j.version or i.sent_at is not null or not public.is_super_admin(j.approved_by)
    or md5(raw) is distinct from j.approved_snapshot->>'provider_fingerprint'
    or md5(thread_ids::text) is distinct from j.approved_snapshot->>'thread_fingerprint' then
    perform public.anamechi_email_finish_job(j.id,'changed',null,'Draft or conversation changed since review');
    return false;
  end if;
  return true;
end $$;
revoke all on function public.anamechi_email_validate_job(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.anamechi_email_validate_job(uuid,text,jsonb) to service_role;
