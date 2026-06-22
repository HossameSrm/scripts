(function (window) {
  'use strict';
  class ActivityModel {
    constructor(database) { this.database = database; }
    list(limit = 100) { return this.database.rpc('list_activity', { p_token: this.database.getSession()?.token || '', p_limit: limit }); }
  }
  window.SRM.Models.ActivityModel = ActivityModel;
})(window);
