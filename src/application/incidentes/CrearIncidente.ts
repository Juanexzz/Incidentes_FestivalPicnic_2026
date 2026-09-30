import { Incidente } from '../../domain/entities.js';
import { IncidenteRepository, ReferenciaRepository } from '../../domain/repositories.js';
import { ValidationError, NotFoundError } from '../../domain/errors.js';
import { esEnteroPositivoJSON, validarSeveridad, validarDescripcion } from './validaciones.js';

export class CrearIncidente {
  constructor(
    private readonly incidenteRepository: IncidenteRepository,
    private readonly referenciaRepository: ReferenciaRepository
  ) {}

  async execute(body: any): Promise<Incidente> {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('El cuerpo de la petición debe ser un objeto');
    }

    // 1. Validaciones 400 (formato, tipos, campos obligatorios, valores no permitidos)
    if (body.zona_id === undefined || body.zona_id === null) {
      throw new ValidationError('El campo "zona_id" es obligatorio');
    }
    if (!esEnteroPositivoJSON(body.zona_id)) {
      throw new ValidationError('El campo "zona_id" debe ser un número entero positivo');
    }

    if (body.dia_id === undefined || body.dia_id === null) {
      throw new ValidationError('El campo "dia_id" es obligatorio');
    }
    if (!esEnteroPositivoJSON(body.dia_id)) {
      throw new ValidationError('El campo "dia_id" debe ser un número entero positivo');
    }

    let asistente_id: number | null = null;
    if (body.asistente_id !== undefined && body.asistente_id !== null) {
      if (!esEnteroPositivoJSON(body.asistente_id)) {
        throw new ValidationError('El campo "asistente_id" debe ser un número entero positivo');
      }
      asistente_id = body.asistente_id;
    }

    if (body.severidad === undefined || body.severidad === null) {
      throw new ValidationError('El campo "severidad" es obligatorio');
    }
    const severidad = validarSeveridad(body.severidad);

    if (body.descripcion === undefined || body.descripcion === null) {
      throw new ValidationError('El campo "descripcion" es obligatorio');
    }
    const descripcion = validarDescripcion(body.descripcion);

    // 2. Validaciones 404 (existencia de referencias foráneas)
    const existeZona = await this.referenciaRepository.existeZona(body.zona_id);
    if (!existeZona) {
      throw new NotFoundError(`La zona con id ${body.zona_id} no existe`);
    }

    const existeDia = await this.referenciaRepository.existeDia(body.dia_id);
    if (!existeDia) {
      throw new NotFoundError(`El día con id ${body.dia_id} no existe`);
    }

    if (asistente_id !== null) {
      const existeAsistente = await this.referenciaRepository.existeAsistente(asistente_id);
      if (!existeAsistente) {
        throw new NotFoundError(`El asistente con id ${asistente_id} no existe`);
      }
    }

    // 3. Crear registro en BD (nace ABIERTO y ACTIVE; si enviaron id, estado o state se ignoran)
    return await this.incidenteRepository.create({
      asistente_id,
      zona_id: body.zona_id,
      dia_id: body.dia_id,
      severidad,
      descripcion
    });
  }
}
