// Conexión de mentira entre dos puntas dentro del mismo programa, para
// las pruebas (tests/duelo.test.js). Los mensajes llegan un instante
// después de enviarse, como en una conexión de verdad, nunca en el mismo
// paso.
//
// Una conexión (la de este archivo, la de pestanas.js o la futura de
// Nearby) es un objeto con:
//   enviar(mensaje)        un objeto que se pueda pasar a JSON
//   alRecibir(fn)          fn(mensaje) por cada mensaje de la otra punta
//   alCerrarse(fn)         fn() si la otra punta se fue o se cortó
//   cerrar()               cortar desde este lado

const enUnInstante = (fn) => setTimeout(fn, 0);

function crearPunta() {
  const punta = {
    otra: null,
    abierta: true,
    oyentes: [],
    alCerrar: [],
  };

  punta.conexion = {
    enviar(mensaje) {
      if (!punta.abierta) return;
      // Como por la red: se manda una copia, no el mismo objeto.
      const copia = JSON.parse(JSON.stringify(mensaje));
      enUnInstante(() => {
        if (punta.otra.abierta) punta.otra.oyentes.forEach((fn) => fn(copia));
      });
    },
    alRecibir(fn) {
      punta.oyentes.push(fn);
    },
    alCerrarse(fn) {
      punta.alCerrar.push(fn);
    },
    cerrar() {
      if (!punta.abierta) return;
      punta.abierta = false;
      enUnInstante(() => {
        if (!punta.otra.abierta) return;
        punta.otra.abierta = false;
        punta.otra.alCerrar.forEach((fn) => fn());
      });
    },
  };
  return punta;
}

// Dos conexiones unidas: lo que envía una lo recibe la otra.
export function crearParDeConexiones() {
  const a = crearPunta();
  const b = crearPunta();
  a.otra = b;
  b.otra = a;
  return [a.conexion, b.conexion];
}
