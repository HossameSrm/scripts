(function (window) {
  'use strict';

  class DatabaseModel {
    constructor(config) {
      this.config = config || {};
      this.sessionKey = this.config.SESSION_STORAGE_KEY || 'srm_documents_session_v2';
      this.lastClientKey = this.config.LAST_CLIENT_KEY || 'srm_documents_last_client_v2';
      this.sessionStore = new window.SRM.Core.SessionStore(this.sessionKey);
      this.client = null;
      this.bootstrapCache = null;
    }

    configured() {
      const cfg = this.config;
      return Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_URL.includes('VOTRE-PROJET') && !cfg.SUPABASE_ANON_KEY.includes('VOTRE_CLE'));
    }

    getClient() {
      if (!this.configured()) throw new Error('SUPABASE_NOT_CONFIGURED');
      if (!window.supabase?.createClient) throw new Error('SUPABASE_LIBRARY_MISSING');
      if (!this.client) {
        this.client = window.supabase.createClient(this.config.SUPABASE_URL, this.config.SUPABASE_ANON_KEY, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });
      }
      return this.client;
    }

    getSession() { return this.sessionStore.read(); }
    saveSession(session) { this.sessionStore.write(session); }
    clearSession() { this.sessionStore.clear(); this.bootstrapCache = null; }

    async rpc(name, params = {}) {
      const { data, error } = await this.getClient().rpc(name, params);
      if (error) {
        const err = new Error(error.message || 'Erreur base de données');
        err.code = String(error.message || '').match(/[A-Z][A-Z_]{3,}/)?.[0] || error.code;
        err.details = error.details;
        throw err;
      }
      return data;
    }

    async login(loginValue, password) {
      const result = await this.rpc('login_user', {
        p_login: String(loginValue || '').trim(),
        p_password: String(password || ''),
        p_user_agent: navigator.userAgent
      });
      if (!result?.ok) return result || { ok: false, message: 'Connexion impossible.' };
      const session = { token: result.token, user: result.user, permissions: result.permissions, loginAt: new Date().toISOString() };
      this.saveSession(session);
      this.bootstrapCache = null;
      return { ok: true, session };
    }

    async logout() {
      const session = this.getSession();
      try { if (session?.token && this.configured()) await this.rpc('logout_user', { p_token: session.token }); }
      catch (_) {}
      this.clearSession();
    }

    async bootstrap(force = false) {
      const session = this.getSession();
      if (!session?.token) throw new Error('SESSION_INVALID');
      if (this.bootstrapCache && !force) return this.bootstrapCache;
      try {
        const data = await this.rpc('app_bootstrap', { p_token: session.token });
        this.bootstrapCache = data;
        this.saveSession({ ...session, user: data.user, permissions: data.permissions });
        return data;
      } catch (error) {
        if (String(error.message).includes('SESSION_INVALID')) this.clearSession();
        throw error;
      }
    }

    getPermissions() { return this.getSession()?.permissions || {}; }
    permission(module, action = 'view') { return Boolean(this.getPermissions()?.[module]?.[action]); }
    findClient(id) { return this.bootstrapCache?.clients?.find(item => item.id === id) || null; }

    friendlyError(error) {
      const text = `${error?.code || ''} ${error?.message || ''}`;
      const map = [
        ['SUPABASE_NOT_CONFIGURED', 'Configurez Supabase dans app/config/app.config.js.'],
        ['SUPABASE_LIBRARY_MISSING', 'La bibliothèque Supabase est indisponible.'],
        ['SESSION_INVALID', 'Votre session a expiré. Reconnectez-vous.'],
        ['PERMISSION_DENIED', 'Vous ne disposez pas de cette permission.'],
        ['USER_ALREADY_EXISTS', 'Le matricule ou l’identifiant existe déjà.'],
        ['PASSWORD_TOO_SHORT', 'Le mot de passe doit contenir au moins 6 caractères.'],
        ['OWNER_REQUIRED', 'Seul le propriétaire peut gérer les administrateurs.'],
        ['OWNER_PROTECTED', 'Le compte propriétaire est protégé.'],
        ['SELF_DELETE_FORBIDDEN', 'Vous ne pouvez pas supprimer votre propre compte.']
      ];
      return map.find(([key]) => text.includes(key))?.[1] || error?.message || 'Une erreur est survenue.';
    }
  }

  window.SRM.Models.DatabaseModel = DatabaseModel;
  window.SRM.Models.database = new DatabaseModel(window.APP_CONFIG || {});

  // Façade de compatibilité pour les générateurs de documents existants.
  const database = window.SRM.Models.database;
  window.AppDB = {
    configured: () => database.configured(),
    login: (...args) => database.login(...args),
    logout: (...args) => database.logout(...args),
    load: (...args) => database.bootstrap(...args),
    bootstrap: (...args) => database.bootstrap(...args),
    getSession: () => database.getSession(),
    getPermissions: () => database.getPermissions(),
    permission: (...args) => database.permission(...args),
    findClient: (...args) => database.findClient(...args),
    friendlyError: (...args) => database.friendlyError(...args),
    SESSION_KEY: database.sessionKey,
    LAST_CLIENT_KEY: database.lastClientKey
  };
})(window);
