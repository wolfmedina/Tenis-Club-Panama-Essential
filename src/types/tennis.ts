export type Role = 'jugador' | 'admin' | 'instructor';
export type SkillLevel = 'Principiante' | 'Intermedio' | 'Avanzado' | 'Pro';
export type Modality = 'Individual' | 'Dobles' | 'Dobles mixto';
export type SurfaceType = 'Dura (Hard Court)' | 'Arcilla' | 'Césped Sintético';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  provincia: string;
  distrito: string;
  nivel: SkillLevel;
  asistenciaScore: number;
  favoritosSedes: string[];
  avatarSeed: string;
  avatarUrl?: string;
}

export interface Sede {
  id: string;
  nombre: string;
  tipo: 'Pública' | 'Privada';
  provincia: string;
  distrito: string;
  direccion: string;
  rating: number;
  resenasCount: number;
  amenidades: string[];
  reglamento: string;
  horarioApertura: string;
  horarioCierre: string;
  politicaCancelacionHoras: number;
  imagenVariant: 'night-club' | 'coastal-palm' | 'balboa-park' | 'west-clay';
  activa: boolean;
}

export type DayGroup = 'Todos' | 'Lun-Vie' | 'Fines de semana';

export interface TarifaRegla {
  id: string;
  dias: DayGroup;
  horaDesde: string;
  horaHasta: string;
  duracionMin?: 60 | 90 | 120;
  precioHora: number;
}

export interface Cancha {
  id: string;
  sedeId: string;
  nombre: string;
  superficie: SurfaceType;
  iluminacion: boolean;
  techada: boolean;
  precioHora: number;
  precioNocturno?: number;
  preciosPorDuracion?: Partial<Record<60 | 90 | 120, number>>;
  tarifasPersonalizadas?: TarifaRegla[];
  capacidadMax: number;
  estado: 'Disponible' | 'Bloqueada' | 'Mantenimiento';
  motivoBloqueo?: string;
}

export type ReservaEstado =
  | 'Pendiente de aprobación'
  | 'Confirmada'
  | 'En curso'
  | 'Finalizada'
  | 'Cancelada'
  | 'Rechazada';

export type PagoEstado =
  | 'Pendiente de aprobación'
  | 'Aprobado'
  | 'Rechazado';

export type PaymentMethod =
  | 'Transferencia bancaria (Ejemplo)'
  | 'Pago móvil en club (Ejemplo)'
  | 'Depósito manual (Ejemplo)';

export interface ComprobanteDemo {
  referencia: string;
  archivoNombre: string;
  fechaEnvio: string;
  nota?: string;
}

export interface Reserva {
  id: string;
  codigo: string;
  sedeId: string;
  canchaId: string;
  usuarioId: string;
  fecha: string;
  horaInicio: string;
  duracionMin: 60 | 90 | 120;
  modalidad: Modality;
  participantes: string[];
  estado: ReservaEstado;
  asistenciaValidada: boolean;
  precioCancha: number;
  cargoServicio: number;
  totalPagado: number;
  metodoPago: PaymentMethod;
  pagoEstado: PagoEstado;
  comprobante?: ComprobanteDemo;
  motivoRechazo?: string;
  creadaEn: string;
  tipoOrigen: 'Jugador' | 'Manual Admin';
  notas?: string;
}

export type ConvocatoriaEstado = 'Abierta' | 'Completa' | 'Cerrada' | 'Cancelada';

export interface Convocatoria {
  id: string;
  reservaId?: string;
  sedeId: string;
  canchaId?: string;
  organizadorId: string;
  titulo: string;
  modalidad: Modality;
  nivel: SkillLevel;
  fecha: string;
  horaInicio: string;
  duracionMin: number;
  cupoTotal: number;
  jugadoresIds: string[];
  invitadosIds: string[];
  pendientesAprobacionIds: string[];
  aprobacionAutomatica: boolean;
  aportePorJugador: number;
  descripcion: string;
  estado: ConvocatoriaEstado;
  destacado?: boolean;
}

export interface Instructor {
  id: string;
  usuarioId: string;
  nombre: string;
  titulo: string;
  sedePrincipalId: string;
  sedesAutorizadas: string[];
  especialidades: string[];
  certificaciones: string[];
  tiposClase: ('Grupales' | 'Privadas' | 'Dúo' | 'Junior')[];
  precioBase: number;
  rating: number;
  resenasCount: number;
  disponibleHoy: boolean;
  proximaSlotTexto: string;
  verificado: boolean;
  avatarSeed: string;
  horariosDisponibles: string[];
}

export interface ClaseProgramada {
  id: string;
  sedeId: string;
  canchaId: string;
  instructorId: string;
  titulo: string;
  tipo: 'Individual' | 'Pareja' | 'Grupal' | 'Junior';
  fecha: string;
  horaInicio: string;
  duracionMin: 60 | 90;
  precioPorCupo: number;
  cupoMax: number;
  alumnosIds: string[];
  asistenciaIds: string[];
  estado: 'Abierta' | 'Completa' | 'Finalizada' | 'Cancelada';
}

export interface Notificacion {
  id: string;
  usuarioId: string;
  titulo: string;
  mensaje: string;
  categoria: 'Reserva' | 'Comunidad' | 'Clase' | 'Sistema';
  leida: boolean;
  fechaTexto: string;
}

export interface CommercialCapacity {
  maxSedes: number;
  maxCanchas: number;
}

export interface AppState {
  currentUserId: string;
  activeSedeId: string;
  isAuthenticated: boolean;
  serviceFeePct: number;
  commercialCapacity: CommercialCapacity;
  usuarios: Usuario[];
  sedes: Sede[];
  canchas: Cancha[];
  reservas: Reserva[];
  convocatorias: Convocatoria[];
  instructores: Instructor[];
  clases: ClaseProgramada[];
  notificaciones: Notificacion[];
}
