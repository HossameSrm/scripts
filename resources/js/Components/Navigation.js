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
        <span class="app-nav-chevron">${window.UI.icon('chevron')}</span>
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
          <a href="dashboard.html" class="app-brand-link">
            <div class="app-brand-mark"><span>S</span><span>R</span></div>
            <div class="min-w-0">
              <p class="app-brand-name">SRM Workspace</p>
              <p class="app-brand-subtitle">Grands Comptes</p>
            </div>
          </a>
          <button id="sidebarCollapse" class="app-sidebar-collapse" type="button" aria-label="Réduire le menu">${window.UI.icon('chevron')}</button>
        </div>

        <div class="app-sidebar-search">
          <span>${window.UI.icon('search')}</span>
          <input type="search" placeholder="Recherche rapide" aria-label="Recherche rapide">
          <kbd>⌘K</kbd>
        </div>

        <div class="app-sidebar-scroll">
          ${this.renderGroup('Tableau de bord', pick(['dashboard']), page)}
          ${this.renderGroup('Référentiel', pick(['clients']), page)}
          ${this.renderGroup('Gestion documentaire', pick(['calcul', 'order', 'notice']), page)}
          ${this.renderGroup('Administration', pick(['history', 'admin']), page)}
          ${this.renderGroup('Aide', pick(['about']), page)}
        </div>

        <div class="app-profile-card">
          <div class="app-profile-main">
            <div class="ui-avatar app-profile-avatar">${this.initials(user.name)}</div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-[#071437]">${window.UI.esc(user.name)}</p>
              <p class="truncate text-xs font-medium text-[#99a1b7]">${user.role === 'admin' ? 'Administrateur' : 'Utilisateur'} · ${window.UI.esc(user.matricule)}</p>
            </div>
            ${user.is_owner ? '<span class="owner-crown" title="Propriétaire">★</span>' : ''}
          </div>
          <button id="sidebarLogout" class="app-logout-button">${window.UI.icon('logout')}<span>Se déconnecter</span></button>
          <div class="app-version-line"><span>SRM Documents</span><span>v${window.UI.esc(db.app.version)}</span></div>
        </div>`;
    }

    renderHeader({ db, user, page }) {
      const withClient = ['calcul', 'order', 'notice'].includes(page.module);
      const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date());
      return `
        <div class="app-topbar-inner">
          <div class="app-topbar-left">
            <button id="sidebarToggle" class="ui-icon-button app-mobile-menu lg:hidden">${window.UI.icon('menu')}</button>
            <div class="min-w-0">
              <div class="app-breadcrumb"><a href="dashboard.html">Accueil</a><b>•</b><span>${window.UI.esc(page.label)}</span></div>
              <h1 class="app-topbar-title">${window.UI.esc(page.label)}</h1>
            </div>
          </div>

          <div class="app-topbar-actions">
            ${withClient ? `<div class="app-client-picker">
              <span class="app-client-picker-icon">${window.UI.icon('client')}</span>
              <div class="min-w-0 flex-1">
                <span class="app-client-picker-label">Client actif</span>
                <select id="globalClientSelect" class="app-client-select">
                  <option value="">Sélectionner</option>
                  ${db.clients.map(client => `<option value="${client.id}">${window.UI.esc(client.clientNumber)} — ${window.UI.esc(client.name)}</option>`).join('')}
                </select>
              </div>
            </div>` : ''}
            <button class="app-topbar-icon" type="button" title="Recherche">${window.UI.icon('search')}</button>
            <button class="app-topbar-icon app-notification-button" type="button" title="Notifications">${window.UI.icon('bell')}<i></i></button>
            <div class="app-date-card"><span>${window.UI.esc(today)}</span></div>
            <button class="app-user-mini" type="button" title="${window.UI.esc(user.name)}">
              <div class="ui-avatar">${this.initials(user.name)}</div>
              <span class="app-user-mini-copy"><strong>${window.UI.esc(user.name.split(' ')[0])}</strong><small>${user.role === 'admin' ? 'Admin' : 'User'}</small></span>
              <span class="app-user-mini-chevron">${window.UI.icon('chevron')}</span>
            </button>
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
