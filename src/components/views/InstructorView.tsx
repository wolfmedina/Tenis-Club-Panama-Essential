import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  MessageCircle,
  Plus,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEMO_DATES, TIME_SLOTS } from '../../data/seedData';
import type { ClaseProgramada } from '../../types/tennis';
import { formatHour12 } from '../../utils/tennisLogic';
import { HeaderBar } from '../HeaderBar';
import { PlayerAvatar } from '../VisualAssets';

export type InstructorTab = 'agenda' | 'clases' | 'horarios' | 'alumnos' | 'perfil';

interface InstructorViewProps {
  activeTab: InstructorTab;
  onChangeTab: (tab: InstructorTab) => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
}

export const InstructorView: React.FC<InstructorViewProps> = ({
  activeTab,
  onChangeTab,
  onOpenMenu,
  onOpenNotifications,
}) => {
  const {
    state,
    currentUser,
    switchRole,
    toggleClassAttendance,
    createInstructorClass,
    updateInstructorProfile,
    openWhatsAppDemo,
    logout,
    showToast,
  } = useApp();

  const instProfile =
    state.instructores.find((i) => i.usuarioId === currentUser.id) || state.instructores[0];
  const myClases = state.clases.filter((c) => c.instructorId === instProfile.id);

  const [selectedDate, setSelectedDate] = useState(DEMO_DATES[0].iso);
  const [newTitulo, setNewTitulo] = useState('Clínica de Saque y Volea');
  const [newTipo, setNewTipo] = useState<ClaseProgramada['tipo']>('Grupal');
  const [newSedeId, setNewSedeId] = useState(instProfile.sedesAutorizadas[0] || state.sedes[0].id);
  const [newCanchaId, setNewCanchaId] = useState(
    state.canchas.find((c) => c.sedeId === newSedeId && c.estado === 'Disponible')?.id || ''
  );
  const [newFecha, setNewFecha] = useState(DEMO_DATES[0].iso);
  const [newHora, setNewHora] = useState('15:00');
  const [formErr, setFormErr] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const totalAlumnos = myClases.reduce((s, c) => s + c.alumnosIds.length, 0);
  const totalAsistencias = myClases.reduce((s, c) => s + c.asistenciaIds.length, 0);

  const agendaClases = useMemo(
    () =>
      myClases
        .filter((cl) => cl.fecha === selectedDate)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
    [myClases, selectedDate]
  );

  const handleToggleSlot = (slot: string) => {
    const exists = instProfile.horariosDisponibles.includes(slot);
    const next = exists
      ? instProfile.horariosDisponibles.filter((h) => h !== slot)
      : [...instProfile.horariosDisponibles, slot].sort();
    updateInstructorProfile(instProfile.id, { horariosDisponibles: next });
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        variant="net"
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
      >
        <div className="pb-1">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#B6E22E] px-2.5 py-0.5 text-[10px] font-extrabold text-[#16223B]">
              PORTAL MÓVIL INSTRUCTOR · DEMO
            </span>
            <button
              type="button"
              onClick={() => switchRole('jugador')}
              className="text-[11px] font-bold text-[#ACD638] cursor-pointer"
            >
              Cambiar a Jugador
            </button>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <PlayerAvatar
              nombre={instProfile.nombre}
              seed={instProfile.avatarSeed}
              size="lg"
              isInstructor
              ringLime
            />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-white leading-tight truncate">
                {instProfile.nombre}
              </h1>
              <p className="text-xs text-white/80 truncate">{instProfile.titulo}</p>
            </div>
          </div>
        </div>
      </HeaderBar>

      <div className="flex-1 p-4 space-y-4 pb-8">
        {activeTab === 'agenda' && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onChangeTab('clases')}
                className="rounded-2xl bg-white p-3 shadow-sm text-center cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-[#273758] mx-auto" />
                <span className="mt-1 block text-lg font-extrabold text-[#1E2B45] tabular-nums">
                  {myClases.length}
                </span>
                <span className="text-[10px] text-slate-500">Clases</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('alumnos')}
                className="rounded-2xl bg-white p-3 shadow-sm text-center cursor-pointer"
              >
                <Users className="w-4 h-4 text-[#6E9214] mx-auto" />
                <span className="mt-1 block text-lg font-extrabold text-[#1E2B45] tabular-nums">
                  {totalAlumnos}
                </span>
                <span className="text-[10px] text-slate-500">Alumnos</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('alumnos')}
                className="rounded-2xl bg-white p-3 shadow-sm text-center cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-[#273758] mx-auto" />
                <span className="mt-1 block text-lg font-extrabold text-[#1E2B45] tabular-nums">
                  {totalAsistencias}/{totalAlumnos}
                </span>
                <span className="text-[10px] text-slate-500">Asistencias</span>
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {DEMO_DATES.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate(d.iso)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                    selectedDate === d.iso
                      ? 'bg-[#273758] text-white'
                      : 'bg-white text-[#1E2B45]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setFormErr('');
                setShowCreate(true);
              }}
              className="w-full rounded-2xl bg-[#B6E22E] py-3 text-sm font-extrabold text-[#16223B] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Programar clase demostrativa
            </button>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#1E2B45] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#273758]" />
                  Agenda del {selectedDate}
                </h2>
                <button
                  type="button"
                  onClick={() => onChangeTab('horarios')}
                  className="text-xs font-bold text-[#5E8210] cursor-pointer"
                >
                  Editar horarios
                </button>
              </div>

              {agendaClases.length === 0 ? (
                <div className="rounded-2xl bg-white p-4 text-xs text-slate-500 border border-slate-100">
                  Sin clases programadas para este día. Puedes crear una o cambiar la fecha arriba.
                </div>
              ) : (
                agendaClases.map((cl) => {
                  const sede = state.sedes.find((s) => s.id === cl.sedeId);
                  const cancha = state.canchas.find((c) => c.id === cl.canchaId);
                  return (
                    <div
                      key={cl.id}
                      className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10.5px] font-bold text-[#5E8210]">
                            {formatHour12(cl.horaInicio)} · {cl.duracionMin} min · {cl.tipo}
                          </span>
                          <h3 className="text-sm font-extrabold text-[#1E2B45]">{cl.titulo}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#273758]" />
                            {sede?.nombre} ({cancha?.nombre})
                          </p>
                        </div>
                        <span className="rounded-lg bg-[#ECFCCB] px-2 py-0.5 text-[11px] font-extrabold text-[#4E7006] tabular-nums">
                          {cl.alumnosIds.length}/{cl.cupoMax}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChangeTab('alumnos')}
                        className="w-full rounded-xl bg-[#F4F6F9] hover:bg-slate-200 py-2 text-xs font-bold text-[#273758] cursor-pointer"
                      >
                        Pasar asistencia demostrativa ({cl.asistenciaIds.length}/
                        {cl.alumnosIds.length})
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {activeTab === 'clases' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#1E2B45]">
                Mis clases ({myClases.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  setFormErr('');
                  setShowCreate(true);
                }}
                className="rounded-xl bg-[#B6E22E] px-3 py-2 text-xs font-extrabold text-[#16223B] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva clase
              </button>
            </div>

            {myClases.map((cl) => {
              const sede = state.sedes.find((s) => s.id === cl.sedeId);
              const cancha = state.canchas.find((c) => c.id === cl.canchaId);
              return (
                <div
                  key={cl.id}
                  className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="text-[10.5px] font-bold text-[#5E8210]">{cl.tipo}</span>
                      <h3 className="text-sm font-extrabold text-[#1E2B45] truncate">
                        {cl.titulo}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {sede?.nombre} ({cancha?.nombre}) · {cl.fecha} {formatHour12(cl.horaInicio)}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-[#273758] tabular-nums shrink-0">
                      {cl.alumnosIds.length}/{cl.cupoMax} cupos
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-600">
                      Asistencia: {cl.asistenciaIds.length}/{cl.alumnosIds.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChangeTab('alumnos')}
                      className="font-bold text-[#5E8210] cursor-pointer"
                    >
                      Ver alumnos →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'horarios' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-3">
              <h2 className="text-sm font-extrabold text-[#1E2B45] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#273758]" />
                Horarios disponibles
              </h2>
              <p className="text-xs text-slate-500">
                Activa o desactiva tus franjas horarias de demostración para reservas de alumnos.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const active = instProfile.horariosDisponibles.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleToggleSlot(slot)}
                      className={`rounded-xl py-2.5 text-xs font-bold tabular-nums cursor-pointer ${
                        active
                          ? 'bg-[#B6E22E] text-[#16223B]'
                          : 'bg-[#F4F6F9] text-slate-500'
                      }`}
                    >
                      {formatHour12(slot)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2">
              <h3 className="text-xs font-extrabold text-[#1E2B45] uppercase tracking-wide">
                Sedes autorizadas
              </h3>
              <div className="space-y-1.5">
                {instProfile.sedesAutorizadas.map((sid) => {
                  const sede = state.sedes.find((s) => s.id === sid);
                  if (!sede) return null;
                  return (
                    <div
                      key={sid}
                      className="flex items-center justify-between rounded-xl bg-[#F4F6F9] px-3 py-2 text-xs"
                    >
                      <span className="font-bold text-[#1E2B45]">{sede.nombre}</span>
                      <span className="text-slate-500">
                        {sede.horarioApertura} – {sede.horarioCierre}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alumnos' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#1E2B45]">
                Alumnos y asistencia demostrativa
              </h2>
              <span className="rounded-lg bg-[#ECFCCB] px-2 py-0.5 text-[10.5px] font-bold text-[#4E7006]">
                {totalAsistencias}/{totalAlumnos} presentes
              </span>
            </div>

            {myClases.map((cl) => (
              <div
                key={cl.id}
                className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-3"
              >
                <div>
                  <span className="text-[10.5px] font-bold text-[#5E8210]">
                    {cl.fecha} · {formatHour12(cl.horaInicio)}
                  </span>
                  <h3 className="text-sm font-extrabold text-[#1E2B45]">{cl.titulo}</h3>
                </div>

                {cl.alumnosIds.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin alumnos inscritos todavía.</p>
                ) : (
                  <div className="space-y-2">
                    {cl.alumnosIds.map((uid) => {
                      const u = state.usuarios.find((x) => x.id === uid);
                      const present = cl.asistenciaIds.includes(uid);
                      return (
                        <div
                          key={uid}
                          className="flex items-center justify-between gap-2 rounded-xl bg-[#F9FAFB] p-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <PlayerAvatar
                              nombre={u?.nombre || 'Alumno'}
                              seed={u?.avatarSeed}
                              avatarUrl={u?.avatarUrl}
                              size="xs"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-[#1E2B45] block truncate">
                                {u?.nombre || 'Alumno'}
                              </span>
                              <span className="text-[10.5px] text-slate-500">
                                {u?.nivel || 'Intermedio'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                openWhatsAppDemo(
                                  u?.nombre || 'Alumno',
                                  `Recordatorio de clase: ${cl.titulo} (${cl.fecha} ${formatHour12(cl.horaInicio)})`,
                                  'Alumno'
                                )
                              }
                              aria-label={`Contactar por WhatsApp a ${u?.nombre || 'alumno'}`}
                              className="rounded-xl bg-emerald-50 border border-emerald-200 p-1.5 text-emerald-700 cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                toggleClassAttendance(cl.id, uid);
                                showToast(
                                  present
                                    ? `Asistencia desmarcada (${u?.nombre})`
                                    : `Asistencia confirmada (${u?.nombre})`,
                                  'info'
                                );
                              }}
                              className={`rounded-xl px-2.5 py-1.5 font-bold inline-flex items-center gap-1 cursor-pointer ${
                                present
                                  ? 'bg-[#B6E22E] text-[#16223B]'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {present ? 'Presente' : 'Marcar'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex items-center gap-3">
              <PlayerAvatar
                nombre={instProfile.nombre}
                seed={instProfile.avatarSeed}
                size="lg"
                shape="rounded"
                isInstructor
              />
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-[#1E2B45] truncate">
                  {instProfile.nombre}
                </h2>
                <p className="text-xs text-slate-500 truncate">{instProfile.titulo}</p>
                <p className="text-[11px] font-bold text-[#5E8210] mt-0.5">
                  ★ {instProfile.rating} · {instProfile.certificaciones.join(' · ')}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2">
              <h2 className="text-sm font-extrabold text-[#1E2B45]">
                Tarifa demostrativa por hora
              </h2>
              <div className="flex items-center gap-2">
                {[25, 30, 35, 40].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => updateInstructorProfile(instProfile.id, { precioBase: rate })}
                    className={`flex-1 rounded-xl py-2 text-xs font-extrabold cursor-pointer ${
                      instProfile.precioBase === rate
                        ? 'bg-[#B6E22E] text-[#16223B]'
                        : 'bg-[#F4F6F9] text-[#1E2B45]'
                    }`}
                  >
                    B/. {rate}
                  </button>
                ))}
              </div>
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
                  onClick={() => switchRole('admin')}
                  className="rounded-xl bg-[#F4F6F9] py-2.5 text-xs font-bold text-[#273758] cursor-pointer"
                >
                  Admin Sede
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full rounded-2xl bg-white border border-rose-200 py-3 text-xs font-bold text-rose-700 cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45]">Nueva clase</h3>
            <input
              type="text"
              value={newTitulo}
              onChange={(e) => setNewTitulo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value as ClaseProgramada['tipo'])}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                <option value="Grupal">Grupal</option>
                <option value="Individual">Individual</option>
                <option value="Junior">Junior</option>
              </select>
              <select
                value={newSedeId}
                onChange={(e) => {
                  const sid = e.target.value;
                  setNewSedeId(sid);
                  setNewCanchaId(
                    state.canchas.find((c) => c.sedeId === sid && c.estado === 'Disponible')
                      ?.id || ''
                  );
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {instProfile.sedesAutorizadas.map((sid) => (
                  <option key={sid} value={sid}>
                    {state.sedes.find((s) => s.id === sid)?.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newFecha}
                onChange={(e) => setNewFecha(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {DEMO_DATES.map((d) => (
                  <option key={d.iso} value={d.iso}>
                    {d.label}
                  </option>
                ))}
              </select>
              <select
                value={newHora}
                onChange={(e) => setNewHora(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {formatHour12(t)}
                  </option>
                ))}
              </select>
            </div>
            {formErr && <p className="text-xs font-bold text-rose-600">{formErr}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = createInstructorClass({
                    sedeId: newSedeId,
                    canchaId: newCanchaId,
                    titulo: newTitulo,
                    tipo: newTipo,
                    fecha: newFecha,
                    horaInicio: newHora,
                    duracionMin: 60,
                    precioPorCupo: instProfile.precioBase,
                    cupoMax: newTipo === 'Individual' ? 1 : 6,
                  });
                  if (!res.ok) setFormErr(res.error || 'Horario no disponible');
                  else setShowCreate(false);
                }}
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B] cursor-pointer"
              >
                Publicar clase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
