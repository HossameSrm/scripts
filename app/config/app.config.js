(function () {
  'use strict';

  /*
   * DATA_MODE:
   * - "auto"     : utilise Supabase lorsqu'il est configuré, sinon la base locale.
   * - "supabase" : exige une configuration Supabase.
   * - "local"    : utilise uniquement la base locale du navigateur.
   */
  window.APP_CONFIG = Object.freeze({
    DATA_MODE: 'auto',
    SUPABASE_URL: 'https://VOTRE-PROJET.supabase.co',
    SUPABASE_ANON_KEY: 'VOTRE_CLE_ANON_PUBLIC',
    SESSION_STORAGE_KEY: 'srm_documents_session_v3',
    LAST_CLIENT_KEY: 'srm_documents_last_client_v3',
    LOCAL_DATABASE_KEY: 'srm_documents_local_database_v3',
    LOCAL_DATABASE_VERSION: 1,
    LOCAL_OWNER_USERNAME: 'hossame',
    LOCAL_OWNER_PASSWORD_SHA256: '320a0308d248d876f26ed234d706d18e1575e1d8905c9403fd56fd6ec2967249'
  });
})();
