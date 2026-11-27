import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  Clock,
  FileCheck2,
  Hourglass,
  Landmark,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Upload,
  Users,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { DEMO_DATES } from '../../../data/seedData';
import type { Modality, PaymentMethod, Reserva } from '../../../types/tennis';
import {
  calculateBookingTotals,
  formatHour12,
  minutesToTime,
  timeToMinutes,
} from '../../../utils/tennisLogic';
import { HeaderBar } from '../../HeaderBar';
import { CourtScene, PlayerAvatar } from '../../VisualAssets';

interface BookingCheckoutViewProps {
  selection: {
    sedeId: string;
    canchaId: string;
    fecha: string;
    horaInicio: string;
    duracionMin: 60 | 90;
    modalidad: Modality;
  };
  onBack: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onDoneToBookings: () => void;
  onPublishOpenMatch: (reservaId: string) => void;
}

export const BookingCheckoutView: React.FC<BookingCheckoutViewProps> = ({
  selection,
  onBack,
  onOpenMenu,
  onOpenNotifications,
  onDoneToBookings,
}) => {
  const {
    state,
    currentUser,
    createReservation,
    switchRole,
    openWhatsAppDemo,
    showToast,
  } = useApp();
  const sede = state.sedes.find((s) => s.id === selection.sedeId)!;
  const cancha = state.canchas.find((c) => c.id === selection.canchaId)!;

  const totals = calculateBookingTotals(
    cancha,
    selection.horaInicio,
    selection.duracionMin,
    state.serviceFeePct,
    false,
    selection.fecha
  );

  const [metodo, setMetodo] = useState<PaymentMethod>('Transferencia bancaria (Ejemplo)');
  const [playersText, setPlayersText] = useState(
    selection.modalidad === 'Dobles'
      ? `${currentUser.nombre}, Ana, Miguel, Sofía`
      : `${currentUser.nombre}, Diego`
  );
  const [editingPlayers, setEditingPlayers] = useState(false);

  // Manual receipt demo state (in-memory only, no file storage or external upload)
  const [referencia, setReferencia] = useState('DEMO-2026-4812');
  const [archivoNombre, setArchivoNombre] = useState('comprobante_ejemplo.png');
  const [notaComprobante, setNotaComprobante] = useState('Comprobante simulado para demostración');
  const [submittedReserva, setSubmittedReserva] = useState<Reserva | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const endTime = minutesToTime(timeToMinutes(selection.horaInicio) + selection.duracionMin);
  const dateLabel =
    DEMO_DATES.find((d) => d.iso === selection.fecha)?.label || selection.fecha;

  const handleSampleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Solo leemos el nombre para fines demostrativos; no se guarda ni sube ningún archivo
    setArchivoNombre(file.name);
    showToast(`Archivo "${file.name}" cargado en vista previa (demo)`, 'info');
    e.target.value = '';
  };

  const handleSubmitReceipt = () => {
    setErrorMsg('');
    if (!referencia.trim() || !archivoNombre.trim()) {
      setErrorMsg('Ingresa una referencia y adjunta un comprobante de ejemplo.');
      return;
    }

    const participants = playersText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = createReservation({
      sedeId: sede.id,
      canchaId: cancha.id,
      fecha: selection.fecha,
      horaInicio: selection.horaInicio,
      duracionMin: selection.duracionMin,
      modalidad: selection.modalidad,
      participantes: participants,
      metodoPago: metodo,
      pendingApproval: true,
      comprobante: {
        referencia: referencia.trim(),
        archivoNombre: archivoNombre.trim(),
        fechaEnvio: 'Ahora (Demo)',
        nota: notaComprobante.trim() || undefined,
      },
    });

    if (!res.ok || !res.reserva) {
      setErrorMsg(res.error || 'No se pudo registrar la solicitud de reserva.');
      return;
    }

    setSubmittedReserva(res.reserva);
    showToast('Comprobante enviado: reserva pendiente de aprobación');
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        variant="lines"
        onBack={submittedReserva ? undefined : onBack}
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
      >
        <div className="pb-2">
          <h1 className="text-2xl font-extrabold text-white">
            {submittedReserva ? 'Reserva pendiente' : 'Pago manual y comprobante'}
          </h1>
          <p className="text-xs text-white/85 flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-[#ACD638]" />
            <span>
              {submittedReserva
                ? 'Tu comprobante de ejemplo espera validación del administrador'
                : 'Consulta el importe y presenta un comprobante demostrativo'}
            </span>
          </p>

          <div className="mt-3.5 flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-[#ACD638] text-[#16223B] flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <span className="text-white leading-tight">
                Seleccionar
                <br />
                cancha
              </span>
            </div>
            <span className="h-0.5 flex-1 mx-2 bg-[#ACD638]" />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  submittedReserva
                    ? 'bg-[#ACD638] text-[#16223B]'
                    : 'bg-[#ACD638] text-[#16223B] ring-4 ring-[#ACD638]/25'
                }`}
              >
                {submittedReserva ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
              </span>
              <span className="text-white leading-tight">
                Comprobante
                <br />
                manual
              </span>
            </div>
            <span
              className={`h-0.5 flex-1 mx-2 ${
                submittedReserva ? 'bg-[#ACD638]' : 'bg-white/25'
              }`}
            />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  submittedReserva
                    ? 'bg-[#ACD638] text-[#16223B] ring-4 ring-[#ACD638]/25'
                    : 'bg-white/20 text-white'
                }`}
              >
                3
              </span>
              <span className={submittedReserva ? 'text-white' : 'text-white/60'}>
                Aprobación
              </span>
            </div>
          </div>
        </div>
      </HeaderBar>

      <div className="flex-1 p-4 space-y-3.5 pb-8">
        {submittedReserva ? (
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Hourglass className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-block rounded-full bg-amber-100 px-3 py-0.5 text-[11px] font-extrabold text-amber-800">
                {submittedReserva.estado}
              </span>
              <h2 className="mt-2 text-lg font-extrabold text-[#1E2B45]">
                Comprobante enviado ({submittedReserva.codigo})
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                El administrador del club puede aprobar o rechazar este comprobante desde su panel
                para emitir la confirmación final.
              </p>
            </div>

            <div className="rounded-2xl bg-[#F4F6F9] p-3.5 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Instalación</span>
                <span className="font-bold text-[#1E2B45]">{sede.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cancha y turno</span>
                <span className="font-bold text-[#1E2B45] tabular-nums">
                  {cancha.nombre} · {dateLabel} · {formatHour12(submittedReserva.horaInicio)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Modalidad ejemplo</span>
                <span className="font-bold text-[#1E2B45]">{submittedReserva.metodoPago}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Referencia / Archivo</span>
                <span className="font-bold text-[#273758]">
                  {submittedReserva.comprobante?.referencia} ·{' '}
                  {submittedReserva.comprobante?.archivoNombre}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="font-bold text-[#1E2B45]">Importe reportado</span>
                <span className="font-extrabold text-[#273758] tabular-nums">
                  {`B/. ${submittedReserva.totalPagado.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => switchRole('admin')}
                className="w-full rounded-2xl bg-[#B6E22E] hover:bg-[#ACD638] py-3 text-sm font-extrabold text-[#16223B] cursor-pointer"
              >
                Simular revisión como Administrador
              </button>
              <button
                type="button"
                onClick={onDoneToBookings}
                className="w-full rounded-2xl bg-[#273758] py-3 text-sm font-bold text-white cursor-pointer"
              >
                Ir a Mis Reservas
              </button>
              <button
                type="button"
                onClick={() =>
                  openWhatsAppDemo(
                    `Administración · ${sede.nombre}`,
                    `Envío de comprobante de ejemplo ${submittedReserva.codigo} por B/. ${submittedReserva.totalPagado.toFixed(2)}.`,
                    'Confirmación de reserva'
                  )
                }
                className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-extrabold text-emerald-800 inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Avisar al club por WhatsApp (Demo)
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden flex border border-slate-100">
              <div className="w-[62%] p-3.5 space-y-1">
                <span className="text-[10.5px] font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> RESUMEN DE RESERVA
                </span>
                <h2 className="text-sm font-extrabold text-[#1E2B45] leading-snug">
                  {cancha.nombre} – {sede.nombre}
                </h2>
                <div className="text-[11.5px] text-slate-600 space-y-0.5 pt-1">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sede.nombre}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{dateLabel}</span>
                  </p>
                  <p className="flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {formatHour12(selection.horaInicio)} – {formatHour12(endTime)} (
                      {selection.duracionMin} min)
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selection.modalidad}</span>
                  </p>
                </div>
              </div>
              <div
                className="w-[42%] -ml-3 relative"
                style={{ clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)' }}
              >
                <CourtScene
                  sedeId={sede.id}
                  isPublic={sede.tipo === 'Pública'}
                  variant={sede.imagenVariant}
                  clubLabel={sede.nombre}
                  eager
                />
              </div>
            </div>

            {/* Players row */}
            <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#1E2B45] flex items-center gap-1.5 shrink-0">
                  <Users className="w-4 h-4 text-[#273758]" />
                  Jugadores
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  {!editingPlayers && (
                    <div className="flex items-center -space-x-1.5 shrink-0">
                      {playersText
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((part, idx) => {
                          const norm = part.toLowerCase();
                          const matched = state.usuarios.find(
                            (u) =>
                              u.nombre.toLowerCase() === norm ||
                              u.nombre.toLowerCase().startsWith(`${norm} `)
                          );
                          return (
                            <PlayerAvatar
                              key={`${part}-${idx}`}
                              nombre={matched?.nombre || part}
                              seed={matched?.avatarSeed || part.split(' ')[0]}
                              avatarUrl={matched?.avatarUrl}
                              size="xs"
                            />
                          );
                        })}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingPlayers((v) => !v)}
                    className="text-xs font-semibold text-[#273758] underline cursor-pointer truncate"
                  >
                    {editingPlayers ? 'Listo' : playersText}
                  </button>
                </div>
              </div>
              {editingPlayers && (
                <input
                  type="text"
                  value={playersText}
                  onChange={(e) => setPlayersText(e.target.value)}
                  aria-label="Nombres de participantes separados por coma"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#1E2B45]"
                />
              )}
            </div>

            {/* Importe Breakdown */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2.5">
              <h3 className="text-sm font-extrabold text-[#1E2B45]">Importe de la reserva</h3>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Tarifa de cancha ({selection.duracionMin} min)</span>
                <span className="font-bold text-[#1E2B45] tabular-nums">
                  B/. {totals.precioCancha.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Gestión demostrativa ({state.serviceFeePct}%)</span>
                <span className="font-bold text-[#1E2B45] tabular-nums">
                  B/. {totals.cargoServicio.toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#1E2B45]">Importe total</span>
                <span className="rounded-xl bg-[#B6E22E] px-3 py-1 text-sm font-extrabold text-[#16223B] tabular-nums">
                  {`B/. ${totals.totalPagado.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Example Payment Instructions */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#1E2B45]">
                  Instrucciones de pago (Ejemplo)
                </h3>
                <span className="text-[10.5px] font-bold text-[#5E8210] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Sin conexión bancaria
                </span>
              </div>

              <div className="space-y-1.5">
                {(
                  [
                    {
                      id: 'Transferencia bancaria (Ejemplo)',
                      title: 'Transferencia bancaria (Ejemplo)',
                      sub: 'Cuenta Corriente Demo · 04-00-000000-0 · Banco Ejemplo Panamá',
                      icon: Landmark,
                    },
                    {
                      id: 'Pago móvil en club (Ejemplo)',
                      title: 'Pago móvil / directorio en club (Ejemplo)',
                      sub: 'Alias de demostración: @TenisClubPanamaDemo',
                      icon: Building2,
                    },
                    {
                      id: 'Depósito manual (Ejemplo)',
                      title: 'Depósito o pago en recepción (Ejemplo)',
                      sub: 'Presenta comprobante de caja en esta pantalla demo',
                      icon: FileCheck2,
                    },
                  ] as const
                ).map((m) => {
                  const Icon = m.icon;
                  const active = metodo === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMetodo(m.id)}
                      className={`w-full rounded-xl p-3 flex items-center gap-3 text-left border transition cursor-pointer ${
                        active
                          ? 'border-[#ACD638] bg-[#F7FCEB]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          active ? 'border-[#6E9214]' : 'border-slate-300'
                        }`}
                      >
                        {active && <span className="w-2 h-2 rounded-full bg-[#6E9214]" />}
                      </span>
                      <Icon className="w-4 h-4 text-[#273758] shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-[#1E2B45]">{m.title}</span>
                        <span className="block text-[10.5px] text-slate-500">{m.sub}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl bg-[#F4F6F9] p-3 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-[#1E2B45]">Datos de ejemplo para la prueba:</p>
                <p>Beneficiario: Club Deportivo Demostración S.A. · Cuenta: 000-000000-00</p>
                <p className="text-[10.5px] text-slate-500">
                  Aviso: No ingreses datos financieros reales ni conectes cuentas bancarias.
                </p>
              </div>
            </div>

            {/* Presentación demostrativa de comprobante */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-3">
              <h3 className="text-sm font-extrabold text-[#1E2B45]">
                Presentar comprobante demostrativo
              </h3>

              <div>
                <label htmlFor="ref-demo" className="block text-xs font-bold text-[#1E2B45] mb-1">
                  Número de referencia (Ejemplo)
                </label>
                <input
                  id="ref-demo"
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-[#1E2B45]"
                />
              </div>

              <div className="rounded-xl border border-dashed border-[#273758]/30 bg-[#F4F6F9] p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCheck2 className="w-4 h-4 text-[#5E8210] shrink-0" />
                    <span className="text-xs font-bold text-[#1E2B45] truncate">
                      {archivoNombre}
                    </span>
                  </div>
                  <span className="rounded-md bg-[#ECFCCB] px-2 py-0.5 text-[10px] font-bold text-[#4E7006] shrink-0">
                    Simulado
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sample = `comprobante_demo_${Math.floor(100 + Math.random() * 900)}.png`;
                      setArchivoNombre(sample);
                      setReferencia(`DEMO-2026-${Math.floor(1000 + Math.random() * 8999)}`);
                    }}
                    className="rounded-xl bg-white border border-slate-200 py-2 px-2.5 text-[11px] font-bold text-[#273758] cursor-pointer"
                  >
                    Generar ejemplo
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl bg-white border border-slate-200 py-2 px-2.5 text-[11px] font-bold text-[#273758] inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Elegir archivo demo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleSampleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="nota-comp" className="block text-xs font-bold text-[#1E2B45] mb-1">
                  Nota opcional
                </label>
                <input
                  id="nota-comp"
                  type="text"
                  value={notaComprobante}
                  onChange={(e) => setNotaComprobante(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#1E2B45]"
                />
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              disabled={!totals.tarifaValida}
              onClick={handleSubmitReceipt}
              className="w-full rounded-2xl bg-[#B6E22E] hover:bg-[#ACD638] disabled:bg-slate-200 disabled:text-slate-400 py-3.5 text-base font-extrabold text-[#16223B] flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{`Enviar comprobante – B/. ${totals.totalPagado.toFixed(2)}`}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
