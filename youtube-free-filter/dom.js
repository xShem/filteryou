(function(root){
  'use strict';
  const core = root.YTFreeFilter;
  const selector = 'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer, yt-lockup-view-model';
  const text = (node,sel) => node.querySelector(sel)?.textContent?.trim() || '';
  function extract(node) {
    const links = Array.from(node.querySelectorAll('a[href]'));
    let id = '', url = '', shorts = false;
    for (const link of links) {
      try {
        const u = new URL(link.getAttribute('href'),'https://www.youtube.com');
        if (!['www.youtube.com','youtube.com'].includes(u.hostname)) continue;
        const candidate = u.pathname === '/watch' ? u.searchParams.get('v') : u.pathname.startsWith('/shorts/') ? u.pathname.split('/')[2] : '';
        if (/^[\w-]{11}$/.test(candidate || '') && !u.searchParams.has('list')) { id = candidate; url = u.href; shorts = u.pathname.startsWith('/shorts/'); break; }
      } catch { /* irrelevant link */ }
    }
    if (!id) return null;
    const metadata = Array.from(node.querySelectorAll('#metadata-line span, .yt-content-metadata-view-model__metadata-text')).map(n=>n.textContent.trim());
    const durationLabels = Array.from(node.querySelectorAll('ytd-thumbnail-overlay-time-status-renderer #text, .yt-badge-shape__text')).map(n=>n.textContent.trim());
    const channelLink = links.find(l=>/^(\/channel\/|\/@)/.test(l.getAttribute('href') || ''));
    const channelHref = channelLink?.getAttribute('href') || '';
    const live = Boolean(node.querySelector('[overlay-style="LIVE"], .badge-style-type-live-now')) || durationLabels.some(t=>/^(live|в эфире|прямой эфир)$/i.test(t));
    const badgeLabels = Array.from(node.querySelectorAll('[aria-label], [title]')).map(el=>el.getAttribute('aria-label') || el.getAttribute('title') || '').join(' ');
    return { id,url, title:text(node,'#video-title, .yt-lockup-metadata-view-model__title, .shortsLockupViewModelHostMetadataTitle, h3'),
      channel:text(node,'#channel-name, .yt-content-metadata-view-model__metadata-row:first-child') || channelLink?.textContent?.trim() || '',
      channelId: channelHref.match(/\/channel\/(UC[\w-]{22})/)?.[1] || '',
      views:metadata.map(core.views).find(v=>v!==null) ?? null,
      ageDays:metadata.map(core.age).find(v=>v!==null) ?? null,
      seconds:durationLabels.map(core.duration).find(v=>v!==null) ?? null,
      description:text(node,'.metadata-snippet-text, #description-text') || null,
      shorts,live,watched:Boolean(node.querySelector('ytd-thumbnail-overlay-resume-playback-renderer, .yt-thumbnail-overlay-progress-bar-view-model')),
      upcoming:Boolean(node.querySelector('[overlay-style="UPCOMING"]')) || /premiere|премьера|запланировано/i.test(metadata.join(' ')),
      verified:/verified|подтвержден/i.test(badgeLabels) ? true : null };
  }
  root.YTFreeDOM = {selector,extract};
  if (typeof module !== 'undefined') module.exports = root.YTFreeDOM;
})(globalThis);
