import { beforeEach, describe, expect, it } from 'vitest';
import { crearAlmacenEnMemoria } from '../src/save/almacen-navegador.js';
import { iniciarGuardado, obtenerGuardado } from '../src/save/guardado.js';
import { CAMPOS_TEMA, temaCompleto } from '../src/tema.js';
import { guardarPreferencia, leerPreferencias, restablecerPreferencias } from '../src/preferencias.js';

describe('temaCompleto', () => {
  it('sin tema guardado usa todos los colores por defecto', () => {
    const tema = temaCompleto(null);
    for (const { id, porDefecto } of CAMPOS_TEMA) expect(tema[id]).toBe(porDefecto);
  });

  it('usa los colores guardados válidos e ignora los que no lo son', () => {
    const tema = temaCompleto({ fondo: '#112233', acento: 'rojo', error: '#FFAA00' });
    expect(tema.fondo).toBe('#112233');
    expect(tema.acento).toBe('#8b7cf6');
    expect(tema.error).toBe('#ffaa00');
  });
});

describe('preferencias', () => {
  beforeEach(async () => {
    await iniciarGuardado(crearAlmacenEnMemoria());
  });

  it('por defecto todo está activado', () => {
    expect(leerPreferencias()).toEqual({ resaltarRelacionadas: true, resaltarIguales: true, mostrarCronometro: true });
  });

  it('guarda una preferencia sin tocar las demás, y se puede restablecer', async () => {
    await guardarPreferencia('mostrarCronometro', false);
    expect(leerPreferencias().mostrarCronometro).toBe(false);
    expect(leerPreferencias().resaltarIguales).toBe(true);

    await restablecerPreferencias();
    expect(obtenerGuardado().perfil.preferencias).toBeNull();
    expect(leerPreferencias().mostrarCronometro).toBe(true);
  });
});
