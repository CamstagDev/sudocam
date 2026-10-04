// Corre el Gradle del proyecto de Android (android/gradlew), igual en
// Windows que en Linux/macOS: `node scripts/gradle.mjs assembleDebug`.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const carpetaAndroid = fileURLToPath(new URL('../android/', import.meta.url));
const enWindows = process.platform === 'win32';
// Ruta completa: algunas terminales de Windows no buscan programas en la
// carpeta actual.
const gradlew = path.join(carpetaAndroid, enWindows ? 'gradlew.bat' : 'gradlew');

const resultado = spawnSync(gradlew, process.argv.slice(2), {
  cwd: carpetaAndroid,
  stdio: 'inherit',
  shell: enWindows, // los .bat necesitan cmd
});
process.exit(resultado.status ?? 1);
