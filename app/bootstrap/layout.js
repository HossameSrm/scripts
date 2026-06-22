(function (window) {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const database = window.SRM.Models.database;
    const navigationView = new window.SRM.Views.NavigationView(window.SRM.Core.Router);
    const controller = new window.SRM.Controllers.LayoutController(
      new window.SRM.Models.AppModel(database),
      new window.SRM.Views.AppLayoutView(navigationView),
      window.SRM.Core.Router,
      window.SRM.Core.EventBus,
      new window.SRM.Models.DocumentModel(database)
    );
    controller.init();
  }, { once:true });
})(window);
