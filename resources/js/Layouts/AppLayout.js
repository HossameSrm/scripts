(function (window) {
  'use strict';

  class AppLayoutView {
    constructor(navigationView) { this.navigationView = navigationView; }

    render({ db, user, permissions, page }) {
      document.body.classList.add('app-body');
      document.querySelector('main')?.classList.add('app-main');

      const overlay = document.createElement('div');
      overlay.className = 'app-overlay';
      overlay.id = 'appOverlay';

      const aside = document.createElement('aside');
      aside.className = 'app-sidebar';
      aside.id = 'appSidebar';
      aside.innerHTML = this.navigationView.renderSidebar({ db, user, permissions, page });

      const header = document.createElement('header');
      header.className = 'app-topbar';
      header.innerHTML = this.navigationView.renderHeader({ db, user, permissions, page });

      const footer = document.createElement('footer');
      footer.className = 'app-footer';
      footer.innerHTML = `<span>© 2026 SRM Workspace</span><span>Développé par <strong>Hossame El Bezzari</strong> · Matricule 2373</span>`;

      document.body.prepend(header);
      document.body.prepend(aside);
      document.body.prepend(overlay);
      document.body.appendChild(footer);
      document.body.dataset.layout = 'metronic-demo1-inspired';

      document.getElementById('sidebarCollapse')?.addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
      return { overlay, aside, header, footer };
    }

    renderDatabaseError(message) {
      document.body.innerHTML = `<main class="auth-shell"><section class="ui-panel ui-panel-body" style="max-width:640px"><div class="ui-empty"><div class="ui-empty-icon">${window.UI.icon('database')}</div><h3>Connexion à la base impossible</h3><p>${window.UI.esc(message)}</p><a class="ui-btn ui-btn-primary" href="index.html">Retour à la connexion</a></div></section></main>`;
    }

    applyPermissions(page, permissions) {
      const p = permissions?.[page.module] || {};
      const pdf = document.getElementById('exportPdfBtn');
      const docx = document.getElementById('exportDocxBtn');
      if (pdf && !p.export_pdf) pdf.classList.add('hidden');
      if (docx && !p.export_docx) docx.classList.add('hidden');

      if (['calcul', 'order', 'notice'].includes(page.module) && !p.create) {
        const main = document.querySelector('main');
        if (!main) return;
        const note = document.createElement('div');
        note.className = 'permission-note';
        note.innerHTML = `<strong>Mode consultation</strong><span>Vous ne disposez pas de la permission de création ou de modification.</span>`;
        main.prepend(note);
        main.querySelectorAll('input,textarea,select,button').forEach(element => {
          if (!['exportPdfBtn', 'exportDocxBtn', 'sidebarToggle', 'sidebarLogout'].includes(element.id)) element.disabled = true;
        });
      }
    }
  }

  window.SRM.Views.AppLayoutView = AppLayoutView;
})(window);
