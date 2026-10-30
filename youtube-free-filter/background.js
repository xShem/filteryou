'use strict';
importScripts('filter-core.js', 'youtube-data.js');
const jobs = new Map();
let running = 0;
const waiting = [];
const TTL = 24 * 60 * 60 * 1000;
let cacheWrites = 0;
function slot(task) {
  return new Promise((resolve,reject) => { waiting.push({task,resolve,reject}); pump(); });
}
function pump() {
  while (running < 2 && waiting.length) {
    const job = waiting.shift(); running++;
    Promise.resolve().then(job.task).then(job.resolve,job.reject).finally(()=>{running--;pump();});
  }
}
async function page(path) {
  const response = await fetch('https://www.youtube.com'+path, {
    credentials: 'omit', signal: AbortSignal.timeout(15000), redirect: 'follow'
  });
  if (!response.ok) throw new Error('YouTube HTTP '+response.status);
  const target = new URL(response.url);
  if (target.hostname !== 'www.youtube.com') throw new Error('YouTube требует согласие или перенаправляет запрос. Откройте видео вручную.');
  return response.text();
}
async function load(kind,id) {
  const key = 'cache:'+kind+':'+id;
  const stored = (await chrome.storage.local.get(key))[key];
  if (stored && Date.now()-stored.time < TTL) return stored.value;
  if (jobs.has(key)) return jobs.get(key);
  const job = slot(async()=>{
    const html = await page(kind === 'video' ? '/watch?v='+id+'&hl=en' : '/channel/'+id+'/about?hl=en');
    const value = kind === 'video' ? YTFreeData.parseVideo(html,id) : YTFreeData.parseChannel(html,id);
    await chrome.storage.local.set({[key]:{time:Date.now(),value}});
    if (++cacheWrites % 20 === 0) await prune();
    return value;
  }).finally(()=>jobs.delete(key));
  jobs.set(key,job);
  return job;
}
async function details(id, channel) {
  const video = await load('video',id);
  if (channel && /^UC[\w-]{22}$/.test(video.channelId)) {
    try {
      const ch = await load('channel',video.channelId);
      const merged = {...video};
      for (const [key,value] of Object.entries(ch)) if (value != null && key !== 'fetchedAt') merged[key] = value;
      merged.emails = [...new Set([...video.emails,...ch.channelContacts.emails])];
      merged.socials = [...new Set([...video.socials,...ch.channelContacts.socials])];
      return merged;
    } catch(error) { return {...video,channelError:error.message}; }
  }
  return video;
}
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if (sender.id !== chrome.runtime.id) return;
  if (message?.type !== 'ytff:details' || !/^[\w-]{11}$/.test(message.id || '')) return;
  details(message.id,Boolean(message.channel)).then(data=>sendResponse({ok:true,data}),error=>sendResponse({ok:false,error:error.message}));
  return true;
});
// Bound retained public metadata; user settings and saved videos are never evicted.
async function prune() {
  const all = await chrome.storage.local.get(null);
  const cache = Object.keys(all).filter(k=>k.startsWith('cache:')).sort((a,b)=>all[b].time-all[a].time);
  const expired = cache.filter((k,i)=>i>=400 || Date.now()-all[k].time>TTL);
  if (expired.length) await chrome.storage.local.remove(expired);
}
chrome.runtime.onStartup.addListener(()=>prune().catch(()=>{}));
chrome.runtime.onInstalled.addListener(()=>prune().catch(()=>{}));
