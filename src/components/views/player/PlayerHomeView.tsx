import React, { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  GraduationCap,
  Heart,
  MapPin,
  Pencil,
  Search,
  Star,
  Users,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { DEMO_DATES } from '../../../data/seedData';
import { formatHour12 } from '../../../utils/tennisLogic';
import { HeaderBar } from '../../HeaderBar';
import { CourtScene } from '../../VisualAssets';

export interface PlayerHomeNavProps {
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onNavigateTab: (tab: 'inicio' | 'reservas' | 'comunidad' | 'clases' | 'perfil') => void;
  onOpenExplore: (initialQuery?: string) => void;
  onOpenSedeDetail: (sedeId: string, canchaId?: string) => void;
  onOpenReservationDetail: (reservaId: string) => void;
}

export const PlayerHomeView: React.FC<PlayerHomeNavProps> = ({
  onOpenMenu,
  onOpenNotifications,
  onNavigateTab,
  onOpenExplore,
  onOpenSedeDetail,
  onOpenReservationDetail,
}) => {
  const { state, currentUser, toggleFavoriteSede, joinConvocatoria, updateUserPreferences } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const nextReservation = useMemo(() => {
    return (
      state.reservas.find(
        (r) =>
          r.usuarioId === currentUser.id &&
          (r.estado === 'Confirmada' || r.estado === 'En curso')
      ) ||
      state.reservas.find(
        (r) => r.usuarioId === currentUser.id && r.estado === 'Pendiente de aprobación'
      )
    );
  }, [state.reservas, currentUser.id]);

  const nextResSede = nextReservation
    ? state.sedes.find((s) => s.id === nextReservation.sedeId)
    : undefined;
  const nextResCancha = nextReservation
    ? state.canchas.find((c) => c.id === nextReservation.canchaId)
    : undefined;

  const openMatches = useMemo(() => {
    return state.convocatorias
      .filter((c) => c.estado === 'Abierta' || c.estado === 'Completa')
      .slice(0, 3);
  }, [state.convocatorias]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenExplore(searchQuery);
  };

  const firstName = currentUser.nombre.split(' ')[0];

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar onOpenMenu={onOpenMenu} onOpenNotifications={onOpenNotifications}>
        <div className="pt-1 pb-2">
          <h1 className="text-[26px] font-extrabold tracking-tight leading-tight text-white">
            Hola, {firstName}
          </h1>

          <div className="relative mt-0.5">
            <button
              type="button"
              onClick={() => setShowLocationPicker((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/95 hover:text-[#ACD638] transition cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-[#ACD638] shrink-0" />
              <span>
                {currentUser.distrito}, {currentUser.provincia}
              </span>
              <ChevronDown className="w-4 h-4 opacity-80" />
            </button>

            {showLocationPicker && (
              <div className="mt-2 rounded-2xl bg-white p-2 shadow-xl text-[#1E2B45] z-30 relative">
                {[
                  { prov: 'Panamá', dist: 'Ciudad de Panamá' },
                  { prov: 'Panamá Oeste', dist: 'La Chorrera' },
                  { prov: 'Chiriquí', dist: 'David' },
                ].map((loc) => (
                  <button
                    key={loc.prov}
                    type="button"
                    onClick={() => {
                      updateUserPreferences({ provincia: loc.prov, distrito: loc.dist });
                      setShowLocationPicker(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[#F4F6F9] flex items-center justify-between cursor-pointer"
                  >
                    <span>
                      {loc.dist}, {loc.prov}
                    </span>
                    {currentUser.provincia === loc.prov && (
                      <span className="text-[#6E9214] font-bold">Activo</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="mt-3.5">
            <label htmlFor="home-search" className="sr-only">
              Buscar canchas, clubes o clases
            </label>
            <div className="flex items-center rounded-full bg-white px-4 py-2.5 shadow-md">
              <Search className="w-4 h-4 text-[#273758] shrink-0" />
              <input
                id="home-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar clubes o canchas..."
                className="ml-2.5 w-full bg-transparent text-sm text-[#1E2B45] placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </form>

          {/* Hero Next Reservation Card */}
          <div className="mt-4 rounded-2xl bg-white text-[#1E2B45] shadow-lg overflow-hidden relative min-h-[154px] flex">
            <div className="w-[62%] p-3.5 z-10 flex flex-col justify-between bg-gradient-to-r from-white via-white to-white/90">
              {nextReservation && nextResSede && nextResCancha ? (
                <>
                  <div>
                    <div className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-wide text-[#273758]/80">
                      <Calendar className="w-3.5 h-3.5 text-[#273758]" />
                      <span>
                        {nextReservation.estado === 'Pendiente de aprobación'
                          ? 'PENDIENTE DE APROBACIÓN'
                          : 'TU PRÓXIMA RESERVA'}
                      </span>
                    </div>
                    <h2 className="mt-1 text-[15px] font-extrabold text-[#1E2B45] leading-snug">
                      {nextResCancha.nombre} – {nextResSede.nombre}
                    </h2>
                    <div className="mt-1.5 space-y-0.5 text-[11.5px] text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {DEMO_DATES.find((d) => d.iso === nextReservation.fecha)?.label ||
                            nextReservation.fecha}
                        </span>
                        <span className="text-slate-300">|</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="tabular-nums">
                          {formatHour12(nextReservation.horaInicio)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {nextReservation.modalidad} ({nextReservation.participantes.length} jug.)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenReservationDetail(nextReservation.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#B6E22E] hover:bg-[#ACD638] px-3 py-2 text-xs font-extrabold text-[#16223B] transition cursor-pointer whitespace-nowrap"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Ver detalles</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('reservas')}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#EEF2F6] hover:bg-slate-200 px-2.5 py-2 text-xs font-bold text-[#273758] transition cursor-pointer whitespace-nowrap"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Mis reservas</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <p className="text-[11px] font-bold text-[#273758]/70">SIN RESERVA ACTIVA</p>
                    <h2 className="mt-1 text-base font-extrabold text-[#1E2B45]">
                      ¿Listo para tu próximo set?
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Explora nuestras {state.sedes.length} sedes disponibles en la demostración.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenExplore()}
                    className="mt-3 self-start inline-flex items-center gap-1 rounded-xl bg-[#B6E22E] px-3.5 py-2 text-xs font-extrabold text-[#16223B] cursor-pointer"
                  >
                    <span>Reservar cancha</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div
              className="w-[44%] -ml-4 relative overflow-hidden"
              style={{ clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)' }}
            >
              <CourtScene
                sedeId={nextResSede?.id}
                isPublic={nextResSede?.tipo === 'Pública'}
                variant={nextResSede?.imagenVariant || 'night-club'}
                clubLabel={nextResSede?.nombre || 'TENIS CLUB PANAMÁ'}
                eager
              />
            </div>
          </div>

          {/* 4 Quick Action Cards (Essential 2K) */}
          <div className="mt-3.5 grid grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => onOpenExplore()}
              className="rounded-2xl bg-white py-3 px-1.5 flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow-md active:scale-[0.98] transition cursor-pointer"
            >
              <span className="w-9 h-9 rounded-full bg-[#ACD638]/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" fill="#B6E22E" stroke="#1E2B45" strokeWidth="1.6" />
                  <path d="M6.5 6.5 Q12 12 6.5 17.5" fill="none" stroke="#1E2B45" strokeWidth="1.4" />
                  <path d="M17.5 6.5 Q12 12 17.5 17.5" fill="none" stroke="#1E2B45" strokeWidth="1.4" />
                </svg>
              </span>
              <span className="text-[11px] font-bold text-[#1E2B45] text-center leading-tight">
                Reservar cancha
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('reservas')}
              className="rounded-2xl bg-white py-3 px-1.5 flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow-md active:scale-[0.98] transition cursor-pointer"
            >
              <span className="w-9 h-9 rounded-full bg-[#ACD638]/20 flex items-center justify-center text-[#273758]">
                <Calendar className="w-5 h-5 stroke-[2.2]" />
              </span>
              <span className="text-[11px] font-bold text-[#1E2B45] text-center leading-tight">
                Mis reservas
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('comunidad')}
              className="rounded-2xl bg-white py-3 px-1.5 flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow-md active:scale-[0.98] transition cursor-pointer"
            >
              <span className="w-9 h-9 rounded-full bg-[#ACD638]/20 flex items-center justify-center text-[#273758]">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </span>
              <span className="text-[11px] font-bold text-[#1E2B45] text-center leading-tight">
                Comunidad
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('clases')}
              className="rounded-2xl bg-white py-3 px-1.5 flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow-md active:scale-[0.98] transition cursor-pointer"
            >
              <span className="w-9 h-9 rounded-full bg-[#ACD638]/20 flex items-center justify-center text-[#273758]">
                <GraduationCap className="w-5 h-5 stroke-[2.2]" />
              </span>
              <span className="text-[11px] font-bold text-[#1E2B45] text-center leading-tight">
                Clases
              </span>
            </button>
          </div>
        </div>
      </HeaderBar>

      {/* Main Content */}
      <div className="flex-1 bg-[#F4F6F9] px-4 pt-4 pb-6 space-y-5">
        <section aria-labelledby="sec-clubes">
          <div className="flex items-center justify-between mb-2.5">
            <h2 id="sec-clubes" className="text-lg font-extrabold text-[#1E2B45]">
              Clubes disponibles ({state.sedes.length})
            </h2>
            <button
              type="button"
              onClick={() => onOpenExplore()}
              className="inline-flex items-center gap-0.5 text-xs font-bold text-[#5E8210] hover:underline cursor-pointer"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {state.sedes.map((sede) => {
              const isFav = currentUser.favoritosSedes.includes(sede.id);
              const sedeCourts = state.canchas.filter((c) => c.sedeId === sede.id);
              const minPrice = Math.min(...sedeCourts.map((c) => c.precioHora));
              return (
                <div
                  key={sede.id}
                  className="w-[172px] shrink-0 rounded-2xl bg-white shadow-sm overflow-hidden border border-slate-100 flex flex-col"
                >
                  <div className="relative h-24">
                    <button
                      type="button"
                      onClick={() => onOpenSedeDetail(sede.id)}
                      className="w-full h-full block text-left cursor-pointer"
                      aria-label={`Ver detalles de ${sede.nombre}`}
                    >
                      <CourtScene
                        sedeId={sede.id}
                        isPublic={sede.tipo === 'Pública'}
                        variant={sede.imagenVariant}
                        clubLabel={sede.nombre}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavoriteSede(sede.id)}
                      aria-label={isFav ? `Quitar ${sede.nombre} de favoritos` : `Guardar ${sede.nombre} en favoritos`}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center text-white cursor-pointer"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isFav ? 'fill-[#ACD638] text-[#ACD638]' : 'text-white'
                        }`}
                      />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenSedeDetail(sede.id)}
                    className="p-2.5 text-left flex-1 flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <h3 className="text-xs font-extrabold text-[#1E2B45] truncate">
                        {sede.nombre}
                      </h3>
                      <p className="mt-0.5 text-[10.5px] text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{sede.distrito}</span>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-0.5 font-bold text-[#1E2B45]">
                        <Star className="w-3.5 h-3.5 fill-[#ACD638] text-[#ACD638]" />
                        {sede.rating}
                        <span className="font-normal text-slate-400">({sede.resenasCount})</span>
                      </span>
                      <span className="font-bold text-[#273758] tabular-nums">
                        {`B/. ${minPrice}`}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="sec-partidos">
          <div className="flex items-start justify-between mb-2.5">
            <div>
              <h2 id="sec-partidos" className="text-lg font-extrabold text-[#1E2B45]">
                Partidos e invitaciones
              </h2>
              <p className="text-xs text-slate-500">
                Únete o confirma participantes en tu nivel
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('comunidad')}
              className="inline-flex items-center gap-0.5 text-xs font-bold text-[#5E8210] hover:underline cursor-pointer pt-1"
            >
              <span>Ver más</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            {openMatches.map((match) => {
              const dObj = DEMO_DATES.find((d) => d.iso === match.fecha);
              const sede = state.sedes.find((s) => s.id === match.sedeId);
              const joined = match.jugadoresIds.includes(currentUser.id);
              const isFull = match.jugadoresIds.length >= match.cupoTotal;
              return (
                <div
                  key={match.id}
                  className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 py-1.5 rounded-xl bg-[#F4F6F9] text-center shrink-0">
                      <span className="block text-[9px] font-bold text-slate-500 uppercase">
                        {dObj?.dow || 'VIE'}
                      </span>
                      <span className="block text-base font-extrabold text-[#1E2B45] leading-none tabular-nums">
                        {dObj?.day || '27'}
                      </span>
                      <span className="block text-[9px] font-bold text-slate-500 uppercase">
                        {dObj?.month || 'NOV'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-extrabold text-[#1E2B45] truncate">
                        {match.titulo}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock className="w-3 h-3" />
                          {formatHour12(match.horaInicio)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Users className="w-3 h-3" />
                          {match.jugadoresIds.length}/{match.cupoTotal} jugadores
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{sede?.nombre}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => joinConvocatoria(match.id)}
                    className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-extrabold transition cursor-pointer ${
                      joined
                        ? 'bg-[#273758] text-white'
                        : isFull
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-[#B6E22E] hover:bg-[#ACD638] text-[#16223B]'
                    }`}
                  >
                    {joined ? 'Inscrito' : isFull ? 'Completo' : 'Unirme'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
