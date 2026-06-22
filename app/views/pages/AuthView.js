(function (window) {
  'use strict';
  class AuthView {
    elements() {
      return {
        form: document.getElementById('loginForm'), error: document.getElementById('loginError'),
        button: document.getElementById('loginButton'), password: document.getElementById('password'),
        username: document.getElementById('username'), warning: document.getElementById('configWarning'),
        toggle: document.getElementById('togglePassword')
      };
    }
    showConfigWarning() { this.elements().warning?.classList.remove('hidden'); }
    bindTogglePassword(handler) { this.elements().toggle?.addEventListener('click', handler); }
    bindSubmit(handler) { this.elements().form?.addEventListener('submit', handler); }
    togglePassword() { const p = this.elements().password; if (p) p.type = p.type === 'password' ? 'text' : 'password'; }
    credentials() { const e = this.elements(); return { login: e.username?.value || '', password: e.password?.value || '' }; }
    setLoading(loading) { const b = this.elements().button; if (!b) return; b.disabled = loading; b.textContent = loading ? 'Connexion en cours...' : 'Se connecter'; }
    showError(message) { const e = this.elements().error; if (!e) return; e.textContent = message; e.classList.remove('hidden'); }
    clearError() { this.elements().error?.classList.add('hidden'); }
  }
  window.SRM.Views.AuthView = AuthView;
})(window);
