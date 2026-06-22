(function (window) {
  'use strict';

  window.SRM.Pages?.register('Admin/Users', { layout: 'AppLayout', title: 'Administration', module: 'admin' });


  const modules = [
    ['dashboard','Tableau de bord'],['clients','Clients'],['calcul','Facilité de paiement'],['order','Ordre de coupure'],
    ['notice','Mise en demeure'],['history','Historique'],['admin','Administration'],['about','À propos']
  ];
  const actions = [['view','Accès'],['create','Créer'],['edit','Modifier'],['delete','Supprimer'],['export_pdf','PDF'],['export_docx','DOCX']];

  class AdminView {
    initials(name) { return String(name || 'U').split(/\s+/).slice(0,2).map(x => x[0]).join('').toUpperCase(); }

    renderStats(users) {
      const total = users.length;
      document.getElementById('adminStats').innerHTML = [
        {label:'Utilisateurs',value:total,icon:'users',tone:'blue',note:'Tous les comptes'},
        {label:'Actifs',value:users.filter(u=>u.status==='active').length,icon:'check',tone:'emerald',note:'Accès autorisé'},
        {label:'Administrateurs',value:users.filter(u=>u.role==='admin').length,icon:'shield',tone:'violet',note:'Gestion avancée'},
        {label:'Désactivés',value:users.filter(u=>u.status!=='active').length,icon:'warning',tone:'rose',note:'Accès bloqué'}
      ].map(window.UI.statCard).join('');
    }

    renderTable(users, permissions) {
      const can = action => Boolean(permissions?.admin?.[action]);
      const body = document.getElementById('usersBody');
      body.innerHTML = users.length ? users.map(user => `
        <tr data-user-id="${user.id}" data-role="${user.role}" data-status="${user.status}" data-search="${window.UI.esc(`${user.name} ${user.username} ${user.matricule}`.toLowerCase())}">
          <td><div class="flex items-center gap-3"><div class="ui-avatar">${this.initials(user.name)}</div><div><p class="font-black text-slate-900">${window.UI.esc(user.name)} ${user.is_owner ? window.UI.badge('Propriétaire','violet') : ''}</p><p class="mt-1 text-xs font-semibold text-slate-400">@${window.UI.esc(user.username)}</p></div></div></td>
          <td><span class="font-black text-slate-700">${window.UI.esc(user.matricule)}</span></td>
          <td>${window.UI.badge(user.role==='admin'?'Administrateur':'Utilisateur',user.role==='admin'?'blue':'slate')}</td>
          <td>${window.UI.badge(user.status==='active'?'Actif':'Désactivé',user.status==='active'?'emerald':'rose')}</td>
          <td><span class="text-sm font-semibold text-slate-500">${window.UI.formatDate(user.last_login_at)}</span></td>
          <td><div class="ui-actions">
            ${can('edit') ? `<button class="ui-icon-button" title="Modifier" data-action="edit">${window.UI.icon('edit')}</button><button class="ui-icon-button" title="Permissions" data-action="permissions">${window.UI.icon('shield')}</button><button class="ui-icon-button" title="Mot de passe" data-action="password">${window.UI.icon('key')}</button>` : ''}
            ${can('delete') && !user.is_owner ? `<button class="ui-icon-button !text-red-600 !bg-red-50" title="Supprimer" data-action="delete">${window.UI.icon('trash')}</button>` : ''}
          </div></td>
        </tr>`).join('') : `<tr><td colspan="6">${window.UI.emptyState('Aucun utilisateur','Créez votre premier utilisateur.','users')}</td></tr>`;
      this.bindFilters();
      this.applyFilters();
    }

    bindFilters() {
      if (this.filtersBound) return;
      this.filtersBound = true;
      ['adminSearch','adminRoleFilter','adminStatusFilter'].forEach(id => document.getElementById(id)?.addEventListener(id === 'adminSearch' ? 'input' : 'change', () => this.applyFilters()));
    }

    applyFilters() {
      const query = String(document.getElementById('adminSearch')?.value || '').trim().toLowerCase();
      const role = document.getElementById('adminRoleFilter')?.value || '';
      const status = document.getElementById('adminStatusFilter')?.value || '';
      document.querySelectorAll('#usersBody tr[data-user-id]').forEach(row => {
        const visible = (!query || (row.dataset.search || '').includes(query)) && (!role || row.dataset.role === role) && (!status || row.dataset.status === status);
        row.classList.toggle('hidden', !visible);
      });
    }

    hideCreateButton() { document.getElementById('addUserBtn')?.remove(); }
    bindCreate(handler) { document.getElementById('addUserBtn')?.addEventListener('click', handler); }
    bindTableAction(handler) { document.getElementById('usersBody')?.addEventListener('click', handler); }

    openUserForm(user = {}, onSave) {
      const editing = Boolean(user.id);
      const modal = window.UI.modal({
        title: editing ? 'Modifier l’utilisateur' : 'Nouvel utilisateur', kicker: 'Gestion des comptes',
        body: `<form id="userForm" class="ui-form-grid">
          <label><span class="ui-label">Nom complet</span><input class="ui-input" name="name" value="${window.UI.esc(user.name||'')}" required></label>
          <label><span class="ui-label">Matricule</span><input class="ui-input" name="matricule" value="${window.UI.esc(user.matricule||'')}" required></label>
          <label><span class="ui-label">Identifiant</span><input class="ui-input" name="username" value="${window.UI.esc(user.username||'')}" required></label>
          ${editing ? '' : '<label><span class="ui-label">Mot de passe initial</span><input class="ui-input" type="password" name="password" minlength="6" required></label>'}
          <label><span class="ui-label">Rôle</span><select class="ui-select" name="role"><option value="user" ${user.role!=='admin'?'selected':''}>Utilisateur</option><option value="admin" ${user.role==='admin'?'selected':''}>Administrateur</option></select></label>
          ${editing ? `<label><span class="ui-label">Statut</span><select class="ui-select" name="status"><option value="active" ${user.status==='active'?'selected':''}>Actif</option><option value="disabled" ${user.status==='disabled'?'selected':''}>Désactivé</option></select></label>` : ''}
        </form>`,
        footer:`<button class="ui-btn ui-btn-secondary" data-modal-close>Annuler</button><button class="ui-btn ui-btn-primary" id="saveUser">${editing?'Enregistrer':'Créer le compte'}</button>`
      });
      modal.element.querySelector('#saveUser').addEventListener('click', async () => {
        const form = modal.element.querySelector('#userForm');
        if (!form.reportValidity()) return;
        const fd = new FormData(form);
        const payload = { id:user.id, name:fd.get('name'), matricule:fd.get('matricule'), username:fd.get('username'), password:fd.get('password'), role:fd.get('role'), status:fd.get('status') };
        const button = modal.element.querySelector('#saveUser'); button.disabled = true;
        try { await onSave(payload, editing); modal.close(); }
        catch (_) { button.disabled = false; }
      });
    }

    openPermissions(user, onSave) {
      if (user.is_owner) { window.UI.toast('Le propriétaire possède toutes les permissions.','info'); return; }
      const values = JSON.parse(JSON.stringify(user.permissions || {}));
      const modal = window.UI.modal({
        title:`Permissions — ${user.name}`, kicker:'Contrôle des accès', size:'xl',
        body:`<div class="permission-grid">${modules.map(([key,label]) => {
          const p = values[key] || {};
          return `<section class="permission-card"><div class="permission-card-head"><p class="permission-card-title">${label}</p><label class="permission-switch !border-0 !p-0">Tout autoriser <input type="checkbox" data-check-all="${key}"></label></div><div class="permission-actions">${actions.map(([action,title]) => `<label class="permission-switch"><span>${title}</span><input type="checkbox" data-module="${key}" data-action="${action}" ${p[action]?'checked':''}></label>`).join('')}</div></section>`;
        }).join('')}</div>`,
        footer:`<button class="ui-btn ui-btn-secondary" data-modal-close>Annuler</button><button class="ui-btn ui-btn-primary" id="savePermissions">Enregistrer les permissions</button>`
      });
      modal.element.querySelectorAll('[data-check-all]').forEach(toggle => toggle.addEventListener('change', () => {
        modal.element.querySelectorAll(`[data-module="${toggle.dataset.checkAll}"]`).forEach(input => input.checked = toggle.checked);
      }));
      modal.element.querySelector('#savePermissions').addEventListener('click', async () => {
        const permissions = {};
        modules.forEach(([key]) => { permissions[key] = {}; actions.forEach(([action]) => { permissions[key][action] = modal.element.querySelector(`[data-module="${key}"][data-action="${action}"]`)?.checked || false; }); });
        try { await onSave(permissions); modal.close(); } catch (_) {}
      });
    }

    openPassword(user, onSave) {
      const modal = window.UI.modal({ title:`Nouveau mot de passe — ${user.name}`, kicker:'Sécurité', body:`<label><span class="ui-label">Nouveau mot de passe</span><input id="newPassword" class="ui-input" type="password" minlength="6" placeholder="Minimum 6 caractères"></label><p class="mt-3 text-xs font-semibold text-slate-500">Toutes les sessions de cet utilisateur seront fermées.</p>`, footer:'<button class="ui-btn ui-btn-secondary" data-modal-close>Annuler</button><button class="ui-btn ui-btn-primary" id="savePassword">Réinitialiser</button>' });
      modal.element.querySelector('#savePassword').addEventListener('click', async () => {
        const input = modal.element.querySelector('#newPassword'); if (!input.reportValidity()) return;
        try { await onSave(input.value); modal.close(); } catch (_) {}
      });
    }

    async confirmDelete(user) { return window.UI.confirm({ title:'Supprimer l’utilisateur', message:`Supprimer définitivement ${user.name} ?`, confirmText:'Supprimer', danger:true }); }
  }

  window.SRM.Views.AdminView = AdminView;
})(window);
