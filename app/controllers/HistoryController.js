(function (window) {
  'use strict';
  class HistoryController {
    constructor(model, view, database) { this.model = model; this.view = view; this.database = database; }
    async init() {
      try { this.view.render(await this.model.list(250)); }
      catch (error) { this.view.renderError(this.database.friendlyError(error)); }
    }
  }
  window.SRM.Controllers.HistoryController = HistoryController;
})(window);
