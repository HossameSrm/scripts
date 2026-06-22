(function (window) {
  'use strict';

  window.SRM.Pages?.register('History/Index', { layout: 'AppLayout', title: 'Historique', module: 'history' });


  const labels = {
    login:'Connexion', logout:'Déconnexion', export_pdf:'Export PDF', export_docx:'Export DOCX', save:'Enregistrement',
    create_user:'Création utilisateur', update_user:'Modification utilisateur', update_permissions:'Permissions',
    reset_password:'Mot de passe', delete_user:'Suppression utilisateur'
  };

  class HistoryView {
    render(rows) {
      this.rows = Array.isArray(rows) ? rows : [];
      document.getElementById('historyLoginCount').textContent = this.rows.filter(item => ['login','logout'].includes(item.action)).length;
      document.getElementById('historyExportCount').textContent = this.rows.filter(item => String(item.action).includes('export')).length;
      document.getElementById('historyAdminCount').textContent = this.rows.filter(item => item.module === 'admin').length;
      this.bindFilters();
      this.applyFilters();
    }

    bindFilters() {
      if (this.filtersBound) return;
      this.filtersBound = true;
      document.getElementById('historySearch')?.addEventListener('input', () => this.applyFilters());
      document.getElementById('historyModuleFilter')?.addEventListener('change', () => this.applyFilters());
    }

    applyFilters() {
      const query = String(document.getElementById('historySearch')?.value || '').trim().toLowerCase();
      const module = document.getElementById('historyModuleFilter')?.value || '';
      const filtered = this.rows.filter(item => {
        const haystack = `${item.user_name || ''} ${item.description || ''} ${item.action || ''} ${item.module || ''}`.toLowerCase();
        return (!query || haystack.includes(query)) && (!module || item.module === module);
      });
      document.getElementById('historyCount').textContent = `${filtered.length} activité(s)`;
      this.renderRows(filtered);
    }

    renderRows(rows) {
      const body = document.getElementById('historyBody');
      body.innerHTML = rows.length ? rows.map(item => `<tr>
        <td><div class="flex items-center gap-3"><div class="ui-avatar !h-10 !w-10 !rounded-xl text-xs">${window.UI.esc((item.user_name || 'U').split(/\s+/).slice(0,2).map(part => part[0]).join('').toUpperCase())}</div><div><p class="font-black text-slate-800">${window.UI.esc(item.user_name)}</p><p class="text-xs text-slate-400">${window.UI.formatDate(item.created_at)}</p></div></div></td>
        <td>${window.UI.badge(labels[item.action] || item.action, String(item.action).includes('delete') ? 'rose' : String(item.action).includes('export') ? 'blue' : item.action === 'login' ? 'emerald' : 'slate')}</td>
        <td>${window.UI.badge(item.module || 'système', 'violet')}</td>
        <td class="max-w-xl">${window.UI.esc(item.description)}</td>
      </tr>`).join('') : `<tr><td colspan="4">${window.UI.emptyState('Aucune activité','Aucun résultat ne correspond aux filtres.','history')}</td></tr>`;
    }

    renderError(message) {
      document.getElementById('historyBody').innerHTML = `<tr><td colspan="4">${window.UI.emptyState('Erreur', message, 'warning')}</td></tr>`;
    }
  }

  window.SRM.Views.HistoryView = HistoryView;
})(window);
