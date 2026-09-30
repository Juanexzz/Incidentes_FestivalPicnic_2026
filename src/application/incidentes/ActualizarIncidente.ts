import { Incidente } from '../../domain/entities.js';
import { IncidenteRepository, ReferenciaRepository, ModificarIncidenteDTO } from '../../domain/repositories.js';
import { ValidationError, NotFoundError } from '../../domain/errors.js';
import {
  validarId,
  esEnteroPositivoJSON,
  validarSeveridad,
  validarDescripcion
} from './validaciones.js';

/**
 * Campos permitidos para modificación parcial según el contrato del Módulo 11:
 * - asistente_id: entero positivo o null
 * - zona_id: entero positivo
 * - severidad: LEVE | MODERADA | GRAVE
 * - descripcion: string (10 a 500 caracteres)
 */
const CAMPOS_EDITABLES = ['asistente_id', 'zona_id', 'severidad', 'descripcion'] as const;

/**
 * Caso de uso: ActualizarIncidente (PATCH /api/incidentes/:id)
 *
 * Flujo de validaciones y ejecución:
 * 1. Formato y tipo del ID en parámetros de ruta (entero positivo -> 400).
 * 2. Formato del cuerpo JSON:
 *    - Debe ser un objeto no nulo y no arreglo.
 *    - Lista blanca de campos editables: cualquier propiedad no editable o desconocida -> 400.
 *    - Validación de tipo y valor de cada campo enviado (zona_id > 0, descripcion 10-500, severidad válida).
 *    - Un body vacío `{}` es válido (no modifica campos).
 * 3. Existencia del registro activo:
 *    - Consulta el repositorio de incidentes por ID y state='ACTIVE'.
 *    - Si no existe o tiene state='REMOVED' -> 404.
 * 4. Punto de extensión para la sesión 2:
 *    - Regla de negocio 2: Si el estado actual es 'CERRADO', no se permite edición (409).
 * 5. Existencia de entidades foráneas:
 *    - Si viene zona_id, debe existir en la tabla zonas -> 404.
 *    - Si viene asistente_id (y no es null), debe existir en la tabla asistentes -> 404.
 * 6. Actualización en repositorio y retorno de entidad de dominio.
 */
export class ActualizarIncidente {
  constructor(
    private readonly incidenteRepository: IncidenteRepository,
    private readonly referenciaRepository: ReferenciaRepository
  ) {}

  async execute(idParam: unknown, body: any): Promise<Incidente> {
    // 1. Valida ID
    const id = validarId(idParam);

    // 2. Valida body
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('El cuerpo de la petición debe ser un objeto');
    }

    // Campos no editables o desconocidos -> 400
    const keys = Object.keys(body);
    for (const key of keys) {
      if (!CAMPOS_EDITABLES.includes(key as any)) {
        throw new ValidationError(`El campo "${key}" no es editable o no es reconocido`);
      }
    }

    const updateDTO: ModificarIncidenteDTO = {};

    // Validar tipos y formatos de cada campo editable si viene presente
    if (body.zona_id !== undefined) {
      if (body.zona_id === null || !esEnteroPositivoJSON(body.zona_id)) {
        throw new ValidationError('El campo "zona_id" debe ser un número entero positivo');
      }
      updateDTO.zona_id = body.zona_id;
    }

    if (body.asistente_id !== undefined) {
      if (body.asistente_id !== null && !esEnteroPositivoJSON(body.asistente_id)) {
        throw new ValidationError('El campo "asistente_id" debe ser un número entero positivo o null');
      }
      updateDTO.asistente_id = body.asistente_id;
    }

    if (body.severidad !== undefined) {
      if (body.severidad === null) {
        throw new ValidationError('El campo "severidad" no puede ser nulo');
      }
      updateDTO.severidad = validarSeveridad(body.severidad);
    }

    if (body.descripcion !== undefined) {
      if (body.descripcion === null) {
        throw new ValidationError('El campo "descripcion" no puede ser nulo');
      }
      updateDTO.descripcion = validarDescripcion(body.descripcion);
    }

    // 3. 404 del registro (debe existir y estar ACTIVE)
    const incidenteActual = await this.incidenteRepository.findById(id);
    if (!incidenteActual) {
      throw new NotFoundError(`Incidente con id ${id} no encontrado`);
    }

    // [PUNTO DE EXTENSIÓN - SESIÓN 2]: Regla de negocio 2 -> "Un incidente CERRADO no se edita (409)"
    // if (incidenteActual.estado === 'CERRADO') {
    //   throw new ConflictError('Un incidente CERRADO no se puede editar');
    // }

    // 4. 404 de referencias foráneas si vienen en la petición
    if (updateDTO.zona_id !== undefined) {
      const existeZona = await this.referenciaRepository.existeZona(updateDTO.zona_id);
      if (!existeZona) {
        throw new NotFoundError(`La zona con id ${updateDTO.zona_id} no existe`);
      }
    }

    if (updateDTO.asistente_id !== undefined && updateDTO.asistente_id !== null) {
      const existeAsistente = await this.referenciaRepository.existeAsistente(updateDTO.asistente_id);
      if (!existeAsistente) {
        throw new NotFoundError(`El asistente con id ${updateDTO.asistente_id} no existe`);
      }
    }

    // 5. Actualiza con el repositorio
    return await this.incidenteRepository.update(id, updateDTO);
  }
}
