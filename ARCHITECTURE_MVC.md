# Flux MVC de l’application

## Authentification

```text
index.html
   ↓
AuthController
   ├── AuthView : champs, erreurs et état de chargement
   └── AuthModel : connexion, session et bootstrap
          ↓
     DatabaseModel
          ↓
       Supabase
```

## Page protégée

```text
HTML View
   ↓
LayoutController
   ├── AppModel : session et données communes
   ├── AppLayoutView : Sidebar + Header blur
   ├── NavigationView : liens selon permissions
   └── Router : page actuelle et redirections
```

## Administration

```text
AdminController
   ├── UserModel : appels PostgreSQL/Supabase
   └── AdminView : tableau, modals et permissions UI
```

## Documents

Chaque générateur dispose de son Controller :

- `PaymentScheduleController.js`
- `CutOrderController.js`
- `FormalNoticeController.js`

Le `ClientDataController` reçoit le client sélectionné dans le Header et transmet ses contrats et arriérés au générateur actif.

## Communication interne

`EventBus` diffuse principalement :

- `app:ready` après chargement de la session, des permissions et des clients ;
- `app:client-selected` lorsqu’un client est choisi dans le Header.
