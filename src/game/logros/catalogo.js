// Catálogo completo de logros, en el orden en que se muestran.
//
// En el guardado solo se anota cuáles se ganaron y cuándo
// (guardado.logros = { id: fechaISO }); nombres, descripciones e iconos
// viven aquí. Agregar un logro nuevo no necesita migrar el guardado.
//
// `progreso(guardado)` (opcional) devuelve { actual, objetivo } para los
// logros que piden juntar varias cosas; la pantalla de Logros lo muestra
// como barra mientras sigue bloqueado.
//
// `jefe` (opcional) es el jefe del que habla el logro: mientras ese jefe
// siga bloqueado, el logro no se muestra en ninguna parte (ver visibles.js).
// "Cazador de jefes" no lleva `jefe` a propósito: es el único que puede
// adelantar cuántos jefes hay.

// Jefes "normales" (no uber): "Cazador de jefes" pide vencerlos a todos.
export const JEFES_NORMALES = ['uriel', 'hecate', 'jormungandr', 'babel', 'typhon'];

function totalSudokus(guardado) {
  return Object.values(guardado.estadisticas.sudokusCompletados).reduce((suma, n) => suma + n, 0);
}

function jefesNormalesVencidos(guardado) {
  return JEFES_NORMALES.filter((jefe) => (guardado.jefes[jefe]?.victorias ?? 0) > 0).length;
}

function progresoDeSudokus(objetivo) {
  return (guardado) => ({ actual: totalSudokus(guardado), objetivo });
}

export const SECCIONES = [
  {
    id: 'sudokus',
    nombre: 'Sudokus',
    logros: [
      { id: 'primer_sudoku', nombre: 'Primeros pasos', descripcion: 'Completa tu primer sudoku.', icono: '🔢' },
      { id: 'sudoku_facil', nombre: 'Calentando motores', descripcion: 'Completa un sudoku de dificultad fácil.', icono: '🟢' },
      { id: 'sudoku_medio', nombre: 'En terreno conocido', descripcion: 'Completa un sudoku de dificultad medio.', icono: '🟡' },
      { id: 'sudoku_dificil', nombre: 'Sin miedo', descripcion: 'Completa un sudoku de dificultad difícil.', icono: '🔴' },
      { id: 'sudokus_5', nombre: 'Agarrando ritmo', descripcion: 'Completa 5 sudokus (de cualquier dificultad).', icono: '📗', progreso: progresoDeSudokus(5) },
      { id: 'sudokus_10', nombre: 'Costumbre', descripcion: 'Completa 10 sudokus (de cualquier dificultad).', icono: '📘', progreso: progresoDeSudokus(10) },
      { id: 'sudokus_100', nombre: 'Maestro del lápiz', descripcion: 'Completa 100 sudokus (de cualquier dificultad).', icono: '📚', progreso: progresoDeSudokus(100) },
    ],
  },
  {
    id: 'jefes',
    nombre: 'Jefes',
    logros: [
      { id: 'uriel_derrotado', jefe: 'uriel', nombre: 'El patrón se rompe', descripcion: 'Vence a Uriel.', icono: '👹' },
      { id: 'uriel_aleteo_mariposa', jefe: 'uriel', nombre: 'Aleteo de mariposa', descripcion: 'Vence a Uriel sin dejar que anote ni un solo punto.', icono: '🦋' },
      { id: 'hecate_derrotada', jefe: 'hecate', nombre: 'Escape de la locura', descripcion: 'Vence a Hecate.', icono: '🔮' },
      { id: 'hecate_sin_pasiva', jefe: 'hecate', nombre: 'Cordura intacta', descripcion: 'Vence a Hecate sin que su pasiva Pesar Castigador se dispare: sin cometer ni un error.', icono: '🧘' },
      { id: 'jormungandr_derrotado', jefe: 'jormungandr', nombre: 'La serpiente se muerde la cola', descripcion: 'Vence a Jörmungandr.', icono: '🐍' },
      { id: 'jormungandr_hambruna', jefe: 'jormungandr', nombre: 'Hambruna', descripcion: 'Vence a Jörmungandr sin que llegue nunca a la fase 2.', icono: '🥀' },
      { id: 'babel_derrotado_facil', jefe: 'babel', nombre: 'Primeras sílabas', descripcion: 'Vence a Babel en dificultad fácil.', icono: '🗼' },
      { id: 'babel_derrotado_medio', jefe: 'babel', nombre: 'Lenguas cruzadas', descripcion: 'Vence a Babel en dificultad medio.', icono: '🗿' },
      { id: 'babel_derrotado_dificil', jefe: 'babel', nombre: 'Políglota', descripcion: 'Vence a Babel en dificultad difícil.', icono: '📜' },
      {
        id: 'todos_los_jefes',
        nombre: 'Cazador de jefes',
        descripcion: 'Vence a todos los jefes.',
        icono: '🏆',
        progreso: (guardado) => ({ actual: jefesNormalesVencidos(guardado), objetivo: JEFES_NORMALES.length }),
      },
      { id: 'typhon_derrotado', jefe: 'typhon', nombre: 'Calma tras la tormenta', descripcion: 'Vence a Typhon.', icono: '🌪️' },
      { id: 'typhon_ojo_de_la_tormenta', jefe: 'typhon', nombre: 'Ojo de la tormenta', descripcion: 'Vence a Typhon sin cometer ni un error a pesar de los giros.', icono: '🧭' },
      { id: 'uriel_uber_derrotado', jefe: 'uriel_uber', nombre: 'Doble patrón', descripcion: 'Vence a Uber Uriel.', icono: '💠' },
      { id: 'hecate_uber_derrotada', jefe: 'hecate_uber', nombre: 'Ilusión perfecta', descripcion: 'Vence a Uber Hecate.', icono: '✨' },
      { id: 'jormungandr_uber_derrotado', jefe: 'jormungandr_uber', nombre: 'Hambre insaciable', descripcion: 'Vence a Uber Jörmungandr.', icono: '🌀' },
      { id: 'babel_uber_derrotado', jefe: 'babel_uber', nombre: 'La torre no cae', descripcion: 'Vence a Uber Babel.', icono: '⚡' },
      { id: 'typhon_uber_derrotado', jefe: 'typhon_uber', nombre: 'Padre del caos', descripcion: 'Vence a Uber Typhon.', icono: '👁️' },
    ],
  },
];

export const CATALOGO = SECCIONES.flatMap((seccion) => seccion.logros);

export function buscarLogro(id) {
  return CATALOGO.find((logro) => logro.id === id) ?? null;
}
