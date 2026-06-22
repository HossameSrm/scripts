# Architecture Inertia-style

Le projet reste compatible avec GitHub Pages, donc il n’exécute pas Laravel côté serveur. Cependant, son organisation reproduit les responsabilités d’une application Laravel + InertiaJS.

## Cycle d’une page

```text
HTML entry point
    ↓
routes/web.js
    ↓
resources/js/Layouts/AppLayout.js
    ↓
resources/js/Pages/<Module>/<Page>.js
    ↓
app/Http/Controllers/<Controller>.js
    ↓
app/Models/<Model>.js
    ↓
Base locale ou Supabase PostgreSQL
```

## Responsabilités

### Controllers

Les Controllers reçoivent les événements de l’interface, appellent les Models et demandent aux Pages de mettre à jour l’affichage.

### Models

Les Models ne génèrent pas d’interface. Ils centralisent les appels RPC, la session, les utilisateurs, les documents et l’historique.

### Pages

Chaque page contient uniquement la logique de présentation propre à son écran.

La page `Clients/Index` constitue un espace de travail complet : identité du client, contrats multiples, services EAU/BT/MT, adresses, factures impayées, soldes et statuts.

### Layouts

- `AuthLayout` : écran de connexion.
- `AppLayout` : Sidebar, Header blur, sélection du client et contrôle des permissions.

### Components

Les éléments communs sont regroupés dans `resources/js/Components` : navigation, boutons, cards, tables, badges, modals et notifications.

## Routes

`routes/web.js` est la source centrale des pages accessibles dans la Sidebar. Chaque route contient :

- `href`
- `key`
- `module`
- `label`
- `icon`
- `page`

## Base de données

Une seule base est utilisée : `database/database.sql`.

Elle contient notamment :

- paramètres de l’application ;
- utilisateurs ;
- permissions ;
- sessions ;
- clients ;
- contrats ;
- arriérés ;
- documents ;
- journal d’activité.
