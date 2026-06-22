(function () {
  'use strict';

  async function init() {
    if (window.AppDB.getSession()) {
      location.replace('calcul.html');
      return;
    }
    const db = await window.AppDB.load();
    document.getElementById('appName').textContent = db.app.name;
    document.getElementById('departmentName').textContent = db.app.department;

    const form = document.getElementById('loginForm');
    const error = document.getElementById('loginError');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      error.classList.add('hidden');
      const button = document.getElementById('loginButton');
      button.disabled = true;
      button.textContent = 'Connexion...';
      const session = await window.AppDB.login(document.getElementById('username').value, document.getElementById('password').value);
      if (session) location.replace('calcul.html');
      else {
        error.textContent = 'Identifiant ou mot de passe incorrect.';
        error.classList.remove('hidden');
        button.disabled = false;
        button.textContent = 'Se connecter';
      }
    });
  }
  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
