import React from 'react';
import { Bell, ChevronLeft, Menu } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './VisualAssets';

export type HeaderBannerVariant = 'ball' | 'net' | 'lines';

const HEADER_BG_MAP: Record<HeaderBannerVariant, string> = {
  ball: '/assets/photos/fondos/fondo_01.webp',
  net: '/assets/photos/fondos/fondo_02.webp',
  lines: '/assets/photos/fondos/fondo_03.webp',
};

interface HeaderBarProps {
  variant?: HeaderBannerVariant;
  onBack?: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  children?: React.ReactNode;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  variant = 'ball',
  onBack,
  onOpenMenu,
  onOpenNotifications,
  children,
}) => {
  const { state, currentUser } = useApp();
  const unreadCount = state.notificaciones.filter(
    (n) => !n.leida && (n.usuarioId === currentUser.id || n.usuarioId === 'ALL')
  ).length;

  const bgSrc = HEADER_BG_MAP[variant];

  return (
    <header className="shrink-0 relative overflow-hidden bg-gradient-to-br from-[#172442] via-[#223458] to-[#192848] text-white px-4 pt-safe pb-4">
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-x-0 top-0 h-36 overflow-hidden"
      >
        <img
          src={bgSrc}
          alt=""
          aria-hidden="true"
          decoding="async"
          className="w-full h-full object-cover object-right opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#172442]/88 via-[#1E2E52]/58 to-[#172442]/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#172442]/25 via-transparent to-[#1E2E52]" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute -top-6 right-[96px] w-6 h-44 bg-gradient-to-b from-[#B6E22E] via-[#ACD638]/45 to-transparent rotate-[28deg] opacity-65"
      />

      {/* 3-zone top row */}
      <div className="relative z-10 flex items-center justify-between h-12">
        <div className="w-24 flex items-center">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver"
              className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenMenu}
              aria-label="Abrir menú y selector de perfil"
              className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-center">
          <BrandLogo size="md" className="h-12 w-auto drop-shadow" />
        </div>

        <div className="w-24 flex items-center justify-end gap-1.5">
          <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-[#B6E22E] uppercase">
            DEMO
          </span>
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label={`Notificaciones (${unreadCount} sin leer)`}
            className="relative min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#ACD638] ring-2 ring-[#273758]" />
            )}
          </button>
        </div>
      </div>

      {children && <div className="relative z-10 mt-1">{children}</div>}
    </header>
  );
};
