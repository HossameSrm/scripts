(function (window) {
  'use strict';
  const labels = { login:'Connexion', logout:'Déconnexion', export_pdf:'Export PDF', export_docx:'Export DOCX', save:'Enregistrement', create_user:'Création utilisateur', update_user:'Modification utilisateur', update_permissions:'Permissions', reset_password:'Mot de passe', delete_user:'Suppression utilisateur' };
  class HistoryView {
    render(rows) {
      document.getElementById('historyCount').textContent = `${rows.length} activité(s)`;
      const body = document.getElementById('historyBody');
      body.innerHTML = rows.length ? rows.map(item => `<tr><td><div class="flex items-center gap-3"><div class="ui-avatar !h-10 !w-10 !rounded-xl text-xs">${window.UI.esc((item.user_name || 'U').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase())}</div><div><p class="font-black text-slate-800">${window.UI.esc(item.user_name)}</p><p class="text-xs text-slate-400">${window.UI.formatDate(item.created_at)}</p></div></div></td><td>${window.UI.badge(labels[item.action] || item.action, item.action.includes('delete') ? 'rose' : item.action.includes('export') ? 'blue' : 'slate')}</td><td>${window.UI.esc(item.module || '—')}</td><td class="max-w-xl">${window.UI.esc(item.description)}</td></tr>`).join('') : `<tr><td colspan="4">${window.UI.emptyState('Aucune activité','Les opérations apparaîtront ici.','history')}</td></tr>`;
    }
    renderError(message) { document.getElementById('historyBody').innerHTML = `<tr><td colspan="4">${window.UI.emptyState('Erreur', message, 'warning')}</td></tr>`; }
  }
  window.SRM.Views.HistoryView = HistoryView;
})(window);
