(function (window) {
  'use strict';

  class SidebarItem {
    constructor(router) {
      this.router = router;
    }

    currentLocation() {
      return {
        file: (window.location.pathname.split('/').pop() || 'dashboard.html').toLowerCase(),
        params: new URLSearchParams(window.location.search)
      };
    }

    isActive(item, page) {
      if (item.key && item.key === page?.key && !item.query) return true;
      if (!item.href) return false;

      const url = new URL(item.href, window.location.href);
      const current = this.currentLocation();
      const file = (url.pathname.split('/').pop() || '').toLowerCase();
      if (file !== current.file) return false;

      const requested = new URLSearchParams(url.search);
      if (![...requested.keys()].length) return true;

      return [...requested.entries()].every(([key, value]) => current.params.get(key) === value);
    }

    render(item, page, options = {}) {
      const active = this.isActive(item, page);
      const nested = options.nested === true;
      const icon = item.icon
        ? `<span class="app-nav-icon">${window.UI.icon(item.icon)}</span>`
        : '<span class="app-nav-dot" aria-hidden="true"></span>';

      return `<a
        class="app-nav-link ${nested ? 'app-nav-link-nested' : ''} ${active ? 'active' : ''}"
        href="${window.UI.esc(item.href)}"
        data-nav-label="${window.UI.esc(item.label.toLowerCase())}"
        ${active ? 'aria-current="page"' : ''}
      >
        ${icon}
        <span class="app-nav-label min-w-0 flex-1 truncate">${window.UI.esc(item.label)}</span>
        ${item.badge ? `<span class="app-nav-badge">${window.UI.esc(item.badge)}</span>` : ''}
      </a>`;
    }
  }

  window.SRM.Components = window.SRM.Components || {};
  window.SRM.Components.Navigation = window.SRM.Components.Navigation || {};
  window.SRM.Components.Navigation.SidebarItem = SidebarItem;
})(window);
