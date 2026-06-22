(function (window) {
  'use strict';

  const MODULES = ['dashboard', 'clients', 'calcul', 'order', 'notice', 'history', 'admin', 'about'];
  const ACTIONS = ['view', 'create', 'edit', 'delete', 'export_pdf', 'export_docx'];

  class DatabaseModel {
    constructor(config) {
      this.config = config || {};
      this.sessionKey = this.config.SESSION_STORAGE_KEY || 'srm_documents_session_v6';
      this.lastClientKey = this.config.LAST_CLIENT_KEY || 'srm_documents_last_client_v6';
      this.localDatabaseKey = this.config.LOCAL_DATABASE_KEY || 'srm_documents_local_database_v6';
      this.sessionStore = new window.SRM.Core.SessionStore(this.sessionKey);
      this.client = null;
      this.bootstrapCache = null;
    }

    remoteConfigured() {
      const cfg = this.config;
      return Boolean(
        cfg.SUPABASE_URL &&
        cfg.SUPABASE_ANON_KEY &&
        !cfg.SUPABASE_URL.includes('VOTRE-PROJET') &&
        !cfg.SUPABASE_ANON_KEY.includes('VOTRE_CLE')
      );
    }

    mode() {
      const requested = String(this.config.DATA_MODE || 'auto').toLowerCase();
      if (requested === 'local') return 'local';
      if (requested === 'supabase') return 'supabase';
      return this.remoteConfigured() ? 'supabase' : 'local';
    }

    configured() {
      return this.mode() === 'local' || this.remoteConfigured();
    }

    getClient() {
      if (!this.remoteConfigured()) throw new Error('SUPABASE_NOT_CONFIGURED');
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
      if (this.mode() === 'local') return this.localRpc(name, params);
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
      const session = {
        token: result.token,
        user: result.user,
        permissions: result.permissions,
        loginAt: new Date().toISOString(),
        mode: this.mode()
      };
      this.saveSession(session);
      this.bootstrapCache = null;
      return { ok: true, session };
    }

    async logout() {
      const session = this.getSession();
      try { if (session?.token) await this.rpc('logout_user', { p_token: session.token }); }
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
        if (`${error?.code || ''} ${error?.message || ''}`.includes('SESSION_INVALID')) this.clearSession();
        throw error;
      }
    }

    getPermissions() { return this.getSession()?.permissions || {}; }
    permission(module, action = 'view') { return Boolean(this.getPermissions()?.[module]?.[action]); }
    findClient(id) { return this.bootstrapCache?.clients?.find(item => item.id === id) || null; }

    friendlyError(error) {
      const text = `${error?.code || ''} ${error?.message || ''}`;
      const map = [
        ['SUPABASE_NOT_CONFIGURED', 'Configurez Supabase dans config/app.js.'],
        ['SUPABASE_LIBRARY_MISSING', 'La bibliothèque Supabase est indisponible.'],
        ['SESSION_INVALID', 'Votre session a expiré. Reconnectez-vous.'],
        ['PERMISSION_DENIED', 'Vous ne disposez pas de cette permission.'],
        ['USER_ALREADY_EXISTS', 'Le matricule ou l’identifiant existe déjà.'],
        ['USER_NOT_FOUND', 'Utilisateur introuvable.'],
        ['PASSWORD_TOO_SHORT', 'Le mot de passe doit contenir au moins 6 caractères.'],
        ['OWNER_REQUIRED', 'Seul le propriétaire peut gérer les administrateurs.'],
        ['OWNER_PROTECTED', 'Le compte propriétaire est protégé.'],
        ['SELF_DELETE_FORBIDDEN', 'Vous ne pouvez pas supprimer votre propre compte.'],
        ['CLIENT_ALREADY_EXISTS', 'Ce numéro client existe déjà.'],
        ['CONTRACT_ALREADY_EXISTS', 'Un numéro de contrat existe déjà.'],
        ['CLIENT_NOT_FOUND', 'Client introuvable.'],
        ['CLIENT_REQUIRED', 'Le numéro client et le nom sont obligatoires.']
      ];
      return map.find(([key]) => text.includes(key))?.[1] || error?.message || 'Une erreur est survenue.';
    }

    // ---------------------------------------------------------------------
    // Base locale de secours. Elle permet de tester et d'utiliser l'app
    // immédiatement. Pour partager les mêmes données entre plusieurs PC,
    // configurez Supabase et laissez DATA_MODE sur "auto".
    // ---------------------------------------------------------------------

    clone(value) { return JSON.parse(JSON.stringify(value)); }

    id(prefix = 'id') {
      const random = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      return `${prefix}-${random}`;
    }

    async sha256(value) {
      if (!window.crypto?.subtle) throw new Error('CRYPTO_UNAVAILABLE');
      const bytes = new TextEncoder().encode(String(value || ''));
      const digest = await window.crypto.subtle.digest('SHA-256', bytes);
      return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    }

    emptyPermission() {
      return { view: false, create: false, edit: false, delete: false, export_pdf: false, export_docx: false };
    }

    defaultPermissions(role = 'user') {
      const full = role === 'admin';
      const permissions = {};
      MODULES.forEach(module => {
        permissions[module] = {
          view: module === 'dashboard' || module === 'about' ? true : full,
          create: ['clients', 'calcul', 'order', 'notice', 'admin'].includes(module) ? full : false,
          edit: ['clients', 'calcul', 'order', 'notice', 'admin'].includes(module) ? full : false,
          delete: ['clients', 'history', 'admin'].includes(module) ? full : false,
          export_pdf: ['calcul', 'order', 'notice'].includes(module) ? full : false,
          export_docx: ['calcul', 'order', 'notice'].includes(module) ? full : false
        };
      });
      return permissions;
    }

    normalizePermissions(permissions = {}) {
      const normalized = {};
      MODULES.forEach(module => {
        normalized[module] = { ...this.emptyPermission() };
        ACTIONS.forEach(action => { normalized[module][action] = Boolean(permissions?.[module]?.[action]); });
      });
      return normalized;
    }

    localSeed() {
      const ownerId = 'local-owner-hossame';
      const ownerPermissions = this.defaultPermissions('admin');
      return {
        version: Number(this.config.LOCAL_DATABASE_VERSION || 1),
        app: {
          name: 'SRM Workspace',
          department: 'Direction Clientèle — Département Grands Comptes',
          version: '7.0.0',
          defaultCity: 'FES',
          creditor: 'SRM-FM',
          developerName: 'Hossame El Bezzari',
          developerMatricule: '2373'
        },
        users: [{
          id: ownerId,
          name: 'Hossame El Bezzari',
          matricule: '2373',
          username: String(this.config.LOCAL_OWNER_USERNAME || 'hossame').toLowerCase(),
          passwordHash: this.config.LOCAL_OWNER_PASSWORD_SHA256,
          role: 'admin',
          status: 'active',
          is_owner: true,
          avatar_url: '',
          last_login_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          permissions: ownerPermissions
        }],
        clients: [
          {
            id: 'client-hotel-olympic', clientNumber: '1002458', type: 'company', name: 'HOTEL OLYMPIC', cin: '',
            phone: '0535 00 00 01', email: '', representedBy: 'M. RESPONSABLE HOTEL OLYMPIC',
            address: '9 AVENUE HOUMANE FATOUAKI', city: 'FES', tourne: 'T-12',
            contracts: [
              { id: 'contract-0694068', number: '0694068', address: '9 AVENUE HOUMANE FATOUAKI, FES', serviceCode: 'EAU', serviceLabel: 'Factures de consommation Eau Potable Assainissement', balance: 1380.99, arrears: [
                { id: 'arrear-205445025', invoice: '205445025', product: '03/2026', balance: 680.99 },
                { id: 'arrear-205778142', invoice: '205778142', product: '04/2026', balance: 700.00 }
              ]},
              { id: 'contract-1387132', number: '1387132', address: 'CENTRE VILLE, FES', serviceCode: 'BT', serviceLabel: 'Factures de consommation Electricité Basse Tension', balance: 19151.66, arrears: [
                { id: 'arrear-202243117', invoice: '202243117', product: '01/2026', balance: 9550.00 },
                { id: 'arrear-202557314', invoice: '202557314', product: '02/2026', balance: 9601.66 }
              ]}
            ]
          },
          {
            id: 'client-mohamed-el-amrani', clientNumber: '1003871', type: 'person', name: 'MOHAMED EL AMRANI', cin: 'AB123456',
            phone: '0612 34 56 78', email: '', representedBy: 'MOHAMED EL AMRANI', address: '12 RUE IBN KHALDOUN', city: 'MEKNES', tourne: 'T-07',
            contracts: [{ id: 'contract-0755123', number: '0755123', address: '12 RUE IBN KHALDOUN, MEKNES', serviceCode: 'EAU', serviceLabel: 'Factures de consommation Eau Potable Assainissement', balance: 2450.50, arrears: [
              { id: 'arrear-301245789', invoice: '301245789', product: '02/2026', balance: 1200.50 },
              { id: 'arrear-301689745', invoice: '301689745', product: '03/2026', balance: 1250.00 }
            ]}]
          },
          {
            id: 'client-clinique-andalous', clientNumber: '1005130', type: 'company', name: 'CLINIQUE AL ANDALOUS', cin: '',
            phone: '0535 00 00 03', email: '', representedBy: 'DIRECTEUR DE LA CLINIQUE', address: 'AVENUE DES FAR', city: 'FES', tourne: 'T-21',
            contracts: [{ id: 'contract-0911442', number: '0911442', address: 'AVENUE DES FAR, FES', serviceCode: 'MT', serviceLabel: 'Factures de consommation Electricité Moyenne Tension', balance: 38740.25, arrears: [
              { id: 'arrear-410258963', invoice: '410258963', product: '03/2026', balance: 18740.25 },
              { id: 'arrear-410698521', invoice: '410698521', product: '04/2026', balance: 20000.00 }
            ]}]
          }
        ],
        sessions: [],
        documents: [],
        activity: []
      };
    }

    localRead() {
      let database = null;
      try { database = JSON.parse(localStorage.getItem(this.localDatabaseKey) || 'null'); }
      catch (_) { database = null; }
      if (!database || database.version !== Number(this.config.LOCAL_DATABASE_VERSION || 1)) {
        database = this.localSeed();
        this.localWrite(database);
      }
      return database;
    }

    localWrite(database) {
      localStorage.setItem(this.localDatabaseKey, JSON.stringify(database));
    }

    localError(code) {
      const error = new Error(code);
      error.code = code;
      return error;
    }

    localSessionUser(database, token) {
      const now = Date.now();
      database.sessions = (database.sessions || []).filter(session => new Date(session.expires_at).getTime() > now);
      const session = database.sessions.find(item => item.token === token);
      if (!session) throw this.localError('SESSION_INVALID');
      const user = database.users.find(item => item.id === session.user_id && item.status === 'active');
      if (!user) throw this.localError('SESSION_INVALID');
      session.last_seen_at = new Date().toISOString();
      return user;
    }

    localPublicUser(user) {
      return {
        id: user.id,
        name: user.name,
        username: user.username,
        matricule: user.matricule,
        role: user.role,
        status: user.status,
        is_owner: Boolean(user.is_owner),
        avatar_url: user.avatar_url || '',
        last_login_at: user.last_login_at || null,
        permissions: this.clone(user.permissions || {})
      };
    }

    localHas(user, module, action = 'view') {
      return Boolean(user?.permissions?.[module]?.[action]);
    }

    localRequire(user, module, action = 'view') {
      if (!this.localHas(user, module, action)) throw this.localError('PERMISSION_DENIED');
    }

    localLog(database, user, action, module, description, metadata = {}) {
      database.activity.unshift({
        id: this.id('log'), user_id: user?.id || null, user_name: user?.name || 'Utilisateur supprimé',
        action, module, description, metadata, created_at: new Date().toISOString()
      });
      database.activity = database.activity.slice(0, 1000);
    }

    async localRpc(name, params = {}) {
      const database = this.localRead();
      let result;

      switch (name) {
        case 'login_user': {
          const login = String(params.p_login || '').trim().toLowerCase();
          const passwordHash = await this.sha256(params.p_password || '');
          const user = database.users.find(item =>
            (item.username.toLowerCase() === login || item.matricule.toLowerCase() === login) &&
            item.status === 'active' && item.passwordHash === passwordHash
          );
          if (!user) return { ok: false, message: 'Identifiant ou mot de passe incorrect.' };
          user.last_login_at = new Date().toISOString();
          user.updated_at = user.last_login_at;
          const token = this.id('session');
          database.sessions.push({
            token, user_id: user.id, user_agent: params.p_user_agent || '',
            created_at: new Date().toISOString(), last_seen_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
          });
          this.localLog(database, user, 'login', 'auth', `${user.name} s'est connecté.`);
          result = { ok: true, token, user: this.localPublicUser(user), permissions: this.clone(user.permissions) };
          break;
        }

        case 'logout_user': {
          let user = null;
          try { user = this.localSessionUser(database, params.p_token); } catch (_) {}
          if (user) this.localLog(database, user, 'logout', 'auth', `${user.name} s'est déconnecté.`);
          database.sessions = database.sessions.filter(item => item.token !== params.p_token);
          result = true;
          break;
        }

        case 'app_bootstrap': {
          const user = this.localSessionUser(database, params.p_token);
          const canUseClients = this.localHas(user, 'clients', 'view') || ['calcul', 'order', 'notice'].some(module => this.localHas(user, module, 'view'));
          result = {
            app: this.clone(database.app),
            user: this.localPublicUser(user),
            permissions: this.clone(user.permissions),
            clients: canUseClients ? this.clone(database.clients.filter(item => item.status !== 'inactive')) : []
          };
          break;
        }

        case 'dashboard_data': {
          const user = this.localSessionUser(database, params.p_token);
          this.localRequire(user, 'dashboard', 'view');
          const admin = user.role === 'admin';
          const activity = admin ? database.activity : database.activity.filter(item => item.user_id === user.id);
          result = {
            stats: {
              users: admin ? database.users.length : 1,
              activeUsers: admin ? database.users.filter(item => item.status === 'active').length : 1,
              clients: database.clients.length,
              contracts: database.clients.reduce((sum, client) => sum + (client.contracts || []).length, 0),
              documents: admin ? database.documents.length : database.documents.filter(item => item.created_by === user.id).length
            },
            recent: this.clone(activity.slice(0, 12))
          };
          break;
        }

        case 'list_activity': {
          const user = this.localSessionUser(database, params.p_token);
          this.localRequire(user, 'history', 'view');
          const limit = Math.max(1, Math.min(Number(params.p_limit || 100), 500));
          const rows = user.role === 'admin' ? database.activity : database.activity.filter(item => item.user_id === user.id);
          result = this.clone(rows.slice(0, limit));
          break;
        }

        case 'record_document_action': {
          const user = this.localSessionUser(database, params.p_token);
          const module = params.p_module;
          const format = params.p_format;
          this.localRequire(user, module, format === 'pdf' ? 'export_pdf' : 'export_docx');
          const document = {
            id: this.id('document'),
            reference: `SRM-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(database.documents.length + 1).padStart(5, '0')}`,
            document_type: module,
            client_id: params.p_client_id || null,
            created_by: user.id,
            total_amount: Number(params.p_total || 0),
            format,
            data: this.clone(params.p_data || {}),
            created_at: new Date().toISOString()
          };
          database.documents.unshift(document);
          const action = format === 'pdf' ? 'export_pdf' : 'export_docx';
          this.localLog(database, user, action, module, `${user.name} a exporté ${document.reference} en ${format.toUpperCase()}.`, { document_id: document.id });
          result = this.clone(document);
          break;
        }

        case 'list_clients': {
          const user = this.localSessionUser(database, params.p_token);
          this.localRequire(user, 'clients', 'view');
          result = this.clone(database.clients.slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))));
          break;
        }

        case 'save_client': {
          const user = this.localSessionUser(database, params.p_token);
          const payload = this.clone(params.p_client || {});
          const editing = Boolean(payload.id);
          this.localRequire(user, 'clients', editing ? 'edit' : 'create');
          const clientNumber = String(payload.clientNumber || '').trim();
          const nameValue = String(payload.name || '').trim();
          if (!clientNumber || !nameValue) throw this.localError('CLIENT_REQUIRED');
          if (database.clients.some(item => item.id !== payload.id && String(item.clientNumber).toLowerCase() === clientNumber.toLowerCase())) throw this.localError('CLIENT_ALREADY_EXISTS');

          const incomingContractNumbers = new Set();
          for (const contract of (payload.contracts || [])) {
            const number = String(contract.number || '').trim();
            if (!number) throw this.localError('CONTRACT_REQUIRED');
            if (incomingContractNumbers.has(number.toLowerCase())) throw this.localError('CONTRACT_ALREADY_EXISTS');
            incomingContractNumbers.add(number.toLowerCase());
            const duplicate = database.clients.some(client => (client.contracts || []).some(existing => existing.id !== contract.id && String(existing.number).toLowerCase() === number.toLowerCase()));
            if (duplicate) throw this.localError('CONTRACT_ALREADY_EXISTS');
          }

          let target = database.clients.find(item => item.id === payload.id);
          if (!target) {
            target = { id: this.id('client'), created_at: new Date().toISOString() };
            database.clients.push(target);
          }
          target.clientNumber = clientNumber;
          target.type = payload.type === 'person' ? 'person' : 'company';
          target.name = nameValue;
          target.cin = String(payload.cin || '').trim();
          target.phone = String(payload.phone || '').trim();
          target.email = String(payload.email || '').trim();
          target.representedBy = String(payload.representedBy || '').trim();
          target.address = String(payload.address || '').trim();
          target.city = String(payload.city || '').trim();
          target.tourne = String(payload.tourne || '').trim();
          target.status = payload.status === 'inactive' ? 'inactive' : 'active';
          target.updated_at = new Date().toISOString();
          target.contracts = (payload.contracts || []).map(contract => {
            const arrears = (contract.arrears || []).map(arrear => ({
              id: arrear.id || this.id('arrear'),
              invoice: String(arrear.invoice || '').trim(),
              product: String(arrear.product || '').trim(),
              balance: Number(arrear.balance || 0),
              status: ['paid', 'cancelled'].includes(arrear.status) ? arrear.status : 'unpaid'
            }));
            return {
              id: contract.id || this.id('contract'),
              number: String(contract.number || '').trim(),
              serviceCode: ['EAU', 'BT', 'MT'].includes(contract.serviceCode) ? contract.serviceCode : 'EAU',
              serviceLabel: String(contract.serviceLabel || '').trim(),
              address: String(contract.address || '').trim(),
              status: contract.status === 'inactive' ? 'inactive' : 'active',
              balance: arrears.filter(item => item.status === 'unpaid').reduce((sum, item) => sum + Number(item.balance || 0), 0),
              arrears
            };
          });
          this.localLog(database, user, editing ? 'update_client' : 'create_client', 'clients', `${editing ? 'Client modifié' : 'Client créé'} : ${target.name}.`, { client_id: target.id });
          result = this.clone(target);
          break;
        }

        case 'delete_client': {
          const user = this.localSessionUser(database, params.p_token);
          this.localRequire(user, 'clients', 'delete');
          const target = database.clients.find(item => item.id === params.p_client_id);
          if (!target) throw this.localError('CLIENT_NOT_FOUND');
          this.localLog(database, user, 'delete_client', 'clients', `Client supprimé : ${target.name}.`, { client_id: target.id });
          database.clients = database.clients.filter(item => item.id !== target.id);
          database.documents = database.documents.map(document => document.client_id === target.id ? { ...document, client_id: null } : document);
          result = true;
          break;
        }

        case 'admin_list_users': {
          const caller = this.localSessionUser(database, params.p_token);
          this.localRequire(caller, 'admin', 'view');
          result = database.users
            .slice()
            .sort((a, b) => Number(b.is_owner) - Number(a.is_owner) || a.name.localeCompare(b.name))
            .map(user => this.localPublicUser(user));
          break;
        }

        case 'admin_create_user': {
          const caller = this.localSessionUser(database, params.p_token);
          this.localRequire(caller, 'admin', 'create');
          const username = String(params.p_username || '').trim().toLowerCase();
          const matricule = String(params.p_matricule || '').trim();
          const role = String(params.p_role || 'user').toLowerCase();
          if (role === 'admin' && !caller.is_owner) throw this.localError('OWNER_REQUIRED');
          if (String(params.p_password || '').length < 6) throw this.localError('PASSWORD_TOO_SHORT');
          if (database.users.some(item => item.username.toLowerCase() === username || item.matricule.toLowerCase() === matricule.toLowerCase())) throw this.localError('USER_ALREADY_EXISTS');
          const user = {
            id: this.id('user'), name: String(params.p_full_name || '').trim(), matricule, username,
            passwordHash: await this.sha256(params.p_password), role, status: 'active', is_owner: false,
            avatar_url: '', last_login_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            permissions: this.defaultPermissions(role)
          };
          database.users.push(user);
          this.localLog(database, caller, 'create_user', 'admin', `Utilisateur créé : ${user.name}.`, { target_user_id: user.id });
          result = this.localPublicUser(user);
          break;
        }

        case 'admin_update_user': {
          const caller = this.localSessionUser(database, params.p_token);
          this.localRequire(caller, 'admin', 'edit');
          const target = database.users.find(item => item.id === params.p_user_id);
          if (!target) throw this.localError('USER_NOT_FOUND');
          if (target.is_owner && !caller.is_owner) throw this.localError('OWNER_PROTECTED');
          const username = String(params.p_username || '').trim().toLowerCase();
          const matricule = String(params.p_matricule || '').trim();
          if (database.users.some(item => item.id !== target.id && (item.username.toLowerCase() === username || item.matricule.toLowerCase() === matricule.toLowerCase()))) throw this.localError('USER_ALREADY_EXISTS');
          let role = String(params.p_role || target.role).toLowerCase();
          let status = String(params.p_status || target.status).toLowerCase();
          if (role === 'admin' && !caller.is_owner) throw this.localError('OWNER_REQUIRED');
          if (target.is_owner) { role = 'admin'; status = 'active'; }
          target.name = String(params.p_full_name || '').trim();
          target.matricule = matricule;
          target.username = username;
          if (target.role !== role) target.permissions = this.defaultPermissions(role);
          target.role = role;
          target.status = status;
          target.updated_at = new Date().toISOString();
          if (status !== 'active') database.sessions = database.sessions.filter(item => item.user_id !== target.id);
          this.localLog(database, caller, 'update_user', 'admin', `Utilisateur modifié : ${target.name}.`, { target_user_id: target.id });
          result = true;
          break;
        }

        case 'admin_set_permissions': {
          const caller = this.localSessionUser(database, params.p_token);
          this.localRequire(caller, 'admin', 'edit');
          const target = database.users.find(item => item.id === params.p_user_id);
          if (!target) throw this.localError('USER_NOT_FOUND');
          if (target.is_owner) throw this.localError('OWNER_PROTECTED');
          if (target.role === 'admin' && !caller.is_owner) throw this.localError('OWNER_REQUIRED');
          target.permissions = this.normalizePermissions(params.p_permissions || {});
          target.updated_at = new Date().toISOString();
          this.localLog(database, caller, 'update_permissions', 'admin', `Permissions mises à jour pour ${target.name}.`, { target_user_id: target.id });
          result = true;
          break;
        }

        case 'admin_reset_password': {
          const caller = this.localSessionUser(database, params.p_token);
          this.localRequire(caller, 'admin', 'edit');
          const target = database.users.find(item => item.id === params.p_user_id);
          if (!target) throw this.localError('USER_NOT_FOUND');
          if (target.is_owner && !caller.is_owner) throw this.localError('OWNER_PROTECTED');
          if (String(params.p_new_password || '').length < 6) throw this.localError('PASSWORD_TOO_SHORT');
          target.passwordHash = await this.sha256(params.p_new_password);
          target.updated_at = new Date().toISOString();
          database.sessions = database.sessions.filter(item => item.user_id !== target.id || item.token === params.p_token);
          this.localLog(database, caller, 'reset_password', 'admin', `Mot de passe réinitialisé pour ${target.name}.`, { target_user_id: target.id });
          result = true;
          break;
        }

        case 'admin_delete_user': {
          const caller = this.localSessionUser(database, params.p_token);
          this.localRequire(caller, 'admin', 'delete');
          const target = database.users.find(item => item.id === params.p_user_id);
          if (!target) throw this.localError('USER_NOT_FOUND');
          if (target.is_owner) throw this.localError('OWNER_PROTECTED');
          if (target.role === 'admin' && !caller.is_owner) throw this.localError('OWNER_REQUIRED');
          if (target.id === caller.id) throw this.localError('SELF_DELETE_FORBIDDEN');
          this.localLog(database, caller, 'delete_user', 'admin', `Utilisateur supprimé : ${target.name}.`, { target_user_id: target.id });
          database.users = database.users.filter(item => item.id !== target.id);
          database.sessions = database.sessions.filter(item => item.user_id !== target.id);
          result = true;
          break;
        }

        default:
          throw new Error(`LOCAL_RPC_NOT_IMPLEMENTED: ${name}`);
      }

      this.localWrite(database);
      return result;
    }
  }

  window.SRM.Models.DatabaseModel = DatabaseModel;
  window.SRM.Models.database = new DatabaseModel(window.APP_CONFIG || {});

  const database = window.SRM.Models.database;
  window.AppDB = {
    configured: () => database.configured(),
    mode: () => database.mode(),
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
