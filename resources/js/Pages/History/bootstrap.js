(function (window) {
  'use strict';
  const database = window.SRM.Models.database;
  const controller = new window.SRM.Controllers.HistoryController(new window.SRM.Models.ActivityModel(database), new window.SRM.Views.HistoryView(), database);
  window.SRM.Core.EventBus.on('app:ready', () => controller.init(), { once:true });
})(window);
