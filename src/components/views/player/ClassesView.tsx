import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Info,
  MapPin,
  MessageCircle,
  Search,
  Star,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { DEMO_DATES } from '../../../data/seedData';
import type { ClaseProgramada, Instructor, PaymentMethod } from '../../../types/tennis';
import { formatHour12, isInstructorAvailable, isSlotAvailable } from '../../../utils/tennisLogic';
import { HeaderBar } from '../../HeaderBar';
import { PlayerAvatar, resolveAvatarPhoto } from '../../VisualAssets';

interface ClassesViewProps {
  onBack?: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  onBack,
  onOpenMenu,
  onOpenNotifications,
}) => {
  const { state, currentUser, bookClass, enrollInExistingClass, openWhatsAppDemo } = useApp();
  const [tab, setTab] = useState<'instructores' | 'misclases'>('instructores');
  const [query, setQuery] = useState('');
  const [sedeFilter, setSedeFilter] = useState('Todas');
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [profileInstructor, setProfileInstructor] = useState<Instructor | null>(null);

  const [bookSedeId, setBookSedeId] = useState('');
  const [bookCanchaId, setBookCanchaId] = useState('');
  const [bookFecha, setBookFecha] = useState(DEMO_DATES[0].iso);
  const [bookHora, setBookHora] = useState('');
  const [bookTipo, setBookTipo] = useState<ClaseProgramada['tipo']>('Individual');
  const [bookMetodo, setBookMetodo] = useState<PaymentMethod>('Transferencia bancaria (Ejemplo)');
  const [bookError, setBookError] = useState('');

  const filteredInstructors = useMemo(() => {
    return state.instructores.filter((inst) => {
      if (sedeFilter !== 'Todas' && !inst.sedesAutorizadas.includes(sedeFilter)) {
        return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          inst.nombre.toLowerCase().includes(q) ||
          inst.especialidades.some((e) => e.toLowerCase().includes(q)) ||
          inst.titulo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [state.instructores, sedeFilter, query]);

  const featured = filteredInstructors[0] || state.instructores[0];
  const others = filteredInstructors.filter((i) => i.id !== featured?.id);

  const openBookModal = (inst: Instructor) => {
    const defaultSede = inst.sedesAutorizadas[0] || state.sedes[0].id;
    const defaultCourt =
      state.canchas.find((c) => c.sedeId === defaultSede && c.estado === 'Disponible')?.id || '';
    setSelectedInstructor(inst);
    setBookSedeId(defaultSede);
    setBookCanchaId(defaultCourt);
    setBookFecha(DEMO_DATES[0].iso);
    setBookHora(inst.horariosDisponibles[0] || '09:00');
    setBookTipo('Individual');
    setBookError('');
  };

  const crossAvailability = useMemo(() => {
    if (!selectedInstructor || !bookCanchaId) return [];
    return selectedInstructor.horariosDisponibles.map((slot) => {
      const courtOk = isSlotAvailable(state, bookCanchaId, bookFecha, slot, 60);
      const instOk = isInstructorAvailable(state, selectedInstructor.id, bookFecha, slot, 60);
      return {
        slot,
        available: courtOk.available && instOk.available,
        reason: !courtOk.available ? courtOk.reason : !instOk.available ? instOk.reason : undefined,
      };
    });
  }, [selectedInstructor, bookCanchaId, bookFecha, state]);

  const myClasses = state.clases.filter((cl) => cl.alumnosIds.includes(currentUser.id));
  const openGroupClasses = state.clases.filter(
    (cl) => (cl.tipo === 'Grupal' || cl.tipo === 'Junior') && cl.estado === 'Abierta'
  );

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        variant="net"
        onBack={onBack}
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
      >
        <div className="pb-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Clases e instructores</h1>
              <p className="text-xs text-white/85 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#ACD638]" />
                {currentUser.distrito}, {currentUser.provincia}
              </p>
            </div>
            <div className="bg-white/10 p-1 rounded-xl flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setTab('instructores')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  tab === 'instructores' ? 'bg-[#B6E22E] text-[#16223B]' : 'text-white'
                }`}
              >
                Instructores
              </button>
              <button
                type="button"
                onClick={() => setTab('misclases')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  tab === 'misclases' ? 'bg-[#B6E22E] text-[#16223B]' : 'text-white'
                }`}
              >
                Mis clases ({myClasses.length})
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center rounded-full bg-white px-4 py-2.5 shadow-sm">
            <Search className="w-4 h-4 text-[#273758] shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar instructores o especialidades..."
              aria-label="Buscar instructores"
              className="ml-2.5 w-full bg-transparent text-sm text-[#1E2B45] placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="mt-2.5 flex gap-2 overflow-x-auto no-scrollbar">
            <select
              aria-label="Filtrar instructores por club"
              value={sedeFilter}
              onChange={(e) => setSedeFilter(e.target.value)}
              className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#1E2B45]"
            >
              <option value="Todas">Club: Todos</option>
              {state.sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </HeaderBar>

      <div className="flex-1 p-4 space-y-4 pb-8">
        {tab === 'instructores' ? (
          <>
            {featured && (
              <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden flex min-h-[196px]">
                <div className="w-[62%] p-3.5 space-y-1.5 z-10 flex flex-col justify-between bg-white">
                  <div>
                    <span className="text-[10.5px] font-extrabold text-[#273758]/70 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" /> INSTRUCTOR DESTACADO
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <h2 className="text-base font-extrabold text-[#1E2B45]">{featured.nombre}</h2>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#1E2B45]">
                        <Star className="w-3.5 h-3.5 fill-[#ACD638] text-[#ACD638]" />
                        {featured.rating}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{featured.titulo}</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      <strong>Especialidades:</strong> {featured.especialidades.join(' · ')}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                      <span className="text-xs font-extrabold text-[#1E2B45] tabular-nums">
                        Desde B/. {featured.precioBase.toFixed(2)} / clase
                      </span>
                      <span className="rounded-lg bg-[#ECFCCB] px-2 py-0.5 text-[10px] font-bold text-[#4E7006]">
                        {featured.proximaSlotTexto}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => openBookModal(featured)}
                      className="rounded-xl bg-[#B6E22E] hover:bg-[#ACD638] px-3 py-2 text-xs font-extrabold text-[#16223B] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Reservar clase
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileInstructor(featured)}
                      className="rounded-xl bg-[#F4F6F9] hover:bg-slate-200 px-2.5 py-2 text-xs font-bold text-[#273758] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Ver perfil
                    </button>
                  </div>
                </div>
                <div
                  className="w-[42%] -ml-4 relative overflow-hidden bg-[#1D2D4E]"
                  style={{ clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 0% 100%)' }}
                >
                  <img
                    src={resolveAvatarPhoto(featured.nombre, featured.avatarSeed, undefined, true)}
                    alt={featured.nombre}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover object-top block select-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <h3 className="text-base font-extrabold text-[#1E2B45]">
                Todos los instructores ({filteredInstructors.length})
              </h3>
              {others.map((inst) => (
                <div
                  key={inst.id}
                  className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <PlayerAvatar
                      nombre={inst.nombre}
                      seed={inst.avatarSeed}
                      size="lg"
                      shape="rounded"
                      isInstructor
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-extrabold text-[#1E2B45] truncate">
                          {inst.nombre}
                        </h4>
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#1E2B45]">
                          <Star className="w-3 h-3 fill-[#ACD638] text-[#ACD638]" />
                          {inst.rating}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{inst.titulo}</p>
                      <p className="text-[10.5px] text-slate-600 truncate mt-0.5">
                        {inst.especialidades.join(' · ')}
                      </p>
                      <p className="mt-1 text-[11px] font-extrabold text-[#273758] tabular-nums">
                        Desde B/. {inst.precioBase.toFixed(2)} ·{' '}
                        <span className="font-semibold text-[#5E8210]">{inst.proximaSlotTexto}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openBookModal(inst)}
                      className="rounded-xl bg-[#B6E22E] px-2.5 py-1.5 text-[11px] font-extrabold text-[#16223B] cursor-pointer"
                    >
                      Reservar clase
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileInstructor(inst)}
                      className="rounded-xl bg-[#F4F6F9] px-2.5 py-1.5 text-[11px] font-bold text-[#273758] cursor-pointer"
                    >
                      Ver perfil
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-[#1E2B45]">Clases grupales abiertas</h3>
              {openGroupClasses.map((cl) => {
                const inst = state.instructores.find((i) => i.id === cl.instructorId);
                const sede = state.sedes.find((s) => s.id === cl.sedeId);
                const enrolled = cl.alumnosIds.includes(currentUser.id);
                return (
                  <div
                    key={cl.id}
                    className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PlayerAvatar
                        nombre={inst?.nombre || 'Instructor'}
                        seed={inst?.avatarSeed}
                        size="md"
                        shape="rounded"
                        isInstructor
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-[#1E2B45] truncate">{cl.titulo}</h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {inst?.nombre} · {sede?.nombre}
                        </p>
                        <p className="text-[11px] text-slate-600 tabular-nums mt-0.5">
                          {cl.fecha} · {formatHour12(cl.horaInicio)} · {cl.alumnosIds.length}/
                          {cl.cupoMax} cupos · B/. {cl.precioPorCupo.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={enrolled}
                      onClick={() => enrollInExistingClass(cl.id)}
                      className={`shrink-0 rounded-xl px-3 py-2 text-xs font-extrabold cursor-pointer ${
                        enrolled ? 'bg-[#273758] text-white' : 'bg-[#B6E22E] text-[#16223B]'
                      }`}
                    >
                      {enrolled ? 'Inscrito' : 'Inscribirme'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {myClasses.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-xs text-slate-500">
                Aún no estás inscrito en ninguna clase.
              </div>
            ) : (
              myClasses.map((cl) => {
                const inst = state.instructores.find((i) => i.id === cl.instructorId);
                const sede = state.sedes.find((s) => s.id === cl.sedeId);
                const cancha = state.canchas.find((c) => c.id === cl.canchaId);
                return (
                  <div
                    key={cl.id}
                    className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2"
                  >
                    <div className="flex justify-between items-start gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PlayerAvatar
                          nombre={inst?.nombre || 'Instructor'}
                          seed={inst?.avatarSeed}
                          size="md"
                          shape="rounded"
                          isInstructor
                        />
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-[#5E8210]">
                            {cl.tipo} · {cl.estado}
                          </span>
                          <h3 className="text-sm font-extrabold text-[#1E2B45] truncate">
                            {cl.titulo}
                          </h3>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-[#273758] tabular-nums shrink-0">
                        B/. {cl.precioPorCupo.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Instructor: <strong>{inst?.nombre}</strong> · {sede?.nombre} ({cancha?.nombre})
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      {cl.fecha} · {formatHour12(cl.horaInicio)} ({cl.duracionMin} min)
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#4E7006] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Reserva demostrativa confirmada
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          openWhatsAppDemo(
                            inst?.nombre || 'Instructor',
                            `Consulta sobre la clase "${cl.titulo}" (${formatHour12(cl.horaInicio)}).`,
                            'Contacto instructor'
                          )
                        }
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
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
      </div>

      {/* Instructor Profile Modal */}
      {profileInstructor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3">
            <div className="flex items-center gap-3">
              <PlayerAvatar
                nombre={profileInstructor.nombre}
                seed={profileInstructor.avatarSeed}
                size="lg"
                isInstructor
              />
              <div>
                <h3 className="text-base font-extrabold text-[#1E2B45]">
                  {profileInstructor.nombre}
                </h3>
                <p className="text-xs text-slate-500">{profileInstructor.titulo}</p>
                <p className="text-xs font-bold text-[#5E8210]">
                  ★ {profileInstructor.rating} ({profileInstructor.resenasCount} valoraciones)
                </p>
              </div>
            </div>
            <div className="text-xs space-y-1.5 text-slate-600">
              <p>
                <strong>Certificaciones:</strong> {profileInstructor.certificaciones.join(', ')}
              </p>
              <p>
                <strong>Especialidades:</strong> {profileInstructor.especialidades.join(', ')}
              </p>
              <p>
                <strong>Tarifa base:</strong> B/. {profileInstructor.precioBase.toFixed(2)} / hora
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                openWhatsAppDemo(
                  profileInstructor.nombre,
                  `Consulta de disponibilidad y clases de tenis con ${profileInstructor.nombre}.`,
                  profileInstructor.titulo
                )
              }
              className="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-extrabold text-emerald-800 inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Contactar por WhatsApp (Demo)
            </button>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setProfileInstructor(null)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const inst = profileInstructor;
                  setProfileInstructor(null);
                  openBookModal(inst);
                }}
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B] cursor-pointer"
              >
                Reservar clase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simultaneous Cross-Availability Class Booking Modal */}
      {selectedInstructor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-[400px] max-h-[88dvh] overflow-y-auto rounded-3xl bg-white p-5 space-y-3.5">
            <div className="flex items-center gap-3">
              <PlayerAvatar
                nombre={selectedInstructor.nombre}
                seed={selectedInstructor.avatarSeed}
                size="md"
                isInstructor
                ringLime
              />
              <div>
                <h3 className="text-base font-extrabold text-[#1E2B45]">
                  Reservar clase con {selectedInstructor.nombre}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Disponibilidad de demostración entre instructor y cancha.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E2B45] mb-1">Sede autorizada</label>
              <select
                value={bookSedeId}
                onChange={(e) => {
                  const sId = e.target.value;
                  setBookSedeId(sId);
                  const firstCourt = state.canchas.find(
                    (c) => c.sedeId === sId && c.estado === 'Disponible'
                  );
                  setBookCanchaId(firstCourt?.id || '');
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
              >
                {selectedInstructor.sedesAutorizadas.map((sId) => {
                  const s = state.sedes.find((x) => x.id === sId);
                  return (
                    <option key={sId} value={sId}>
                      {s?.nombre}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">Cancha</label>
                <select
                  value={bookCanchaId}
                  onChange={(e) => setBookCanchaId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                >
                  {state.canchas
                    .filter((c) => c.sedeId === bookSedeId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.estado})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">Tipo de clase</label>
                <select
                  value={bookTipo}
                  onChange={(e) => setBookTipo(e.target.value as ClaseProgramada['tipo'])}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                >
                  <option value="Individual">Individual</option>
                  <option value="Pareja">En pareja</option>
                  <option value="Grupal">Grupal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E2B45] mb-1">Fecha</label>
              <select
                value={bookFecha}
                onChange={(e) => setBookFecha(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
              >
                {DEMO_DATES.map((d) => (
                  <option key={d.iso} value={d.iso}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-bold text-[#1E2B45] mb-1.5">
                Horarios disponibles
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {crossAvailability.map((item) => (
                  <button
                    key={item.slot}
                    type="button"
                    disabled={!item.available}
                    title={item.reason}
                    onClick={() => setBookHora(item.slot)}
                    className={`rounded-xl py-2 text-xs font-bold tabular-nums cursor-pointer ${
                      !item.available
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                        : bookHora === item.slot
                          ? 'bg-[#273758] text-white'
                          : 'bg-[#F7FCEB] border border-[#ACD638] text-[#1E2B45]'
                    }`}
                  >
                    {formatHour12(item.slot)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E2B45] mb-1">
                Modalidad de pago ejemplo
              </label>
              <select
                value={bookMetodo}
                onChange={(e) => setBookMetodo(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                <option value="Transferencia bancaria (Ejemplo)">
                  Transferencia (Ejemplo) · B/. {selectedInstructor.precioBase.toFixed(2)}
                </option>
                <option value="Pago móvil en club (Ejemplo)">
                  Pago móvil en club (Ejemplo) · B/. {selectedInstructor.precioBase.toFixed(2)}
                </option>
              </select>
            </div>

            {bookError && <p className="text-xs font-bold text-rose-600">{bookError}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedInstructor(null)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = bookClass({
                    instructorId: selectedInstructor.id,
                    sedeId: bookSedeId,
                    canchaId: bookCanchaId,
                    tipo: bookTipo,
                    fecha: bookFecha,
                    horaInicio: bookHora,
                    duracionMin: 60,
                    metodoPago: bookMetodo,
                  });
                  if (!res.ok) {
                    setBookError(res.error || 'No disponible');
                  } else {
                    setSelectedInstructor(null);
                    setTab('misclases');
                  }
                }}
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B] cursor-pointer"
              >
                Confirmar clase demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
