import { Request, Response, NextFunction } from 'express';
import { ListarIncidentes } from '../../application/incidentes/ListarIncidentes.js';
import { ObtenerIncidente } from '../../application/incidentes/ObtenerIncidente.js';
import { CrearIncidente } from '../../application/incidentes/CrearIncidente.js';

export class IncidenteController {
  constructor(
    private readonly listarIncidentes: ListarIncidentes,
    private readonly obtenerIncidente: ObtenerIncidente,
    private readonly crearIncidente: CrearIncidente
  ) {}

  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resultado = await this.listarIncidentes.execute(req.query);
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  async obtener(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incidente = await this.obtenerIncidente.execute(req.params.id);
      res.status(200).json({ data: incidente });
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incidente = await this.crearIncidente.execute(req.body);
      res.status(201).json({ data: incidente });
    } catch (error) {
      next(error);
    }
  }
}
