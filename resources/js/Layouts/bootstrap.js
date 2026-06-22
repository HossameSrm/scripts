(function (window) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const database = window.SRM.Models.database;
    const sidebarItem = new window.SRM.Components.Navigation.SidebarItem(window.SRM.Core.Router);
    const sidebarGroup = new window.SRM.Components.Navigation.SidebarGroup(sidebarItem);
    const sidebar = new window.SRM.Components.Navigation.AppSidebar(window.SRM.Core.Router, sidebarItem, sidebarGroup);
    const header = new window.SRM.Components.Layout.AppHeader();

    const controller = new window.SRM.Controllers.LayoutController(
      new window.SRM.Models.AppModel(database),
      new window.SRM.Views.AppLayoutView(sidebar, header),
      window.SRM.Core.Router,
      window.SRM.Core.EventBus,
      new window.SRM.Models.DocumentModel(database)
    );

    controller.init();
  }, { once: true });
})(window);
