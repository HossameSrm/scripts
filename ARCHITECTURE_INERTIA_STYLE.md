# Architecture Inertia-style — Version 7

Le projet reste compatible avec GitHub Pages (HTML/CSS/JavaScript sans compilation), mais son organisation reprend les responsabilités d'une application Laravel + Inertia.

```text
app/
├── Http/Controllers/
└── Models/

resources/js/
├── Components/
│   ├── Layout/
│   │   └── AppHeader.js
│   ├── Navigation/
│   │   ├── AppSidebar.js
│   │   ├── SidebarGroup.js
│   │   └── SidebarItem.js
│   └── UI.js
├── Core/
├── Layouts/
│   ├── AppLayout.js
│   ├── AuthLayout.js
│   └── bootstrap.js
├── Pages/
├── Services/
└── app.js

routes/web.js
config/app.js
database/database.sql
```

## Responsabilités

- **Components** : éléments visuels réutilisables. La Sidebar et le Header sont ici.
- **Layouts** : assemblent les Components et le contenu des pages.
- **Pages** : logique d'affichage propre à chaque écran.
- **Controllers** : orchestration et événements.
- **Models** : accès aux données locales ou Supabase.
- **Core** : router, session et EventBus.

`AppLayout.js` ne contient plus le code complet de la Sidebar. Il instancie `AppSidebar` et `AppHeader`.
