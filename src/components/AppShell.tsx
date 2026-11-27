import React, { useEffect, useState } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  GraduationCap,
  Home,
  MessageCircle,
  RotateCcw,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Modality, Role } from '../types/tennis';
import { OfflineIndicator, PWAInstallButton, SplashScreen } from './PWAComponents';
import { BrandLogo } from './VisualAssets';
import { AdminMobileView, type AdminTab } from './views/AdminMobileView';
import { InstructorView, type InstructorTab } from './views/InstructorView';
import { LoginView } from './views/LoginView';
import { BookingCheckoutView } from './views/player/BookingCheckoutView';
import { ClassesView } from './views/player/ClassesView';
import { CommunityView } from './views/player/CommunityView';
import { CourtDetailView } from './views/player/CourtDetailView';
import { ExploreCourtsView } from './views/player/ExploreCourtsView';
import { MyBookingsView } from './views/player/MyBookingsView';
import { PlayerHomeView } from './views/player/PlayerHomeView';
import { PlayerProfileView } from './views/player/PlayerProfileView';

type PlayerTab = 'inicio' | 'reservas' | 'comunidad' | 'clases' | 'perfil';
type PlayerSubScreen =
  | { type: 'tab' }
  | { type: 'explore'; query?: string }
  | { type: 'sedeDetail'; sedeId: string; canchaId?: string }
  | {
      type: 'checkout';
      selection: {
        sedeId: string;
        canchaId: string;
        fecha: string;
        horaInicio: string;
        duracionMin: 60 | 90;
        modalidad: Modality;
      };
    };

export const AppShell: React.FC = () => {
  const {
    state,
    currentUser,
    activeSede,
    toast,
    whatsappDialog,
    closeWhatsAppDemo,
    confirmWhatsAppDemo,
    switchRole,
    switchSede,
    markAllNotificationsRead,
    resetDemoData,
    logout,
  } = useApp();

  const isAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [showSplash, setShowSplash] = useState(!isAutostart);
  const [playerTab, setPlayerTab] = useState<PlayerTab>('inicio');
  const [playerScreen, setPlayerScreen] = useState<PlayerSubScreen>({ type: 'tab' });
  const [bookingDetailFocus, setBookingDetailFocus] = useState<string | undefined>(undefined);
  const [convPreselectedReserva, setConvPreselectedReserva] = useState<string | null>(null);

  const [adminTab, setAdminTab] = useState<AdminTab>('inicio');
  const [instTab, setInstTab] = useState<InstructorTab>('agenda');

  const [showMenu, setShowMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!showSplash) return;
    const t = window.setTimeout(() => setShowSplash(false), 850);
    return () => window.clearTimeout(t);
  }, [showSplash]);

  const openNotifications = () => {
    setShowNotifs(true);
    markAllNotificationsRead();
  };

  const navigatePlayerTab = (tab: PlayerTab) => {
    setPlayerTab(tab);
    setPlayerScreen({ type: 'tab' });
  };

  const userNotifications = state.notificaciones.filter(
    (n) => n.usuarioId === currentUser.id || n.usuarioId === 'ALL'
  );

  return (
    <div className="h-dvh w-full desktop-court-backdrop relative flex justify-center overflow-hidden">
      <div
        aria-hidden="true"
        className="hidden sm:block fixed inset-0 pointer-events-none select-none"
      >
        <img
          src="/assets/photos/fondos/fondo_03.webp"
          alt=""
          aria-hidden="true"
          decoding="async"
          className="w-full h-full object-cover object-center opacity-20"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-[#16223B]/55 to-[#10192D]/90" />
      </div>

      {/* Centered 480px Vertical PWA Container */}
      <div className="w-full max-w-[480px] h-dvh bg-[#F4F6F9] relative flex flex-col shadow-2xl overflow-hidden">
        <OfflineIndicator />

        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

        {!state.isAuthenticated ? (
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <LoginView />
          </div>
        ) : (
          <>
            <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              {currentUser.rol === 'jugador' && (
                <>
                  {playerScreen.type === 'explore' && (
                    <ExploreCourtsView
                      initialQuery={playerScreen.query}
                      onBack={() => setPlayerScreen({ type: 'tab' })}
                      onOpenMenu={() => setShowMenu(true)}
                      onOpenNotifications={openNotifications}
                      onSelectSede={(sedeId, canchaId) =>
                        setPlayerScreen({ type: 'sedeDetail', sedeId, canchaId })
                      }
                    />
                  )}
                  {playerScreen.type === 'sedeDetail' && (
                    <CourtDetailView
                      sedeId={playerScreen.sedeId}
                      initialCanchaId={playerScreen.canchaId}
                      onBack={() => setPlayerScreen({ type: 'explore' })}
                      onOpenMenu={() => setShowMenu(true)}
                      onOpenNotifications={openNotifications}
                      onProceedCheckout={(selection) =>
                        setPlayerScreen({ type: 'checkout', selection })
                      }
                    />
                  )}
                  {playerScreen.type === 'checkout' && (
                    <BookingCheckoutView
                      selection={playerScreen.selection}
                      onBack={() =>
                        setPlayerScreen({
                          type: 'sedeDetail',
                          sedeId: playerScreen.selection.sedeId,
                          canchaId: playerScreen.selection.canchaId,
                        })
                      }
                      onOpenMenu={() => setShowMenu(true)}
                      onOpenNotifications={openNotifications}
                      onDoneToBookings={() => navigatePlayerTab('reservas')}
                      onPublishOpenMatch={(resId) => {
                        setConvPreselectedReserva(resId);
                        navigatePlayerTab('comunidad');
                      }}
                    />
                  )}
                  {playerScreen.type === 'tab' && (
                    <>
                      {playerTab === 'inicio' && (
                        <PlayerHomeView
                          onOpenMenu={() => setShowMenu(true)}
                          onOpenNotifications={openNotifications}
                          onNavigateTab={navigatePlayerTab}
                          onOpenExplore={(query) => setPlayerScreen({ type: 'explore', query })}
                          onOpenSedeDetail={(sedeId, canchaId) =>
                            setPlayerScreen({ type: 'sedeDetail', sedeId, canchaId })
                          }
                          onOpenReservationDetail={(resId) => {
                            setBookingDetailFocus(resId);
                            navigatePlayerTab('reservas');
                          }}
                        />
                      )}
                      {playerTab === 'reservas' && (
                        <MyBookingsView
                          initialReservaId={bookingDetailFocus}
                          onOpenMenu={() => setShowMenu(true)}
                          onOpenNotifications={openNotifications}
                          onExploreCourts={() => setPlayerScreen({ type: 'explore' })}
                          onPublishOpenMatch={(resId) => {
                            setConvPreselectedReserva(resId);
                            navigatePlayerTab('comunidad');
                          }}
                        />
                      )}
                      {playerTab === 'comunidad' && (
                        <CommunityView
                          preselectedReservaForConvocatoria={convPreselectedReserva}
                          onClearPreselectedReserva={() => setConvPreselectedReserva(null)}
                          onOpenMenu={() => setShowMenu(true)}
                          onOpenNotifications={openNotifications}
                        />
                      )}
                      {playerTab === 'clases' && (
                        <ClassesView
                          onOpenMenu={() => setShowMenu(true)}
                          onOpenNotifications={openNotifications}
                        />
                      )}
                      {playerTab === 'perfil' && (
                        <PlayerProfileView
                          onOpenMenu={() => setShowMenu(true)}
                          onOpenNotifications={openNotifications}
                        />
                      )}
                    </>
                  )}
                </>
              )}

              {currentUser.rol === 'admin' && (
                <AdminMobileView
                  activeTab={adminTab}
                  onChangeTab={setAdminTab}
                  onOpenMenu={() => setShowMenu(true)}
                  onOpenNotifications={openNotifications}
                />
              )}

              {currentUser.rol === 'instructor' && (
                <InstructorView
                  activeTab={instTab}
                  onChangeTab={setInstTab}
                  onOpenMenu={() => setShowMenu(true)}
                  onOpenNotifications={openNotifications}
                />
              )}
            </main>

            {/* Fixed Bottom Navigation inside 480px container */}
            <nav
              aria-label="Navegación principal"
              className="shrink-0 z-30 w-full bg-[#16233B] text-white border-t border-white/10 pb-safe"
            >
              {currentUser.rol === 'jugador' && (
                <div className="grid grid-cols-5 h-16 items-center">
                  {(
                    [
                      { id: 'inicio', label: 'Inicio', icon: Home },
                      { id: 'reservas', label: 'Reservas', icon: Calendar },
                      { id: 'comunidad', label: 'Comunidad', icon: Users },
                      { id: 'clases', label: 'Clases', icon: GraduationCap },
                      { id: 'perfil', label: 'Perfil', icon: User },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const active = playerScreen.type === 'tab' && playerTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigatePlayerTab(item.id)}
                        className={`flex flex-col items-center justify-center gap-1 min-h-[44px] cursor-pointer transition ${
                          active ? 'text-[#B6E22E]' : 'text-white/75 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10.5px] font-bold leading-none">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentUser.rol === 'admin' && (
                <div className="grid grid-cols-5 h-16 items-center">
                  {(
                    [
                      { id: 'inicio', label: 'Inicio', icon: Home },
                      { id: 'reservas', label: 'Reservas', icon: Calendar },
                      { id: 'canchas', label: 'Canchas', icon: Trophy },
                      { id: 'clases', label: 'Clases', icon: GraduationCap },
                      { id: 'perfil', label: 'Perfil', icon: User },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const active = adminTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAdminTab(item.id)}
                        className={`flex flex-col items-center justify-center gap-1 min-h-[44px] cursor-pointer transition ${
                          active ? 'text-[#B6E22E]' : 'text-white/75 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10.5px] font-bold leading-none">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentUser.rol === 'instructor' && (
                <div className="grid grid-cols-5 h-16 items-center">
                  {(
                    [
                      { id: 'agenda', label: 'Agenda', icon: Calendar },
                      { id: 'clases', label: 'Clases', icon: GraduationCap },
                      { id: 'horarios', label: 'Horarios', icon: Clock },
                      { id: 'alumnos', label: 'Alumnos', icon: Users },
                      { id: 'perfil', label: 'Perfil', icon: User },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const active = instTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setInstTab(item.id)}
                        className={`flex flex-col items-center justify-center gap-1 min-h-[44px] cursor-pointer transition ${
                          active ? 'text-[#B6E22E]' : 'text-white/75 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10.5px] font-bold leading-none">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </nav>
          </>
        )}

        {/* Toast Notification */}
        {toast && (
          <div
            role="status"
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[430px] rounded-2xl px-4 py-3 text-xs font-extrabold shadow-xl text-center pointer-events-none ${
              toast.tone === 'error'
                ? 'bg-rose-600 text-white'
                : toast.tone === 'info'
                  ? 'bg-[#273758] text-white'
                  : 'bg-[#B6E22E] text-[#16223B]'
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* Hamburger Menu & Role/Sede Drawer */}
        {showMenu && (
          <div className="fixed inset-0 z-50 flex justify-center bg-black/55">
            <div className="w-full max-w-[480px] relative flex">
              <div className="w-[82%] bg-white h-full p-5 overflow-y-auto flex flex-col justify-between shadow-2xl">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-[#273758] p-1.5 rounded-xl">
                        <BrandLogo size="sm" className="h-8 w-auto" />
                      </div>
                      <div>
                        <span className="block text-sm font-extrabold text-[#1E2B45]">
                          Tenis Club Panamá
                        </span>
                        <span className="block text-[10.5px] font-semibold text-[#5E8210]">
                          Essential 2K · Demostración
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMenu(false)}
                      aria-label="Cerrar menú"
                      className="p-2 rounded-xl hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">
                      Cambiar perfil (Demostración)
                    </p>
                    <div className="space-y-1.5">
                      {(
                        [
                          { rol: 'jugador', label: 'Jugador · Julio Solórzano' },
                          { rol: 'admin', label: 'Administrador de Sede' },
                          { rol: 'instructor', label: 'Instructor · Portal Móvil' },
                        ] as { rol: Role; label: string }[]
                      ).map((item) => (
                        <button
                          key={item.rol}
                          type="button"
                          onClick={() => {
                            switchRole(item.rol);
                            setShowMenu(false);
                          }}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition cursor-pointer ${
                            currentUser.rol === item.rol
                              ? 'bg-[#B6E22E] text-[#16223B]'
                              : 'bg-[#F4F6F9] text-[#1E2B45] hover:bg-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">
                      Sede activa ({activeSede.nombre})
                    </p>
                    <select
                      value={activeSede.id}
                      onChange={(e) => switchSede(e.target.value)}
                      aria-label="Seleccionar sede activa"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-[#1E2B45]"
                    >
                      {state.sedes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} ({s.tipo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-2xl bg-[#F4F6F9] p-3 text-xs space-y-1">
                    <span className="font-extrabold text-[#1E2B45] block">
                      Alcance comercial ilustrativo
                    </span>
                    <p className="text-slate-600">
                      Configuración demo: {state.sedes.length}/{state.commercialCapacity.maxSedes}{' '}
                      sedes y {state.canchas.length}/{state.commercialCapacity.maxCanchas} canchas
                      totales.
                    </p>
                  </div>

                  <PWAInstallButton />
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      resetDemoData();
                      setShowMenu(false);
                    }}
                    className="w-full rounded-xl bg-[#F4F6F9] py-2.5 text-xs font-bold text-[#273758] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reiniciar datos demo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setShowMenu(false);
                    }}
                    className="w-full rounded-xl border border-rose-200 py-2.5 text-xs font-bold text-rose-700 cursor-pointer"
                  >
                    Ir a pantalla de acceso
                  </button>
                </div>
              </div>
              <div className="flex-1" onClick={() => setShowMenu(false)} />
            </div>
          </div>
        )}

        {/* Notifications Sheet */}
        {showNotifs && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55">
            <div className="w-full max-w-[480px] rounded-t-3xl bg-white p-5 max-h-[80dvh] overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#1E2B45] flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#273758]" />
                  Avisos de demostración
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNotifs(false)}
                  className="text-xs font-bold text-slate-500 px-2 py-1 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
              <div className="space-y-2">
                {userNotifications.map((n) => (
                  <div key={n.id} className="rounded-2xl bg-[#F4F6F9] p-3 text-xs space-y-0.5">
                    <div className="flex justify-between font-bold text-[#1E2B45]">
                      <span>{n.titulo}</span>
                      <span className="text-[10px] text-slate-400">{n.fechaTexto}</span>
                    </div>
                    <p className="text-slate-600">{n.mensaje}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Simulated WhatsApp Contact Modal (No real phone numbers, no external links, no message dispatch) */}
        {whatsappDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
            <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 shadow-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1E2B45]">
                      Contacto por WhatsApp (Simulación)
                    </h3>
                    {whatsappDialog.roleLabel && (
                      <span className="text-[11px] font-semibold text-emerald-700">
                        {whatsappDialog.roleLabel}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeWhatsAppDemo}
                  aria-label="Cerrar diálogo de WhatsApp"
                  className="p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs space-y-1">
                <p className="font-extrabold text-[#1E2B45]">
                  Destinatario: {whatsappDialog.target}
                </p>
                <p className="text-slate-700">{whatsappDialog.context}</p>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Demostración comercial: en producción abriría WhatsApp con un mensaje prellenado. En
                esta versión no se utilizan números reales ni se envían mensajes externos.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeWhatsAppDemo}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmWhatsAppDemo}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-extrabold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Simular apertura
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
