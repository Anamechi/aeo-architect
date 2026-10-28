create or replace function anamechi_mail.command(action text, payload jsonb)
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
      if not found or item.version is distinct from (selected->>'version')::integer then raise exception 'Draft changed. Refresh and review again.'; end if;
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
    if not found or item.version is distinct from (payload->>'version')::integer then raise exception 'Item changed. Refresh and review again.'; end if;
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

create or replace function public.anamechi_email_sync_item(payload jsonb)
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
    if existing.provider_fingerprint is distinct from fingerprint or existing.thread_fingerprint is distinct from md5((payload->'thread_ids')::text) then
      update public.anamechi_email_items set provider_fingerprint=fingerprint,
        draft_id=payload->>'draft_id', draft_body=coalesce(payload->>'draft_body',''),version=version+1,
        thread_fingerprint=md5((payload->'thread_ids')::text),
        thread_messages=coalesce(payload->'thread_messages','[]'),
        recipients=payload->'recipients', attachment_count=coalesce((payload->>'attachment_count')::int,0),
        priority=coalesce(payload->>'priority',existing.priority), decision_needed=coalesce(payload->>'decision_needed',existing.decision_needed), next_action=coalesce(payload->>'next_action',existing.next_action), action_owner=coalesce(payload->>'action_owner',existing.action_owner), completion_evidence=case when coalesce((payload->>'no_reply')::boolean,false) and payload->>'priority'='low' and coalesce(payload->>'decision_needed','')='' and coalesce(payload->>'next_action','')='' then 'No reply or next action required' else existing.completion_evidence end, work_status=case when coalesce((payload->>'no_reply')::boolean,false) and payload->>'priority'='low' and coalesce(payload->>'decision_needed','')='' and coalesce(payload->>'next_action','')='' then 'completed' when existing.provider_fingerprint is null and nullif(payload->>'draft_id','') is not null and coalesce(payload->>'decision_needed','')='' then 'draft_ready' else 'needs_deanna' end,synced_at=now(),updated_at=now() where id=existing.id;
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
    case when nullif(payload->>'draft_id','') is null or coalesce(payload->>'decision_needed','')<>'' then 'needs_deanna' else 'draft_ready' end)
  returning id into saved;
  insert into public.anamechi_email_events(item_id,kind) values(saved,'ingested');
  return saved;
end $$;
revoke all on function public.anamechi_email_sync_item(jsonb) from public,anon,authenticated;
grant execute on function public.anamechi_email_sync_item(jsonb) to service_role;

create table anamechi_mail.generation_claims (
  message_id text primary key,
  claimed_at timestamptz not null default now()
);
revoke all on anamechi_mail.generation_claims from public,anon,authenticated;
grant all on anamechi_mail.generation_claims to service_role;
create function public.anamechi_email_claim_message(payload jsonb)
returns boolean language plpgsql security invoker set search_path='' as $$
declare claimed text;
begin
  if payload->>'account' is distinct from 'deanna.romulus@anamechimarketing.com'
    or nullif(payload->>'message_id','') is null then raise exception 'Invalid inbox source'; end if;
  insert into anamechi_mail.generation_claims(message_id) values(payload->>'message_id')
    on conflict do nothing returning message_id into claimed;
  if claimed is null then return false; end if;
  insert into public.anamechi_email_items(message_id,thread_id,subject,from_address,thread_messages,next_action)
    values(payload->>'message_id',payload->>'thread_id',coalesce(payload->>'subject',''),
      coalesce(payload->>'from_address',''),coalesce(payload->'thread_messages','[]'),
      'Draft generation started. If no draft appears, inspect the workflow execution before retrying.')
    on conflict(account,message_id) do nothing;
  return true;
end $$;
revoke all on function public.anamechi_email_claim_message(jsonb) from public,anon,authenticated;
grant execute on function public.anamechi_email_claim_message(jsonb) to service_role;

