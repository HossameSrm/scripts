# SRM-FM Documents — MVC Edition

Application web statique compatible avec **GitHub Pages**, construite avec HTML, TailwindCSS CDN et JavaScript ES6, reliée à une seule base **Supabase PostgreSQL**.

## Architecture MVC

Le projet suit une séparation claire :

- **Models** : accès Supabase, sessions, utilisateurs, activité, dashboard et documents.
- **Views** : composants UI, navigation, layouts et affichage des pages.
- **Controllers** : authentification, layout, administration, historique, sélection client et générateurs documentaires.
- **Bootstrap** : instanciation des Models, Views et Controllers pour chaque page.
- **Core** : routeur, événements et stockage de session.

```text
srm_documents_app_mvc/
├── index.html
├── dashboard.html
├── calcul.html
├── order_coupure.html
├── mise_en_demeure.html
├── history.html
├── admin.html
├── about.html
├── 403.html
├── database.sql
├── assets/
│   └── css/
│       └── app.css
└── app/
    ├── config/
    │   └── app.config.js
    ├── core/
    │   ├── Namespace.js
    │   ├── EventBus.js
    │   ├── Router.js
    │   └── SessionStore.js
    ├── models/
    │   ├── DatabaseModel.js
    │   ├── AuthModel.js
    │   ├── AppModel.js
    │   ├── DashboardModel.js
    │   ├── UserModel.js
    │   ├── ActivityModel.js
    │   └── DocumentModel.js
    ├── views/
    │   ├── components/
    │   │   ├── UIComponents.js
    │   │   └── NavigationView.js
    │   ├── layouts/
    │   │   └── AppLayoutView.js
    │   └── pages/
    │       ├── AuthView.js
    │       ├── DashboardView.js
    │       ├── AdminView.js
    │       └── HistoryView.js
    ├── controllers/
    │   ├── AuthController.js
    │   ├── LayoutController.js
    │   ├── DashboardController.js
    │   ├── AdminController.js
    │   ├── HistoryController.js
    │   ├── ClientDataController.js
    │   └── documents/
    │       ├── PaymentScheduleController.js
    │       ├── CutOrderController.js
    │       └── FormalNoticeController.js
    └── bootstrap/
        ├── auth.js
        ├── layout.js
        ├── dashboard.js
        ├── admin.js
        ├── history.js
        └── client-data.js
```

## Base de données unique

Le projet utilise uniquement `database.sql`. Ce fichier crée et configure :

- utilisateurs et rôles ;
- sessions ;
- permissions par module et action ;
- clients ;
- contrats ;
- arriérés ;
- documents générés ;
- journal d’activité ;
- fonctions PostgreSQL sécurisées utilisées par l’application.

Le projet n’utilise pas `database.json` comme base principale.

## Installation Supabase

1. Créer un projet Supabase.
2. Ouvrir **SQL Editor**.
3. Copier et exécuter tout le fichier `database.sql`.
4. Ouvrir **Project Settings > API**.
5. Copier le `Project URL` et la clé `anon public`.
6. Compléter `app/config/app.config.js` :

```js
window.APP_CONFIG = Object.freeze({
  SUPABASE_URL: 'https://xxxx.supabase.co',
  SUPABASE_ANON_KEY: 'votre-cle-anon-public',
  SESSION_STORAGE_KEY: 'srm_documents_session_v2',
  LAST_CLIENT_KEY: 'srm_documents_last_client_v2'
});
```

Ne jamais placer la clé `service_role` dans GitHub ou dans le navigateur.

## Comptes initiaux

### Propriétaire

- Identifiant : `admin`
- Matricule : `2373`
- Mot de passe : `admin123`

### Utilisateur de démonstration

- Identifiant : `user2373`
- Matricule : `2451`
- Mot de passe : `user123`

Les mots de passe doivent être changés après la première connexion.

## Permissions

L’administrateur peut autoriser séparément, pour chaque utilisateur :

- accès au module ;
- création ;
- modification ;
- suppression ;
- export PDF ;
- export DOCX.

Les modules disponibles sont : Dashboard, Facilité de paiement, Ordre de coupure, Mise en demeure, Historique, Administration et À propos.

## Publication GitHub Pages

1. Envoyer tout le contenu du dossier dans un repository GitHub.
2. Ouvrir **Settings > Pages**.
3. Choisir **Deploy from a branch**.
4. Choisir la branche `main` et le dossier `/root`.
5. Ouvrir l’URL générée par GitHub Pages.

## Développeur

Conçu et développé par **Hossame El Bezzari — Matricule 2373**.
