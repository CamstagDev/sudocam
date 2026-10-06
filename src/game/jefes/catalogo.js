// Catálogo de jefes: nombre, descripción y lo que muestra su página de
// información (Información del jefe).
//
// Cada sección de la página (ataque1, ataque2, secreto) se desbloquea
// según las estadísticas del jugador contra ese jefe (ver registro.js):
//   { victorias, mejorTiempo, victoriasRapidas, mejorMarca }
// Un jefe está "completamente investigado" cuando sus tres secciones están
// desbloqueadas; eso habilita su versión uber.

// Ganar por debajo de esto cuenta como "victoria rápida" (3:33).
export const SEGUNDOS_VICTORIA_RAPIDA = 213;

const sinErrores = (stats) => stats.mejorMarca !== null && stats.mejorMarca.errores === 0;
const ganoEnMenosDe = (segundos) => (stats) => stats.mejorTiempo !== null && stats.mejorTiempo < segundos;

export const JEFES = {
  uriel: {
    nombre: 'Uriel',
    descripcion: 'El jefe de los patrones: el más fácil de SudoCam... por ahora.',
    emoji: '👹',
    ataque1: {
      titulo: 'Ataque básico: búsqueda fácil',
      texto: 'Cada 15 segundos, Uriel elige al azar una caja de 3x3 incompleta y busca una fila, columna o caja a la que solo le falte un número. Si la encuentra, la completa y se anota el punto.',
      seDesbloqueaCon: (stats) => stats.victorias >= 1,
      pista: 'Gana una vez a Uriel para desbloquear esto.',
    },
    ataque2: {
      titulo: 'Ataque secundario: búsqueda por descarte',
      texto: 'Cuando se llena la mitad del tablero, Uriel entra en fase 2: cada 30 segundos, además de su búsqueda fácil, busca por descarte. Si un número ya aparece en dos de las tres filas o columnas de una caja, deduce que solo puede ir en la que queda libre.',
      seDesbloqueaCon: ganoEnMenosDe(300),
      pista: 'Gana a Uriel en menos de 5:00 para desbloquear esto.',
    },
    secreto: {
      titulo: '¿Secreto?',
      texto: 'Toca 3 veces el retrato de Uriel durante la pelea para forzar su fase 2 al instante, sin esperar a que se llene la mitad del tablero.',
      seDesbloqueaCon: (stats) => stats.victorias >= 5 && stats.victoriasRapidas >= 1,
      pista: 'Gana a Uriel 5 veces, con al menos una en menos de 3:33, para desbloquear esto.',
    },
  },
  hecate: {
    nombre: 'Hecate',
    descripcion: 'La jefa de la magia y las ilusiones.',
    emoji: '🔮',
    ataque1: {
      titulo: 'Visiones ilusorias',
      texto: 'Cada 15 segundos, Hecate encanta una celda vacía haciendo que parezca tener un número que en realidad no está ahí. La ilusión dura 10 segundos antes de desvanecerse; en esta versión normal parpadea lento, así que si prestas atención puedes notarla.',
      seDesbloqueaCon: (stats) => stats.victorias >= 1,
      pista: 'Gana una vez a Hecate para desbloquear esto.',
    },
    ataque2: {
      titulo: 'Fase 2: aullido paralizante y maldición de pesadilla',
      texto: 'Cuando el tablero llega al 80% resuelto (o queda 1 minuto en el reloj), Hecate entra en fase 2: cada 20 segundos "convierte en piedra" un dígito del teclado (primero avisa, luego lo deja inutilizable un rato), y cada 10 segundos disfraza uno de tus números o notas con un valor falso durante 10 segundos.',
      seDesbloqueaCon: ganoEnMenosDe(600),
      pista: 'Gana a Hecate en 10:00 o menos para desbloquear esto.',
    },
    secreto: {
      titulo: 'Pasiva: Pesar Castigador',
      texto: 'Cada error que cometas le resta 1 minuto al reloj; si eso lo hace llegar a 0, es derrota inmediata. Contra Hecate conviene jugar sobre seguro antes que rápido.',
      seDesbloqueaCon: sinErrores,
      pista: 'Gana a Hecate sin cometer ni un error para desbloquear esto.',
    },
  },
  jormungandr: {
    nombre: 'Jörmungandr',
    descripcion: 'La serpiente que rodea el tablero: se lo va tragando de a poco.',
    emoji: '🐍',
    ataque1: {
      titulo: 'Hambre',
      texto: 'Cada 60 segundos, Jörmungandr devora un número que hayas puesto: la celda queda vacía otra vez, como si nunca lo hubieras escrito.',
      seDesbloqueaCon: (stats) => stats.victorias >= 1,
      pista: 'Gana una vez a Jörmungandr para desbloquear esto.',
    },
    ataque2: {
      titulo: 'Fase 2: Glotonería (pasiva: Ouroboros)',
      texto: 'Ouroboros cuenta cuántos números tiene Jörmungandr en el vientre: sube cada vez que come y baja cada vez que colocas un número nuevo. Al llegar a 10, Hambre se convierte en Glotonería: devora una pista original del tablero (dejándola editable), y si ya no quedan, devora 2 números tuyos de golpe. Como el vientre sube y baja, puede entrar y salir de la fase 2 varias veces.',
      seDesbloqueaCon: ganoEnMenosDe(900),
      pista: 'Gana a Jörmungandr en 15:00 o menos para desbloquear esto.',
    },
    secreto: {
      titulo: '¿Secreto?',
      texto: 'Selecciona una celda con un número (tuyo o una pista original) y toca el icono de Ouroboros para dárselo de comer tú mismo. Si es una pista original, cuenta doble.',
      seDesbloqueaCon: (stats) => stats.victorias >= 3,
      pista: 'Gana a Jörmungandr 3 veces para desbloquear esto.',
    },
  },
  babel: {
    nombre: 'Babel',
    descripcion: 'La torre de los idiomas perdidos: no vas a reconocer un solo número.',
    emoji: '🗼',
    ataque1: {
      titulo: 'Pasiva: &%?#',
      texto: 'Babel no usa los números del 1 al 9: al empezar la pelea le asigna a cada uno un símbolo al azar, y así se ven en el tablero y en los botones (que además no están en orden).',
      seDesbloqueaCon: (stats) => stats.victorias >= 1,
      pista: 'Gana una vez a Babel (en cualquier dificultad) para desbloquear esto.',
    },
    ataque2: {
      titulo: 'Pasiva: La lengua evoluciona',
      texto: 'Cada vez que completas una caja de 3x3, Babel se reinventa: asigna un nuevo juego de 9 símbolos al azar para todo el tablero y reordena los botones.',
      seDesbloqueaCon: ganoEnMenosDe(900),
      pista: 'Gana a Babel en 15:00 o menos para desbloquear esto.',
    },
    secreto: {
      titulo: '¿Secreto?',
      texto: 'No hay ningún truco escondido contra Babel: su única piedad es que, debajo de los símbolos, sigue siendo un sudoku normal.',
      seDesbloqueaCon: sinErrores,
      pista: 'Gana a Babel sin cometer ni un error para desbloquear esto.',
    },
  },
  typhon: {
    nombre: 'Typhon',
    descripcion: 'El jefe de los multi sudoku: cuatro tableros enganchados en círculo, y ninguno se queda quieto.',
    emoji: '🌪️',
    ataque1: {
      titulo: 'Pasiva: Amalgamación',
      texto: 'El círculo de Typhon junta 2 tableros en difícil y 2 en extremo. Cerca de las esquinas donde dos tableros se tocan, las dificultades se manchan un poco entre sí.',
      seDesbloqueaCon: (stats) => stats.victorias >= 1,
      pista: 'Gana una vez a Typhon para desbloquear esto.',
    },
    ataque2: {
      titulo: 'Caos a la derecha / Caos a la izquierda',
      texto: 'Cada 45-60 segundos, Typhon gira el círculo entero de 1 a 4 veces hacia la derecha; cada 30-45 segundos, hacia la izquierda. Si coinciden, se turnan una rotación a la vez. Los números nunca quedan de lado, pero de dónde vino cada uno sí cambia.',
      seDesbloqueaCon: ganoEnMenosDe(1800),
      pista: 'Gana a Typhon en 30:00 o menos para desbloquear esto.',
    },
    secreto: {
      titulo: '¿Secreto?',
      texto: 'No hay ningún truco escondido contra Typhon: lo único que ayuda es acostumbrarte a que el tablero se mueva bajo tus pies.',
      seDesbloqueaCon: sinErrores,
      pista: 'Gana a Typhon sin cometer ni un error para desbloquear esto.',
    },
  },
  uriel_uber: {
    nombre: 'Uriel (Uber)',
    descripcion: 'La versión definitiva de Uriel: se desbloquea al investigarlo por completo.',
    emoji: '💠',
    normal: 'uriel',
    ataque1: {
      titulo: 'Ataque doblado',
      texto: 'Igual que el Uriel normal, pero cada búsqueda periódica (la fácil de cada 15 s o la de descarte de cada 30 s, desde la fase 2) apunta a 2 cajas de 3x3 al azar en vez de 1.',
    },
  },
  hecate_uber: {
    nombre: 'Hecate (Uber)',
    descripcion: 'La versión definitiva de Hecate: se desbloquea al investigarla por completo.',
    emoji: '✨',
    normal: 'hecate',
    ataque1: {
      titulo: 'Pasiva: Ilusiones perfectas',
      texto: 'Sus visiones ilusorias ya no parpadean: se ven idénticas a un número real, sin ninguna pista visual que las delate.',
    },
  },
  jormungandr_uber: {
    nombre: 'Jörmungandr (Uber)',
    descripcion: 'La versión definitiva de Jörmungandr: se desbloquea al investigarlo por completo.',
    emoji: '🌀',
    normal: 'jormungandr',
    ataque1: {
      titulo: 'Hambre voraz',
      texto: 'Come más de golpe: Hambre devora 2 números tuyos en vez de 1, y Glotonería (fase 2) devora 3.',
    },
  },
  babel_uber: {
    nombre: 'Babel (Uber)',
    descripcion: 'La versión definitiva de Babel: se desbloquea venciendo a Babel en difícil.',
    emoji: '⚡',
    normal: 'babel',
    ataque1: {
      titulo: 'Pasiva: Torre de Babel',
      texto: 'En vez de un solo juego de 9 símbolos hay 3 a la vez, y cada caja de 3x3 usa uno de los tres al azar. El teclado tiene 27 botones (3 filas de 9): la misma columna siempre es el mismo número en los 3 juegos, pero el orden de las columnas está mezclado.',
    },
  },
  typhon_uber: {
    nombre: 'Typhon (Uber)',
    descripcion: 'La versión definitiva de Typhon: se desbloquea al investigarlo por completo.',
    emoji: '👁️',
    normal: 'typhon',
    ataque1: {
      titulo: 'Pasiva: Forma perfecta',
      texto: 'Las 5 grillas (en forma de X) son extremo, y los giros bajan su espera a 20 segundos. Aparece "Padre de los monstruos": cada 2 minutos (1 en fase 2) una caja de una grilla exterior empieza a pulsar; tienes 10 segundos para completar un número ahí, o esa grilla entera se reemplaza por una nueva.',
    },
  },
};

// Jefes normales en el orden en que se desbloquean (Babel y Typhon a la par).
export const ORDEN_JEFES = ['uriel', 'hecate', 'jormungandr', 'babel', 'typhon'];

export const SECCIONES_INFORMACION = ['ataque1', 'ataque2', 'secreto'];

// Las imágenes de los jefes se preparan con scripts/preparar-imagen-jefe.ps1.
// Si un jefe no tiene alguna, las pantallas usan su emoji.

// Retrato redondo, la miniatura de la pelea (public/img/jefes/<id>.jpg).
export function imagenDeJefe(id) {
  return `./img/jefes/${id}.jpg`;
}

// Ilustración completa, 3:4: la carta del menú y la página de información
// (public/img/cartas/<id>.jpg).
export function imagenDeCarta(id) {
  return `./img/cartas/${id}.jpg`;
}
