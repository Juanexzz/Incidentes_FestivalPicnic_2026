import { prisma } from '../database.js';
import { Incidente } from '../../domain/entities.js';
import {
  IncidenteRepository,
  FiltrosIncidente,
  PaginacionParams,
  ListadoPaginado,
  ConteoPorEstado,
  CrearIncidenteDTO,
  ModificarIncidenteDTO
} from '../../domain/repositories.js';

function mapToEntity(row: {
  id: number;
  asistente_id: number | null;
  zona_id: number;
  dia_id: number;
  severidad: string;
  descripcion: string;
  estado: string;
  state: string;
}): Incidente {
  return {
    id: row.id,
    asistente_id: row.asistente_id,
    zona_id: row.zona_id,
    dia_id: row.dia_id,
    severidad: row.severidad,
    descripcion: row.descripcion,
    estado: row.estado,
    state: row.state
  };
}

export class PrismaIncidenteRepository implements IncidenteRepository {
  async findAll(filtros: FiltrosIncidente, paginacion: PaginacionParams): Promise<ListadoPaginado<Incidente>> {
    const where: {
      state: string;
      estado?: string;
      severidad?: string;
      dia_id?: number;
    } = {
      state: 'ACTIVE'
    };

    if (filtros.estado !== undefined) {
      where.estado = filtros.estado;
    }
    if (filtros.severidad !== undefined) {
      where.severidad = filtros.severidad;
    }
    if (filtros.dia_id !== undefined) {
      where.dia_id = filtros.dia_id;
    }

    const total = await prisma.incidentes.count({ where });
    const totalPages = Math.ceil(total / paginacion.limit);
    const skip = (paginacion.page - 1) * paginacion.limit;
    const take = paginacion.limit;

    const rows = await prisma.incidentes.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'asc' }
    });

    return {
      pagination: {
        total,
        currentPage: paginacion.page,
        limit: paginacion.limit,
        totalPages
      },
      data: rows.map(mapToEntity)
    };
  }

  async findById(id: number): Promise<Incidente | null> {
    const row = await prisma.incidentes.findFirst({
      where: {
        id,
        state: 'ACTIVE'
      }
    });

    if (!row) {
      return null;
    }

    return mapToEntity(row);
  }

  async create(data: CrearIncidenteDTO): Promise<Incidente> {
    const row = await prisma.incidentes.create({
      data: {
        asistente_id: data.asistente_id ?? null,
        zona_id: data.zona_id,
        dia_id: data.dia_id,
        severidad: data.severidad,
        descripcion: data.descripcion,
        estado: 'ABIERTO',
        state: 'ACTIVE'
      }
    });

    return mapToEntity(row);
  }

  async update(id: number, data: ModificarIncidenteDTO): Promise<Incidente> {
    const updateData: {
      asistente_id?: number | null;
      zona_id?: number;
      severidad?: string;
      descripcion?: string;
    } = {};

    if (data.asistente_id !== undefined) {
      updateData.asistente_id = data.asistente_id;
    }
    if (data.zona_id !== undefined) {
      updateData.zona_id = data.zona_id;
    }
    if (data.severidad !== undefined) {
      updateData.severidad = data.severidad;
    }
    if (data.descripcion !== undefined) {
      updateData.descripcion = data.descripcion;
    }

    const row = await prisma.incidentes.update({
      where: { id },
      data: updateData
    });

    return mapToEntity(row);
  }

  async softDelete(id: number): Promise<void> {
    await prisma.incidentes.update({
      where: { id },
      data: { state: 'REMOVED' }
    });
  }

  async updateEstado(id: number, nuevoEstado: string): Promise<Incidente> {
    const row = await prisma.incidentes.update({
      where: { id },
      data: { estado: nuevoEstado }
    });

    return mapToEntity(row);
  }

  async contarPorEstado(diaId?: number): Promise<ConteoPorEstado> {
    const where: { state: string; dia_id?: number } = {
      state: 'ACTIVE'
    };

    if (diaId !== undefined) {
      where.dia_id = diaId;
    }

    const agrupados = await prisma.incidentes.groupBy({
      by: ['estado'],
      where,
      _count: { _all: true }
    });

    const resultado: ConteoPorEstado = {
      dia_id: diaId ?? null,
      ABIERTO: 0,
      EN_ATENCION: 0,
      CERRADO: 0
    };

    for (const item of agrupados) {
      if (item.estado === 'ABIERTO') resultado.ABIERTO = item._count._all;
      if (item.estado === 'EN_ATENCION') resultado.EN_ATENCION = item._count._all;
      if (item.estado === 'CERRADO') resultado.CERRADO = item._count._all;
    }

    return resultado;
  }
}
