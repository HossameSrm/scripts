(function (window) {
  'use strict';
  class AdminController {
    constructor(model, view, database) { this.model = model; this.view = view; this.database = database; this.users = []; this.permissions = {}; }
    async init(event) {
      this.permissions = event.detail.permissions || {};
      this.view.bindCreate(() => this.view.openUserForm({}, (payload, editing) => this.saveUser(payload, editing)));
      this.view.bindTableAction(event => this.handleAction(event));
      if (!this.permissions?.admin?.create) this.view.hideCreateButton();
      await this.loadUsers();
    }
    async loadUsers() {
      try { this.users = await this.model.list(); this.view.renderStats(this.users); this.view.renderTable(this.users, this.permissions); }
      catch (error) { window.UI.toast(this.database.friendlyError(error), 'error'); }
    }
    async saveUser(payload, editing) {
      try {
        editing ? await this.model.update(payload) : await this.model.create(payload);
        window.UI.toast(editing ? 'Utilisateur modifié.' : 'Utilisateur créé.', 'success'); await this.loadUsers();
      } catch (error) { window.UI.toast(this.database.friendlyError(error), 'error'); throw error; }
    }
    async savePermissions(user, permissions) {
      try { await this.model.setPermissions(user.id, permissions); window.UI.toast('Permissions enregistrées.', 'success'); await this.loadUsers(); }
      catch (error) { window.UI.toast(this.database.friendlyError(error), 'error'); throw error; }
    }
    async resetPassword(user, password) {
      try { await this.model.resetPassword(user.id, password); window.UI.toast('Mot de passe réinitialisé.', 'success'); }
      catch (error) { window.UI.toast(this.database.friendlyError(error), 'error'); throw error; }
    }
    async deleteUser(user) {
      if (!(await this.view.confirmDelete(user))) return;
      try { await this.model.delete(user.id); window.UI.toast('Utilisateur supprimé.', 'success'); await this.loadUsers(); }
      catch (error) { window.UI.toast(this.database.friendlyError(error), 'error'); }
    }
    handleAction(event) {
      const button = event.target.closest('[data-action]'); if (!button) return;
      const row = button.closest('[data-user-id]'); const user = this.users.find(item => item.id === row?.dataset.userId); if (!user) return;
      if (button.dataset.action === 'edit') this.view.openUserForm(user, (payload, editing) => this.saveUser(payload, editing));
      if (button.dataset.action === 'permissions') this.view.openPermissions(user, permissions => this.savePermissions(user, permissions));
      if (button.dataset.action === 'password') this.view.openPassword(user, password => this.resetPassword(user, password));
      if (button.dataset.action === 'delete') this.deleteUser(user);
    }
  }
  window.SRM.Controllers.AdminController = AdminController;
})(window);
