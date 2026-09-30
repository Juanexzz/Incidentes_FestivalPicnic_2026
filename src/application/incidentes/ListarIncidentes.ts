import { Incidente } from '../../domain/entities.js';
import { IncidenteRepository, ListadoPaginado } from '../../domain/repositories.js';
import { validarFiltrosListado, validarPaginacion } from './validaciones.js';

export class ListarIncidentes {
  constructor(private readonly incidenteRepository: IncidenteRepository) {}

  async execute(query: any): Promise<ListadoPaginado<Incidente>> {
    const paginacion = validarPaginacion(query);
    const filtros = validarFiltrosListado(query);
    return await this.incidenteRepository.findAll(filtros, paginacion);
  }
}
