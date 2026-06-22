(function (window) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    window.SRM.Layouts.AuthLayout.render();
    const database = window.SRM.Models.database;
    const controller = new window.SRM.Controllers.AuthController(
      new window.SRM.Models.AuthModel(database),
      new window.SRM.Views.AuthView(),
      window.SRM.Core.Router
    );
    controller.init();
  }, { once: true });
})(window);
