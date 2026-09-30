export interface Incidente {
  id: number;
  asistente_id: number | null;
  zona_id: number;
  dia_id: number;
  severidad: string;
  descripcion: string;
  estado: string;
  state: string;
  created_at?: Date;
  updated_at?: Date;
}
