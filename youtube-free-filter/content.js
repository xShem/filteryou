(() => {
  'use strict';
  const core = globalThis.YTFreeFilter, dom = globalThis.YTFreeDOM;
  let settings = core.sanitize(), loaded = false, timer, showHidden = false, pageURL = location.href;
  let rows = [], saved = [], busy = 0, autoCount = 0;
  const metadata = new Map(), errors = new Map(), pending = new Set(), attempted = new Set(), originals = new Map();
  const host = document.createElement('div'); host.id = 'ytff-workspace';
  const shadow = host.attachShadow({mode:'open'});
  shadow.innerHTML = `<style>
+    :host{all:initial;font:13px/1.5 system-ui,sans-serif;color:#e9f1fa;position:fixed;bottom:18px;right:18px;z-index:2147483646;color-scheme:dark}
+    *{box-sizing:border-box}button,a{font:inherit}button{cursor:pointer;background:#202b3a;color:#edf4ff;border:1px solid #42516a;border-radius:8px;padding:7px 10px}button:hover{background:#33445b}button:focus-visible,a:focus-visible{outline:2px solid #a7edc5;outline-offset:2px}
+    .bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;background:#141c29;padding:9px;border:1px solid #34465b;border-radius:13px;box-shadow:0 4px 24px #0006;max-width:calc(100vw - 36px)}.brand{color:#a7edc5;font-weight:700}.status{color:#b2c0d3;font-size:12px}
+    .window{position:fixed;right:16px;top:72px;bottom:74px;width:min(550px,calc(100vw - 32px));border:1px solid #46546a;background:#11151c;border-radius:14px;box-shadow:0 16px 60px #0009;display:flex;flex-direction:column;overflow:hidden}.window[hidden]{display:none}.head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:#1b2635}.head strong{font-size:15px}iframe{width:100%;flex:1;min-height:0;border:0}.detail{overflow:auto;padding:18px}.detail h2{font-size:20px;line-height:1.35}.detail h3{color:#a7edc5}.detail p{white-space:pre-wrap;overflow-wrap:anywhere}.detail a{color:#9cd6ff}.metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px}.metric{padding:10px;background:#202b3a;border-radius:9px}.metric small{display:block;color:#a5b5c9}.metric b{font-size:17px}.actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.muted{color:#a5b5c9}.error{color:#ffbeaa}
+  </style><div class="bar"><button class="brand" id="open">◈ Free Filter</button><span class="status" id="counts">Загрузка…</span><button id="toggle">Пауза</button><button id="reveal">Показать скрытые</button></div><section class="window" id="panel" hidden aria-label="Панель фильтров"><div class="head"><strong>Фильтры и аналитика</strong><button id="close-panel" aria-label="Закрыть панель">✕</button></div><iframe title="Настройки Free Filter"></iframe></section><section class="window" id="details" hidden role="dialog" aria-label="Подробности видео"><div class="head"><strong>Данные видео</strong><button id="close-details" aria-label="Закрыть подробности">✕</button></div><div class="detail"></div></section>`.replace(/^\+/gm,'');
  document.documentElement.append(host);
  const $ = id=>shadow.getElementById(id);
  const frame = shadow.querySelector('iframe');
  function openPanel() { $('details').hidden = true; $('panel').hidden = false; if (!frame.src) frame.src = chrome.runtime.getURL('popup.html?panel=1'); $('close-panel').focus(); }
  $('open').onclick = openPanel;
  $('close-panel').onclick = ()=>{$('panel').hidden=true;$('open').focus();};
  $('close-details').onclick = ()=>{$('details').hidden=true;$('open').focus();};
  $('toggle').onclick = ()=>chrome.storage.local.set({filters:{...settings,enabled:!settings.enabled}});
  $('reveal').onclick = ()=>{showHidden=!showHidden;schedule();};
  document.addEventListener('keydown',event=>{
    if (event.key==='Escape') { $('panel').hidden=true; $('details').hidden=true; }
    if (event.altKey && event.shiftKey && event.code==='KeyF') {event.preventDefault();openPanel();}
  });
  const labels = {views:'Просмотры',vpd:'Просмотров / день',likes:'Лайки',likeRate:'Лайки / просмотры, %',comments:'Комментарии',commentRate:'Комментарии / просмотры, %',subs:'Подписчики',performance:'Просмотры / подписчики, %',seconds:'Длительность',ageDays:'Возраст',title:'Название',channel:'Канал',description:'Описание',channelDescription:'Описание канала',shorts:'Shorts',live:'Эфир',watched:'Просмотрено',upcoming:'Премьера',type:'Тип',verified:'Верификация',blockedVideo:'Блокировка видео',blockedChannel:'Блокировка канала',strictSearch:'Строгий поиск',published:'Дата публикации',channelJoined:'Дата канала',country:'Страна',captionLanguages:'Субтитры',chapters:'Главы',emails:'Email',socials:'Соцсети',channelViews:'Просмотры канала',channelVideos:'Видео канала'};
  const label = key=>key.startsWith('unknown:') ? 'Нет данных: '+(labels[key.slice(8)]||key.slice(8)) : labels[key] || key;
  function element(tag,text,className) { const el=document.createElement(tag); if(text!=null)el.textContent=text;if(className)el.className=className;return el; }
  function notify(message) { $('counts').textContent=message; }
  async function getDetails(id) {
    if (metadata.has(id)) return metadata.get(id);
    const result = await chrome.runtime.sendMessage({type:'ytff:details',id,channel:true});
    if (!result?.ok) throw new Error(result?.error||'Нет ответа от расширения');
    metadata.set(id,result.data); errors.delete(id); schedule(); return result.data;
  }
  function autoLoad(id) {
    if (pending.has(id) || attempted.has(id) || metadata.has(id) || busy>=2 || autoCount>=30) return;
    attempted.add(id);pending.add(id);busy++;autoCount++;
    getDetails(id).catch(error=>errors.set(id,error.message)).finally(()=>{pending.delete(id);busy--;schedule();});
  }
  function merge(card) {
    const data=metadata.get(card.id), v={...card};
    if(data)for(const [key,value] of Object.entries(data))if(value!=null)v[key]=value;
    return core.metrics(v);
  }
  async function saveVideo(video) {
    const data=await chrome.storage.local.get('watchlist'); const list=Array.isArray(data.watchlist)?data.watchlist:[];
    if(!list.some(v=>v.id===video.id)) {
      const {id,title,channel}=video;
      list.unshift({id,title,channel,savedAt:Date.now()});
      await chrome.storage.local.set({watchlist:list.slice(0,1000)});
    }
    notify('Видео в коллекции');
  }
  function enrichCard(node,video,reasons) {
    let tools=node.querySelector(':scope > .ytff-card-tools');
    if(!tools) {
      tools=document.createElement('div');tools.className='ytff-card-tools';
      for(const [action,title] of [['info','Подробности'],['save','Сохранить'],['block','Скрыть видео'],['channel','Скрыть канал']]) {
        const b=element('button',title);b.type='button';b.dataset.action=action;tools.append(b);
      }
      const badge=element('span','','ytff-card-stats');tools.append(badge);node.append(tools);
      tools.addEventListener('click',event=>{
        const action=event.target.closest('button')?.dataset.action;
        if(!action)return;
        event.preventDefault();event.stopPropagation();
        const id=tools.dataset.id,current=rows.find(r=>r.video.id===id)?.video;
        if(!current)return;
        if(action==='info')showDetails(current);
        if(action==='save')saveVideo(current).catch(()=>notify('Не удалось сохранить'));
        if(action==='block')chrome.storage.local.set({filters:{...settings,blockedVideos:[...new Set([...settings.blockedVideos,id])]}});
        if(action==='channel') {
          (current.channelId ? Promise.resolve(current) : getDetails(id)).then(v=>{
            if(!v.channelId)throw new Error('Не удалось определить канал');
            return chrome.storage.local.set({filters:{...settings,blockedChannels:[...new Set([...settings.blockedChannels,v.channelId])]}});
          }).catch(error=>notify(error.message));
        }
      });
    }
    tools.dataset.id=video.id;
    const stats=tools.querySelector('.ytff-card-stats');
    const message=reasons.length ? reasons.map(label).join(' · ') : video.vpd!=null ? Math.round(video.vpd).toLocaleString('ru-RU')+' / день'+(video.subs>0?' · '+Math.round(video.performance)+'% от подписчиков':'') : '';
    if(stats.textContent!==message)stats.textContent=message;
    tools.hidden=!settings.badges;
  }
  async function showDetails(card) {
    $('panel').hidden=true;$('details').hidden=false;$('close-details').focus();
    const body=shadow.querySelector('.detail');body.dataset.current=card.id;body.replaceChildren(element('h2',card.title),element('p','Загружаем публичные данные YouTube…','muted'));
    try {
      const data=await getDetails(card.id);
      if(body.dataset.current!==card.id)return;
      renderDetails({...card,...data},body);
    }catch(error){if(body.dataset.current===card.id)body.replaceChildren(element('h2',card.title),element('p',error.message,'error'));}
  }
  function renderDetails(raw,body) {
    const v=core.metrics(raw);body.replaceChildren(element('h2',v.title),element('p',v.channel,'muted'));
    const actions=element('div',null,'actions');
    const watch=element('a','Открыть видео ↗');watch.href='https://www.youtube.com/watch?v='+v.id;watch.target='_blank';watch.rel='noopener noreferrer';actions.append(watch);
    const save=element('button','В коллекцию');save.onclick=()=>saveVideo(v).catch(()=>notify('Ошибка сохранения'));actions.append(save);
    const comments=element('a','К комментариям');comments.href=watch.href+'#comments';comments.target='_blank';comments.rel='noopener noreferrer';actions.append(comments);
    const preview=element('button','Предпросмотр');preview.onclick=()=>{
      const player=element('iframe');player.title='Предпросмотр видео';player.src='https://www.youtube.com/embed/'+v.id+'?autoplay=0';
      player.style.cssText='width:100%;aspect-ratio:16/9;flex:none;min-height:230px;margin:12px 0';player.allowFullscreen=true;
      preview.disabled=true;actions.after(player);
    };actions.append(preview);body.append(actions);
    const grid=element('div',null,'metrics');
    for(const key of ['views','vpd','likes','likeRate','comments','commentRate','subs','performance','channelVideos','channelViews']) {
      const cell=element('div',null,'metric');cell.append(element('small',labels[key]),element('b',v[key]==null?'Нет данных':Number(v[key]).toLocaleString('ru-RU',{maximumFractionDigits:1})));grid.append(cell);
    }
    body.append(grid,element('p','Публикация: '+(v.published||'неизвестна')+' · Категория: '+(v.category||'неизвестна')));
    body.append(element('p','Страна: '+(v.country||'нет данных')+' · Канал создан: '+(v.channelJoined||'нет данных')));
    body.append(element('p','Субтитры: '+(v.captions?.map(c=>c.language+(c.automatic?' (авто)':'')).join(', ')||'не найдены')));
    if(v.channelError)body.append(element('p','Данные канала: '+v.channelError,'muted'));
    if(v.chapters?.length) {
      body.append(element('h3','Главы'));
      for(const c of v.chapters){const a=element('a',`${Math.floor(c.seconds/60)}:${String(c.seconds%60).padStart(2,'0')} — ${c.title}`);a.href=watch.href+'&t='+c.seconds;a.target='_blank';a.rel='noopener noreferrer';body.append(a,element('br'));}
    }
    body.append(element('h3','Описание'),element('p',v.description||'Описание отсутствует'));
    if(v.keywords?.length)body.append(element('h3','Теги'),element('p',v.keywords.join(' · ')));
    if(v.channelDescription)body.append(element('h3','О канале'),element('p',v.channelDescription));
    if(v.emails?.length)body.append(element('h3','Публичные контакты'),element('p',v.emails.join('\n')));
    if(v.socials?.length)body.append(element('p','Ссылки в описании: '+v.socials.join(', ')));
    body.append(element('p','Статистика взята из публичной страницы; часть значений YouTube скрывает или округляет. Просмотры/день — среднее с публикации, а не текущая скорость роста. Дизлайки и AI-анализ не имитируются.','muted'));
  }
  function apply() {
    timer=undefined;if(!loaded)return;
    if(location.href!==pageURL){pageURL=location.href;autoCount=0;attempted.clear();showHidden=false;}
    const query=new URL(location.href).searchParams.get('search_query')||'';
    rows=[];
    for(const node of document.querySelectorAll(dom.selector)) {
      if(node.parentElement?.closest(dom.selector))continue;
      const card=dom.extract(node);
      if(!card){node.removeAttribute('data-ytff-hidden');node.removeAttribute('data-ytff-dim');continue;}
      const video=merge(card), reasons=core.reasons(video,settings,query);
      rows.push({node,video,reasons,error:errors.get(video.id)||''});
      if(settings.enabled && settings.enrich)autoLoad(video.id);
      const hidden=reasons.length>0;
      setAttr(node,'data-ytff-hidden',hidden&&!showHidden?'true':null);
      setAttr(node,'data-ytff-dim',hidden&&showHidden?'true':null);
      enrichCard(node,video,reasons);
    }
    const ordered=[...rows].sort((a,b)=>core.compare(a.video,b.video,settings.enabled?settings.sort:'original'));
    const sorting=settings.enabled && settings.sort!=='original';
    setAttr(document.documentElement,'data-ytff-sort',sorting?'true':null);
    for(let i=0;i<ordered.length;i++) {
      const node=ordered[i].node;
      if(!originals.has(node))originals.set(node,node.style.order);
      const order=sorting?String(i+1):originals.get(node);
      if(node.style.order!==order)node.style.order=order;
    }
    for(const [node] of originals)if(!node.isConnected)originals.delete(node);
    for(const shelf of document.querySelectorAll('ytd-reel-shelf-renderer, ytd-rich-shelf-renderer')) {
      const shorts=shelf.matches('ytd-reel-shelf-renderer')||Boolean(shelf.querySelector('a[href^="/shorts/"]'));
      setAttr(shelf,'data-ytff-hidden',settings.enabled&&!showHidden&&(settings.hideShorts||settings.videoType==='videos')&&shorts?'true':null);
    }
    for(const mix of document.querySelectorAll('ytd-radio-renderer, ytd-playlist-renderer'))setAttr(mix,'data-ytff-hidden',settings.enabled&&settings.hideMixes&&!showHidden?'true':null);
    const count=rows.filter(r=>r.reasons.length).length;
    const failures=rows.filter(r=>r.error).length;
    $('counts').textContent=`${rows.length-count} из ${rows.length} видео${busy?' · загрузка '+busy:''}${failures?' · ошибок '+failures:''}${autoCount>=30?' · лимит 30':''}`;
    $('toggle').textContent=settings.enabled?'Пауза':'Включить';
    $('reveal').textContent=showHidden?'Спрятать снова':'Показать скрытые';
  }
  function setAttr(node,key,value){if(value===null){if(node.hasAttribute(key))node.removeAttribute(key);}else if(node.getAttribute(key)!==value)node.setAttribute(key,value);}
  function schedule(){if(!timer)timer=setTimeout(apply,180);}
  chrome.storage.local.get(['filters','watchlist'],result=>{settings=core.sanitize(result.filters);saved=result.watchlist||[];loaded=true;schedule();});
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area!=='local')return;
    if(changes.filters){settings=core.sanitize(changes.filters.newValue);schedule();}
    if(changes.watchlist)saved=changes.watchlist.newValue||[];
  });
  chrome.runtime.onMessage.addListener((message,sender,respond)=>{
    if(sender.id!==chrome.runtime.id)return;
    if(message?.type==='ytff:panel'){openPanel();respond({ok:true});}
    if(message?.type==='ytff:snapshot')respond({ok:true,rows:rows.map(r=>({video:r.video,reasons:r.reasons.map(label),error:r.error})),stats:{...core.analytics(rows.map(r=>r.video)),hidden:rows.filter(r=>r.reasons.length).length,errors:rows.filter(r=>r.error).length,busy,autoCount}});
    if(message?.type==='ytff:more'){autoCount=0;attempted.clear();schedule();respond({ok:true});}
    if(message?.type==='ytff:show' && /^[\w-]{11}$/.test(message.id||'')){showDetails(rows.find(r=>r.video.id===message.id)?.video||{id:message.id,title:'Видео'});respond({ok:true});}
  });
  const observer=new MutationObserver(records=>{
    if(records.some(r=>!host.contains(r.target)&&!r.target.closest?.('.ytff-card-tools')&&
      !(r.type==='childList'&&[...r.addedNodes,...r.removedNodes].every(n=>n.nodeType===1&&n.classList?.contains('ytff-card-tools')))))schedule();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['href','aria-label','overlay-style']});
  document.addEventListener('yt-navigate-finish',schedule);
})();
