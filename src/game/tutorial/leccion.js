// El tutorial: un sudoku muy fácil, siempre el mismo, y los pasos que
// enseñan a resolverlo. Que el tablero sea fijo permite que cada paso
// señale celdas concretas; tests/tutorial.test.js comprueba que cada
// ejemplo de verdad se resuelve con la técnica que explica.
//
// Cada paso:
//   titulo, texto           lo que dice el globo
//   zona                    celdas que se resaltan (la fila, caja... de la que se habla)
//   lineas                  filas/columnas que "barren" la zona (paso del barrido)
//   pistas                  números ya puestos en los que hay que fijarse
//   objetivo                { celda, digito } que el jugador tiene que escribir; sin
//                           objetivo, el paso solo se lee y se pasa con "Siguiente"
//   ayuda                   qué decir si escribe un número equivocado
//   alAcertar               lo que dice el globo después de acertar

import { CAJAS, indicesDeColumna, indicesDeFila } from '../sudoku/geometria-9x9.js';
import { textoATablero } from '../sudoku/tablero.js';

export const PUZZLE_TUTORIAL = textoATablero(
  '000000900670190348008042507050761420020853000003920056900030280287019635300206170',
);

export const SOLUCION_TUTORIAL = textoATablero(
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
);

export const PASOS_TUTORIAL = [
  {
    titulo: 'Bienvenido al sudoku',
    texto: 'El objetivo es llenar todo el tablero con números del 1 al 9. '
      + 'Hay una sola regla, y se aplica a tres cosas: filas, columnas y cajas.',
  },
  {
    titulo: 'Las filas',
    texto: 'Una fila son 9 celdas de izquierda a derecha. En cada fila van los números '
      + 'del 1 al 9, una vez cada uno: ninguno se repite.',
    zona: indicesDeFila(7),
  },
  {
    titulo: 'Las columnas',
    texto: 'Una columna son 9 celdas de arriba abajo. Igual que en las filas, '
      + 'cada número va una sola vez.',
    zona: indicesDeColumna(3),
  },
  {
    titulo: 'Las cajas',
    texto: 'El tablero está dividido en 9 cajas de 3x3, separadas por las líneas gruesas. '
      + 'Cada caja también lleva del 1 al 9 sin repetir.',
    zona: CAJAS[4],
  },
  {
    titulo: 'Ejemplo 1: el que falta',
    texto: 'A esta fila le falta un solo número. ¿Cuál del 1 al 9 no está? '
      + 'Toca la celda que brilla y escríbelo con el teclado.',
    zona: indicesDeFila(7),
    objetivo: { celda: 66, digito: 4 },
    ayuda: 'Ese ya está en la fila. Revisa del 1 al 9 cuál no aparece.',
    alAcertar: 'Cuando a una fila, columna o caja le falta un solo número, '
      + 'basta con ver cuál no está. Busca siempre estos casos primero.',
  },
  {
    titulo: 'Ejemplo 2: lo mismo en una caja',
    texto: 'A esta caja también le falta un solo número. ¿Cuál es?',
    zona: CAJAS[4],
    objetivo: { celda: 50, digito: 4 },
    ayuda: 'Ese ya está en la caja. Busca el número que no aparece.',
    alAcertar: 'Exacto. Filas, columnas y cajas funcionan igual: si solo falta uno, '
      + 'es el que no está.',
  },
  {
    titulo: 'Ejemplo 3: el barrido',
    texto: '¿Dónde va el 9 en la caja de arriba a la izquierda? Mira los 9 marcados: '
      + 'cada uno ocupa su fila o su columna entera, así que ahí no puede ir otro 9. '
      + 'Descarta esas celdas: solo queda una libre.',
    zona: CAJAS[0],
    lineas: [...indicesDeFila(0), ...indicesDeFila(1), ...indicesDeColumna(0)],
    pistas: [6, 13, 54],
    objetivo: { celda: 19, digito: 9 },
    ayuda: 'En esta celda tiene que ir un 9: es el único lugar libre para el 9 en la caja.',
    alAcertar: 'Esto se llama barrido: eliges un número y una caja, y descartas celdas '
      + 'con los números iguales de alrededor. Es la técnica más usada.',
  },
  {
    titulo: 'Ejemplo 4: un solo candidato',
    texto: 'Ahora al revés: mira una celda y pregúntate qué números pueden ir. La celda que '
      + 'brilla comparte fila, columna y caja con las marcadas. Entre todas ya tienen 8 '
      + 'números distintos: ¿cuál queda?',
    zona: [...indicesDeFila(2), ...indicesDeColumna(0), ...CAJAS[0]],
    objetivo: { celda: 18, digito: 1 },
    ayuda: 'Ese número ya está en su fila, su columna o su caja. Busca el que no aparece en ninguna.',
    alAcertar: 'Cuando una celda solo admite un número, ese es el que va. '
      + 'Se llama candidato único.',
  },
  {
    titulo: 'Las notas',
    texto: 'Muchas celdas admiten varios números al principio. Con ✏️ Notas (o la tecla N) '
      + 'puedes anotarlos en pequeño: no cuentan como jugada y te ahorran recordarlo todo. '
      + 'A medida que el tablero se llena, vas tachando hasta que queda uno.',
  },
  {
    titulo: 'Tu turno',
    texto: 'Ya sabes lo necesario: el resto del tablero se resuelve con lo que acabas de ver. '
      + 'Termínalo por tu cuenta. Mientras juegas tendrás a mano unos consejos para mejorar.',
  },
];
