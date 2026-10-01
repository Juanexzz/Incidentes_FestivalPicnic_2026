import { IncidenteRepository } from '../../domain/repositories.js';
import { NotFoundError, ConflictError } from '../../domain/errors.js';
import { validarId } from './validaciones.js';

/**
 * Caso de uso: EliminarIncidente (DELETE /api/incidentes/:id)
 *
 * Flujo de validaciones y ejecución:
 * 1. Formato y tipo del ID en parámetros de ruta (entero positivo -> 400).
 * 2. Existencia del registro activo:
 *    - Consulta el repositorio de incidentes por ID y state='ACTIVE'.
 *    - Si el registro no existe o ya fue eliminado (state='REMOVED') -> 404.
 *    - Garantiza que intentos repetidos de borrado sobre el mismo ID respondan 404.
 * 3. Regla de negocio 3:
 *    - Solo se eliminan incidentes en estado 'ABIERTO' (409 si está EN_ATENCION o CERRADO).
 * 4. Borrado lógico:
 *    - Modifica la columna state a 'REMOVED' mediante el repositorio sin eliminar la fila de la base de datos.
 * 5. Retorna objeto de confirmación con mensaje descriptivo (código HTTP 200).
 */
export class EliminarIncidente {
  constructor(private readonly incidenteRepository: IncidenteRepository) {}

  async execute(idParam: unknown): Promise<{ message: string }> {
    // 1. Valida ID (400 si no es entero positivo)
    const id = validarId(idParam);

    // 2. Busca el incidente (findById solo devuelve los registros con state='ACTIVE')
    const incidente = await this.incidenteRepository.findById(id);
    if (!incidente) {
      throw new NotFoundError(`Incidente con id ${id} no encontrado`);
    }

    // 3. Regla de negocio 3: Solo se eliminan incidentes ABIERTO (409)
    if (incidente.estado !== 'ABIERTO') {
      throw new ConflictError(
        `Solo se pueden eliminar incidentes en estado ABIERTO (estado actual: ${incidente.estado})`
      );
    }

    // 4. Borrado lógico (state = 'REMOVED')
    await this.incidenteRepository.softDelete(id);

    return { message: `Incidente con id ${id} eliminado exitosamente` };
  }
}
