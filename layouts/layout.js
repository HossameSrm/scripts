(function () {
  'use strict';

  const Nav = window.AppNavigation;
  if (!Nav) throw new Error('NAVIGATION_COMPONENT_MISSING');

  function applyActionPermissions(page, permissions) {
    const p = permissions?.[page.module] || {};
    const pdf = document.getElementById('exportPdfBtn');
    const docx = document.getElementById('exportDocxBtn');
    if (pdf && !p.export_pdf) pdf.classList.add('hidden');
    if (docx && !p.export_docx) docx.classList.add('hidden');

    if (['calcul','order','notice'].includes(page.module) && !p.create) {
      const main = document.querySelector('main');
      if (main) {
        const note = document.createElement('div');
        note.className = 'permission-note';
        note.textContent = 'Mode consultation : vous ne disposez pas de la permission de création ou de modification.';
        main.prepend(note);
        main.querySelectorAll('input,textarea,select,button').forEach(el => {
          if (!['exportPdfBtn','exportDocxBtn'].includes(el.id)) el.disabled = true;
        });
      }
    }
  }

  async function trackExports(page, db) {
    const selectedClientId = () => document.getElementById('globalClientSelect')?.value || null;
    const total = () => {
      const candidates = [window.currentData?.total, window.lastCalculation?.grandTotal, window.lastCalculation?.totalDue];
      return Number(candidates.find(v => Number.isFinite(Number(v))) || 0);
    };
    const bind = (id, format) => {
      const button = document.getElementById(id);
      if (!button) return;
      button.addEventListener('click', () => {
        setTimeout(() => db.recordDocumentAction({
          module: page.module,
          format,
          clientId: selectedClientId(),
          total: total(),
          data: { page: location.pathname.split('/').pop(), exported_at: new Date().toISOString() }
        }).catch(() => {}), 600);
      });
    };
    bind('exportPdfBtn','pdf');
    bind('exportDocxBtn','docx');
  }

  async function init() {
    if (!window.AppDB.getSession()) {
      location.replace('index.html');
      return;
    }

    let db;
    try {
      db = await window.AppDB.load();
    } catch (error) {
      if (String(error.message).includes('SESSION_INVALID')) {
        location.replace('index.html');
        return;
      }
      document.body.innerHTML = `<main class="auth-shell"><section class="ui-panel ui-panel-body" style="max-width:640px"><div class="ui-empty"><div class="ui-empty-icon">${window.UI.icon('database')}</div><h3>Connexion à la base impossible</h3><p>${window.UI.esc(window.AppDB.friendlyError(error))}</p><a class="ui-btn ui-btn-primary" href="index.html">Retour à la connexion</a></div></section></main>`;
      return;
    }

    const page = Nav.currentPage();
    const permissions = db.permissions || {};
    if (!permissions?.[page.module]?.view) {
      location.replace(`403.html?page=${encodeURIComponent(page.label)}`);
      return;
    }

    document.body.classList.add('app-body');
    const main = document.querySelector('main');
    if (main) main.classList.add('app-main');

    const user = db.user;
    const overlay = document.createElement('div');
    overlay.className = 'app-overlay';
    overlay.id = 'appOverlay';

    const aside = document.createElement('aside');
    aside.className = 'app-sidebar flex flex-col p-4';
    aside.id = 'appSidebar';
    aside.innerHTML = Nav.renderSidebar({ db, user, permissions, page });

    const header = document.createElement('header');
    header.className = 'app-topbar px-3 sm:px-5';
    header.innerHTML = Nav.renderHeader({ db, user, permissions, page });

    document.body.prepend(header);
    document.body.prepend(aside);
    document.body.prepend(overlay);

    const closeSidebar = () => { aside.classList.remove('is-open'); overlay.classList.remove('is-open'); };
    document.getElementById('sidebarToggle')?.addEventListener('click', () => { aside.classList.toggle('is-open'); overlay.classList.toggle('is-open'); });
    overlay.addEventListener('click', closeSidebar);
    document.getElementById('sidebarLogout').addEventListener('click', async () => {
      await window.AppDB.logout();
      location.replace('index.html');
    });

    const select = document.getElementById('globalClientSelect');
    if (select) {
      select.addEventListener('change', () => {
        const client = db.clients.find(item => item.id === select.value);
        if (!client) return;
        localStorage.setItem(window.AppDB.LAST_CLIENT_KEY, client.id);
        window.dispatchEvent(new CustomEvent('app:client-selected', { detail: client }));
        window.UI.toast(`Données de ${client.name} chargées`, 'success');
      });
    }

    window.AppLayout = { db, user, permissions, page, showToast: window.UI.toast };
    applyActionPermissions(page, permissions);
    trackExports(page, window.AppDB);
    window.dispatchEvent(new CustomEvent('app:ready', { detail: { db, user, permissions, page } }));

    if (select) {
      const initialId = localStorage.getItem(window.AppDB.LAST_CLIENT_KEY) || db.clients[0]?.id;
      if (initialId && db.clients.some(item => item.id === initialId)) {
        select.value = initialId;
        select.dispatchEvent(new Event('change'));
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
