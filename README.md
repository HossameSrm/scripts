# SRM Workspace — Structure inspirée de Laravel InertiaJS

Application interne de gestion documentaire pour la Direction Clientèle — Département Grands Comptes.

## Connexion locale initiale

- Identifiant : `hossame`
- Mot de passe : `titigoza123`

Les informations de connexion ne sont pas affichées sur la page d’authentification.

## Architecture

```text
srm-workspace/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── Documents/
│   │       └── *.js
│   └── Models/
├── config/
│   └── app.js
├── database/
│   └── database.sql
├── resources/
│   ├── css/
│   │   └── app.css
│   └── js/
│       ├── app.js
│       ├── Components/
│       ├── Core/
│       ├── Layouts/
│       └── Pages/
├── routes/
│   └── web.js
├── index.html
├── dashboard.html
├── calcul.html
├── order_coupure.html
├── mise_en_demeure.html
├── history.html
├── admin.html
├── about.html
└── 403.html
```

Cette organisation reprend les principes d’un projet Laravel + InertiaJS :

- `app/Http/Controllers` : orchestration des actions.
- `app/Models` : accès à la base locale ou Supabase.
- `resources/js/Pages` : pages métier.
- `resources/js/Layouts` : AuthLayout et AppLayout.
- `resources/js/Components` : composants UI réutilisables.
- `routes/web.js` : registre central des routes.
- `database/database.sql` : schéma PostgreSQL Supabase unique.

## Mode local

L’application fonctionne directement sans Supabase grâce à une base locale dans `localStorage`. Ce mode est pratique pour tester sur un navigateur, mais les données ne sont pas partagées entre plusieurs postes.

## Mode Supabase partagé

1. Créez un projet Supabase.
2. Ouvrez le SQL Editor.
3. Exécutez entièrement `database/database.sql`.
4. Modifiez `config/app.js` :

```js
SUPABASE_URL: 'https://votre-projet.supabase.co',
SUPABASE_ANON_KEY: 'votre-cle-anon-publice',
```

5. Laissez `DATA_MODE: 'auto'` pour utiliser Supabase automatiquement lorsqu’il est configuré.

Ne placez jamais une clé `service_role` dans GitHub Pages.

## Déploiement GitHub Pages

1. Décompressez le projet.
2. Placez tout le contenu directement à la racine du dépôt GitHub.
3. Vérifiez que `index.html` se trouve bien à la racine.
4. Activez GitHub Pages sur la branche principale.
5. Après chaque nouvelle version, rechargez avec `Ctrl + F5`.

## Modules

- Tableau de bord.
- Facilité de paiement.
- Ordre de coupure.
- Mise en demeure.
- Historique.
- Administration des utilisateurs et permissions.
- Page À propos.

## Développeur

Conçu et développé par **Hossame El Bezzari**, matricule **2373**.
