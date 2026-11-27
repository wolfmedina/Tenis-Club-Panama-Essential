import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  Hourglass,
  MapPin,
  MessageCircle,
  Plus,
  QrCode,
  RefreshCw,
  Share2,
  Users,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { DEMO_DATES, TIME_SLOTS } from '../../../data/seedData';
import type { Reserva } from '../../../types/tennis';
import { formatHour12, isSlotAvailable } from '../../../utils/tennisLogic';
import { HeaderBar } from '../../HeaderBar';
import { DemoQRCode, PlayerAvatar } from '../../VisualAssets';

interface MyBookingsViewProps {
  initialReservaId?: string;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onExploreCourts: () => void;
  onPublishOpenMatch: (reservaId: string) => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  initialReservaId,
  onOpenMenu,
  onOpenNotifications,
  onExploreCourts,
  onPublishOpenMatch,
}) => {
  const {
    state,
    currentUser,
    cancelReservation,
    rescheduleReservation,
    switchRole,
    openWhatsAppDemo,
  } = useApp();
  const [tab, setTab] = useState<'proximas' | 'anteriores' | 'canceladas'>('proximas');
  const [expandedId, setExpandedId] = useState<string | null>(initialReservaId || null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Reserva | null>(null);
  const [newDate, setNewDate] = useState(DEMO_DATES[1].iso);
  const [newTime, setNewTime] = useState('09:00');
  const [rescheduleError, setRescheduleError] = useState('');

  const myReservas = useMemo(() => {
    return state.reservas.filter((r) => r.usuarioId === currentUser.id);
  }, [state.reservas, currentUser.id]);

  const filtered = useMemo(() => {
    if (tab === 'proximas') {
      return myReservas.filter(
        (r) =>
          r.estado === 'Pendiente de aprobación' ||
          r.estado === 'Confirmada' ||
          r.estado === 'En curso'
      );
    }
    if (tab === 'anteriores') {
      return myReservas.filter((r) => r.estado === 'Finalizada');
    }
    return myReservas.filter((r) => r.estado === 'Cancelada' || r.estado === 'Rechazada');
  }, [myReservas, tab]);

  const handleConfirmReschedule = () => {
    if (!rescheduleTarget) return;
    setRescheduleError('');
    const res = rescheduleReservation(rescheduleTarget.id, newDate, newTime);
    if (!res.ok) {
      setRescheduleError(res.error || 'No se pudo reprogramar.');
      return;
    }
    setRescheduleTarget(null);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        variant="lines"
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
      >
        <div className="pb-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Mis reservas</h1>
              <p className="text-xs text-white/80">
                Estados de comprobante, confirmación y QR de acceso
              </p>
            </div>
            <button
              type="button"
              onClick={onExploreCourts}
              className="rounded-xl bg-[#B6E22E] px-3 py-2 text-xs font-extrabold text-[#16223B] inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Reservar
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5 bg-white/10 p-1 rounded-2xl">
            {(
              [
                ['proximas', 'Activas'],
                ['anteriores', 'Anteriores'],
                ['canceladas', 'Canceladas'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tab === k ? 'bg-[#B6E22E] text-[#16223B]' : 'text-white/90 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </HeaderBar>

      <div className="flex-1 p-4 space-y-3 pb-8">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
            <Calendar className="w-9 h-9 text-slate-300 mx-auto" />
            <p className="mt-2 text-sm font-bold text-[#1E2B45]">
              No tienes reservas en esta sección
            </p>
            <button
              type="button"
              onClick={onExploreCourts}
              className="mt-3 rounded-xl bg-[#B6E22E] px-4 py-2 text-xs font-extrabold text-[#16223B] cursor-pointer"
            >
              Buscar cancha disponible
            </button>
          </div>
        ) : (
          filtered.map((res) => {
            const sede = state.sedes.find((s) => s.id === res.sedeId);
            const cancha = state.canchas.find((c) => c.id === res.canchaId);
            const isExpanded = expandedId === res.id;
            const dateLabel = DEMO_DATES.find((d) => d.iso === res.fecha)?.label || res.fecha;
            const isPending = res.estado === 'Pendiente de aprobación';
            const isRejected = res.estado === 'Rechazada' || res.estado === 'Cancelada';

            return (
              <div
                key={res.id}
                className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                      <span className="font-mono text-[#273758]">{res.codigo}</span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isRejected
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-[#ECFCCB] text-[#4E7006]'
                        }`}
                      >
                        {res.estado}
                      </span>
                      {res.asistenciaValidada && (
                        <span className="text-[#4E7006]">· Check-in OK</span>
                      )}
                    </div>
                    <h2 className="mt-1 text-sm font-extrabold text-[#1E2B45]">
                      {cancha?.nombre} – {sede?.nombre}
                    </h2>
                    <p className="mt-1 text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sede?.distrito}</span>
                      <span aria-hidden="true">·</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="tabular-nums">
                        {dateLabel}, {formatHour12(res.horaInicio)} ({res.duracionMin} min)
                      </span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-[#273758] tabular-nums block">
                      {`B/. ${res.totalPagado.toFixed(2)}`}
                    </span>
                    <span className="text-[10.5px] font-semibold text-slate-500">
                      {res.pagoEstado}
                    </span>
                  </div>
                </div>

                {res.comprobante && (
                  <div className="rounded-xl bg-[#F4F6F9] px-3 py-2 text-[11px] text-slate-600 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <FileCheck2 className="w-3.5 h-3.5 text-[#5E8210] shrink-0" />
                      <span className="truncate">
                        Comprobante: <strong>{res.comprobante.referencia}</strong> (
                        {res.comprobante.archivoNombre})
                      </span>
                    </span>
                  </div>
                )}

                {res.motivoRechazo && (
                  <p className="rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
                    Motivo: {res.motivoRechazo}
                  </p>
                )}

                {res.notas && !res.motivoRechazo && (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                    {res.notas}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : res.id)}
                    className="rounded-xl bg-[#F4F6F9] hover:bg-slate-200 px-3 py-2 text-xs font-bold text-[#1E2B45] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    {isExpanded ? 'Ocultar detalle' : isPending ? 'Ver comprobante' : 'Comprobante y QR'}
                  </button>

                  {isPending && (
                    <button
                      type="button"
                      onClick={() => switchRole('admin')}
                      className="rounded-xl bg-[#B6E22E] hover:bg-[#ACD638] px-3 py-2 text-xs font-extrabold text-[#16223B] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Hourglass className="w-3.5 h-3.5" />
                      Simular revisión Admin
                    </button>
                  )}

                  {res.estado === 'Confirmada' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onPublishOpenMatch(res.id)}
                        className="rounded-xl bg-[#B6E22E] hover:bg-[#ACD638] px-3 py-2 text-xs font-extrabold text-[#16223B] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Invitar jugadores
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleTarget(res);
                          setNewDate(res.fecha);
                          setNewTime(res.horaInicio);
                          setRescheduleError('');
                        }}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-[#273758] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reprogramar
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelReservation(res.id)}
                        className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      openWhatsAppDemo(
                        `Administración · ${sede?.nombre || 'Club'}`,
                        `Consulta sobre la reserva ${res.codigo} (${res.estado}).`,
                        'Atención por WhatsApp'
                      )
                    }
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp club
                  </button>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col items-center gap-3">
                    {isPending ? (
                      <div className="w-full rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-center space-y-1">
                        <Hourglass className="w-6 h-6 text-amber-600 mx-auto" />
                        <p className="text-xs font-extrabold text-amber-900">
                          QR bloqueado hasta aprobación del comprobante
                        </p>
                        <p className="text-[11px] text-amber-800">
                          Cambia al rol de Administrador para aprobar o rechazar esta solicitud en la
                          demostración.
                        </p>
                      </div>
                    ) : (
                      !isRejected && <DemoQRCode code={res.codigo} />
                    )}

                    <div className="w-full rounded-xl bg-[#F4F6F9] p-3 text-xs space-y-2">
                      <p className="font-bold text-[#1E2B45] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Participantes ({res.modalidad}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {res.participantes.map((part, idx) => {
                          const normPart = part.trim().toLowerCase();
                          const matched = state.usuarios.find(
                            (u) =>
                              u.nombre.toLowerCase() === normPart ||
                              u.nombre.toLowerCase().startsWith(`${normPart} `)
                          );
                          return (
                            <span
                              key={`${part}-${idx}`}
                              className="inline-flex items-center gap-1.5 rounded-full bg-white pl-1 pr-2.5 py-0.5 border border-slate-200 text-[11px] font-bold text-[#1E2B45]"
                            >
                              <PlayerAvatar
                                nombre={matched?.nombre || part}
                                seed={matched?.avatarSeed || part.split(' ')[0]}
                                avatarUrl={matched?.avatarUrl}
                                size="xs"
                              />
                              <span>{part}</span>
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-500 pt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#5E8210]" />
                        Política: cancelación sin penalidad hasta{' '}
                        {sede?.politicaCancelacionHoras || 12} h antes.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-[#1E2B45]">
              Reprogramar {rescheduleTarget.codigo}
            </h3>
            <p className="text-xs text-slate-500">
              Verificaremos disponibilidad en el nuevo horario antes de liberar el turno actual.
            </p>
            <div className="space-y-3">
              <div>
                <label htmlFor="resc-date" className="block text-xs font-bold text-[#1E2B45] mb-1">
                  Nueva fecha
                </label>
                <select
                  id="resc-date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-[#1E2B45]"
                >
                  {DEMO_DATES.map((d) => (
                    <option key={d.iso} value={d.iso}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">
                  Nuevo horario
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TIME_SLOTS.map((slot) => {
                    const check = isSlotAvailable(
                      state,
                      rescheduleTarget.canchaId,
                      newDate,
                      slot,
                      rescheduleTarget.duracionMin,
                      rescheduleTarget.id
                    );
                    const active = newTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!check.available}
                        onClick={() => setNewTime(slot)}
                        className={`rounded-xl py-2 text-[11px] font-bold tabular-nums ${
                          !check.available
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : active
                              ? 'bg-[#273758] text-white'
                              : 'bg-[#F4F6F9] text-[#1E2B45]'
                        }`}
                      >
                        {formatHour12(slot)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {rescheduleError && (
              <p className="text-xs font-semibold text-rose-600">{rescheduleError}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B] cursor-pointer"
              >
                Confirmar cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
