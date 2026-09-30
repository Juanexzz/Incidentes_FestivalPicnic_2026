import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaIncidenteRepository } from './infrastructure/repositories/PrismaIncidenteRepository.js';
import { PrismaReferenciaRepository } from './infrastructure/repositories/PrismaReferenciaRepository.js';
import { ListarIncidentes } from './application/incidentes/ListarIncidentes.js';
import { IncidenteController } from './interface/controllers/IncidenteController.js';
import { createIncidenteRouter } from './interface/routes/incidenteRoutes.js';
import { errorHandler, notFoundHandler } from './interface/middlewares/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// Inyección de dependencias
const incidenteRepository = new PrismaIncidenteRepository();
const referenciaRepository = new PrismaReferenciaRepository();

const listarIncidentes = new ListarIncidentes(incidenteRepository);
const incidenteController = new IncidenteController(listarIncidentes);

// Rutas
app.use('/api/incidentes', createIncidenteRouter(incidenteController));

// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
}

export { app, incidenteRepository, referenciaRepository };
