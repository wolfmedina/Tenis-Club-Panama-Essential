import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Car,
  Check,
  ChevronRight,
  Clock,
  Coins,
  Layers,
  Lightbulb,
  MapPin,
  MessageCircle,
  ShowerHead,
  Star,
  Trees,
  Wifi,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { DEMO_DATES, TIME_SLOTS } from '../../../data/seedData';
import type { Modality } from '../../../types/tennis';
import { calculateBookingTotals, formatHour12, isSlotAvailable } from '../../../utils/tennisLogic';
import { HeaderBar } from '../../HeaderBar';
import { CourtScene } from '../../VisualAssets';

interface CourtDetailViewProps {
  sedeId: string;
  initialCanchaId?: string;
  onBack: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onProceedCheckout: (selection: {
    sedeId: string;
    canchaId: string;
    fecha: string;
    horaInicio: string;
    duracionMin: 60 | 90;
    modalidad: Modality;
  }) => void;
}

export const CourtDetailView: React.FC<CourtDetailViewProps> = ({
  sedeId,
  initialCanchaId,
  onBack,
  onOpenMenu,
  onOpenNotifications,
  onProceedCheckout,
}) => {
  const { state, openWhatsAppDemo } = useApp();
  const sede = state.sedes.find((s) => s.id === sedeId) || state.sedes[0];
  const sedeCanchas = useMemo(
    () => state.canchas.filter((c) => c.sedeId === sede.id),
    [state.canchas, sede.id]
  );

  const [selectedCanchaId, setSelectedCanchaId] = useState(
    initialCanchaId && sedeCanchas.some((c) => c.id === initialCanchaId)
      ? initialCanchaId
      : sedeCanchas[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState(DEMO_DATES[0].iso);
  const [duracionMin, setDuracionMin] = useState<60 | 90>(90);
  const [modalidad, setModalidad] = useState<Modality>('Dobles');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [slideIdx, setSlideIdx] = useState(0);

  const selectedCancha =
    sedeCanchas.find((c) => c.id === selectedCanchaId) || sedeCanchas[0];

  const slotStatuses = useMemo(() => {
    if (!selectedCancha) return [];
    return TIME_SLOTS.map((slot) => ({
      time: slot,
      ...isSlotAvailable(state, selectedCancha.id, selectedDate, slot, duracionMin),
    }));
  }, [state, selectedCancha, selectedDate, duracionMin]);

  const activeTime = useMemo(() => {
    const stillValid = slotStatuses.find((s) => s.time === selectedTime && s.available);
    if (stillValid) return stillValid.time;
    return slotStatuses.find((s) => s.available)?.time || '';
  }, [slotStatuses, selectedTime]);

  const previewPrice = selectedCancha
    ? calculateBookingTotals(
        selectedCancha,
        activeTime || '09:00',
        duracionMin,
        state.serviceFeePct,
        false,
        selectedDate
      )
    : {
        precioCancha: 0,
        cargoServicio: 0,
        totalPagado: 0,
        tarifaHoraAplicada: 0,
        tarifaValida: false,
      };

  const amenityIcons = [
    { icon: Lightbulb, label: 'Iluminación LED' },
    { icon: Trees, label: 'Áreas de descanso' },
    { icon: ShowerHead, label: 'Duchas y vestidores' },
    { icon: Car, label: 'Estacionamiento' },
    { icon: Wifi, label: 'Wi-Fi del club' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        variant="net"
        onBack={onBack}
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
      />

      <div className="relative h-48 bg-[#18243E]">
        <CourtScene
          sedeId={sede.id}
          isPublic={sede.tipo === 'Pública'}
          variant={sede.imagenVariant}
          photoIndex={slideIdx}
          clubLabel={sede.nombre}
          eager
        />
        <span className="absolute top-3 right-3 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-bold text-white tabular-nums">
          {slideIdx + 1} / 5
        </span>
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlideIdx(i)}
              aria-label={`Foto ${i + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                slideIdx === i ? 'w-4 bg-[#ACD638]' : 'w-2 bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="-mt-4 rounded-t-[26px] bg-white px-4 pt-4 pb-6 shadow-sm flex-1">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3">
          {sedeCanchas.map((c) => {
            const active = c.id === selectedCancha?.id;
            const isBlocked = c.estado !== 'Disponible';
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCanchaId(c.id);
                  setSelectedTime('');
                }}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-[#273758] text-white'
                    : isBlocked
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-[#F4F6F9] text-[#1E2B45]'
                }`}
              >
                {c.nombre} {isBlocked ? `(${c.estado})` : ''}
              </button>
            );
          })}
        </div>

        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              CANCHA · {sede.tipo}
            </span>
            <h1 className="text-xl font-extrabold text-[#1E2B45] leading-tight">
              {selectedCancha?.nombre} – {sede.nombre}
            </h1>
            <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#273758]" />
              {sede.distrito}, {sede.provincia}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1 text-base font-extrabold text-[#1E2B45]">
              <Star className="w-4 h-4 fill-[#ACD638] text-[#ACD638]" />
              {sede.rating}
            </div>
            <span className="block text-[11px] text-slate-500">
              ({sede.resenasCount} reseñas)
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          {sede.reglamento}
        </p>

        {/* Visual WhatsApp contact button for facility */}
        <button
          type="button"
          onClick={() =>
            openWhatsAppDemo(
              `Recepción · ${sede.nombre}`,
              `Consulta sobre disponibilidad y tarifas en ${selectedCancha?.nombre || 'cancha'}.`,
              'Atención del club'
            )
          }
          className="mt-3 w-full rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 text-xs font-extrabold text-emerald-800 inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
        >
          <MessageCircle className="w-4 h-4" />
          Consultar sede por WhatsApp (Demo)
        </button>

        {/* Amenidades */}
        <div className="mt-4">
          <h2 className="text-sm font-extrabold text-[#1E2B45] mb-2">Amenidades</h2>
          <div className="grid grid-cols-5 gap-1.5">
            {amenityIcons.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-xl bg-[#F4F6F9] p-2 flex flex-col items-center justify-center text-center gap-1"
                >
                  <Icon className="w-4 h-4 text-[#273758]" />
                  <span className="text-[9.5px] font-semibold text-[#1E2B45] leading-tight">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tarifas y Specs */}
        {selectedCancha && (
          <div className="mt-3.5 rounded-2xl bg-[#F4F6F9] p-3 grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#6E9214] shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] text-slate-500">Superficie</span>
                <span className="block font-bold text-[#1E2B45] truncate">
                  {selectedCancha.superficie}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#273758] shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-500">Horario</span>
                <span className="block font-bold text-[#1E2B45] tabular-nums">
                  {sede.horarioApertura}–{sede.horarioCierre}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#6E9214] shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-500">Tarifa/hora</span>
                <span className="block font-extrabold text-[#1E2B45] tabular-nums">
                  {`B/. ${(previewPrice.tarifaHoraAplicada || selectedCancha.precioHora).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Date Picker */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-extrabold text-[#1E2B45] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#273758]" />
              Selecciona una fecha
            </h2>
            <span className="text-xs font-bold text-[#273758]">Nov – Dic 2026</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {DEMO_DATES.map((d) => {
              const active = d.iso === selectedDate;
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate(d.iso)}
                  className={`rounded-xl py-2 text-center transition cursor-pointer ${
                    active
                      ? 'bg-[#B6E22E] text-[#16223B] shadow-sm'
                      : 'bg-[#F4F6F9] text-[#1E2B45] hover:bg-slate-200'
                  }`}
                >
                  <span className="block text-[9px] font-bold">{d.dow}</span>
                  <span className="block text-sm font-extrabold tabular-nums">{d.day}</span>
                  <span className="block text-[9px] font-semibold opacity-75">{d.month}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration & Modality */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div>
            <span className="block text-[11px] font-bold text-slate-500 mb-1">Duración</span>
            <div className="grid grid-cols-2 gap-1 bg-[#F4F6F9] p-1 rounded-xl">
              {([60, 90] as const).map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setDuracionMin(dur)}
                  className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    duracionMin === dur ? 'bg-white text-[#273758] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {dur} min
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-500 mb-1">Modalidad</span>
            <div className="grid grid-cols-2 gap-1 bg-[#F4F6F9] p-1 rounded-xl">
              {(['Individual', 'Dobles'] as const).map((mod) => (
                <button
                  key={mod}
                  type="button"
                  onClick={() => setModalidad(mod)}
                  className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    modalidad === mod ? 'bg-white text-[#273758] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Available Time Slots */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-extrabold text-[#1E2B45] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#273758]" />
              Horario disponible
            </h2>
            <span className="text-[10.5px] font-semibold text-slate-500">
              Diurna / Nocturna
            </span>
          </div>

          {selectedCancha && selectedCancha.estado !== 'Disponible' ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-rose-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Cancha temporalmente no disponible ({selectedCancha.estado})</p>
                <p className="mt-0.5">{selectedCancha.motivoBloqueo || 'Selecciona otra cancha de la sede.'}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slotStatuses.map((slot) => {
                const isSelected = activeTime === slot.time && slot.available;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    title={slot.reason}
                    className={`rounded-xl py-2.5 px-2 text-xs font-bold tabular-nums flex items-center justify-center gap-1 transition ${
                      !slot.available
                        ? 'bg-[#EEF2F6] text-slate-400 cursor-not-allowed line-through'
                        : isSelected
                          ? 'bg-[#18243E] text-white ring-2 ring-[#ACD638] cursor-pointer'
                          : 'bg-white border border-[#ACD638] text-[#1E2B45] hover:bg-[#F7FCEB] cursor-pointer'
                    }`}
                  >
                    <span>{formatHour12(slot.time)}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#ACD638]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2.5">
            <span className="text-slate-500 font-medium">
              Importe estimado ({duracionMin} min)
            </span>
            <span className="text-base font-extrabold text-[#273758] tabular-nums">
              {`B/. ${previewPrice.totalPagado.toFixed(2)}`}
            </span>
          </div>
          <button
            type="button"
            disabled={!activeTime || !selectedCancha || selectedCancha.estado !== 'Disponible' || !previewPrice.tarifaValida}
            onClick={() => {
              if (!selectedCancha || !activeTime) return;
              onProceedCheckout({
                sedeId: sede.id,
                canchaId: selectedCancha.id,
                fecha: selectedDate,
                horaInicio: activeTime,
                duracionMin,
                modalidad,
              });
            }}
            className="w-full rounded-2xl bg-[#B6E22E] hover:bg-[#ACD638] disabled:bg-slate-200 disabled:text-slate-400 py-3.5 text-base font-extrabold text-[#16223B] flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Continuar a reserva</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
