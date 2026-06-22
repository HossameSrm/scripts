SRM-FM DOCUMENTS — APPLICATION HTML STATIQUE

Connexion de démonstration :
- Identifiant : admin
- Mot de passe : admin123

Fichiers principaux :
- index.html : Auth layout / connexion
- calcul.html : Facilité de paiement
- order_coupure.html : Ordre de coupure
- mise_en_demeure.html : Mise en demeure
- layouts/auth.js : layout d'authentification
- layouts/layout.js : layout principal commun (sidebar + header blur)
- database.json : utilisateurs, clients, contrats et arriérés

Utilisation :
1. Ouvrir index.html.
2. Se connecter.
3. Choisir un client dans le header : les données de database.json remplissent la page active.

Pour charger database.json directement, publier tout le dossier sur GitHub Pages ou utiliser un serveur HTTP statique.
En ouverture directe file://, l'application utilise automatiquement le cache ou les données de secours intégrées.

Sécurité :
Cette version est une application HTML statique. Les identifiants dans database.json ne constituent pas une authentification serveur sécurisée.
