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
      if item.attachment_count <> 0 or jsonb_array_length(item.recipients->'to')<>1 or jsonb_array_length(item.recipients->'cc')<>0 or jsonb_array_length(item.recipients->'bcc')<>0 then raise exception 'Review and send attachments or multiple recipient drafts directly in Gmail'; end if;
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


create function anamechi_mail.telegram_command(telegram_user bigint,telegram_chat bigint,action text,payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 owner uuid; snapshots jsonb; token uuid; review anamechi_mail.telegram_reviews;
 chosen jsonb; old_actor text; result jsonb;
begin
 select owner_id into owner from anamechi_mail.telegram_owners
   where telegram_user_id=telegram_user and telegram_chat_id=telegram_chat and enabled;
 if owner is null or not public.is_super_admin(owner) then raise exception 'Owner Telegram identity required' using errcode='42501'; end if;
 if action='list' then
   select coalesce(jsonb_agg(x),'[]') into snapshots from (
     select i.id,i.version,i.subject,i.recipients,i.draft_body,i.work_status,i.priority,i.decision_needed,i.next_action,
       i.action_owner,i.due_at,i.waiting_on,i.sent_at
     from public.anamechi_email_items i
     where i.work_status='draft_ready' and i.sent_at is null and i.attachment_count=0
       and jsonb_array_length(i.recipients->'to')=1
       and jsonb_array_length(i.recipients->'cc')=0 and jsonb_array_length(i.recipients->'bcc')=0
       and not exists(select 1 from public.anamechi_email_jobs j where j.item_id=i.id and
         (j.version=i.version or j.status in ('queued','sending','outcome_unknown')))
     order by i.received_at desc,i.id limit 20
   ) x;
   insert into anamechi_mail.telegram_reviews(telegram_user_id,telegram_chat_id,owner_id,snapshots)
     values(telegram_user,telegram_chat,owner,snapshots) returning anamechi_mail.telegram_reviews.token into token;
   return jsonb_build_object('token',token,'drafts',snapshots,'dashboard','https://anamechimarketing.com/admin/email-review','expires_minutes',15);
 elsif action='approve' then
   if payload->>'confirmed' is distinct from 'true' then raise exception 'Explicit typed approval required'; end if;
   select * into review from anamechi_mail.telegram_reviews where
     anamechi_mail.telegram_reviews.token=(payload->>'token')::uuid and owner_id=owner
     and telegram_user_id=telegram_user and telegram_chat_id=telegram_chat for update;
   if not found or review.used_at is not null or review.expires_at<now() then raise exception 'Review expired or already used. Request a fresh list.'; end if;
   if coalesce((payload->>'all')::boolean,false) then
     select jsonb_agg(jsonb_build_object('id',x->>'id','version',x->'version')) into chosen from jsonb_array_elements(review.snapshots) x;
   else
     if jsonb_typeof(payload->'numbers') is distinct from 'array' then raise exception 'Select draft numbers'; end if;
     if exists(select 1 from jsonb_array_elements_text(payload->'numbers') n
       where n !~ '^[0-9]+$' or n::int<1 or n::int>jsonb_array_length(review.snapshots)) then raise exception 'Invalid draft number'; end if;
     select jsonb_agg(jsonb_build_object('id',review.snapshots->((n.value)::int-1)->>'id',
       'version',review.snapshots->((n.value)::int-1)->'version')) into chosen
       from jsonb_array_elements_text(payload->'numbers') n;
   end if;
   old_actor:=current_setting('request.jwt.claim.sub',true);
   perform set_config('request.jwt.claim.sub',owner::text,true);
   result:=anamechi_mail.command('approve',jsonb_build_object('items',coalesce(chosen,'[]')));
   perform set_config('request.jwt.claim.sub',coalesce(old_actor,''),true);
   update public.anamechi_email_jobs set channel='telegram' where batch_id=(result->>'batch_id')::uuid;
   update anamechi_mail.telegram_reviews set used_at=now() where anamechi_mail.telegram_reviews.token=review.token;
   return result;
 elsif action='status' then
   return jsonb_build_object('jobs',(select coalesce(jsonb_agg(x),'[]') from
     (select i.subject,j.status,j.error,j.finished_at from public.anamechi_email_jobs j
      join public.anamechi_email_items i on i.id=j.item_id order by j.approved_at desc limit 20) x));
 end if;
 raise exception 'Unsupported email action';
end $$;


revoke all on function anamechi_mail.telegram_command(bigint,bigint,text,jsonb) from public,anon,authenticated;
grant usage on schema anamechi_mail to atlas_bot;
grant execute on function anamechi_mail.telegram_command(bigint,bigint,text,jsonb) to atlas_bot,service_role;
create or replace function public.anamechi_email_telegram(telegram_user bigint,telegram_chat bigint,action text,payload jsonb default '{}')
returns jsonb language sql security invoker set search_path='' as $func$
 select anamechi_mail.telegram_command(telegram_user,telegram_chat,action,payload);
$func$;
revoke all on function public.anamechi_email_telegram(bigint,bigint,text,jsonb) from public,anon,authenticated;
grant execute on function public.anamechi_email_telegram(bigint,bigint,text,jsonb) to atlas_bot,service_role;
