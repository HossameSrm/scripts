# SRM Workspace V6 — Inertia-style + Metronic-inspired UI

Application interne de gestion documentaire pour la Direction Clientèle — Département Grands Comptes.

## Connexion locale initiale

- Identifiant : `hossame`
- Mot de passe : `titigoza123`

Les informations de connexion ne sont jamais affichées dans la page d’authentification.

## Nouveautés V6

- Refonte visuelle complète inspirée de la structure claire de Metronic Tailwind Demo 1.
- Sidebar claire, header compact, cartes bordées, formulaires et tableaux homogènes.
- Nouvelle page `client.html` pour gérer tout le dossier client depuis une seule interface.
- Création, modification, duplication et suppression des clients.
- Plusieurs contrats par client : EAU, BT et MT.
- Plusieurs factures/arrierés par contrat avec produit, solde et statut.
- Recalcul automatique du solde de chaque contrat.
- Nouveau module `clients` dans les permissions Admin/User.
- Fonctions PostgreSQL Supabase dédiées : `list_clients`, `save_client`, `delete_client`.

Le projet reproduit l’organisation visuelle générale demandée sans copier le code ou les ressources propriétaires de Metronic.

## Architecture

```text
srm-workspace/
├── app/
│   ├── Http/Controllers/
│   │   ├── Documents/
│   │   ├── ClientsController.js
│   │   └── *.js
│   └── Models/
│       ├── ClientModel.js
│       └── *.js
├── config/app.js
├── database/database.sql
├── resources/
│   ├── css/app.css
│   └── js/
│       ├── Components/
│       ├── Core/
│       ├── Layouts/
│       └── Pages/
│           ├── Clients/
│           └── ...
├── routes/web.js
├── index.html
├── dashboard.html
├── client.html
├── calcul.html
├── order_coupure.html
├── mise_en_demeure.html
├── history.html
├── admin.html
├── about.html
└── 403.html
```

## Page Clients

La page `client.html` centralise :

- numéro client ;
- type particulier/personne morale ;
- nom ou raison sociale ;
- CIN/ICE ;
- représentant ;
- téléphone et e-mail ;
- ville, tournée et adresse ;
- statut du client ;
- contrats EAU, BT et MT ;
- adresse et statut de chaque contrat ;
- factures, produits, soldes et statuts des arriérés.

## Mode local

Le mode local utilise `localStorage`. Il permet de tester immédiatement l’application, mais les données restent propres à chaque navigateur.

## Mode Supabase partagé

1. Créez un projet Supabase.
2. Exécutez intégralement `database/database.sql` dans SQL Editor.
3. Complétez `config/app.js` :

```js
SUPABASE_URL: 'https://votre-projet.supabase.co',
SUPABASE_ANON_KEY: 'votre-cle-anon-publice',
```

4. Gardez `DATA_MODE: 'auto'`.

La fonction `save_client` sauvegarde le client, ses contrats et ses arriérés dans une seule opération.

Ne placez jamais une clé `service_role` dans GitHub Pages.

## Déploiement GitHub Pages

1. Placez le contenu du dossier directement à la racine du dépôt.
2. Vérifiez que `index.html` est à la racine.
3. Activez GitHub Pages sur la branche principale.
4. Rechargez avec `Ctrl + F5` après le déploiement.

## Développeur

Conçu et développé par **Hossame El Bezzari**, matricule **2373**.
