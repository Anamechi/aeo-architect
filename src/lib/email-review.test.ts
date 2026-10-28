import { describe,expect,it } from 'vitest';
import { briefing,inboxAccount,selectable,type EmailItem,type SendJob } from './email-review';
const item = (patch:Partial<EmailItem>={}):EmailItem => ({id:'one',version:2,account:inboxAccount,message_id:'m',thread_id:'t',draft_id:'d',subject:'Reply',from_address:'client@example.com',recipients:{to:['client@example.com'],cc:[],bcc:[]},thread_messages:[],draft_body:'Thank you.\nDr. Deanna',work_status:'draft_ready',priority:'normal',decision_needed:'',next_action:'',action_owner:'',due_at:null,waiting_on:'',completion_evidence:'',attachment_count:0,received_at:'2026-10-28T12:00:00Z',updated_at:'2026-10-28T12:00:00Z',sent_at:null,synced_at:'2026-10-28T12:00:00Z',...patch});
const job = (patch:Partial<SendJob>={}):SendJob=>({id:'j',item_id:'one',version:1,status:'queued',error:null,approved_at:'2026-10-28T12:00:00Z',provider_message_id:null,...patch});
describe('review eligibility',()=>{
  it('blocks repeat approvals and unresolved older attempts',()=>{
    for(const status of ['queued','sending','outcome_unknown'] as const) expect(selectable(item(),[job({status})])).toBe(false);
    expect(selectable(item(),[job({version:2,status:'sent'})])).toBe(false);
    expect(selectable(item(),[job({version:1,status:'changed'})])).toBe(true);
  });
  it('requires a current ANAMECHI text draft',()=>{
    expect(selectable(item(),[])).toBe(true);
    for(const patch of [{account:'hello@drromulusmba.com'},{attachment_count:1},{draft_id:null},{synced_at:null},{sent_at:'2026-10-28T13:00:00Z'},{work_status:'needs_deanna' as const},{draft_body:' '}]) expect(selectable(item(patch),[])).toBe(false);
  });
});
describe('decision briefing',()=>{
  it('counts unresolved actions and only verified sent waiting states',()=>{
    const data=[item({id:'decision',work_status:'needs_deanna',priority:'urgent',due_at:'2026-10-27T12:00:00Z'}),item({id:'draft'}),item({id:'waiting',work_status:'waiting_on_client',sent_at:'2026-10-27T12:00:00Z'}),item({id:'unsent',work_status:'waiting_on_client'}),item({id:'done',work_status:'completed',priority:'urgent',due_at:'2026-10-27T12:00:00Z'})];
    const result=briefing(data,Date.parse('2026-10-28T12:00:00Z'));
    expect(result.decisions.map(i=>i.id)).toEqual(['decision']);
    expect(result.urgent.map(i=>i.id)).toEqual(['decision']);
    expect(result.overdue.map(i=>i.id)).toEqual(['decision']);
    expect(result.waiting.map(i=>i.id)).toEqual(['waiting']);
    expect(result.drafts.map(i=>i.id)).toEqual(['draft']);
  });
});
