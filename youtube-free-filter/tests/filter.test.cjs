const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../filter-core.js');

test('parses Russian and English views without treating dates as views', () => {
  for (const [text, count] of [['1.2M views', 1200000], ['12K views', 12000], ['1,5 млн просмотров', 1500000], ['123 456 просмотров', 123456], ['1,234 views', 1234], ['2 млрд просмотров', 2e9]]) assert.equal(core.views(text), count);
  assert.equal(core.views('2 years ago'), null);
});
test('parses duration and relative dates; rejects unknown metadata', () => {
  assert.equal(core.duration('1:02:03'), 3723);
  assert.equal(core.duration('12:34'), 754);
  assert.equal(core.duration('1:99'), null);
  assert.equal(core.duration('LIVE'), null);
  assert.equal(core.age('Streamed 2 weeks ago'), 14);
  assert.equal(core.age('3 месяца назад'), 90);
  assert.equal(core.age('1 день назад'), 1);
  assert.equal(core.age('5 лет назад'), 1825);
  assert.ok(Math.abs(core.age('20 часов назад') - 20/24) < 1e-12);
  assert.equal(core.age('Premieres tomorrow'), null);
});
const video = { title: 'Космос: новая наука', channel: 'Научный канал', views: 5000, seconds: 600, ageDays: 5 };
test('numeric boundaries, combined filters and unknown policy', () => {
  assert.equal(core.reason(video, { minViews: '5000', maxMinutes: '10', maxAgeDays: '5' }), '');
  assert.equal(core.reason(video, { minViews: '5001' }), 'views');
  assert.equal(core.reason(video, { minMinutes: '11' }), 'seconds');
  assert.equal(core.reason(video, { maxAgeDays: '4' }), 'ageDays');
  assert.equal(core.reason({ ...video, views: null }, { minViews: '5' }), '');
  assert.equal(core.reason({ ...video, views: null }, { minViews: '5', unknown: 'hide' }), 'unknown');
  assert.equal(core.reason({ ...video, views: null }, { unknown: 'hide' }), '');
});
test('text rules, Shorts, live and master switch', () => {
  assert.equal(core.reason(video, { titleInclude: 'КОСМОС, музыка' }), '');
  assert.equal(core.reason(video, { titleInclude: 'музыка' }), 'title');
  assert.equal(core.reason(video, { titleExclude: 'новая' }), 'title');
  assert.equal(core.reason(video, { channelExclude: 'научный' }), 'channel');
  assert.equal(core.reason({ ...video, shorts: true }, { hideShorts: true }), 'shorts');
  assert.equal(core.reason({ ...video, live: true }, { hideLive: true }), 'live');
  assert.equal(core.reason(video, { enabled: false, minViews: '999999' }), '');
});
test('content script filters initial and appended cards, then restores on storage change', () => {
  const makeCard = () => {
    const attrs = new Map();
    return { parentElement: { closest: () => null }, matches: () => false,
      querySelector: selector => selector.startsWith('#video-title') ? { textContent: 'Demo' } : selector.includes('/watch?') ? {} : null,
      querySelectorAll: () => [{ textContent: '100 views' }],
      setAttribute: (k, v) => attrs.set(k, v), removeAttribute: k => attrs.delete(k), attrs };
  };
  const cards = [makeCard()];
  let onChange, onMutation, pending;
  const context = { YTFreeFilter: core, document: { documentElement: {}, querySelectorAll: () => cards, addEventListener() {} },
    chrome: { runtime: {}, storage: { local: { get: (key, cb) => cb({ filters: { minViews: '200' } }) }, onChanged: { addListener: cb => { onChange = cb; } } } },
    setTimeout: cb => { pending = cb; return 1; }, MutationObserver: class { constructor(cb) { onMutation = cb; } observe() {} } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../content.js'), 'utf8'), context);
  pending();
  assert.equal(cards[0].attrs.get('data-ytff-hidden'), 'true');
  cards.push(makeCard()); onMutation(); pending();
  assert.equal(cards[1].attrs.get('data-ytff-hidden'), 'true');
  onChange({ filters: { newValue: { enabled: false } } }, 'local'); pending();
  assert.ok(cards.every(card => !card.attrs.has('data-ytff-hidden')));
});
test('manifest references existing local files and uses only storage permission', () => {
  const dir = path.join(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json')));
  assert.deepEqual(manifest.permissions, ['storage']);
  for (const file of [manifest.action.default_popup, ...manifest.content_scripts.flatMap(s => [...s.js, ...s.css])]) assert.ok(fs.existsSync(path.join(dir, file)), file);
});
