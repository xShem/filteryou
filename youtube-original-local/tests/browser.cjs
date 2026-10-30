const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const{chromium}=require('playwright');const dir=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],missing=[],external=[];
  page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
  await page.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.pathname.startsWith('/__local__/')){
    const file=path.join(dir,u.pathname.slice('/__local__/'.length));
    if(!file.startsWith(dir+path.sep)||!fs.existsSync(file)){missing.push(u.pathname);return route.fulfill({status:404,body:''});}
    let body=fs.readFileSync(file);
    if(file.endsWith('index.ts-BvtW_Xxd.js'))body=Buffer.concat([body,Buffer.from('\nexport {Zc as testConfigure, dE as testVideo};\n')]);
    return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/plain',body});
   }
   if(u.hostname!=='www.youtube.com'){external.push(u.href);return route.fulfill({status:503,body:'External services unavailable in fixture test'});}
   if(u.pathname.startsWith('/youtubei/'))return route.fulfill({contentType:'application/json',body:'{}'});
   return route.fulfill({contentType:'text/html',body:'<!doctype html><html dark><head><title>YouTube test</title></head><body style="background:#0f0f0f;color:#eee"><ytd-app><ytd-masthead style="display:block;height:60px"><div id="center"><ytd-searchbox style="display:block"><input id="search" value="science"><button id="search-icon-legacy">Search</button></ytd-searchbox></div></ytd-masthead><ytd-search><div id="contents"><ytd-video-renderer><a id="video-title" href="/watch?v=aaaaaaaaaaa">Science video</a><div id="channel-name"><a href="/@science">Science Lab</a></div><div id="metadata-line"><span>5,000 views</span><span>2 days ago</span></div><ytd-thumbnail-overlay-time-status-renderer><span id="text">10:00</span></ytd-thumbnail-overlay-time-status-renderer></ytd-video-renderer></div></ytd-search></ytd-app></body></html>'});
  });
  await page.goto('https://www.youtube.com/results?search_query=science');
  await page.evaluate(({messages,manifest})=>{
   const storage={yfpHasSeenOnboarding:true},listeners=[];globalThis.localTest={storage,listeners};
   const get=(keys,cb)=>{let value={};if(keys===null)value={...storage};else if(typeof keys==='string')value={[keys]:storage[keys]};else if(Array.isArray(keys))keys.forEach(k=>value[k]=storage[k]);else value={...keys,...storage};if(cb)cb(value);return Promise.resolve(value);};
   const set=(data,cb)=>{const changes={};for(const[k,v]of Object.entries(data)){changes[k]={oldValue:storage[k],newValue:v};storage[k]=v;}listeners.forEach(fn=>fn(changes,'local'));cb?.();return Promise.resolve();};
   const local={get,set,remove:(keys,cb)=>{for(const k of Array.isArray(keys)?keys:[keys])delete storage[k];cb?.();return Promise.resolve();},clear:cb=>{for(const k of Object.keys(storage))delete storage[k];cb?.();return Promise.resolve();}};
   globalThis.chrome={i18n:{getMessage:(key,args)=>{let s=messages[key]?.message||'';args=Array.isArray(args)?args:[args];return s.replace(/\$(\d+)/g,(_,n)=>String(args[n-1]??''));},getUILanguage:()=> 'en'},
    storage:{local,sync:local,session:local,onChanged:{addListener:fn=>listeners.push(fn),removeListener:fn=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);}}},
    runtime:{id:'local-test',getManifest:()=>manifest,getURL:p=>'https://www.youtube.com/__local__/'+p,onMessage:{addListener(){},removeListener(){}},sendMessage:(m,cb)=>{const result=m.type==='YFP_AUTH_GET_SESSION'?{user:null}:m.type==='YFP_ENSURE_MAIN_WORLD'?{ok:true}:{ok:false,error:'Unavailable in test'};cb?.(result);return Promise.resolve(result);}},
    tabs:{query:async()=>[]}};
   window.ytcfg={data_:{INNERTUBE_CONTEXT:{client:{clientName:'WEB',clientVersion:'test'}},INNERTUBE_CLIENT_VERSION:'test'}};
  },{messages:JSON.parse(fs.readFileSync(path.join(dir,'_locales/en/messages.json'))),manifest:JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')))});
  await page.addStyleTag({path:path.join(dir,'assets/index-BEl-xhzj.css')});await page.addStyleTag({path:path.join(dir,'local-edition.css')});
  await page.evaluate(async()=>{await import('/__local__/assets/mainWorld.ts-Dop1yQHM.js');globalThis.bundle=await import('/__local__/assets/index.ts-BvtW_Xxd.js');await bundle.onExecute();});
  assert.equal(await page.evaluate(()=>bundle.i({unlimited:false,remaining:0})),true);
  assert.equal(await page.evaluate(async()=>(await bundle.b()).localEdition),true);
  await page.locator('#yfp-filter-btn').waitFor({state:'visible',timeout:10000});await page.locator('#yfp-filter-btn').click();
  await page.locator('#yfpModal:visible').first().waitFor({state:'visible'});
  await page.evaluate(()=>bundle.onExecute());assert.equal(await page.locator('#yfpModal').count(),1,'entry point must be idempotent');
  assert.equal(await page.locator('#yfpRailAccount').first().isVisible(),false);
  await page.locator('#yfpRailChannel:visible').click();await page.locator('#yfpRailVideo:visible').click();
  const inputs=await page.locator('#yfpModal input').count();assert.ok(inputs>20,'Original advanced controls are mounted');
  await page.evaluate(async()=>{const value=bundle.f.getAll();await bundle.f.replace({...value,viewMin:'12345'},true);});
  assert.equal(await page.evaluate(()=>bundle.f.getAll().viewMin),'12345');
  const evaluations=await page.evaluate(()=>{
    const defaults=bundle.f.getAll();const video={videoId:'aaaaaaaaaaa',title:'Science video',views:5000,durationSeconds:600,isShort:false,isVerified:false,channelName:'Science Lab'};
    bundle.testConfigure({...defaults,viewMin:'6000'});const tooFew=bundle.testVideo(video);
    bundle.testConfigure({...defaults,viewMin:'',durMinM:'11'});const tooShort=bundle.testVideo(video);
    bundle.testConfigure({...defaults,viewMin:'1000',durMinM:'1'});const match=bundle.testVideo(video);
    return {tooFew,tooShort,match};
  });
  assert.equal(evaluations.tooFew.ok,false);assert.match(evaluations.tooFew.reason,/views filter/);
  assert.equal(evaluations.tooShort.ok,false);assert.match(evaluations.tooShort.reason,/duration filter/);
  assert.equal(evaluations.match.ok,true,JSON.stringify(evaluations.match));
  const screenshot=process.env.YFP_SCREENSHOT||'/tmp/youtube-original-local.png';await page.screenshot({path:screenshot});
  await page.waitForTimeout(500);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);assert.ok(!external.some(url=>/supabase|codedcitadel|stripe|lemonsqueezy/i.test(url)),JSON.stringify(external));
  console.log('PASS: original bundle starts, opens original modal and tabs, persists filter, uses no license/private backend; controls:',inputs);
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
