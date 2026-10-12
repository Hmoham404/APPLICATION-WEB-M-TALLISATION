# MYC · Suivi de production – Métallisation

Application React + Vite, Tailwind CSS, Supabase PostgreSQL et pdf-lib. Interface française, optimisée pour ordinateur, tablette et mobile.

## Démarrer

1. Installez Node.js 20 ou ultérieur.
2. Dans le dossier du projet, lancez `npm install` puis `npm run dev`.
3. Renseignez `.env` avec l’URL Supabase et `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Dans l’éditeur SQL Supabase, exécutez `supabase/schema.sql`.

Le site s’ouvre directement sans écran de connexion. Les fiches MYC Métallisation sont accessibles en lecture et en écriture à toute personne pouvant atteindre l’application et son API. Les règles RLS de ce projet n’ouvrent que les tables dédiées `myc_metallisation_`; les autres tables Supabase ne sont pas modifiées. Sans variables Supabase, l’application conserve les saisies localement dans le navigateur.

## Téléchargement des PDF

Depuis la saisie et l’historique, les deux PDF Production et Défauts sont toujours téléchargeables à partir des données. Tant que les modèles originaux ne sont pas fournis, pdf-lib crée un rapport numérique de remplacement, sur une page A4 paysage, avec les informations générales, les relevés horaires, les défauts, les totaux et le graphique dans le PDF Qualité. Le rapport porte la mention « modèle original non fourni » et ne reproduit pas la mise en page papier MYC.

Pour retrouver exactement les fiches papier, placez les PDF vierges originaux ici :

- `public/templates/production-original.pdf`
- `public/templates/defauts-original.pdf`

Puis renseignez les positions dans `PDF_LAYOUT.production.fields` et `PDF_LAYOUT.quality.fields` dans `src/pdf.js`. Les modèles originaux serviront alors de fonds ; le rapport numérique reste disponible en secours si un modèle est manquant.

## Données

`myc_metallisation_reports.record_data` conserve la saisie complète à réouvrir ; `myc_metallisation_hourly_entries`, `myc_metallisation_stoppages` et `myc_metallisation_quality_defects` conservent les mesures sous forme relationnelle. La fonction `save_myc_metallisation_report` met à jour l’ensemble en une transaction. Les tables ont RLS ; les politiques `anon` sont ouvertes uniquement sur les tables MYC Métallisation pour autoriser l’usage sans connexion.

Les créneaux horaires de démarrage sont 07:00–16:00 dans `src/App.jsx` (`TIMES`) et peuvent être remplacés par ceux des formulaires papier originaux.
