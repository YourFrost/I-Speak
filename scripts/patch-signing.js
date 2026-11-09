// Après `expo prebuild`, branche la clé de release (gradle.properties) sur le build release.
const fs = require('fs');
const f = 'android/app/build.gradle';
let s = fs.readFileSync(f, 'utf8');
const release = `release {
            storeFile file(MYAPP_STORE_FILE)
            storePassword MYAPP_STORE_PASSWORD
            keyAlias MYAPP_KEY_ALIAS
            keyPassword MYAPP_KEY_PASSWORD
        }
    }
    buildTypes {`;
s = s.replace(/signingConfigs \{([\s\S]*?)\n    \}\n    buildTypes \{/, (m, body) =>
  `signingConfigs {${body}\n        ${release}`);
s = s.replace(
  /(buildTypes \{[\s\S]*?\n        release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
  '$1signingConfig signingConfigs.release',
);
fs.writeFileSync(f, s);
