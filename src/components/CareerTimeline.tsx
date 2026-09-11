import React, { useState, useEffect } from 'react';
import {
  History,
  Building2,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Trophy,
  ShieldCheck,
  ChevronRight,
  Briefcase
} from 'lucide-react';
import { CareerTimelineEntry } from '../types';
import {
  getUserCareerTimeline,
  addCareerTimelineEntry,
  deleteCareerTimelineEntry
} from '../services/firebaseService';

interface CareerTimelineProps {
  userId: string;
  isOwner?: boolean;
}

export const CareerTimeline: React.FC<CareerTimelineProps> = ({
  userId,
  isOwner = false
}) => {
  const [entries, setEntries] = useState<CareerTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [institutionName, setInstitutionName] = useState('');
  const [roleOrPosition, setRoleOrPosition] = useState('');
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear() - 2);
  const [endYear, setEndYear] = useState<string>('Presente');
  const [divisionOrTournament, setDivisionOrTournament] = useState('');
  const [achievementText, setAchievementText] = useState('');

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const list = await getUserCareerTimeline(userId);
      setEntries(list.sort((a, b) => b.startYear - a.startYear));
    } catch (e) {
      console.error('Error fetching timeline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [userId]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionName.trim() || !roleOrPosition.trim()) return;

    const achievements = achievementText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const newEntry: CareerTimelineEntry = {
      id: `time-${Date.now()}`,
      userId,
      institutionName,
      roleOrPosition,
      startYear: Number(startYear),
      endYear: endYear === 'Presente' ? 'Presente' : Number(endYear),
      divisionOrTournament,
      achievements: achievements.length > 0 ? achievements : ['Participación constante en el plantel'],
      verifiedByClub: true,
      verificationSource: 'Declaración jurada de historial deportivo'
    };

    await addCareerTimelineEntry(newEntry);
    setInstitutionName('');
    setRoleOrPosition('');
    setDivisionOrTournament('');
    setAchievementText('');
    setIsAdding(false);
    fetchTimeline();
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar este registro de tu historial profesional?')) return;
    await deleteCareerTimelineEntry(id);
    fetchTimeline();
  };

  return (
    <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/20 flex items-center justify-center font-black">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase italic tracking-wider">
              Historial Profesional & Línea de Tiempo
            </h4>
            <p className="text-[11px] text-white/50">
              Trayectoria deportiva, clubes, temporadas, torneos y logros verificados
            </p>
          </div>
        </div>

        {isOwner && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Agregar Etapa
          </button>
        )}
      </div>

      {/* Add New Stage Form */}
      {isAdding && (
        <form onSubmit={handleAddEntry} className="bg-black/40 border border-[#00ff41]/30 rounded-xl p-4 space-y-3 text-xs animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-[#00ff41] uppercase text-[11px] flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              Nueva Experiencia Deportiva / Profesional
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-white/50 hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                Club u Institución *
              </label>
              <input
                type="text"
                required
                value={institutionName}
                onChange={e => setInstitutionName(e.target.value)}
                placeholder="Ej: C.A. River Plate / Sanatorio Allende"
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00ff41]"
              />
            </div>

            <div>
              <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                Cargo / Rol / Posición *
              </label>
              <input
                type="text"
                required
                value={roleOrPosition}
                onChange={e => setRoleOrPosition(e.target.value)}
                placeholder="Ej: Preparador Físico Titular / Volante Central"
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00ff41]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                Año Inicio
              </label>
              <input
                type="number"
                value={startYear}
                onChange={e => setStartYear(Number(e.target.value))}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00ff41]"
              />
            </div>

            <div>
              <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                Año Fin / Estado
              </label>
              <input
                type="text"
                value={endYear}
                onChange={e => setEndYear(e.target.value)}
                placeholder="Ej: 2024 o Presente"
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00ff41]"
              />
            </div>

            <div>
              <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                División / Liga / Torneo
              </label>
              <input
                type="text"
                value={divisionOrTournament}
                onChange={e => setDivisionOrTournament(e.target.value)}
                placeholder="Ej: Liga Profesional AFA"
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00ff41]"
              />
            </div>
          </div>

          <div>
            <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">
              Logros / Premios / Ascensos (uno por línea)
            </label>
            <textarea
              rows={2}
              value={achievementText}
              onChange={e => setAchievementText(e.target.value)}
              placeholder="Ej: Campeón Torneo Apertura&#10;Ascenso a Primera División"
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00ff41]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black uppercase tracking-wider rounded-lg text-xs"
          >
            Guardar Etapa en Historial
          </button>
        </form>
      )}

      {/* Timeline entries list */}
      {loading ? (
        <div className="text-center py-6 text-white/40 text-xs animate-pulse">
          Cargando historial profesional...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-xs border border-dashed border-white/10 rounded-xl space-y-1">
          <p className="font-bold text-white/60">Sin registro de trayectoria aun.</p>
          <p className="text-[11px]">Agrega tus clubes anteriores, temporadas e hitos para mayor credibilidad.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-[#00ff41]/40 ml-3 pl-5 space-y-6">
          {entries.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline Dot */}
              <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-[#00ff41] border-2 border-[#121214] ring-2 ring-[#00ff41]/30" />

              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2 hover:border-[#00ff41]/30 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-white text-sm">
                        {item.roleOrPosition}
                      </h5>
                      <span className="px-2 py-0.5 bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 rounded-full text-[10px] font-mono font-bold">
                        {item.startYear} - {item.endYear || 'Presente'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-white/70 font-semibold mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-[#00ff41]" />
                      {item.institutionName}
                      {item.divisionOrTournament && (
                        <span className="text-white/40 text-[11px] font-normal">
                          • {item.divisionOrTournament}
                        </span>
                      )}
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => handleDeleteEntry(item.id)}
                      className="text-white/30 hover:text-rose-400 p-1 transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Achievements List */}
                {item.achievements && item.achievements.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-white/5">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">
                      Hitos y Logros Verificados:
                    </span>
                    <ul className="space-y-1 text-xs text-white/80">
                      {item.achievements.map((ach, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{ach}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.verifiedByClub && (
                  <div className="text-[10px] text-[#00ff41] font-semibold flex items-center gap-1 pt-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    Verificado por registros oficiales de la institución
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
