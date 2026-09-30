import { Incidente } from '../../domain/entities.js';
import { IncidenteRepository } from '../../domain/repositories.js';
import { ValidationError, NotFoundError } from '../../domain/errors.js';
import { ESTADOS, Estado } from '../../domain/constants.js';
import { validarTransicionEstado } from '../../domain/transiciones.js';
import { validarId } from './validaciones.js';

/**
 * Caso de uso: CambiarEstadoIncidente (PATCH /api/incidentes/:id/estado)
 *
 * Flujo de validaciones:
 * 1. ID inválido -> 400
 * 2. Body inválido (falta estado, no es string, minúsculas, inexistente) -> 400
 * 3. Incidente no existe o state='REMOVED' -> 404
 * 4. Violación de transiciones (saltarse paso, retroceder, repetir) -> 409
 * 5. Actualización y retorno de { data: Incidente }
 */
export class CambiarEstadoIncidente {
  constructor(private readonly incidenteRepository: IncidenteRepository) {}

  async execute(idParam: unknown, body: any): Promise<Incidente> {
    // 1. Valida ID de la ruta
    const id = validarId(idParam);

    // 2. Valida body
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('El cuerpo de la petición debe ser un objeto JSON');
    }

    if (!('estado' in body) || body.estado === undefined || body.estado === null) {
      throw new ValidationError('El campo "estado" es obligatorio');
    }

    if (typeof body.estado !== 'string') {
      throw new ValidationError('El campo "estado" debe ser un string');
    }

    if (!ESTADOS.includes(body.estado as Estado)) {
      throw new ValidationError(
        `El estado "${body.estado}" no es válido. Valores permitidos: ${ESTADOS.join(', ')}`
      );
    }

    const nuevoEstado = body.estado as Estado;

    // 3. Verifica existencia del incidente (activo)
    const incidente = await this.incidenteRepository.findById(id);
    if (!incidente) {
      throw new NotFoundError(`Incidente con id ${id} no encontrado`);
    }

    // 4. Regla pura de negocio: validar transición
    validarTransicionEstado(incidente.estado, nuevoEstado);

    // 5. Actualiza estado en base de datos
    return await this.incidenteRepository.updateEstado(id, nuevoEstado);
  }
}
