(function (window) {
  'use strict';

  window.SRM.Pages?.register('Dashboard/Index', { layout: 'AppLayout', title: 'Tableau de bord', module: 'dashboard' });

  class DashboardView {
    metricCard(item) {
      return `<article class="metronic-metric-card"><div class="metronic-metric-icon tone-${item.tone}">${window.UI.icon(item.icon)}</div><div><strong>${window.UI.esc(item.value)}</strong><span>${window.UI.esc(item.label)}</span><small>${window.UI.esc(item.note)}</small></div></article>`;
    }

    activitySeries(recent) {
      const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(); date.setHours(0,0,0,0); date.setDate(date.getDate() - (6 - index)); return date;
      });
      return days.map(day => ({
        label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day).replace('.', ''),
        value: recent.filter(item => {
          const date = new Date(item.created_at); return date.toDateString() === day.toDateString();
        }).length
      }));
    }

    chart(series) {
      const width = 680, height = 220, padX = 30, padY = 26;
      const max = Math.max(3, ...series.map(item => item.value));
      const points = series.map((item, index) => {
        const x = padX + index * ((width - padX * 2) / Math.max(1, series.length - 1));
        const y = height - padY - (item.value / max) * (height - padY * 2);
        return { ...item, x, y };
      });
      const polyline = points.map(point => `${point.x},${point.y}`).join(' ');
      const area = `${padX},${height-padY} ${polyline} ${width-padX},${height-padY}`;
      return `<div class="metronic-chart-summary"><div><span>Total opérations</span><strong>${series.reduce((sum,item)=>sum+item.value,0)}</strong></div><small>Activité enregistrée automatiquement</small></div>
        <svg class="metronic-line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Activité des sept derniers jours">
          <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1b84ff" stop-opacity=".22"/><stop offset="1" stop-color="#1b84ff" stop-opacity="0"/></linearGradient></defs>
          ${[0,1,2,3].map(i=>`<line x1="${padX}" y1="${padY+i*(height-padY*2)/3}" x2="${width-padX}" y2="${padY+i*(height-padY*2)/3}" stroke="#f1f1f4"/>`).join('')}
          <polygon points="${area}" fill="url(#chartFill)"/>
          <polyline points="${polyline}" fill="none" stroke="#1b84ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          ${points.map(point=>`<circle cx="${point.x}" cy="${point.y}" r="4" fill="#fff" stroke="#1b84ff" stroke-width="3"/><text x="${point.x}" y="${height-5}" text-anchor="middle" fill="#99a1b7" font-size="10">${point.label}</text>`).join('')}
        </svg>`;
    }

    render(data, permissions) {
      const stats = data.stats || {};
      const recent = data.recent || [];
      const sessionUser = window.SRM.Models.database.getSession()?.user || {};
      const firstName = String(sessionUser.name || 'Utilisateur').trim().split(/\s+/)[0];
      document.getElementById('dashboardGreeting').textContent = `Bonjour ${firstName}`;

      const actions = [
        { module:'clients', href:'client.html', icon:'client', title:'Clients', text:'Clients, contrats et arriérés.' },
        { module:'calcul', href:'calcul.html', icon:'calc', title:'Facilité de paiement', text:'Engagement et échéancier.' },
        { module:'order', href:'order_coupure.html', icon:'cut', title:'Ordre de coupure', text:'Contrats et situation des arriérés.' },
        { module:'notice', href:'mise_en_demeure.html', icon:'letter', title:'Mise en demeure', text:'Lettre officielle personnalisée.' }
      ].filter(item => permissions?.[item.module]?.view);

      document.getElementById('heroActions').innerHTML = actions.slice(0,2).map((item,index)=>`<a class="ui-btn ${index===0?'ui-btn-primary':'ui-btn-secondary'}" href="${item.href}">${window.UI.icon(item.icon)} ${item.title}</a>`).join('');
      document.getElementById('statsGrid').innerHTML = [
        { label:'Clients actifs',value:stats.clients??0,icon:'client',tone:'blue',note:'Référentiel partagé' },
        { label:'Contrats',value:stats.contracts??0,icon:'contract',tone:'violet',note:'EAU · BT · MT' },
        { label:'Documents',value:stats.documents??0,icon:'file',tone:'emerald',note:'Exports enregistrés' },
        { label:'Utilisateurs',value:stats.users??0,icon:'users',tone:'amber',note:`${stats.activeUsers??0} compte(s) actif(s)` }
      ].map(item=>this.metricCard(item)).join('');

      document.getElementById('highlights').innerHTML = `<div class="metronic-highlight-total"><span>Référentiel opérationnel</span><strong>${stats.clients ?? 0} clients</strong><small>et ${stats.contracts ?? 0} contrats centralisés</small></div>
        <div class="metronic-progress-line"><span style="width:${Math.min(100,(stats.contracts||0)*8+20)}%"></span></div>
        <div class="metronic-highlight-list">
          <div><span><i class="dot-blue"></i>Clients</span><strong>${stats.clients??0}</strong></div>
          <div><span><i class="dot-violet"></i>Contrats</span><strong>${stats.contracts??0}</strong></div>
          <div><span><i class="dot-green"></i>Documents</span><strong>${stats.documents??0}</strong></div>
          <div><span><i class="dot-amber"></i>Utilisateurs actifs</span><strong>${stats.activeUsers??0}</strong></div>
        </div>`;
      document.getElementById('activityChart').innerHTML = this.chart(this.activitySeries(recent));

      document.getElementById('quickActions').innerHTML = actions.length ? actions.map(item=>`<a href="${item.href}" class="quick-action"><div class="quick-action-icon">${window.UI.icon(item.icon)}</div><div class="min-w-0"><p class="quick-action-title">${item.title}</p><p class="quick-action-text">${item.text}</p></div><span class="dashboard-action-arrow">→</span></a>`).join('') : window.UI.emptyState('Aucun module disponible','Contactez votre administrateur.');
      document.getElementById('recentActivity').innerHTML = recent.length ? recent.slice(0,6).map(item=>`<div class="ui-list-item"><div class="ui-list-icon">${window.UI.icon(item.action==='login'?'user':item.module==='clients'?'client':item.action?.includes('export')?'file':'history')}</div><div class="min-w-0 flex-1"><p class="ui-list-title">${window.UI.esc(item.description)}</p><p class="ui-list-text">${window.UI.esc(item.user_name)} · ${window.UI.formatDate(item.created_at)}</p></div>${window.UI.badge(item.module||'système','slate')}</div>`).join('') : window.UI.emptyState('Aucune activité','Les activités apparaîtront ici.','history');
      document.getElementById('dashboardRoot')?.classList.remove('opacity-0');
    }

    renderError(message) {
      document.getElementById('recentActivity').innerHTML = window.UI.emptyState('Erreur de chargement', message, 'warning');
      document.getElementById('dashboardRoot')?.classList.remove('opacity-0');
    }
  }

  window.SRM.Views.DashboardView = DashboardView;
})(window);
