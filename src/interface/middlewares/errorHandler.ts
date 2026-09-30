import { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, ConflictError } from '../../domain/errors.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // JSON malformado
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Cuerpo de solicitud JSON malformado' });
    return;
  }

  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(409).json({ error: err.message });
    return;
  }

  // Error inesperado: nunca stack trace
  res.status(500).json({ error: 'Error interno del servidor' });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Ruta no encontrada' });
}
