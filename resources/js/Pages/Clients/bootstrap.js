(function (window) {
  'use strict';
  const database = window.SRM.Models.database;
  const controller = new window.SRM.Controllers.ClientsController(
    new window.SRM.Models.ClientModel(database),
    new window.SRM.Views.ClientsView(),
    database
  );
  window.SRM.Core.EventBus.on('app:ready', event => controller.init(event), { once: true });
})(window);
