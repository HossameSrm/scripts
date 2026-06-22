(function (window) {
  'use strict';

  class NavigationView {
    constructor(router) { this.router = router; }

    initials(name) {
      return String(name || 'U').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    }

    routeLink(item, page) {
      return `<a class="app-nav-link ${item.key === page.key ? 'active' : ''}" href="${item.href}">
        <span class="app-nav-icon">${window.UI.icon(item.icon)}</span>
        <span class="min-w-0 flex-1 truncate">${window.UI.esc(item.label)}</span>
        ${item.key === page.key ? '<span class="app-nav-dot"></span>' : ''}
      </a>`;
    }

    renderGroup(label, items, page) {
      if (!items.length) return '';
      return `<section class="app-nav-group">
        <p class="app-nav-caption">${window.UI.esc(label)}</p>
        <div class="app-nav-list">${items.map(item => this.routeLink(item, page)).join('')}</div>
      </section>`;
    }

    renderSidebar({ db, user, permissions, page }) {
      const allowed = this.router.routes.filter(item => permissions?.[item.module]?.view);
      const pick = keys => allowed.filter(item => keys.includes(item.key));
      return `
        <div class="app-brand-block">
          <div class="app-brand-mark">SR</div>
          <div class="min-w-0">
            <p class="app-brand-name">SRM Workspace</p>
            <p class="app-brand-subtitle">Grands Comptes</p>
          </div>
          <span class="app-version-chip">v${window.UI.esc(db.app.version)}</span>
        </div>

        <div class="app-sidebar-scroll">
          ${this.renderGroup('Espace de travail', pick(['dashboard']), page)}
          ${this.renderGroup('Documents', pick(['calcul', 'order', 'notice']), page)}
          ${this.renderGroup('Pilotage', pick(['history', 'admin']), page)}
          ${this.renderGroup('Application', pick(['about']), page)}
        </div>

        <div class="app-profile-card">
          <div class="flex items-center gap-3">
            <div class="ui-avatar app-profile-avatar">${this.initials(user.name)}</div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-black text-slate-900">${window.UI.esc(user.name)}</p>
              <p class="truncate text-[11px] font-bold text-slate-500">${user.role === 'admin' ? 'Administrateur' : 'Utilisateur'} · ${window.UI.esc(user.matricule)}</p>
            </div>
            ${user.is_owner ? '<span class="owner-crown" title="Propriétaire">★</span>' : ''}
          </div>
          <div class="app-profile-meta">
            <span><i></i> Session active</span>
            <span>${window.UI.esc(db.app.defaultCity || 'FES')}</span>
          </div>
          <button id="sidebarLogout" class="app-logout-button">${window.UI.icon('logout')}<span>Se déconnecter</span></button>
        </div>`;
    }

    renderHeader({ db, user, page }) {
      const withClient = ['calcul', 'order', 'notice'].includes(page.module);
      return `
        <div class="app-topbar-inner">
          <div class="flex min-w-0 items-center gap-3">
            <button id="sidebarToggle" class="ui-icon-button app-mobile-menu lg:hidden">${window.UI.icon('menu')}</button>
            <div class="min-w-0">
              <div class="app-breadcrumb"><span>SRM-FM</span><b>/</b><span>${window.UI.esc(page.label)}</span></div>
              <h1 class="app-topbar-title">${window.UI.esc(page.label)}</h1>
            </div>
          </div>

          <div class="app-topbar-actions">
            ${withClient ? `<div class="app-client-picker">
              <span class="app-client-picker-icon">${window.UI.icon('client')}</span>
              <div class="min-w-0 flex-1">
                <span class="app-client-picker-label">Client actif</span>
                <select id="globalClientSelect" class="app-client-select">
                  <option value="">Sélectionner un client</option>
                  ${db.clients.map(client => `<option value="${client.id}">${window.UI.esc(client.clientNumber)} — ${window.UI.esc(client.name)}</option>`).join('')}
                </select>
              </div>
            </div>` : ''}
            <div class="app-date-card">
              <span class="app-date-day">${new Intl.DateTimeFormat('fr-FR',{day:'2-digit'}).format(new Date())}</span>
              <span class="app-date-rest">${new Intl.DateTimeFormat('fr-FR',{month:'short',year:'numeric'}).format(new Date())}</span>
            </div>
            <div class="app-user-mini" title="${window.UI.esc(user.name)}">
              <div class="ui-avatar !h-10 !w-10 !rounded-[14px] text-xs">${this.initials(user.name)}</div>
            </div>
          </div>
        </div>`;
    }
  }

  window.SRM.Views.NavigationView = NavigationView;
  window.AppNavigation = {
    pages: window.SRM.Core.Router.routes,
    currentKey: () => window.SRM.Core.Router.currentKey(),
    currentPage: () => window.SRM.Core.Router.currentPage()
  };
})(window);
