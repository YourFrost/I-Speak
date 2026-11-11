# I-Speak

Application Android d'apprentissage de langues : gratuite, sans pub, hors ligne, sans compte.
Répétition espacée (FSRS), rappel actif, phrases en contexte. Première langue : l'italien (pour francophones).

> État : jalon 1 (moteur de révision + exercice de traduction, avec un petit pack de test de 24 mots / 26 phrases).

## Développement

```bash
npm install
npm test          # tests unitaires (correction des réponses, planification FSRS)
npm run typecheck
npm run lint
```

## Générer l'APK (GitHub Actions)

Chaque push lance le workflow **Build APK** (`.github/workflows/build-apk.yml`) : tests, puis APK en artefact
(onglet *Actions* → run → *Artifacts* → `i-speak-apk`). Sans clé de release, l'APK est signé avec la clé debug
(suffisant pour tester). Pour que les mises à jour s'installent par-dessus sans perdre les données, créer une clé **une fois** :

```bash
keytool -genkeypair -v -keystore release.keystore -alias ispeak -keyalg RSA -keysize 2048 -validity 36500
base64 -w0 release.keystore   # à coller dans le secret ANDROID_KEYSTORE_BASE64
```

Secrets GitHub à créer : `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD` (même mot de passe pour le magasin et la clé), `ANDROID_KEY_ALIAS` (`ispeak`).
**Sauvegarde `release.keystore` : si tu le perds, il faudra désinstaller l'appli (donc perdre les données non exportées) pour installer une nouvelle version.**

## Checklist de test sur téléphone — jalon 1

1. Installer l'APK (autoriser « sources inconnues »), ouvrir l'appli : l'accueil affiche « 0 révision due ».
2. « Commencer la session » : 5 nouvelles phrases, chacune montrée puis interrogée (traduction fr → it au clavier).
3. Tester : bonne réponse en minuscules et sans ponctuation (acceptée) ; accent oublié (« Correct, attention à l'accent ») ; mauvaise réponse (diff en rouge + bonne réponse, la phrase revient en fin de session).
4. Terminer la session, quitter complètement l'appli, la relancer : les phrases réussies ne sont plus proposées comme nouvelles ; elles deviendront dues dans quelques jours.
5. Les données sont dans SQLite local : rien ne part sur Internet.

## Architecture (résumé)

- `src/engine/` : moteur indépendant de la langue (correction, FSRS, sélection des phrases, exercices).
- `src/packs/` : format de pack, validation, installation en base. `packs/` : les packs embarqués.
- `src/db/` : SQLite (migrations versionnées). Les tests utilisent `node:sqlite` en mémoire, sans téléphone.
- `app/` : écrans (Expo Router).
