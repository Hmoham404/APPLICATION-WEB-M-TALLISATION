# MYC - Production & Qualité

Application React + Vite pour les ateliers Métallisation, Assemblage, Injection et Sérigraphie. Saisie directe, sans écran de connexion. Interface française, claire et adaptée aux téléphones, aux tablettes et aux ordinateurs.

## Démarrage

```powershell
npm install
npm run dev
```

Ouvrir l’adresse affichée par Vite. Pour créer la version déployable :

```powershell
npm run build
npm run preview -- --host 0.0.0.0
```

## Mise à jour de la base Supabase

Dans **Supabase > SQL Editor > New query**, coller et exécuter le fichier [`supabase/SQL_EDIT_MYC_V2.sql`](supabase/SQL_EDIT_MYC_V2.sql). Ce script prend en charge les installations neuves et celles qui utilisent déjà le précédent schéma MYC. Il conserve les fiches existantes, ajoute leur département (les anciennes deviennent des fiches de métallisation), crée un index et actualise la fonction de sauvegarde. Il est transactionnel et réexécutable. Le projet ne l’applique pas automatiquement : vous gardez le contrôle de l’exécution.

Configurer `.env` :

```dotenv
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre-cle-publique
```

`VITE_SUPABASE_ANON_KEY` reste accepté. Ne jamais placer une clé `service_role` dans le navigateur. Pour répondre au mode sans connexion demandé, les règles ouvertes concernent seulement les quatre tables `myc_metallisation_*`; les autres tables Supabase ne sont pas modifiées. Le choix du département classe et filtre les fiches, mais ne limite pas les droits d’accès.

## Saisie et rapports

Chaque département possède ses propres types de défauts et champs complémentaires dans [`src/model.js`](src/model.js). Les opérateurs renseignent les quantités par heure, les arrêts de production et le contrôle qualité. Un créneau ajouté est aussi ajouté à la grille qualité ; les heures passent correctement de 23 h à minuit.

Le taux de rebut est calculé en pièces : **NOK / (OK + NOK) × 100**. Le nombre d’occurrences de défauts est suivi indépendamment, car une pièce peut présenter plusieurs défauts. Les contrôles bloquent les quantités négatives, les nombres décimaux, les arrêts sans code et les arrêts dépassant 60 minutes par créneau.

Le téléchargement PDF comprend une synthèse, les données d’identification, les relevés horaires, les arrêts, la grille des défauts, le classement qualité et les zones de visa. Les commentaires longs sont enveloppés et les tableaux paginés. Télécharger un rapport n’enregistre pas automatiquement les modifications ; utilisez **Enregistrer la fiche** si vous souhaitez ajouter le rapport à l’historique partagé.

L’historique permet de retrouver les fiches par département, date, OF, article, client ou poste, puis d’exporter les résultats filtrés au format CSV.

## Données et fonctionnement hors connexion

Le navigateur conserve un brouillon distinct pour chaque département et reprend les anciennes fiches locales. Avec Supabase configuré, la fiche est sauvegardée sur l’appareil avant sa transmission ; en cas de coupure, elle reste dans la file à synchroniser une fois le réseau revenu. L’historique chargé depuis Supabase est paginé par groupes de 500. Sans Supabase, l’enregistrement reste sur l’appareil utilisé. Effacer les données du navigateur efface les brouillons et les fiches non synchronisées. La synchronisation fonctionne tant que l’application est ouverte, sans tâche en arrière-plan après fermeture.

## Installer sur téléphone

Le build comprend le manifeste PWA, des icônes iOS/Android et un service worker qui met en cache le code de l’application. Les appels Supabase ne sont pas mis en cache. Ouvrir le site en ligne une première fois pour préparer l’accès hors connexion.

Pour installer le site sur un téléphone, le déployer sur une adresse **HTTPS** : l’URL locale `http://localhost` fonctionne pour les essais sur ordinateur, mais une adresse `http://192.168…` n’autorise pas l’installation PWA. Sur Android ou Chrome, utiliser **Installer l’application**. Sur iPhone ou iPad : Safari > **Partager** > **Sur l’écran d’accueil**.

Le bouton ouvre la confirmation native lorsque le navigateur propose l’installation. Aucune installation silencieuse n’est possible : l’utilisateur confirme sur son appareil. Sur iPhone, le bouton explique le parcours via le menu Partager. Le site indique aussi quand l’adresse HTTP ou le serveur de développement empêche l’installation.

### Mises à jour et partage entre appareils

Après chaque publication d’une nouvelle version, l’application vérifie les mises à jour à son ouverture, à son retour au premier plan, au retour du réseau et toutes les heures tant qu’elle reste visible. La nouvelle version se télécharge en arrière-plan et le service worker s’active même si d’autres onglets restent ouverts. Les pages ouvertes ne sont pas rechargées de force : le bandeau **Mettre à jour** permet de recharger en conservant le brouillon du département en cours. Les prochaines navigations récupèrent le HTML en ligne, avec repli sur le cache hors connexion. Une modification du code sur le PC doit d’abord être compilée et publiée pour atteindre les téléphones ; aucune réinstallation n’est nécessaire.

Avec la même base Supabase configurée sur le site publié, les fiches enregistrées sont partagées entre appareils. La synchronisation s’exécute à l’ouverture, au retour du réseau, au retour au premier plan et toutes les 30 secondes lorsque l’application est visible. Une saisie hors connexion reste locale jusqu’à la synchronisation ; les brouillons non enregistrés restent propres à l’appareil. Le partage nécessite le script SQL indiqué plus haut. Aucune nouvelle migration SQL n’est nécessaire pour le bouton d’installation ou les mises à jour PWA.

L’hébergement reste sur Vercel : https://application-web-m-tallisation.vercel.app/. Utiliser `npm run build` et le dossier de sortie `dist`, avec les variables publiques Supabase configurées dans Vercel. Publier une nouvelle version sur ce même projet pour conserver l’adresse et l’identité de la PWA. Ne pas publier `.env` ni de clé privée.

Si Android affiche uniquement l’aide, ouvrir le lien dans Chrome en navigation normale et désactiver « Version pour ordinateur ». La fenêtre d’aide affiche **Installer MYC maintenant** dès que le navigateur émet son autorisation d’installation, même si cette autorisation arrive après le clic initial. Une installation déjà existante ou une proposition refusée peut aussi empêcher une nouvelle proposition ; utiliser alors le menu du navigateur ou l’icône MYC déjà installée.

La page dédiée https://application-web-m-tallisation.vercel.app/installer.html permet de lancer l’installation sans ouvrir une ancienne interface mise en cache. La proposition native est capturée avant le démarrage de React par `public/pwa-install.js`. La fenêtre d’aide propose aussi une vérification de mise à jour et les étapes adaptées à Android ou iOS. Le navigateur conserve la décision de proposer et confirmer l’installation ; le site ne peut pas la forcer.

## Vérifications

```powershell
npm test
npm run test:e2e
npm run build
```

Les tests unitaires couvrent les départements, la reprise des fiches, les calculs, les validations et les rapports longs. Les tests Edge couvrent les parcours de saisie, le téléphone et le mode hors connexion. Les tests utilisent une base locale et ne modifient pas Supabase. Les PDF d’exemple et captures de vérification sont produits dans `output/`.
