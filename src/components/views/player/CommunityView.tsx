import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  MessageCircle,
  Plus,
  Star,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { DEMO_DATES, TIME_SLOTS } from '../../../data/seedData';
import type { Modality, SkillLevel } from '../../../types/tennis';
import { formatHour12 } from '../../../utils/tennisLogic';
import { HeaderBar } from '../../HeaderBar';
import { CourtScene, PlayerAvatar } from '../../VisualAssets';

const getCommunityMatchPhoto = (modalidad: Modality, destacado?: boolean) => {
  if (modalidad === 'Individual') {
    return {
      src: '/assets/photos/comunidad/partido_03.webp',
      alt: 'Jugador en acción durante partido de tenis',
    };
  }
  if (destacado || modalidad === 'Dobles') {
    return {
      src: '/assets/photos/comunidad/partido_02.webp',
      alt: 'Grupo de cuatro jugadores de dobles en cancha',
    };
  }
  return {
    src: '/assets/photos/comunidad/partido_01.webp',
    alt: 'Jugadores compartiendo encuentro deportivo en comunidad',
  };
};

interface CommunityViewProps {
  preselectedReservaForConvocatoria?: string | null;
  onClearPreselectedReserva: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  preselectedReservaForConvocatoria,
  onClearPreselectedReserva,
  onOpenMenu,
  onOpenNotifications,
}) => {
  const {
    state,
    currentUser,
    joinConvocatoria,
    leaveConvocatoria,
    inviteToConvocatoria,
    approvePendingPlayer,
    createConvocatoria,
    openWhatsAppDemo,
  } = useApp();

  const [subTab, setSubTab] = useState<'abiertos' | 'actividad'>('abiertos');
  const [nivelFilter, setNivelFilter] = useState<'Todos' | SkillLevel>('Todos');
  const [sedeFilter, setSedeFilter] = useState<string>('Todas');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [invitePickerId, setInvitePickerId] = useState<string>('');

  const [showCreateConvModal, setShowCreateConvModal] = useState(
    Boolean(preselectedReservaForConvocatoria)
  );

  // Create Match form (con reserva confirmada o partido rápido demo)
  const myConfirmedReservas = state.reservas.filter(
    (r) => r.usuarioId === currentUser.id && r.estado === 'Confirmada'
  );
  const [useExistingReserva, setUseExistingReserva] = useState(myConfirmedReservas.length > 0);
  const [convReservaId, setConvReservaId] = useState(
    preselectedReservaForConvocatoria || myConfirmedReservas[0]?.id || ''
  );
  const [convSedeId, setConvSedeId] = useState(state.sedes[0].id);
  const [convFecha, setConvFecha] = useState(DEMO_DATES[0].iso);
  const [convHora, setConvHora] = useState('18:00');
  const [convTitulo, setConvTitulo] = useState('Partido de Dobles – Nivel Intermedio');
  const [convModalidad, setConvModalidad] = useState<Modality>('Dobles');
  const [convNivel, setConvNivel] = useState<SkillLevel>('Intermedio');
  const [convCupo, setConvCupo] = useState(4);
  const [convAporte, setConvAporte] = useState(8);
  const [convAuto, setConvAuto] = useState(false);

  const filteredConvs = useMemo(() => {
    return state.convocatorias.filter((c) => {
      if (subTab === 'actividad') {
        const involved =
          c.organizadorId === currentUser.id ||
          c.jugadoresIds.includes(currentUser.id) ||
          c.invitadosIds.includes(currentUser.id) ||
          c.pendientesAprobacionIds.includes(currentUser.id);
        if (!involved) return false;
      }
      if (nivelFilter !== 'Todos' && c.nivel !== nivelFilter) return false;
      if (sedeFilter !== 'Todas' && c.sedeId !== sedeFilter) return false;
      return true;
    });
  }, [state.convocatorias, subTab, nivelFilter, sedeFilter, currentUser.id]);

  const featuredMatch =
    filteredConvs.find((c) => c.destacado) || filteredConvs[0] || null;
  const moreMatches = filteredConvs.filter((c) => c.id !== featuredMatch?.id);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof moreMatches> = {};
    moreMatches.forEach((m) => {
      if (!groups[m.fecha]) groups[m.fecha] = [];
      groups[m.fecha].push(m);
    });
    return Object.entries(groups);
  }, [moreMatches]);

  const selectedConv = state.convocatorias.find((c) => c.id === selectedConvId);

  const otherPlayers = useMemo(
    () =>
      state.usuarios.filter(
        (u) => u.rol === 'jugador' && u.id !== currentUser.id
      ),
    [state.usuarios, currentUser.id]
  );

  const handleSubmitConv = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createConvocatoria({
      reservaId: useExistingReserva && convReservaId ? convReservaId : undefined,
      sedeId: convSedeId,
      fecha: convFecha,
      horaInicio: convHora,
      titulo: convTitulo,
      nivel: convNivel,
      modalidad: convModalidad,
      cupoTotal: convCupo,
      aportePorJugador: convAporte,
      descripcion: 'Partido creado en Comunidad Essential 2K.',
      aprobacionAutomatica: convAuto,
    });
    if (res.ok) {
      setShowCreateConvModal(false);
      onClearPreselectedReserva();
      if (res.convocatoria) setSelectedConvId(res.convocatoria.id);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        variant="net"
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
      >
        <div className="pb-1">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Comunidad</h1>
            <p className="text-xs text-white/85 flex items-center gap-1.5 mt-0.5">
              <Users className="w-3.5 h-3.5 text-[#ACD638]" />
              <span>Crea partidos, invita jugadores y confirma participantes</span>
            </p>
          </div>

          <div className="mt-3 rounded-full bg-white p-1 grid grid-cols-2 gap-1 shadow-sm">
            <button
              type="button"
              onClick={() => setSubTab('abiertos')}
              className={`rounded-full py-2 text-xs font-extrabold transition cursor-pointer ${
                subTab === 'abiertos'
                  ? 'bg-[#B6E22E] text-[#16223B]'
                  : 'text-[#273758] hover:bg-slate-100'
              }`}
            >
              Partidos abiertos
            </button>
            <button
              type="button"
              onClick={() => setSubTab('actividad')}
              className={`rounded-full py-2 text-xs font-extrabold transition cursor-pointer ${
                subTab === 'actividad'
                  ? 'bg-[#B6E22E] text-[#16223B]'
                  : 'text-[#273758] hover:bg-slate-100'
              }`}
            >
              Mis partidos e invitaciones
            </button>
          </div>
        </div>
      </HeaderBar>

      <div className="flex-1 p-4 space-y-4 pb-8">
        {/* Crear partido CTA */}
        <button
          type="button"
          onClick={() => setShowCreateConvModal(true)}
          className="w-full rounded-2xl bg-[#B6E22E] hover:bg-[#ACD638] py-3.5 px-4 text-sm font-extrabold text-[#16223B] flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
        >
          <Plus className="w-4 h-4" />
          <span>Crear partido e invitar jugadores</span>
        </button>

        {/* Banner + Filters */}
        <div>
          <div className="rounded-2xl overflow-hidden bg-[#172442] text-white shadow-sm relative min-h-[92px] flex items-stretch">
            <div className="w-[60%] p-3.5 z-10 flex flex-col justify-center">
              <span className="text-[10px] font-extrabold tracking-wider text-[#B6E22E] uppercase">
                {subTab === 'actividad' ? 'Tu actividad' : 'Partidos activos'}
              </span>
              <h2 className="mt-0.5 text-lg font-extrabold leading-tight">
                {subTab === 'actividad' ? 'Mis partidos' : 'Partidos abiertos'}
              </h2>
              <p className="mt-0.5 text-[11px] text-white/85 leading-snug">
                Consulta la información y confirma participantes en un clic.
              </p>
            </div>
            <div className="w-[46%] -ml-6 relative overflow-hidden shrink-0">
              <img
                src={
                  subTab === 'actividad'
                    ? '/assets/photos/comunidad/partido_03.webp'
                    : '/assets/photos/comunidad/partido_01.webp'
                }
                alt="Jugadores en partido comunitario"
                decoding="async"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#172442] via-[#172442]/40 to-transparent" />
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <select
              aria-label="Filtrar partidos por nivel"
              value={nivelFilter}
              onChange={(e) => setNivelFilter(e.target.value as 'Todos' | SkillLevel)}
              className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#1E2B45] border border-slate-200"
            >
              <option value="Todos">Nivel: Todos</option>
              <option value="Principiante">Principiante</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
            </select>
            <select
              aria-label="Filtrar partidos por sede"
              value={sedeFilter}
              onChange={(e) => setSedeFilter(e.target.value)}
              className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#1E2B45] border border-slate-200"
            >
              <option value="Todas">Sede: Todas</option>
              {state.sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Featured Match */}
        {featuredMatch && (
          <div className="rounded-2xl bg-[#1D2D4E] text-white shadow-md overflow-hidden relative flex">
            <img
              src="/assets/photos/fondos/fondo_03.webp"
              alt=""
              aria-hidden="true"
              decoding="async"
              className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover object-left opacity-25"
            />
            <div className="w-[62%] p-3.5 z-10 flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#B6E22E] px-2 py-0.5 text-[10px] font-extrabold text-[#16223B]">
                  <Star className="w-3 h-3 fill-current" /> PARTIDO DESTACADO
                </span>
                <h3 className="mt-2 text-base font-extrabold leading-snug">
                  {featuredMatch.titulo}
                </h3>
                <div className="mt-1.5 space-y-1 text-[11px] text-white/85">
                  <p className="flex items-center gap-1.5 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-[#ACD638]" />
                    {DEMO_DATES.find((d) => d.iso === featuredMatch.fecha)?.label ||
                      featuredMatch.fecha}{' '}
                    · {formatHour12(featuredMatch.horaInicio)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ACD638]" />
                    {state.sedes.find((s) => s.id === featuredMatch.sedeId)?.nombre}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex items-center -space-x-2">
                      {featuredMatch.jugadoresIds.slice(0, 4).map((uid) => {
                        const u = state.usuarios.find((x) => x.id === uid);
                        return (
                          <PlayerAvatar
                            key={uid}
                            nombre={u?.nombre || 'Jugador'}
                            seed={u?.avatarSeed}
                            avatarUrl={u?.avatarUrl}
                            size="xs"
                            ringLime={uid === featuredMatch.organizadorId}
                          />
                        );
                      })}
                    </div>
                    <p className="flex items-center gap-1.5 tabular-nums">
                      <span>
                        {featuredMatch.jugadoresIds.length}/{featuredMatch.cupoTotal} confirmados
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => joinConvocatoria(featuredMatch.id)}
                  className="rounded-xl bg-[#B6E22E] px-3.5 py-2 text-xs font-extrabold text-[#16223B] cursor-pointer"
                >
                  {featuredMatch.jugadoresIds.includes(currentUser.id)
                    ? 'Confirmado'
                    : featuredMatch.pendientesAprobacionIds.includes(currentUser.id)
                      ? 'Pendiente'
                      : 'Unirme'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedConvId(featuredMatch.id)}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#1E2B45] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  Detalles
                </button>
              </div>
            </div>
            <div
              className="w-[44%] -ml-4 relative"
              style={{ clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)' }}
            >
              <CourtScene
                sedeId={featuredMatch.sedeId}
                isPublic={
                  state.sedes.find((s) => s.id === featuredMatch.sedeId)?.tipo === 'Pública'
                }
                variant="night-club"
                clubLabel={
                  state.sedes.find((s) => s.id === featuredMatch.sedeId)?.nombre ||
                  'Tenis Club Panamá'
                }
                eager
              />
            </div>
          </div>
        )}

        {/* List of matches */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-[#1E2B45]">Partidos disponibles</h3>
          {groupedByDate.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-xs text-slate-500 shadow-sm">
              No hay más partidos con los filtros seleccionados.
            </div>
          ) : (
            groupedByDate.map(([fecha, matches]) => {
              const dLabel = DEMO_DATES.find((d) => d.iso === fecha)?.label || fecha;
              return (
                <div key={fecha} className="space-y-2">
                  <p className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">
                    {dLabel}
                  </p>
                  {matches.map((m) => {
                    const sede = state.sedes.find((s) => s.id === m.sedeId);
                    const joined = m.jugadoresIds.includes(currentUser.id);
                    const invited = m.invitadosIds.includes(currentUser.id);
                    const full = m.jugadoresIds.length >= m.cupoTotal;
                    const matchPhoto = getCommunityMatchPhoto(m.modalidad, m.destacado);
                    return (
                      <div
                        key={m.id}
                        className="rounded-2xl bg-white p-2.5 shadow-sm border border-slate-100 flex items-center justify-between gap-2.5"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedConvId(m.id)}
                          className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#172442] shrink-0">
                            <img
                              src={matchPhoto.src}
                              alt={matchPhoto.alt}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover object-top"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#131F3A]/65 via-transparent to-transparent" />
                            <span className="absolute bottom-1 left-1 right-1 text-[8.5px] font-extrabold text-white/95 truncate text-center">
                              {m.modalidad}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-extrabold text-[#1E2B45] truncate">
                                {m.titulo}
                              </h4>
                              {invited && (
                                <span className="rounded bg-[#ECFCCB] px-1.5 py-0.5 text-[9px] font-extrabold text-[#4E7006] shrink-0">
                                  Invitado
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="flex items-center -space-x-1.5 shrink-0">
                                {m.jugadoresIds.slice(0, 4).map((uid) => {
                                  const u = state.usuarios.find((x) => x.id === uid);
                                  return (
                                    <PlayerAvatar
                                      key={uid}
                                      nombre={u?.nombre || 'Jugador'}
                                      seed={u?.avatarSeed}
                                      avatarUrl={u?.avatarUrl}
                                      size="xs"
                                    />
                                  );
                                })}
                              </div>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 tabular-nums truncate">
                                <Clock className="w-3 h-3" />
                                {formatHour12(m.horaInicio)} · {m.jugadoresIds.length}/{m.cupoTotal}
                              </p>
                            </div>
                            <p className="text-[10.5px] text-slate-500 truncate mt-1">
                              {sede?.nombre} · B/. {m.aportePorJugador.toFixed(2)}
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedConvId(m.id)}
                          className={`shrink-0 rounded-xl px-3 py-2 text-xs font-extrabold cursor-pointer ${
                            joined
                              ? 'bg-[#273758] text-white'
                              : full
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-[#B6E22E] text-[#16223B]'
                          }`}
                        >
                          {joined ? 'Ver' : invited ? 'Confirmar' : full ? 'Completo' : 'Ver'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Match Detail Modal (Info + Confirmar Participantes + Invitar + WhatsApp) */}
      {selectedConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-[410px] max-h-[88dvh] overflow-y-auto rounded-3xl bg-white p-5 space-y-4">
            <div className="relative h-24 rounded-2xl overflow-hidden bg-[#172442]">
              <img
                src={getCommunityMatchPhoto(selectedConv.modalidad, selectedConv.destacado).src}
                alt={getCommunityMatchPhoto(selectedConv.modalidad, selectedConv.destacado).alt}
                decoding="async"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131F3A]/90 via-[#131F3A]/35 to-transparent" />
              <span className="absolute top-2.5 left-3 rounded-lg bg-[#B6E22E] px-2 py-0.5 text-[10px] font-extrabold text-[#16223B]">
                {selectedConv.estado}
              </span>
              <button
                type="button"
                onClick={() => setSelectedConvId(null)}
                className="absolute top-2 right-2 rounded-lg bg-black/45 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 cursor-pointer"
              >
                Cerrar
              </button>
              <div className="absolute bottom-2 left-3 right-3 text-white">
                <h3 className="text-sm font-extrabold leading-tight truncate">
                  {selectedConv.titulo}
                </h3>
                <p className="text-[11px] text-white/85 truncate">
                  {state.sedes.find((s) => s.id === selectedConv.sedeId)?.nombre} ·{' '}
                  {DEMO_DATES.find((d) => d.iso === selectedConv.fecha)?.label || selectedConv.fecha}{' '}
                  · {formatHour12(selectedConv.horaInicio)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">{selectedConv.descripcion}</p>

            {/* Información del partido */}
            <div className="rounded-xl bg-[#F4F6F9] p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Organizador</span>
                <span className="font-bold text-[#1E2B45]">
                  {state.usuarios.find((u) => u.id === selectedConv.organizadorId)?.nombre}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Modalidad / Nivel</span>
                <span className="font-bold text-[#1E2B45]">
                  {selectedConv.modalidad} · {selectedConv.nivel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Participantes confirmados</span>
                <span className="font-bold text-[#1E2B45]">
                  {selectedConv.jugadoresIds.length}/{selectedConv.cupoTotal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Aporte referencial</span>
                <span className="font-bold text-[#1E2B45] tabular-nums">
                  B/. {selectedConv.aportePorJugador.toFixed(2)} por jugador
                </span>
              </div>
            </div>

            {/* Participantes confirmados */}
            <div>
              <h4 className="text-xs font-extrabold text-[#1E2B45] mb-1.5">
                Participantes confirmados
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedConv.jugadoresIds.map((uid) => {
                  const u = state.usuarios.find((x) => x.id === uid);
                  return (
                    <span
                      key={uid}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F6F9] pl-1 pr-2.5 py-0.5 border border-slate-200 text-xs font-bold text-[#1E2B45]"
                    >
                      <PlayerAvatar
                        nombre={u?.nombre || 'Jugador'}
                        seed={u?.avatarSeed}
                        avatarUrl={u?.avatarUrl}
                        size="xs"
                        ringLime={uid === selectedConv.organizadorId}
                      />
                      <span>{u?.nombre || 'Jugador'}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Invitados / Confirmar participación */}
            {selectedConv.invitadosIds.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-extrabold text-[#1E2B45]">
                  Jugadores invitados ({selectedConv.invitadosIds.length})
                </h4>
                {selectedConv.invitadosIds.map((uid) => {
                  const u = state.usuarios.find((x) => x.id === uid);
                  const canConfirm =
                    uid === currentUser.id || selectedConv.organizadorId === currentUser.id;
                  return (
                    <div
                      key={uid}
                      className="flex items-center justify-between text-xs bg-[#F9FAFB] p-2 rounded-xl border border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <PlayerAvatar
                          nombre={u?.nombre || 'Jugador'}
                          seed={u?.avatarSeed}
                          size="xs"
                        />
                        <span className="font-bold text-[#1E2B45]">{u?.nombre}</span>
                      </div>
                      {canConfirm && (
                        <button
                          type="button"
                          onClick={() => approvePendingPlayer(selectedConv.id, uid, true)}
                          className="rounded-lg bg-[#B6E22E] px-2.5 py-1 text-[11px] font-extrabold text-[#16223B] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Confirmar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Solicitudes pendientes por confirmar */}
            {selectedConv.pendientesAprobacionIds.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-extrabold text-[#1E2B45]">
                  Por confirmar ({selectedConv.pendientesAprobacionIds.length})
                </h4>
                {selectedConv.pendientesAprobacionIds.map((uid) => {
                  const u = state.usuarios.find((x) => x.id === uid);
                  return (
                    <div
                      key={uid}
                      className="flex items-center justify-between text-xs bg-amber-50 p-2 rounded-xl border border-amber-100"
                    >
                      <div className="flex items-center gap-2">
                        <PlayerAvatar
                          nombre={u?.nombre || 'Jugador'}
                          seed={u?.avatarSeed}
                          size="xs"
                        />
                        <span className="font-bold text-[#1E2B45]">{u?.nombre}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => approvePendingPlayer(selectedConv.id, uid, true)}
                          className="rounded-lg bg-[#ACD638] px-2.5 py-1 text-[11px] font-bold text-[#16223B] cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => approvePendingPlayer(selectedConv.id, uid, false)}
                          className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 cursor-pointer"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Invitar jugadores (lista demo + WhatsApp visual) */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <h4 className="text-xs font-extrabold text-[#1E2B45] flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-[#273758]" />
                Invitar jugadores al partido
              </h4>
              <div className="flex gap-2">
                <select
                  aria-label="Seleccionar jugador demo para invitar"
                  value={invitePickerId || otherPlayers[0]?.id || ''}
                  onChange={(e) => setInvitePickerId(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-[#1E2B45]"
                >
                  {otherPlayers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.nivel})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    inviteToConvocatoria(
                      selectedConv.id,
                      invitePickerId || otherPlayers[0]?.id || ''
                    )
                  }
                  className="rounded-xl bg-[#273758] px-3 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  Invitar
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  openWhatsAppDemo(
                    `Organizador · ${
                      state.usuarios.find((u) => u.id === selectedConv.organizadorId)?.nombre ||
                      'Jugador'
                    }`,
                    `Coordinación del partido "${selectedConv.titulo}" (${formatHour12(
                      selectedConv.horaInicio
                    )}).`,
                    'Invitación y contacto por WhatsApp'
                  )
                }
                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 py-2 text-xs font-extrabold text-emerald-800 inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Coordinar / invitar por WhatsApp (Demo)
              </button>
            </div>

            <div className="flex gap-2">
              {selectedConv.jugadoresIds.includes(currentUser.id) ? (
                <button
                  type="button"
                  onClick={() => leaveConvocatoria(selectedConv.id)}
                  className="flex-1 rounded-xl border border-rose-200 py-2.5 text-xs font-bold text-rose-700 cursor-pointer"
                >
                  Salir del partido
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => joinConvocatoria(selectedConv.id)}
                  className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B] cursor-pointer"
                >
                  Unirme al partido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear partido */}
      {showCreateConvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <form
            onSubmit={handleSubmitConv}
            className="w-full max-w-[390px] rounded-3xl bg-white p-5 space-y-3"
          >
            <h3 className="text-base font-extrabold text-[#1E2B45]">
              Crear partido en Comunidad
            </h3>

            {myConfirmedReservas.length > 0 && (
              <label className="flex items-center gap-2 text-xs font-semibold text-[#1E2B45] cursor-pointer">
                <input
                  type="checkbox"
                  checked={useExistingReserva}
                  onChange={(e) => setUseExistingReserva(e.target.checked)}
                />
                Asociar a una reserva confirmada
              </label>
            )}

            {useExistingReserva && myConfirmedReservas.length > 0 ? (
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">
                  Reserva confirmada
                </label>
                <select
                  value={convReservaId}
                  onChange={(e) => setConvReservaId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  {myConfirmedReservas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.codigo} · {r.fecha} {formatHour12(r.horaInicio)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-[#1E2B45] mb-1">Sede</label>
                  <select
                    value={convSedeId}
                    onChange={(e) => setConvSedeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    {state.sedes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={convFecha}
                    onChange={(e) => setConvFecha(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    {DEMO_DATES.map((d) => (
                      <option key={d.iso} value={d.iso}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={convHora}
                    onChange={(e) => setConvHora(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {formatHour12(t)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#1E2B45] mb-1">Título</label>
              <input
                type="text"
                value={convTitulo}
                onChange={(e) => setConvTitulo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">Modalidad</label>
                <select
                  value={convModalidad}
                  onChange={(e) => {
                    const mod = e.target.value as Modality;
                    setConvModalidad(mod);
                    setConvCupo(mod === 'Individual' ? 2 : 4);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  <option value="Dobles">Dobles (4)</option>
                  <option value="Dobles mixto">Dobles mixto (4)</option>
                  <option value="Individual">Individual (2)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">Nivel</label>
                <select
                  value={convNivel}
                  onChange={(e) => setConvNivel(e.target.value as SkillLevel)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">
                  Aporte/jugador (B/.)
                </label>
                <input
                  type="number"
                  min={0}
                  value={convAporte}
                  onChange={(e) => setConvAporte(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <label className="flex items-center gap-2 text-xs pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={convAuto}
                  onChange={(e) => setConvAuto(e.target.checked)}
                />
                Ingreso automático
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateConvModal(false);
                  onClearPreselectedReserva();
                }}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B] cursor-pointer"
              >
                Crear partido
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
