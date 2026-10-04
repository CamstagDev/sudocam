// Prepara una versión nueva del juego:
//
//   npm run version:nueva -- parche     0.1.0 -> 0.1.1   (arreglos)
//   npm run version:nueva -- menor      0.1.0 -> 0.2.0   (cosas nuevas)
//   npm run version:nueva -- mayor      0.1.0 -> 1.0.0
//   npm run version:nueva -- 1.0.0      una versión exacta
//
// Qué hace:
//  1. Cambia "version" en package.json (de ahí la leen el menú, el
//     instalador de Windows y la app de Android).
//  2. Convierte la sección "Sin publicar" de CHANGELOG.md en la de esta
//     versión, con la fecha de hoy. Antes de correrlo, anota ahí los
//     cambios.
//  3. Hace el commit y la etiqueta vX.Y.Z.
//
// Al subir la etiqueta (git push --follow-tags), GitHub Actions compila el
// instalador de Windows y el APK de Android y los publica en una Release
// (ver .github/workflows/release.yml).

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);
const leer = (archivo) => readFileSync(new URL(archivo, raiz), 'utf8');
const escribir = (archivo, texto) => writeFileSync(new URL(archivo, raiz), texto);
const git = (...argumentos) => execFileSync('git', argumentos, { cwd: raiz, stdio: 'inherit' });

function siguienteVersion(actual, pedido) {
  if (/^\d+\.\d+\.\d+$/.test(pedido)) return pedido;
  const [mayor, menor, parche] = actual.split('.').map(Number);
  if (pedido === 'mayor') return `${mayor + 1}.0.0`;
  if (pedido === 'menor') return `${mayor}.${menor + 1}.0`;
  if (pedido === 'parche') return `${mayor}.${menor}.${parche + 1}`;
  throw new Error('Uso: npm run version:nueva -- parche | menor | mayor | X.Y.Z');
}

const paquete = JSON.parse(leer('package.json'));
const version = siguienteVersion(paquete.version, process.argv[2]);

const changelog = leer('CHANGELOG.md');
if (!changelog.includes('## Sin publicar')) {
  throw new Error('CHANGELOG.md no tiene una sección "## Sin publicar" con los cambios de esta versión.');
}

paquete.version = version;
escribir('package.json', `${JSON.stringify(paquete, null, 2)}\n`);

const hoy = new Date().toISOString().slice(0, 10);
escribir('CHANGELOG.md', changelog.replace('## Sin publicar', `## Sin publicar\n\n## ${version} (${hoy})`));

git('add', 'package.json', 'CHANGELOG.md');
git('commit', '-m', `Versión ${version}`);
git('tag', '-a', `v${version}`, '-m', `Versión ${version}`);

console.log(`\nListo: versión ${version}. Para publicarla: git push --follow-tags`);
