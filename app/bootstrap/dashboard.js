(function (window) {
  'use strict';
  const database = window.SRM.Models.database;
  const controller = new window.SRM.Controllers.DashboardController(new window.SRM.Models.DashboardModel(database), new window.SRM.Views.DashboardView(), database);
  window.SRM.Core.EventBus.on('app:ready', event => controller.init(event), { once:true });
})(window);
