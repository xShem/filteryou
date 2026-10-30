/* Original local filtering logic. No network requests or external libraries. */
(function (root) {
  'use strict';
  const defaults = Object.freeze({ enabled: true, hideShorts: false, hideLive: false,
    minViews: '', maxViews: '', minMinutes: '', maxMinutes: '', maxAgeDays: '',
    titleInclude: '', titleExclude: '', channelExclude: '', unknown: 'keep' });
  const normalize = text => String(text || '').toLocaleLowerCase().replace(/\u00a0|\u202f/g, ' ').trim();
  function views(text) {
    const s = normalize(text);
    if (!/(?:views?|просмотр)/i.test(s)) return null;
    const match = s.match(/(\d[\d\s.,]*)\s*(тыс\.?|млн\.?|млрд\.?|[kmb])?/i);
    if (!match) return null;
    const unit = match[2] || '';
    let number = match[1].trim().replace(/\s/g, '');
    if (unit) number = number.replace(',', '.');
    else number = number.replace(/[.,]/g, '');
    const multiplier = /^(k|тыс)/.test(unit) ? 1e3 : /^(m|млн)/.test(unit) ? 1e6 : /^(b|млрд)/.test(unit) ? 1e9 : 1;
    const result = Number(number) * multiplier;
    return Number.isFinite(result) ? result : null;
  }
  function duration(text) {
    const s = String(text || '').trim();
    if (!/^\d{1,3}:\d{2}(?::\d{2})?$/.test(s)) return null;
    const parts = s.split(':').map(Number);
    if (parts.slice(1).some(n => n > 59)) return null;
    return parts.reduce((total, n) => total * 60 + n, 0);
  }
  function age(text) {
    const s = normalize(text);
    const match = s.match(/(\d+)\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?|секунд[а-я]*|минут[а-я]*|час[а-я]*|дн[а-я]*|день|недел[а-я]*|месяц[а-я]*|год[а-я]*|лет)(?=\s|$)/);
    if (!match || !/(ago|назад)/.test(s)) return null;
    const unit = match[2];
    const factor = /^(second|секунд)/.test(unit) ? 1/86400 : /^(minute|минут)/.test(unit) ? 1/1440 : /^(hour|час)/.test(unit) ? 1/24 : /^(week|недел)/.test(unit) ? 7 : /^(month|месяц)/.test(unit) ? 30 : /^(year|год|лет)/.test(unit) ? 365 : 1;
    return Number(match[1]) * factor;
  }
  const words = value => normalize(value).split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  function reason(video, settings) {
    const s = { ...defaults, ...settings };
    if (!s.enabled) return '';
    if (s.hideShorts && video.shorts) return 'shorts';
    if (s.hideLive && video.live) return 'live';
    for (const [field, min, max] of [['views', s.minViews, s.maxViews],
      ['seconds', s.minMinutes === '' ? '' : Number(s.minMinutes)*60, s.maxMinutes === '' ? '' : Number(s.maxMinutes)*60],
      ['ageDays', '', s.maxAgeDays]]) {
      if (min === '' && max === '') continue;
      const value = video[field];
      if (value == null) { if (s.unknown === 'hide') return 'unknown'; continue; }
      if (min !== '' && value < Number(min)) return field;
      if (max !== '' && value > Number(max)) return field;
    }
    const title = normalize(video.title);
    const include = words(s.titleInclude);
    if (include.length && !include.some(word => title.includes(word))) return 'title';
    if (words(s.titleExclude).some(word => title.includes(word))) return 'title';
    if (words(s.channelExclude).some(word => normalize(video.channel).includes(word))) return 'channel';
    return '';
  }
  root.YTFreeFilter = { defaults, views, duration, age, reason };
  if (typeof module !== 'undefined') module.exports = root.YTFreeFilter;
})(globalThis);
