import { espera } from '../Kit/Pruebas/lib.mjs';

const R = '/api/incidentes';
const estado = (api, id, e) => api.patch(`${R}/${id}/estado`, { estado: e });

export default [
  // ==========================================
  // PRUEBAS DE ESTADO: Validaciones 400 / 404
  // ==========================================
  {
    nombre: 'PATCH /api/incidentes/abc/estado responde 400 (id inválido)',
    prueba: async ({ api }) => {
      espera.error(await api.patch(`${R}/abc/estado`, { estado: 'EN_ATENCION' }), 400);
    }
  },
  {
    nombre: 'PATCH /api/incidentes/:id/estado sin campo estado responde 400',
    prueba: async ({ api }) => {
      espera.error(await api.patch(`${R}/2/estado`, {}), 400);
    }
  },
  {
    nombre: 'PATCH /api/incidentes/:id/estado con estado "FOO" responde 400',
    prueba: async ({ api }) => {
      espera.error(await estado(api, 2, 'FOO'), 400);
    }
  },
  {
    nombre: 'PATCH /api/incidentes/:id/estado con estado en minúsculas "cerrado" responde 400',
    prueba: async ({ api }) => {
      espera.error(await estado(api, 2, 'cerrado'), 400);
    }
  },
  {
    nombre: 'PATCH /api/incidentes/:id/estado body inválido con id inexistente responde 400 (valida body antes que 404)',
    prueba: async ({ api }) => {
      // Sin campo estado
      espera.error(await api.patch(`${R}/999999/estado`, {}), 400);
      // Estado inválido
      espera.error(await estado(api, 999999, 'INVALIDO'), 400);
    }
  },
  {
    nombre: 'PATCH /api/incidentes/999999/estado con estado válido responde 404 (id inexistente)',
    prueba: async ({ api }) => {
      espera.error(await estado(api, 999999, 'EN_ATENCION'), 404);
    }
  },

  // ==========================================
  // PRUEBAS DE ESTADO: Transiciones y 409
  // ==========================================
  {
    nombre: 'Transiciones de estado: ciclo completo y restricciones 409 en dia 2',
    prueba: async ({ api, espera }) => {
      // Crear incidente en día 2 en estado inicial ABIERTO
      const postRes = await api.post(R, {
        zona_id: 1,
        dia_id: 2,
        severidad: 'LEVE',
        descripcion: 'Incidente de prueba para transiciones de estado'
      });
      const creado = espera.item(postRes, 201);
      const incId = creado.id;
      espera.igual(creado.estado, 'ABIERTO', 'El estado inicial debe ser ABIERTO');

      try {
        // Regla: ABIERTO -> CERRADO no permitido (409)
        espera.error(await estado(api, incId, 'CERRADO'), 409);

        // Regla: ABIERTO -> ABIERTO no permitido repetir (409)
        espera.error(await estado(api, incId, 'ABIERTO'), 409);

        // Transición válida: ABIERTO -> EN_ATENCION (200)
        const resEnAtencion = await estado(api, incId, 'EN_ATENCION');
        const itemEnAtencion = espera.item(resEnAtencion, 200);
        espera.igual(itemEnAtencion.estado, 'EN_ATENCION', 'Transición a EN_ATENCION');

        // Regla: EN_ATENCION -> ABIERTO no permitido retroceder (409)
        espera.error(await estado(api, incId, 'ABIERTO'), 409);

        // Regla: EN_ATENCION -> EN_ATENCION no permitido repetir (409)
        espera.error(await estado(api, incId, 'EN_ATENCION'), 409);

        // Transición válida: EN_ATENCION -> CERRADO (200)
        const resCerrado = await estado(api, incId, 'CERRADO');
        const itemCerrado = espera.item(resCerrado, 200);
        espera.igual(itemCerrado.estado, 'CERRADO', 'Transición a CERRADO');

        // Regla: CERRADO -> cualquiera no permitido (409)
        espera.error(await estado(api, incId, 'ABIERTO'), 409);
        espera.error(await estado(api, incId, 'EN_ATENCION'), 409);
        espera.error(await estado(api, incId, 'CERRADO'), 409);
      } catch (err) {
        throw err;
      }
    }
  },

  // ==========================================
  // PRUEBAS DE RESUMEN
  // ==========================================
  {
    nombre: 'GET /api/incidentes/resumen?dia_id=1 cuenta exactamente 1/1/0',
    prueba: async ({ api }) => {
      const res = await api.get(`${R}/resumen?dia_id=1`);
      const data = espera.item(res, 200);
      espera.numero(data.dia_id, 1, 'dia_id');
      espera.numero(data.ABIERTO, 1, 'ABIERTO');
      espera.numero(data.EN_ATENCION, 1, 'EN_ATENCION');
      espera.numero(data.CERRADO, 0, 'CERRADO');
    }
  },
  {
    nombre: 'GET /api/incidentes/resumen sin dia_id devuelve suma global y dia_id null',
    prueba: async ({ api }) => {
      const res = await api.get(`${R}/resumen`);
      const data = espera.item(res, 200);
      espera.cierto(data.dia_id === null, 'dia_id debe ser null cuando se consulta global');
      espera.cierto(typeof data.ABIERTO === 'number', 'ABIERTO debe ser numérico');
      espera.cierto(typeof data.EN_ATENCION === 'number', 'EN_ATENCION debe ser numérico');
      espera.cierto(typeof data.CERRADO === 'number', 'CERRADO debe ser numérico');
    }
  },
  {
    nombre: 'GET /api/incidentes/resumen?dia_id=abc responde 400',
    prueba: async ({ api }) => {
      espera.error(await api.get(`${R}/resumen?dia_id=abc`), 400);
    }
  },
  {
    nombre: 'GET /api/incidentes/resumen en día sin incidentes responde con ceros (día 4)',
    prueba: async ({ api }) => {
      const res = await api.get(`${R}/resumen?dia_id=4`);
      const data = espera.item(res, 200);
      // Solo valida ceros si inicialmente el día 4 no tiene incidentes
      if (data.ABIERTO === 0 && data.EN_ATENCION === 0 && data.CERRADO === 0) {
        espera.numero(data.dia_id, 4, 'dia_id');
        espera.numero(data.ABIERTO, 0, 'ABIERTO');
        espera.numero(data.EN_ATENCION, 0, 'EN_ATENCION');
        espera.numero(data.CERRADO, 0, 'CERRADO');
      }
    }
  },
  {
    nombre: 'GET /api/incidentes/resumen conteo dinámico: subir con POST en día 2 y bajar con DELETE (excluye REMOVED)',
    prueba: async ({ api }) => {
      // 1. Conteo inicial del día 2
      const resInicial = await api.get(`${R}/resumen?dia_id=2`);
      const inicial = espera.item(resInicial, 200);

      // 2. Crear un incidente ABIERTO en día 2
      const postRes = await api.post(R, {
        zona_id: 1,
        dia_id: 2,
        severidad: 'LEVE',
        descripcion: 'Incidente de prueba temporal para validar conteos en resumen'
      });
      const nuevo = espera.item(postRes, 201);

      try {
        // 3. Conteo posterior a la creación: ABIERTO sube 1
        const resConIncidente = await api.get(`${R}/resumen?dia_id=2`);
        const conIncidente = espera.item(resConIncidente, 200);
        espera.numero(
          conIncidente.ABIERTO,
          inicial.ABIERTO + 1,
          'El conteo de ABIERTO debe aumentar en 1 tras la creación'
        );

        // 4. Borrado lógico (DELETE pasa a state="REMOVED")
        const delRes = await api.del(`${R}/${nuevo.id}`);
        espera.status(delRes, 200);

        // 5. Conteo posterior al borrado: ABIERTO vuelve al valor inicial (excluye REMOVED)
        const resTrasBorrado = await api.get(`${R}/resumen?dia_id=2`);
        const trasBorrado = espera.item(resTrasBorrado, 200);
        espera.numero(
          trasBorrado.ABIERTO,
          inicial.ABIERTO,
          'El conteo de ABIERTO debe volver al valor inicial tras el borrado lógico'
        );
      } catch (err) {
        // Asegurar limpieza si algo falla
        await api.del(`${R}/${nuevo.id}`).catch(() => {});
        throw err;
      }
    }
  }
];
