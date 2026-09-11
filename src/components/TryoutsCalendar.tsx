import React, { useState } from 'react';
import { ClubSearch } from '../types';
import { Calendar, MapPin, Clock, Filter, CheckCircle2, Share2, Building2 } from 'lucide-react';
import { ARGENTINA_PROVINCES } from '../constants/provinces';

interface TryoutsCalendarProps {
  searches: ClubSearch[];
  onApplyToSearch: (searchId: string) => void;
}

export const TryoutsCalendar: React.FC<TryoutsCalendarProps> = ({ searches, onApplyToSearch }) => {
  const [selectedSport, setSelectedSport] = useState<string>('Todos');
  const [selectedProvince, setSelectedProvince] = useState<string>('Todas');
  const [addedCalendarId, setAddedCalendarId] = useState<string | null>(null);

  const provinces = ['Todas', ...ARGENTINA_PROVINCES];

  const filteredSearches = searches.filter((s) => {
    const matchSport = selectedSport === 'Todos' || s.sport === selectedSport;
    const matchProv = selectedProvince === 'Todas' || s.province === selectedProvince;
    return matchSport && matchProv;
  });

  const handleAddToCalendar = (id: string) => {
    setAddedCalendarId(id);
    setTimeout(() => setAddedCalendarId(null), 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner Bento Card */}
      <div className="bg-[#161618] rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#00ff41]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#00ff41]" />
            <h1 className="text-xl sm:text-3xl font-black text-white uppercase italic tracking-tight">Calendario de Pruebas Presenciales</h1>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Encuentra las próximas convocatorias abiertas de clubes de todo el país organizadas por fecha y provincia.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="flex items-center gap-2 bg-[#0a0a0c] px-3.5 py-2 rounded-2xl border border-white/10 text-xs text-white/80">
            <Filter className="w-3.5 h-3.5 text-[#00ff41]" />
            <span className="uppercase font-bold text-[10px] tracking-wider text-white/50">Deporte:</span>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="bg-transparent text-[#00ff41] font-bold focus:outline-none"
            >
              <option value="Todos" className="bg-[#161618]">Todos</option>
              <option value="Fútbol" className="bg-[#161618]">Fútbol</option>
              <option value="Básquet" className="bg-[#161618]">Básquet</option>
              <option value="Vóley" className="bg-[#161618]">Vóley</option>
              <option value="Rugby" className="bg-[#161618]">Rugby</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#0a0a0c] px-3.5 py-2 rounded-2xl border border-white/10 text-xs text-white/80">
            <span className="uppercase font-bold text-[10px] tracking-wider text-white/50">Provincia:</span>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="bg-transparent text-[#00ff41] font-bold focus:outline-none"
            >
              {provinces.map((p) => (
                <option key={p} value={p} className="bg-[#161618]">{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tryouts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSearches.map((search) => (
          <div
            key={search.id}
            id={`calendar-trial-card-${search.id}`}
            className="bg-[#161618] rounded-3xl border border-white/10 p-6 shadow-2xl hover:border-[#00ff41]/50 transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30">
                  {search.sport} • {search.positionNeeded}
                </span>
                <span className="text-xs font-bold text-white/60 flex items-center gap-1 uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 text-[#00ff41]" /> {search.clubName}
                </span>
              </div>

              <h3 className="text-lg font-black text-white">{search.title}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/5 font-mono">
                <div className="flex items-center gap-2 text-[#00ff41] font-bold">
                  <Calendar className="w-4 h-4 text-[#00ff41]" />
                  <span>{search.trialDate}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Clock className="w-4 h-4 text-white/40" />
                  <span>{search.trialTime}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-[#00ff41] shrink-0" />
                  <span>{search.locationDetails}</span>
                </div>
              </div>

              <p className="text-xs text-white/70 leading-relaxed font-normal">{search.description}</p>

              <div>
                <h4 className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest mb-1">Requisitos:</h4>
                <ul className="space-y-1 text-xs text-white/80">
                  {search.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-[#00ff41] font-bold">•</span> {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                id={`btn-add-cal-${search.id}`}
                onClick={() => handleAddToCalendar(search.id)}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 border border-white/10"
              >
                <Share2 className="w-3.5 h-3.5" />
                {addedCalendarId === search.id ? '¡Guardado!' : 'Agendar'}
              </button>

              <button
                id={`btn-apply-trial-${search.id}`}
                onClick={() => onApplyToSearch(search.id)}
                className="px-4 py-2 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20"
              >
                Postularme
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
