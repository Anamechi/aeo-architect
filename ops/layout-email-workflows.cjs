/* Visual layout only. Credentials, node parameters and connection routing are preserved. */
const {randomUUID}=require('node:crypto');
function layoutEmailWorkflow(workflow,kind){
  const w=structuredClone(workflow);
  const positions={};
  const row=(names,y,start=0,gap=300)=>names.forEach((name,i)=>positions[name]=[start+i*gap,y]);
  if(kind==='sender'){
    row(['Check approved send jobs','Claim one approved job','Has approved job','Read approved Gmail draft','Check latest conversation','Prepare freshness check','Validate approved version','Version still approved'],0);
    row(['Use exact approved reply','Apply approved reply to Gmail draft','Send approved draft once','Record verified delivery'],500,2100);
    positions['Record pre-send failure']=[1200,1000];
    positions['Hold uncertain send outcome']=[2700,1000];
  }else{
    row(['Gmail Trigger: New Unread Email','Load full Gmail thread','Read full conversation','Attachments need manual review','Current thread needs a reply','Reserve message once','Message reserved','AI Agent: Draft Reply','Validate review analysis','Reply needed','Gmail: Create Draft','Read created draft snapshot','Capture review record','Save draft and next action'],0);
    row(['Anthropic Chat Model','Postgres Chat Memory','Execute a SQL query in Postgres','Get many events in Google Calendar'],460,1650,350);
    row(['Preserve decision without reply','Save owner decision'],920,2700);
    row(['Record attachment hold','Save attachment decision','Star and keep attachment unread','Find attachment review label','Read attachment label identity','Attachment review label exists'],1400,1200);
    positions['Create attachment review label']=[3000,1740];
    positions['Label attachment for Dr Deanna']=[3300,1400];
    positions['IF Not Spam']=[2700,0];
    positions['Gmail: Mark Original as Read']=[3400,0];
  }
  let fallback=0;
  for(const node of w.nodes){
    if(node.type==='n8n-nodes-base.stickyNote'){
      // Move old notes into their own information row, away from every node.
      node.position=[fallback*950,-780];fallback++;
      node.parameters.width=850;node.parameters.height=400;
    }else if(positions[node.name])node.position=positions[node.name];
    else node.position=[fallback++*300,2200];
  }
  const notes=[];
  const heading=(title,content,position,width,color)=>notes.push({id:randomUUID(),name:'Layout: '+title,type:'n8n-nodes-base.stickyNote',typeVersion:1,position,parameters:{content:'## '+title+'\n'+content,width,height:170,color}});
  if(kind==='sender'){
    heading('1. Claim and verify','Read left to right. Only an approved job reaches Gmail. A changed draft or conversation stops the attempt.',[-80,-270],2450,5);
    heading('2. Send the reviewed version','Apply the exact approved reply, send once, then record Gmail delivery evidence. No automatic replay.',[2010,280],1370,4);
    heading('3. Exceptions stay visible','Read failure is recorded before sending. An uncertain Gmail mutation is held for manual reconciliation.',[1120,760],2050,3);
  }else{
    heading('1. Inbox and draft review','Read left to right. Attachments branch down for manual review. Normal messages are checked before drafting. Replies require owner approval in the separate sender workflow.',[-80,-270],4200,5);
    heading('2. Drafting resources','Model, thread memory, approved brain facts and the ANAMECHI Calendar. These connections support the drafting agent above.',[1570,240],1450,6);
    heading('3. No reply needed','Keep the decision and next action even when no email reply is drafted.',[2620,700],850,4);
    heading('4. Manual attachment review','This lane bypasses AI and reply drafting. Keep unread, star and label for Dr. Deanna. Attachment contents are not opened.',[1120,1150],2480,3);
  }
  // Reapplying the layout replaces only its own guide notes.
  w.nodes=w.nodes.filter(n=>!n.name.startsWith('Layout: ')).concat(notes);
  return w;
}
module.exports={layoutEmailWorkflow};
if(require.main===module){
 const fs=require('fs');const [file,kind]=process.argv.slice(2);
 const original=JSON.parse(fs.readFileSync(file,'utf8'));const list=Array.isArray(original)?original:[original];
 for(let i=0;i<list.length;i++){
   const before=list[i];const after=layoutEmailWorkflow(before,kind);
   const logic=w=>JSON.stringify({nodes:w.nodes.filter(n=>n.type!=='n8n-nodes-base.stickyNote').map(({position,...n})=>n),connections:w.connections,settings:w.settings});
   if(logic(before)!==logic(after))throw Error('Layout changed workflow logic');
   list[i]=after;
 }
 fs.writeFileSync(file,JSON.stringify(list),{mode:0o600});console.log('Layout saved; node behavior and routing unchanged.');
}
