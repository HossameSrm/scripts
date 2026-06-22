(function (window) {
  'use strict';

  class ClientsController {
    constructor(model, view, database) {
      this.model = model;
      this.view = view;
      this.database = database;
      this.clients = [];
      this.permissions = {};
      this.selectedId = null;
    }

    async init(event) {
      this.permissions = event.detail.permissions || {};
      this.view.bind({
        onCreate: () => this.startCreate(),
        onSelect: id => this.select(id),
        onSave: payload => this.save(payload),
        onDelete: id => this.remove(id),
        onDuplicate: id => this.duplicate(id)
      });
      await this.load();
    }

    async load(preferredId = null) {
      try {
        this.clients = await this.model.list();
        const id = preferredId || this.selectedId || this.clients[0]?.id || null;
        this.selectedId = this.clients.some(client => client.id === id) ? id : this.clients[0]?.id || null;
        this.view.render(this.clients, this.selectedId, this.permissions);
      } catch (error) {
        window.UI.toast(this.database.friendlyError(error), 'error');
        this.view.renderError(this.database.friendlyError(error));
      }
    }

    startCreate() {
      if (!this.permissions?.clients?.create) return window.UI.toast('Vous ne pouvez pas créer de client.', 'error');
      this.selectedId = null;
      this.view.renderEditor(this.view.emptyClient(), this.permissions, true);
    }

    select(id) {
      const client = this.clients.find(item => item.id === id);
      if (!client) return;
      this.selectedId = id;
      this.view.markSelected(id);
      this.view.renderEditor(client, this.permissions, false);
    }

    async save(payload) {
      const action = payload.id ? 'edit' : 'create';
      if (!this.permissions?.clients?.[action]) return window.UI.toast('Permission insuffisante.', 'error');
      try {
        const saved = await this.model.save(payload);
        window.UI.toast(payload.id ? 'Client mis à jour.' : 'Client créé.', 'success');
        this.database.bootstrapCache = null;
        await this.load(saved?.id || payload.id);
      } catch (error) {
        window.UI.toast(this.database.friendlyError(error), 'error');
        throw error;
      }
    }

    async duplicate(id) {
      if (!this.permissions?.clients?.create) return window.UI.toast('Permission insuffisante.', 'error');
      const source = this.clients.find(item => item.id === id);
      if (!source) return;
      const clone = JSON.parse(JSON.stringify(source));
      clone.id = '';
      clone.clientNumber = '';
      clone.name = `${clone.name} — COPIE`;
      clone.contracts = (clone.contracts || []).map(contract => ({
        ...contract,
        id: '',
        number: '',
        arrears: (contract.arrears || []).map(arrear => ({ ...arrear, id: '' }))
      }));
      this.selectedId = null;
      this.view.renderEditor(clone, this.permissions, true);
      window.UI.toast('Copie préparée. Complétez les nouveaux numéros.', 'info');
    }

    async remove(id) {
      if (!this.permissions?.clients?.delete) return window.UI.toast('Vous ne pouvez pas supprimer ce client.', 'error');
      const client = this.clients.find(item => item.id === id);
      if (!client) return;
      const confirmed = await window.UI.confirm({
        title: 'Supprimer le client',
        message: `Supprimer ${client.name}, ses contrats et ses arriérés ?`,
        confirmText: 'Supprimer définitivement',
        danger: true
      });
      if (!confirmed) return;
      try {
        await this.model.delete(id);
        window.UI.toast('Client supprimé.', 'success');
        this.selectedId = null;
        this.database.bootstrapCache = null;
        await this.load();
      } catch (error) {
        window.UI.toast(this.database.friendlyError(error), 'error');
      }
    }
  }

  window.SRM.Controllers.ClientsController = ClientsController;
})(window);
