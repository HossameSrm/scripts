# SRM Workspace — Metronic Components V7

Application documentaire interne pour le Département Grands Comptes.

## Modules

- Tableau de bord
- Clients, contrats et arriérés
- Facilité de paiement
- Ordre de coupure
- Mise en demeure
- Historique
- Utilisateurs, rôles et permissions
- Page À propos

## Architecture

La version 7 place les éléments visuels réutilisables dans `resources/js/Components` :

- `Navigation/AppSidebar.js`
- `Navigation/SidebarGroup.js`
- `Navigation/SidebarItem.js`
- `Layout/AppHeader.js`

`resources/js/Layouts/AppLayout.js` assemble seulement ces composants autour de la page courante.

## Connexion locale initiale

- Identifiant : `hossame`
- Mot de passe : `titigoza123`

Les identifiants ne sont pas affichés dans la page d'authentification.

## Supabase

1. Créer un projet Supabase.
2. Exécuter `database/database.sql` dans SQL Editor.
3. Compléter `config/app.js` avec l'URL et la clé publique anon.
4. Ne jamais publier la clé `service_role`.

Sans Supabase, l'application utilise son stockage local de démonstration.

## GitHub Pages

Copier directement le contenu de ce dossier à la racine du dépôt. Le fichier `index.html` doit être à la racine.
