import { prisma } from '../database.js';
import { ReferenciaRepository } from '../../domain/repositories.js';

export class PrismaReferenciaRepository implements ReferenciaRepository {
  async existeAsistente(id: number): Promise<boolean> {
    const count = await prisma.asistentes.count({
      where: { id }
    });
    return count > 0;
  }

  async existeZona(id: number): Promise<boolean> {
    const count = await prisma.zonas.count({
      where: { id }
    });
    return count > 0;
  }

  async existeDia(id: number): Promise<boolean> {
    const count = await prisma.dias.count({
      where: { id }
    });
    return count > 0;
  }
}
