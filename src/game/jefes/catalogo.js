// Catálogo de jefes: nombre, descripción y lo que muestra su página de
// información (Información del jefe).
//
// Cada sección de la página (ataque1, ataque2, pasiva, secreto; no todos
// los jefes las tienen todas) se desbloquea según las estadísticas del
// jugador contra ese jefe (ver registro.js):
//   { victorias, mejorTiempo, victoriasRapidas, mejorMarca }
// Un jefe está "completamente investigado" cuando todas sus secciones están
// desbloqueadas; eso habilita su versión uber.
//
// Las secciones que son habilidades de la pelea pueden traer `emoji` e
// `imagen` (ver imagenDeHabilidad): la pelea usa el mismo nombre e icono
// para su icono de habilidad.

// Ganar por debajo de esto cuenta como "victoria rápida" (3:33).
export const SEGUNDOS_VICTORIA_RAPIDA = 213;

const sinErrores = (stats) => stats.mejorMarca !== null && stats.mejorMarca.errores === 0;
const ganoEnMenosDe = (segundos) => (stats) => stats.mejorTiempo !== null && stats.mejorTiempo < segundos;

export const JEFES = {
  uriel: {
    nombre: 'Uriel',
    descripcion: 'Dicen que Uriel nació en el primer tablero que alguien dejó a medio resolver: una máquina hecha de filas, columnas y cajas que se quedó contando cuando el jugador se fue. Desde entonces recorre cada sudoku buscando el patrón que los resuelve todos. Todavía no lo encuentra... pero cada partida lo acerca un poco más.',
    emoji: '👹',
    // Los textos son de ambientación: insinúan cómo funciona cada habilidad
    // sin explicarla. Las reglas exactas están en game/jefes/uriel.js.
    ataque1: {
      titulo: '123...',
      emoji: '🔍',
      imagen: 'uriel_facil',
      texto: 'Uno, dos, tres... Uriel nunca pierde la cuenta. De vez en cuando se detiene en una caja cualquiera, y donde a ti te falta poco, a él le falta menos.',
      seDesbloqueaCon: (stats) => stats.victorias >= 1,
      pista: 'Gana una vez a Uriel para desbloquear esto.',
    },
    ataque2: {
      titulo: '3x3x3',
      emoji: '🧮',
      imagen: 'uriel_descarte',
      texto: 'A mitad de camino, Uriel empieza a ver de a tres. Lo que ya apareció dos veces le dice dónde va a caer la tercera.',
      seDesbloqueaCon: ganoEnMenosDe(300),
      pista: 'Gana a Uriel en menos de 5:00 para desbloquear esto.',
    },
    pasiva: {
      titulo: 'Predecible...',
      emoji: '⚖️',
      imagen: 'uriel_pasiva',
      texto: 'Un error es una huella, y Uriel sabe leer huellas. Donde tropiezas, él ya está mirando.',
      seDesbloqueaCon: (stats) => stats.victorias >= 1,
      pista: 'Gana una vez a Uriel para desbloquear esto.',
    },
    secreto: {
      titulo: '¿Secreto?',
      texto: 'Uriel no soporta que lo afanen. Si le insistes en la cara unas cuantas veces durante la pelea, quizá pierda la paciencia antes de tiempo.',
      seDesbloqueaCon: (stats) => stats.victorias >= 5 && stats.victoriasRapidas >= 1,
      pista: 'Gana a Uriel 5 veces, con al menos una en menos de 3:33, para desbloquear esto.',
    },
  },
  hecate: {
    nombre: 'Hecate',
    descripcion: 'Hecate cuida los cruces del tablero, donde una fila, una columna y una caja se encuentran. Tiene tres caras y ninguna dice la verdad: dicen que fue la primera en notar que un número mal puesto se ve igual que uno bueno, y desde entonces juega con eso. Su reloj de arena nunca se detiene, y cada tropiezo tuyo lo hace correr más rápido.',
    // Los textos de las habilidades son de ambientación: insinúan cómo
    // funciona cada una sin explicarla. Las reglas exactas están en
    // game/jefes/hecate.js y en docs/fichas-tecnicas-jefes.txt.
    emoji: '🔮',
    ataque1: {
      titulo: 'Visiones ilusorias',
      emoji: '👁️',
      imagen: 'hecate_vision',
      texto: 'No todo lo que ves en el tablero está ahí. De vez en cuando un número aparece donde no debería y se va tan callado como llegó... aunque, si lo miras bien, tiembla un poco.',
      seDesbloqueaCon: (stats) => stats.victorias >= 1,
      pista: 'Gana una vez a Hecate para desbloquear esto.',
    },
    // La maldición y el aullido se desbloquean con lo mismo (antes eran una
    // sola sección), así que investigar a Hecate pide lo mismo que siempre.
    ataque2: {
      titulo: 'Maldición de pesadilla',
      emoji: '🌑',
      imagen: 'hecate_maldicion',
      texto: 'Cuando el final se acerca, Hecate deja de inventar y empieza a torcer lo que ya es tuyo. Por un rato, lo que escribiste puede no ser lo que ves.',
      seDesbloqueaCon: ganoEnMenosDe(600),
      pista: 'Gana a Hecate en 10:00 o menos para desbloquear esto.',
    },
    pasiva: {
      titulo: 'Aullido paralizante',
      emoji: '🗿',
      imagen: 'hecate_aullido',
      texto: 'Sus lobos le aúllan a un número que todavía te falta. Cuando el aullido termina, ese número se vuelve piedra y no hay mano que lo mueva... hasta que el eco se apaga.',
      seDesbloqueaCon: ganoEnMenosDe(600),
      pista: 'Gana a Hecate en 10:00 o menos para desbloquear esto.',
    },
    secreto: {
      titulo: 'Pesar Castigador',
      emoji: '⏳',
      imagen: 'hecate_pesar',
      texto: 'El reloj de Hecate se alimenta de tus tropiezos. Cada error le regala un pedazo de tu tiempo, y cuando ya no te queda nada, ella no perdona.',
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
      texto: 'Dos miradas, una sola cuenta. Lo que antes revisaba de a una caja, ahora lo revisa de a dos.',
    },
  },
  hecate_uber: {
    nombre: 'Hecate (Uber)',
    descripcion: 'La versión definitiva de Hecate: se desbloquea al investigarla por completo.',
    emoji: '✨',
    normal: 'hecate',
    ataque1: {
      titulo: 'Pasiva: Ilusiones perfectas',
      texto: 'Sus mentiras ya no tiemblan. Lo falso y lo verdadero se ven exactamente igual.',
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

export const SECCIONES_INFORMACION = ['ataque1', 'ataque2', 'pasiva', 'secreto'];

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

// Icono de una habilidad (public/img/habilidades/<id>.jpg); el id es el
// `imagen` de su sección, p. ej. 'uriel_facil'.
export function imagenDeHabilidad(id) {
  return `./img/habilidades/${id}.jpg`;
}
