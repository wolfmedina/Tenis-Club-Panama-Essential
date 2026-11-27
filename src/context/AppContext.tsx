import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createInitialState } from '../data/seedData';
import type {
  AppState,
  ClaseProgramada,
  ComprobanteDemo,
  Convocatoria,
  Modality,
  PaymentMethod,
  Reserva,
  Role,
  SkillLevel,
  TarifaRegla,
  Usuario,
} from '../types/tennis';
import {
  calculateBookingTotals,
  formatHour12,
  isInstructorAvailable,
  isSlotAvailable,
  joinConvocatoriaLogic,
  validateCourtRates,
} from '../utils/tennisLogic';

export interface ToastMessage {
  id: string;
  text: string;
  tone: 'success' | 'error' | 'info';
}

export interface WhatsAppDialogInfo {
  target: string;
  context: string;
  roleLabel?: string;
}

interface CreateBookingInput {
  sedeId: string;
  canchaId: string;
  fecha: string;
  horaInicio: string;
  duracionMin: 60 | 90 | 120;
  modalidad: Modality;
  participantes: string[];
  metodoPago: PaymentMethod;
  comprobante?: ComprobanteDemo;
  pendingApproval?: boolean;
  tipoOrigen?: 'Jugador' | 'Manual Admin';
  usuarioIdOverride?: string;
}

interface AppContextValue {
  state: AppState;
  currentUser: Usuario;
  activeSede: AppState['sedes'][number];
  toast: ToastMessage | null;
  whatsappDialog: WhatsAppDialogInfo | null;
  showToast: (text: string, tone?: ToastMessage['tone']) => void;
  openWhatsAppDemo: (target: string, context: string, roleLabel?: string) => void;
  closeWhatsAppDemo: () => void;
  confirmWhatsAppDemo: () => void;
  loginDemo: (emailOrRole: string | Role) => void;
  registerDemoPlayer: (nombre: string, email: string, provincia: string, nivel: SkillLevel) => void;
  logout: () => void;
  switchRole: (rol: Role) => void;
  switchSede: (sedeId: string) => void;
  toggleFavoriteSede: (sedeId: string) => void;
  updateUserPreferences: (patch: Partial<Usuario>) => void;
  resetDemoData: () => void;
  createReservation: (input: CreateBookingInput) => { ok: boolean; reserva?: Reserva; error?: string };
  reviewReservationPayment: (reservaId: string, approve: boolean, motivoRechazo?: string) => void;
  cancelReservation: (reservaId: string, byAdmin?: boolean) => void;
  rescheduleReservation: (reservaId: string, nuevaFecha: string, nuevaHora: string) => { ok: boolean; error?: string };
  validateCheckInCode: (codigo: string) => { ok: boolean; message: string };
  toggleCourtStatus: (canchaId: string) => void;
  updateCourtRates: (
    canchaId: string,
    config: {
      precioHora: number;
      precioNocturno?: number;
      preciosPorDuracion?: Partial<Record<60 | 90 | 120, number>>;
      tarifasPersonalizadas?: TarifaRegla[];
    }
  ) => { ok: boolean; error?: string };
  createConvocatoria: (input: {
    reservaId?: string;
    sedeId?: string;
    fecha?: string;
    horaInicio?: string;
    duracionMin?: number;
    titulo: string;
    nivel: SkillLevel;
    modalidad: Modality;
    cupoTotal: number;
    aportePorJugador: number;
    descripcion: string;
    aprobacionAutomatica: boolean;
    invitadosIds?: string[];
  }) => { ok: boolean; convocatoria?: Convocatoria; error?: string };
  joinConvocatoria: (convId: string) => { ok: boolean; message: string };
  inviteToConvocatoria: (convId: string, userId: string) => void;
  approvePendingPlayer: (convId: string, userId: string, approve: boolean) => void;
  leaveConvocatoria: (convId: string) => void;
  bookClass: (input: {
    instructorId: string;
    sedeId: string;
    canchaId: string;
    tipo: ClaseProgramada['tipo'];
    fecha: string;
    horaInicio: string;
    duracionMin: 60 | 90;
    metodoPago: PaymentMethod;
  }) => { ok: boolean; error?: string };
  enrollInExistingClass: (claseId: string) => { ok: boolean; message: string };
  toggleClassAttendance: (claseId: string, alumnoId: string) => void;
  createInstructorClass: (input: {
    sedeId: string;
    canchaId: string;
    titulo: string;
    tipo: ClaseProgramada['tipo'];
    fecha: string;
    horaInicio: string;
    duracionMin: 60 | 90;
    precioPorCupo: number;
    cupoMax: number;
  }) => { ok: boolean; error?: string };
  updateInstructorProfile: (
    instructorId: string,
    patch: { precioBase?: number; especialidades?: string[]; horariosDisponibles?: string[] }
  ) => void;
  sendAdminNotification: (titulo: string, mensaje: string) => void;
  markAllNotificationsRead: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function createDemoInitialState(): AppState {
  const initial = createInitialState();
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';
  return autostart ? { ...initial, isAuthenticated: true } : initial;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado exclusivamente en memoria de React (sin localStorage ni persistencia externa)
  const [state, setState] = useState<AppState>(createDemoInitialState);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [whatsappDialog, setWhatsappDialog] = useState<WhatsAppDialogInfo | null>(null);

  const showToast = useCallback((text: string, tone: ToastMessage['tone'] = 'success') => {
    const id = String(Date.now());
    setToast({ id, text, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3400);
  }, []);

  const openWhatsAppDemo = useCallback((target: string, context: string, roleLabel?: string) => {
    setWhatsappDialog({ target, context, roleLabel });
  }, []);

  const closeWhatsAppDemo = useCallback(() => {
    setWhatsappDialog(null);
  }, []);

  const confirmWhatsAppDemo = useCallback(() => {
    if (!whatsappDialog) return;
    const target = whatsappDialog.target;
    setWhatsappDialog(null);
    showToast(`Contacto visual por WhatsApp simulado con ${target}`, 'info');
  }, [whatsappDialog, showToast]);

  const currentUser = useMemo(
    () => state.usuarios.find((u) => u.id === state.currentUserId) || state.usuarios[0],
    [state.usuarios, state.currentUserId]
  );

  const activeSede = useMemo(
    () => state.sedes.find((s) => s.id === state.activeSedeId) || state.sedes[0],
    [state.sedes, state.activeSedeId]
  );

  const loginDemo = useCallback((emailOrRole: string | Role) => {
    setState((prev) => {
      let targetUser = prev.usuarios.find((u) => u.rol === emailOrRole);
      if (!targetUser && typeof emailOrRole === 'string') {
        targetUser = prev.usuarios.find(
          (u) => u.email.toLowerCase() === emailOrRole.toLowerCase()
        );
      }
      if (!targetUser) {
        targetUser = prev.usuarios.find((u) => u.rol === 'jugador') || prev.usuarios[0];
      }
      return {
        ...prev,
        currentUserId: targetUser.id,
        isAuthenticated: true,
      };
    });
  }, []);

  const registerDemoPlayer = useCallback(
    (nombre: string, email: string, provincia: string, nivel: SkillLevel) => {
      const id = `u_${Date.now()}`;
      const newUser: Usuario = {
        id,
        nombre: nombre.trim(),
        email: email.trim(),
        rol: 'jugador',
        provincia,
        distrito: provincia === 'Panamá' ? 'Ciudad de Panamá' : 'Centro',
        nivel,
        asistenciaScore: 100,
        favoritosSedes: ['sede_tcp'],
        avatarSeed: nombre.slice(0, 4).toLowerCase(),
      };
      setState((prev) => ({
        ...prev,
        usuarios: [...prev.usuarios, newUser],
        currentUserId: id,
        isAuthenticated: true,
      }));
      showToast(`Bienvenido a Tenis Club Panamá (Demo), ${newUser.nombre}`);
    },
    [showToast]
  );

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, isAuthenticated: false }));
  }, []);

  const switchRole = useCallback(
    (rol: Role) => {
      setState((prev) => {
        const match = prev.usuarios.find((u) => u.rol === rol);
        if (!match) return prev;
        return {
          ...prev,
          currentUserId: match.id,
          isAuthenticated: true,
        };
      });
      const label =
        rol === 'jugador' ? 'Jugador' : rol === 'admin' ? 'Administrador de Sede' : 'Instructor';
      showToast(`Perfil activo: ${label}`, 'info');
    },
    [showToast]
  );

  const switchSede = useCallback((sedeId: string) => {
    setState((prev) => ({ ...prev, activeSedeId: sedeId }));
  }, []);

  const toggleFavoriteSede = useCallback((sedeId: string) => {
    setState((prev) => ({
      ...prev,
      usuarios: prev.usuarios.map((u) => {
        if (u.id !== prev.currentUserId) return u;
        const exists = u.favoritosSedes.includes(sedeId);
        return {
          ...u,
          favoritosSedes: exists
            ? u.favoritosSedes.filter((id) => id !== sedeId)
            : [...u.favoritosSedes, sedeId],
        };
      }),
    }));
  }, []);

  const updateUserPreferences = useCallback(
    (patch: Partial<Usuario>) => {
      setState((prev) => ({
        ...prev,
        usuarios: prev.usuarios.map((u) => (u.id === prev.currentUserId ? { ...u, ...patch } : u)),
      }));
      showToast('Perfil actualizado en la sesión demo');
    },
    [showToast]
  );

  const resetDemoData = useCallback(() => {
    const fresh = createInitialState();
    fresh.isAuthenticated = true;
    setState(fresh);
    showToast('Datos de demostración reiniciados', 'info');
  }, [showToast]);

  const createReservation = useCallback(
    (input: CreateBookingInput): { ok: boolean; reserva?: Reserva; error?: string } => {
      const cancha = state.canchas.find((c) => c.id === input.canchaId);
      if (!cancha) return { ok: false, error: 'Cancha no encontrada' };

      const avail = isSlotAvailable(
        state,
        input.canchaId,
        input.fecha,
        input.horaInicio,
        input.duracionMin
      );
      if (!avail.available) {
        return { ok: false, error: avail.reason || 'Horario no disponible' };
      }

      const totals = calculateBookingTotals(
        cancha,
        input.horaInicio,
        input.duracionMin,
        state.serviceFeePct,
        false,
        input.fecha
      );
      if (!totals.tarifaValida || totals.totalPagado <= 0) {
        return {
          ok: false,
          error: 'Esta cancha requiere una tarifa válida mayor a B/. 0.00.',
        };
      }
      if (!input.metodoPago) {
        return {
          ok: false,
          error: 'Selecciona una modalidad de pago de ejemplo.',
        };
      }

      const isPending = input.pendingApproval ?? (input.tipoOrigen !== 'Manual Admin');
      const userId = input.usuarioIdOverride || state.currentUserId;
      const code = `TCP-${Math.floor(2500 + Math.random() * 7000)}`;

      const newRes: Reserva = {
        id: `res_${Date.now()}`,
        codigo: code,
        sedeId: input.sedeId,
        canchaId: input.canchaId,
        usuarioId: userId,
        fecha: input.fecha,
        horaInicio: input.horaInicio,
        duracionMin: input.duracionMin,
        modalidad: input.modalidad,
        participantes: input.participantes.length > 0 ? input.participantes : [currentUser.nombre],
        estado: isPending ? 'Pendiente de aprobación' : 'Confirmada',
        asistenciaValidada: false,
        precioCancha: totals.precioCancha,
        cargoServicio: totals.cargoServicio,
        totalPagado: totals.totalPagado,
        metodoPago: input.metodoPago,
        pagoEstado: isPending ? 'Pendiente de aprobación' : 'Aprobado',
        comprobante: input.comprobante,
        creadaEn: new Date().toISOString(),
        tipoOrigen: input.tipoOrigen || 'Jugador',
        notas: isPending
          ? 'Comprobante de ejemplo enviado. Pendiente de aprobación por el administrador.'
          : undefined,
      };

      const sede = state.sedes.find((s) => s.id === input.sedeId);

      setState((prev) => ({
        ...prev,
        reservas: [newRes, ...prev.reservas],
        notificaciones: [
          {
            id: `not_${Date.now()}`,
            usuarioId: userId,
            titulo: isPending
              ? `Comprobante enviado · ${code}`
              : `Reserva confirmada · ${code}`,
            mensaje: isPending
              ? `${cancha.nombre} en ${sede?.nombre || 'Sede'} quedó pendiente de aprobación.`
              : `${cancha.nombre} en ${sede?.nombre || 'Sede'} el ${input.fecha} a las ${formatHour12(input.horaInicio)}.`,
            categoria: 'Reserva',
            leida: false,
            fechaTexto: 'Ahora',
          },
          ...prev.notificaciones,
        ],
      }));
      return { ok: true, reserva: newRes };
    },
    [state, currentUser]
  );

  const reviewReservationPayment = useCallback(
    (reservaId: string, approve: boolean, motivoRechazo?: string) => {
      setState((prev) => {
        const target = prev.reservas.find((r) => r.id === reservaId);
        if (!target) return prev;
        const cancha = prev.canchas.find((c) => c.id === target.canchaId);
        const sede = prev.sedes.find((s) => s.id === target.sedeId);

        return {
          ...prev,
          reservas: prev.reservas.map((r) =>
            r.id === reservaId
              ? {
                  ...r,
                  estado: approve ? 'Confirmada' : 'Rechazada',
                  pagoEstado: approve ? 'Aprobado' : 'Rechazado',
                  motivoRechazo: approve
                    ? undefined
                    : motivoRechazo || 'Comprobante de ejemplo rechazado en demostración.',
                  notas: approve
                    ? 'Pago manual aprobado por administración (demo).'
                    : 'Reserva rechazada en demostración; horario liberado.',
                }
              : r
          ),
          notificaciones: [
            {
              id: `not_${Date.now()}`,
              usuarioId: target.usuarioId,
              titulo: approve
                ? `¡Reserva confirmada! · ${target.codigo}`
                : `Comprobante rechazado · ${target.codigo}`,
              mensaje: approve
                ? `El administrador aprobó tu comprobante para ${cancha?.nombre || 'Cancha'} en ${sede?.nombre || 'Sede'}.`
                : motivoRechazo ||
                  `Tu comprobante para ${target.codigo} fue rechazado en esta simulación y el horario quedó libre.`,
              categoria: 'Reserva',
              leida: false,
              fechaTexto: 'Ahora',
            },
            ...prev.notificaciones,
          ],
        };
      });
      showToast(
        approve
          ? 'Comprobante aprobado: reserva confirmada al jugador'
          : 'Comprobante rechazado: horario liberado',
        approve ? 'success' : 'info'
      );
    },
    [showToast]
  );

  const cancelReservation = useCallback(
    (reservaId: string, byAdmin = false) => {
      setState((prev) => {
        const target = prev.reservas.find((r) => r.id === reservaId);
        if (!target) return prev;
        return {
          ...prev,
          reservas: prev.reservas.map((r) =>
            r.id === reservaId
              ? {
                  ...r,
                  estado: 'Cancelada',
                  notas: byAdmin
                    ? 'Cancelada desde administración (demo).'
                    : 'Cancelada por el jugador (demo).',
                }
              : r
          ),
          notificaciones: [
            {
              id: `not_${Date.now()}`,
              usuarioId: target.usuarioId,
              titulo: `Reserva cancelada · ${target.codigo}`,
              mensaje: 'Se liberó el turno en la agenda de demostración.',
              categoria: 'Reserva',
              leida: false,
              fechaTexto: 'Ahora',
            },
            ...prev.notificaciones,
          ],
        };
      });
      showToast('Reserva cancelada y horario liberado');
    },
    [showToast]
  );

  const rescheduleReservation = useCallback(
    (reservaId: string, nuevaFecha: string, nuevaHora: string): { ok: boolean; error?: string } => {
      const target = state.reservas.find((r) => r.id === reservaId);
      if (!target) return { ok: false, error: 'Reserva no encontrada' };

      const avail = isSlotAvailable(
        state,
        target.canchaId,
        nuevaFecha,
        nuevaHora,
        target.duracionMin,
        target.id
      );
      if (!avail.available) {
        return { ok: false, error: avail.reason || 'Nuevo horario no disponible' };
      }

      setState((prev) => ({
        ...prev,
        reservas: prev.reservas.map((r) =>
          r.id === reservaId ? { ...r, fecha: nuevaFecha, horaInicio: nuevaHora } : r
        ),
        notificaciones: [
          {
            id: `not_${Date.now()}`,
            usuarioId: target.usuarioId,
            titulo: `Reserva reprogramada · ${target.codigo}`,
            mensaje: `Nuevo horario: ${nuevaFecha} a las ${formatHour12(nuevaHora)}.`,
            categoria: 'Reserva',
            leida: false,
            fechaTexto: 'Ahora',
          },
          ...prev.notificaciones,
        ],
      }));
      showToast('Reserva reprogramada correctamente');
      return { ok: true };
    },
    [state, showToast]
  );

  const validateCheckInCode = useCallback(
    (codigo: string): { ok: boolean; message: string } => {
      const clean = codigo.trim().toUpperCase();
      const target = state.reservas.find((r) => r.codigo.toUpperCase() === clean);
      if (!target) {
        return { ok: false, message: `Código ${clean} no encontrado en la agenda.` };
      }
      if (target.estado === 'Cancelada' || target.estado === 'Rechazada') {
        return { ok: false, message: `La reserva ${clean} está ${target.estado.toLowerCase()}.` };
      }
      if (target.estado === 'Pendiente de aprobación') {
        return { ok: false, message: `La reserva ${clean} aún tiene comprobante pendiente de aprobación.` };
      }
      setState((prev) => ({
        ...prev,
        reservas: prev.reservas.map((r) =>
          r.id === target.id ? { ...r, asistenciaValidada: true, estado: 'En curso' } : r
        ),
      }));
      showToast(`Check-in validado para ${clean}`);
      return { ok: true, message: `Asistencia validada: ${target.participantes.join(', ')}` };
    },
    [state.reservas, showToast]
  );

  const toggleCourtStatus = useCallback(
    (canchaId: string) => {
      setState((prev) => {
        const cancha = prev.canchas.find((c) => c.id === canchaId);
        if (!cancha) return prev;
        const nextEstado = cancha.estado === 'Disponible' ? 'Bloqueada' : 'Disponible';
        return {
          ...prev,
          canchas: prev.canchas.map((c) =>
            c.id === canchaId
              ? {
                  ...c,
                  estado: nextEstado,
                  motivoBloqueo: nextEstado === 'Bloqueada' ? 'Bloqueo administrativo' : undefined,
                }
              : c
          ),
        };
      });
      showToast('Estado de cancha actualizado');
    },
    [showToast]
  );

  const updateCourtRates = useCallback(
    (
      canchaId: string,
      config: {
        precioHora: number;
        precioNocturno?: number;
        preciosPorDuracion?: Partial<Record<60 | 90 | 120, number>>;
        tarifasPersonalizadas?: TarifaRegla[];
      }
    ): { ok: boolean; error?: string } => {
      const cancha = state.canchas.find((c) => c.id === canchaId);
      if (!cancha) return { ok: false, error: 'Cancha no encontrada' };

      const validation = validateCourtRates(config);
      if (!validation.valid) {
        showToast(validation.error || 'Tarifa inválida', 'error');
        return { ok: false, error: validation.error };
      }

      setState((prev) => ({
        ...prev,
        canchas: prev.canchas.map((c) =>
          c.id === canchaId
            ? {
                ...c,
                precioHora: Number(config.precioHora.toFixed(2)),
                precioNocturno:
                  config.precioNocturno !== undefined
                    ? Number(config.precioNocturno.toFixed(2))
                    : undefined,
                preciosPorDuracion: config.preciosPorDuracion,
                tarifasPersonalizadas: config.tarifasPersonalizadas,
              }
            : c
        ),
      }));
      showToast(`Tarifas actualizadas para ${cancha.nombre}`);
      return { ok: true };
    },
    [state.canchas, showToast]
  );

  const createConvocatoria = useCallback(
    (input: {
      reservaId?: string;
      sedeId?: string;
      fecha?: string;
      horaInicio?: string;
      duracionMin?: number;
      titulo: string;
      nivel: SkillLevel;
      modalidad: Modality;
      cupoTotal: number;
      aportePorJugador: number;
      descripcion: string;
      aprobacionAutomatica: boolean;
      invitadosIds?: string[];
    }) => {
      const reserva = input.reservaId
        ? state.reservas.find((r) => r.id === input.reservaId)
        : undefined;

      const sedeId = reserva?.sedeId || input.sedeId || state.activeSedeId;
      const fecha = reserva?.fecha || input.fecha || '2026-11-28';
      const horaInicio = reserva?.horaInicio || input.horaInicio || '18:00';
      const duracionMin = reserva?.duracionMin || input.duracionMin || 90;

      const conv: Convocatoria = {
        id: `conv_${Date.now()}`,
        reservaId: reserva?.id,
        sedeId,
        canchaId: reserva?.canchaId,
        organizadorId: state.currentUserId,
        titulo: input.titulo,
        modalidad: input.modalidad,
        nivel: input.nivel,
        fecha,
        horaInicio,
        duracionMin,
        cupoTotal: input.cupoTotal,
        jugadoresIds: [state.currentUserId],
        invitadosIds: input.invitadosIds || [],
        pendientesAprobacionIds: [],
        aprobacionAutomatica: input.aprobacionAutomatica,
        aportePorJugador: input.aportePorJugador,
        descripcion: input.descripcion,
        estado: 'Abierta',
      };
      setState((prev) => ({
        ...prev,
        convocatorias: [conv, ...prev.convocatorias],
      }));
      showToast('Partido creado y publicado en Comunidad');
      return { ok: true, convocatoria: conv };
    },
    [state.reservas, state.activeSedeId, state.currentUserId, showToast]
  );

  const joinConvocatoria = useCallback(
    (convId: string): { ok: boolean; message: string } => {
      const conv = state.convocatorias.find((c) => c.id === convId);
      if (!conv) return { ok: false, message: 'Partido no encontrado' };

      const res = joinConvocatoriaLogic(conv, state.currentUserId);
      if (res.outcome === 'already') {
        return { ok: false, message: 'Ya participas o tienes solicitud pendiente en este partido.' };
      }
      if (res.outcome === 'full') {
        return { ok: false, message: 'Este partido ya completó todos sus cupos.' };
      }
      if (res.outcome === 'closed') {
        return { ok: false, message: 'Este partido ya fue cerrado.' };
      }

      setState((prev) => ({
        ...prev,
        convocatorias: prev.convocatorias.map((c) => (c.id === convId ? res.updated : c)),
        notificaciones: [
          {
            id: `not_${Date.now()}`,
            usuarioId: state.currentUserId,
            titulo:
              res.outcome === 'pending'
                ? 'Solicitud enviada al organizador'
                : 'Participación confirmada',
            mensaje: conv.titulo,
            categoria: 'Comunidad',
            leida: false,
            fechaTexto: 'Ahora',
          },
          ...prev.notificaciones,
        ],
      }));

      const msg =
        res.outcome === 'pending'
          ? 'Solicitud enviada para confirmar participante'
          : '¡Participación confirmada en el partido!';
      showToast(msg, 'success');
      return { ok: true, message: msg };
    },
    [state.convocatorias, state.currentUserId, showToast]
  );

  const inviteToConvocatoria = useCallback(
    (convId: string, userId: string) => {
      setState((prev) => ({
        ...prev,
        convocatorias: prev.convocatorias.map((c) => {
          if (c.id !== convId) return c;
          if (c.jugadoresIds.includes(userId) || c.invitadosIds.includes(userId)) return c;
          return {
            ...c,
            invitadosIds: [...c.invitadosIds, userId],
          };
        }),
      }));
      const targetUser = state.usuarios.find((u) => u.id === userId);
      showToast(`Invitación enviada a ${targetUser?.nombre || 'jugador'}`, 'info');
    },
    [state.usuarios, showToast]
  );

  const approvePendingPlayer = useCallback(
    (convId: string, userId: string, approve: boolean) => {
      setState((prev) => ({
        ...prev,
        convocatorias: prev.convocatorias.map((c) => {
          if (c.id !== convId) return c;
          const pending = c.pendientesAprobacionIds.filter((id) => id !== userId);
          const invited = c.invitadosIds.filter((id) => id !== userId);
          if (!approve) return { ...c, pendientesAprobacionIds: pending, invitadosIds: invited };
          if (c.jugadoresIds.includes(userId)) {
            return { ...c, pendientesAprobacionIds: pending, invitadosIds: invited };
          }
          const nextJ = [...c.jugadoresIds, userId];
          return {
            ...c,
            pendientesAprobacionIds: pending,
            invitadosIds: invited,
            jugadoresIds: nextJ,
            estado: nextJ.length >= c.cupoTotal ? 'Completa' : 'Abierta',
          };
        }),
      }));
      showToast(approve ? 'Participante confirmado en el partido' : 'Solicitud rechazada');
    },
    [showToast]
  );

  const leaveConvocatoria = useCallback(
    (convId: string) => {
      setState((prev) => ({
        ...prev,
        convocatorias: prev.convocatorias.map((c) => {
          if (c.id !== convId) return c;
          const nextJ = c.jugadoresIds.filter((id) => id !== prev.currentUserId);
          return {
            ...c,
            jugadoresIds: nextJ,
            estado: nextJ.length >= c.cupoTotal ? 'Completa' : 'Abierta',
          };
        }),
      }));
      showToast('Has salido del partido', 'info');
    },
    [showToast]
  );

  const bookClass = useCallback(
    (input: {
      instructorId: string;
      sedeId: string;
      canchaId: string;
      tipo: ClaseProgramada['tipo'];
      fecha: string;
      horaInicio: string;
      duracionMin: 60 | 90;
      metodoPago: PaymentMethod;
    }): { ok: boolean; error?: string } => {
      const courtCheck = isSlotAvailable(
        state,
        input.canchaId,
        input.fecha,
        input.horaInicio,
        input.duracionMin
      );
      if (!courtCheck.available) {
        return { ok: false, error: `Cancha ocupada: ${courtCheck.reason}` };
      }

      const instCheck = isInstructorAvailable(
        state,
        input.instructorId,
        input.fecha,
        input.horaInicio,
        input.duracionMin
      );
      if (!instCheck.available) {
        return { ok: false, error: instCheck.reason || 'Instructor ocupado en ese horario' };
      }

      const inst = state.instructores.find((i) => i.id === input.instructorId);
      if (!inst) return { ok: false, error: 'Instructor no encontrado' };

      const cupoMax = input.tipo === 'Individual' ? 1 : input.tipo === 'Pareja' ? 2 : 6;
      const newClass: ClaseProgramada = {
        id: `cl_${Date.now()}`,
        sedeId: input.sedeId,
        canchaId: input.canchaId,
        instructorId: input.instructorId,
        titulo: `Clase ${input.tipo} · ${inst.nombre}`,
        tipo: input.tipo,
        fecha: input.fecha,
        horaInicio: input.horaInicio,
        duracionMin: input.duracionMin,
        precioPorCupo: inst.precioBase,
        cupoMax,
        alumnosIds: [state.currentUserId],
        asistenciaIds: [],
        estado: cupoMax === 1 ? 'Completa' : 'Abierta',
      };

      setState((prev) => ({
        ...prev,
        clases: [newClass, ...prev.clases],
        notificaciones: [
          {
            id: `not_${Date.now()}`,
            usuarioId: state.currentUserId,
            titulo: 'Clase reservada (demo)',
            mensaje: `${newClass.titulo} el ${input.fecha} a las ${formatHour12(input.horaInicio)}.`,
            categoria: 'Clase',
            leida: false,
            fechaTexto: 'Ahora',
          },
          ...prev.notificaciones,
        ],
      }));
      showToast('Clase registrada en demostración');
      return { ok: true };
    },
    [state, showToast]
  );

  const enrollInExistingClass = useCallback(
    (claseId: string) => {
      const cl = state.clases.find((c) => c.id === claseId);
      if (!cl) return { ok: false, message: 'Clase no encontrada' };
      if (cl.alumnosIds.includes(state.currentUserId)) {
        return { ok: false, message: 'Ya estás inscrito en esta clase' };
      }
      if (cl.alumnosIds.length >= cl.cupoMax) {
        return { ok: false, message: 'Esta clase ya completó sus cupos' };
      }
      setState((prev) => ({
        ...prev,
        clases: prev.clases.map((c) => {
          if (c.id !== claseId) return c;
          const nextAlumnos = [...c.alumnosIds, prev.currentUserId];
          return {
            ...c,
            alumnosIds: nextAlumnos,
            estado: nextAlumnos.length >= c.cupoMax ? 'Completa' : 'Abierta',
          };
        }),
      }));
      showToast('Inscripción a clase grupal confirmada');
      return { ok: true, message: 'Inscrito correctamente' };
    },
    [state.clases, state.currentUserId, showToast]
  );

  const toggleClassAttendance = useCallback((claseId: string, alumnoId: string) => {
    setState((prev) => ({
      ...prev,
      clases: prev.clases.map((c) => {
        if (c.id !== claseId) return c;
        const exists = c.asistenciaIds.includes(alumnoId);
        return {
          ...c,
          asistenciaIds: exists
            ? c.asistenciaIds.filter((id) => id !== alumnoId)
            : [...c.asistenciaIds, alumnoId],
        };
      }),
    }));
  }, []);

  const createInstructorClass = useCallback(
    (input: {
      sedeId: string;
      canchaId: string;
      titulo: string;
      tipo: ClaseProgramada['tipo'];
      fecha: string;
      horaInicio: string;
      duracionMin: 60 | 90;
      precioPorCupo: number;
      cupoMax: number;
    }): { ok: boolean; error?: string } => {
      const inst =
        state.instructores.find((i) => i.usuarioId === state.currentUserId) ||
        state.instructores[0];
      const avail = isSlotAvailable(state, input.canchaId, input.fecha, input.horaInicio, input.duracionMin);
      if (!avail.available) return { ok: false, error: avail.reason };
      const instAvail = isInstructorAvailable(state, inst.id, input.fecha, input.horaInicio, input.duracionMin);
      if (!instAvail.available) return { ok: false, error: instAvail.reason };

      const newCl: ClaseProgramada = {
        id: `cl_${Date.now()}`,
        sedeId: input.sedeId,
        canchaId: input.canchaId,
        instructorId: inst.id,
        titulo: input.titulo,
        tipo: input.tipo,
        fecha: input.fecha,
        horaInicio: input.horaInicio,
        duracionMin: input.duracionMin,
        precioPorCupo: input.precioPorCupo,
        cupoMax: input.cupoMax,
        alumnosIds: [],
        asistenciaIds: [],
        estado: 'Abierta',
      };
      setState((prev) => ({ ...prev, clases: [newCl, ...prev.clases] }));
      showToast('Nueva clase programada en agenda');
      return { ok: true };
    },
    [state, showToast]
  );

  const updateInstructorProfile = useCallback(
    (
      instructorId: string,
      patch: { precioBase?: number; especialidades?: string[]; horariosDisponibles?: string[] }
    ) => {
      setState((prev) => ({
        ...prev,
        instructores: prev.instructores.map((i) =>
          i.id === instructorId ? { ...i, ...patch } : i
        ),
      }));
      showToast('Horarios y perfil de instructor actualizados');
    },
    [showToast]
  );

  const sendAdminNotification = useCallback(
    (titulo: string, mensaje: string) => {
      setState((prev) => ({
        ...prev,
        notificaciones: [
          {
            id: `not_${Date.now()}`,
            usuarioId: 'ALL',
            titulo,
            mensaje,
            categoria: 'Sistema',
            leida: false,
            fechaTexto: 'Ahora',
          },
          ...prev.notificaciones,
        ],
      }));
      showToast('Aviso enviado en la demostración');
    },
    [showToast]
  );

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notificaciones: prev.notificaciones.map((n) => ({ ...n, leida: true })),
    }));
  }, []);

  const value: AppContextValue = {
    state,
    currentUser,
    activeSede,
    toast,
    whatsappDialog,
    showToast,
    openWhatsAppDemo,
    closeWhatsAppDemo,
    confirmWhatsAppDemo,
    loginDemo,
    registerDemoPlayer,
    logout,
    switchRole,
    switchSede,
    toggleFavoriteSede,
    updateUserPreferences,
    resetDemoData,
    createReservation,
    reviewReservationPayment,
    cancelReservation,
    rescheduleReservation,
    validateCheckInCode,
    toggleCourtStatus,
    updateCourtRates,
    createConvocatoria,
    joinConvocatoria,
    inviteToConvocatoria,
    approvePendingPlayer,
    leaveConvocatoria,
    bookClass,
    enrollInExistingClass,
    toggleClassAttendance,
    createInstructorClass,
    updateInstructorProfile,
    sendAdminNotification,
    markAllNotificationsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
