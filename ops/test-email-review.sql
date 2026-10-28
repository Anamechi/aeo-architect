-- Run against the installed additive migration. Synthetic fixture, rolled back.
begin;
insert into public.anamechi_email_items(id,message_id,thread_id,draft_id,subject,recipients,
 draft_body,provider_fingerprint,thread_fingerprint,synced_at,work_status)
values('00000000-0000-4000-8000-000000000028','synthetic-owner-test','synthetic-thread','synthetic-draft',
 'Synthetic acceptance test','{"to":["test@example.invalid"],"cc":[],"bcc":[]}',
 'Acknowledged. Dr. Deanna',md5('original-raw'),md5('["m1"]'::jsonb::text),now(),'draft_ready');
select set_config('request.jwt.claim.sub',(select user_id::text from public.user_roles where role='super_admin' limit 1),true);
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.anamechi_email_items where message_id='synthetic-owner-test') then raise exception 'Owner cannot read'; end if;
 begin
   perform public.anamechi_email_command('approve','{"items":[{"id":"00000000-0000-4000-8000-000000000028"}]}');
   raise exception 'Missing version accepted';
 exception when raise_exception then
   if SQLERRM <> 'Draft changed. Refresh and review again.' then raise; end if;
 end;
 begin
   perform public.anamechi_email_command('approve','{"items":[{"id":"00000000-0000-4000-8000-000000000028","version":1},{"id":"00000000-0000-4000-8000-000000000029","version":1}]}');
   raise exception 'Partially stale batch accepted';
 exception when raise_exception then
   if SQLERRM <> 'Draft changed. Refresh and review again.' then raise; end if;
 end;
 if exists(select 1 from public.anamechi_email_jobs where item_id='00000000-0000-4000-8000-000000000028') then raise exception 'Failed batch left a send job'; end if;
 perform public.anamechi_email_command('approve','{"items":[{"id":"00000000-0000-4000-8000-000000000028","version":1}]}');
 begin
   perform public.anamechi_email_command('approve','{"items":[{"id":"00000000-0000-4000-8000-000000000028","version":1}]}');
   raise exception 'Duplicate approval accepted';
 exception when unique_violation then null; when raise_exception then
   if SQLERRM <> 'This item already has an active or unresolved send job' then raise; end if;
 end;
 begin
   update public.anamechi_email_items set sent_at=now() where message_id='synthetic-owner-test';
   raise exception 'Direct state mutation accepted';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000099',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.anamechi_email_items) then raise exception 'Non-owner can read inbox'; end if;
 if exists(select 1 from public.anamechi_email_jobs) then raise exception 'Non-owner can read jobs'; end if;
 if exists(select 1 from public.anamechi_email_events) then raise exception 'Non-owner can read history'; end if;
 begin
   perform public.anamechi_email_command('hold','{"id":"00000000-0000-4000-8000-000000000028","version":1}');
   raise exception 'Non-owner command accepted';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
do $$ declare job jsonb; valid boolean; begin
 if has_table_privilege('anon','public.anamechi_email_items','select') then raise exception 'Anonymous read granted'; end if;
 if has_function_privilege('authenticated','public.anamechi_email_claim_job()','execute') then raise exception 'App user can claim sends'; end if;
 if has_function_privilege('anon','public.anamechi_email_command(text,jsonb)','execute') then raise exception 'Anonymous command granted'; end if;
 -- Only this synthetic job exists in a fresh acceptance transaction.
 if (select count(*) from public.anamechi_email_jobs where status='queued')<>1 then raise exception 'Run claim test on an empty review queue'; end if;
 job:=public.anamechi_email_claim_job();
 valid:=public.anamechi_email_validate_job((job->>'id')::uuid,'original-raw','["m1"]');
 if not valid then raise exception 'Matching snapshot rejected'; end if;
 valid:=public.anamechi_email_validate_job((job->>'id')::uuid,'changed-raw','["m1"]');
 if valid then raise exception 'Changed snapshot accepted'; end if;
 if not exists(select 1 from public.anamechi_email_jobs where id=(job->>'id')::uuid and status='changed') then raise exception 'Changed job not parked'; end if;
end $$;
select jsonb_build_object('owner_read_and_approval','passed','non_owner_read_and_commands','blocked',
 'anonymous_access','blocked','duplicate_approval','blocked','direct_state_mutation','blocked',
 'app_worker_execution','blocked','matching_version','accepted','changed_version','blocked') as acceptance_results;
update public.anamechi_email_items set version=2 where id='00000000-0000-4000-8000-000000000028';
insert into anamechi_mail.telegram_owners(telegram_user_id,telegram_chat_id,owner_id)
select 888000028,888000028,user_id from public.user_roles where role='super_admin' limit 1;
set local role service_role;
do $$ declare review jsonb; result jsonb; denied boolean; begin
 if has_table_privilege('atlas_bot','public.anamechi_email_items','select') then raise exception 'Bot has direct inbox read access'; end if;
 denied:=false;
 begin perform public.anamechi_email_telegram(888000029,888000028,'list');
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Wrong Telegram user accepted'; end if;
 review:=public.anamechi_email_telegram(888000028,888000028,'list');
 if public.anamechi_email_telegram(888000028,888000028,'briefing')->'counts'->>'drafts' <> '1' then raise exception 'Briefing draft count incorrect'; end if;
 if jsonb_array_length(review->'drafts')<>1 then raise exception 'Review snapshot incomplete'; end if;
 result:=public.anamechi_email_telegram(888000028,888000028,'approve',jsonb_build_object('token',review->>'token','numbers','[1]'::jsonb,'confirmed',true));
 if jsonb_array_length(result->'jobs')<>1 then raise exception 'Selected Telegram approval failed'; end if;
 denied:=false;
 begin perform public.anamechi_email_telegram(888000028,888000028,'approve',jsonb_build_object('token',review->>'token','all',true,'confirmed',true));
 exception when raise_exception then denied:=true; end;
 if not denied then raise exception 'Review token replay accepted'; end if;
end $$;
reset role;
select jsonb_build_object('telegram_user_check','passed','telegram_selection','passed','telegram_token_replay','blocked','bot_direct_inbox_access','blocked') as telegram_acceptance_results;
rollback;
