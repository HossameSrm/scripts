# SRM-FM Documents — Version 2.0

Application HTML/TailwindCSS destinée à GitHub Pages, avec une base de données Supabase unique.

## Fonctionnalités

- Authentification par identifiant ou matricule.
- Rôles `admin` et `user`.
- Permissions par module et par action : accès, création, modification, suppression, PDF et DOCX.
- Compte propriétaire protégé.
- Gestion des utilisateurs depuis `admin.html`.
- Base centralisée : utilisateurs, sessions, permissions, clients, contrats, arriérés, documents et historique.
- Components UI communs : Sidebar, Header blur, Modal, Cards, Tables, Badges, Toasts et formulaires.
- Pages : Dashboard, Facilité de paiement, Ordre de coupure, Mise en demeure, Historique, Administration et À propos.

## Installation de la base

1. Créer un projet sur Supabase.
2. Ouvrir **SQL Editor**.
3. Copier et exécuter tout le fichier `database.sql`.
4. Ouvrir **Project Settings > API**.
5. Copier :
   - Project URL
   - `anon public` key
6. Les coller dans `assets/js/config.js` :

```js
SUPABASE_URL: 'https://xxxx.supabase.co',
SUPABASE_ANON_KEY: 'votre-cle-anon'
```

## Comptes initiaux

Propriétaire :

- Identifiant : `admin`
- Matricule : `2373`
- Mot de passe : `admin123`

Utilisateur de démonstration :

- Identifiant : `user2373`
- Matricule : `2451`
- Mot de passe : `user123`

Changez les mots de passe après la première connexion.

## Publication GitHub Pages

1. Envoyer tout le dossier dans un repository GitHub.
2. Ouvrir **Settings > Pages**.
3. Choisir **Deploy from a branch**.
4. Sélectionner la branche `main` et le dossier `/root`.
5. Ouvrir l’URL fournie par GitHub Pages.

## Base unique

Le projet n’utilise plus `database.json`. Toutes les données sont enregistrées dans Supabase PostgreSQL via les fonctions sécurisées définies dans `database.sql`. La clé `service_role` ne doit jamais être ajoutée au projet GitHub.

## Développeur

Conçu et développé par **Hossame El Bezzari — Matricule 2373**.
