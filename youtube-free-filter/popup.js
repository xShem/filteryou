(() => {
  'use strict';
  const core=globalThis.YTFreeFilter, ui=globalThis.YTFreeUI, $=id=>document.getElementById(id);
  if(new URL(location.href).searchParams.has('panel'))document.body.classList.add('panel');
  let current=core.sanitize(), presets=[], watchlist=[], snapshot=null, ready=false;
  const form=$('filters');
  function el(tag,text,cls){const node=document.createElement(tag);if(text!=null)node.textContent=text;if(cls)node.className=cls;return node;}
  function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
  function handle(fn){return async event=>{try{await fn(event);}catch(error){status(error.message||'Операция не выполнена',true);}};}
  function tab(name){
    document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===name);b.setAttribute('aria-pressed',String(b.dataset.tab===name));});
    document.querySelectorAll('[data-section]').forEach(s=>{s.hidden=s.dataset.section!==name;});
    if(name==='analytics')refresh().catch(error=>status(error.message,true));
    if(name==='collection')renderWatchlist();
  }
  for(const button of document.querySelectorAll('[data-tab]'))button.onclick=()=>tab(button.dataset.tab);
  for(const [section,key,label,type,options] of ui.fields){
    const wrapper=el('label',null,'field'+(type==='checkbox'?' wide check':['text','select'].includes(type)?' wide':''));
    const input=el(type==='select'?'select':'input');input.name=key;
    if(type==='select')for(const [value,title]of options){const option=el('option',title);option.value=value;input.append(option);}
    else{input.type=type;if(type==='number'){input.min='0';input.step='any';input.placeholder='Без ограничения';}if(type==='text')input.placeholder='Через запятую';}
    if(type==='checkbox')wrapper.append(input,document.createTextNode(label));else wrapper.append(document.createTextNode(label),input);
    document.querySelector(`[data-fields="${section}"]`).append(wrapper);
  }
  function fill(value){
    current=core.sanitize(value);$('enabled').checked=current.enabled;
    for(const [,key,,,] of ui.fields){const input=form.elements.namedItem(key);if(input.type==='checkbox')input.checked=current[key];else input.value=current[key];}
    renderBlocked();
  }
  function read(){
    const draft={...current,enabled:$('enabled').checked};
    for(const [section,key,label,type] of ui.fields){
      const input=form.elements.namedItem(key);
      if(type==='number'&&(input.validity.badInput||input.value!==''&&(!Number.isFinite(Number(input.value))||Number(input.value)<0))){tab(section);input.focus();throw new Error(label+': введите неотрицательное число');}
      draft[key]=type==='checkbox'?input.checked:input.value.trim();
    }
    const pairs=[...core.ranges.map(r=>r.slice(1)),['minMinutes','maxMinutes'],['minSeconds','maxSeconds'],['dateFrom','dateTo'],['channelDateFrom','channelDateTo']];
    for(const [min,max] of pairs)if(draft[min]!==''&&draft[max]!==''&&(min.includes('Date')||min.startsWith('date')?draft[min]>draft[max]:Number(draft[min])>Number(draft[max]))){
      const spec=ui.fields.find(f=>f[1]===min);if(spec){tab(spec[0]);form.elements.namedItem(min).focus();}throw new Error('Нижняя граница должна быть не больше верхней');
    }
    const minDuration=draft.minSeconds!==''?Number(draft.minSeconds):draft.minMinutes!==''?Number(draft.minMinutes)*60:null;
    const maxDuration=draft.maxSeconds!==''?Number(draft.maxSeconds):draft.maxMinutes!==''?Number(draft.maxMinutes)*60:null;
    if(minDuration!==null&&maxDuration!==null&&minDuration>maxDuration){tab('video');throw new Error('Минимальная длительность больше максимальной. Проверьте минуты и секунды.');}
    return core.sanitize(draft);
  }
  async function active(message){
    const [target]=await chrome.tabs.query({active:true,currentWindow:true});
    if(!target?.id)throw new Error('Откройте вкладку YouTube');
    try{const result=await chrome.tabs.sendMessage(target.id,message);if(!result?.ok)throw new Error();return result;}
    catch{throw new Error('Откройте YouTube и обновите вкладку после установки расширения');}
  }
  $('panel-button').onclick=handle(async()=>{await active({type:'ytff:panel'});window.close();});
  form.addEventListener('submit',event=>event.preventDefault());
  $('apply').onclick=handle(async()=>{
    if(!ready)return;
    const value=read();await chrome.storage.local.set({filters:value});current=value;
    status(value.enrich?'Применено. Публичные данные будут подгружаться.':'Применено к открытым вкладкам YouTube.');
  });
  $('reset').onclick=handle(async()=>{const value={...core.defaults,blockedChannels:current.blockedChannels,blockedVideos:current.blockedVideos};await chrome.storage.local.set({filters:value});fill(value);status('Фильтры сброшены. Блокировки и коллекция сохранены.');});
  function usePreset(value){const blocks={blockedVideos:current.blockedVideos,blockedChannels:current.blockedChannels};fill({...core.defaults,...value,...blocks});status('Пресет выбран. Нажмите «Применить».');}
  for(const preset of ui.presets){const b=el('button',preset.name);b.type='button';b.onclick=()=>usePreset(preset.filters);$('builtins').append(b);}
  function renderPresets(){
    $('custom-presets').replaceChildren();
    if(!presets.length)$('custom-presets').append(el('p','Пока нет сохранённых пресетов.','empty'));
    presets.forEach((preset,index)=>{const row=el('div',null,'item inline'),use=el('button',preset.name),remove=el('button','Удалить');use.type=remove.type='button';use.onclick=()=>usePreset(preset.filters);remove.onclick=handle(async()=>{presets.splice(index,1);await chrome.storage.local.set({presets});renderPresets();});row.append(use,remove);$('custom-presets').append(row);});
  }
  $('save-preset').onclick=handle(async()=>{
    const name=$('preset-name').value.trim();if(!name)throw new Error('Дайте пресету название');
    const filters=read(),index=presets.findIndex(p=>p.name===name);if(index>=0)presets[index]={name,filters};else{if(presets.length>=30)throw new Error('Максимум 30 пресетов');presets.push({name,filters});}
    await chrome.storage.local.set({presets});renderPresets();$('preset-name').value='';status('Пресет сохранён.');
  });
  function renderBlocked(){
    $('blocked').replaceChildren();
    for(const key of ['blockedChannels','blockedVideos'])for(const id of current[key]){
      const row=el('div',null,'item'),label=el('code',(key==='blockedChannels'?'Канал: ':'Видео: ')+id),remove=el('button','Разблокировать');remove.type='button';remove.onclick=handle(async()=>{
        current[key]=current[key].filter(v=>v!==id);await chrome.storage.local.set({filters:current});renderBlocked();status('Блокировка удалена.');
      });row.append(label,remove);$('blocked').append(row);
    }
    if(!current.blockedChannels.length&&!current.blockedVideos.length)$('blocked').append(el('p','Блокировок нет. Используйте кнопки под видео.','hint'));
  }
  function renderWatchlist(){
    $('watchlist').replaceChildren();
    if(!watchlist.length)$('watchlist').append(el('p','Сохранённые видео появятся здесь.','empty'));
    watchlist.forEach((video,index)=>{const row=el('div',null,'item'),link=el('a',video.title||video.id);link.href='https://www.youtube.com/watch?v='+encodeURIComponent(video.id);link.target='_blank';link.rel='noopener noreferrer';
      const remove=el('button','Убрать');remove.type='button';remove.onclick=handle(async()=>{watchlist.splice(index,1);await chrome.storage.local.set({watchlist});renderWatchlist();});row.append(link,el('small',video.channel),remove);$('watchlist').append(row);
    });
  }
  function download(name,body,type){const url=URL.createObjectURL(new Blob([body],{type}));const link=el('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  async function refresh(){
    snapshot=await active({type:'ytff:snapshot'});const s=snapshot.stats;$('metrics').replaceChildren();
    const format=v=>v==null?'—':Math.round(v).toLocaleString('ru-RU');
    for(const [title,value]of [['Загружено видео',s.count],['Скрыто фильтрами',s.hidden],['Просмотры выборки',s.totalViews],['Медиана просмотров',s.medianViews]]){const box=el('div',null,'metric');box.append(el('small',title),el('b',format(value)));$('metrics').append(box);}
    $('calendar').replaceChildren();
    if(!s.days.length)$('calendar').append(el('p','Для календаря нужны точные даты: включите подгрузку данных.','hint'));
    for(const [date,count]of s.days){const box=el('span',null,'day');box.tabIndex=0;box.title=date+': '+count+' видео';box.setAttribute('aria-label',box.title);box.style.opacity=String(Math.min(1,.3+count/10));$('calendar').append(box);}
    $('results').replaceChildren();
    const order=form.elements.namedItem('sort').value;
    const rows=[...snapshot.rows].sort((a,b)=>core.compare(a.video,b.video,order));
    for(const {video,reasons,error}of rows.slice(0,150)){
      const row=el('div',null,'item'),link=el('a',video.title||video.id);link.href='https://www.youtube.com/watch?v='+video.id;link.target='_blank';link.rel='noopener noreferrer';
      row.append(link,el('small',video.channel+' · '+format(video.views)+' просмотров · '+(video.source?'данные YouTube':'карточка')));
      if(reasons.length)row.append(el('small','Скрыто: '+reasons.join(', ')));
      if(error)row.append(el('small','Не удалось загрузить данные: '+error));
      const b=el('button','Подробности');b.type='button';b.onclick=handle(async()=>{await active({type:'ytff:show',id:video.id});if(!document.body.classList.contains('panel'))window.close();});row.append(b);$('results').append(row);
    }
    status(`Снимок: ${s.count} видео. ${s.autoCount}/30 загрузок, ${s.busy} активных, ошибок: ${s.errors||0}.`);
  }
  $('refresh').onclick=handle(refresh);
  $('more').onclick=handle(async()=>{if(!current.enrich)throw new Error('Сначала включите подгрузку данных и нажмите «Применить»');await active({type:'ytff:more'});status('Разрешена следующая порция до 30 видео. Обновите снимок после загрузки.');});
  $('csv').onclick=handle(async()=>{await refresh();download('youtube-videos.csv',core.csv(snapshot.rows.map(r=>r.video)),'text/csv;charset=utf-8');});
  $('report').onclick=handle(async()=>{await refresh();download('youtube-analysis.json',JSON.stringify({generatedAt:new Date().toISOString(),scope:'loaded-cards-only',...snapshot},null,2),'application/json');});
  $('export').onclick=handle(async()=>{const data=await chrome.storage.local.get(['filters','presets','watchlist']);download('free-filter-backup.json',JSON.stringify({version:2,...data},null,2),'application/json');status('Резервная копия скачана.');});
  $('import').onchange=handle(async event=>{
    const file=event.target.files[0];if(!file)return;if(file.size>2e6)throw new Error('Файл больше 2 МБ');
    const data=JSON.parse(await file.text());if(data?.version!==2||!data.filters||typeof data.filters!=='object'||Array.isArray(data.filters))throw new Error('Неверный формат резервной копии Free Filter v2');
    const filters=core.sanitize(data.filters);
    const cleanPresets=(Array.isArray(data.presets)?data.presets:[]).filter(p=>p&&typeof p.name==='string').slice(0,30).map(p=>({name:p.name.slice(0,80),filters:core.sanitize(p.filters)}));
    const cleanWatch=(Array.isArray(data.watchlist)?data.watchlist:[]).filter(v=>v&&/^[\w-]{11}$/.test(v.id||'')).slice(0,1000).map(v=>({id:v.id,title:String(v.title||'').slice(0,500),channel:String(v.channel||'').slice(0,300),savedAt:Number(v.savedAt)||Date.now()}));
    await chrome.storage.local.set({filters,presets:cleanPresets,watchlist:cleanWatch});fill(filters);presets=cleanPresets;watchlist=cleanWatch;renderPresets();renderWatchlist();status('Копия восстановлена и применена.');event.target.value='';
  });
  $('clear-cache').onclick=handle(async()=>{const all=await chrome.storage.local.get(null);const keys=Object.keys(all).filter(k=>k.startsWith('cache:'));await chrome.storage.local.remove(keys);status('Кэш очищен. Обновите вкладку YouTube, чтобы очистить данные в памяти.');});
  $('search').onclick=handle(async()=>{
    const query=$('search-query').value.trim();if(!query)throw new Error('Введите поисковый запрос');const value=read();let q=query;
    if(value.dateFrom)q+=' after:'+value.dateFrom;
    if(value.dateTo){const date=new Date(value.dateTo+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+1);q+=' before:'+date.toISOString().slice(0,10);}
    await chrome.tabs.create({url:'https://www.youtube.com/results?search_query='+encodeURIComponent(q)});
  });
  $('apply').disabled=$('reset').disabled=true;
  chrome.storage.local.get(['filters','presets','watchlist']).then(data=>{
    fill(data.filters);presets=Array.isArray(data.presets)?data.presets:[];watchlist=Array.isArray(data.watchlist)?data.watchlist:[];renderPresets();renderWatchlist();ready=true;$('apply').disabled=$('reset').disabled=false;status('Настройки загружены.');
  }).catch(error=>status(error.message,true));
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area!=='local')return;
    if(changes.watchlist){watchlist=changes.watchlist.newValue||[];renderWatchlist();}
    if(changes.filters){const s=core.sanitize(changes.filters.newValue);current.blockedChannels=s.blockedChannels;current.blockedVideos=s.blockedVideos;renderBlocked();}
  });
})();
