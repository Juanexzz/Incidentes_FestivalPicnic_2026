import { IncidenteRepository, ConteoPorEstado } from '../../domain/repositories.js';
import { ValidationError } from '../../domain/errors.js';
import { esEnteroPositivo } from './validaciones.js';

/**
 * Caso de uso: ResumenIncidentes (GET /api/incidentes/resumen?dia_id=)
 *
 * Flujo:
 * 1. Valida el parámetro de consulta `dia_id` (opcional).
 *    - Si viene y no es entero positivo -> 400.
 * 2. Si no viene, cuenta incidentes activos de todos los días (dia_id queda null en la respuesta).
 * 3. Si viene, cuenta incidentes activos del día específico.
 * 4. Devuelve conteo con las 3 claves siempre presentes (ABIERTO, EN_ATENCION, CERRADO) en formato numérico.
 */
export class ResumenIncidentes {
  constructor(private readonly incidenteRepository: IncidenteRepository) {}

  async execute(query: any): Promise<ConteoPorEstado> {
    let diaId: number | undefined;

    if (query && query.dia_id !== undefined) {
      if (!esEnteroPositivo(query.dia_id)) {
        throw new ValidationError('El parámetro "dia_id" debe ser un entero positivo');
      }
      diaId = Number(query.dia_id);
    }

    return await this.incidenteRepository.contarPorEstado(diaId);
  }
}
