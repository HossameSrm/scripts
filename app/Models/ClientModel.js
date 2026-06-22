(function (window) {
  'use strict';

  class ClientModel {
    constructor(database) { this.database = database; }
    token() { return this.database.getSession()?.token; }
    list() { return this.database.rpc('list_clients', { p_token: this.token() }); }
    save(client) { return this.database.rpc('save_client', { p_token: this.token(), p_client: client }); }
    delete(id) { return this.database.rpc('delete_client', { p_token: this.token(), p_client_id: id }); }
  }

  window.SRM.Models.ClientModel = ClientModel;
})(window);
