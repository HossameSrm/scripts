(function (window) {
  'use strict';

  class AuthLayout {
    static render() {
      document.body.className = 'auth-body text-slate-800';
      const root = document.getElementById('app');
      if (!root) return;
      root.innerHTML = `
        <main class="auth-shell">
          <section class="auth-workspace">
            <aside class="auth-showcase">
              <div class="auth-showcase-pattern"></div>
              <div class="auth-logo-row">
                <div class="auth-brand-mark"><span>S</span><span>R</span></div>
                <div><p class="auth-brand-name">SRM Workspace</p><p class="auth-brand-caption">Direction Clientèle · Grands Comptes</p></div>
              </div>

              <div class="auth-showcase-copy">
                <span class="auth-showcase-badge">Gestion documentaire centralisée</span>
                <h1 class="auth-showcase-title">Travaillez plus vite.<br><em>Gardez le contrôle.</em></h1>
                <p class="auth-showcase-text">Clients, contrats, arriérés, documents et permissions réunis dans une interface professionnelle inspirée des meilleurs outils de gestion.</p>
              </div>

              <div class="auth-feature-grid">
                <div class="auth-feature"><span>${window.UI.icon('client')}</span><div><strong>Référentiel client</strong><small>Clients, contrats et arriérés.</small></div></div>
                <div class="auth-feature"><span>${window.UI.icon('file')}</span><div><strong>Documents métiers</strong><small>PDF et DOCX prêts à l’emploi.</small></div></div>
                <div class="auth-feature"><span>${window.UI.icon('shield')}</span><div><strong>Accès maîtrisés</strong><small>Rôles et permissions détaillés.</small></div></div>
              </div>

              <p class="auth-showcase-footer">Conçu et développé par Hossame El Bezzari · 2373</p>
            </aside>

            <section class="auth-login-panel">
              <div class="auth-login-card">
                <div class="auth-mobile-brand"><div class="auth-brand-mark"><span>S</span><span>R</span></div><strong>SRM Workspace</strong></div>
                <p class="auth-login-kicker">Bienvenue</p>
                <h2 class="auth-login-title">Connectez-vous à votre espace</h2>
                <p class="auth-login-subtitle">Utilisez votre identifiant ou votre matricule professionnel.</p>

                <form id="loginForm" class="auth-form" autocomplete="off">
                  <label>
                    <span class="auth-field-label">Identifiant ou matricule</span>
                    <div class="auth-input-wrap">
                      <span class="auth-input-icon">${window.UI.icon('user')}</span>
                      <input id="username" name="srm-workspace-login-v6" class="auth-input" autocomplete="off" autocapitalize="none" spellcheck="false" data-lpignore="true" placeholder="Saisissez votre identifiant" required>
                    </div>
                  </label>

                  <label>
                    <span class="auth-field-label">Mot de passe</span>
                    <div class="auth-input-wrap">
                      <span class="auth-input-icon">${window.UI.icon('key')}</span>
                      <input id="password" name="srm-workspace-password-v6" type="password" class="auth-input" autocomplete="new-password" data-lpignore="true" placeholder="Votre mot de passe" required>
                      <button id="togglePassword" type="button" class="auth-toggle">Afficher</button>
                    </div>
                  </label>

                  <div class="auth-form-options"><label><input type="checkbox"> Se souvenir de moi</label><span>Accès sécurisé</span></div>
                  <p id="loginError" class="auth-error hidden"></p>
                  <button id="loginButton" class="auth-submit" type="submit">Se connecter</button>
                </form>

                <div class="auth-login-help"><span>${window.UI.icon('shield')}</span><p>Les actions et exports sont enregistrés dans l’historique de l’application.</p></div>
              </div>
            </section>
          </section>
        </main>`;
    }
  }

  window.SRM.Layouts = window.SRM.Layouts || {};
  window.SRM.Layouts.AuthLayout = AuthLayout;
})(window);
