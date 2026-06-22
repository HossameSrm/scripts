(function () {
  'use strict';

  const pages = [
    { href: 'dashboard.html', key: 'dashboard', module: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    { href: 'calcul.html', key: 'calcul', module: 'calcul', label: 'Facilité de paiement', icon: 'calc' },
    { href: 'order_coupure.html', key: 'order', module: 'order', label: 'Ordre de coupure', icon: 'cut' },
    { href: 'mise_en_demeure.html', key: 'notice', module: 'notice', label: 'Mise en demeure', icon: 'letter' },
    { href: 'history.html', key: 'history', module: 'history', label: 'Historique', icon: 'history' },
    { href: 'admin.html', key: 'admin', module: 'admin', label: 'Administration', icon: 'users' },
    { href: 'about.html', key: 'about', module: 'about', label: 'À propos', icon: 'info' }
  ];

  function currentKey() {
    const file = (location.pathname.split('/').pop() || '').toLowerCase();
    if (file.includes('dashboard')) return 'dashboard';
    if (file.includes('order')) return 'order';
    if (file.includes('mise')) return 'notice';
    if (file.includes('history')) return 'history';
    if (file.includes('admin')) return 'admin';
    if (file.includes('about')) return 'about';
    return 'calcul';
  }

  function currentPage() { return pages.find(item => item.key === currentKey()) || pages[0]; }
  function initials(name) { return String(name || 'U').trim().split(/\s+/).slice(0,2).map(x => x[0]).join('').toUpperCase(); }

  function renderSidebar({ db, user, permissions, page }) {
    const allowed = pages.filter(item => permissions?.[item.module]?.view);
    return `
      <div class="app-brand-card p-4">
        <div class="flex items-center gap-3">
          <div class="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-400 font-black text-white shadow-lg shadow-blue-200">SR</div>
          <div class="min-w-0"><p class="truncate text-base font-black text-slate-900">${window.UI.esc(db.app.name)}</p><p class="truncate text-xs font-semibold text-slate-500">Grands Comptes</p></div>
        </div>
      </div>
      <nav class="mt-6 space-y-2">
        ${allowed.map(item => `<a class="app-nav-link ${item.key === page.key ? 'active' : ''}" href="${item.href}">${window.UI.icon(item.icon,'app-icon')}<span>${window.UI.esc(item.label)}</span></a>`).join('')}
      </nav>
      <div class="app-session-card mt-auto p-4">
        <div class="flex items-center gap-3"><div class="ui-avatar">${initials(user.name)}</div><div class="min-w-0"><p class="truncate font-black text-slate-900">${window.UI.esc(user.name)}</p><p class="truncate text-xs font-semibold text-slate-500">${user.role === 'admin' ? 'Administrateur' : 'Utilisateur'} · ${window.UI.esc(user.matricule)}</p></div></div>
        <div class="mt-4 rounded-2xl bg-slate-50 p-3"><p class="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Application</p><p class="mt-1 text-xs font-bold text-slate-600">Version ${window.UI.esc(db.app.version)}</p><p class="mt-1 text-[11px] font-semibold text-slate-400">Développé par ${window.UI.esc(db.app.developerName)}</p></div>
        <button id="sidebarLogout" class="ui-btn ui-btn-dark mt-4 w-full">${window.UI.icon('logout')} Déconnexion</button>
      </div>`;
  }

  function renderHeader({ db, user, page }) {
    const withClient = ['calcul','order','notice'].includes(page.module);
    return `
      <div class="flex h-full items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <button id="sidebarToggle" class="ui-icon-button lg:hidden">${window.UI.icon('menu')}</button>
          <div class="min-w-0"><p class="truncate text-[10px] font-black uppercase tracking-[.14em] text-blue-600 sm:text-xs">${window.UI.esc(db.app.department)}</p><h1 class="truncate text-lg font-black text-slate-900 sm:text-xl">${window.UI.esc(page.label)}</h1></div>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
          ${withClient ? `<label class="hidden text-xs font-black uppercase tracking-wide text-slate-400 md:block" for="globalClientSelect">Client</label><select id="globalClientSelect" class="app-client-select ui-select py-2.5"><option value="">Choisir un client</option>${db.clients.map(client => `<option value="${client.id}">${window.UI.esc(client.clientNumber)} — ${window.UI.esc(client.name)}</option>`).join('')}</select>` : ''}
          <div class="hidden items-center gap-2 rounded-2xl border border-white/90 bg-white/75 px-3 py-2 shadow-sm sm:flex"><div class="ui-avatar !h-9 !w-9 !rounded-xl text-xs">${initials(user.name)}</div><div class="max-w-[150px]"><p class="truncate text-sm font-black text-slate-800">${window.UI.esc(user.name)}</p><p class="truncate text-[11px] font-semibold text-slate-500">${user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p></div></div>
        </div>
      </div>`;
  }

  window.AppNavigation = { pages, currentKey, currentPage, initials, renderSidebar, renderHeader };
})();
