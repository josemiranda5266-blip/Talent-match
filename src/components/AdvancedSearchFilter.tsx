import React from 'react';
import { Filter, RefreshCw, Briefcase } from 'lucide-react';
import { SPORTS_LIST, PROFESSIONAL_CATEGORIES_LIST } from '../data/mockData';
import { ARGENTINA_PROVINCES } from '../constants/provinces';

export interface SearchFilterState {
  category: string; // 'Todas' | ProfessionalCategory
  sport: string;
  province: string;
  city: string;
  position: string;
  minAge: number;
  maxAge: number;
  level: string;
  availableOnly: boolean;
}

interface AdvancedSearchFilterProps {
  filters: SearchFilterState;
  onFilterChange: (newFilters: SearchFilterState) => void;
  onResetFilters: () => void;
}

export const PROVINCES_ARGENTINA = [
  'Todas',
  ...ARGENTINA_PROVINCES,
];

export const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  const selectedSportObj = SPORTS_LIST.find((s) => s.name === filters.sport);
  const availablePositions = selectedSportObj ? selectedSportObj.positions : [];

  return (
    <div className="bg-[#161618] border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#00ff41]" />
          <h3 className="font-black text-white uppercase italic text-xs tracking-wider">
            Filtros Avanzados de Scouteo
          </h3>
        </div>
        <button
          onClick={onResetFilters}
          className="text-[11px] text-white/50 hover:text-[#00ff41] font-bold transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Limpiar Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Categoría Profesional */}
        <div>
          <label className="text-white/60 font-bold uppercase text-[10px] flex items-center gap-1 mb-1">
            <Briefcase className="w-3 h-3 text-[#00ff41]" /> Categoría Profesional
          </label>
          <select
            value={filters.category || 'Todas'}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41] font-medium"
          >
            <option value="Todas">Todas las Categorías (18 Perfiles)</option>
            {PROFESSIONAL_CATEGORIES_LIST.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.group})
              </option>
            ))}
          </select>
        </div>

        {/* Deporte */}
        <div>
          <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
            Disciplina Deportiva
          </label>
          <select
            value={filters.sport}
            onChange={(e) => onFilterChange({ ...filters, sport: e.target.value, position: 'Todas' })}
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
          >
            <option value="Todos">Todas las Disciplinas</option>
            {SPORTS_LIST.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Provincia */}
        <div>
          <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
            Provincia
          </label>
          <select
            value={filters.province}
            onChange={(e) => onFilterChange({ ...filters, province: e.target.value })}
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
          >
            {PROVINCES_ARGENTINA.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Ciudad */}
        <div>
          <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
            Ciudad / Municipio
          </label>
          <input
            type="text"
            placeholder="Ej: Rosario, La Plata..."
            value={filters.city}
            onChange={(e) => onFilterChange({ ...filters, city: e.target.value })}
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
          />
        </div>

        {/* Posición */}
        <div>
          <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
            Posición Específica
          </label>
          <select
            value={filters.position}
            onChange={(e) => onFilterChange({ ...filters, position: e.target.value })}
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
          >
            <option value="Todas">Todas las Posiciones</option>
            {availablePositions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {/* Rango Edad */}
        <div>
          <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
            Edad Mínima: <span className="text-[#00ff41]">{filters.minAge} años</span>
          </label>
          <input
            type="range"
            min={12}
            max={35}
            value={filters.minAge}
            onChange={(e) => onFilterChange({ ...filters, minAge: Number(e.target.value) })}
            className="w-full accent-[#00ff41]"
          />
        </div>

        <div>
          <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
            Edad Máxima: <span className="text-[#00ff41]">{filters.maxAge} años</span>
          </label>
          <input
            type="range"
            min={12}
            max={40}
            value={filters.maxAge}
            onChange={(e) => onFilterChange({ ...filters, maxAge: Number(e.target.value) })}
            className="w-full accent-[#00ff41]"
          />
        </div>

        {/* Categoría / Nivel */}
        <div>
          <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
            Categoría / Nivel Competitivo
          </label>
          <select
            value={filters.level}
            onChange={(e) => onFilterChange({ ...filters, level: e.target.value })}
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
          >
            <option value="Todos">Todos los Niveles</option>
            <option value="Amateur">Amateur / Formativo</option>
            <option value="Liga Local / Regional">Liga Local / Regional</option>
            <option value="Semiprofesional">Semiprofesional</option>
            <option value="Profesional">Profesional</option>
          </select>
        </div>

        {/* Disponible para Pruebas */}
        <div className="flex items-center pt-4">
          <label className="flex items-center gap-2 cursor-pointer text-white text-xs">
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(e) => onFilterChange({ ...filters, availableOnly: e.target.checked })}
              className="accent-[#00ff41] w-4 h-4 rounded"
            />
            <span className="font-bold">Solo Disponibles para Pruebas</span>
          </label>
        </div>
      </div>
    </div>
  );
};
