import React, { useState, useEffect } from 'react';
import { ClubSearch, Athlete, SearchApplication, AIScoutMatch, TalentRadarRule, ScoutMatchBreakdown } from '../types';
import {
  Building2,
  PlusCircle,
  Sparkles,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ShieldAlert,
  Calendar,
  MapPin,
  Trophy,
  Crown,
  Radar,
  Sliders,
  Zap,
  CheckSquare,
  Square,
  Activity,
  ArrowRight
} from 'lucide-react';
import { calculateCandidateCompatibility } from '../lib/scoutAiEngine';
import { MatchBreakdownModal } from './MatchBreakdownModal';
import { CandidateComparatorModal } from './CandidateComparatorModal';
import { TalentRadarModal } from './TalentRadarModal';

interface ClubViewProps {
  searches: ClubSearch[];
  athletes: Athlete[];
  applications: SearchApplication[];
  onOpenCreateSearchModal: () => void;
  onOpenCandidateModal: (ath: Athlete) => void;
  onUpdateApplicationStatus: (appId: string, newStatus: any) => void;
  onRecordClubDecision?: (athleteId: string, actionType: 'favorite' | 'invite' | 'hire' | 'reject') => void;
}

export const ClubView: React.FC<ClubViewProps> = ({
  searches,
  athletes,
  applications,
  onOpenCreateSearchModal,
  onOpenCandidateModal,
  onUpdateApplicationStatus,
  onRecordClubDecision,
}) => {
  const [selectedSearchId, setSelectedSearchId] = useState<string>(searches[0]?.id || '');
  const [filterSport, setFilterSport] = useState<string>('Todos');
  const [filterMinScore, setFilterMinScore] = useState<number>(40);
  const [activeTab, setActiveTab] = useState<'ranking' | 'pipeline' | 'proactive'>('ranking');
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState<'Todos' | 'Pendiente' | 'Preseleccionado' | 'Citado a Prueba' | 'Descartado'>('Todos');

  // Candidate Comparison Selection State (Up to 4 candidates)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isComparatorOpen, setIsComparatorOpen] = useState(false);

  // Match Breakdown Modal State
  const [breakdownModalData, setBreakdownModalData] = useState<{ athlete: Athlete; breakdown: ScoutMatchBreakdown } | null>(null);

  // Talent Radar Modal State
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);
  const [radars, setRadars] = useState<TalentRadarRule[]>([
    {
      id: 'radar-1',
      clubId: 'club-demo',
      clubName: 'C.A. San Martín (Tucumán)',
      title: 'Delantero Centro Promesa NOA (16-21 años)',
      sport: 'Fútbol',
      positionNeeded: 'Delantero Centro',
      minAge: 16,
      maxAge: 21,
      province: 'Tucumán',
      minLevel: 'Amateur',
      active: true,
      notifyEmail: true,
      notifyPush: true,
      createdAt: '2026-07-20',
      matchesCount: 4
    }
  ]);

  const activeSearch = searches.find((s) => s.id === selectedSearchId) || searches[0];

  // Calculate quality-ranked candidates using ScoutAR AI Engine
  const rankedAthletes = athletes
    .map((ath) => {
      const breakdown = calculateCandidateCompatibility(ath, activeSearch || {});
      return {
        ...ath,
        breakdown,
        aiScore: breakdown.score,
        starRating: breakdown.starRating,
        keyReasons: breakdown.pros.slice(0, 2),
        tacticalAnalysis: breakdown.tacticalAnalysis,
        recommendedRole: breakdown.recommendedRole,
      };
    })
    .filter((ath) => filterSport === 'Todos' || ath.sport === filterSport)
    .filter((ath) => ath.aiScore >= filterMinScore)
    .sort((a, b) => b.aiScore - a.aiScore);

  // Toggle candidate selection for comparison matrix
  const handleToggleCandidateSelect = (id: string) => {
    setSelectedCandidateIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        alert('Solo puedes seleccionar hasta 4 candidatos simultáneamente para la comparativa.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const selectedCandidatesForComparison = athletes.filter((a) => selectedCandidateIds.includes(a.id));

  // Filter applicants for active search
  const currentSearchApplications = applications.filter((app) => app.searchId === activeSearch?.id);

  // Radar Handlers
  const handleCreateRadar = (newRadar: TalentRadarRule) => {
    setRadars((prev) => [newRadar, ...prev]);
  };

  const handleToggleRadar = (id: string) => {
    setRadars((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const handleDeleteRadar = (id: string) => {
    setRadars((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Club Header Panel Bento Card */}
      <div id="club-header-banner" className="bg-[#161618] rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#00ff41]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#0a0a0c] border border-white/10 flex items-center justify-center p-2 text-[#00ff41]">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight">
                Panel de Scouting & Motor ScoutAR AI
              </h1>
              <span className="bg-[#00ff41]/10 text-[#00ff41] text-[10px] px-2.5 py-0.5 rounded-full border border-[#00ff41]/30 font-extrabold uppercase tracking-widest">
                ScoutAR AI Activo
              </span>
            </div>
            <p className="text-xs text-white/60 mt-1">
              Algoritmo multidimensional de compatibilidad, comparador inteligente de perfiles y radar de talentos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={() => setIsRadarModalOpen(true)}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 flex items-center gap-2"
          >
            <Radar className="w-4 h-4 text-[#00ff41]" />
            Radar de Talentos ({radars.filter(r => r.active).length})
          </button>

          <button
            id="btn-new-search-modal"
            onClick={onOpenCreateSearchModal}
            className="px-5 py-3 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 hover:scale-105 transition-transform flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Publicar Búsqueda
          </button>
        </div>
      </div>

      {/* Proactive AI Feed Banner */}
      <div className="bg-gradient-to-r from-[#161618] via-[#1a1c1e] to-[#121214] p-5 rounded-3xl border border-[#00ff41]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <span className="text-[10px] text-[#00ff41] uppercase font-mono font-bold tracking-widest">
              Recomendación Proactiva ScoutAR AI
            </span>
            <h3 className="text-sm font-extrabold text-white">
              Encontramos 3 nuevos candidatos con +90% de compatibilidad para tus convocatorias activas.
            </h3>
          </div>
        </div>

        <button
          onClick={() => {
            setActiveTab('ranking');
            setFilterMinScore(75);
          }}
          className="px-4 py-2 bg-[#00ff41] text-black font-extrabold text-xs uppercase rounded-xl hover:bg-[#00ff41]/90 shrink-0"
        >
          Ver Oportunidades
        </button>
      </div>

      {/* Active Searches Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white uppercase italic tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#00ff41]" /> Convocatorias y Búsquedas del Club
          </h2>
          <span className="text-xs text-white/50 font-mono">{searches.length} convocatorias activas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {searches.map((search) => {
            const isSelected = search.id === selectedSearchId;
            return (
              <button
                key={search.id}
                id={`search-card-select-${search.id}`}
                onClick={() => setSelectedSearchId(search.id)}
                className={`text-left p-5 rounded-3xl border transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#161618] border-[#00ff41] text-white ring-1 ring-[#00ff41] shadow-xl'
                    : 'bg-[#161618] border-white/10 text-white/80 hover:border-white/30'
                }`}
              >
                {search.isFeatured && (
                  <span className="absolute top-3 right-3 text-[9px] bg-[#00ff41] text-black font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    DESTACADA
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#00ff41] bg-[#00ff41]/10 px-2 py-0.5 rounded-md border border-[#00ff41]/20">
                    {search.categoryNeeded || 'Deportista'}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-white/50">{search.sport}</span>
                </div>
                <h3 className="text-sm font-extrabold truncate mt-1 text-white">{search.title}</h3>
                <p className="text-xs text-white/60 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#00ff41]" /> {search.city} • {search.positionNeeded}
                </p>
                {search.salaryOrRemuneration && (
                  <p className="text-[11px] text-[#00ff41] font-mono mt-1 font-bold truncate">
                    💵 {search.salaryOrRemuneration}
                  </p>
                )}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60 font-mono">
                  <span>Prueba: {search.trialDate}</span>
                  <span className="text-[#00ff41] font-black">{search.applicantCount} postulantes</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* View Mode Switcher: Ranking IA vs Proceso de Selección CRM */}
      <div className="bg-[#161618] p-2 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'ranking'
                ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Ranking ScoutAR AI ({rankedAthletes.length})
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'pipeline'
                ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" /> Proceso de Selección CRM ({currentSearchApplications.length})
          </button>
        </div>

        {selectedCandidateIds.length > 0 && (
          <button
            onClick={() => setIsComparatorOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 animate-bounce"
          >
            <Users className="w-4 h-4" /> Comparar {selectedCandidateIds.length} Candidatos
          </button>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      {activeTab === 'ranking' && activeSearch && (
        <div id="ai-candidate-ranking-section" className="bg-[#161618] rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00ff41]" />
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">
                  Ranking de Compatibilidad Automático
                </h3>
              </div>
              <p className="text-xs text-white/50 mt-1">
                Motor multidimensional ordenando por calidad y jerarquía física, técnica y actitudinal.
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#0a0a0c] px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white/80">
                <Filter className="w-3.5 h-3.5 text-[#00ff41]" />
                <span className="uppercase font-bold text-[10px] tracking-wider text-white/50">Min Match IA:</span>
                <select
                  value={filterMinScore}
                  onChange={(e) => setFilterMinScore(Number(e.target.value))}
                  className="bg-transparent text-[#00ff41] font-mono font-bold focus:outline-none"
                >
                  <option value={40} className="bg-[#161618]">40%+</option>
                  <option value={60} className="bg-[#161618]">60%+</option>
                  <option value={75} className="bg-[#161618]">75% (Élite)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-[#0a0a0c] px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white/80">
                <span className="uppercase font-bold text-[10px] tracking-wider text-white/50">Deporte:</span>
                <select
                  value={filterSport}
                  onChange={(e) => setFilterSport(e.target.value)}
                  className="bg-transparent text-[#00ff41] font-bold focus:outline-none"
                >
                  <option value="Todos" className="bg-[#161618]">Todos</option>
                  <option value="Fútbol" className="bg-[#161618]">Fútbol</option>
                  <option value="Básquet" className="bg-[#161618]">Básquet</option>
                  <option value="Vóley" className="bg-[#161618]">Vóley</option>
                  <option value="Rugby" className="bg-[#161618]">Rugby</option>
                  <option value="Hockey" className="bg-[#161618]">Hockey</option>
                </select>
              </div>
            </div>
          </div>

          {/* Candidates Grid */}
          {rankedAthletes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rankedAthletes.map((ath) => {
                const application = currentSearchApplications.find((app) => app.athleteId === ath.id);
                const isSelectedForComp = selectedCandidateIds.includes(ath.id);

                return (
                  <div
                    key={ath.id}
                    id={`ranked-athlete-card-${ath.id}`}
                    className={`bg-[#0a0a0c] rounded-3xl p-5 border transition-all space-y-4 flex flex-col justify-between relative ${
                      isSelectedForComp
                        ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-[#121216]'
                        : 'border-white/10 hover:border-[#00ff41]/50'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header: Selection Checkbox + Score + Stars */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleToggleCandidateSelect(ath.id)}
                          className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white"
                          title="Seleccionar para comparativa"
                        >
                          {isSelectedForComp ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4 text-white/30" />
                          )}
                          <span className="text-[10px] uppercase font-bold">Comparar</span>
                        </button>

                        <div
                          onClick={() => setBreakdownModalData({ athlete: ath, breakdown: ath.breakdown })}
                          className="cursor-pointer flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          <span className="text-amber-400 font-bold text-xs">{ath.starRating}</span>
                          <span className="text-lg font-black text-[#00ff41] font-mono bg-[#00ff41]/10 px-2 py-0.5 rounded-lg border border-[#00ff41]/30">
                            {ath.aiScore}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar Score */}
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00ff41] rounded-full"
                          style={{ width: `${ath.aiScore}%` }}
                        />
                      </div>

                      {/* Athlete Basic Info */}
                      <div className="flex items-center gap-3">
                        <img
                          src={ath.avatar}
                          alt={ath.name}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-extrabold text-white hover:text-[#00ff41] transition-colors">
                              {ath.name}
                            </h4>
                            {ath.verificationTier && (
                              <span className="px-1.5 py-0.2 bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/30 rounded text-[9px] font-bold uppercase">
                                {ath.verificationTier}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/60">
                            {ath.category || 'Deportista'} • {ath.position} ({ath.age} años)
                          </p>
                          <p className="text-[11px] text-white/40 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#00ff41]" /> {ath.city}, {ath.province}
                          </p>
                        </div>
                      </div>

                      {/* AI Pros List */}
                      {ath.keyReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {ath.keyReasons.map((reason, idx) => (
                            <span key={idx} className="bg-[#00ff41]/10 text-[#00ff41] text-[10px] px-2 py-0.5 rounded-full border border-[#00ff41]/20 font-mono">
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setBreakdownModalData({ athlete: ath, breakdown: ath.breakdown })}
                        className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold uppercase rounded-xl flex items-center gap-1"
                      >
                        <Activity className="w-3.5 h-3.5" /> Ver Desglose IA
                      </button>

                      <button
                        onClick={() => onOpenCandidateModal(ath)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1 border border-white/10"
                      >
                        Ficha <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
              <Users className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-xs text-white/50 font-bold uppercase tracking-wider">No se encontraron atletas que superen el filtro de match actual.</p>
            </div>
          )}
        </div>
      )}

      {/* PIPELINE CRM VIEW */}
      {activeTab === 'pipeline' && (
        <div className="bg-[#161618] rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white uppercase italic tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00ff41]" /> Proceso de Selección & Postulantes Directos
            </h3>

            <div className="flex items-center gap-2 text-xs">
              {(['Todos', 'Pendiente', 'Preseleccionado', 'Citado a Prueba', 'Descartado'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setPipelineStatusFilter(status)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-colors ${
                    pipelineStatusFilter === status
                      ? 'bg-[#00ff41] text-black'
                      : 'bg-[#0a0a0c] text-white/60 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {currentSearchApplications.filter(app => pipelineStatusFilter === 'Todos' || app.status === pipelineStatusFilter).map((app) => {
              const candidate = athletes.find(a => a.id === app.athleteId);
              if (!candidate) return null;

              return (
                <div key={app.id} className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={candidate.avatar}
                      alt={candidate.name}
                      className="w-12 h-12 rounded-xl object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{candidate.name}</h4>
                        <span className="px-2 py-0.5 bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 rounded text-[10px] font-bold uppercase">
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/60">
                        Postulado el {app.appliedAt} • {candidate.position} ({candidate.city})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onUpdateApplicationStatus(app.id, 'Preseleccionado');
                        if (onRecordClubDecision) onRecordClubDecision(candidate.id, 'favorite');
                      }}
                      className="px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs uppercase rounded-xl hover:bg-amber-500/30"
                    >
                      Preseleccionar
                    </button>
                    <button
                      onClick={() => {
                        onUpdateApplicationStatus(app.id, 'Citado a Prueba');
                        if (onRecordClubDecision) onRecordClubDecision(candidate.id, 'invite');
                      }}
                      className="px-3 py-1.5 bg-[#00ff41] text-black font-extrabold text-xs uppercase rounded-xl shadow-lg shadow-[#00ff41]/20"
                    >
                      Citación a Prueba
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODALS INTEGRATION */}
      {breakdownModalData && (
        <MatchBreakdownModal
          isOpen={Boolean(breakdownModalData)}
          onClose={() => setBreakdownModalData(null)}
          athlete={breakdownModalData.athlete}
          breakdown={breakdownModalData.breakdown}
          searchTitle={activeSearch?.title}
          onInviteToTrial={(athId) => {
            const app = applications.find(a => a.athleteId === athId && a.searchId === activeSearch?.id);
            if (app) {
              onUpdateApplicationStatus(app.id, 'Citado a Prueba');
            }
          }}
        />
      )}

      <CandidateComparatorModal
        isOpen={isComparatorOpen}
        onClose={() => setIsComparatorOpen(false)}
        candidates={selectedCandidatesForComparison}
        searchContext={activeSearch}
        onInviteCandidate={(athId) => {
          onOpenCandidateModal(athletes.find(a => a.id === athId) || athletes[0]);
        }}
      />

      <TalentRadarModal
        isOpen={isRadarModalOpen}
        onClose={() => setIsRadarModalOpen(false)}
        clubId="club-demo"
        clubName="C.A. San Martín"
        radars={radars}
        athletes={athletes}
        onCreateRadar={handleCreateRadar}
        onToggleRadar={handleToggleRadar}
        onDeleteRadar={handleDeleteRadar}
        onViewCandidate={onOpenCandidateModal}
      />
    </div>
  );
};
