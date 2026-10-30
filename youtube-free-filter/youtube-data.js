/* Parse public YouTube JSON embedded in HTML; never execute page code. */
(function (root) {
  'use strict';
  const core = root.YTFreeFilter;
  function jsonAfter(html, marker) {
    const start = html.indexOf(marker);
    if (start < 0) return null;
    const open = html.indexOf('{', start + marker.length);
    if (open < 0 || open-start > 200) return null;
    let depth = 0, quoted = false, escaped = false;
    for (let i = open; i < html.length; i++) {
      const c = html[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (c === '\\') escaped = true;
        else if (c === '"') quoted = false;
      } else if (c === '"') quoted = true;
      else if (c === '{') depth++;
      else if (c === '}' && --depth === 0) {
        try { return JSON.parse(html.slice(open, i+1)); } catch { return null; }
      }
    }
    return null;
  }
  function embedded(html, name) {
    for (const marker of [`var ${name} =`, `var ${name}=`, `window["${name}"] =`, `window["${name}"]=`, `${name} =`, `${name}=`]) {
      const value = jsonAfter(html, marker);
      if (value) return value;
    }
    return null;
  }
  function* walk(value) {
    const queue = [value]; let count = 0;
    while (queue.length && count++ < 150000) {
      const node = queue.pop();
      if (!node || typeof node !== 'object') continue;
      yield node;
      for (const child of Object.values(node)) if (child && typeof child === 'object') queue.push(child);
    }
  }
  function text(value) {
    if (typeof value === 'string') return value;
    return value?.simpleText || value?.content || value?.runs?.map(r=>r.text || '').join('') || '';
  }
  function find(data, key) { for (const n of walk(data)) if (n[key]) return n[key]; return null; }
  function count(value) { const n = core.number(text(value)); return n == null ? null : n; }
  function contacts(description) {
    const emails = [...new Set(String(description).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])];
    const sites = { instagram: /instagram\.com/i, telegram: /t\.me\//i, twitter: /(?:twitter|x)\.com/i, tiktok: /tiktok\.com/i,
      discord: /discord\.(gg|com)/i, facebook: /facebook\.com/i, twitch: /twitch\.tv/i, patreon: /patreon\.com/i,
      linkedin: /linkedin\.com/i, github: /github\.com/i, website: /https?:\/\//i };
    return { emails, socials: Object.entries(sites).filter(([,re])=>re.test(description)).map(([name])=>name) };
  }
  function parseVideo(html, id) {
    const player = embedded(html,'ytInitialPlayerResponse');
    const initial = embedded(html,'ytInitialData');
    const d = player?.videoDetails;
    if (!d || d.videoId !== id) throw new Error('YouTube не вернул публичные данные видео (согласие, ограничение или новая разметка).');
    const mf = player.microformat?.playerMicroformatRenderer || {};
    const description = d.shortDescription || '';
    const captionTracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    let likes = null, comments = null;
    const primary = find(initial,'videoPrimaryInfoRenderer') || find(initial,'segmentedLikeDislikeButtonViewModel');
    for (const node of walk(primary)) {
      const label = node.accessibilityData?.label || node.accessibilityText || '';
      if (/^[\d.,\s]+ likes?$/i.test(label) || /^like this video along with [\d.,\s]+ other people/i.test(label)) likes = core.number(label);
      const toggle = node.likeButtonViewModel?.likeButtonViewModel?.toggleButtonViewModel?.defaultButtonViewModel?.buttonViewModel;
      if (toggle?.title) likes = core.number(toggle.title);
    }
    const commentHeader = find(initial,'commentsEntryPointHeaderRenderer');
    if (commentHeader?.commentCount) comments = count(commentHeader.commentCount);
    const commentVM = find(initial,'commentsEntryPointHeaderViewModel');
    if (commentVM?.commentCount) comments = count(commentVM.commentCount);
    const owner = find(initial,'videoOwnerRenderer');
    const subscriberText = owner?.subscriberCountText;
    const verified = owner ? Boolean((owner.badges || []).some(b=>/VERIFIED/.test(b.metadataBadgeRenderer?.style || ''))) : null;
    const chapterList = core.chapters(description);
    return {
      id, title: d.title || '', channel: d.author || '', channelId: d.channelId || '',
      views: /^\d+$/.test(d.viewCount || '') ? Number(d.viewCount) : null,
      seconds: /^\d+$/.test(d.lengthSeconds || '') ? Number(d.lengthSeconds) : null,
      published: mf.publishDate || mf.uploadDate || null, description,
      live: Boolean(d.isLive || player.playabilityStatus?.liveStreamability), upcoming: Boolean(d.isUpcoming),
      likes, comments, subs: subscriberText ? count(subscriberText) : null, verified,
      captionLanguages: [...new Set(captionTracks.map(t=>t.languageCode).filter(Boolean))],
      captions: captionTracks.map(t=>({ language: t.languageCode, name: text(t.name), automatic: t.kind === 'asr' })),
      chapters: chapterList, keywords: Array.isArray(d.keywords) ? d.keywords : [],
      category: mf.category || null, ...contacts(description), fetchedAt: Date.now(), source: 'youtube-public'
    };
  }
  function parseChannel(html, id) {
    const data = embedded(html,'ytInitialData');
    const meta = find(data,'channelMetadataRenderer');
    if (!meta) throw new Error('Публичная статистика канала недоступна.');
    if (meta.externalId && meta.externalId !== id) throw new Error('YouTube вернул данные другого канала.');
    const about = find(data,'aboutChannelViewModel');
    const old = find(data,'channelAboutFullMetadataRenderer');
    const header = find(data,'c4TabbedHeaderRenderer');
    const description = about?.description || old?.description && text(old.description) || meta.description || '';
    let subs = count(header?.subscriberCountText), channelVideos = count(header?.videosCountText);
    // New channel headers use contentMetadataViewModel and metadata text rows.
    const pageHeader = find(data,'pageHeaderRenderer');
    for (const node of walk(pageHeader)) {
      const value = text(node);
      if (/subscribers/i.test(value)) subs = core.number(value);
      if (/^[\d.,\sKMB]+ videos$/i.test(value)) channelVideos = core.number(value);
    }
    const joinedText = text(about?.joinedDateText || old?.joinedDateText).replace(/^Joined\s+/i,'');
    const joined = joinedText && Number.isFinite(Date.parse(joinedText)) ? new Date(joinedText).toISOString().slice(0,10) : null;
    const links = about?.links?.map(l=>text(l.channelExternalLinkViewModel?.link?.content)).join('\n') || '';
    return { channelId: id, channelDescription: description, country: text(about?.country || old?.country) || null,
      channelJoined: joined, channelViews: count(about?.viewCountText || old?.viewCountText),
      channelVideos: count(about?.videoCountText) ?? channelVideos, subs: count(about?.subscriberCountText) ?? subs,
      channelContacts: contacts(description+'\n'+links), source: 'youtube-public', fetchedAt: Date.now() };
  }
  root.YTFreeData = { jsonAfter, embedded, text, walk, contacts, parseVideo, parseChannel };
  if (typeof module !== 'undefined') module.exports = root.YTFreeData;
})(globalThis);
