(function (window) {
  'use strict';

  class AuthLayout {
    static render() {
      document.body.className = 'auth-body text-slate-800';
      const root = document.getElementById('app');
      if (!root) return;
      root.innerHTML = `
        <main class="auth-shell">
          <div class="auth-orb auth-orb-one"></div>
          <div class="auth-orb auth-orb-two"></div>
          <section class="auth-workspace">
            <aside class="auth-showcase">
              <div class="auth-logo-row">
                <div class="auth-brand-mark">SR</div>
                <div><p class="auth-brand-name">SRM Workspace</p><p class="auth-brand-caption">Gestion documentaire interne</p></div>
              </div>

              <div class="auth-showcase-copy">
                <p class="auth-showcase-kicker">Direction Clientèle</p>
                <h1 class="auth-showcase-title">Vos documents métiers, dans un seul espace.</h1>
                <p class="auth-showcase-text">Préparez les échéanciers, les ordres de coupure et les mises en demeure depuis une interface unifiée avec gestion des accès et traçabilité.</p>
              </div>

              <div class="auth-feature-grid">
                <div class="auth-feature"><strong>Documents centralisés</strong><span>Trois générateurs dans le même workspace.</span></div>
                <div class="auth-feature"><strong>Accès contrôlés</strong><span>Permissions détaillées par utilisateur.</span></div>
                <div class="auth-feature"><strong>Historique complet</strong><span>Suivi des connexions et des exports.</span></div>
                <div class="auth-feature"><strong>Base partagée</strong><span>Compatible avec Supabase et GitHub Pages.</span></div>
              </div>
            </aside>

            <section class="auth-login-panel">
              <span class="auth-login-badge">Espace sécurisé</span>
              <h2 class="auth-login-title">Ravi de vous revoir.</h2>
              <p class="auth-login-subtitle">Saisissez votre identifiant ou votre matricule pour accéder à votre espace de travail.</p>

              <form id="loginForm" class="auth-form" autocomplete="off">
                <label>
                  <span class="auth-field-label">Identifiant ou matricule</span>
                  <div class="auth-input-wrap">
                    <span class="auth-input-icon">${window.UI.icon('user')}</span>
                    <input id="username" name="srm-workspace-login" class="auth-input" autocomplete="off" autocapitalize="none" spellcheck="false" data-lpignore="true" required>
                  </div>
                </label>

                <label>
                  <span class="auth-field-label">Mot de passe</span>
                  <div class="auth-input-wrap">
                    <span class="auth-input-icon">${window.UI.icon('key')}</span>
                    <input id="password" name="srm-workspace-password" type="password" class="auth-input" autocomplete="new-password" data-lpignore="true" required>
                    <button id="togglePassword" type="button" class="auth-toggle">Afficher</button>
                  </div>
                </label>

                <p id="loginError" class="auth-error hidden"></p>
                <button id="loginButton" class="auth-submit" type="submit">Ouvrir mon espace</button>
              </form>

              <div class="auth-developer">
                <span>Application interne SRM-FM</span>
                <span>Développée par <strong>Hossame El Bezzari · 2373</strong></span>
              </div>
            </section>
          </section>
        </main>`;
    }
  }

  window.SRM.Layouts = window.SRM.Layouts || {};
  window.SRM.Layouts.AuthLayout = AuthLayout;
})(window);
