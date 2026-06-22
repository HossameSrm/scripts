(function (window) {
  'use strict';
  class DashboardModel {
    constructor(database) { this.database = database; }
    load() { return this.database.rpc('dashboard_data', { p_token: this.database.getSession()?.token || '' }); }
  }
  window.SRM.Models.DashboardModel = DashboardModel;
})(window);
