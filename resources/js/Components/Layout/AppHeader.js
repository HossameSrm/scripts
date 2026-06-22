(function (window) {
  'use strict';

  class AppHeader {
    initials(name) {
      return String(name || 'U')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase();
    }

    subNavigation(page) {
      const maps = {
        clients: [
          { label: 'Informations générales', href: '#client-general-section' },
          { label: 'Contrats', href: '#client-contracts-section' },
          { label: 'Arriérés', href: '#client-contracts-section' },
          { label: 'Documents', href: 'history.html?module=clients' }
        ],
        admin: [
          { label: 'Utilisateurs', href: 'admin.html' },
          { label: 'Rôles et permissions', href: 'admin.html?tab=permissions' },
          { label: 'Journal d’activité', href: 'history.html?scope=all' }
        ],
        history: [
          { label: 'Tout', href: 'history.html' },
          { label: 'Facilités', href: 'history.html?module=calcul' },
          { label: 'Ordres de coupure', href: 'history.html?module=order' },
          { label: 'Mises en demeure', href: 'history.html?module=notice' }
        ]
      };

      return maps[page.module] || [];
    }

    isActiveSubLink(item) {
      if (item.href.startsWith('#')) return item === this.subNavigation({ module: 'clients' })[0];
      const url = new URL(item.href, window.location.href);
      const currentFile = window.location.pathname.split('/').pop() || 'dashboard.html';
      if ((url.pathname.split('/').pop() || '') !== currentFile) return false;
      const requested = new URLSearchParams(url.search);
      const current = new URLSearchParams(window.location.search);
      if (![...requested.keys()].length) return ![...current.keys()].length;
      return [...requested.entries()].every(([key, value]) => current.get(key) === value);
    }

    renderSubNavigation(page) {
      const items = this.subNavigation(page);
      if (!items.length) return '';

      return `<nav class="app-subnav" aria-label="Navigation secondaire">
        <div class="app-subnav-inner">
          ${items.map((item, index) => `<a
            class="app-subnav-link ${index === 0 && page.module === 'clients' ? 'active' : this.isActiveSubLink(item) ? 'active' : ''}"
            href="${window.UI.esc(item.href)}"
          >${window.UI.esc(item.label)}</a>`).join('')}
        </div>
      </nav>`;
    }

    render({ db, user, page }) {
      const withClient = ['calcul', 'order', 'notice'].includes(page.module);

      return `<div class="app-topbar-row">
        <div class="app-topbar-left">
          <button id="sidebarToggle" class="app-topbar-icon app-mobile-menu lg:hidden" type="button" aria-label="Ouvrir le menu">
            ${window.UI.icon('menu')}
          </button>
          <div class="app-header-breadcrumb">
            <a href="dashboard.html">Accueil</a>
            <span>${window.UI.icon('chevron')}</span>
            <strong>${window.UI.esc(page.label)}</strong>
          </div>
        </div>

        <div class="app-topbar-actions">
          ${withClient ? `<label class="app-client-picker">
            <span class="app-client-picker-label">Client actif</span>
            <select id="globalClientSelect" class="app-client-select">
              <option value="">Sélectionner un client</option>
              ${db.clients.map(client => `<option value="${client.id}">${window.UI.esc(client.clientNumber)} — ${window.UI.esc(client.name)}</option>`).join('')}
            </select>
          </label>` : ''}

          <button class="app-topbar-icon" type="button" title="Recherche" aria-label="Recherche">${window.UI.icon('search')}</button>
          <button class="app-topbar-icon app-notification-button" type="button" title="Notifications" aria-label="Notifications">${window.UI.icon('bell')}<i></i></button>
          <button class="app-topbar-icon" type="button" title="Applications" aria-label="Applications">${window.UI.icon('dashboard')}</button>

          <button class="app-user-mini" type="button" title="${window.UI.esc(user.name)}">
            <span class="ui-avatar">${this.initials(user.name)}</span>
            <span class="app-user-mini-copy">
              <strong>${window.UI.esc(user.name.split(' ')[0])}</strong>
              <small>${user.is_owner ? 'Owner' : user.role === 'admin' ? 'Admin' : 'User'}</small>
            </span>
            <span class="app-user-mini-chevron">${window.UI.icon('chevron')}</span>
          </button>
        </div>
      </div>
      ${this.renderSubNavigation(page)}`;
    }
  }

  window.SRM.Components = window.SRM.Components || {};
  window.SRM.Components.Layout = window.SRM.Components.Layout || {};
  window.SRM.Components.Layout.AppHeader = AppHeader;
})(window);
