import { ValidationError } from '../../domain/errors.js';
import { ESTADOS, Estado, SEVERIDADES, Severidad } from '../../domain/constants.js';
import { FiltrosIncidente, PaginacionParams } from '../../domain/repositories.js';

export function esEnteroPositivo(val: unknown): boolean {
  if (typeof val === 'number') {
    return Number.isInteger(val) && val > 0;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!/^\d+$/.test(trimmed)) return false;
    const num = Number(trimmed);
    return num > 0 && num <= Number.MAX_SAFE_INTEGER;
  }
  return false;
}

export function validarId(id: unknown, campo = 'id'): number {
  if (!esEnteroPositivo(id)) {
    throw new ValidationError(`El campo "${campo}" debe ser un entero positivo`);
  }
  return Number(id);
}

export function validarPaginacion(query: any): PaginacionParams {
  let page = 1;
  let limit = 10;

  if (query.page !== undefined) {
    if (!esEnteroPositivo(query.page)) {
      throw new ValidationError('El parámetro "page" debe ser un entero positivo');
    }
    page = Number(query.page);
  }

  if (query.limit !== undefined) {
    if (!esEnteroPositivo(query.limit)) {
      throw new ValidationError('El parámetro "limit" debe ser un entero positivo menor o igual a 50');
    }
    limit = Number(query.limit);
    if (limit > 50) {
      throw new ValidationError('El parámetro "limit" no puede ser mayor a 50');
    }
  }

  return { page, limit };
}

export function validarFiltrosListado(query: any): FiltrosIncidente {
  const filtros: FiltrosIncidente = {};

  if (query.estado !== undefined) {
    if (typeof query.estado !== 'string' || !ESTADOS.includes(query.estado as Estado)) {
      throw new ValidationError(`El parámetro "estado" debe ser uno de: ${ESTADOS.join(', ')}`);
    }
    filtros.estado = query.estado;
  }

  if (query.severidad !== undefined) {
    if (typeof query.severidad !== 'string' || !SEVERIDADES.includes(query.severidad as Severidad)) {
      throw new ValidationError(`El parámetro "severidad" debe ser uno de: ${SEVERIDADES.join(', ')}`);
    }
    filtros.severidad = query.severidad;
  }

  if (query.dia_id !== undefined) {
    if (!esEnteroPositivo(query.dia_id)) {
      throw new ValidationError('El parámetro "dia_id" debe ser un entero positivo');
    }
    filtros.dia_id = Number(query.dia_id);
  }

  return filtros;
}

export function validarSeveridad(severidad: unknown): Severidad {
  if (typeof severidad !== 'string' || !SEVERIDADES.includes(severidad as Severidad)) {
    throw new ValidationError(`La severidad debe ser una de: ${SEVERIDADES.join(', ')}`);
  }
  return severidad as Severidad;
}

export function validarEstado(estado: unknown): Estado {
  if (typeof estado !== 'string' || !ESTADOS.includes(estado as Estado)) {
    throw new ValidationError(`El estado debe ser uno de: ${ESTADOS.join(', ')}`);
  }
  return estado as Estado;
}

export function validarDescripcion(descripcion: unknown): string {
  if (typeof descripcion !== 'string') {
    throw new ValidationError('La descripción debe ser un texto');
  }
  const len = descripcion.length;
  if (len < 10 || len > 500) {
    throw new ValidationError('La descripción debe tener entre 10 y 500 caracteres');
  }
  return descripcion;
}
