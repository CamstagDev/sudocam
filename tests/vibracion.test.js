import { beforeEach, describe, expect, it } from 'vitest';
import { crearAlmacenEnMemoria } from '../src/save/almacen-navegador.js';
import { iniciarGuardado } from '../src/save/guardado.js';
import { guardarPreferencia, leerPreferencias } from '../src/preferencias.js';
import { PATRONES, debeVibrar, vibracionDisponible } from '../src/vibracion.js';

describe('vibración', () => {
  beforeEach(async () => {
    await iniciarGuardado(crearAlmacenEnMemoria());
  });

  it('viene prendida por defecto, también en guardados viejos sin el campo', () => {
    expect(leerPreferencias().vibracion).toBe(true);
  });

  it('solo hay vibración en Android', () => {
    expect(vibracionDisponible('android')).toBe(true);
    expect(vibracionDisponible('web')).toBe(false);
    expect(vibracionDisponible('electron')).toBe(false);
  });

  it('vibra en Android con la preferencia prendida, y nunca en PC o navegador', () => {
    const preferencias = { vibracion: true };
    for (const tipo of Object.keys(PATRONES)) {
      expect(debeVibrar(tipo, { plataforma: 'android', preferencias })).toBe(true);
      expect(debeVibrar(tipo, { plataforma: 'web', preferencias })).toBe(false);
    }
    expect(debeVibrar('inventado', { plataforma: 'android', preferencias })).toBe(false);
  });

  it('apagarla en preferencias la apaga', async () => {
    await guardarPreferencia('vibracion', false);
    expect(debeVibrar('error', { plataforma: 'android', preferencias: leerPreferencias() })).toBe(false);
  });
});
