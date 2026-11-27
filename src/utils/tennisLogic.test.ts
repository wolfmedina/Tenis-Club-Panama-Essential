import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBookingTotals,
  computeAdminMetrics,
  isInstructorAvailable,
  isSlotAvailable,
  joinConvocatoriaLogic,
  validateCourtRates,
} from './tennisLogic';
import type {
  Cancha,
  ClaseProgramada,
  Convocatoria,
  Instructor,
  Reserva,
} from '../types/tennis';

const sampleCourt: Cancha = {
  id: 'c1',
  sedeId: 's1',
  nombre: 'Cancha Privada 1',
  superficie: 'Dura (Hard Court)',
  iluminacion: true,
  techada: false,
  precioHora: 25,
  precioNocturno: 30,
  capacidadMax: 4,
  estado: 'Disponible',
};

const samplePublicCourt: Cancha = {
  ...sampleCourt,
  id: 'c2',
  nombre: 'Cancha Municipal 1',
  precioHora: 8,
  precioNocturno: 12,
};

test('Essential 2K: rates calculation and slot locking with pending/confirmed/rejected reservations', () => {
  const invalidZeroCourt: Cancha = { ...samplePublicCourt, precioHora: 0, precioNocturno: 0 };
  const invalidTotals = calculateBookingTotals(invalidZeroCourt, '09:00', 60, 5);
  assert.equal(invalidTotals.tarifaValida, false);
  assert.equal(invalidTotals.totalPagado, 0);

  assert.equal(validateCourtRates({ precioHora: 0 }).valid, false);
  assert.equal(validateCourtRates({ precioHora: 8, precioNocturno: 12 }).valid, true);

  const publicDay = calculateBookingTotals(samplePublicCourt, '09:00', 60, 5, false, '2026-11-27');
  assert.equal(publicDay.tarifaValida, true);
  assert.equal(publicDay.precioCancha, 8);
  assert.equal(publicDay.totalPagado, 8.4);

  const rejectedRes: Reserva = {
    id: 'r_rej',
    codigo: 'TCP-100',
    sedeId: 's1',
    canchaId: 'c1',
    usuarioId: 'u1',
    fecha: '2026-11-27',
    horaInicio: '15:00',
    duracionMin: 60,
    modalidad: 'Individual',
    participantes: ['Julio Solórzano'],
    estado: 'Rechazada',
    asistenciaValidada: false,
    precioCancha: 25,
    cargoServicio: 1.25,
    totalPagado: 26.25,
    metodoPago: 'Transferencia bancaria (Ejemplo)',
    pagoEstado: 'Rechazado',
    creadaEn: '2026-11-26',
    tipoOrigen: 'Jugador',
  };

  assert.equal(
    isSlotAvailable({ canchas: [sampleCourt], reservas: [rejectedRes], clases: [] }, 'c1', '2026-11-27', '15:00', 60).available,
    true
  );

  const pendingRes: Reserva = {
    ...rejectedRes,
    id: 'r_pend',
    estado: 'Pendiente de aprobación',
    pagoEstado: 'Pendiente de aprobación',
  };
  assert.equal(
    isSlotAvailable({ canchas: [sampleCourt], reservas: [pendingRes], clases: [] }, 'c1', '2026-11-27', '15:00', 60).available,
    false
  );
});

test('Essential 2K: open match convocatoria closes at capacity', () => {
  const conv: Convocatoria = {
    id: 'conv1',
    reservaId: 'r1',
    sedeId: 's1',
    canchaId: 'c1',
    organizadorId: 'u1',
    titulo: 'Dobles intermedio',
    modalidad: 'Dobles',
    nivel: 'Intermedio',
    fecha: '2026-11-27',
    horaInicio: '19:30',
    duracionMin: 90,
    cupoTotal: 4,
    jugadoresIds: ['u1', 'u2'],
    invitadosIds: ['u3'],
    pendientesAprobacionIds: [],
    aprobacionAutomatica: true,
    aportePorJugador: 8,
    descripcion: 'Partido amistoso',
    estado: 'Abierta',
  };

  const r3 = joinConvocatoriaLogic(conv, 'u3');
  assert.equal(r3.outcome, 'joined');
  assert.equal(r3.updated.jugadoresIds.length, 3);
  assert.equal(r3.updated.invitadosIds.length, 0);

  const r4 = joinConvocatoriaLogic(r3.updated, 'u4');
  assert.equal(r4.outcome, 'joined');
  assert.equal(r4.updated.estado, 'Completa');

  const r5 = joinConvocatoriaLogic(r4.updated, 'u5');
  assert.equal(r5.outcome, 'full');
});

test('Essential 2K: class booking checks both court and instructor', () => {
  const inst: Instructor = {
    id: 'inst1',
    usuarioId: 'uInst1',
    nombre: 'Carlos Méndez',
    titulo: 'Head Coach',
    sedePrincipalId: 's1',
    sedesAutorizadas: ['s1'],
    especialidades: ['Técnica'],
    certificaciones: ['ITF'],
    tiposClase: ['Privadas'],
    precioBase: 35,
    rating: 4.9,
    resenasCount: 10,
    disponibleHoy: true,
    proximaSlotTexto: 'Hoy',
    verificado: true,
    avatarSeed: 'cm',
    horariosDisponibles: ['16:00'],
  };
  const clases: ClaseProgramada[] = [
    {
      id: 'cl1',
      sedeId: 's1',
      canchaId: 'c1',
      instructorId: 'inst1',
      titulo: 'Clase Técnica',
      tipo: 'Individual',
      fecha: '2026-11-27',
      horaInicio: '16:00',
      duracionMin: 60,
      precioPorCupo: 35,
      cupoMax: 1,
      alumnosIds: ['u1'],
      asistenciaIds: [],
      estado: 'Completa',
    },
  ];

  assert.equal(
    isSlotAvailable({ canchas: [sampleCourt], reservas: [], clases }, 'c1', '2026-11-27', '16:00', 60).available,
    false
  );
  assert.equal(
    isInstructorAvailable({ instructores: [inst], clases }, 'inst1', '2026-11-27', '16:00', 60).available,
    false
  );
});

test('Essential 2K: admin metrics count approved and pending reservations', () => {
  const reservas: Reserva[] = [
    {
      id: 'r1',
      codigo: 'A1',
      sedeId: 's1',
      canchaId: 'c1',
      usuarioId: 'u1',
      fecha: '2026-11-27',
      horaInicio: '08:00',
      duracionMin: 60,
      modalidad: 'Individual',
      participantes: ['A', 'B'],
      estado: 'Confirmada',
      asistenciaValidada: false,
      precioCancha: 25,
      cargoServicio: 1.25,
      totalPagado: 26.25,
      metodoPago: 'Transferencia bancaria (Ejemplo)',
      pagoEstado: 'Aprobado',
      creadaEn: '2026-11-26',
      tipoOrigen: 'Jugador',
    },
    {
      id: 'r2',
      codigo: 'A2',
      sedeId: 's1',
      canchaId: 'c1',
      usuarioId: 'u1',
      fecha: '2026-11-27',
      horaInicio: '10:30',
      duracionMin: 60,
      modalidad: 'Individual',
      participantes: ['A'],
      estado: 'Pendiente de aprobación',
      asistenciaValidada: false,
      precioCancha: 25,
      cargoServicio: 1.25,
      totalPagado: 26.25,
      metodoPago: 'Transferencia bancaria (Ejemplo)',
      pagoEstado: 'Pendiente de aprobación',
      creadaEn: '2026-11-26',
      tipoOrigen: 'Jugador',
    },
  ];
  const m1 = computeAdminMetrics({ reservas, canchas: [sampleCourt], clases: [] }, 's1', '2026-11-27');
  assert.equal(m1.ingresosHoy, 25);
  assert.equal(m1.reservasHoy, 1);
  assert.equal(m1.pendientesAprobacion, 1);
});
