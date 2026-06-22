(function () {
  'use strict';

  async function init() {
    if (window.AppDB.getSession()) {
      try {
        await window.AppDB.bootstrap();
        location.replace('dashboard.html');
        return;
      } catch (_) {
        await window.AppDB.logout();
      }
    }

    const configWarning = document.getElementById('configWarning');
    if (!window.AppDB.configured()) configWarning?.classList.remove('hidden');

    const form = document.getElementById('loginForm');
    const error = document.getElementById('loginError');
    const button = document.getElementById('loginButton');
    const password = document.getElementById('password');
    document.getElementById('togglePassword')?.addEventListener('click', () => {
      password.type = password.type === 'password' ? 'text' : 'password';
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      error.classList.add('hidden');
      button.disabled = true;
      button.innerHTML = 'Connexion en cours...';
      try {
        const result = await window.AppDB.login(document.getElementById('username').value, password.value);
        if (result.ok) location.replace('dashboard.html');
        else throw new Error(result.message || 'Connexion impossible.');
      } catch (err) {
        error.textContent = window.AppDB.friendlyError(err);
        error.classList.remove('hidden');
        button.disabled = false;
        button.innerHTML = 'Se connecter';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
