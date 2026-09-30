import { Request, Response, NextFunction } from 'express';
import { ListarIncidentes } from '../../application/incidentes/ListarIncidentes.js';

export class IncidenteController {
  constructor(private readonly listarIncidentes: ListarIncidentes) {}

  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resultado = await this.listarIncidentes.execute(req.query);
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }
}
