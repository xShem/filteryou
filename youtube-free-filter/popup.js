(() => {
  'use strict';
  const { defaults } = globalThis.YTFreeFilter;
  const form = document.getElementById('filters');
  const status = document.getElementById('status');
  function fill(settings) {
    for (const [key, value] of Object.entries({ ...defaults, ...settings })) {
      const input = form.elements.namedItem(key);
      if (!input) continue;
      if (input.type === 'checkbox') input.checked = Boolean(value);
      else input.value = value;
    }
  }
  chrome.storage.local.get('filters', result => {
    if (chrome.runtime.lastError) { status.textContent = 'Не удалось загрузить настройки.'; return; }
    fill(result.filters);
  });
  function save(filters) {
    chrome.storage.local.set({ filters }, () => {
      status.textContent = chrome.runtime.lastError ? 'Не удалось сохранить. Повторите попытку.' : 'Сохранено. Применено к открытым вкладкам YouTube.';
    });
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const filters = {};
    for (const key of Object.keys(defaults)) {
      const input = form.elements.namedItem(key);
      filters[key] = input.type === 'checkbox' ? input.checked : input.value.trim();
    }
    for (const [min, max] of [['minViews', 'maxViews'], ['minMinutes', 'maxMinutes']]) {
      if (filters[min] !== '' && filters[max] !== '' && Number(filters[min]) > Number(filters[max])) {
        status.textContent = 'Минимум должен быть не больше максимума.'; return;
      }
    }
    save(filters);
  });
  document.getElementById('reset').addEventListener('click', () => { fill(defaults); save({ ...defaults }); });
})();
