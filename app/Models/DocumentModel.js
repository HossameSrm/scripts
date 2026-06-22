(function (window) {
  'use strict';
  class DocumentModel {
    constructor(database) { this.database = database; }
    recordAction({ module, format, clientId = null, total = 0, data = {} }) {
      return this.database.rpc('record_document_action', {
        p_token: this.database.getSession()?.token || '', p_module: module,
        p_format: format, p_client_id: clientId || null,
        p_total: Number(total) || 0, p_data: data || {}
      });
    }
  }
  window.SRM.Models.DocumentModel = DocumentModel;
})(window);
