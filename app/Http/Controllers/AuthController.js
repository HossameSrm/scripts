(function (window) {
  'use strict';
  class AuthController {
    constructor(model, view, router) { this.model = model; this.view = view; this.router = router; }
    async init() {
      if (this.model.session()) {
        try { await this.model.bootstrap(); this.router.go('dashboard.html', true); return; }
        catch (_) { await this.model.logout(); }
      }
      this.view.resetCredentials();
      this.view.bindTogglePassword(() => this.view.togglePassword());
      this.view.bindSubmit(event => this.submit(event));
    }
    async submit(event) {
      event.preventDefault();
      this.view.clearError(); this.view.setLoading(true);
      try {
        const credentials = this.view.credentials();
        const result = await this.model.login(credentials.login, credentials.password);
        if (!result.ok) throw new Error(result.message || 'Connexion impossible.');
        this.router.go('dashboard.html', true);
      } catch (error) {
        this.view.showError(this.model.error(error)); this.view.setLoading(false);
      }
    }
  }
  window.SRM.Controllers.AuthController = AuthController;
})(window);
