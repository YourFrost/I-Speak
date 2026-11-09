# I-Speak

Application Android d'apprentissage de langues : gratuite, sans pub, hors ligne, sans compte.
Répétition espacée (FSRS), rappel actif, phrases en contexte. Première langue : l'italien (pour francophones).

> État : jalon 0 (socle) + début du jalon 1 (moteur de correction et de planification). Voir le plan dans l'historique du projet.

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
