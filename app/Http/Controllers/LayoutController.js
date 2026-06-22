(function (window) {
  'use strict';
  class LayoutController {
    constructor(model, view, router, eventBus, documentModel) {
      this.model = model; this.view = view; this.router = router; this.eventBus = eventBus; this.documentModel = documentModel;
    }
    async init() {
      if (!this.model.session()) { this.router.go('index.html', true); return; }
      let db;
      try { db = await this.model.bootstrap(); }
      catch (error) {
        if (String(error.message).includes('SESSION_INVALID')) { this.router.go('index.html', true); return; }
        this.view.renderDatabaseError(this.model.error(error)); return;
      }
      const page = this.router.currentPage();
      const permissions = db.permissions || {};
      if (!permissions?.[page.module]?.view) { this.router.go(`403.html?page=${encodeURIComponent(page.label)}`, true); return; }
      const nodes = this.view.render({ db, user: db.user, permissions, page });
      this.bindLayout(nodes, db, page);
      this.view.applyPermissions(page, permissions);
      this.bindExportTracking(page);
      window.AppLayout = { db, user: db.user, permissions, page, showToast: window.UI.toast };
      this.eventBus.emit('app:ready', { db, user: db.user, permissions, page });
      this.selectInitialClient(db);
    }
    bindLayout({ overlay, aside }, db) {
      const close = () => { aside.classList.remove('is-open'); overlay.classList.remove('is-open'); };
      document.getElementById('sidebarToggle')?.addEventListener('click', () => { aside.classList.toggle('is-open'); overlay.classList.toggle('is-open'); });
      overlay.addEventListener('click', close);
      document.getElementById('sidebarLogout')?.addEventListener('click', async () => { await this.model.logout(); this.router.go('index.html', true); });
      document.getElementById('globalClientSelect')?.addEventListener('change', event => {
        const client = db.clients.find(item => item.id === event.currentTarget.value);
        if (!client) return;
        this.model.setLastClientId(client.id);
        this.eventBus.emit('app:client-selected', client);
        window.UI.toast(`Données de ${client.name} chargées`, 'success');
      });
    }
    bindExportTracking(page) {
      const selectedClientId = () => document.getElementById('globalClientSelect')?.value || null;
      const total = () => {
        const candidates = [window.currentData?.total, window.lastCalculation?.grandTotal, window.lastCalculation?.totalDue];
        return Number(candidates.find(value => Number.isFinite(Number(value))) || 0);
      };
      [['exportPdfBtn','pdf'],['exportDocxBtn','docx']].forEach(([id, format]) => {
        document.getElementById(id)?.addEventListener('click', () => {
          setTimeout(() => this.documentModel.recordAction({ module:page.module, format, clientId:selectedClientId(), total:total(), data:{ page:location.pathname.split('/').pop(), exported_at:new Date().toISOString() } }).catch(() => {}), 600);
        });
      });
    }
    selectInitialClient(db) {
      const select = document.getElementById('globalClientSelect'); if (!select) return;
      const initialId = this.model.lastClientId() || db.clients[0]?.id;
      if (initialId && db.clients.some(item => item.id === initialId)) { select.value = initialId; select.dispatchEvent(new Event('change')); }
    }
  }
  window.SRM.Controllers.LayoutController = LayoutController;
})(window);
