(function () {
  'use strict';

  const modules = [
    ['dashboard','Tableau de bord'],['calcul','Facilité de paiement'],['order','Ordre de coupure'],
    ['notice','Mise en demeure'],['history','Historique'],['admin','Administration'],['about','À propos']
  ];
  const actions = [['view','Accès'],['create','Créer'],['edit','Modifier'],['delete','Supprimer'],['export_pdf','PDF'],['export_docx','DOCX']];
  let users = [];

  function initials(name) { return String(name||'U').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }
  function can(action) { return Boolean(window.AppLayout.permissions?.admin?.[action]); }

  function renderStats() {
    const total = users.length;
    const active = users.filter(u=>u.status==='active').length;
    const admins = users.filter(u=>u.role==='admin').length;
    const disabled = total-active;
    document.getElementById('adminStats').innerHTML = [
      {label:'Utilisateurs',value:total,icon:'users',tone:'blue',note:'Tous les comptes'},
      {label:'Actifs',value:active,icon:'check',tone:'emerald',note:'Accès autorisé'},
      {label:'Administrateurs',value:admins,icon:'shield',tone:'violet',note:'Gestion avancée'},
      {label:'Désactivés',value:disabled,icon:'warning',tone:'rose',note:'Accès bloqué'}
    ].map(window.UI.statCard).join('');
  }

  function renderTable() {
    const body = document.getElementById('usersBody');
    body.innerHTML = users.length ? users.map(user => `
      <tr data-user-id="${user.id}">
        <td><div class="flex items-center gap-3"><div class="ui-avatar">${initials(user.name)}</div><div><p class="font-black text-slate-900">${window.UI.esc(user.name)} ${user.is_owner ? window.UI.badge('Propriétaire','violet') : ''}</p><p class="mt-1 text-xs font-semibold text-slate-400">@${window.UI.esc(user.username)}</p></div></div></td>
        <td><span class="font-black text-slate-700">${window.UI.esc(user.matricule)}</span></td>
        <td>${window.UI.badge(user.role==='admin'?'Administrateur':'Utilisateur',user.role==='admin'?'blue':'slate')}</td>
        <td>${window.UI.badge(user.status==='active'?'Actif':'Désactivé',user.status==='active'?'emerald':'rose')}</td>
        <td><span class="text-sm font-semibold text-slate-500">${window.UI.formatDate(user.last_login_at)}</span></td>
        <td><div class="ui-actions">
          ${can('edit') ? `<button class="ui-icon-button" title="Modifier" data-action="edit">${window.UI.icon('edit')}</button><button class="ui-icon-button" title="Permissions" data-action="permissions">${window.UI.icon('shield')}</button><button class="ui-icon-button" title="Mot de passe" data-action="password">${window.UI.icon('key')}</button>` : ''}
          ${can('delete') && !user.is_owner ? `<button class="ui-icon-button !text-red-600 !bg-red-50" title="Supprimer" data-action="delete">${window.UI.icon('trash')}</button>` : ''}
        </div></td>
      </tr>`).join('') : `<tr><td colspan="6">${window.UI.emptyState('Aucun utilisateur','Créez votre premier utilisateur.','users')}</td></tr>`;
  }

  async function loadUsers() {
    try {
      users = await window.AppDB.adminListUsers();
      renderStats(); renderTable();
    } catch (error) { window.UI.toast(window.AppDB.friendlyError(error),'error'); }
  }

  function userForm(user = {}) {
    const editing = Boolean(user.id);
    const m = window.UI.modal({
      title: editing ? 'Modifier l’utilisateur' : 'Nouvel utilisateur',
      kicker: 'Gestion des comptes',
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
    m.element.querySelector('#saveUser').addEventListener('click', async () => {
      const form = m.element.querySelector('#userForm');
      if (!form.reportValidity()) return;
      const fd = new FormData(form); const btn=m.element.querySelector('#saveUser'); btn.disabled=true;
      try {
        if (editing) await window.AppDB.adminUpdateUser({ id:user.id,name:fd.get('name'),matricule:fd.get('matricule'),username:fd.get('username'),role:fd.get('role'),status:fd.get('status') });
        else await window.AppDB.adminCreateUser({ name:fd.get('name'),matricule:fd.get('matricule'),username:fd.get('username'),password:fd.get('password'),role:fd.get('role') });
        m.close(); window.UI.toast(editing?'Utilisateur modifié.':'Utilisateur créé.','success'); await loadUsers();
      } catch(error){ btn.disabled=false; window.UI.toast(window.AppDB.friendlyError(error),'error'); }
    });
  }

  function permissionsForm(user) {
    if (user.is_owner) { window.UI.toast('Le propriétaire possède toutes les permissions.','info'); return; }
    const values = JSON.parse(JSON.stringify(user.permissions || {}));
    const m = window.UI.modal({
      title:`Permissions — ${user.name}`, kicker:'Contrôle des accès', size:'xl',
      body:`<div class="permission-grid">${modules.map(([key,label])=>{
        const p=values[key]||{};
        return `<section class="permission-card"><div class="permission-card-head"><p class="permission-card-title">${label}</p><label class="permission-switch !border-0 !p-0">Tout autoriser <input type="checkbox" data-check-all="${key}"></label></div><div class="permission-actions">${actions.map(([action,title])=>`<label class="permission-switch"><span>${title}</span><input type="checkbox" data-module="${key}" data-action="${action}" ${p[action]?'checked':''}></label>`).join('')}</div></section>`;
      }).join('')}</div>`,
      footer:`<button class="ui-btn ui-btn-secondary" data-modal-close>Annuler</button><button class="ui-btn ui-btn-primary" id="savePermissions">Enregistrer les permissions</button>`
    });
    m.element.querySelectorAll('[data-check-all]').forEach(toggle=>toggle.addEventListener('change',()=>{
      m.element.querySelectorAll(`[data-module="${toggle.dataset.checkAll}"]`).forEach(input=>input.checked=toggle.checked);
    }));
    m.element.querySelector('#savePermissions').addEventListener('click',async()=>{
      const permissions={}; modules.forEach(([key])=>{permissions[key]={}; actions.forEach(([action])=>{permissions[key][action]=m.element.querySelector(`[data-module="${key}"][data-action="${action}"]`)?.checked||false;});});
      try { await window.AppDB.adminSetPermissions(user.id,permissions); m.close(); window.UI.toast('Permissions enregistrées.','success'); await loadUsers(); }
      catch(error){ window.UI.toast(window.AppDB.friendlyError(error),'error'); }
    });
  }

  function passwordForm(user) {
    const m=window.UI.modal({ title:`Nouveau mot de passe — ${user.name}`, kicker:'Sécurité', body:`<label><span class="ui-label">Nouveau mot de passe</span><input id="newPassword" class="ui-input" type="password" minlength="6" placeholder="Minimum 6 caractères"></label><p class="mt-3 text-xs font-semibold text-slate-500">Toutes les sessions de cet utilisateur seront fermées.</p>`, footer:'<button class="ui-btn ui-btn-secondary" data-modal-close>Annuler</button><button class="ui-btn ui-btn-primary" id="savePassword">Réinitialiser</button>' });
    m.element.querySelector('#savePassword').addEventListener('click',async()=>{ const input=m.element.querySelector('#newPassword'); if(!input.reportValidity())return; try{await window.AppDB.adminResetPassword(user.id,input.value);m.close();window.UI.toast('Mot de passe réinitialisé.','success');}catch(error){window.UI.toast(window.AppDB.friendlyError(error),'error');} });
  }

  async function handleAction(event) {
    const button=event.target.closest('[data-action]'); if(!button)return;
    const row=button.closest('[data-user-id]'); const user=users.find(u=>u.id===row.dataset.userId); if(!user)return;
    if(button.dataset.action==='edit')userForm(user);
    if(button.dataset.action==='permissions')permissionsForm(user);
    if(button.dataset.action==='password')passwordForm(user);
    if(button.dataset.action==='delete'){
      const ok=await window.UI.confirm({title:'Supprimer l’utilisateur',message:`Supprimer définitivement ${user.name} ?`,confirmText:'Supprimer',danger:true});
      if(!ok)return; try{await window.AppDB.adminDeleteUser(user.id);window.UI.toast('Utilisateur supprimé.','success');await loadUsers();}catch(error){window.UI.toast(window.AppDB.friendlyError(error),'error');}
    }
  }

  function init() {
    document.getElementById('addUserBtn')?.addEventListener('click',()=>userForm());
    document.getElementById('usersBody')?.addEventListener('click',handleAction);
    if(!can('create')) document.getElementById('addUserBtn')?.remove();
    loadUsers();
  }
  window.addEventListener('app:ready',init,{once:true});
})();
