(function (window) {
  'use strict';

  class AppHeader {
    initials(name) {
      return String(name || 'U').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    }

    render({ db, user, page }) {
      const withClient = ['calcul', 'order', 'notice'].includes(page.module);
      const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date());

      return `<div class="app-topbar-inner">
        <div class="app-topbar-left">
          <button id="sidebarToggle" class="ui-icon-button app-mobile-menu lg:hidden" type="button">${window.UI.icon('menu')}</button>
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
            <span class="app-user-mini-copy"><strong>${window.UI.esc(user.name.split(' ')[0])}</strong><small>${user.is_owner ? 'Owner' : user.role === 'admin' ? 'Admin' : 'User'}</small></span>
            <span class="app-user-mini-chevron">${window.UI.icon('chevron')}</span>
          </button>
        </div>
      </div>`;
    }
  }

  window.SRM.Components = window.SRM.Components || {};
  window.SRM.Components.Layout = window.SRM.Components.Layout || {};
  window.SRM.Components.Layout.AppHeader = AppHeader;
})(window);
