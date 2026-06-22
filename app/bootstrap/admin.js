(function (window) {
  'use strict';
  const database = window.SRM.Models.database;
  const controller = new window.SRM.Controllers.AdminController(new window.SRM.Models.UserModel(database), new window.SRM.Views.AdminView(), database);
  window.SRM.Core.EventBus.on('app:ready', event => controller.init(event), { once:true });
})(window);
