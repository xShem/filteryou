(() => {
  'use strict';
  const core = globalThis.YTFreeFilter;
  const selector = 'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer, yt-lockup-view-model, ytd-reel-shelf-renderer, ytd-rich-shelf-renderer';
  let settings = { ...core.defaults };
  let timer;
  const text = (node, sel) => node.querySelector(sel)?.textContent?.trim() || '';
  function extract(node) {
    const title = node.querySelector('#video-title, .yt-lockup-metadata-view-model__title');
    const metadata = Array.from(node.querySelectorAll('#metadata-line span, .yt-content-metadata-view-model__metadata-text')).map(n => n.textContent.trim());
    const duration = text(node, 'ytd-thumbnail-overlay-time-status-renderer #text, .yt-badge-shape__text');
    const shorts = node.matches('ytd-reel-item-renderer, ytd-reel-shelf-renderer') || Boolean(node.querySelector('a[href^="/shorts/"], a[href*="youtube.com/shorts/"]'));
    const live = Boolean(node.querySelector('[overlay-style="LIVE"], .badge-style-type-live-now')) || /^(live|в эфире|прямой эфир)$/i.test(duration);
    return { title: title?.textContent?.trim() || '',
      channel: text(node, '#channel-name, .yt-content-metadata-view-model__metadata-row:first-child'),
      views: metadata.map(core.views).find(v => v !== null) ?? null,
      ageDays: metadata.map(core.age).find(v => v !== null) ?? null,
      seconds: core.duration(duration), shorts, live };
  }
  function apply() {
    timer = undefined;
    for (const node of document.querySelectorAll(selector)) {
      // Filter a card once, leaving mixed shelves and playlist cards intact.
      const parentCard = node.parentElement?.closest(selector);
      if (parentCard && !parentCard.matches('ytd-reel-shelf-renderer, ytd-rich-shelf-renderer')) continue;
      const shelf = node.matches('ytd-reel-shelf-renderer, ytd-rich-shelf-renderer');
      let hidden;
      if (shelf) hidden = settings.enabled && settings.hideShorts &&
        (node.matches('ytd-reel-shelf-renderer') || Boolean(node.querySelector('a[href^="/shorts/"]')));
      else {
        const video = extract(node);
        const link = node.querySelector('a[href*="/watch?"], a[href^="/shorts/"]');
        hidden = Boolean(link && core.reason(video, settings));
      }
      if (hidden) node.setAttribute('data-ytff-hidden', 'true');
      else node.removeAttribute('data-ytff-hidden');
    }
  }
  function schedule() { if (!timer) timer = setTimeout(apply, 150); }
  chrome.storage.local.get('filters', result => {
    if (chrome.runtime.lastError) return;
    settings = { ...core.defaults, ...result.filters };
    schedule();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.filters) {
      settings = { ...core.defaults, ...changes.filters.newValue };
      schedule();
    }
  });
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true, subtree: true, characterData: true, attributes: true,
    attributeFilter: ['href', 'aria-label', 'overlay-style']
  });
  document.addEventListener('yt-navigate-finish', schedule);
})();
