(function () {
  'use strict';

  // 1) Créez un projet sur https://supabase.com
  // 2) Exécutez database.sql dans SQL Editor
  // 3) Copiez Project URL et anon public key ci-dessous
  window.APP_CONFIG = Object.freeze({
    SUPABASE_URL: 'https://VOTRE-PROJET.supabase.co',
    SUPABASE_ANON_KEY: 'VOTRE_CLE_ANON_PUBLIC',
    SESSION_STORAGE_KEY: 'srm_documents_session_v2',
    LAST_CLIENT_KEY: 'srm_documents_last_client_v2'
  });
})();
