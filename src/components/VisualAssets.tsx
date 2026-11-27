import React from 'react';
import type { Sede } from '../types/tennis';

export const BrandLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  size = 'md',
}) => {
  const sizeCls =
    size === 'lg' ? 'h-24 w-auto' : size === 'sm' ? 'h-10 w-auto' : 'h-12 w-auto';
  return (
    <img
      src="/logo-shield.png"
      alt="Tenis Club Panamá"
      className={`${sizeCls} object-contain select-none ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};

const PRIVATE_COURT_PHOTOS = [
  '/assets/photos/privadas/privada_01.webp',
  '/assets/photos/privadas/privada_02.webp',
  '/assets/photos/privadas/privada_03.webp',
  '/assets/photos/privadas/privada_04.webp',
  '/assets/photos/privadas/privada_05.webp',
  '/assets/photos/privadas/privada_06.webp',
] as const;

const PUBLIC_COURT_PHOTOS = [
  '/assets/photos/publicas/publica_01.webp',
  '/assets/photos/publicas/publica_02.webp',
  '/assets/photos/publicas/publica_03.webp',
  '/assets/photos/publicas/publica_04.webp',
  '/assets/photos/publicas/publica_05.webp',
  '/assets/photos/publicas/publica_06.webp',
] as const;

const SEDE_BASE_PHOTO_INDEX: Record<string, { isPublic: boolean; index: number }> = {
  sede_tcp: { isPublic: false, index: 0 },
  sede_costaverde: { isPublic: false, index: 1 },
  sede_pacifico: { isPublic: false, index: 2 },
  sede_balboa: { isPublic: false, index: 3 },
  sede_david: { isPublic: false, index: 4 },
  sede_omar: { isPublic: true, index: 0 },
};

const VARIANT_BASE_INDEX: Record<Sede['imagenVariant'], number> = {
  'night-club': 0,
  'west-clay': 1,
  'coastal-palm': 2,
  'balboa-park': 3,
};

export const CourtScene: React.FC<{
  sedeId?: string;
  isPublic?: boolean;
  variant?: Sede['imagenVariant'];
  photoIndex?: number;
  clubLabel?: string;
  className?: string;
  eager?: boolean;
}> = ({
  sedeId,
  isPublic,
  variant = 'night-club',
  photoIndex = 0,
  clubLabel = 'Tenis Club Panamá',
  className = '',
  eager = false,
}) => {
  const mappedSede = sedeId ? SEDE_BASE_PHOTO_INDEX[sedeId] : undefined;
  const usePublic = isPublic ?? mappedSede?.isPublic ?? false;
  const gallery = usePublic ? PUBLIC_COURT_PHOTOS : PRIVATE_COURT_PHOTOS;

  const baseIdx = mappedSede
    ? mappedSede.index
    : usePublic
      ? 0
      : VARIANT_BASE_INDEX[variant] ?? 0;

  const safeIdx = ((baseIdx + photoIndex) % gallery.length + gallery.length) % gallery.length;
  const src = gallery[safeIdx];

  return (
    <img
      src={src}
      alt={clubLabel}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`w-full h-full object-cover object-center block select-none ${className}`}
    />
  );
};

const INSTRUCTOR_PHOTO_MAP: Record<string, string> = {
  carlos: '/assets/photos/instructores/instructor_01.webp',
  carlos_coach: '/assets/photos/instructores/instructor_01.webp',
  inst_1: '/assets/photos/instructores/instructor_01.webp',
  maria: '/assets/photos/instructores/instructor_02.webp',
  maria_coach: '/assets/photos/instructores/instructor_02.webp',
  inst_2: '/assets/photos/instructores/instructor_02.webp',
  luis: '/assets/photos/instructores/instructor_03.webp',
  luis_coach: '/assets/photos/instructores/instructor_03.webp',
  diego: '/assets/photos/instructores/instructor_03.webp',
  inst_3: '/assets/photos/instructores/instructor_03.webp',
  andrea: '/assets/photos/instructores/instructor_04.webp',
  andrea_coach: '/assets/photos/instructores/instructor_04.webp',
  valentina: '/assets/photos/instructores/instructor_04.webp',
  inst_4: '/assets/photos/instructores/instructor_04.webp',
  instructor_05: '/assets/photos/instructores/instructor_05.webp',
  instructor_06: '/assets/photos/instructores/instructor_06.webp',
};

const PLAYER_PHOTO_MAP: Record<string, string> = {
  carlos: '/assets/photos/jugadores/player_julio.webp',
  julio: '/assets/photos/jugadores/player_julio.webp',
  andres: '/assets/photos/jugadores/jugador_01.webp',
  maria: '/assets/photos/jugadores/jugador_02.webp',
  ana: '/assets/photos/jugadores/jugador_02.webp',
  javier: '/assets/photos/jugadores/jugador_03.webp',
  miguel: '/assets/photos/jugadores/jugador_03.webp',
  valentina: '/assets/photos/jugadores/jugador_04.webp',
  diego: '/assets/photos/jugadores/jugador_05.webp',
  mateo: '/assets/photos/jugadores/jugador_05.webp',
  sofia: '/assets/photos/jugadores/jugador_06.webp',
  ricardo: '/assets/photos/jugadores/jugador_07.webp',
  roberto: '/assets/photos/jugadores/jugador_07.webp',
  lucia: '/assets/photos/jugadores/jugador_08.webp',
  super: '/assets/photos/jugadores/player_julio.webp',
};

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function resolveAvatarPhoto(
  nombre: string,
  seed?: string,
  avatarUrl?: string,
  isInstructor?: boolean
): string {
  if (avatarUrl) return avatarUrl;

  const normSeed = seed ? normalizeKey(seed) : '';
  const normName = normalizeKey(nombre);
  const firstWord = normName.split(/[\s/]+/)[0] || '';

  const instructorLookup =
    isInstructor ||
    normSeed.endsWith('_coach') ||
    normName.includes('mendez') ||
    normName.includes('fernandez') ||
    normName.includes('luis herrera') ||
    normName.includes('andrea castillo');

  if (instructorLookup) {
    if (normSeed && INSTRUCTOR_PHOTO_MAP[normSeed]) {
      return INSTRUCTOR_PHOTO_MAP[normSeed];
    }
    if (firstWord && INSTRUCTOR_PHOTO_MAP[firstWord]) {
      return INSTRUCTOR_PHOTO_MAP[firstWord];
    }
    return '/assets/photos/instructores/instructor_05.webp';
  }

  if (normName.includes('julio')) {
    return '/assets/photos/jugadores/player_julio.webp';
  }
  if (normName.includes('carlos administrador')) {
    return '/assets/photos/jugadores/jugador_07.webp';
  }

  if (normSeed && PLAYER_PHOTO_MAP[normSeed]) {
    return PLAYER_PHOTO_MAP[normSeed];
  }
  if (firstWord && PLAYER_PHOTO_MAP[firstWord]) {
    return PLAYER_PHOTO_MAP[firstWord];
  }
  return '/assets/photos/jugadores/player_julio.webp';
}

export const PlayerAvatar: React.FC<{
  nombre: string;
  seed?: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  ringLime?: boolean;
  isInstructor?: boolean;
  shape?: 'circle' | 'rounded';
}> = ({
  nombre,
  seed = 'carlos',
  avatarUrl,
  size = 'md',
  ringLime = false,
  isInstructor = false,
  shape = 'circle',
}) => {
  const src = resolveAvatarPhoto(nombre, seed, avatarUrl, isInstructor);

  const sizeCls =
    size === 'xs'
      ? 'w-7 h-7'
      : size === 'sm'
        ? 'w-9 h-9'
        : size === 'lg'
          ? 'w-14 h-14'
          : 'w-11 h-11';

  const shapeCls = shape === 'rounded' ? 'rounded-xl' : 'rounded-full';

  return (
    <div
      className={`${sizeCls} ${shapeCls} shrink-0 overflow-hidden relative bg-[#1E2B45]/10 select-none ${
        ringLime ? 'ring-2 ring-[#ACD638]' : 'ring-1 ring-slate-200'
      }`}
    >
      <img
        src={src}
        alt={nombre}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover object-top block"
      />
    </div>
  );
};

export const DemoQRCode: React.FC<{ code: string }> = ({ code }) => {
  // Deterministic 11x11 pattern based on reservation code
  const cells: boolean[] = [];
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) % 9973;
  }
  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 11; c++) {
      const isCorner =
        (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3);
      if (isCorner) {
        cells.push(true);
      } else {
        cells.push(((hash + r * 17 + c * 29) % 3) !== 0);
      }
    }
  }

  return (
    <div className="inline-flex flex-col items-center p-3 bg-white rounded-2xl border border-slate-200">
      <svg viewBox="0 0 110 110" className="w-28 h-28" aria-label={`QR ${code}`}>
        <rect width="110" height="110" fill="#FFFFFF" />
        {cells.map((filled, idx) => {
          if (!filled) return null;
          const r = Math.floor(idx / 11);
          const c = idx % 11;
          return (
            <rect
              key={idx}
              x={c * 10 + 1}
              y={r * 10 + 1}
              width="8"
              height="8"
              rx="1.5"
              fill="#1E2B45"
            />
          );
        })}
      </svg>
      <span className="mt-1.5 text-xs font-mono font-bold tracking-wider text-[#273758]">
        {code}
      </span>
    </div>
  );
};
