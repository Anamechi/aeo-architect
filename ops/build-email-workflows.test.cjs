const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {build}=require('./build-email-workflows.cjs');
const codec=fs.readFileSync(path.join(__dirname,'mail-codec.cjs'),'utf8').split('module.exports=')[0];
const names=['Gmail: Create Draft','Postgres Chat Memory','Gmail Trigger: New Unread Email','AI Agent: Draft Reply','Anthropic Chat Model','Execute a SQL query in Postgres','Get many events in Google Calendar'];
const original={nodes:names.map(name=>({name,parameters:{options:{}},credentials:{gmailOAuth2:{id:'gmail-test',name:'test'},postgres:{id:'pg-test',name:'test'}}}))};
test('staged workflows preserve credentials and contain no legacy unrestricted send path',()=>{
 const {sender,drafting}=build(original,codec);
 assert.equal(sender.active,false);assert.equal(drafting.active,false);
 assert.equal(drafting.nodes.some(n=>n.name.includes('Mark Original as Read')),false);
 assert.equal(drafting.nodes.some(n=>n.name.includes('Send This Draft')),false);
 for(const n of sender.nodes.filter(n=>n.type==='n8n-nodes-base.httpRequest')) {
   assert.equal(n.credentials.gmailOAuth2.id,'gmail-test');assert.equal(n.retryOnFail,false);
 }
 assert.equal(sender.connections['Version still approved'].main[0][0].node,'Use exact approved reply');
 assert.equal(sender.connections['Send approved draft once'].main[1][0].node,'Hold uncertain send outcome');
 assert.equal(drafting.connections['Reserve message once'].main[0][0].node,'Message reserved');
});
test('generated Code nodes return per-item output and all connection targets exist',()=>{
 for(const w of Object.values(build(original,codec))) {
   const nodeNames=new Set(w.nodes.map(n=>n.name));
   for(const groups of Object.values(w.connections)) for(const lanes of Object.values(groups)) for(const lane of lanes) for(const edge of lane) assert.ok(nodeNames.has(edge.node));
   for(const n of w.nodes.filter(n=>n.type==='n8n-nodes-base.code')) {
     assert.equal(n.parameters.mode,'runOnceForEachItem');
     assert.doesNotThrow(()=>new Function('$json','$','Buffer',n.parameters.jsCode));
     assert.equal(n.parameters.jsCode.includes('return [{json:'),false);
   }
 }
});
test('attachment branch bypasses the agent and draft and applies visible Gmail flags',()=>{
 const {drafting,legacy_guard}=build(original,codec);
 for(const w of [drafting,legacy_guard]) {
   assert.equal(w.nodes.find(n=>n.name==='Gmail Trigger: New Unread Email').parameters.options.downloadAttachments,false);
   const start=w.connections['Attachments need manual review'].main[0][0].node;
   const visited=new Set();const queue=[start];
   while(queue.length){const name=queue.shift();if(visited.has(name))continue;visited.add(name);
     for(const lane of w.connections[name]?.main||[])for(const e of lane)queue.push(e.node);}
   assert.equal(visited.has('AI Agent: Draft Reply'),false);
   assert.equal(visited.has('Gmail: Create Draft'),false);
   assert.equal(visited.has('Gmail: Mark Original as Read'),false);
   assert.equal(visited.has('Save attachment decision'),true);
   assert.equal(visited.has('Label attachment for Dr Deanna'),true);
   const flag=w.nodes.find(n=>n.name==='Star and keep attachment unread');
   assert.match(flag.parameters.jsonBody,/UNREAD/);
   assert.match(flag.parameters.jsonBody,/STARRED/);
   assert.equal(w.nodes.some(n=>/attachments\//.test(n.parameters?.url||'')),false);
 }
});
test('the guarded live assistant cannot bypass manual review through legacy send-all',()=>{
 const source={...original,id:'live-test',name:'live',nodes:[...original.nodes,{name:"IF: User said 'send'",parameters:{}}]};
 const guarded=build(source,codec).legacy_guard;
 assert.equal(guarded.nodes.some(n=>n.name==="IF: User said 'send'"||n.name==='HTTP: Send This Draft'),false);
});
