import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { briefing, inboxAccount, selectable, statusLabel, workStatuses, type EmailItem, type SendJob } from '@/lib/email-review';

// Keep this feature's new schema isolated from the generated pre-migration types.
const db = supabase as SupabaseClient;
export default function EmailReview() {
  const {isSuperAdmin}=useAuth();
  const [items,setItems]=useState<EmailItem[]>([]);
  const [jobs,setJobs]=useState<SendJob[]>([]);
  const [selected,setSelected]=useState<Record<string,number>>({});
  const [filter,setFilter]=useState('open');
  const [active,setActive]=useState<EmailItem|null>(null);
  const [body,setBody]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [confirm,setConfirm]=useState(false);
  const load=useCallback(async()=>{
    if(!isSuperAdmin) return;
    const [a,b]=await Promise.all([
      db.from('anamechi_email_items').select('*').order('received_at',{ascending:false}).limit(200),
      db.from('anamechi_email_jobs').select('id,item_id,version,status,error,approved_at,provider_message_id').order('approved_at',{ascending:false}).limit(500),
    ]);
    if(a.error||b.error){setError('Email Review could not load. Confirm that its database release and mailbox worker are installed.');return;}
    setItems(a.data as EmailItem[]);setJobs(b.data as SendJob[]);
  },[isSuperAdmin]);
  useEffect(()=>{
    if(!isSuperAdmin){setItems([]);setJobs([]);setActive(null);setSelected({});return;}
    void load();const timer=setInterval(()=>void load(),30000);return()=>clearInterval(timer);
  },[isSuperAdmin,load]);
  const summary=useMemo(()=>briefing(items),[items]);
  const visible=items.filter(i=>filter==='all'||(filter==='open'?i.work_status!=='completed':i.work_status===filter));
  const choices=Object.entries(selected).map(([id,version])=>({id,version}));
  const valid=choices.length>0&&choices.every(c=>items.some(i=>i.id===c.id&&i.version===c.version&&selectable(i,jobs)));
  async function command(action:string,payload:unknown) {
    if(!isSuperAdmin) return false;
    setBusy(true);setError('');setNotice('');
    try{
      const {error}=await db.rpc('anamechi_email_command',{action,payload});
      if(error) throw error;
      setSelected({});setActive(null);await load();return true;
    }catch(e){setError(e instanceof Error?e.message:(e as {message?:string}).message||'Request failed. Refresh before trying again.');return false;}
    finally{setBusy(false);}
  }
  if(!isSuperAdmin) return null;
  return <section className="space-y-6">
    <header><h1 className="text-3xl font-bold">ANAMECHI Email Review</h1><p className="text-muted-foreground mt-2">{inboxAccount}</p><p className="text-sm mt-2">Super Admin only. Selection does not send email. Approve &amp; Send authorizes immediate sending of the exact reviewed versions.</p></header>
    {error&&<p role="alert" className="text-destructive border border-destructive p-3 rounded">{error}</p>}
    {notice&&<p role="status" className="border p-3 rounded">{notice}</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[
      ['Decisions needed',summary.decisions.length],['Urgent or high priority',summary.urgent.length],['Drafts to review',summary.drafts.length],['Overdue actions',summary.overdue.length],['Waiting on client',summary.waiting.length],
    ].map(([label,count])=><Card key={label}><CardHeader className="pb-2"><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{count}</CardContent></Card>)}</div>
    <div className="flex flex-wrap gap-3 items-center">
      <label>Work queue <select aria-label="Work queue" className="border rounded p-2 bg-background" value={filter} onChange={e=>setFilter(e.target.value)}><option value="open">Open items</option><option value="all">All items</option>{workStatuses.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select></label>
      <Button variant="outline" onClick={()=>void load()} disabled={busy}>Refresh</Button>
      <Button variant="outline" disabled={busy} onClick={()=>setSelected(Object.fromEntries(visible.filter(i=>selectable(i,jobs)).map(i=>[i.id,i.version])))}>Select all eligible drafts shown</Button>
      <Button variant="outline" disabled={busy} onClick={()=>setSelected({})}>Clear selection</Button>
      <Button disabled={busy||!valid} onClick={()=>setConfirm(true)}>Review selected {choices.length>0?`(${choices.length})`:''}</Button>
    </div>
    {choices.length>0&&!valid&&<p role="alert">A selected item changed or is no longer eligible. Clear the selection, refresh and review again.</p>}
    <p className="text-sm text-muted-foreground">Showing up to 200 recent threads. Briefing counts cover this list. Attachments must be reviewed and sent in Gmail until attachment sending is supported.</p>
    {!items.length&&<Card><CardContent className="pt-6">No emails have been synchronized to this review queue. The mailbox worker must populate it before dashboard approvals can send anything.</CardContent></Card>}
    <div className="space-y-3">{visible.map(item=>{
      const job=jobs.find(j=>j.item_id===item.id);
      const overdue=item.work_status!=='completed'&&item.due_at&&Date.parse(item.due_at)<Date.now();
      return <Card key={item.id}><CardContent className="p-4 space-y-2">
        <div className="flex gap-3 items-start"><input type="checkbox" className="mt-1 h-5 w-5" aria-label={`Select ${item.subject||'untitled email'}`} checked={selected[item.id]!==undefined} disabled={busy||!selectable(item,jobs)} onChange={e=>setSelected(s=>{const n={...s};if(e.target.checked)n[item.id]=item.version;else delete n[item.id];return n;})}/>
          <div className="flex-1"><h2 className="font-semibold">{item.subject||'No subject'}</h2><p className="text-sm">From {item.from_address}</p><p className="text-sm">To {(item.recipients?.to??[]).join(', ')}</p><p className="text-sm text-muted-foreground">{statusLabel(item.work_status)} · {item.priority} priority {job?`· ${statusLabel(job.status)}`:''}</p></div>
          <Button variant="outline" onClick={()=>{setActive({...item});setBody(item.draft_body);}}>Open review</Button>
        </div>
        {item.decision_needed&&<p><strong>Decision:</strong> {item.decision_needed}</p>}
        {item.next_action&&<p><strong>Next action:</strong> {item.next_action} {item.action_owner?`Owner: ${item.action_owner}`:''}</p>}
        {item.due_at&&<p className={overdue?'text-destructive font-medium':'text-sm'}>{overdue?'Overdue':'Due'}: {new Date(item.due_at).toLocaleString()}</p>}
        {item.waiting_on&&<p>Waiting on: {item.waiting_on}</p>}
        {job?.error&&<p role="status" className="text-destructive">{job.error}</p>}
        {job?.status==='outcome_unknown'&&<p>Check Gmail Sent and reconcile this attempt before retrying. Sending is blocked while its outcome is unknown.</p>}
      </CardContent></Card>;
    })}</div>
    <Dialog open={!!active} onOpenChange={open=>{if(!open)setActive(null);}}><DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{active?.subject||'Email review'}</DialogTitle><DialogDescription>Review the full conversation, recipients, reply and next action. Email content is displayed as text.</DialogDescription></DialogHeader>
      {active&&<div className="space-y-4">
        <div><p><strong>From:</strong> {active.from_address}</p><p><strong>To:</strong> {(active.recipients.to??[]).join(', ')}</p><p><strong>CC:</strong> {(active.recipients.cc??[]).join(', ')||'None'}</p><p><strong>BCC:</strong> {(active.recipients.bcc??[]).join(', ')||'None'}</p><p>Attachments: {active.attachment_count}</p><p className="text-sm">Dates use your browser timezone. Gmail synchronization: {active.synced_at?new Date(active.synced_at).toLocaleString():'Not synchronized'}</p><a className="underline" href={`https://mail.google.com/mail/u/${encodeURIComponent(inboxAccount)}/#all/${encodeURIComponent(active.thread_id)}`} target="_blank" rel="noreferrer">Open conversation in Gmail</a></div>
        <details open><summary className="font-semibold">Conversation</summary><div className="space-y-3 mt-2">{active.thread_messages.map(m=><article key={m.id} className="border rounded p-3"><p className="font-medium">{m.from} {m.date}</p><pre className="whitespace-pre-wrap font-sans text-sm mt-2">{m.body}</pre></article>)}</div></details>
        <label className="block font-medium">Reply draft<Textarea rows={9} value={body} disabled={busy||!!active.sent_at} onChange={e=>setBody(e.target.value)}/></label>
        <div className="flex gap-2"><Button disabled={busy||!!active.sent_at||body===active.draft_body} onClick={()=>void command('save',{id:active.id,version:active.version,draft_body:body})}>Save reply for review</Button><Button variant="outline" disabled={busy} onClick={()=>void command('hold',{id:active.id,version:active.version})}>Hold for my decision</Button></div>
        <form className="space-y-3 border-t pt-4" onSubmit={e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));const due=String(values.due_at||'');void command('work',{...values,id:active.id,version:active.version,due_at:due?new Date(due).toISOString():null});}}>
          <h3 className="font-semibold">Decision and follow-through</h3><div className="grid sm:grid-cols-2 gap-3">
            <label>Status<select name="work_status" className="block border rounded p-2 w-full bg-background" defaultValue={active.work_status}>{workStatuses.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select></label>
            <label>Priority<select name="priority" className="block border rounded p-2 w-full bg-background" defaultValue={active.priority}>{['urgent','high','normal','low'].map(s=><option key={s}>{s}</option>)}</select></label>
            <label>Action owner<Input name="action_owner" defaultValue={active.action_owner}/></label><label>Due date and time<Input type="datetime-local" name="due_at" defaultValue={active.due_at?new Date(Date.parse(active.due_at)-new Date(active.due_at).getTimezoneOffset()*60000).toISOString().slice(0,16):''}/></label>
          </div><label className="block">Decision needed<Textarea name="decision_needed" defaultValue={active.decision_needed}/></label><label className="block">Next action<Textarea name="next_action" defaultValue={active.next_action}/></label><label className="block">Waiting on<Input name="waiting_on" defaultValue={active.waiting_on}/></label><label className="block">Completion evidence<Textarea name="completion_evidence" defaultValue={active.completion_evidence}/></label><Button disabled={busy}>Save decision and next action</Button><p className="text-sm">Assigning an owner records a handoff request. It does not notify or grant inbox access to that person. Completion needs evidence.</p>
        </form>
      </div>}
    </DialogContent></Dialog>
    <Dialog open={confirm} onOpenChange={setConfirm}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Approve {choices.length} ANAMECHI drafts</DialogTitle><DialogDescription>Read each reply below. This sends only the selected versions. New drafts are excluded. Changes since review will block sending.</DialogDescription></DialogHeader>
      <ul className="max-h-[55vh] overflow-y-auto space-y-4">{choices.map(c=>{const i=items.find(i=>i.id===c.id);return <li key={c.id} className="border rounded p-3"><strong>{i?.subject}</strong><p className="text-sm">To {i?.recipients.to.join(', ')} · version {c.version}</p><pre className="whitespace-pre-wrap font-sans text-sm mt-3">{i?.draft_body}</pre></li>;})}</ul><Button disabled={!valid||busy} onClick={async()=>{if(await command('approve',{items:choices})){setConfirm(false);setNotice('Approved for sending. Check each delivery status. Queued does not mean sent.');}}}>Approve &amp; Send</Button><Button variant="outline" onClick={()=>setConfirm(false)} disabled={busy}>Cancel</Button>
    </DialogContent></Dialog>
  </section>;
}
