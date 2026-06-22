(function () {
  'use strict';

  const ICONS = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2"/></svg>',
    cut: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>',
    letter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="m4 7 8 6 8-6"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>'
  };

  const pages = [
    { href: 'calcul.html', key: 'calcul', label: 'Facilité de paiement', icon: 'calc' },
    { href: 'order_coupure.html', key: 'order', label: 'Ordre de coupure', icon: 'cut' },
    { href: 'mise_en_demeure.html', key: 'notice', label: 'Mise en demeure', icon: 'letter' }
  ];

  function activeKey() {
    const file = location.pathname.split('/').pop().toLowerCase();
    if (file.includes('order')) return 'order';
    if (file.includes('mise')) return 'notice';
    return 'calcul';
  }

  function pageTitle(key) { return pages.find(page => page.key === key)?.label || 'Documents'; }

  function showToast(text) {
    let toast = document.querySelector('.app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(window.__appToastTimer);
    window.__appToastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  async function init() {
    const session = window.AppDB.getSession();
    if (!session) {
      location.replace('index.html');
      return;
    }

    const db = await window.AppDB.load();
    const key = activeKey();
    document.body.classList.add('app-body');
    const main = document.querySelector('main');
    if (main) main.classList.add('app-main');

    const overlay = document.createElement('div');
    overlay.className = 'app-overlay';
    overlay.id = 'appOverlay';

    const aside = document.createElement('aside');
    aside.className = 'app-sidebar flex flex-col p-4';
    aside.id = 'appSidebar';
    aside.innerHTML = `
      <div class="rounded-[24px] border border-white/90 bg-white/75 p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-400 font-black text-white shadow-lg shadow-blue-200">SR</div>
          <div class="min-w-0"><p class="truncate text-base font-black text-slate-900">${db.app.name}</p><p class="truncate text-xs font-semibold text-slate-500">Grands Comptes</p></div>
        </div>
      </div>
      <nav class="mt-6 space-y-2">
        ${pages.map(page => `<a class="app-nav-link ${page.key === key ? 'active' : ''}" href="${page.href}"><span class="app-icon">${ICONS[page.icon]}</span><span>${page.label}</span></a>`).join('')}
      </nav>
      <div class="mt-auto rounded-[22px] border border-white/90 bg-white/70 p-4">
        <p class="text-xs font-black uppercase tracking-[.14em] text-slate-400">Session</p>
        <p class="mt-2 truncate font-black text-slate-900">${session.name}</p>
        <p class="text-xs font-semibold text-slate-500">${session.role} · Matricule ${session.matricule}</p>
        <button id="sidebarLogout" class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white"><span class="app-icon">${ICONS.logout}</span> Déconnexion</button>
      </div>`;

    const header = document.createElement('header');
    header.className = 'app-topbar px-3 sm:px-5';
    header.innerHTML = `
      <div class="flex h-full items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <button id="sidebarToggle" class="grid h-11 w-11 place-items-center rounded-2xl border border-white/90 bg-white/75 text-slate-700 shadow-sm lg:hidden"><span class="app-icon">${ICONS.menu}</span></button>
          <div class="min-w-0"><p class="truncate text-xs font-black uppercase tracking-[.14em] text-blue-600">${db.app.department}</p><h1 class="truncate text-lg font-black text-slate-900 sm:text-xl">${pageTitle(key)}</h1></div>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
          <label class="hidden text-xs font-black uppercase tracking-wide text-slate-400 md:block" for="globalClientSelect">Client</label>
          <select id="globalClientSelect" class="app-client-select rounded-2xl border border-white/90 bg-white/80 px-3 py-2.5 text-sm font-black text-slate-700 shadow-sm outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">Choisir un client</option>
            ${db.clients.map(client => `<option value="${client.id}">${client.clientNumber} — ${client.name}</option>`).join('')}
          </select>
          <div class="hidden items-center gap-2 rounded-2xl border border-white/90 bg-white/75 px-3 py-2 shadow-sm sm:flex"><span class="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600"><span class="app-icon">${ICONS.user}</span></span><div class="max-w-[150px]"><p class="truncate text-sm font-black text-slate-800">${session.name}</p><p class="truncate text-[11px] font-semibold text-slate-500">${session.role}</p></div></div>
        </div>
      </div>`;

    document.body.prepend(header);
    document.body.prepend(aside);
    document.body.prepend(overlay);

    const closeSidebar = () => { aside.classList.remove('is-open'); overlay.classList.remove('is-open'); };
    document.getElementById('sidebarToggle').addEventListener('click', () => { aside.classList.toggle('is-open'); overlay.classList.toggle('is-open'); });
    overlay.addEventListener('click', closeSidebar);
    document.getElementById('sidebarLogout').addEventListener('click', () => { window.AppDB.logout(); location.replace('index.html'); });

    const select = document.getElementById('globalClientSelect');
    select.addEventListener('change', () => {
      const client = db.clients.find(item => item.id === select.value);
      if (!client) return;
      localStorage.setItem('srm_last_client_id', client.id);
      window.dispatchEvent(new CustomEvent('app:client-selected', { detail: client }));
      showToast(`Données de ${client.name} chargées`);
    });

    window.AppLayout = { showToast, db, session };
    window.dispatchEvent(new CustomEvent('app:ready', { detail: { db, session, key } }));

    const initialId = localStorage.getItem('srm_last_client_id') || db.clients[0]?.id;
    if (initialId && db.clients.some(item => item.id === initialId)) {
      select.value = initialId;
      select.dispatchEvent(new Event('change'));
    }
  }

  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
