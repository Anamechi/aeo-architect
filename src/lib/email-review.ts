export const inboxAccount = 'deanna.romulus@anamechimarketing.com';
export const workStatuses = ['needs_deanna','draft_ready','team_action','waiting_on_client','completed'] as const;
export type WorkStatus = typeof workStatuses[number];
export type SendStatus = 'queued'|'sending'|'sent'|'failed'|'changed'|'outcome_unknown'|'cancelled';
export interface EmailItem {
  id: string; version: number; account: string; subject: string; from_address: string;
  message_id: string; thread_id: string; draft_id: string|null;
  recipients: {to:string[];cc:string[];bcc:string[]};
  thread_messages: {id:string;from:string;date:string;body:string}[];
  draft_body:string; work_status:WorkStatus; priority:'urgent'|'high'|'normal'|'low';
  decision_needed:string; next_action:string; action_owner:string; due_at:string|null;
  waiting_on:string; completion_evidence:string; attachment_count:number;
  received_at:string; updated_at:string; sent_at:string|null; synced_at:string|null;
}
export interface SendJob {id:string;item_id:string;version:number;status:SendStatus;error:string|null;approved_at:string;provider_message_id:string|null}
export const statusLabel = (s:string) => ({needs_deanna:'Needs Deanna',draft_ready:'Draft Ready',team_action:'Team Action',waiting_on_client:'Waiting on Client',completed:'Completed',outcome_unknown:'Outcome Unknown'}[s] ?? s.replace(/_/g,' '));
export function selectable(item:EmailItem, jobs:SendJob[]):boolean {
  return item.account===inboxAccount && item.work_status==='draft_ready' && !!item.draft_id &&
    !!item.synced_at && !item.sent_at && item.attachment_count===0 && item.recipients.to.length===1 &&
    item.recipients.cc.length===0 && item.recipients.bcc.length===0 && !!item.draft_body.trim() &&
    !jobs.some(j=>j.item_id===item.id && (j.version===item.version || ['queued','sending','outcome_unknown'].includes(j.status)));
}
export function briefing(items:EmailItem[],now=Date.now()) {
  const open=items.filter(i=>i.work_status!=='completed');
  return {
    decisions:open.filter(i=>i.work_status==='needs_deanna'||!!i.decision_needed.trim()),
    urgent:open.filter(i=>i.priority==='urgent'||i.priority==='high'),
    drafts:open.filter(i=>i.work_status==='draft_ready'&&!i.sent_at),
    overdue:open.filter(i=>!!i.due_at&&Date.parse(i.due_at)<now),
    waiting:open.filter(i=>i.work_status==='waiting_on_client'&&!!i.sent_at),
  };
}
