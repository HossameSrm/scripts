(function () {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const SESSION_KEY = cfg.SESSION_STORAGE_KEY || 'srm_documents_session_v2';
  const LAST_CLIENT_KEY = cfg.LAST_CLIENT_KEY || 'srm_documents_last_client_v2';
  let client = null;
  let bootstrapCache = null;

  function configured() {
    return Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_URL.includes('VOTRE-PROJET') && !cfg.SUPABASE_ANON_KEY.includes('VOTRE_CLE'));
  }

  function getClient() {
    if (!configured()) throw new Error('SUPABASE_NOT_CONFIGURED');
    if (!window.supabase?.createClient) throw new Error('SUPABASE_LIBRARY_MISSING');
    if (!client) client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return client;
  }

  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch (_) { return null; }
  }

  function writeSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    bootstrapCache = null;
  }

  async function rpc(name, params = {}) {
    const { data, error } = await getClient().rpc(name, params);
    if (error) {
      const err = new Error(error.message || 'Erreur base de données');
      err.code = String(error.message || '').match(/[A-Z][A-Z_]{3,}/)?.[0] || error.code;
      err.details = error.details;
      throw err;
    }
    return data;
  }

  async function login(loginValue, password) {
    const result = await rpc('login_user', {
      p_login: String(loginValue || '').trim(),
      p_password: String(password || ''),
      p_user_agent: navigator.userAgent
    });
    if (!result?.ok) return result || { ok: false, message: 'Connexion impossible.' };
    const session = { token: result.token, user: result.user, permissions: result.permissions, loginAt: new Date().toISOString() };
    writeSession(session);
    bootstrapCache = null;
    return { ok: true, session };
  }

  async function logout() {
    const session = readSession();
    try { if (session?.token && configured()) await rpc('logout_user', { p_token: session.token }); }
    catch (_) {}
    clearSession();
  }

  async function bootstrap(force = false) {
    const session = readSession();
    if (!session?.token) throw new Error('SESSION_INVALID');
    if (bootstrapCache && !force) return bootstrapCache;
    try {
      const data = await rpc('app_bootstrap', { p_token: session.token });
      bootstrapCache = data;
      writeSession({ ...session, user: data.user, permissions: data.permissions });
      return data;
    } catch (error) {
      if (String(error.message).includes('SESSION_INVALID')) clearSession();
      throw error;
    }
  }

  async function load(force = false) { return bootstrap(force); }
  function getSession() { return readSession(); }
  function getPermissions() { return readSession()?.permissions || {}; }
  function permission(module, action = 'view') { return Boolean(getPermissions()?.[module]?.[action]); }
  function findClient(id) { return bootstrapCache?.clients?.find(item => item.id === id) || null; }

  async function dashboard() {
    return rpc('dashboard_data', { p_token: readSession()?.token || '' });
  }

  async function listActivity(limit = 100) {
    return rpc('list_activity', { p_token: readSession()?.token || '', p_limit: limit });
  }

  async function recordDocumentAction({ module, format, clientId = null, total = 0, data = {} }) {
    return rpc('record_document_action', {
      p_token: readSession()?.token || '',
      p_module: module,
      p_format: format,
      p_client_id: clientId || null,
      p_total: Number(total) || 0,
      p_data: data || {}
    });
  }

  async function adminListUsers() {
    return rpc('admin_list_users', { p_token: readSession()?.token || '' });
  }
  async function adminCreateUser(payload) {
    return rpc('admin_create_user', {
      p_token: readSession()?.token || '', p_full_name: payload.name, p_matricule: payload.matricule,
      p_username: payload.username, p_password: payload.password, p_role: payload.role
    });
  }
  async function adminUpdateUser(payload) {
    return rpc('admin_update_user', {
      p_token: readSession()?.token || '', p_user_id: payload.id, p_full_name: payload.name,
      p_matricule: payload.matricule, p_username: payload.username, p_role: payload.role, p_status: payload.status
    });
  }
  async function adminSetPermissions(userId, permissions) {
    return rpc('admin_set_permissions', { p_token: readSession()?.token || '', p_user_id: userId, p_permissions: permissions });
  }
  async function adminResetPassword(userId, password) {
    return rpc('admin_reset_password', { p_token: readSession()?.token || '', p_user_id: userId, p_new_password: password });
  }
  async function adminDeleteUser(userId) {
    return rpc('admin_delete_user', { p_token: readSession()?.token || '', p_user_id: userId });
  }

  function friendlyError(error) {
    const text = `${error?.code || ''} ${error?.message || ''}`;
    const map = [
      ['SUPABASE_NOT_CONFIGURED', 'Configurez Supabase dans assets/js/config.js.'],
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

  window.AppDB = {
    configured, login, logout, load, bootstrap, getSession, getPermissions, permission, findClient,
    dashboard, listActivity, recordDocumentAction,
    adminListUsers, adminCreateUser, adminUpdateUser, adminSetPermissions, adminResetPassword, adminDeleteUser,
    friendlyError, SESSION_KEY, LAST_CLIENT_KEY
  };
})();
