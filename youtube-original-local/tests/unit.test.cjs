const{test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const acorn=require(process.env.YFP_ACORN_MODULE||'acorn');
const dir=path.resolve(__dirname,'..'),root=path.resolve(dir,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
const parse=file=>{const source=fs.readFileSync(file,'utf8');return{source,tree:acorn.parse(source,{sourceType:'module',ecmaVersion:'latest'})};};
function walk(node,fn){if(!node||typeof node!=='object')return;fn(node);for(const[key,value]of Object.entries(node)){if(key==='start'||key==='end')continue;if(Array.isArray(value))value.forEach(n=>walk(n,fn));else if(value&&typeof value==='object')walk(value,fn);}}
test('all manifest entry points, icons and local module imports exist',()=>{
 const files=[manifest.background.service_worker,...Object.values(manifest.icons),...manifest.content_scripts.flatMap(s=>[...s.js,...(s.css||[])])];
 for(const file of files)assert.ok(fs.existsSync(path.join(dir,file)),file);
 for(const file of fs.readdirSync(path.join(dir,'assets')).filter(f=>f.endsWith('.js'))){
  const full=path.join(dir,'assets',file),{tree}=parse(full);
  walk(tree,node=>{
   let specifier;
   if(node.type==='ImportDeclaration'||node.type==='ExportNamedDeclaration')specifier=node.source?.value;
   if(node.type==='ImportExpression'&&node.source.type==='Literal')specifier=node.source.value;
   if(typeof specifier==='string'&&specifier.startsWith('.'))assert.ok(fs.existsSync(path.resolve(path.dirname(full),specifier)),`${file}: ${specifier}`);
  });
 }
});
test('official identity, authentication and private backend permissions are removed',()=>{
 assert.equal(manifest.key,undefined);assert.equal(manifest.update_url,undefined);assert.deepEqual(manifest.permissions,['storage','scripting']);
 assert.ok(manifest.host_permissions.every(h=>!/supabase|codedcitadel|workers|stripe|lemon/.test(h)));
 const source=fs.readFileSync(path.join(dir,'background.js'),'utf8');assert.ok(!source.includes('fetch('));
});
test('root source files are preserved byte for byte',()=>{
 const report=JSON.parse(fs.readFileSync(path.join(dir,'build-report.json')));
 for(const[file,hash]of Object.entries(report.originalSHA256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,file);
});
function quotaContext(){
 const {source,tree}=parse(path.join(dir,'assets/index.ts-BvtW_Xxd.js'));
 const names=['on','fo','vi','ct','mc','Dw','wz','ur','b5','zf','uS','xy','j8','C5','U8','Tz','z8','W8','Nw','pS'];
 const code=tree.body.filter(n=>n.type==='FunctionDeclaration'&&names.includes(n.id.name)).map(n=>source.slice(n.start,n.end)).join('\n');
 let writes=0;const context={rt(){writes++;}};vm.createContext(context);vm.runInContext(code,context);return{context,writes:()=>writes};
}
test('local mode permits operations even with exhausted cached quota',()=>{
 const {context:c}=quotaContext(),exhausted={unlimited:false,isPaying:false,remaining:0,aiChatRemaining:0,videoStatsRemaining:0,quickViewRemaining:0};
 for(const name of ['ct','zf','j8','C5','uS','b5','wz'])assert.equal(c[name](exhausted),true,name);
 assert.equal(c.ur(),false);assert.equal(c.on().signedIn,false);assert.equal(c.on().isPaying,false);assert.equal(c.on().localEdition,true);
});
test('all original local charging functions succeed without decrementing usage',async()=>{
 const {context:c}=quotaContext();
 for(let i=0;i<50;i++)for(const name of ['U8','Tz','z8','W8','Nw','pS']){const result=await c[name]('test');assert.equal(result.ok,true,name);assert.equal(result.view.used,0);assert.equal(result.view.remaining,2147483647);}
 assert.equal((await c.vi()).localEdition,true);
});
test('private enrichment and account sync are disabled in the adapted client',()=>{
 const {source,tree}=parse(path.join(dir,'assets/index.ts-BvtW_Xxd.js'));
 const fn=tree.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='E1');assert.match(source.slice(fn.start,fn.end),/return false/);
 assert.ok(!source.includes('getQuotaState()'));assert.ok(!source.includes('chrome.storage.sync'));
});
test('restored entry point is explicit and idempotent; missing movies are not preloaded',()=>{
 const source=fs.readFileSync(path.join(dir,'assets/index.ts-BvtW_Xxd.js'),'utf8');
 assert.ok(source.includes('export function onExecute()'));assert.ok(source.includes('if(localStartup)return localStartup'));
 assert.ok(!source.includes('window.__yfpInit||(window.__yfpInit=!0,Vme())'));
 assert.ok(!source.includes('<video'));assert.ok(source.includes('const x=[]'));
});
test('reconstructed locales contain usable primary controls',()=>{
 for(const locale of ['en','ru']){const messages=JSON.parse(fs.readFileSync(path.join(dir,'_locales',locale,'messages.json')));for(const key of ['extensionDescription','filterBtnLabel','modalTitle','btnSearch','btnResetAll'])assert.ok(messages[key]?.message,key);assert.notEqual(messages.planPro.message,'Pro');}
});
test('compatibility worker never claims a paid identity or activates a license',()=>{
 let handler,reply;const context={chrome:{runtime:{id:'test',onInstalled:{addListener(){}},onMessage:{addListener:fn=>handler=fn}},storage:{local:{}}}};
 vm.runInNewContext(fs.readFileSync(path.join(dir,'background.js'),'utf8'),context);
 handler({type:'YFP_GET_ENTITLEMENT'},{id:'test'},r=>reply=r);assert.equal(reply.unlimited,true);assert.equal(reply.isPaying,false);assert.equal(reply.isLifetime,false);
 handler({type:'YFP_REDEEM_GIFT',code:'not-a-license'},{id:'test'},r=>reply=r);assert.equal(reply.ok,false);
 reply=null;handler({type:'YFP_GET_ENTITLEMENT'},{id:'other'},r=>reply=r);assert.equal(reply,null);
});
test('MAIN-world startup uses an absolute extension module URL and reports injection failure',async()=>{
 let handler,request;let reject=false;
 const context={chrome:{runtime:{id:'test',getURL:p=>'chrome-extension://test/'+p,onInstalled:{addListener(){}},onMessage:{addListener:fn=>handler=fn}},storage:{local:{}},scripting:{executeScript:async value=>{request=value;if(reject)throw new Error('injection blocked');return [];}}}};
 vm.runInNewContext(fs.readFileSync(path.join(dir,'background.js'),'utf8'),context);
 const send=()=>new Promise(resolve=>{assert.equal(handler({type:'YFP_ENSURE_MAIN_WORLD'},{id:'test',tab:{id:7}},resolve),true);});
 assert.equal((await send()).ok,true);assert.equal(request.world,'MAIN');assert.equal(request.target.tabId,7);assert.equal(request.args[0],'chrome-extension://test/assets/mainWorld.ts-Dop1yQHM.js');
 reject=true;const failure=await send();assert.equal(failure.ok,false);assert.match(failure.error,/blocked/);
});
