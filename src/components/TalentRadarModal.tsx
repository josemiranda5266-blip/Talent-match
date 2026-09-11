import React, { useState } from 'react';
import { TalentRadarRule, SportType, ProfessionalCategory, AthleteLevel, Athlete } from '../types';
import { ARGENTINA_PROVINCES } from '../constants/provinces';
import {
  X,
  Radar,
  PlusCircle,
  Bell,
  Mail,
  Smartphone,
  CheckCircle2,
  Trash2,
  Users,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { SPORTS_LIST } from '../data/mockData';
import { calculateCandidateCompatibility } from '../lib/scoutAiEngine';

interface TalentRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  clubName: string;
  radars: TalentRadarRule[];
  athletes: Athlete[];
  onCreateRadar: (newRadar: TalentRadarRule) => void;
  onToggleRadar: (radarId: string) => void;
  onDeleteRadar: (radarId: string) => void;
  onViewCandidate: (ath: Athlete) => void;
}

export const TalentRadarModal: React.FC<TalentRadarModalProps> = ({
  isOpen,
  onClose,
  clubId,
  clubName,
  radars,
  athletes,
  onCreateRadar,
  onToggleRadar,
  onDeleteRadar,
  onViewCandidate
}) => {
  const [activeTab, setActiveTab] = useState<'my_radars' | 'create_radar'>('my_radars');
  const [selectedRadarId, setSelectedRadarId] = useState<string>(radars[0]?.id || '');

  // New Radar Form State
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState<SportType>('Fútbol');
  const [categoryNeeded, setCategoryNeeded] = useState<ProfessionalCategory>('Deportista');
  const [positionNeeded, setPositionNeeded] = useState('');
  const [minAge, setMinAge] = useState<number>(16);
  const [maxAge, setMaxAge] = useState<number>(23);
  const [province, setProvince] = useState('');
  const [minLevel, setMinLevel] = useState<AthleteLevel>('Amateur');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);

  if (!isOpen) return null;

  const handleCreateSubmitted = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !positionNeeded) return;

    const newRule: TalentRadarRule = {
      id: `radar-${Date.now()}`,
      clubId,
      clubName,
      title,
      sport,
      categoryNeeded,
      positionNeeded,
      minAge,
      maxAge,
      province,
      minLevel,
      active: true,
      notifyEmail,
      notifyPush,
      createdAt: new Date().toISOString().split('T')[0] ?? new Date().toISOString(),
      matchesCount: 0
    };

    onCreateRadar(newRule);
    setTitle('');
    setPositionNeeded('');
    setActiveTab('my_radars');
    setSelectedRadarId(newRule.id);
  };

  // Find matches for selected radar rule
  const activeRadar = radars.find(r => r.id === selectedRadarId) || radars[0];
  const radarMatches = activeRadar
    ? athletes
        .map(ath => {
          const breakdown = calculateCandidateCompatibility(ath, {
            clubName: activeRadar.clubName,
            sport: activeRadar.sport,
            categoryNeeded: activeRadar.categoryNeeded,
            positionNeeded: activeRadar.positionNeeded,
            minAge: activeRadar.minAge,
            maxAge: activeRadar.maxAge,
            province: activeRadar.province,
            levelRequired: activeRadar.minLevel
          });
          return { athlete: ath, breakdown };
        })
        .filter(m => m.breakdown.score >= 70)
        .sort((a, b) => b.breakdown.score - a.breakdown.score)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121214] border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-[#161618] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-[#00ff41]">
              <Radar className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white uppercase italic tracking-tight">
                  Radar de Talentos Permanentes (Monitoreo IA)
                </h2>
                <span className="bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/30 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase">
                  ScoutAR Radar Activo
                </span>
              </div>
              <p className="text-xs text-white/60">
                Monitoreo continuo de la base de datos para detectar automáticamente nuevos candidatos compatibles.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 bg-[#161618] border-b border-white/10 flex gap-4">
          <button
            onClick={() => setActiveTab('my_radars')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'my_radars'
                ? 'border-[#00ff41] text-[#00ff41]'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            Mis Búsquedas Permanentes ({radars.length})
          </button>
          <button
            onClick={() => setActiveTab('create_radar')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'create_radar'
                ? 'border-[#00ff41] text-[#00ff41]'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Nueva Búsqueda Automática
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'my_radars' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Radar Rules Sidebar List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-white uppercase italic tracking-wider">
                  Reglas de Monitoreo
                </h3>

                {radars.length === 0 ? (
                  <div className="p-4 bg-[#161618] rounded-2xl border border-white/10 text-center space-y-2">
                    <Radar className="w-8 h-8 text-white/30 mx-auto" />
                    <p className="text-xs text-white/60">No tienes radares activos creados.</p>
                    <button
                      onClick={() => setActiveTab('create_radar')}
                      className="px-3 py-1.5 bg-[#00ff41] text-black font-bold text-xs uppercase rounded-xl"
                    >
                      Crear Primer Radar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {radars.map(r => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRadarId(r.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          r.id === selectedRadarId
                            ? 'bg-[#161618] border-[#00ff41] ring-1 ring-[#00ff41]'
                            : 'bg-[#161618] border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">{r.title}</h4>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleRadar(r.id);
                            }}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase cursor-pointer ${
                              r.active ? 'bg-[#00ff41]/20 text-[#00ff41]' : 'bg-white/10 text-white/50'
                            }`}
                          >
                            {r.active ? 'Monitoreando' : 'Pausado'}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/60 mt-1">
                          {r.sport} • {r.positionNeeded} ({r.minAge}-{r.maxAge} años)
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Matched Candidates List for Selected Radar */}
              <div className="md:col-span-2 space-y-4">
                {activeRadar ? (
                  <>
                    <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#00ff41]" /> Coincidencias en Tiempo Real
                        </h4>
                        <p className="text-xs text-white/60">
                          {radarMatches.length} candidatos detectados para "{activeRadar.title}"
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteRadar(activeRadar.id)}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl"
                        title="Eliminar Radar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {radarMatches.map(({ athlete, breakdown }) => (
                        <div
                          key={athlete.id}
                          className="bg-[#161618] p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4 hover:border-[#00ff41]/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={athlete.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                              alt={athlete.name}
                              className="w-12 h-12 rounded-xl object-cover border border-white/10"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-bold text-white">{athlete.name}</h5>
                                <span className="text-amber-400 font-bold text-xs">{breakdown.starRating}</span>
                              </div>
                              <p className="text-xs text-white/60">
                                {athlete.sport} • {athlete.position} ({athlete.age} años) — {athlete.city}, {athlete.province}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 bg-[#00ff41]/20 text-[#00ff41] font-mono font-bold text-xs rounded-xl border border-[#00ff41]/30">
                              {breakdown.score}% Match
                            </span>
                            <button
                              onClick={() => onViewCandidate(athlete)}
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                            >
                              Ver Perfil <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-white/50 italic">Selecciona o crea un radar para visualizar los candidatos.</p>
                )}
              </div>
            </div>
          ) : (
            /* Create New Radar Form */
            <form onSubmit={handleCreateSubmitted} className="space-y-4 max-w-xl mx-auto bg-[#161618] p-6 rounded-3xl border border-white/10">
              <h3 className="text-sm font-black text-white uppercase italic tracking-wide flex items-center gap-2">
                <Radar className="w-4 h-4 text-[#00ff41]" /> Configurar Búsqueda Permanente
              </h3>

              <div>
                <label className="text-xs font-bold text-white/70 block mb-1">Título del Radar / Alerta</label>
                <input
                  type="text"
                  placeholder="Ej: Delanteros Promesa NOA (17-20 años)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#00ff41] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1">Deporte</label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value as SportType)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#00ff41] outline-none"
                  >
                    {SPORTS_LIST.map((s) => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1">Posición / Rol Requerido</label>
                  <input
                    type="text"
                    placeholder="Ej: Delantero Centro"
                    value={positionNeeded}
                    onChange={(e) => setPositionNeeded(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#00ff41] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1">Edad Mínima</label>
                  <input
                    type="number"
                    value={minAge}
                    onChange={(e) => setMinAge(Number(e.target.value))}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#00ff41] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1">Edad Máxima</label>
                  <input
                    type="number"
                    value={maxAge}
                    onChange={(e) => setMaxAge(Number(e.target.value))}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#00ff41] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 block mb-1">Provincia / Región Objetivo</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#00ff41] outline-none"
                >
                  <option value="">Todas las provincias (Nacional)</option>
                  {ARGENTINA_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-bold text-white/70 block">Canales de Notificación Automática</label>
                <div className="flex items-center gap-6 text-xs text-white">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="accent-[#00ff41]"
                    />
                    <Mail className="w-3.5 h-3.5 text-[#00ff41]" /> Correo Electrónico
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyPush}
                      onChange={(e) => setNotifyPush(e.target.checked)}
                      className="accent-[#00ff41]"
                    />
                    <Bell className="w-3.5 h-3.5 text-cyan-400" /> Notificación Push en Plataforma
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
              >
                Activar Monitoreo Automático de Talentos
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
