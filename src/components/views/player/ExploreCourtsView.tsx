import React, { useMemo, useState } from 'react';
import { Heart, List, Map as MapIcon, MapPin, Search, Star, Sun } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { HeaderBar } from '../../HeaderBar';
import { CourtScene } from '../../VisualAssets';

interface ExploreCourtsViewProps {
  initialQuery?: string;
  onBack: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onSelectSede: (sedeId: string, canchaId?: string) => void;
}

export const ExploreCourtsView: React.FC<ExploreCourtsViewProps> = ({
  initialQuery = '',
  onBack,
  onOpenMenu,
  onOpenNotifications,
  onSelectSede,
}) => {
  const { state, currentUser, toggleFavoriteSede } = useApp();
  const [query, setQuery] = useState(initialQuery);
  const [tipo, setTipo] = useState<'Todas' | 'Pública' | 'Privada'>('Todas');
  const [soloIluminacion, setSoloIluminacion] = useState(false);
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [viewMode, setViewMode] = useState<'lista' | 'mapa'>('lista');

  const filteredSedes = useMemo(() => {
    return state.sedes.filter((sede) => {
      if (!sede.activa) return false;
      if (tipo !== 'Todas' && sede.tipo !== tipo) return false;
      if (soloFavoritos && !currentUser.favoritosSedes.includes(sede.id)) return false;

      const courts = state.canchas.filter((c) => c.sedeId === sede.id);
      if (soloIluminacion && !courts.some((c) => c.iluminacion)) return false;

      if (query.trim()) {
        const q = query.toLowerCase();
        const matches =
          sede.nombre.toLowerCase().includes(q) ||
          sede.distrito.toLowerCase().includes(q) ||
          sede.provincia.toLowerCase().includes(q) ||
          courts.some((c) => c.superficie.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [state.sedes, state.canchas, tipo, soloIluminacion, soloFavoritos, query, currentUser.favoritosSedes]);

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        variant="net"
        onBack={onBack}
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
      >
        <div className="pb-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-white">Clubes y canchas</h1>
              <p className="text-xs text-white/80">
                Demostración: {state.sedes.length}/{state.commercialCapacity.maxSedes} sedes ·{' '}
                {state.canchas.length}/{state.commercialCapacity.maxCanchas} canchas
              </p>
            </div>
            <div className="flex items-center bg-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('lista')}
                aria-label="Vista lista"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  viewMode === 'lista' ? 'bg-[#ACD638] text-[#16223B]' : 'text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mapa')}
                aria-label="Vista mapa ilustrativo"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  viewMode === 'mapa' ? 'bg-[#ACD638] text-[#16223B]' : 'text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Mapa
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center rounded-full bg-white px-4 py-2.5 shadow-sm">
            <Search className="w-4 h-4 text-[#273758] shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar club, distrito o superficie..."
              aria-label="Buscar sedes o superficies"
              className="ml-2.5 w-full bg-transparent text-sm text-[#1E2B45] placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <select
              aria-label="Filtrar por tipo de sede"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'Todas' | 'Pública' | 'Privada')}
              className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#1E2B45]"
            >
              <option value="Todas">Tipo: Todas</option>
              <option value="Pública">Públicas</option>
              <option value="Privada">Privadas</option>
            </select>

            <button
              type="button"
              onClick={() => setSoloIluminacion((v) => !v)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer ${
                soloIluminacion ? 'bg-[#ACD638] text-[#16223B]' : 'bg-white/15 text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              LED
            </button>

            <button
              type="button"
              onClick={() => setSoloFavoritos((v) => !v)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer ${
                soloFavoritos ? 'bg-[#ACD638] text-[#16223B]' : 'bg-white/15 text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Favoritos
            </button>
          </div>
        </div>
      </HeaderBar>

      <div className="flex-1 p-4 space-y-3">
        {viewMode === 'mapa' && (
          <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#273758]">
                Mapa ilustrativo ({filteredSedes.length} sedes)
              </span>
              <span className="text-[11px] text-slate-400">Vista demostrativa</span>
            </div>
            <svg viewBox="0 0 360 150" className="w-full h-36 rounded-xl bg-[#E6EEF8]">
              <path
                d="M15 95 Q80 65 145 85 T255 72 T345 92 L345 135 L15 135 Z"
                fill="#C8DCF2"
              />
              <path
                d="M18 88 Q90 48 165 72 T265 55 T340 82"
                fill="none"
                stroke="#273758"
                strokeWidth="3"
                strokeDasharray="4 4"
                opacity="0.35"
              />
              {filteredSedes.map((s, idx) => {
                const coords = [
                  { x: 245, y: 74 },
                  { x: 185, y: 84 },
                  { x: 115, y: 70 },
                ][idx % 3];
                return (
                  <g key={s.id} onClick={() => onSelectSede(s.id)} className="cursor-pointer">
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r="10"
                      fill="#ACD638"
                      stroke="#273758"
                      strokeWidth="2.5"
                    />
                    <text
                      x={coords.x}
                      y={coords.y - 14}
                      textAnchor="middle"
                      fontSize="8.5"
                      fontWeight="700"
                      fill="#1E2B45"
                    >
                      {s.distrito}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {filteredSedes.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-bold text-[#1E2B45]">No encontramos sedes con esos filtros</p>
            <p className="mt-1 text-xs text-slate-500">Prueba quitando filtros para ver todas las canchas.</p>
          </div>
        ) : (
          filteredSedes.map((sede) => {
            const courts = state.canchas.filter((c) => c.sedeId === sede.id);
            const availableCourts = courts.filter((c) => c.estado === 'Disponible');
            const minPrice = Math.min(...courts.map((c) => c.precioHora));
            const isFav = currentUser.favoritosSedes.includes(sede.id);

            return (
              <div
                key={sede.id}
                className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="relative h-32">
                  <CourtScene
                    sedeId={sede.id}
                    isPublic={sede.tipo === 'Pública'}
                    variant={sede.imagenVariant}
                    clubLabel={sede.nombre}
                  />
                  <button
                    type="button"
                    onClick={() => toggleFavoriteSede(sede.id)}
                    aria-label="Alternar favorito"
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/45 flex items-center justify-center text-white cursor-pointer"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-[#ACD638] text-[#ACD638]' : ''}`} />
                  </button>
                  <span className="absolute bottom-2.5 left-2.5 rounded-lg bg-[#273758]/90 px-2.5 py-1 text-[11px] font-bold text-white">
                    {sede.tipo} · {availableCourts.length}/{courts.length} canchas activas
                  </span>
                </div>
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-[#1E2B45]">{sede.nombre}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {sede.distrito}, {sede.provincia}
                        </span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#1E2B45]">
                        <Star className="w-3.5 h-3.5 fill-[#ACD638] text-[#ACD638]" />
                        {sede.rating}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        ({sede.resenasCount} reseñas)
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between pt-2.5 border-t border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Tarifa por hora</span>
                      <span className="text-sm font-extrabold text-[#273758] tabular-nums">
                        {`Desde B/. ${minPrice.toFixed(2)}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectSede(sede.id)}
                      className="rounded-xl bg-[#B6E22E] hover:bg-[#ACD638] px-4 py-2 text-xs font-extrabold text-[#16223B] cursor-pointer"
                    >
                      Ver disponibilidad
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
