(function (window) {
  'use strict';

  window.SRM.Pages?.register('Auth/Login', { layout: 'AuthLayout', title: 'Connexion', module: 'auth' });


  class AuthView {
    elements() {
      return {
        form: document.getElementById('loginForm'),
        error: document.getElementById('loginError'),
        button: document.getElementById('loginButton'),
        password: document.getElementById('password'),
        username: document.getElementById('username'),
        toggle: document.getElementById('togglePassword')
      };
    }

    resetCredentials() {
      const elements = this.elements();
      if (elements.username) elements.username.value = '';
      if (elements.password) elements.password.value = '';
      window.setTimeout(() => {
        const current = this.elements();
        if (current.username) current.username.value = '';
        if (current.password) current.password.value = '';
      }, 120);
    }

    bindTogglePassword(handler) { this.elements().toggle?.addEventListener('click', handler); }
    bindSubmit(handler) { this.elements().form?.addEventListener('submit', handler); }

    togglePassword() {
      const password = this.elements().password;
      const toggle = this.elements().toggle;
      if (!password) return;
      password.type = password.type === 'password' ? 'text' : 'password';
      if (toggle) toggle.textContent = password.type === 'password' ? 'Afficher' : 'Masquer';
    }

    credentials() {
      const elements = this.elements();
      return { login: elements.username?.value || '', password: elements.password?.value || '' };
    }

    setLoading(loading) {
      const button = this.elements().button;
      if (!button) return;
      button.disabled = loading;
      button.textContent = loading ? 'Connexion en cours…' : 'Ouvrir mon espace';
    }

    showError(message) {
      const error = this.elements().error;
      if (!error) return;
      error.textContent = message;
      error.classList.remove('hidden');
    }

    clearError() { this.elements().error?.classList.add('hidden'); }
  }

  window.SRM.Views.AuthView = AuthView;
})(window);
