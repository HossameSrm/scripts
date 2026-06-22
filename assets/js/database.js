(function () {
  'use strict';

  const FALLBACK = {
    app: { name: 'SRM-FM Documents', department: 'Direction Clientèle — Département Grands Comptes', version: '1.0.0', defaultCity: 'FES', creditor: 'SRM-FM' },
    users: [{ id: 1, username: 'admin', password: 'admin123', name: 'Hossame El Bezzari', matricule: '2373', role: 'Administrateur' }],
    clients: [
      {
        id: 'CLI-001', clientNumber: '1002458', type: 'company', name: 'HOTEL OLYMPIC', cin: '', phone: '0535 00 00 01', representedBy: 'M. RESPONSABLE HOTEL OLYMPIC', address: '9 AVENUE HOUMANE FATOUAKI', city: 'FES', tourne: 'T-12',
        contracts: [
          { number: '0694068', address: '9 AVENUE HOUMANE FATOUAKI, FES', serviceCode: 'EAU', serviceLabel: 'Factures de consommation Eau Potable Assainissement', balance: 1380.99, arrears: [{ invoice: '205445025', product: '03/2026', balance: 680.99 }, { invoice: '205778142', product: '04/2026', balance: 700 }] },
          { number: '1387132', address: 'CENTRE VILLE, FES', serviceCode: 'BT', serviceLabel: 'Factures de consommation Electricité Basse Tension', balance: 19151.66, arrears: [{ invoice: '202243117', product: '01/2026', balance: 9550 }, { invoice: '202557314', product: '02/2026', balance: 9601.66 }] }
        ]
      },
      {
        id: 'CLI-002', clientNumber: '1003871', type: 'person', name: 'MOHAMED EL AMRANI', cin: 'AB123456', phone: '0612 34 56 78', representedBy: 'MOHAMED EL AMRANI', address: '12 RUE IBN KHALDOUN', city: 'MEKNES', tourne: 'T-07',
        contracts: [{ number: '0755123', address: '12 RUE IBN KHALDOUN, MEKNES', serviceCode: 'EAU', serviceLabel: 'Factures de consommation Eau Potable Assainissement', balance: 2450.50, arrears: [{ invoice: '301245789', product: '02/2026', balance: 1200.50 }, { invoice: '301689745', product: '03/2026', balance: 1250 }] }]
      }
    ]
  };

  const DB_CACHE_KEY = 'srm_database_cache_v1';
  const SESSION_KEY = 'srm_session_v1';

  async function load() {
    if (window.__SRM_DATABASE__) return window.__SRM_DATABASE__;
    try {
      const response = await fetch('database.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('database.json inaccessible');
      const data = await response.json();
      window.__SRM_DATABASE__ = data;
      localStorage.setItem(DB_CACHE_KEY, JSON.stringify(data));
      return data;
    } catch (error) {
      try {
        const cached = JSON.parse(localStorage.getItem(DB_CACHE_KEY) || 'null');
        if (cached?.users && cached?.clients) {
          window.__SRM_DATABASE__ = cached;
          return cached;
        }
      } catch (_) {}
      console.warn('Utilisation des données de secours. Servez le dossier via GitHub Pages pour charger directement database.json.', error);
      window.__SRM_DATABASE__ = FALLBACK;
      return FALLBACK;
    }
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch (_) { return null; }
  }

  async function login(username, password) {
    const db = await load();
    const normalized = String(username || '').trim().toLowerCase();
    const user = db.users.find(item => String(item.username).toLowerCase() === normalized && String(item.password) === String(password));
    if (!user) return null;
    const session = { id: user.id, username: user.username, name: user.name, role: user.role, matricule: user.matricule, loginAt: new Date().toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function logout() { localStorage.removeItem(SESSION_KEY); }
  function findClient(id) { return window.__SRM_DATABASE__?.clients?.find(client => client.id === id) || null; }

  window.AppDB = { load, login, logout, getSession, findClient, SESSION_KEY };
})();
