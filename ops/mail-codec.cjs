/* Shared by generated n8n Code nodes and acceptance tests. No network access. */
function decode(value='') { return Buffer.from(value,'base64url').toString('utf8'); }
function header(message,name) { return (message.payload?.headers||[]).find(h=>h.name.toLowerCase()===name.toLowerCase())?.value||''; }
function body(part={}) {
  // Ignore attachment bytes even when Gmail embeds a small text attachment.
  if(part.filename||part.body?.attachmentId) return '[Attachment omitted. Manual review required.]';
  if(part.mimeType==='text/plain'&&part.body?.data) return decode(part.body.data);
  const plain=(part.parts||[]).filter(p=>p.mimeType==='text/plain').map(body).filter(Boolean);
  if(plain.length) return plain.join('\n');
  const nested=(part.parts||[]).filter(p=>p.mimeType!=='text/html').map(body).filter(Boolean);
  if(nested.length) return nested.join('\n');
  if(part.body?.data) return decode(part.body.data).replace(/<[^>]*>/g,' ');
  return (part.parts||[]).map(body).join('\n');
}
function attachments(part={}) {
  return (part.filename||part.body?.attachmentId?1:0)+(part.parts||[]).reduce((n,p)=>n+attachments(p),0);
}
function threadMessages(thread) {
  return (thread.messages||[]).filter(m=>!(m.labelIds||[]).includes('DRAFT'))
    .sort((a,b)=>Number(a.internalDate)-Number(b.internalDate)||a.id.localeCompare(b.id));
}
function threadIds(thread) { return threadMessages(thread).map(m=>m.id).sort(); }
function context(thread,originalId) {
  const messages=threadMessages(thread);
  const source=messages.find(m=>m.id===originalId);
  const draftExists=(thread.messages||[]).some(m=>(m.labelIds||[]).includes('DRAFT'));
  return {processable:!!source&&!draftExists&&messages.at(-1)?.id===originalId&&!(source.labelIds||[]).includes('SENT'),
    thread_ids:threadIds(thread),thread_messages:messages.map(m=>({id:m.id,from:header(m,'from'),date:header(m,'date'),message_id_header:header(m,'message-id'),body:body(m.payload)})),
    subject:source?header(source,'subject'):'',from_address:source?header(source,'from'):'',
    attachment_count:source?attachments(source.payload):0};
}
function parseAnalysis(output) {
  const text=String(output).trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
  const a=JSON.parse(text);
  if(typeof a.reply!=='string'||!a.reply.trim()) throw Error('Missing reply body');
  if(!['urgent','high','normal','low'].includes(a.priority)) throw Error('Invalid priority');
  for(const key of ['decision_needed','next_action','action_owner']) if(typeof a[key]!=='string') throw Error('Invalid analysis field');
  if(a.reply!=='SKIP'&&!/Dr\. Deanna\s*$/.test(a.reply)) throw Error('Signature missing');
  return {...a,output:a.reply};
}
function approvedMime(snapshot,jobId) {
  if(snapshot.account!=='deanna.romulus@anamechimarketing.com') throw Error('Wrong sender account');
  if(snapshot.attachment_count!==0) throw Error('Attachments require Gmail review');
  if(!Array.isArray(snapshot.recipients?.to)||snapshot.recipients.to.length!==1||
    (snapshot.recipients.cc||[]).length||(snapshot.recipients.bcc||[]).length) throw Error('Only reviewed single-recipient text replies are supported');
  const address=snapshot.recipients.to[0];
  if(!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(address)) throw Error('Invalid recipient');
  if(!/^[a-f0-9-]{36}$/i.test(jobId)) throw Error('Invalid job identity');
  const subject=String(snapshot.subject||'').replace(/[\r\n]/g,' ');
  const encodedSubject='=?UTF-8?B?'+Buffer.from(subject).toString('base64')+'?=';
  const fields=['From: Dr. Deanna <'+snapshot.account+'>','To: '+address,'Subject: '+encodedSubject,
    'Message-ID: <anamechi-'+jobId+'@anamechimarketing.com>','MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64'];
  const replyTo=snapshot.thread_messages?.at(-1)?.message_id_header;
  if(replyTo&&/^<[^<>\r\n]+>$/.test(replyTo)) fields.push('In-Reply-To: '+replyTo,'References: '+replyTo);
  const content=Buffer.from(snapshot.draft_body,'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n')||'';
  return Buffer.from(fields.join('\r\n')+'\r\n\r\n'+content+'\r\n').toString('base64url');
}
module.exports={decode,header,body,attachments,threadMessages,threadIds,context,parseAnalysis,approvedMime};
