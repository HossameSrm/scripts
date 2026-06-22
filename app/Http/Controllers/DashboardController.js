(function (window) {
  'use strict';
  class DashboardController {
    constructor(model, view, database) { this.model = model; this.view = view; this.database = database; }
    async init(event) {
      try { this.view.render(await this.model.load(), event.detail.permissions); }
      catch (error) { this.view.renderError(this.database.friendlyError(error)); }
    }
  }
  window.SRM.Controllers.DashboardController = DashboardController;
})(window);
