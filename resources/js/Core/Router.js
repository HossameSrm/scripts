(function (window) {
  'use strict';

  const fallbackRoutes = [
    { href: 'dashboard.html', key: 'dashboard', module: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    { href: 'client.html', key: 'clients', module: 'clients', label: 'Clients', icon: 'client' },
    { href: 'calcul.html', key: 'calcul', module: 'calcul', label: 'Facilité de paiement', icon: 'calc' },
    { href: 'order_coupure.html', key: 'order', module: 'order', label: 'Ordre de coupure', icon: 'cut' },
    { href: 'mise_en_demeure.html', key: 'notice', module: 'notice', label: 'Mise en demeure', icon: 'letter' },
    { href: 'history.html', key: 'history', module: 'history', label: 'Historique', icon: 'history' },
    { href: 'admin.html', key: 'admin', module: 'admin', label: 'Administration', icon: 'users' },
    { href: 'about.html', key: 'about', module: 'about', label: 'À propos', icon: 'info' }
  ];

  const routes = Object.freeze([...(window.SRM_ROUTES || fallbackRoutes)]);

  class Router {
    get routes() { return routes; }

    currentKey() {
      const file = (location.pathname.split('/').pop() || '').toLowerCase();
      if (file.includes('dashboard')) return 'dashboard';
      if (file.includes('client')) return 'clients';
      if (file.includes('order')) return 'order';
      if (file.includes('mise')) return 'notice';
      if (file.includes('history')) return 'history';
      if (file.includes('admin')) return 'admin';
      if (file.includes('about')) return 'about';
      if (file.includes('calcul')) return 'calcul';
      return 'dashboard';
    }

    currentPage() { return routes.find(item => item.key === this.currentKey()) || routes[0]; }
    go(href, replace = false) { replace ? location.replace(href) : (location.href = href); }
  }

  window.SRM.Core.Router = new Router();
})(window);
