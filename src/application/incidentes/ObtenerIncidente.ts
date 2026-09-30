import { Incidente } from '../../domain/entities.js';
import { IncidenteRepository } from '../../domain/repositories.js';
import { NotFoundError } from '../../domain/errors.js';
import { validarId } from './validaciones.js';

export class ObtenerIncidente {
  constructor(private readonly incidenteRepository: IncidenteRepository) {}

  async execute(idParam: unknown): Promise<Incidente> {
    const id = validarId(idParam);
    const incidente = await this.incidenteRepository.findById(id);

    if (!incidente) {
      throw new NotFoundError(`Incidente con id ${id} no encontrado`);
    }

    return incidente;
  }
}
