(function (window) {
  'use strict';

  class SidebarGroup {
    constructor(itemComponent) {
      this.itemComponent = itemComponent;
    }

    containsActive(item, page) {
      if (item.href && this.itemComponent.isActive(item, page)) return true;
      return Array.isArray(item.children) && item.children.some(child => this.containsActive(child, page));
    }

    render(item, page, depth = 0) {
      const children = (item.children || []).filter(Boolean);
      if (!children.length) return '';

      const open = this.containsActive(item, page);
      const id = `sidebar-group-${String(item.id || item.label).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const content = children.map(child => child.children
        ? this.render(child, page, depth + 1)
        : this.itemComponent.render(child, page, { nested: true })
      ).join('');

      return `<div class="app-nav-tree ${open ? 'is-open' : ''}" data-sidebar-group>
        <button class="app-nav-parent ${open ? 'active' : ''}" type="button" data-sidebar-group-toggle="${id}" aria-expanded="${open}">
          <span class="app-nav-icon">${window.UI.icon(item.icon || 'folder')}</span>
          <span class="app-nav-label min-w-0 flex-1 truncate">${window.UI.esc(item.label)}</span>
          <span class="app-nav-chevron">${window.UI.icon('chevron')}</span>
        </button>
        <div id="${id}" class="app-nav-children ${open ? '' : 'hidden'}" data-sidebar-group-content>
          ${content}
        </div>
      </div>`;
    }
  }

  window.SRM.Components = window.SRM.Components || {};
  window.SRM.Components.Navigation = window.SRM.Components.Navigation || {};
  window.SRM.Components.Navigation.SidebarGroup = SidebarGroup;
})(window);
