import { IncidenteRepository } from '../../domain/repositories.js';
import { NotFoundError } from '../../domain/errors.js';
import { validarId } from './validaciones.js';

export class EliminarIncidente {
  constructor(private readonly incidenteRepository: IncidenteRepository) {}

  async execute(idParam: unknown): Promise<{ message: string }> {
    // 1. Valida ID
    const id = validarId(idParam);

    // 2. Busca el incidente (findById solo devuelve los registros con state='ACTIVE')
    const incidente = await this.incidenteRepository.findById(id);
    if (!incidente) {
      throw new NotFoundError(`Incidente con id ${id} no encontrado`);
    }

    // [PUNTO DE EXTENSIÓN - SESIÓN 2]: Regla de negocio 3 -> "Solo se eliminan incidentes ABIERTO (409)"
    // if (incidente.estado !== 'ABIERTO') {
    //   throw new ConflictError('Solo se pueden eliminar incidentes en estado ABIERTO');
    // }

    // 3. Borrado lógico (state = 'REMOVED')
    await this.incidenteRepository.softDelete(id);

    return { message: `Incidente con id ${id} eliminado exitosamente` };
  }
}
