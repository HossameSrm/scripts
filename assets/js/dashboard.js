(function () {
  'use strict';

  async function render() {
    const root = document.getElementById('dashboardRoot');
    try {
      const data = await window.AppDB.dashboard();
      const s = data.stats || {};
      document.getElementById('statsGrid').innerHTML = [
        { label: 'Utilisateurs', value: s.users ?? 0, icon: 'users', tone: 'blue', note: `${s.activeUsers ?? 0} actif(s)` },
        { label: 'Clients', value: s.clients ?? 0, icon: 'client', tone: 'cyan', note: 'Base clients active' },
        { label: 'Contrats', value: s.contracts ?? 0, icon: 'contract', tone: 'violet', note: 'Tous services confondus' },
        { label: 'Documents', value: s.documents ?? 0, icon: 'file', tone: 'emerald', note: 'Documents enregistrés' }
      ].map(window.UI.statCard).join('');

      const allowed = window.AppLayout.permissions;
      const actions = [
        { module:'calcul', href:'calcul.html', icon:'calc', title:'Facilité de paiement', text:'Préparer un échéancier de paiement.' },
        { module:'order', href:'order_coupure.html', icon:'cut', title:'Ordre de coupure', text:'Générer un ordre de coupure.' },
        { module:'notice', href:'mise_en_demeure.html', icon:'letter', title:'Mise en demeure', text:'Créer une lettre de mise en demeure.' }
      ].filter(item => allowed?.[item.module]?.view);
      document.getElementById('quickActions').innerHTML = actions.length ? actions.map(item => `
        <a href="${item.href}" class="quick-action"><div class="quick-action-icon">${window.UI.icon(item.icon)}</div><div><p class="quick-action-title">${item.title}</p><p class="quick-action-text">${item.text}</p></div></a>`).join('') : window.UI.emptyState('Aucun module disponible','Contactez votre administrateur pour obtenir un accès.');

      const recent = data.recent || [];
      document.getElementById('recentActivity').innerHTML = recent.length ? recent.map(item => `
        <div class="ui-list-item"><div class="ui-list-icon">${window.UI.icon(item.action === 'login' ? 'user' : 'history')}</div><div class="min-w-0 flex-1"><p class="ui-list-title">${window.UI.esc(item.description)}</p><p class="ui-list-text">${window.UI.esc(item.user_name)} · ${window.UI.formatDate(item.created_at)}</p></div>${window.UI.badge(item.module || 'système','slate')}</div>`).join('') : window.UI.emptyState('Aucune activité','Les activités récentes apparaîtront ici.','history');
      root.classList.remove('opacity-0');
    } catch (error) {
      document.getElementById('recentActivity').innerHTML = window.UI.emptyState('Erreur de chargement',window.AppDB.friendlyError(error),'warning');
    }
  }

  window.addEventListener('app:ready', render, { once:true });
})();
