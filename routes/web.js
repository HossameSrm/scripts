(function (window) {
  'use strict';

  window.SRM_ROUTES = Object.freeze([
    { href: 'dashboard.html', key: 'dashboard', module: 'dashboard', label: 'Tableau de bord', icon: 'dashboard', page: 'Dashboard/Index' },
    { href: 'calcul.html', key: 'calcul', module: 'calcul', label: 'Facilité de paiement', icon: 'calc', page: 'Documents/PaymentSchedule' },
    { href: 'order_coupure.html', key: 'order', module: 'order', label: 'Ordre de coupure', icon: 'cut', page: 'Documents/CutOrder' },
    { href: 'mise_en_demeure.html', key: 'notice', module: 'notice', label: 'Mise en demeure', icon: 'letter', page: 'Documents/FormalNotice' },
    { href: 'history.html', key: 'history', module: 'history', label: 'Historique', icon: 'history', page: 'History/Index' },
    { href: 'admin.html', key: 'admin', module: 'admin', label: 'Administration', icon: 'users', page: 'Admin/Users' },
    { href: 'about.html', key: 'about', module: 'about', label: 'À propos', icon: 'info', page: 'About/Index' }
  ]);
})(window);
