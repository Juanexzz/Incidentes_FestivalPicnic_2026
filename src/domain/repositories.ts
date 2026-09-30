import { Incidente } from './entities.js';

export interface FiltrosIncidente {
  estado?: string;
  severidad?: string;
  dia_id?: number;
}

export interface PaginacionParams {
  page: number;
  limit: number;
}

export interface PaginacionMetadata {
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
}

export interface ListadoPaginado<T> {
  pagination: PaginacionMetadata;
  data: T[];
}

export interface ConteoPorEstado {
  dia_id: number | null;
  ABIERTO: number;
  EN_ATENCION: number;
  CERRADO: number;
}

export interface CrearIncidenteDTO {
  asistente_id?: number | null;
  zona_id: number;
  dia_id: number;
  severidad: string;
  descripcion: string;
}

export interface ModificarIncidenteDTO {
  asistente_id?: number | null;
  zona_id?: number;
  severidad?: string;
  descripcion?: string;
}

export interface IncidenteRepository {
  findAll(filtros: FiltrosIncidente, paginacion: PaginacionParams): Promise<ListadoPaginado<Incidente>>;
  findById(id: number): Promise<Incidente | null>;
  create(data: CrearIncidenteDTO): Promise<Incidente>;
  update(id: number, data: ModificarIncidenteDTO): Promise<Incidente>;
  softDelete(id: number): Promise<void>;
  updateEstado(id: number, nuevoEstado: string): Promise<Incidente>;
  contarPorEstado(diaId?: number): Promise<ConteoPorEstado>;
}

export interface ReferenciaRepository {
  existeAsistente(id: number): Promise<boolean>;
  existeZona(id: number): Promise<boolean>;
  existeDia(id: number): Promise<boolean>;
}
