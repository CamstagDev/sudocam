import { beforeEach, describe, expect, it } from 'vitest';
import { crearAlmacenEnMemoria } from '../src/save/almacen-navegador.js';
import { iniciarGuardado, obtenerGuardado } from '../src/save/guardado.js';
import { TEMAS, temaCompleto, temaEnUso } from '../src/tema.js';
import { guardarPreferencia, leerPreferencias, restablecerPreferencias } from '../src/preferencias.js';

describe('temaCompleto', () => {
  it('sin tema guardado usa los colores del tema SudoCam', () => {
    expect(temaCompleto(null)).toEqual(TEMAS[0].colores);
  });

  it('usa los colores guardados válidos e ignora los que no lo son', () => {
    const tema = temaCompleto({ fondo: '#112233', acento: 'rojo', error: '#FFAA00' });
    expect(tema.fondo).toBe('#112233');
    expect(tema.acento).toBe('#8b7cf6');
    expect(tema.error).toBe('#ffaa00');
  });

  it('un guardado sin "resaltado" toma el de su tema, o uno sacado del fondo y el texto', () => {
    const { resaltado, ...sakuraViejo } = TEMAS[4].colores;
    expect(temaCompleto(sakuraViejo).resaltado).toBe(resaltado);

    const personalizadoViejo = { ...sakuraViejo, acento: '#123456' };
    expect(temaCompleto(personalizadoViejo).resaltado).toMatch(/^#[0-9a-f]{6}$/);
    expect(temaEnUso(personalizadoViejo)).toBe('personalizado');
  });
});

describe('temaEnUso', () => {
  it('reconoce cada tema predefinido por sus colores', () => {
    for (const tema of TEMAS) expect(temaEnUso(tema.colores)).toBe(tema.id);
    expect(temaEnUso(null)).toBe('sudocam');
  });

  it('si se cambia un color, pasa a personalizado', () => {
    expect(temaEnUso({ ...TEMAS[4].colores, texto: '#123456' })).toBe('personalizado');
  });

  it('todos los temas traen todos los colores', () => {
    for (const tema of TEMAS) expect(temaCompleto(tema.colores)).toEqual(tema.colores);
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
