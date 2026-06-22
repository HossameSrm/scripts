(function (window) {
  'use strict';

  window.SRM.Pages?.register('Dashboard/Index', { layout: 'AppLayout', title: 'Tableau de bord', module: 'dashboard' });


  class DashboardView {
    render(data, permissions) {
      const stats = data.stats || {};
      const sessionUser = window.SRM.Models.database.getSession()?.user || {};
      const firstName = String(sessionUser.name || 'Utilisateur').trim().split(/\s+/)[0];
      const greeting = document.getElementById('dashboardGreeting');
      if (greeting) greeting.textContent = `Bonjour ${firstName}.`;

      const actions = [
        { module:'calcul', href:'calcul.html', icon:'calc', title:'Facilité de paiement', text:'Créer un engagement et calculer les échéances.', accent:'indigo' },
        { module:'order', href:'order_coupure.html', icon:'cut', title:'Ordre de coupure', text:'Préparer un ordre avec contrats et arriérés.', accent:'cyan' },
        { module:'notice', href:'mise_en_demeure.html', icon:'letter', title:'Mise en demeure', text:'Générer une lettre personnalisée et officielle.', accent:'violet' }
      ].filter(item => permissions?.[item.module]?.view);

      document.getElementById('heroActions').innerHTML = actions.slice(0,2).map((item,index) => `<a class="ui-btn ${index === 0 ? 'ui-btn-primary' : 'ui-btn-secondary'}" href="${item.href}">${window.UI.icon(item.icon)} ${index === 0 ? 'Créer maintenant' : item.title}</a>`).join('');

      document.getElementById('statsGrid').innerHTML = [
        { label: 'Utilisateurs', value: stats.users ?? 0, icon: 'users', tone: 'blue', note: `${stats.activeUsers ?? 0} compte(s) actif(s)` },
        { label: 'Clients', value: stats.clients ?? 0, icon: 'client', tone: 'cyan', note: 'Référentiel centralisé' },
        { label: 'Contrats', value: stats.contracts ?? 0, icon: 'contract', tone: 'violet', note: 'EAU, BT et MT' },
        { label: 'Documents', value: stats.documents ?? 0, icon: 'file', tone: 'emerald', note: 'Documents enregistrés' }
      ].map(window.UI.statCard).join('');

      document.getElementById('quickActions').innerHTML = actions.length
        ? actions.map(item => `<a href="${item.href}" class="quick-action dashboard-action-${item.accent}"><div class="quick-action-icon">${window.UI.icon(item.icon)}</div><div class="min-w-0"><p class="quick-action-title">${item.title}</p><p class="quick-action-text">${item.text}</p></div><span class="dashboard-action-arrow">→</span></a>`).join('')
        : window.UI.emptyState('Aucun module disponible', 'Contactez votre administrateur pour obtenir un accès.');

      const recent = data.recent || [];
      document.getElementById('recentActivity').innerHTML = recent.length
        ? recent.slice(0,6).map(item => `<div class="ui-list-item"><div class="ui-list-icon">${window.UI.icon(item.action === 'login' ? 'user' : item.action?.includes('export') ? 'file' : 'history')}</div><div class="min-w-0 flex-1"><p class="ui-list-title">${window.UI.esc(item.description)}</p><p class="ui-list-text">${window.UI.esc(item.user_name)} · ${window.UI.formatDate(item.created_at)}</p></div>${window.UI.badge(item.module || 'système', 'slate')}</div>`).join('')
        : window.UI.emptyState('Aucune activité', 'Les activités récentes apparaîtront ici.', 'history');

      document.getElementById('dashboardRoot')?.classList.remove('opacity-0');
    }

    renderError(message) {
      document.getElementById('recentActivity').innerHTML = window.UI.emptyState('Erreur de chargement', message, 'warning');
      document.getElementById('dashboardRoot')?.classList.remove('opacity-0');
    }
  }

  window.SRM.Views.DashboardView = DashboardView;
})(window);
