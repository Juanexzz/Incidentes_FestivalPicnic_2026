import { espera } from '../Kit/Pruebas/lib.mjs';

const R = '/api/incidentes';

export default [
  // --- Paginación inválida ---
  {
    nombre: 'GET ?limit=0 responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?limit=0`), 400)
  },
  {
    nombre: 'GET ?limit=51 responde 400 (máx 50)',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?limit=51`), 400)
  },
  {
    nombre: 'GET ?page=0 responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?page=0`), 400)
  },
  {
    nombre: 'GET ?page=-1 responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?page=-1`), 400)
  },
  {
    nombre: 'GET ?page=abc responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?page=abc`), 400)
  },
  {
    nombre: 'GET ?limit=abc responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?limit=abc`), 400)
  },
  {
    nombre: 'GET ?page=1.5 responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?page=1.5`), 400)
  },

  // --- Filtros inválidos ---
  {
    nombre: 'GET ?dia_id=abc responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?dia_id=abc`), 400)
  },
  {
    nombre: 'GET ?dia_id=-1 responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?dia_id=-1`), 400)
  },
  {
    nombre: 'GET ?estado=INVALIDO responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?estado=INVALIDO`), 400)
  },
  {
    nombre: 'GET ?estado=abierto (minúsculas) responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?estado=abierto`), 400)
  },
  {
    nombre: 'GET ?severidad=EXTREMA responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?severidad=EXTREMA`), 400)
  },
  {
    nombre: 'GET ?severidad=leve (minúsculas) responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}?severidad=leve`), 400)
  },

  // --- IDs inválidos en GET /:id ---
  {
    nombre: 'GET /api/incidentes/0 responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}/0`), 400)
  },
  {
    nombre: 'GET /api/incidentes/-1 responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}/-1`), 400)
  },
  {
    nombre: 'GET /api/incidentes/1.5 responde 400',
    prueba: async ({ api }) => espera.error(await api.get(`${R}/1.5`), 400)
  },

  // --- POST: Validaciones de formato / tipo (400) ---
  {
    nombre: 'POST sin zona_id responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { dia_id: 3, severidad: 'LEVE', descripcion: 'Descripción válida de diez' }), 400)
  },
  {
    nombre: 'POST con zona_id como texto "7" responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: "7", dia_id: 3, severidad: 'LEVE', descripcion: 'Descripción válida de diez' }), 400)
  },
  {
    nombre: 'POST con zona_id decimal 7.5 responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7.5, dia_id: 3, severidad: 'LEVE', descripcion: 'Descripción válida de diez' }), 400)
  },
  {
    nombre: 'POST sin dia_id responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, severidad: 'LEVE', descripcion: 'Descripción válida de diez' }), 400)
  },
  {
    nombre: 'POST con dia_id como texto "3" responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: "3", severidad: 'LEVE', descripcion: 'Descripción válida de diez' }), 400)
  },
  {
    nombre: 'POST con asistente_id como texto "1" responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, asistente_id: "1", severidad: 'LEVE', descripcion: 'Descripción válida de diez' }), 400)
  },
  {
    nombre: 'POST con asistente_id decimal 1.5 responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, asistente_id: 1.5, severidad: 'LEVE', descripcion: 'Descripción válida de diez' }), 400)
  },
  {
    nombre: 'POST sin severidad responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, descripcion: 'Descripción válida de diez' }), 400)
  },
  {
    nombre: 'POST con severidad inexistente responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'CRITICA', descripcion: 'Descripción válida de diez' }), 400)
  },
  {
    nombre: 'POST con severidad en minúsculas responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'leve', descripcion: 'Descripción válida de diez' }), 400)
  },
  {
    nombre: 'POST sin descripción responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE' }), 400)
  },
  {
    nombre: 'POST con descripción de 9 caracteres responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: '123456789' }), 400)
  },
  {
    nombre: 'POST con descripción de 501 caracteres responde 400',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: 'a'.repeat(501) }), 400)
  },

  // --- ORDEN DE VALIDACIONES: 400 antes que 404 ---
  {
    nombre: 'Orden: severidad inválida con zona inexistente responde 400 (no 404)',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 999999, dia_id: 3, severidad: 'INVALIDA', descripcion: 'Descripción válida de diez' }), 400)
  },
  {
    nombre: 'Orden: descripción corta con dia_id inexistente responde 400 (no 404)',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 999999, severidad: 'LEVE', descripcion: 'Corta' }), 400)
  },

  // --- POST: Validaciones de existencia (404) ---
  {
    nombre: 'POST con zona_id inexistente responde 404',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 999999, dia_id: 3, severidad: 'LEVE', descripcion: 'Descripción válida de diez' }), 404)
  },
  {
    nombre: 'POST con dia_id inexistente responde 404',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 999999, severidad: 'LEVE', descripcion: 'Descripción válida de diez' }), 404)
  },
  {
    nombre: 'POST con asistente_id inexistente responde 404',
    prueba: async ({ api }) => espera.error(await api.post(R, { zona_id: 7, dia_id: 3, asistente_id: 999999, severidad: 'LEVE', descripcion: 'Descripción válida de diez' }), 404)
  },

  // --- POST: Casos de éxito en día 3 y límites válidos ---
  {
    nombre: 'POST con descripción límite de 10 caracteres responde 201',
    prueba: async ({ api, ctx }) => {
      const item = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'LEVE', descripcion: '1234567890' }), 201);
      espera.igual(item.estado, 'ABIERTO', 'estado inicial');
      if (!ctx.propios) ctx.propios = [];
      ctx.propios.push(item.id);
    }
  },
  {
    nombre: 'POST con descripción límite de 500 caracteres responde 201',
    prueba: async ({ api, ctx }) => {
      const item = espera.item(await api.post(R, { zona_id: 7, dia_id: 3, severidad: 'MODERADA', descripcion: 'a'.repeat(500) }), 201);
      espera.igual(item.estado, 'ABIERTO', 'estado inicial');
      if (!ctx.propios) ctx.propios = [];
      ctx.propios.push(item.id);
    }
  },
  {
    nombre: 'POST con asistente_id válido y campos calculados enviados que se ignoran (201)',
    prueba: async ({ api, ctx }) => {
      const item = espera.item(await api.post(R, {
        zona_id: 7,
        dia_id: 3,
        asistente_id: 1,
        severidad: 'GRAVE',
        descripcion: 'Torcedura de tobillo en salida',
        id: 9999,
        estado: 'CERRADO',
        state: 'REMOVED'
      }), 201);
      espera.igual(item.asistente_id, 1, 'asistente_id asignado');
      espera.igual(item.estado, 'ABIERTO', 'estado debe ser ABIERTO a pesar del body');
      espera.igual(item.state, 'ACTIVE', 'state debe ser ACTIVE a pesar del body');
      if (!ctx.propios) ctx.propios = [];
      ctx.propios.push(item.id);
    }
  }
];
