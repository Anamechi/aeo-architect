-- Existing bot backend only. No second Telegram webhook or public bot listener.
create table anamechi_mail.telegram_owners (
  telegram_user_id bigint not null,
  telegram_chat_id bigint not null,
  owner_id uuid not null references auth.users(id),
  enabled boolean not null default true,
  primary key(telegram_user_id,telegram_chat_id)
);
create table anamechi_mail.telegram_reviews (
  token uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null,
  telegram_chat_id bigint not null,
  owner_id uuid not null references auth.users(id),
  snapshots jsonb not null,
  expires_at timestamptz not null default now()+interval '15 minutes',
  used_at timestamptz
);
alter table anamechi_mail.telegram_owners enable row level security;
alter table anamechi_mail.telegram_reviews enable row level security;
alter table anamechi_mail.generation_claims enable row level security;
revoke all on anamechi_mail.telegram_owners,anamechi_mail.telegram_reviews from public,anon,authenticated;
grant all on anamechi_mail.telegram_owners,anamechi_mail.telegram_reviews to service_role;
create function public.anamechi_email_telegram(telegram_user bigint,telegram_chat bigint,action text,payload jsonb default '{}')
returns jsonb language plpgsql security invoker set search_path='' as $$
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
revoke all on function public.anamechi_email_telegram(bigint,bigint,text,jsonb) from public,anon,authenticated;
grant execute on function public.anamechi_email_telegram(bigint,bigint,text,jsonb) to service_role;
grant execute on function anamechi_mail.command(text,jsonb) to service_role;
