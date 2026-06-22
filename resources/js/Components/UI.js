(function () {
  'use strict';

  const icons = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2"/></svg>',
    cut: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>',
    letter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="m4 7 8 6 8-6"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v6h5M12 7v6l3 2"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m12 12 8-8M15 7l2 2M18 4l2 2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>',
    database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>',
    contract: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v6h5M9 13h6M9 17h6"/></svg>',
    client: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    invoice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6"/><path d="M16 13h2"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>'
  };

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  function icon(name, className = 'ui-icon') {
    return `<span class="${className}">${icons[name] || icons.info}</span>`;
  }

  function toast(message, type = 'dark') {
    let host = document.getElementById('uiToastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'uiToastHost';
      host.className = 'ui-toast-host';
      document.body.appendChild(host);
    }
    const item = document.createElement('div');
    item.className = `ui-toast ui-toast-${type}`;
    item.innerHTML = `${icon(type === 'success' ? 'check' : type === 'error' ? 'warning' : 'info')}<span>${esc(message)}</span>`;
    host.appendChild(item);
    requestAnimationFrame(() => item.classList.add('show'));
    setTimeout(() => {
      item.classList.remove('show');
      setTimeout(() => item.remove(), 250);
    }, 3000);
  }

  function modal(options = {}) {
    const id = options.id || `modal-${Date.now()}`;
    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = 'ui-modal-backdrop';
    wrapper.innerHTML = `
      <section class="ui-modal ${options.size === 'xl' ? 'ui-modal-xl' : options.size === 'lg' ? 'ui-modal-lg' : ''}" role="dialog" aria-modal="true">
        <header class="ui-modal-header">
          <div><p class="ui-kicker">${esc(options.kicker || 'SRM Documents')}</p><h2 class="ui-modal-title">${esc(options.title || '')}</h2></div>
          <button type="button" class="ui-icon-button" data-modal-close aria-label="Fermer">${icon('close')}</button>
        </header>
        <div class="ui-modal-body">${options.body || ''}</div>
        ${options.footer === false ? '' : `<footer class="ui-modal-footer">${options.footer || '<button type="button" class="ui-btn ui-btn-secondary" data-modal-close>Fermer</button>'}</footer>`}
      </section>`;
    document.body.appendChild(wrapper);
    const close = () => {
      wrapper.classList.remove('open');
      setTimeout(() => wrapper.remove(), 180);
    };
    wrapper.addEventListener('click', event => {
      if (event.target === wrapper || event.target.closest('[data-modal-close]')) close();
    });
    requestAnimationFrame(() => wrapper.classList.add('open'));
    return { element: wrapper, close };
  }

  function confirmDialog({ title = 'Confirmation', message, confirmText = 'Confirmer', danger = false } = {}) {
    return new Promise(resolve => {
      const instance = modal({
        title,
        body: `<div class="ui-confirm"><div class="ui-confirm-icon ${danger ? 'danger' : ''}">${icon(danger ? 'warning' : 'info')}</div><p>${esc(message || '')}</p></div>`,
        footer: `<button type="button" class="ui-btn ui-btn-secondary" data-cancel>Annuler</button><button type="button" class="ui-btn ${danger ? 'ui-btn-danger' : 'ui-btn-primary'}" data-confirm>${esc(confirmText)}</button>`
      });
      instance.element.querySelector('[data-cancel]').addEventListener('click', () => { instance.close(); resolve(false); });
      instance.element.querySelector('[data-confirm]').addEventListener('click', () => { instance.close(); resolve(true); });
    });
  }

  function badge(text, tone = 'slate') {
    return `<span class="ui-badge ui-badge-${tone}">${esc(text)}</span>`;
  }

  function statCard({ label, value, icon: iconName = 'dashboard', note = '', tone = 'blue' }) {
    return `<article class="ui-stat-card"><div class="ui-stat-icon ui-stat-${tone}">${icon(iconName)}</div><div class="min-w-0"><p class="ui-stat-label">${esc(label)}</p><p class="ui-stat-value">${esc(value)}</p>${note ? `<p class="ui-stat-note">${esc(note)}</p>` : ''}</div></article>`;
  }

  function emptyState(title, text, iconName = 'file') {
    return `<div class="ui-empty"><div class="ui-empty-icon">${icon(iconName)}</div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
  }

  function formatDate(value, withTime = true) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', withTime
      ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }

  window.UI = { icons, icon, esc, toast, modal, confirm: confirmDialog, badge, statCard, emptyState, formatDate };
})();
