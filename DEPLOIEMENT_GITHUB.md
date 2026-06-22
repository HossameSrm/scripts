# Déploiement GitHub Pages

## Mise en ligne

1. Supprimez les anciens fichiers du dépôt pour éviter les doublons.
2. Copiez tout le contenu du ZIP à la racine du dépôt.
3. Faites Commit puis Push.
4. Dans GitHub : Settings → Pages.
5. Sélectionnez la branche principale et le dossier `/root`.

## Mise à jour

Les ressources utilisent la version `6.0.0` dans les URLs afin de limiter les problèmes de cache.

Après le déploiement :

```text
Ctrl + F5
```

Vous pouvez également ouvrir le lien avec :

```text
?v=6
```

## Base partagée

GitHub Pages ne peut pas écrire dans un fichier JSON du dépôt. Pour partager les mêmes utilisateurs, permissions, clients et historiques entre plusieurs employés, configurez Supabase dans `config/app.js` après avoir exécuté `database/database.sql`.
