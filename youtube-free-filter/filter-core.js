/* Independent implementation. No code from the original extension is reused. */
(function (root) {
  'use strict';
  const defaults = Object.freeze({
    enabled: true, hideShorts: false, hideLive: false, hideWatched: false, hideUpcoming: false,
    videoType: 'all', verified: 'all', unknown: 'keep', sort: 'original', enrich: false,
    badges: true, hideMixes: false, strictSearch: false,
    minViews: '', maxViews: '', minMinutes: '', maxMinutes: '', minSeconds: '', maxSeconds: '',
    maxAgeDays: '', dateFrom: '', dateTo: '', minVpd: '', maxVpd: '',
    minLikes: '', maxLikes: '', minLikeRate: '', maxLikeRate: '', minComments: '', maxComments: '',
    minCommentRate: '', maxCommentRate: '', minSubs: '', maxSubs: '', minChannelVideos: '', maxChannelVideos: '',
    minChannelViews: '', maxChannelViews: '', minPerformance: '', maxPerformance: '',
    channelDateFrom: '', channelDateTo: '', titleInclude: '', titleExclude: '', titleMode: 'any',
    descriptionInclude: '', descriptionExclude: '', channelInclude: '', channelExclude: '',
    channelDescriptionInclude: '', channelDescriptionExclude: '', countries: '', countriesExclude: '',
    languages: '', socialInclude: '', requireChapters: false, requireCaptions: false, requireEmail: false,
    blockedChannels: [], blockedVideos: []
  });
  const normalize = text => String(text ?? '').toLocaleLowerCase().replace(/[\u00a0\u202f]/g, ' ').trim();
  const words = value => normalize(value).split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  function number(text) {
    const match = normalize(text).match(/(\d[\d\s.,]*)\s*(тыс\.?|млн\.?|млрд\.?|[kmb])?/i);
    if (!match) return null;
    const unit = match[2] || '';
    let n = match[1].trim().replace(/\s/g, '');
    n = unit ? n.replace(',', '.') : n.replace(/[.,]/g, '');
    const scale = /^(k|тыс)/.test(unit) ? 1e3 : /^(m|млн)/.test(unit) ? 1e6 : /^(b|млрд)/.test(unit) ? 1e9 : 1;
    const value = Number(n) * scale;
    return Number.isFinite(value) ? value : null;
  }
  const views = text => /(?:views?|просмотр)/i.test(text || '') ? number(text) : null;
  function duration(text) {
    const s = String(text || '').trim();
    if (!/^\d{1,3}:\d{2}(?::\d{2})?$/.test(s)) return null;
    const parts = s.split(':').map(Number);
    return parts.slice(1).some(n => n > 59) ? null : parts.reduce((total, n) => total * 60 + n, 0);
  }
  function age(text) {
    const s = normalize(text);
    const m = s.match(/(\d+)\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?|секунд[а-я]*|минут[а-я]*|час[а-я]*|дн[а-я]*|день|недел[а-я]*|месяц[а-я]*|год[а-я]*|лет)(?=\s|$)/);
    if (!m || !/(ago|назад)/.test(s)) return null;
    const unit = m[2];
    const factor = /^(second|секунд)/.test(unit) ? 1/86400 : /^(minute|минут)/.test(unit) ? 1/1440 : /^(hour|час)/.test(unit) ? 1/24 : /^(week|недел)/.test(unit) ? 7 : /^(month|месяц)/.test(unit) ? 30 : /^(year|год|лет)/.test(unit) ? 365 : 1;
    return Number(m[1]) * factor;
  }
  function chapters(description) {
    const list = [];
    for (const line of String(description || '').split('\n')) {
      const m = line.match(/^\s*[-•▶►*]?\s*\(?(\d{1,3}:\d{2}(?::\d{2})?)\)?\s*[-–—:]?\s+(.+)$/);
      if (m && duration(m[1]) !== null) list.push({ seconds: duration(m[1]), title: m[2].trim() });
    }
    return list.length >= 3 && list[0].seconds === 0 && list.every((c, i) => !i || c.seconds - list[i-1].seconds >= 10) ? list : [];
  }
  function metrics(video, now = Date.now()) {
    const v = { ...video };
    if (v.published && Number.isFinite(Date.parse(v.published))) v.ageDays = Math.max(0, (now - Date.parse(v.published))/86400000);
    if (v.views != null && v.ageDays != null) v.vpd = v.views / Math.max(1, v.ageDays);
    if (v.views > 0 && v.likes != null) v.likeRate = 100 * v.likes / v.views;
    if (v.views > 0 && v.comments != null) v.commentRate = 100 * v.comments / v.views;
    if (v.subs > 0 && v.views != null) v.performance = v.views / v.subs * 100;
    return v;
  }
  const ranges = [
    ['views','minViews','maxViews'], ['vpd','minVpd','maxVpd'], ['likes','minLikes','maxLikes'],
    ['likeRate','minLikeRate','maxLikeRate'], ['comments','minComments','maxComments'],
    ['commentRate','minCommentRate','maxCommentRate'], ['subs','minSubs','maxSubs'],
    ['channelVideos','minChannelVideos','maxChannelVideos'], ['channelViews','minChannelViews','maxChannelViews'],
    ['performance','minPerformance','maxPerformance']
  ];
  function sanitize(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
    const out = { ...defaults };
    const numeric = new Set([...ranges.flatMap(r => r.slice(1)), 'minMinutes','maxMinutes','minSeconds','maxSeconds','maxAgeDays']);
    const enums = {videoType:['all','videos','shorts','live'], verified:['all','only','exclude'], unknown:['keep','hide'], titleMode:['any','all','phrase'], sort:['original','views-desc','views-asc','ageDays-asc','ageDays-desc','seconds-asc','seconds-desc','vpd-desc','likes-desc','subs-desc','performance-desc','title-asc']};
    for (const [key, fallback] of Object.entries(defaults)) {
      if (!(key in input)) continue;
      const value = input[key];
      if (Array.isArray(fallback)) out[key] = Array.isArray(value) ? [...new Set(value.filter(v => typeof v === 'string' && v.length < 200))].slice(0,2000) : [];
      else if (typeof fallback === 'boolean') out[key] = typeof value === 'boolean' ? value : fallback;
      else if (enums[key]) out[key] = enums[key].includes(value) ? value : fallback;
      else if (numeric.has(key)) out[key] = value !== '' && value != null && Number.isFinite(Number(value)) && Number(value) >= 0 ? String(Number(value)) : '';
      else out[key] = typeof value === 'string' ? value.slice(0,10000) : '';
    }
    for (const key of ['dateFrom','dateTo','channelDateFrom','channelDateTo']) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(out[key]) || !Number.isFinite(Date.parse(out[key]))) out[key] = '';
    }
    return out;
  }
  function reasons(video, settings, query = '', now = Date.now()) {
    const s = { ...defaults, ...settings }, v = metrics(video, now), result = [];
    if (!s.enabled) return result;
    const add = (condition, label) => { if (condition) result.push(label); };
    const unknown = (value, label) => { if (value == null) { add(s.unknown === 'hide', 'unknown:' + label); return true; } return false; };
    add(s.blockedVideos.includes(v.id), 'blockedVideo');
    add(v.channelId && s.blockedChannels.includes(v.channelId), 'blockedChannel');
    add(s.hideShorts && v.shorts, 'shorts'); add(s.hideLive && v.live, 'live');
    add(s.hideWatched && v.watched, 'watched'); add(s.hideUpcoming && v.upcoming, 'upcoming');
    add(s.videoType === 'shorts' && !v.shorts || s.videoType === 'videos' && v.shorts || s.videoType === 'live' && !v.live, 'type');
    if (s.verified !== 'all' && !unknown(v.verified, 'verified')) add(s.verified === 'only' ? !v.verified : v.verified, 'verified');
    const checkRange = (value, min, max, field) => {
      if ((min === '' && max === '') || unknown(value, field)) return;
      add(min !== '' && value < Number(min) || max !== '' && value > Number(max), field);
    };
    for (const [field,min,max] of ranges) checkRange(v[field],s[min],s[max],field);
    const seconds = side => s[side+'Seconds'] !== '' ? s[side+'Seconds'] : s[side+'Minutes'] !== '' ? Number(s[side+'Minutes'])*60 : '';
    checkRange(v.seconds,seconds('min'),seconds('max'),'seconds');
    checkRange(v.ageDays,'',s.maxAgeDays,'ageDays');
    for (const [field,from,to] of [['published',s.dateFrom,s.dateTo],['channelJoined',s.channelDateFrom,s.channelDateTo]]) {
      const date = v[field] || (field === 'published' && v.ageDays != null ? new Date(now-v.ageDays*86400000).toISOString() : null);
      if ((from || to) && !unknown(date, field)) add(from && date.slice(0,10) < from || to && date.slice(0,10) > to, field);
    }
    const textCheck = (field, include, exclude, mode = 'any') => {
      if (!include && !exclude) return;
      if (unknown(v[field],field)) return;
      const text = normalize(v[field]), items = words(include);
      add(include && (mode === 'phrase' ? !text.includes(normalize(include)) : mode === 'all' ? !items.every(w => text.includes(w)) : !items.some(w => text.includes(w))), field);
      add(words(exclude).some(w => text.includes(w)), field);
    };
    textCheck('title',s.titleInclude,s.titleExclude,s.titleMode);
    textCheck('description',s.descriptionInclude,s.descriptionExclude);
    textCheck('channel',s.channelInclude,s.channelExclude);
    textCheck('channelDescription',s.channelDescriptionInclude,s.channelDescriptionExclude);
    if (s.strictSearch && query) add(!normalize(query).replace(/["“”]/g,'').split(/\s+/).filter(w=>w&&!/^(after|before):/.test(w)).every(w => normalize(v.title).includes(w)), 'strictSearch');
    for (const [key,field] of [['requireChapters','chapters'],['requireCaptions','captionLanguages'],['requireEmail','emails']]) {
      if (s[key] && !unknown(v[field], field)) add(v[field].length === 0,field);
    }
    for (const [key,field] of [['languages','captionLanguages'],['socialInclude','socials']]) {
      if (s[key] && !unknown(v[field],field)) add(!words(s[key]).some(w => v[field].some(val => normalize(val).startsWith(w))),field);
    }
    if ((s.countries || s.countriesExclude) && !unknown(v.country,'country')) {
      add(s.countries && !words(s.countries).includes(normalize(v.country)), 'country');
      add(words(s.countriesExclude).includes(normalize(v.country)), 'country');
    }
    return [...new Set(result)];
  }
  const reason = (v,s,q,now) => reasons(v,s,q,now)[0] || '';
  function compare(a,b,sort) {
    if (sort === 'original') return 0;
    const [field,direction] = sort.split('-');
    if (a[field] == null && b[field] == null) return 0;
    if (a[field] == null) return 1;
    if (b[field] == null) return -1;
    const diff = field === 'title' ? String(a.title).localeCompare(String(b.title)) : a[field]-b[field];
    return direction === 'desc' ? -diff : diff;
  }
  function csv(videos) {
    const fields = ['id','title','channel','channelId','views','seconds','published','ageDays','vpd','likes','likeRate','comments','commentRate','subs','performance','country','url'];
    const cell = value => '"'+String(value ?? '').replace(/^(\s*[=+\-@]|[\t\r\n])/, "'$&").replace(/"/g,'""')+'"';
    return '\uFEFF'+[fields,...videos.map(v=>fields.map(f=>f==='url' ? `https://www.youtube.com/watch?v=${v.id}` : v[f]))].map(row=>row.map(cell).join(',')).join('\r\n');
  }
  function analytics(videos) {
    const valid = videos.filter(v=>v.views != null), total = valid.reduce((s,v)=>s+v.views,0);
    const days = new Map();
    for (const v of videos) if (v.published) { const d = v.published.slice(0,10); days.set(d,(days.get(d)||0)+1); }
    return { count: videos.length, knownViews: valid.length, totalViews: total,
      averageViews: valid.length ? total/valid.length : null,
      medianViews: valid.length ? [...valid].sort((a,b)=>a.views-b.views).slice(Math.floor((valid.length-1)/2),Math.floor(valid.length/2)+1).reduce((s,v)=>s+v.views,0)/(valid.length%2?1:2) : null,
      days: [...days].sort((a,b)=>a[0].localeCompare(b[0])) };
  }
  root.YTFreeFilter = { defaults, sanitize, normalize, words, number, views, duration, age, chapters, metrics, reasons, reason, compare, csv, analytics, ranges };
  if (typeof module !== 'undefined') module.exports = root.YTFreeFilter;
})(globalThis);
