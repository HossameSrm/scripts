# SRM Workspace — Metronic Flat V8

Application documentaire interne pour la Direction Clientèle — Département Grands Comptes.

## Design V8

La version 8 adopte une interface plate inspirée de l’organisation visuelle de Metronic Demo 1 :

- Sidebar blanche fixe avec navigation hiérarchique.
- Topbar simple, sans carte flottante ni grand arrondi.
- Navigation secondaire horizontale selon le module.
- Cartes blanches avec bordure légère et rayon discret.
- Formulaires et tableaux compacts.
- Aucun code ou asset commercial de Metronic n’est inclus.

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

Les éléments visuels réutilisables se trouvent dans `resources/js/Components` :

- `Navigation/AppSidebar.js`
- `Navigation/SidebarGroup.js`
- `Navigation/SidebarItem.js`
- `Layout/AppHeader.js`

`resources/js/Layouts/AppLayout.js` assemble uniquement la Sidebar, le Header, le contenu et le Footer.

## Page Clients

La page `client.html` permet de gérer depuis le même écran :

- les informations générales du client ;
- plusieurs contrats EAU, BT ou MT ;
- les adresses propres à chaque contrat ;
- les factures impayées et leurs soldes ;
- le statut du client et des contrats.

Le choix « personne / société » appartient au demandeur de la facilité de paiement dans `calcul.html`; il n’est plus affiché dans la fiche client.


Ces identifiants ne sont pas affichés dans la page d’authentification.

## Supabase

1. Créer un projet Supabase.
2. Exécuter `database/database.sql` dans SQL Editor.
3. Compléter `config/app.js` avec l’URL et la clé publique anon.
4. Ne jamais publier la clé `service_role`.

Sans Supabase, l’application utilise sa base locale de démonstration.

## GitHub Pages

Copier directement le contenu de ce dossier à la racine du dépôt. `index.html` doit rester à la racine.
