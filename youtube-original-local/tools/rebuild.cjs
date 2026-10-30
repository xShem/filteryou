/* Rebuild only the adapted copy; never change source bundles in the repo root. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const acorn=require(process.env.YFP_ACORN_MODULE||'acorn');
const base=path.resolve(__dirname,'../..'),out=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(out,'assets'),{recursive:true});
const hashes={},changes={};
function parse(s){return acorn.parse(s,{ecmaVersion:'latest',sourceType:'module'});}
function patch(file,bodies,extra=''){
 let source=fs.readFileSync(path.join(base,file),'utf8');hashes[file]=crypto.createHash('sha256').update(source).digest('hex');
 const ast=parse(source),edits=[];changes[file]=[];
 for(const [name,body]of Object.entries(bodies)){
  const matches=ast.body.filter(n=>n.type==='FunctionDeclaration'&&n.id.name===name);
  if(matches.length!==1)throw new Error(file+': expected exactly one top-level function '+name);
  const n=matches[0];edits.push({start:n.body.start,end:n.body.end,text:'{'+body+'}'});changes[file].push(name);
 }
 for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);
 source=source.replaceAll('allowUsageAnalytics:!0','allowUsageAnalytics:!1');
 source+=extra;parse(source);fs.writeFileSync(path.join(out,'assets',file),source);
}
const quota=`return {signedIn:false,unlimited:true,isPaying:false,isSubscribed:false,localEdition:true,used:0,cap:2147483647,remaining:2147483647,exportUsed:0,exportCap:2147483647,exportRemaining:2147483647,aiChatUsed:0,aiChatCap:2147483647,aiChatRemaining:2147483647,quickViewUsed:0,quickViewCap:2147483647,quickViewRemaining:2147483647,videoStatsUsed:0,videoStatsCap:2147483647,videoStatsRemaining:2147483647,channelGridSorts:0,channelGridSortCap:2147483647,grantUntil:null,renewsAt:null,portalUrl:null,lemonStatus:null,endsAt:null,resetsAt:null};`;
const allow='const view=on();rt(view);return {ok:true,view};';
patch('index.ts-BvtW_Xxd.js',{
 on:quota,fo:'return on();',vi:'return on();',ct:'return true;',mc:'return true;',Dw:'return true;',
 wz:'return true;',ur:'return false;',b5:'return true;',zf:'return true;',uS:'return true;',xy:'return true;',j8:'return true;',C5:'return true;',
 U8:allow,Tz:allow,z8:allow,W8:allow,Nw:allow,pS:allow,N8:'return;',
 ar:'ba=on();jl=null;Cd=false;Fd();return {licenseSync:{synced:false,changed:false,activated:false,alreadyActive:false,licenseKey:null}};',
 T0:'ba=on();jl=null;Cd=false;Fd();',
 E1:'return false;', // Private enrichment backend is disabled; existing public MAIN-world fallback remains.
 Pue:'return;',Tue:'return;', // Gift/login solicitations are not part of this local edition.
},`\n// Use a single explicit entry point instead of the original import-time startup.\nlet localStartup;\nexport function onExecute(){if(localStartup)return localStartup;window.__yfpInit=true;return localStartup=Vme();}\n`);
// Repair two unbound identifiers in the original entry point callback.
const entry=path.join(out,'assets/index.ts-BvtW_Xxd.js');
let source=fs.readFileSync(entry,'utf8');
if((source.match(/getQuotaState\(\)/g)||[]).length!==2)throw new Error('Unexpected original quota callback');
source=source.replaceAll('getQuotaState()','Ge()');
source=source.replaceAll('chrome.storage.sync','chrome.storage.local').replaceAll('"sync"','"local"');
const bootstrap='window.__yfpInit||(window.__yfpInit=!0,Vme());';
if(!source.includes(bootstrap))throw new Error('Original import-time bootstrap changed');
source=source.replace(bootstrap,'');
// The original dialog lives in a shadow root; document CSS alone cannot hide commercial UI there.
if(!source.includes('o.textContent=jL'))throw new Error('Original modal stylesheet changed');
source=source.replace('o.textContent=jL','o.textContent=jL+'+JSON.stringify(fs.readFileSync(path.join(out,'local-edition.css'),'utf8')));
// The repository does not include the tutorial movies. Retain the tooltip text without broken preloads.
source=source.replace(/<video\b[\s\S]*?<\/video>/g,'');
const movieTips='const x=[{btnId:"yfpHelpChapters",videoUrl:Xue},{btnId:"yfpHelpStrictSearch",videoUrl:Zue,textKey:"filterHelpStrictSearch"}]';
if(!source.includes(movieTips))throw new Error('Original chapter/strict-search help changed');
source=source.replace(movieTips,'const x=[]').replace('T=[{btnId:"yfpHelpLikeRate"','T=[{btnId:"yfpHelpChapters",textKey:"filterHelpChapters"},{btnId:"yfpHelpStrictSearch",textKey:"filterHelpStrictSearch"},{btnId:"yfpHelpLikeRate"');
// Remove the remote decorative font import (the donation section is hidden anyway).
source=source.replace(/@import url\('https:\/\/fonts\.googleapis\.com[^\n]*\);/g,'').replace(/^[ \t]+$/gm,'');parse(source);fs.writeFileSync(entry,source);
patch('onboardingKeys-BJre6MTj.js',{
 V:'return false;', // Disable remote billing lookups, not server-side authorization.
 sn:'return {synced:false,changed:false,activated:false,alreadyActive:false,licenseKey:null};',
 Xe:'return;',en:'return true;',
 se:'return Promise.resolve();',Ce:'return null;',At:'return null;',vt:'return null;',cn:'return null;'
});
for(const file of fs.readdirSync(base).filter(f=>/\.(js|css)$/.test(f)&&!['background.ts-BZA8TWou.js','service-worker-loader.js','index.ts-BvtW_Xxd.js','onboardingKeys-BJre6MTj.js','i18n-TjKCKu9J.js'].includes(f))){
 const data=fs.readFileSync(path.join(base,file));hashes[file]=crypto.createHash('sha256').update(data).digest('hex');fs.writeFileSync(path.join(out,'assets',file),data);
}
// Recover available text from bundled fallbacks. Missing original locale files cannot be reconstructed exactly.
const messages={};
function visit(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const [key,value]of Object.entries(n)){if(key==='start'||key==='end')continue;if(Array.isArray(value))value.forEach(v=>visit(v,fn));else if(value&&typeof value==='object')visit(value,fn);}}
for(const file of fs.readdirSync(base).filter(f=>f.endsWith('.js'))){
 const tree=parse(fs.readFileSync(path.join(base,file),'utf8'));
 const aliases=new Set(tree.body.filter(n=>n.type==='ImportDeclaration'&&n.source.value==='./i18n-TjKCKu9J.js').flatMap(n=>n.specifiers.map(s=>s.local.name)));
 const call=n=>n?.type==='CallExpression'&&n.callee.type==='Identifier'&&aliases.has(n.callee.name)&&n.arguments[0]?.type==='Literal'&&typeof n.arguments[0].value==='string'&&/^[a-zA-Z][\w]*$/.test(n.arguments[0].value);
 visit(tree,n=>{if(call(n)){const key=n.arguments[0].value;messages[key]||={message:key.replace(/([a-z\d])([A-Z])/g,'$1 $2').replace(/^(label|btn|aria|placeholder) /i,'').replace(/^./,s=>s.toUpperCase())};}if(n.type==='LogicalExpression'&&n.operator==='||'&&call(n.left)&&n.right.type==='Literal'&&typeof n.right.value==='string'&&n.right.value)messages[n.left.arguments[0].value]={message:n.right.value.replace(/\$/g,'$$$$')};});
}
Object.assign(messages,Object.fromEntries(Object.entries({extensionDescription:'Local adaptation of the original YouTube filter scripts. No accounts or payments.',filterBtnLabel:'Filters',filterBtnAriaOpen:'Open YouTube filters',modalTitle:'YouTube Filters · Local',tabVideoFilters:'Video',tabChannelFilters:'Channels',settingsTitle:'Settings',btnApply:'Apply',btnReset:'Reset',btnClose:'Close',btnCancel:'Cancel',btnSave:'Save',labelSearchQuery:'Search YouTube',labelStrictSearch:'All query words in title',labelViews:'Views',labelDuration:'Duration',labelPublished:'Published',labelTitle:'Title',quotaUnlimited:'Local · no usage limit'}).map(([k,message])=>[k,{message}])));
const overrides=require('./messages.cjs');
for(const [key,value]of Object.entries(overrides.en))messages[key]={message:value};
for(const key of Object.keys(messages).filter(k=>/^pubPreset_\d+[hdwmy]$/.test(k))){const m=key.match(/_(\d+)([hdwmy])$/);messages[key]={message:'Last '+m[1]+' '+({h:'hours',d:'days',w:'weeks',m:'months',y:'years'}[m[2]])};}
fs.mkdirSync(path.join(out,'_locales/en'),{recursive:true});fs.writeFileSync(path.join(out,'_locales/en/messages.json'),JSON.stringify(messages,null,2)+'\n');
const ru={...messages};for(const[k,message]of Object.entries({filterBtnLabel:'Фильтры',filterBtnAriaOpen:'Открыть фильтры YouTube',modalTitle:'Фильтры YouTube · Локальная версия',tabVideoFilters:'Видео',tabChannelFilters:'Каналы',settingsTitle:'Настройки',btnApply:'Применить',btnReset:'Сбросить',btnClose:'Закрыть',btnCancel:'Отмена',btnSave:'Сохранить',labelSearchQuery:'Поиск YouTube',labelStrictSearch:'Все слова запроса в названии',labelViews:'Просмотры',labelDuration:'Длительность',labelPublished:'Дата публикации',labelTitle:'Название',quotaUnlimited:'Локально · без лимита'}))ru[k]={message};
for(const [key,value]of Object.entries(overrides.ru))ru[key]={message:value};
fs.mkdirSync(path.join(out,'_locales/ru'),{recursive:true});fs.writeFileSync(path.join(out,'_locales/ru/messages.json'),JSON.stringify(ru,null,2)+'\n');
fs.writeFileSync(path.join(out,'assets/local-messages.js'),'export default '+JSON.stringify(messages)+';\n');
fs.writeFileSync(path.join(out,'assets/i18n-TjKCKu9J.js'),`import messages from './local-messages.js';\nfunction t(key, substitutions){let value='';try{value=globalThis.chrome?.i18n?.getMessage(key,substitutions)||'';}catch{}if(!value)value=messages[key]?.message||key.replace(/([a-z])([A-Z])/g,'$1 $2');const args=Array.isArray(substitutions)?substitutions:[substitutions];return value.replace(/\\$(\\d+)/g,(_,n)=>String(args[Number(n)-1]??''));}\nexport {t};\n`);
// Copy manifest shape, remove official identity, billing/auth destinations and absent media.
const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
manifest.name='YouTube Filter · Original Local Edition';manifest.version='2.0.185.1';manifest.description='__MSG_extensionDescription__';
delete manifest.key;delete manifest.update_url;
manifest.permissions=['storage','scripting'];manifest.host_permissions=['https://www.youtube.com/*','https://youtube.com/*','https://returnyoutubedislikeapi.com/*'];
manifest.content_scripts[0].css.push('local-edition.css');
delete manifest.content_scripts[1].world;
fs.writeFileSync(path.join(out,'assets/mainWorld.ts-loader-D4cLEja8.js'),`// Load the original MAIN-world module via the worker using an absolute extension URL.\nchrome.runtime.sendMessage({type:'YFP_ENSURE_MAIN_WORLD'},()=>{if(chrome.runtime.lastError)console.warn('[YouTube Local] MAIN-world startup:',chrome.runtime.lastError.message);});\n`);
manifest.background={service_worker:'background.js',type:'module'};
manifest.web_accessible_resources=[{resources:['assets/*.js','assets/*.css','icons/*.png'],matches:['https://www.youtube.com/*','https://youtube.com/*']}];
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
for(const file of fs.readdirSync(base).filter(f=>/\.(js|css|json)$/.test(f)&&fs.statSync(path.join(base,f)).isFile()))hashes[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(base,file))).digest('hex');
fs.writeFileSync(path.join(out,'build-report.json'),JSON.stringify({source:'root bundles',rootFilesUnchanged:true,originalSHA256:hashes,patchedFunctions:changes,recoveredMessages:Object.keys(messages).length},null,2)+'\n');
console.log('Adapted bundles and '+Object.keys(messages).length+' recovered/fallback messages written.');
