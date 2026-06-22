(function (window) {
  'use strict';
  class UserModel {
    constructor(database) { this.database = database; }
    list() { return this.database.rpc('admin_list_users', { p_token: this.database.getSession()?.token || '' }); }
    create(payload) {
      return this.database.rpc('admin_create_user', {
        p_token: this.database.getSession()?.token || '', p_full_name: payload.name,
        p_matricule: payload.matricule, p_username: payload.username,
        p_password: payload.password, p_role: payload.role
      });
    }
    update(payload) {
      return this.database.rpc('admin_update_user', {
        p_token: this.database.getSession()?.token || '', p_user_id: payload.id,
        p_full_name: payload.name, p_matricule: payload.matricule,
        p_username: payload.username, p_role: payload.role, p_status: payload.status
      });
    }
    setPermissions(userId, permissions) {
      return this.database.rpc('admin_set_permissions', {
        p_token: this.database.getSession()?.token || '', p_user_id: userId, p_permissions: permissions
      });
    }
    resetPassword(userId, password) {
      return this.database.rpc('admin_reset_password', {
        p_token: this.database.getSession()?.token || '', p_user_id: userId, p_new_password: password
      });
    }
    delete(userId) {
      return this.database.rpc('admin_delete_user', {
        p_token: this.database.getSession()?.token || '', p_user_id: userId
      });
    }
  }
  window.SRM.Models.UserModel = UserModel;
})(window);
