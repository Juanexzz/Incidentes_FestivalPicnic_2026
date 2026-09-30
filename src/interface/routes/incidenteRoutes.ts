import { Router } from 'express';
import { IncidenteController } from '../controllers/IncidenteController.js';

export function createIncidenteRouter(controller: IncidenteController): Router {
  const router = Router();

  router.get('/', (req, res, next) => controller.listar(req, res, next));
  router.get('/:id', (req, res, next) => controller.obtener(req, res, next));

  return router;
}
