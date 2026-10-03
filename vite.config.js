import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// base: './' -- rutas relativas en el build, para que el mismo `dist/`
// funcione dentro de Electron (Windows) y Capacitor (Android), no solo
// servido desde la raíz de un dominio.
export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  server: {
    port: 5173,
  },
  test: {
    include: ['tests/**/*.test.js'],
  },
});
