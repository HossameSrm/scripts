(function (window) {
  'use strict';
  class AuthModel {
    constructor(database) { this.database = database; }
    configured() { return this.database.configured(); }
    session() { return this.database.getSession(); }
    login(login, password) { return this.database.login(login, password); }
    logout() { return this.database.logout(); }
    bootstrap(force = false) { return this.database.bootstrap(force); }
    error(error) { return this.database.friendlyError(error); }
  }
  window.SRM.Models.AuthModel = AuthModel;
})(window);
