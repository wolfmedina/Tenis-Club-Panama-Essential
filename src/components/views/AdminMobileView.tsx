import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileCheck2,
  GraduationCap,
  MapPin,
  Megaphone,
  MessageCircle,
  Plus,
  QrCode,
  RefreshCw,
  Settings,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEMO_DATES, TIME_SLOTS } from '../../data/seedData';
import type {
  Cancha,
  DayGroup,
  Modality,
  PaymentMethod,
  Reserva,
  TarifaRegla,
} from '../../types/tennis';
import {
  calculateBookingTotals,
  computeAdminMetrics,
  formatHour12,
  isSlotAvailable,
  validateCourtRates,
} from '../../utils/tennisLogic';
import { HeaderBar } from '../HeaderBar';
import { PlayerAvatar } from '../VisualAssets';

export type AdminTab = 'inicio' | 'reservas' | 'canchas' | 'clases' | 'perfil';

interface AdminMobileViewProps {
  activeTab: AdminTab;
  onChangeTab: (tab: AdminTab) => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
}

const MANUAL_METHODS: PaymentMethod[] = [
  'Transferencia bancaria (Ejemplo)',
  'Pago móvil en club (Ejemplo)',
  'Depósito manual (Ejemplo)',
];

export const AdminMobileView: React.FC<AdminMobileViewProps> = ({
  activeTab,
  onChangeTab,
  onOpenMenu,
  onOpenNotifications,
}) => {
  const {
    state,
    currentUser,
    activeSede,
    switchSede,
    switchRole,
    toggleCourtStatus,
    updateCourtRates,
    createReservation,
    reviewReservationPayment,
    cancelReservation,
    rescheduleReservation,
    validateCheckInCode,
    sendAdminNotification,
    createInstructorClass,
    openWhatsAppDemo,
    resetDemoData,
    logout,
    showToast,
  } = useApp();

  const [showSedeMenu, setShowSedeMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState(DEMO_DATES[0].iso);
  const [reservaFilter, setReservaFilter] = useState<'todas' | 'pendientes' | 'confirmadas'>('todas');

  // Modals
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingTarifaCancha, setEditingTarifaCancha] = useState<Cancha | null>(null);
  const [rejectingReserva, setRejectingReserva] = useState<Reserva | null>(null);
  const [rejectReason, setRejectReason] = useState(
    'Comprobante ilegible o monto incompleto (simulación)'
  );

  // Form states
  const sedeCanchas = useMemo(
    () => state.canchas.filter((c) => c.sedeId === activeSede.id),
    [state.canchas, activeSede.id]
  );

  const [manCanchaId, setManCanchaId] = useState(sedeCanchas[0]?.id || '');
  const [manHora, setManHora] = useState('16:30');
  const [manDuracion, setManDuracion] = useState<60 | 90>(60);
  const [manJugador, setManJugador] = useState('Roberto Díaz (Presencial)');
  const [manModalidad, setManModalidad] = useState<Modality>('Dobles');
  const [manMetodo, setManMetodo] = useState<PaymentMethod>('Pago móvil en club (Ejemplo)');
  const [manError, setManError] = useState('');

  // Tariff editor state
  const [tarifaBase, setTarifaBase] = useState('');
  const [tarifaNocturna, setTarifaNocturna] = useState('');
  const [tarifa60, setTarifa60] = useState('');
  const [tarifa90, setTarifa90] = useState('');
  const [tarifa120, setTarifa120] = useState('');
  const [tarifaReglas, setTarifaReglas] = useState<TarifaRegla[]>([]);
  const [reglaDias, setReglaDias] = useState<DayGroup>('Fines de semana');
  const [reglaDesde, setReglaDesde] = useState('18:00');
  const [reglaHasta, setReglaHasta] = useState('22:00');
  const [reglaDuracion, setReglaDuracion] = useState<'' | '60' | '90' | '120'>('');
  const [reglaPrecio, setReglaPrecio] = useState('');
  const [tarifaError, setTarifaError] = useState('');

  const [qrCodeInput, setQrCodeInput] = useState('TCP-2401');
  const [qrResult, setQrResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [notifTitle, setNotifTitle] = useState('Aviso del club');
  const [notifBody, setNotifBody] = useState(
    'Recuerden presentar su código QR al llegar a recepción.'
  );

  const [clsTitulo, setClsTitulo] = useState('Clínica Nocturna Intermedio');
  const [clsCanchaId, setClsCanchaId] = useState(sedeCanchas[0]?.id || '');
  const [clsHora, setClsHora] = useState('18:00');
  const [clsError, setClsError] = useState('');

  const metrics = useMemo(
    () => computeAdminMetrics(state, activeSede.id, selectedDate),
    [state, activeSede.id, selectedDate]
  );

  const pendingApprovals = useMemo(
    () =>
      state.reservas.filter(
        (r) => r.sedeId === activeSede.id && r.estado === 'Pendiente de aprobación'
      ),
    [state.reservas, activeSede.id]
  );

  const sedeReservas = useMemo(() => {
    const list = state.reservas.filter((r) => r.sedeId === activeSede.id);
    if (activeTab === 'inicio') {
      return list.filter((r) => r.fecha === selectedDate);
    }
    if (reservaFilter === 'pendientes') {
      return list.filter((r) => r.estado === 'Pendiente de aprobación');
    }
    if (reservaFilter === 'confirmadas') {
      return list.filter(
        (r) =>
          r.fecha === selectedDate &&
          (r.estado === 'Confirmada' || r.estado === 'En curso')
      );
    }
    return list.filter(
      (r) => r.fecha === selectedDate || r.estado === 'Pendiente de aprobación'
    );
  }, [state.reservas, activeSede.id, activeTab, selectedDate, reservaFilter]);

  const sedeClases = useMemo(
    () => state.clases.filter((cl) => cl.sedeId === activeSede.id),
    [state.clases, activeSede.id]
  );

  const handleManualBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManError('');
    const targetCanchaId = manCanchaId || sedeCanchas[0]?.id;
    const res = createReservation({
      sedeId: activeSede.id,
      canchaId: targetCanchaId,
      fecha: selectedDate,
      horaInicio: manHora,
      duracionMin: manDuracion,
      modalidad: manModalidad,
      participantes: [manJugador],
      metodoPago: manMetodo,
      pendingApproval: false,
      tipoOrigen: 'Manual Admin',
    });
    if (!res.ok) {
      setManError(res.error || 'No disponible');
      return;
    }
    setShowManualBooking(false);
    showToast('Reserva manual confirmada en la agenda');
  };

  const openTarifaEditor = (c: Cancha) => {
    setEditingTarifaCancha(c);
    setTarifaBase(String(c.precioHora));
    setTarifaNocturna(c.precioNocturno !== undefined ? String(c.precioNocturno) : '');
    setTarifa60(c.preciosPorDuracion?.[60] !== undefined ? String(c.preciosPorDuracion[60]) : '');
    setTarifa90(c.preciosPorDuracion?.[90] !== undefined ? String(c.preciosPorDuracion[90]) : '');
    setTarifa120(c.preciosPorDuracion?.[120] !== undefined ? String(c.preciosPorDuracion[120]) : '');
    setTarifaReglas(c.tarifasPersonalizadas ? [...c.tarifasPersonalizadas] : []);
    setReglaPrecio('');
    setTarifaError('');
  };

  const handleAddTarifaRegla = () => {
    setTarifaError('');
    const parsed = Number(reglaPrecio);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setTarifaError('La tarifa de la regla debe ser mayor a B/. 0.00.');
      return;
    }
    const newRegla: TarifaRegla = {
      id: `reg_${Date.now()}`,
      dias: reglaDias,
      horaDesde: reglaDesde,
      horaHasta: reglaHasta,
      duracionMin: reglaDuracion ? (Number(reglaDuracion) as 60 | 90 | 120) : undefined,
      precioHora: parsed,
    };
    const nextCheck = validateCourtRates({
      precioHora: Number(tarifaBase) || 1,
      tarifasPersonalizadas: [...tarifaReglas, newRegla],
    });
    if (!nextCheck.valid) {
      setTarifaError(nextCheck.error || 'Regla inválida');
      return;
    }
    setTarifaReglas((prev) => [...prev, newRegla]);
    setReglaPrecio('');
  };

  const handleSaveTarifas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarifaCancha) return;
    setTarifaError('');
    const parsedBase = Number(tarifaBase);
    const parsedNoct = tarifaNocturna.trim() !== '' ? Number(tarifaNocturna) : undefined;
    const durMap: Partial<Record<60 | 90 | 120, number>> = {};
    if (tarifa60.trim() !== '') durMap[60] = Number(tarifa60);
    if (tarifa90.trim() !== '') durMap[90] = Number(tarifa90);
    if (tarifa120.trim() !== '') durMap[120] = Number(tarifa120);

    const res = updateCourtRates(editingTarifaCancha.id, {
      precioHora: parsedBase,
      precioNocturno: parsedNoct,
      preciosPorDuracion: Object.keys(durMap).length > 0 ? durMap : undefined,
      tarifasPersonalizadas: tarifaReglas.length > 0 ? tarifaReglas : undefined,
    });
    if (!res.ok) {
      setTarifaError(res.error || 'No se pudo guardar la tarifa');
      return;
    }
    setEditingTarifaCancha(null);
  };

  const firstName = currentUser.nombre.split(' ')[0];

  const getStatusBadgeClass = (estado: Reserva['estado']) => {
    if (estado === 'Pendiente de aprobación') return 'bg-amber-100 text-amber-800';
    if (estado === 'Rechazada' || estado === 'Cancelada') return 'bg-rose-50 text-rose-700';
    return 'bg-[#ECFCCB] text-[#4E7006]';
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
            <span className="inline-flex items-center gap-1 rounded-full bg-[#B6E22E] px-2.5 py-0.5 text-[10px] font-extrabold text-[#16223B]">
              <Settings className="w-3 h-3" />
              ADMINISTRADOR DE SEDE · DEMO
            </span>
            <button
              type="button"
              onClick={() => switchRole('jugador')}
              className="text-[11px] font-bold text-[#ACD638] hover:underline cursor-pointer"
            >
              Volver a Jugador
            </button>
          </div>

          <h1 className="mt-1.5 text-[24px] font-extrabold text-white leading-tight">
            Hola, {firstName}
          </h1>

          {/* Sede Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSedeMenu((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-[#ACD638] cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#ACD638]" />
              <span>Club activo: {activeSede.nombre}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showSedeMenu && (
              <div className="mt-2 rounded-2xl bg-white p-2 shadow-xl text-[#1E2B45] z-30 relative">
                {state.sedes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      switchSede(s.id);
                      setShowSedeMenu(false);
                      showToast(`Sede activa: ${s.nombre}`, 'info');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#F4F6F9] flex items-center justify-between cursor-pointer"
                  >
                    <span>
                      {s.nombre} <span className="font-normal text-slate-400">({s.tipo})</span>
                    </span>
                    {s.id === activeSede.id && <span className="text-[#5E8210]">Activa</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Commercial Capacity Pill */}
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-1 text-[10.5px] font-semibold text-white/90">
            <Building2 className="w-3.5 h-3.5 text-[#B6E22E]" />
            <span>
              Essential 2K: {state.sedes.length}/{state.commercialCapacity.maxSedes} sedes ·{' '}
              {state.canchas.length}/{state.commercialCapacity.maxCanchas} canchas totales
            </span>
          </div>

          {/* 3 KPI Cards */}
          {activeTab === 'inicio' && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white p-2.5 text-[#1E2B45] shadow-sm border-l-4 border-amber-400">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <FileCheck2 className="w-3 h-3 text-amber-600" />
                  Pendientes
                </span>
                <span className="mt-1 block text-xl font-extrabold tabular-nums">
                  {metrics.pendientesAprobacion}
                </span>
                <span className="mt-1 inline-block rounded-md bg-amber-100 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-800">
                  Comprobantes
                </span>
              </div>

              <div className="rounded-2xl bg-white p-2.5 text-[#1E2B45] shadow-sm border-l-4 border-[#B6E22E]">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-[#273758]" />
                  Ocupación
                </span>
                <span className="mt-1 block text-xl font-extrabold tabular-nums">
                  {metrics.ocupacionPct}%
                </span>
                <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#B6E22E] rounded-full"
                    style={{ width: `${metrics.ocupacionPct}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-2.5 text-[#1E2B45] shadow-sm border-l-4 border-[#B6E22E]">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#273758]" />
                  Reservas hoy
                </span>
                <span className="mt-1 block text-xl font-extrabold tabular-nums">
                  {metrics.reservasHoy}
                </span>
                <span className="mt-1 inline-block rounded-md bg-[#ECFCCB] px-1.5 py-0.5 text-[9.5px] font-bold text-[#4E7006]">
                  {activeSede.tipo}
                </span>
              </div>
            </div>
          )}
        </div>
      </HeaderBar>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4 pb-8">
        {activeTab === 'inicio' && (
          <>
            {/* Pending Receipts Approval Queue */}
            <section className="rounded-2xl bg-white p-3.5 shadow-sm border border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#1E2B45] flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-amber-600" />
                  Comprobantes pendientes de aprobación ({pendingApprovals.length})
                </h2>
                {pendingApprovals.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setReservaFilter('pendientes');
                      onChangeTab('reservas');
                    }}
                    className="text-xs font-bold text-[#5E8210] inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    Ver todos <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {pendingApprovals.length === 0 ? (
                <p className="text-xs text-slate-500 bg-[#F9FAFB] rounded-xl p-3">
                  No hay comprobantes pendientes en {activeSede.nombre}. Todos los pagos demo
                  han sido revisados.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {pendingApprovals.map((r) => {
                    const cname = state.canchas.find((c) => c.id === r.canchaId)?.nombre;
                    const holder = state.usuarios.find((u) => u.id === r.usuarioId);
                    const holderName = r.participantes[0] || holder?.nombre || 'Jugador';
                    return (
                      <div
                        key={r.id}
                        className="rounded-2xl bg-amber-50/60 border border-amber-200 p-3 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <PlayerAvatar
                              nombre={holder?.nombre || holderName}
                              seed={holder?.avatarSeed || holderName.split(' ')[0]}
                              avatarUrl={holder?.avatarUrl}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <span className="text-[10.5px] font-mono font-bold text-[#273758]">
                                {r.codigo} · {r.fecha} {formatHour12(r.horaInicio)}
                              </span>
                              <h3 className="text-xs font-extrabold text-[#1E2B45] truncate">
                                {holderName} · {cname}
                              </h3>
                              <p className="text-[11px] text-slate-600">
                                {r.metodoPago} · <strong>B/. {r.totalPagado.toFixed(2)}</strong>
                              </p>
                              {r.comprobante && (
                                <p className="text-[10.5px] text-slate-600 mt-0.5">
                                  Ref: <span className="font-mono font-bold">{r.comprobante.referencia}</span> ·{' '}
                                  {r.comprobante.archivoNombre}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => reviewReservationPayment(r.id, true)}
                            className="rounded-xl bg-[#B6E22E] hover:bg-[#ACD638] py-2 px-2 text-[11px] font-extrabold text-[#16223B] inline-flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aprobar pago
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectingReserva(r)}
                            className="rounded-xl bg-white border border-rose-200 py-2 px-2 text-[11px] font-bold text-rose-700 inline-flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Rechazar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openWhatsAppDemo(
                                holderName,
                                `Consulta sobre comprobante ${r.comprobante?.referencia || r.codigo} (${cname}, ${r.fecha})`,
                                'Jugador'
                              )
                            }
                            className="rounded-xl bg-emerald-600 text-white py-2 px-2 text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Quick Court Availability Switches */}
            <section className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-extrabold text-[#1E2B45]">Gestión de canchas</h2>
                <button
                  type="button"
                  onClick={() => onChangeTab('canchas')}
                  className="text-xs font-bold text-[#5E8210] inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Tarifas y detalle <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sedeCanchas.slice(0, 4).map((c) => {
                  const isAvail = c.estado === 'Disponible';
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-slate-100 bg-[#F9FAFB] p-2 flex flex-col items-center gap-1.5 text-center"
                    >
                      <span className="text-[11px] font-extrabold text-[#1E2B45] truncate w-full">
                        {c.nombre}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isAvail}
                        aria-label={`Alternar disponibilidad de ${c.nombre}`}
                        onClick={() => toggleCourtStatus(c.id)}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                          isAvail ? 'bg-[#B6E22E] justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-white shadow" />
                      </button>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[9.5px] font-bold ${
                          isAvail
                            ? 'bg-[#ECFCCB] text-[#4E7006]'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {c.estado}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 4 Quick Admin Actions */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Reserva manual', icon: Calendar, onClick: () => setShowManualBooking(true) },
                { label: 'Programar clase', icon: GraduationCap, onClick: () => setShowClassModal(true) },
                { label: 'Validar QR', icon: QrCode, onClick: () => setShowCheckInModal(true) },
                { label: 'Enviar aviso', icon: Megaphone, onClick: () => setShowNotifyModal(true) },
              ].map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.label}
                    type="button"
                    onClick={act.onClick}
                    className="rounded-2xl bg-white py-2.5 px-1.5 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-1 hover:border-[#ACD638] cursor-pointer"
                  >
                    <Icon className="w-5 h-5 text-[#273758]" />
                    <span className="text-[10px] font-bold text-[#1E2B45] text-center leading-tight">
                      {act.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Próximas reservas */}
            <section className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#1E2B45]">Agenda de hoy</h2>
                <button
                  type="button"
                  onClick={() => onChangeTab('reservas')}
                  className="text-xs font-bold text-[#5E8210] inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Ver agenda completa <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {sedeReservas.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  No hay reservas para esta fecha en {activeSede.nombre}.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sedeReservas.slice(0, 4).map((r) => {
                    const cname = state.canchas.find((c) => c.id === r.canchaId)?.nombre;
                    const holder = state.usuarios.find((u) => u.id === r.usuarioId);
                    const holderName = r.participantes[0] || holder?.nombre || 'Jugador';
                    return (
                      <div key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PlayerAvatar
                            nombre={holder?.nombre || holderName}
                            seed={holder?.avatarSeed || holderName.split(' ')[0]}
                            avatarUrl={holder?.avatarUrl}
                            size="xs"
                          />
                          <span className="text-xs font-extrabold text-[#273758] tabular-nums w-16 shrink-0">
                            {formatHour12(r.horaInicio)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-[#1E2B45] truncate">
                              {cname} – {r.codigo}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {holderName} · {r.metodoPago}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-bold shrink-0 ${getStatusBadgeClass(
                            r.estado
                          )}`}
                        >
                          {r.estado}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'reservas' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#1E2B45]">
                Reservas · {activeSede.nombre}
              </h2>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(true)}
                  className="rounded-xl bg-white border border-slate-200 px-2.5 py-2 text-xs font-bold text-[#273758] cursor-pointer"
                >
                  QR
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualBooking(true)}
                  className="rounded-xl bg-[#B6E22E] px-3 py-2 text-xs font-extrabold text-[#16223B] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Manual
                </button>
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {DEMO_DATES.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate(d.iso)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                    selectedDate === d.iso ? 'bg-[#273758] text-white' : 'bg-white text-[#1E2B45]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-2xl shadow-sm">
              {(
                [
                  { id: 'todas', label: 'Todas' },
                  { id: 'pendientes', label: `Pendientes (${pendingApprovals.length})` },
                  { id: 'confirmadas', label: 'Confirmadas' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setReservaFilter(f.id)}
                  className={`rounded-xl py-2 text-[11px] font-extrabold cursor-pointer ${
                    reservaFilter === f.id
                      ? 'bg-[#B6E22E] text-[#16223B]'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {sedeReservas.length === 0 ? (
              <div className="rounded-2xl bg-white p-5 text-center text-xs text-slate-500">
                No hay reservas en esta vista para {activeSede.nombre}.
              </div>
            ) : (
              sedeReservas.map((r) => {
                const cname = state.canchas.find((c) => c.id === r.canchaId)?.nombre;
                const holder = state.usuarios.find((u) => u.id === r.usuarioId);
                const holderName = r.participantes[0] || holder?.nombre || 'Jugador';
                return (
                  <div
                    key={r.id}
                    className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 space-y-2.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <PlayerAvatar
                          nombre={holder?.nombre || holderName}
                          seed={holder?.avatarSeed || holderName.split(' ')[0]}
                          avatarUrl={holder?.avatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-mono font-bold text-[#273758]">
                              {r.codigo} · {r.tipoOrigen}
                            </span>
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${getStatusBadgeClass(
                                r.estado
                              )}`}
                            >
                              {r.estado}
                            </span>
                          </div>
                          <h3 className="text-sm font-extrabold text-[#1E2B45]">
                            {cname} · {formatHour12(r.horaInicio)}
                          </h3>
                          <p className="text-xs text-slate-500 truncate">
                            {r.participantes.join(', ')} · {r.fecha}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5">{r.metodoPago}</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-[#273758] tabular-nums shrink-0">
                        B/. {r.totalPagado.toFixed(2)}
                      </span>
                    </div>

                    {r.comprobante && (
                      <div className="rounded-xl bg-[#F4F6F9] px-3 py-2 text-[11px] text-[#1E2B45] flex items-center justify-between gap-2">
                        <span className="truncate">
                          Comprobante: <strong>{r.comprobante.archivoNombre}</strong> (Ref.{' '}
                          {r.comprobante.referencia})
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {r.comprobante.fechaEnvio}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {r.estado === 'Pendiente de aprobación' && (
                        <>
                          <button
                            type="button"
                            onClick={() => reviewReservationPayment(r.id, true)}
                            className="rounded-xl bg-[#B6E22E] px-3 py-1.5 text-[11px] font-extrabold text-[#16223B] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aprobar pago
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectingReserva(r)}
                            className="rounded-xl border border-rose-200 px-3 py-1.5 text-[11px] font-bold text-rose-700 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Rechazar
                          </button>
                        </>
                      )}

                      {!r.asistenciaValidada && r.estado === 'Confirmada' && (
                        <button
                          type="button"
                          onClick={() => validateCheckInCode(r.codigo)}
                          className="rounded-xl bg-[#B6E22E] px-3 py-1.5 text-[11px] font-extrabold text-[#16223B] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Check-in QR
                        </button>
                      )}

                      {r.estado === 'Confirmada' && (
                        <>
                          <button
                            type="button"
                            onClick={() => rescheduleReservation(r.id, r.fecha, '15:00')}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-[#273758] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Mover 3:00 p. m.
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelReservation(r.id, true)}
                            className="rounded-xl border border-rose-200 px-3 py-1.5 text-[11px] font-bold text-rose-700 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3 h-3" />
                            Cancelar
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          openWhatsAppDemo(
                            holderName,
                            `Seguimiento de reserva ${r.codigo} (${cname}, ${r.fecha})`,
                            'Jugador'
                          )
                        }
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'canchas' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-[#1E2B45]">
                Canchas y tarifas · {activeSede.nombre}
              </h2>
              <span className="rounded-lg bg-[#273758]/10 px-2 py-0.5 text-[10px] font-bold text-[#273758]">
                {sedeCanchas.length} canchas
              </span>
            </div>
            {sedeCanchas.map((c) => {
              const isAvail = c.estado === 'Disponible';
              const rulesCount = c.tarifasPersonalizadas?.length || 0;
              return (
                <div
                  key={c.id}
                  className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#1E2B45]">{c.nombre}</h3>
                      <p className="text-xs text-slate-500">
                        {c.superficie} · {c.iluminacion ? 'LED' : 'Sin LED'} · Base{' '}
                        <strong className="text-[#1E2B45]">B/. {c.precioHora.toFixed(2)}/h</strong>
                        {c.precioNocturno !== undefined && (
                          <>
                            {' '}
                            · Noct.{' '}
                            <strong className="text-[#1E2B45]">
                              B/. {c.precioNocturno.toFixed(2)}/h
                            </strong>
                          </>
                        )}
                      </p>
                      {(c.preciosPorDuracion || rulesCount > 0) && (
                        <p className="text-[11px] font-semibold text-[#5E8210] mt-0.5">
                          {c.preciosPorDuracion
                            ? `Duración: ${Object.entries(c.preciosPorDuracion)
                                .map(([d, v]) => `${d}m B/.${Number(v).toFixed(2)}`)
                                .join(' · ')}`
                            : ''}
                          {c.preciosPorDuracion && rulesCount > 0 ? ' · ' : ''}
                          {rulesCount > 0 ? `${rulesCount} regla(s) por día/horario` : ''}
                        </p>
                      )}
                      {c.motivoBloqueo && (
                        <p className="text-[11px] text-rose-600 mt-0.5">{c.motivoBloqueo}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openTarifaEditor(c)}
                      className="flex-1 rounded-xl border border-[#273758]/20 bg-[#F4F6F9] hover:bg-slate-200 px-3 py-2 text-xs font-extrabold text-[#273758] cursor-pointer"
                    >
                      Configurar tarifas
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCourtStatus(c.id)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer ${
                        isAvail ? 'bg-[#B6E22E] text-[#16223B]' : 'bg-[#273758] text-white'
                      }`}
                    >
                      {isAvail ? 'Bloquear' : 'Habilitar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'clases' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#1E2B45]">
                Clases de {activeSede.nombre}
              </h2>
              <button
                type="button"
                onClick={() => setShowClassModal(true)}
                className="rounded-xl bg-[#B6E22E] px-3 py-2 text-xs font-extrabold text-[#16223B] cursor-pointer"
              >
                + Programar clase
              </button>
            </div>
            {sedeClases.map((cl) => {
              const inst = state.instructores.find((i) => i.id === cl.instructorId);
              const cancha = state.canchas.find((c) => c.id === cl.canchaId);
              return (
                <div
                  key={cl.id}
                  className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 flex items-center gap-3"
                >
                  <PlayerAvatar
                    nombre={inst?.nombre || 'Instructor'}
                    seed={inst?.avatarSeed}
                    size="md"
                    shape="rounded"
                    isInstructor
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold text-[#1E2B45] truncate">{cl.titulo}</h3>
                    <p className="text-xs text-slate-500 truncate">
                      {inst?.nombre} · {cancha?.nombre} · {cl.fecha} {formatHour12(cl.horaInicio)}
                    </p>
                    <p className="text-xs font-bold text-[#5E8210] mt-1">
                      Alumnos: {cl.alumnosIds.length}/{cl.cupoMax} · B/. {cl.precioPorCupo}/cupo
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 space-y-2.5">
              <h3 className="text-xs font-extrabold text-[#1E2B45] uppercase tracking-wide">
                Instructores asignados a {activeSede.nombre}
              </h3>
              <div className="space-y-2">
                {state.instructores
                  .filter((i) => i.sedesAutorizadas.includes(activeSede.id))
                  .map((inst) => (
                    <div
                      key={inst.id}
                      className="flex items-center justify-between gap-2.5 rounded-xl bg-[#F9FAFB] p-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PlayerAvatar
                          nombre={inst.nombre}
                          seed={inst.avatarSeed}
                          size="sm"
                          shape="rounded"
                          isInstructor
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-[#1E2B45] truncate">
                            {inst.nombre}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {inst.titulo} · ★ {inst.rating}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openWhatsAppDemo(
                            inst.nombre,
                            `Coordinación de clases en ${activeSede.nombre}`,
                            'Instructor'
                          )
                        }
                        className="shrink-0 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2">
              <h2 className="text-sm font-extrabold text-[#1E2B45] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#273758]" />
                Alcance comercial ilustrativo (Essential 2K)
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Esta demostración comercial representa una operación multi-club simplificada de
                hasta <strong>{state.commercialCapacity.maxSedes} sedes</strong> y hasta{' '}
                <strong>{state.commercialCapacity.maxCanchas} canchas totales</strong> (actualmente{' '}
                {state.sedes.length} sedes y {state.canchas.length} canchas cargadas con datos de
                ejemplo).
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2">
              <h2 className="text-sm font-extrabold text-[#1E2B45]">Cambiar de vista (Demo)</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => switchRole('jugador')}
                  className="rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B] cursor-pointer"
                >
                  Jugador
                </button>
                <button
                  type="button"
                  onClick={() => switchRole('instructor')}
                  className="rounded-xl bg-[#F4F6F9] py-2.5 text-xs font-bold text-[#273758] cursor-pointer"
                >
                  Instructor móvil
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={resetDemoData}
                className="rounded-2xl bg-white border border-slate-200 py-3 text-xs font-bold text-[#273758] cursor-pointer"
              >
                Reiniciar demo
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-2xl bg-white border border-rose-200 py-3 text-xs font-bold text-rose-700 cursor-pointer"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Reject Payment Reason */}
      {rejectingReserva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45]">
              Rechazar comprobante · {rejectingReserva.codigo}
            </h3>
            <p className="text-xs text-slate-600">
              Al rechazar este comprobante de ejemplo, el horario quedará liberado y el jugador
              recibirá el aviso correspondiente en la demostración.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRejectingReserva(null)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  reviewReservationPayment(rejectingReserva.id, false, rejectReason);
                  setRejectingReserva(null);
                }}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-extrabold text-white cursor-pointer"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual Booking */}
      {showManualBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <form
            onSubmit={handleManualBookingSubmit}
            className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3"
          >
            <h3 className="text-base font-extrabold text-[#1E2B45]">Nueva reserva manual</h3>
            <div>
              <label className="block text-xs font-bold mb-1">Cancha</label>
              <select
                value={manCanchaId || sedeCanchas[0]?.id}
                onChange={(e) => setManCanchaId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {sedeCanchas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.estado})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Horario ({selectedDate})</label>
              <select
                value={manHora}
                onChange={(e) => setManHora(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {TIME_SLOTS.map((t) => {
                  const ok = isSlotAvailable(
                    state,
                    manCanchaId || sedeCanchas[0]?.id,
                    selectedDate,
                    t,
                    60
                  ).available;
                  return (
                    <option key={t} value={t}>
                      {formatHour12(t)} {ok ? '' : '(Ocupado)'}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Cliente / Socio</label>
              <input
                type="text"
                value={manJugador}
                onChange={(e) => setManJugador(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold mb-1">Modalidad</label>
                <select
                  value={manModalidad}
                  onChange={(e) => setManModalidad(e.target.value as Modality)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  <option value="Dobles">Dobles</option>
                  <option value="Individual">Individual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Duración</label>
                <select
                  value={manDuracion}
                  onChange={(e) => setManDuracion(Number(e.target.value) as 60 | 90)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Modalidad de pago (Ejemplo)</label>
              <select
                value={manMetodo}
                onChange={(e) => setManMetodo(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {MANUAL_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            {(() => {
              const targetC = sedeCanchas.find(
                (c) => c.id === (manCanchaId || sedeCanchas[0]?.id)
              );
              if (!targetC) return null;
              const manPreview = calculateBookingTotals(
                targetC,
                manHora,
                manDuracion,
                state.serviceFeePct,
                false,
                selectedDate
              );
              return (
                <div className="rounded-xl bg-[#F4F6F9] px-3 py-2 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">
                    Importe ({manDuracion} min)
                  </span>
                  <span className="font-extrabold text-[#1E2B45] tabular-nums">
                    B/. {manPreview.totalPagado.toFixed(2)}
                  </span>
                </div>
              );
            })()}
            {manError && <p className="text-xs font-bold text-rose-600">{manError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowManualBooking(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B] cursor-pointer"
              >
                Confirmar reserva
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Court Tariff Configurator */}
      {editingTarifaCancha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <form
            onSubmit={handleSaveTarifas}
            className="w-full max-w-[410px] max-h-[88vh] overflow-y-auto rounded-3xl bg-white p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-[#1E2B45]">
                  Configurar tarifas · {editingTarifaCancha.nombre}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tarifas demostrativas mayores a B/. 0.00.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTarifaCancha(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="tarifa-base" className="block text-xs font-bold text-[#1E2B45] mb-1">
                  Tarifa base / h (B/.)
                </label>
                <input
                  id="tarifa-base"
                  type="number"
                  step="0.5"
                  value={tarifaBase}
                  onChange={(e) => setTarifaBase(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
                  required
                />
              </div>
              <div>
                <label htmlFor="tarifa-noct" className="block text-xs font-bold text-[#1E2B45] mb-1">
                  Nocturna ≥ 6:00 p. m. (B/.)
                </label>
                <input
                  id="tarifa-noct"
                  type="number"
                  step="0.5"
                  value={tarifaNocturna}
                  onChange={(e) => setTarifaNocturna(e.target.value)}
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-[#1E2B45] mb-1">
                Tarifas fijas por duración (opcional, B/.)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="tarifa-60" className="block text-[10px] text-slate-500 mb-0.5">
                    60 min
                  </label>
                  <input
                    id="tarifa-60"
                    type="number"
                    step="0.5"
                    value={tarifa60}
                    onChange={(e) => setTarifa60(e.target.value)}
                    placeholder="Auto"
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="tarifa-90" className="block text-[10px] text-slate-500 mb-0.5">
                    90 min
                  </label>
                  <input
                    id="tarifa-90"
                    type="number"
                    step="0.5"
                    value={tarifa90}
                    onChange={(e) => setTarifa90(e.target.value)}
                    placeholder="Auto"
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="tarifa-120" className="block text-[10px] text-slate-500 mb-0.5">
                    120 min
                  </label>
                  <input
                    id="tarifa-120"
                    type="number"
                    step="0.5"
                    value={tarifa120}
                    onChange={(e) => setTarifa120(e.target.value)}
                    placeholder="Auto"
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2.5 space-y-2">
              <span className="block text-xs font-extrabold text-[#1E2B45]">
                Reglas por día, horario y duración
              </span>
              {tarifaReglas.length > 0 && (
                <div className="space-y-1.5">
                  {tarifaReglas.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between rounded-xl bg-[#F4F6F9] px-2.5 py-1.5 text-[11px]"
                    >
                      <span className="font-semibold text-[#1E2B45]">
                        {reg.dias} · {reg.horaDesde}–{reg.horaHasta} ·{' '}
                        {reg.duracionMin ? `${reg.duracionMin} min` : 'Todas'} ·{' '}
                        <strong>B/. {reg.precioHora.toFixed(2)}/h</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setTarifaReglas((prev) => prev.filter((item) => item.id !== reg.id))
                        }
                        className="text-rose-600 font-bold ml-2 cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5">
                <select
                  aria-label="Días de la regla"
                  value={reglaDias}
                  onChange={(e) => setReglaDias(e.target.value as DayGroup)}
                  className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                >
                  <option value="Todos">Todos los días</option>
                  <option value="Lun-Vie">Lun–Vie</option>
                  <option value="Fines de semana">Fines de semana</option>
                </select>
                <select
                  aria-label="Duración de la regla"
                  value={reglaDuracion}
                  onChange={(e) => setReglaDuracion(e.target.value as '' | '60' | '90' | '120')}
                  className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                >
                  <option value="">Cualquier duración</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                  <option value="120">120 min</option>
                </select>
                <input
                  type="time"
                  aria-label="Hora desde"
                  value={reglaDesde}
                  onChange={(e) => setReglaDesde(e.target.value)}
                  className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                />
                <input
                  type="time"
                  aria-label="Hora hasta"
                  value={reglaHasta}
                  onChange={(e) => setReglaHasta(e.target.value)}
                  className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  aria-label="Tarifa regla por hora"
                  value={reglaPrecio}
                  onChange={(e) => setReglaPrecio(e.target.value)}
                  placeholder="Tarifa B/./h (ej. 12)"
                  className="flex-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddTarifaRegla}
                  className="rounded-xl bg-[#273758] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                >
                  + Agregar regla
                </button>
              </div>
            </div>

            {tarifaError && (
              <p role="alert" className="text-xs font-bold text-rose-600">
                {tarifaError}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingTarifaCancha(null)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B] cursor-pointer"
              >
                Guardar tarifas
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: QR Check-in */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[360px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45]">
              Validar código / QR de reserva
            </h3>
            <input
              type="text"
              value={qrCodeInput}
              onChange={(e) => setQrCodeInput(e.target.value)}
              placeholder="Ej. TCP-2401"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono uppercase"
            />
            {qrResult && (
              <p className={`text-xs font-bold ${qrResult.ok ? 'text-[#4E7006]' : 'text-rose-600'}`}>
                {qrResult.message}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => setQrResult(validateCheckInCode(qrCodeInput))}
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B] cursor-pointer"
              >
                Validar entrada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Send Notification */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45]">
              Enviar aviso en pantalla (Demo)
            </h3>
            <input
              type="text"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
            />
            <textarea
              value={notifBody}
              onChange={(e) => setNotifBody(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNotifyModal(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  sendAdminNotification(notifTitle, notifBody);
                  setShowNotifyModal(false);
                }}
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B] cursor-pointer"
              >
                Publicar aviso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Class */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45]">Agregar clase a la agenda</h3>
            <input
              type="text"
              value={clsTitulo}
              onChange={(e) => setClsTitulo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
            <select
              value={clsCanchaId || sedeCanchas[0]?.id}
              onChange={(e) => setClsCanchaId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            >
              {sedeCanchas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <select
              value={clsHora}
              onChange={(e) => setClsHora(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {formatHour12(t)}
                </option>
              ))}
            </select>
            {clsError && <p className="text-xs font-bold text-rose-600">{clsError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowClassModal(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = createInstructorClass({
                    sedeId: activeSede.id,
                    canchaId: clsCanchaId || sedeCanchas[0]?.id,
                    titulo: clsTitulo,
                    tipo: 'Grupal',
                    fecha: selectedDate,
                    horaInicio: clsHora,
                    duracionMin: 60,
                    precioPorCupo: 25,
                    cupoMax: 8,
                  });
                  if (!res.ok) setClsError(res.error || 'Conflicto de horario');
                  else setShowClassModal(false);
                }}
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B] cursor-pointer"
              >
                Programar clase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
