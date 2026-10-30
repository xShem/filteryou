const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function setup(){
 const store={},requests=[];let handler,active=0,peak=0;
 const context={URL,AbortSignal,Date,Promise,Map,console,importScripts(){},
  YTFreeData:{parseVideo:(html,id)=>({id,channelId:'UCabcdefghijklmnopqrstuv',emails:[],socials:[],views:100}),parseChannel:()=>{throw new Error('Channel unavailable');}},
  chrome:{runtime:{id:'unit',onMessage:{addListener:cb=>handler=cb},onStartup:{addListener(){}},onInstalled:{addListener(){}}},storage:{local:{get:async key=>key===null?{...store}:{[key]:store[key]},set:async data=>Object.assign(store,data),remove:async keys=>keys.forEach(k=>delete store[k])}}},
  fetch:async(url,options)=>{requests.push({url,options});active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,5));active--;return {ok:true,url,text:async()=>'<public data>'};}
 };
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../background.js'),'utf8'),context);
 const send=(message,sender={id:'unit'})=>new Promise(resolve=>{const result=handler(message,sender,resolve);if(result!==true)resolve(null);});
 return {send,requests,store,peak:()=>peak,context};
}
test('background deduplicates requests, limits concurrency and caches public results',async()=>{
 const s=setup();const messages=['aaaaaaaaaaa','aaaaaaaaaaa','bbbbbbbbbbb','ccccccccccc','ddddddddddd'].map(id=>s.send({type:'ytff:details',id}));
 const results=await Promise.all(messages);assert.ok(results.every(r=>r.ok));assert.equal(s.requests.length,4);assert.ok(s.peak()<=2);
 await s.send({type:'ytff:details',id:'aaaaaaaaaaa'});assert.equal(s.requests.length,4,'cache hit');
 for(const {url,options} of s.requests){assert.equal(new URL(url).hostname,'www.youtube.com');assert.equal(options.credentials,'omit');assert.ok(options.signal);}
});
test('background rejects invalid IDs and foreign senders without requests',async()=>{
 const s=setup();assert.equal(await s.send({type:'ytff:details',id:'../../evil'}),null);assert.equal(await s.send({type:'ytff:details',id:'aaaaaaaaaaa'},{id:'foreign'}),null);assert.equal(s.requests.length,0);
});
test('channel failure preserves video metadata with a visible partial-data warning',async()=>{
 const s=setup();const result=await s.send({type:'ytff:details',id:'aaaaaaaaaaa',channel:true});assert.equal(result.ok,true);assert.equal(result.data.views,100);assert.equal(result.data.channelError,'Channel unavailable');
});
test('YouTube consent redirect becomes an error, not empty or invented metadata',async()=>{
 const s=setup();s.context.fetch=async()=>({ok:true,url:'https://consent.youtube.com/',text:async()=>''});const result=await s.send({type:'ytff:details',id:'aaaaaaaaaaa'});assert.equal(result.ok,false);assert.match(result.error,/согласие/);
});
