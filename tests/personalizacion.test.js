import { beforeEach, describe, expect, it } from 'vitest';
import { crearAlmacenEnMemoria } from '../src/save/almacen-navegador.js';
import { iniciarGuardado, obtenerGuardado } from '../src/save/guardado.js';
import {
  TEMAS,
  TEMAS_DE_JEFES,
  temaCompleto,
  temaDeJefe,
  temaEnUso,
  temasDeJefesDisponibles,
  valoresDelTema,
} from '../src/tema.js';
import { imagenDeBorde } from '../src/bordes.js';
import { guardarPreferencia, leerPreferencias, restablecerPreferencias } from '../src/preferencias.js';

describe('temaCompleto', () => {
  it('sin tema guardado usa los valores del tema SudoCam', () => {
    expect(temaCompleto(null)).toEqual(valoresDelTema(TEMAS[0]));
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

  it('los números del jugador tienen su propio color, aparte del texto', () => {
    const tema = temaCompleto({ ...TEMAS[5].colores, texto: '#000000', numeros: '#ff69b4' });
    expect(tema.texto).toBe('#000000');
    expect(tema.numeros).toBe('#ff69b4');
  });

  it('un guardado sin "numeros" los ve del color de su texto, como antes', () => {
    const { numeros, ...papelViejo } = TEMAS[5].colores;
    expect(temaCompleto(papelViejo).numeros).toBe(numeros);
    expect(temaEnUso(papelViejo)).toBe('papel');

    const personalizadoViejo = { ...papelViejo, texto: '#123456' };
    expect(temaCompleto(personalizadoViejo).numeros).toBe('#123456');
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

  it('todos los temas traen todos los colores y un borde válido', () => {
    for (const tema of TEMAS) expect(temaCompleto(valoresDelTema(tema))).toEqual(valoresDelTema(tema));
  });

  it('cambiar solo el borde también pasa a personalizado', () => {
    const sakura = valoresDelTema(TEMAS.find(({ id }) => id === 'sakura'));
    expect(temaEnUso(sakura)).toBe('sakura');
    expect(temaEnUso({ ...sakura, borde: 'linea' })).toBe('personalizado');
  });

  it('un guardado sin borde toma el de su tema, o la línea normal', () => {
    const sakura = TEMAS.find(({ id }) => id === 'sakura');
    expect(temaCompleto(sakura.colores).borde).toBe('sakura');
    expect(temaCompleto({ ...sakura.colores, acento: '#123456' }).borde).toBe('linea');
    expect(temaCompleto({ ...sakura.colores, borde: 'inventado' }).borde).toBe('sakura');
  });

  it('el borde de línea no lleva imagen y el de pétalos sí, del color pedido', () => {
    expect(imagenDeBorde('linea', '#ff0000')).toBe('none');
    expect(decodeURIComponent(imagenDeBorde('sakura', '#ff0000'))).toContain('fill="#ff0000"');
  });
});

describe('preferencias', () => {
  beforeEach(async () => {
    await iniciarGuardado(crearAlmacenEnMemoria());
  });

  it('por defecto: las ayudas activadas y los temas de jefes sin sobrescribir', () => {
    expect(leerPreferencias()).toEqual({
      resaltarRelacionadas: true,
      resaltarIguales: true,
      mostrarCronometro: true,
      sobrescribirTemasDeJefes: false,
    });
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

describe('temas de jefes', () => {
  beforeEach(async () => {
    await iniciarGuardado(crearAlmacenEnMemoria());
  });

  it('cada uno trae todos los colores y se reconoce como "en uso"', () => {
    for (const tema of TEMAS_DE_JEFES) {
      expect(temaCompleto(valoresDelTema(tema))).toEqual(valoresDelTema(tema));
      expect(temaEnUso(valoresDelTema(tema))).toBe(tema.id);
    }
  });

  it('las uber sin tema propio usan el de su versión normal; Uber Jörmungandr tiene el suyo', () => {
    expect(temaDeJefe('uriel_uber').id).toBe('uriel');
    expect(temaDeJefe('hecate_uber').id).toBe('hecate');
    expect(temaDeJefe('jormungandr').id).toBe('jormungandr');
    expect(temaDeJefe('jormungandr_uber').id).toBe('jormungandr-uber');
    expect(temaDeJefe('babel').id).toBe('babel');
    expect(temaDeJefe('babel_uber').id).toBe('babel-uber');
    expect(temaDeJefe('typhon')).toBeNull();
  });

  it('solo se pueden elegir los de los jefes vencidos al menos una vez', () => {
    expect(temasDeJefesDisponibles()).toEqual([]);
    obtenerGuardado().jefes.hecate = { victorias: 1 };
    expect(temasDeJefesDisponibles().map(({ id }) => id)).toEqual(['hecate']);
  });
});
