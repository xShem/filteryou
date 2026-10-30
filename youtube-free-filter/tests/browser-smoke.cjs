/* Optional real Chromium DOM tests. Requires Playwright; no live YouTube requests. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const dir=path.resolve(__dirname,'..');
const defaults=require('../filter-core.js').defaults;
const card=(id,views,title='Science lecture')=>`<ytd-video-renderer><a id="video-title" href="/watch?v=${id}">${title}</a><a id="channel-name" href="/channel/UCabcdefghijklmnopqrstuv">Space Lab</a><div id="metadata-line"><span>${views} views</span><span>2 days ago</span></div><ytd-thumbnail-overlay-time-status-renderer><span id="text">20:00</span></ytd-thumbnail-overlay-time-status-renderer></ytd-video-renderer>`;
function mock({filters,rows=[]}){
 const state={store:{filters,presets:[],watchlist:[]},listeners:[],messages:[],requests:[]};
 globalThis.testState=state;
 const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
 globalThis.chrome={runtime:{id:'test-id',getURL:p=>'https://studio.test/'+p,onMessage:{addListener:cb=>state.messages.push(cb)},sendMessage:async m=>{state.requests.push(m);return {ok:true,data:{id:m.id,title:'Enriched video',channel:'Space Lab',views:1000,seconds:60,published:'2026-10-20',description:'Description',channelId:'UCabcdefghijklmnopqrstuv',captionLanguages:['en'],chapters:[],likes:10,comments:2}};}},
 storage:{local:{get:(keys,cb)=>{let result={};if(keys===null)result=clone(state.store);else for(const key of typeof keys==='string'?[keys]:keys)if(key in state.store)result[key]=clone(state.store[key]);if(cb)cb(result);else return Promise.resolve(result);},set:async values=>{const changes={};for(const[key,value]of Object.entries(values)){changes[key]={oldValue:clone(state.store[key]),newValue:clone(value)};state.store[key]=clone(value);}state.listeners.forEach(fn=>fn(changes,'local'));},remove:async keys=>{for(const key of keys)delete state.store[key];}},onChanged:{addListener:cb=>state.listeners.push(cb)}},
 tabs:{query:async()=>[{id:1}],create:async value=>state.requests.push(value),sendMessage:async(id,m)=>{state.requests.push(m);return {ok:true,rows,stats:{count:rows.length,hidden:0,totalViews:1000,medianViews:1000,days:[['2026-10-20',1]],autoCount:0,busy:0}};}}};
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><div id="list" style="display:flex;flex-direction:column">'+card('aaaaaaaaaaa',100)+card('bbbbbbbbbbb',5000)+'</div></body></html>'}));
  await page.goto('https://www.youtube.com/results?search_query=science');
  await page.evaluate(mock,{filters:{...defaults,minViews:'1000'}});
  for(const file of ['filter-core.js','dom.js','content.js'])await page.addScriptTag({path:path.join(dir,file)});
  await page.addStyleTag({path:path.join(dir,'content.css')});
  await page.waitForFunction(()=>document.querySelector('ytd-video-renderer')?.getAttribute('data-ytff-hidden')==='true');
  assert.equal(await page.locator('ytd-video-renderer[data-ytff-hidden]').count(),1);
  assert.equal(await page.evaluate(()=>testState.requests.length),0,'metadata is opt-in');
  await page.locator('#list').evaluate((node,html)=>node.insertAdjacentHTML('beforeend',html),card('ccccccccccc',50));
  await page.waitForFunction(()=>document.querySelectorAll('[data-ytff-hidden]').length===2);
  await page.evaluate(()=>chrome.storage.local.set({filters:{...testState.store.filters,enabled:false}}));
  await page.waitForFunction(()=>document.querySelectorAll('[data-ytff-hidden]').length===0);
  await page.evaluate(()=>chrome.storage.local.set({filters:{...testState.store.filters,enabled:true,sort:'views-desc'}}));
  await page.waitForFunction(()=>document.querySelectorAll('ytd-video-renderer')[1].style.order==='1');
  await page.locator('ytd-video-renderer').nth(1).getByRole('button',{name:'Сохранить',exact:true}).click();
  assert.equal(await page.evaluate(()=>testState.store.watchlist[0].id),'bbbbbbbbbbb');
  await page.locator('ytd-video-renderer').nth(1).getByRole('button',{name:'Подробности',exact:true}).click();
  await page.getByText('Enriched video',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>testState.requests[0].type),'ytff:details');
  await page.getByRole('button',{name:'Закрыть подробности'}).click();
  // Recycled nodes must be re-evaluated and their buttons refer to the new video.
  await page.locator('ytd-video-renderer').first().evaluate(node=>{node.querySelector('#video-title').href='/watch?v=ddddddddddd';node.querySelector('#metadata-line span').textContent='9000 views';});
  await page.waitForFunction(()=>!document.querySelector('ytd-video-renderer').hasAttribute('data-ytff-hidden'));
  await page.locator('ytd-video-renderer').first().getByRole('button',{name:'Скрыть видео',exact:true}).click();
  await page.waitForFunction(()=>testState.store.filters.blockedVideos.includes('ddddddddddd'));
  await page.waitForTimeout(500);const count=await page.evaluate(()=>document.querySelectorAll('.ytff-card-tools').length);assert.equal(count,3,'observer must not duplicate controls');
  await page.locator('ytd-video-renderer').nth(1).getByRole('button',{name:'Скрыть канал',exact:true}).click();
  await page.waitForFunction(()=>testState.store.filters.blockedChannels.length===1);
  await page.evaluate(()=>chrome.storage.local.set({filters:{...testState.store.filters,blockedChannels:[],blockedVideos:[],minViews:'',enrich:true}}));
  await page.locator('#list').evaluate((node,html)=>node.insertAdjacentHTML('beforeend',html),Array.from({length:35},(_,i)=>card(String(i).padStart(11,'z'),1000)).join(''));
  await page.waitForFunction(()=>testState.requests.filter(m=>m.type==='ytff:details').length===31);
  await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>testState.requests.filter(m=>m.type==='ytff:details').length),31,'automatic enrichment stops at 30');
  assert.deepEqual(errors,[]);console.log('PASS browser: dynamic cards, pause, sort, save, details, recycled nodes, no unsolicited requests');
  await page.close();
  const popup=await context.newPage();const popupErrors=[];popup.on('pageerror',error=>popupErrors.push(error.message));
  await popup.route('https://studio.test/**',route=>{const name=new URL(route.request().url()).pathname.slice(1)||'popup.html';const file=path.join(dir,name);if(!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(file)});});
  await popup.addInitScript(mock,{filters:defaults,rows:[{video:{id:'aaaaaaaaaaa',title:'Science video',channel:'Space Lab',views:1000},reasons:[]}]});
  await popup.goto('https://studio.test/popup.html?panel=1');
  await popup.getByText('Настройки загружены.',{exact:true}).waitFor();
  assert.equal(await popup.locator('form input, form select').count()>55,true);
  await popup.locator('[name=minViews]').fill('500');await popup.getByRole('button',{name:'Применить',exact:true}).click();
  assert.equal(await popup.evaluate(()=>testState.store.filters.minViews),'500');
  await popup.locator('[name=maxViews]').fill('100');await popup.getByRole('button',{name:'Применить',exact:true}).click();
  await popup.getByText('Нижняя граница должна быть не больше верхней',{exact:true}).waitFor();assert.equal(await popup.evaluate(()=>testState.store.filters.maxViews),'');
  await popup.locator('[name=maxViews]').fill('');
  await popup.locator('[data-tab=presets]').click();await popup.locator('#preset-name').fill('Test preset');await popup.locator('#save-preset').click();assert.equal(await popup.evaluate(()=>testState.store.presets.length),1);
  await popup.getByRole('button',{name:'Без отвлечений',exact:true}).click();await popup.getByRole('button',{name:'Применить',exact:true}).click();assert.equal(await popup.evaluate(()=>testState.store.filters.hideShorts),true);
  await popup.locator('[data-tab=analytics]').click();await popup.getByText('Science video',{exact:true}).waitFor();assert.equal(await popup.locator('.metric').count(),4);
  await popup.locator('[data-tab=settings]').click();await popup.locator('[name=enrich]').check();await popup.getByRole('button',{name:'Применить',exact:true}).click();assert.equal(await popup.evaluate(()=>testState.store.filters.enrich),true);
  const downloadPromise=popup.waitForEvent('download');await popup.locator('#export').click();const backup=await downloadPromise;assert.equal(backup.suggestedFilename(),'free-filter-backup.json');
  await popup.locator('#import').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:2,filters:{minViews:'1234'},presets:[],watchlist:[{id:'aaaaaaaaaaa',title:'<script>alert(1)</script>',channel:'Test'}]}))});
  await popup.getByText('Копия восстановлена и применена.',{exact:true}).waitFor();assert.equal(await popup.evaluate(()=>testState.store.filters.minViews),'1234');
  await popup.locator('[data-tab=collection]').click();assert.equal(await popup.locator('#watchlist script').count(),0);await popup.getByText('<script>alert(1)</script>',{exact:true}).waitFor();
  await popup.locator('[data-tab=video]').click();await popup.setViewportSize({width:550,height:900});await popup.screenshot({path:'/tmp/free-filter-studio.png'});
  assert.deepEqual(popupErrors,[]);console.log('PASS browser: settings persistence, range validation, presets, analytics, opt-in control, UI render');
  await context.close();
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
