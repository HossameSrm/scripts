(function (window) {
  'use strict';

  class AppSidebar {
    constructor(router, itemComponent, groupComponent) {
      this.router = router;
      this.itemComponent = itemComponent;
      this.groupComponent = groupComponent;
    }

    initials(name) {
      return String(name || 'U').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    }

    isAllowed(entry, user, permissions) {
      if (entry.roles?.length && !entry.roles.includes(user.role) && !user.is_owner) return false;
      if (!entry.module) return true;
      return Boolean(permissions?.[entry.module]?.view);
    }

    menu(user, permissions) {
      const route = key => this.router.routes.find(item => item.key === key);
      const permitted = entry => entry && this.isAllowed(entry, user, permissions);

      const documents = [route('calcul'), route('order'), route('notice')].filter(permitted);
      const clientRoute = route('clients');
      const historyRoute = route('history');
      const adminRoute = route('admin');

      return [
        {
          section: null,
          entries: [route('dashboard')].filter(permitted)
        },
        {
          section: 'Gestion',
          entries: [
            permitted(clientRoute) ? {
              id: 'clients', label: 'Clients', icon: 'client', children: [
                { ...clientRoute, label: 'Liste des clients', href: 'client.html' },
                { ...clientRoute, key: null, label: 'Nouveau client', href: 'client.html?action=create', query: true }
              ]
            } : null,
            documents.length ? {
              id: 'documents', label: 'Documents', icon: 'file', children: documents
            } : null
          ].filter(Boolean)
        },
        {
          section: 'Suivi',
          entries: [historyRoute].filter(permitted)
        },
        {
          section: 'Administration',
          visible: user.is_owner || user.role === 'admin',
          entries: [permitted(adminRoute) ? {
            id: 'administration', label: 'Administration', icon: 'users', roles: ['admin'], children: [
              { ...adminRoute, label: 'Utilisateurs', href: 'admin.html' },
              { ...adminRoute, key: null, label: 'Rôles et permissions', href: 'admin.html?tab=permissions', query: true },
              permitted(historyRoute) ? { ...historyRoute, key: null, label: 'Journal d’activité', href: 'history.html?scope=all', query: true } : null
            ].filter(Boolean)
          } : null].filter(Boolean)
        },
        {
          section: 'Application',
          entries: [route('about')].filter(permitted)
        }
      ];
    }

    renderSection(group, page) {
      if (group.visible === false || !group.entries.length) return '';
      return `<section class="app-nav-group">
        ${group.section ? `<p class="app-nav-caption">${window.UI.esc(group.section)}</p>` : ''}
        <div class="app-nav-list">
          ${group.entries.map(entry => entry.children
            ? this.groupComponent.render(entry, page)
            : this.itemComponent.render(entry, page)
          ).join('')}
        </div>
      </section>`;
    }

    render({ db, user, permissions, page }) {
      return `
        <div class="app-brand-block">
          <a href="dashboard.html" class="app-brand-link">
            <div class="app-brand-mark"><span>S</span><span>R</span></div>
            <div class="app-brand-copy min-w-0">
              <p class="app-brand-name">SRM Workspace</p>
              <p class="app-brand-subtitle">Grands Comptes</p>
            </div>
          </a>
          <button id="sidebarCollapse" class="app-sidebar-collapse" type="button" aria-label="Réduire le menu">${window.UI.icon('chevron')}</button>
        </div>

        <div class="app-sidebar-search">
          <span>${window.UI.icon('search')}</span>
          <input id="sidebarSearchInput" type="search" placeholder="Rechercher dans le menu" aria-label="Rechercher dans le menu">
          <kbd>⌘K</kbd>
        </div>

        <div class="app-sidebar-scroll">
          ${this.menu(user, permissions).map(group => this.renderSection(group, page)).join('')}
          <div id="sidebarNoResult" class="app-nav-no-result hidden">Aucun élément trouvé.</div>
        </div>

        <div class="app-profile-card">
          <div class="app-profile-main">
            <div class="ui-avatar app-profile-avatar">${this.initials(user.name)}</div>
            <div class="app-profile-copy min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-[#071437]">${window.UI.esc(user.name)}</p>
              <p class="truncate text-xs font-medium text-[#99a1b7]">${user.is_owner ? 'Propriétaire' : user.role === 'admin' ? 'Administrateur' : 'Utilisateur'} · ${window.UI.esc(user.matricule)}</p>
            </div>
            ${user.is_owner ? '<span class="owner-crown" title="Propriétaire">★</span>' : ''}
          </div>
          <button id="sidebarLogout" class="app-logout-button">${window.UI.icon('logout')}<span>Se déconnecter</span></button>
          <div class="app-version-line"><span>SRM Documents</span><span>v${window.UI.esc(db.app.version)}</span></div>
        </div>`;
    }

    bind(root = document) {
      root.querySelectorAll('[data-sidebar-group-toggle]').forEach(button => {
        button.addEventListener('click', () => {
          const target = root.getElementById(button.dataset.sidebarGroupToggle);
          const expanded = button.getAttribute('aria-expanded') === 'true';
          button.setAttribute('aria-expanded', String(!expanded));
          button.classList.toggle('active', !expanded);
          button.closest('[data-sidebar-group]')?.classList.toggle('is-open', !expanded);
          target?.classList.toggle('hidden', expanded);
        });
      });

      const input = root.getElementById('sidebarSearchInput');
      const noResult = root.getElementById('sidebarNoResult');
      input?.addEventListener('input', event => {
        const query = event.currentTarget.value.trim().toLowerCase();
        let visible = 0;
        root.querySelectorAll('.app-nav-link').forEach(link => {
          const match = !query || (link.dataset.navLabel || '').includes(query);
          link.classList.toggle('hidden', !match);
          if (match) visible += 1;
        });
        root.querySelectorAll('[data-sidebar-group]').forEach(group => {
          const groupLinks = [...group.querySelectorAll('.app-nav-link')];
          const groupVisible = groupLinks.some(link => !link.classList.contains('hidden'));
          group.classList.toggle('hidden', !groupVisible);
          if (query && groupVisible) group.querySelector('[data-sidebar-group-content]')?.classList.remove('hidden');
        });
        root.querySelectorAll('.app-nav-group').forEach(section => {
          const sectionVisible = [...section.querySelectorAll('.app-nav-link')].some(link => !link.classList.contains('hidden'));
          section.classList.toggle('hidden', !sectionVisible);
        });
        noResult?.classList.toggle('hidden', visible > 0);
      });
    }
  }

  window.SRM.Components = window.SRM.Components || {};
  window.SRM.Components.Navigation = window.SRM.Components.Navigation || {};
  window.SRM.Components.Navigation.AppSidebar = AppSidebar;
})(window);
