import { ConflictError } from './errors.js';
import { Estado } from './constants.js';

const TRANSICIONES_VALIDAS: Record<Estado, Estado[]> = {
  ABIERTO: ['EN_ATENCION'],
  EN_ATENCION: ['CERRADO'],
  CERRADO: []
};

/**
 * Valida la transición entre estados de un incidente según la regla pura de dominio:
 * ABIERTO -> EN_ATENCION -> CERRADO.
 * Saltarse un paso, retroceder o repetir el mismo estado lanza un ConflictError (409).
 */
export function validarTransicionEstado(estadoActual: string, nuevoEstado: string): void {
  if (estadoActual === nuevoEstado) {
    throw new ConflictError(`No se puede repetir el mismo estado: ${nuevoEstado}`);
  }

  const transicionesPermitidas = TRANSICIONES_VALIDAS[estadoActual as Estado];

  if (!transicionesPermitidas || transicionesPermitidas.length === 0) {
    throw new ConflictError(`Un incidente en estado ${estadoActual} no permite más transiciones de estado`);
  }

  if (!transicionesPermitidas.includes(nuevoEstado as Estado)) {
    throw new ConflictError(
      `Transición no permitida: no se puede pasar de ${estadoActual} a ${nuevoEstado}`
    );
  }
}
