import React, { useRef } from 'react';
import {
  Calendar,
  CalendarCheck,
  Camera,
  Heart,
  LogOut,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import type { Role, SkillLevel } from '../../../types/tennis';
import { HeaderBar } from '../../HeaderBar';
import { PWAInstallButton } from '../../PWAComponents';
import { PlayerAvatar } from '../../VisualAssets';

interface PlayerProfileViewProps {
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
}

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({
  onOpenMenu,
  onOpenNotifications,
}) => {
  const {
    state,
    currentUser,
    updateUserPreferences,
    switchRole,
    openWhatsAppDemo,
    resetDemoData,
    logout,
    showToast,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const myBookingsCount = state.reservas.filter((r) => r.usuarioId === currentUser.id).length;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = Math.max(0, (img.height - minSide) / 4);
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        updateUserPreferences({ avatarUrl: compressed });
        showToast('Foto de perfil actualizada en demostración');
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        variant="lines"
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
      >
        <div className="flex items-center gap-3.5 pb-2 pt-1">
          <div className="relative shrink-0">
            <PlayerAvatar
              nombre={currentUser.nombre}
              seed={currentUser.avatarSeed}
              avatarUrl={currentUser.avatarUrl}
              size="lg"
              ringLime
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Cambiar foto de perfil"
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#B6E22E] text-[#16223B] flex items-center justify-center shadow ring-2 ring-[#273758] cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold text-white truncate">{currentUser.nombre}</h1>
            <p className="text-xs text-white/80 truncate">{currentUser.email}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-[#ACD638]">
              <span>Nivel {currentUser.nivel}</span>
              <span>·</span>
              <span>{currentUser.distrito}</span>
            </div>
          </div>
        </div>
      </HeaderBar>

      <div className="flex-1 p-4 space-y-3.5 pb-8">
        {/* Resumen del jugador */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 text-center">
            <Calendar className="w-4 h-4 text-[#6E9214] mx-auto" />
            <span className="mt-1 block text-lg font-extrabold text-[#1E2B45] tabular-nums">
              {myBookingsCount}
            </span>
            <span className="text-[10px] font-semibold text-slate-500">Reservas</span>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 text-center">
            <CalendarCheck className="w-4 h-4 text-[#273758] mx-auto" />
            <span className="mt-1 block text-lg font-extrabold text-[#1E2B45] tabular-nums">
              {currentUser.asistenciaScore}%
            </span>
            <span className="text-[10px] font-semibold text-slate-500">Asistencia</span>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 text-center">
            <Heart className="w-4 h-4 text-rose-500 mx-auto" />
            <span className="mt-1 block text-lg font-extrabold text-[#1E2B45] tabular-nums">
              {currentUser.favoritosSedes.length}
            </span>
            <span className="text-[10px] font-semibold text-slate-500">Favoritos</span>
          </div>
        </div>

        <PWAInstallButton />

        {/* Preferencias básicas */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-3">
          <h2 className="text-sm font-extrabold text-[#1E2B45]">Perfil deportivo</h2>

          <div className="flex items-center justify-between">
            <label htmlFor="pref-nivel" className="text-xs font-semibold text-slate-700">
              Nivel de juego
            </label>
            <select
              id="pref-nivel"
              value={currentUser.nivel}
              onChange={(e) => updateUserPreferences({ nivel: e.target.value as SkillLevel })}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#1E2B45]"
            >
              <option value="Principiante">Principiante</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
              <option value="Pro">Pro</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() =>
              openWhatsAppDemo(
                'Soporte del Club (Demo)',
                'Consulta de jugador sobre reservas o pagos manuales.',
                'Atención visual por WhatsApp'
              )
            }
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 py-2.5 text-xs font-extrabold text-emerald-800 inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            Contactar soporte del club por WhatsApp (Demo)
          </button>
        </div>

        {/* Selector de rol demo */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2.5">
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-[#273758]" />
            <h2 className="text-sm font-extrabold text-[#1E2B45]">
              Cambiar perfil de demostración
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Recorre los flujos de Jugador, Administrador de Sede e Instructor en la misma sesión.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['jugador', 'Jugador'],
                ['admin', 'Admin Sede'],
                ['instructor', 'Instructor'],
              ] as [Role, string][]
            ).map(([rol, label]) => (
              <button
                key={rol}
                type="button"
                onClick={() => switchRole(rol)}
                className={`rounded-xl py-2.5 px-2 text-xs font-bold text-center border cursor-pointer ${
                  currentUser.rol === rol
                    ? 'border-[#ACD638] bg-[#F7FCEB] text-[#16223B]'
                    : 'border-slate-200 bg-white text-[#1E2B45] hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={resetDemoData}
            className="rounded-2xl bg-white border border-slate-200 py-3 text-xs font-bold text-[#273758] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar demo
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-2xl bg-white border border-rose-200 py-3 text-xs font-bold text-rose-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>

        <p className="text-center text-[10.5px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Tenis Club Panamá — Essential 2K · Demostración comercial
        </p>
      </div>
    </div>
  );
};
