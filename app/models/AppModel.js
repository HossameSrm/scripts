(function (window) {
  'use strict';
  class AppModel {
    constructor(database) { this.database = database; }
    session() { return this.database.getSession(); }
    bootstrap(force = false) { return this.database.bootstrap(force); }
    logout() { return this.database.logout(); }
    error(error) { return this.database.friendlyError(error); }
    lastClientId() { return localStorage.getItem(this.database.lastClientKey); }
    setLastClientId(id) { localStorage.setItem(this.database.lastClientKey, id); }
  }
  window.SRM.Models.AppModel = AppModel;
})(window);
