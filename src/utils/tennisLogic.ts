import type {
  AppState,
  Cancha,
  Convocatoria,
  TarifaRegla,
} from '../types/tennis';

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatHour12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'p. m.' : 'a. m.';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function intervalsOverlap(
  startA: number,
  durA: number,
  startB: number,
  durB: number
): boolean {
  const endA = startA + durA;
  const endB = startB + durB;
  return startA < endB && startB < endA;
}

/**
 * Checks whether a court slot is free of maintenance,
 * active/pending reservations, and scheduled classes.
 */
export function isSlotAvailable(
  state: Pick<AppState, 'canchas' | 'reservas' | 'clases'>,
  canchaId: string,
  fecha: string,
  horaInicio: string,
  duracionMin: number,
  excludeReservaId?: string
): { available: boolean; reason?: string } {
  const cancha = state.canchas.find((c) => c.id === canchaId);
  if (!cancha) return { available: false, reason: 'Cancha no encontrada' };
  if (cancha.estado === 'Bloqueada' || cancha.estado === 'Mantenimiento') {
    return {
      available: false,
      reason: cancha.motivoBloqueo || `Cancha ${cancha.estado.toLowerCase()}`,
    };
  }

  const reqStart = timeToMinutes(horaInicio);

  const blockingStatuses = new Set(['Confirmada', 'En curso', 'Finalizada', 'Pendiente de aprobación']);
  const conflictingRes = state.reservas.find(
    (r) =>
      r.id !== excludeReservaId &&
      r.canchaId === canchaId &&
      r.fecha === fecha &&
      r.pagoEstado !== 'Rechazado' &&
      blockingStatuses.has(r.estado) &&
      intervalsOverlap(reqStart, duracionMin, timeToMinutes(r.horaInicio), r.duracionMin)
  );
  if (conflictingRes) {
    return {
      available: false,
      reason:
        conflictingRes.estado === 'Pendiente de aprobación'
          ? 'En revisión de comprobante'
          : 'Horario ya reservado',
    };
  }

  const conflictingClass = state.clases.find(
    (cl) =>
      cl.canchaId === canchaId &&
      cl.fecha === fecha &&
      cl.estado !== 'Cancelada' &&
      intervalsOverlap(reqStart, duracionMin, timeToMinutes(cl.horaInicio), cl.duracionMin)
  );
  if (conflictingClass) {
    return { available: false, reason: `Ocupada por clase (${conflictingClass.titulo})` };
  }

  return { available: true };
}

export function isInstructorAvailable(
  state: Pick<AppState, 'instructores' | 'clases'>,
  instructorId: string,
  fecha: string,
  horaInicio: string,
  duracionMin: number
): { available: boolean; reason?: string } {
  const inst = state.instructores.find((i) => i.id === instructorId);
  if (!inst) return { available: false, reason: 'Instructor no encontrado' };

  const reqStart = timeToMinutes(horaInicio);
  const conflict = state.clases.find(
    (cl) =>
      cl.instructorId === instructorId &&
      cl.fecha === fecha &&
      cl.estado !== 'Cancelada' &&
      intervalsOverlap(reqStart, duracionMin, timeToMinutes(cl.horaInicio), cl.duracionMin)
  );
  if (conflict) {
    return { available: false, reason: `Instructor ocupado (${conflict.titulo})` };
  }
  return { available: true };
}

export function isWeekendISO(fechaISO?: string): boolean {
  if (!fechaISO) return false;
  const parsed = new Date(`${fechaISO}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  const day = parsed.getUTCDay();
  return day === 0 || day === 6;
}

export function validateCourtRates(input: {
  precioHora: number;
  precioNocturno?: number;
  preciosPorDuracion?: Partial<Record<60 | 90 | 120, number>>;
  tarifasPersonalizadas?: TarifaRegla[];
}): { valid: boolean; error?: string } {
  if (!Number.isFinite(input.precioHora) || input.precioHora <= 0) {
    return {
      valid: false,
      error: 'La tarifa base por hora debe ser mayor a B/. 0.00.',
    };
  }
  if (
    input.precioNocturno !== undefined &&
    (!Number.isFinite(input.precioNocturno) || input.precioNocturno <= 0)
  ) {
    return {
      valid: false,
      error: 'La tarifa nocturna debe ser mayor a B/. 0.00.',
    };
  }
  if (input.preciosPorDuracion) {
    for (const [dur, price] of Object.entries(input.preciosPorDuracion)) {
      if (price !== undefined && (!Number.isFinite(price) || price <= 0)) {
        return {
          valid: false,
          error: `La tarifa para ${dur} min debe ser mayor a B/. 0.00.`,
        };
      }
    }
  }
  if (input.tarifasPersonalizadas) {
    for (const regla of input.tarifasPersonalizadas) {
      if (!Number.isFinite(regla.precioHora) || regla.precioHora <= 0) {
        return {
          valid: false,
          error: 'Todas las reglas de tarifa deben tener un monto mayor a B/. 0.00.',
        };
      }
      if (timeToMinutes(regla.horaDesde) >= timeToMinutes(regla.horaHasta)) {
        return {
          valid: false,
          error: 'La hora inicial de cada regla debe ser anterior a la hora final.',
        };
      }
    }
  }
  return { valid: true };
}

export function resolveCourtRate(
  cancha: Pick<
    Cancha,
    'precioHora' | 'precioNocturno' | 'preciosPorDuracion' | 'tarifasPersonalizadas'
  >,
  horaInicio: string,
  duracionMin: number,
  fecha?: string
): {
  ratePerHour: number;
  fixedDurationTotal?: number;
  tarifaValida: boolean;
} {
  if (!Number.isFinite(cancha.precioHora) || cancha.precioHora <= 0) {
    return { ratePerHour: 0, tarifaValida: false };
  }

  const reqMinutes = timeToMinutes(horaInicio);
  const weekend = isWeekendISO(fecha);

  if (cancha.tarifasPersonalizadas && cancha.tarifasPersonalizadas.length > 0) {
    const matchingRules = cancha.tarifasPersonalizadas.filter((r) => {
      const dayMatch =
        r.dias === 'Todos' ||
        (r.dias === 'Fines de semana' && weekend) ||
        (r.dias === 'Lun-Vie' && !weekend);
      const timeMatch =
        reqMinutes >= timeToMinutes(r.horaDesde) &&
        reqMinutes < timeToMinutes(r.horaHasta);
      const durMatch = r.duracionMin === undefined || r.duracionMin === duracionMin;
      return dayMatch && timeMatch && durMatch;
    });

    if (matchingRules.length > 0) {
      const sorted = [...matchingRules].sort((a, b) => {
        const scoreA = (a.duracionMin ? 2 : 0) + (a.dias !== 'Todos' ? 1 : 0);
        const scoreB = (b.duracionMin ? 2 : 0) + (b.dias !== 'Todos' ? 1 : 0);
        return scoreB - scoreA;
      });
      const topRule = sorted[0];
      if (!Number.isFinite(topRule.precioHora) || topRule.precioHora <= 0) {
        return { ratePerHour: 0, tarifaValida: false };
      }
      return { ratePerHour: topRule.precioHora, tarifaValida: true };
    }
  }

  const hour = Number(horaInicio.split(':')[0] || 0);
  if (hour >= 18 && cancha.precioNocturno !== undefined) {
    if (!Number.isFinite(cancha.precioNocturno) || cancha.precioNocturno <= 0) {
      return { ratePerHour: 0, tarifaValida: false };
    }
    return { ratePerHour: cancha.precioNocturno, tarifaValida: true };
  }

  const durKey = duracionMin as 60 | 90 | 120;
  const fixedForDuration = cancha.preciosPorDuracion?.[durKey];
  if (fixedForDuration !== undefined) {
    if (!Number.isFinite(fixedForDuration) || fixedForDuration <= 0) {
      return { ratePerHour: 0, tarifaValida: false };
    }
    return {
      ratePerHour: Number((fixedForDuration / (duracionMin / 60)).toFixed(2)),
      fixedDurationTotal: fixedForDuration,
      tarifaValida: true,
    };
  }

  return { ratePerHour: cancha.precioHora, tarifaValida: true };
}

export function calculateBookingTotals(
  cancha: Pick<
    Cancha,
    'precioHora' | 'precioNocturno' | 'preciosPorDuracion' | 'tarifasPersonalizadas'
  >,
  horaInicio: string,
  duracionMin: number,
  serviceFeePct: number,
  isResidentDiscount = false,
  fecha?: string
): {
  precioCancha: number;
  cargoServicio: number;
  totalPagado: number;
  tarifaHoraAplicada: number;
  tarifaValida: boolean;
} {
  const resolved = resolveCourtRate(cancha, horaInicio, duracionMin, fecha);
  if (!resolved.tarifaValida || resolved.ratePerHour <= 0) {
    return {
      precioCancha: 0,
      cargoServicio: 0,
      totalPagado: 0,
      tarifaHoraAplicada: 0,
      tarifaValida: false,
    };
  }

  const multiplier = duracionMin / 60;
  let precioCancha =
    resolved.fixedDurationTotal !== undefined
      ? Number(resolved.fixedDurationTotal.toFixed(2))
      : Number((resolved.ratePerHour * multiplier).toFixed(2));
  if (isResidentDiscount) {
    precioCancha = Number((precioCancha * 0.8).toFixed(2));
  }
  const cargoServicio = Number(((precioCancha * serviceFeePct) / 100).toFixed(2));
  const totalPagado = Number((precioCancha + cargoServicio).toFixed(2));
  return {
    precioCancha,
    cargoServicio,
    totalPagado,
    tarifaHoraAplicada: resolved.ratePerHour,
    tarifaValida: precioCancha > 0 && totalPagado > 0,
  };
}

/**
 * Joins an open match convocatoria, closing automatically when cupoTotal is reached.
 */
export function joinConvocatoriaLogic(
  conv: Convocatoria,
  userId: string
): { updated: Convocatoria; outcome: 'joined' | 'full' | 'pending' | 'already' | 'closed' } {
  if (conv.estado === 'Cancelada' || conv.estado === 'Cerrada') {
    return { updated: conv, outcome: 'closed' };
  }
  if (
    conv.jugadoresIds.includes(userId) ||
    conv.pendientesAprobacionIds.includes(userId)
  ) {
    return { updated: conv, outcome: 'already' };
  }

  if (conv.jugadoresIds.length >= conv.cupoTotal || conv.estado === 'Completa') {
    return {
      updated: { ...conv, estado: 'Completa' },
      outcome: 'full',
    };
  }

  if (!conv.aprobacionAutomatica) {
    return {
      updated: {
        ...conv,
        pendientesAprobacionIds: [...conv.pendientesAprobacionIds, userId],
        invitadosIds: conv.invitadosIds.filter((id) => id !== userId),
      },
      outcome: 'pending',
    };
  }

  const nextJugadores = [...conv.jugadoresIds, userId];
  const isNowFull = nextJugadores.length >= conv.cupoTotal;

  return {
    updated: {
      ...conv,
      jugadoresIds: nextJugadores,
      invitadosIds: conv.invitadosIds.filter((id) => id !== userId),
      estado: isNowFull ? 'Completa' : 'Abierta',
    },
    outcome: 'joined',
  };
}

export function computeAdminMetrics(
  state: Pick<AppState, 'reservas' | 'canchas' | 'clases'>,
  sedeId: string,
  fecha: string
) {
  const sedeReservas = state.reservas.filter((r) => r.sedeId === sedeId && r.fecha === fecha);
  const activeReservas = sedeReservas.filter(
    (r) =>
      r.pagoEstado === 'Aprobado' &&
      r.estado !== 'Cancelada' &&
      r.estado !== 'Rechazada'
  );
  const pendingApprovalCount = state.reservas.filter(
    (r) => r.sedeId === sedeId && r.estado === 'Pendiente de aprobación'
  ).length;
  const ingresosHoy = activeReservas.reduce((sum, r) => sum + r.precioCancha, 0);
  const sedeClases = state.clases.filter(
    (cl) => cl.sedeId === sedeId && cl.fecha === fecha && cl.estado !== 'Cancelada'
  );
  const clasesIngresos = sedeClases.reduce(
    (sum, cl) => sum + cl.precioPorCupo * cl.alumnosIds.length,
    0
  );

  const sedeCanchas = state.canchas.filter((c) => c.sedeId === sedeId);
  const maxDailySlots = Math.max(1, sedeCanchas.length * 8);
  const usedSlots = activeReservas.length + sedeClases.length;
  const ocupacionPct = Math.min(100, Math.round((usedSlots / maxDailySlots) * 100));

  return {
    ingresosHoy: Number((ingresosHoy + clasesIngresos).toFixed(2)),
    reservasHoy: activeReservas.length,
    pendientesAprobacion: pendingApprovalCount,
    clasesHoy: sedeClases.length,
    alumnosHoy: sedeClases.reduce((sum, c) => sum + c.alumnosIds.length, 0),
    ocupacionPct,
  };
}
