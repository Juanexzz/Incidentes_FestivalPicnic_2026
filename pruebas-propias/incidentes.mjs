import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { espera, pruebasListado } from '../Kit/Pruebas/lib.mjs';

const R = '/api/incidentes';
const estado = (api, id, e) => api.patch(`${R}/${id}/estado`, { estado: e });

const pruebas = [
  ...pruebasListado(R, { publicas: false }),

  // --- IDs inválidos (/abc) en GET, PATCH, DELETE ---
  {
    nombre: 'GET /api/incidentes/abc responde 400 (id inválido)',
    prueba: async ({ api }) => espera.error(await api.get(`${R}/abc`), 400)
  },
  {
    nombre: 'PATCH /api/incidentes/abc responde 400 (id inválido)',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/abc`, {}), 400)
  },
  {
    nombre: 'DELETE /api/incidentes/abc responde 400 (id inválido)',
    prueba: async ({ api }) => espera.error(await api.del(`${R}/abc`), 400)
  },

  // --- IDs numéricos no positivos (/0, /-1, /1.5) ---
  {
    nombre: 'GET /api/incidentes/0 responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}/0`), 400)
  },
  {
    nombre: 'PATCH /api/incidentes/0 responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/0`, {}), 400)
  },
  {
    nombre: 'DELETE /api/incidentes/0 responde 400',
    prueba: async ({ api }) => espera.error(await api.del(`${R}/0`), 400)
  },
  {
    nombre: 'GET /api/incidentes/-1 responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}/-1`), 400)
  },
  {
    nombre: 'PATCH /api/incidentes/-1 responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/-1`, {}), 400)
  },
  {
    nombre: 'DELETE /api/incidentes/-1 responde 400',
    prueba: async ({ api }) => espera.error(await api.del(`${R}/-1`), 400)
  },
  {
    nombre: 'GET /api/incidentes/1.5 responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}/1.5`), 400)
  },
  {
    nombre: 'PATCH /api/incidentes/1.5 responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1.5`, {}), 400)
  },
  {
    nombre: 'DELETE /api/incidentes/1.5 responde 400',
    prueba: async ({ api }) => espera.error(await api.del(`${R}/1.5`), 400)
  },

  // --- Paginación complementaria ---
  {
    nombre: 'Paginación: limit=50 responde 200 y respeta el límite',
    prueba: async ({ api }) => {
      const b = espera.lista(await api.get(`${R}?limit=50`), 50);
      espera.igual(b.pagination.limit, 50, 'pagination.limit');
      espera.igual(b.pagination.totalPages, Math.ceil(b.pagination.total / 50), 'pagination.totalPages = ceil(total/limit)');
    }
  },
  {
    nombre: 'Paginación: totalPages es siempre ceil(total/limit)',
    prueba: async ({ api }) => {
      const b = espera.lista(await api.get(`${R}?page=1&limit=2`), 2);
      espera.igual(b.pagination.totalPages, Math.ceil(b.pagination.total / 2), 'totalPages');
    }
  },

  // --- Filtros en listado ---
  {
    nombre: 'GET ?dia_id=abc responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?dia_id=abc`), 400)
  },
  {
    nombre: 'GET ?dia_id=-1 responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?dia_id=-1`), 400)
  },
  {
    nombre: 'GET ?dia_id=0 responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?dia_id=0`), 400)
  },
  {
    nombre: 'GET ?estado=XYZ responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?estado=XYZ`), 400)
  },
  {
    nombre: 'GET ?estado=abierto (minúsculas) responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?estado=abierto`), 400)
  },
  {
    nombre: 'GET ?severidad=XYZ responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?severidad=XYZ`), 400)
  },
  {
    nombre: 'GET ?severidad=leve (minúsculas) responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?severidad=leve`), 400)
  },
  {
    nombre: 'Filtro ?severidad=GRAVE solo trae incidentes con severidad GRAVE',
    prueba: async ({ api }) => {
      const b = espera.lista(await api.get(`${R}?severidad=GRAVE&limit=50`));
      espera.cierto(b.data.every((x) => x.severidad === 'GRAVE'), 'Todos deben tener severidad GRAVE');
    }
  },
  {
    nombre: 'Filtros combinables: ?estado=ABIERTO&dia_id=1 filtra por ambas condiciones',
    prueba: async ({ api }) => {
      const b = espera.lista(await api.get(`${R}?estado=ABIERTO&dia_id=1&limit=50`));
      espera.cierto(b.data.every((x) => x.estado === 'ABIERTO' && x.dia_id === 1), 'Filtro combinado AND');
    }
  },
  {
    nombre: 'Filtro ?estado=ABIERTO&limit=50 devuelve >= 1 resultado',
    prueba: async ({ api }) => {
      const b = espera.lista(await api.get(`${R}?estado=ABIERTO&limit=50`));
      espera.cierto(b.data.length >= 1, 'Debe haber al menos 1 incidente abierto');
    }
  },

  // --- POST: Validaciones 400 y orden de validación ---
  {
    nombre: 'POST sin zona_id responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { dia_id: 3, severidad: 'LEVE', descripcion: 'Descripción válida de prueba' }), 400)
  },
  {
    nombre: 'POST con zona_id como texto "7" responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: "7", dia_id: 3, severidad: 'LEVE', descripcion: 'Descripción válida de prueba' }), 400)
  },
  {
    nombre: 'POST con zona_id decimal 7.5 responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7.5, dia_id: 3, severidad: 'LEVE', descripcion: 'Descripción válida de prueba' }), 400)
  },
  {
    nombre: 'POST sin dia_id responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, severidad: 'LEVE', descripcion: 'Descripción válida de prueba' }), 400)
  },
  {
    nombre: 'POST con dia_id como texto "3" responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: "3", severidad: 'LEVE', descripcion: 'Descripción válida de prueba' }), 400)
  },
  {
    nombre: 'POST con dia_id decimal 3.5 responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3.5, severidad: 'LEVE', descripcion: 'Descripción válida de prueba' }), 400)
  },
  {
    nombre: 'POST con asistente_id como texto "1" responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, asistente_id: "1", severidad: 'LEVE', descripcion: 'Descripción válida de prueba' }), 400)
  },
  {
    nombre: 'POST con asistente_id decimal 1.5 responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, asistente_id: 1.5, severidad: 'LEVE', descripcion: 'Descripción válida de prueba' }), 400)
  },
  {
    nombre: 'POST sin severidad responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, descripcion: 'Descripción válida de prueba' }), 400)
  },
  {
    nombre: 'POST con severidad inválida responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'CRITICA', descripcion: 'Descripción válida de prueba' }), 400)
  },
  {
    nombre: 'POST con severidad en minúsculas responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'leve', descripcion: 'Descripción válida de prueba' }), 400)
  },
  {
    nombre: 'POST sin descripción responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE' }), 400)
  },
  {
    nombre: 'POST con descripción menor a 10 caracteres responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: '123456789' }), 400)
  },
  {
    nombre: 'POST con descripción mayor a 500 caracteres responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: 'a'.repeat(501) }), 400)
  },
  {
    nombre: 'POST con descripción no string (número) responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: 1234567890 }), 400)
  },
  {
    nombre: 'Orden: body inválido con zona inexistente responde 400 (no 404)',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 999999, dia_id: 3, severidad: 'INVALIDA', descripcion: 'Descripción válida de prueba' }), 400)
  },

  // --- POST: Validaciones de existencia (404) ---
  {
    nombre: 'POST con zona_id inexistente responde 404',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 999999, dia_id: 3, severidad: 'LEVE', descripcion: 'Descripción válida de prueba' }), 404)
  },
  {
    nombre: 'POST con dia_id inexistente responde 404',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 999999, severidad: 'LEVE', descripcion: 'Descripción válida de prueba' }), 404)
  },
  {
    nombre: 'POST con asistente_id inexistente responde 404',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, asistente_id: 999999, severidad: 'LEVE', descripcion: 'Descripción válida de prueba' }), 404)
  },

  // --- POST: Casos exitosos en día 3, límites y campos calculados ---
  {
    nombre: 'POST con descripción límite de exactamente 10 caracteres (201)',
    prueba: async ({ api, ctx }) => {
      const item = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: '1234567890' }), 201);
      espera.igual(item.estado, 'ABIERTO', 'estado');
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(item.id);
    }
  },
  {
    nombre: 'POST con descripción límite de exactamente 500 caracteres (201)',
    prueba: async ({ api, ctx }) => {
      const item = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'MODERADA', descripcion: 'x'.repeat(500) }), 201);
      espera.igual(item.estado, 'ABIERTO', 'estado');
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(item.id);
    }
  },
  {
    nombre: 'POST sin asistente_id guarda null (201)',
    prueba: async ({ api, ctx }) => {
      const item = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'GRAVE', descripcion: 'Caída sin asistente identificado' }), 201);
      espera.igual(item.asistente_id, null, 'asistente_id null');
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(item.id);
    }
  },
  {
    nombre: 'POST con asistente_id 1 responde 201',
    prueba: async ({ api, ctx }) => {
      const item = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, asistente_id: 1, severidad: 'LEVE', descripcion: 'Incidente con asistente 1 identificado' }), 201);
      espera.igual(item.asistente_id, 1, 'asistente_id asignado');
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(item.id);
    }
  },
  {
    nombre: 'POST ignora id, estado y state enviados en body (201)',
    prueba: async ({ api, ctx }) => {
      const item = espera.item(await api.post(R, {
        zona_id: 7,
        dia_id: 3,
        severidad: 'LEVE',
        descripcion: 'Ignora campos del servidor',
        id: 8888,
        estado: 'CERRADO',
        state: 'REMOVED'
      }), 201);
      espera.igual(item.estado, 'ABIERTO', 'estado debe ser ABIERTO');
      espera.igual(item.state, 'ACTIVE', 'state debe ser ACTIVE');
      espera.cierto(item.id !== 8888, 'id autoincremental de base de datos');
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(item.id);
    }
  },

  // --- PATCH: Validaciones 400 (campos no editables o desconocidos) ---
  {
    nombre: 'PATCH con campo no editable "estado" responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1`, { estado: 'EN_ATENCION' }), 400)
  },
  {
    nombre: 'PATCH con campo no editable "dia_id" responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1`, { dia_id: 2 }), 400)
  },
  {
    nombre: 'PATCH con campo no editable "id" responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1`, { id: 99 }), 400)
  },
  {
    nombre: 'PATCH con campo no editable "state" responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1`, { state: 'REMOVED' }), 400)
  },
  {
    nombre: 'PATCH con campo desconocido responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1`, { campo_inventado: 123 }), 400)
  },

  // --- PATCH: Tipos / valores inválidos en campos editables (400) ---
  {
    nombre: 'PATCH con descripcion corta responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1`, { descripcion: 'Corta' }), 400)
  },
  {
    nombre: 'PATCH con descripcion mayor a 500 caracteres responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1`, { descripcion: 'x'.repeat(501) }), 400)
  },
  {
    nombre: 'PATCH con severidad inválida responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1`, { severidad: 'INVALIDA' }), 400)
  },
  {
    nombre: 'PATCH con severidad en minúsculas responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1`, { severidad: 'leve' }), 400)
  },
  {
    nombre: 'PATCH con zona_id como texto responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1`, { zona_id: "7" }), 400)
  },
  {
    nombre: 'PATCH con zona_id decimal responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1`, { zona_id: 7.5 }), 400)
  },
  {
    nombre: 'PATCH con asistente_id como texto responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1`, { asistente_id: "1" }), 400)
  },
  {
    nombre: 'PATCH con asistente_id decimal responde 400',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/1`, { asistente_id: 1.5 }), 400)
  },

  // --- PATCH: Existencia (404) y cuerpo vacío {} ---
  {
    nombre: 'PATCH con {} sobre registro inexistente responde 404',
    prueba: async ({ api }) => espera.error(await api.patch(`${R}/999999`, {}), 404)
  },
  {
    nombre: 'PATCH con zona_id inexistente responde 404',
    prueba: async ({ api, ctx }) => {
      const creado = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: 'Incidente para probar zona 404' }), 201);
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(creado.id);
      espera.error(await api.patch(`${R}/${creado.id}`, { zona_id: 999999 }), 404);
    }
  },
  {
    nombre: 'PATCH con asistente_id inexistente responde 404',
    prueba: async ({ api, ctx }) => {
      const creado = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: 'Incidente para probar asistente 404' }), 201);
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(creado.id);
      espera.error(await api.patch(`${R}/${creado.id}`, { asistente_id: 999999 }), 404);
    }
  },
  {
    nombre: 'PATCH con {} sobre incidente ABIERTO responde 200 sin cambios',
    prueba: async ({ api, ctx }) => {
      const creado = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: 'Incidente para probar patch vacío' }), 201);
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(creado.id);
      const res = espera.item(await api.patch(`${R}/${creado.id}`, {}), 200);
      espera.igual(res.descripcion, 'Incidente para probar patch vacío', 'descripcion sin cambios');
      espera.igual(res.severidad, 'LEVE', 'severidad sin cambios');
    }
  },
  {
    nombre: 'PATCH válido refleja los cambios (200)',
    prueba: async ({ api, ctx }) => {
      const creado = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: 'Incidente para edición válida' }), 201);
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(creado.id);
      const modificado = espera.item(await api.patch(`${R}/${creado.id}`, {
        severidad: 'GRAVE',
        descripcion: 'Descripción actualizada con éxito',
        asistente_id: 1,
        zona_id: 8
      }), 200);
      espera.igual(modificado.severidad, 'GRAVE', 'severidad editada');
      espera.igual(modificado.descripcion, 'Descripción actualizada con éxito', 'descripcion editada');
      espera.igual(modificado.asistente_id, 1, 'asistente_id editado');
      espera.igual(modificado.zona_id, 8, 'zona_id editado');
      const getRes = espera.item(await api.get(`${R}/${creado.id}`), 200);
      espera.igual(getRes.severidad, 'GRAVE', 'GET refleja severidad');
      espera.igual(getRes.descripcion, 'Descripción actualizada con éxito', 'GET refleja descripcion');
    }
  },
  {
    nombre: 'PATCH permite desvincular asistente con asistente_id: null',
    prueba: async ({ api, ctx }) => {
      const creado = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, asistente_id: 1, severidad: 'LEVE', descripcion: 'Incidente con asistente inicial' }), 201);
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(creado.id);
      const modificado = espera.item(await api.patch(`${R}/${creado.id}`, { asistente_id: null }), 200);
      espera.igual(modificado.asistente_id, null, 'asistente_id removido');
    }
  },
  {
    nombre: 'PATCH sobre incidente EN_ATENCION es editable (200)',
    prueba: async ({ api, ctx }) => {
      const creado = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: 'Incidente para avanzar y editar' }), 201);
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(creado.id);
      espera.item(await estado(api, creado.id, 'EN_ATENCION'), 200);
      const editado = espera.item(await api.patch(`${R}/${creado.id}`, { descripcion: 'Nueva descripcion en atencion' }), 200);
      espera.igual(editado.descripcion, 'Nueva descripcion en atencion', 'descripcion');
    }
  },

  // --- REGLAS 409 de PATCH sobre CERRADO ---
  {
    nombre: 'Regla 409: un incidente CERRADO no se edita con body válido',
    prueba: async ({ api, ctx }) => {
      const creado = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: 'Incidente para cerrar y probar regla' }), 201);
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(creado.id);
      await estado(api, creado.id, 'EN_ATENCION');
      await estado(api, creado.id, 'CERRADO');
      espera.error(await api.patch(`${R}/${creado.id}`, { descripcion: 'Intento de edicion en cerrado' }), 409);
      espera.error(await api.patch(`${R}/${creado.id}`, {}), 409);
    }
  },
  {
    nombre: 'Orden: body inválido sobre incidente CERRADO responde 400 antes que 409',
    prueba: async ({ api, ctx }) => {
      const creado = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: 'Incidente para cerrar y probar orden' }), 201);
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(creado.id);
      await estado(api, creado.id, 'EN_ATENCION');
      await estado(api, creado.id, 'CERRADO');
      espera.error(await api.patch(`${R}/${creado.id}`, { severidad: 'INVALIDA' }), 400);
      espera.error(await api.patch(`${R}/${creado.id}`, { estado: 'ABIERTO' }), 400);
    }
  },

  // --- DELETE: Borrado lógico, 404 posterior y regla 409 ---
  {
    nombre: 'DELETE /api/incidentes/:id borra lógicamente (200), y subsecuentes GET/PATCH/DELETE/estado dan 404',
    prueba: async ({ api }) => {
      const creado = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: 'Incidente a ser eliminado lógicamente' }), 201);
      const id = creado.id;

      const delRes = await api.del(`${R}/${id}`);
      espera.status(delRes, 200);
      espera.cierto(delRes.body && (typeof delRes.body.message === 'string' || typeof delRes.body === 'object'), 'Respuesta de borrado 200');

      // GET posterior -> 404
      espera.error(await api.get(`${R}/${id}`), 404);
      // PATCH posterior -> 404
      espera.error(await api.patch(`${R}/${id}`, {}), 404);
      // Segundo DELETE -> 404
      espera.error(await api.del(`${R}/${id}`), 404);
      // PATCH /:id/estado posterior -> 404
      espera.error(await estado(api, id, 'EN_ATENCION'), 404);

      // Listado no debe contener el ID
      const lista = espera.lista(await api.get(`${R}?limit=50`));
      espera.cierto(lista.data.every((x) => x.id !== id), 'No debe aparecer en el listado activo');
    }
  },
  {
    nombre: 'Regla 409: no se puede eliminar un incidente EN_ATENCION',
    prueba: async ({ api, ctx }) => {
      const creado = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: 'Incidente en atencion para borrar' }), 201);
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(creado.id);
      await estado(api, creado.id, 'EN_ATENCION');
      espera.error(await api.del(`${R}/${creado.id}`), 409);
    }
  },
  {
    nombre: 'Regla 409: no se puede eliminar un incidente CERRADO',
    prueba: async ({ api, ctx }) => {
      const creado = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: 'Incidente cerrado para borrar' }), 201);
      if (!ctx.creados) ctx.creados = [];
      ctx.creados.push(creado.id);
      await estado(api, creado.id, 'EN_ATENCION');
      await estado(api, creado.id, 'CERRADO');
      espera.error(await api.del(`${R}/${creado.id}`), 409);
    }
  },

  // --- Errores en general y ausencia de stack trace ---
  {
    nombre: 'JSON malformado responde 400 con { error } sin stack trace',
    prueba: async ({ espera }) => {
      const res = await fetch('http://localhost:3000/api/incidentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"zona_id": 7, "incompleto": '
      });
      const data = await res.json();
      espera.igual(res.status, 400, 'status 400');
      espera.cierto(typeof data.error === 'string' && data.error.length > 0, 'error message');
      espera.cierto(data.stack === undefined, 'no stack trace');
    }
  },
  {
    nombre: 'Ruta inexistente responde 404 con { error } sin stack trace',
    prueba: async ({ api, espera }) => {
      const res = await api.get('/api/ruta_totalmente_inexistente');
      espera.error(res, 404);
      espera.cierto(res.body && res.body.stack === undefined, 'no stack trace');
    }
  }
];

// Importación opcional de pruebas de estado y resumen de la sesión 2
const aqui = dirname(fileURLToPath(import.meta.url));
const archivoExtra = join(aqui, 'estado-resumen.mjs');
if (existsSync(archivoExtra)) {
  const extra = (await import(pathToFileURL(archivoExtra).href)).default;
  if (Array.isArray(extra)) {
    pruebas.push(...extra);
  }
}

export default pruebas;
