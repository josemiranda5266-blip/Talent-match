import React, { useState } from 'react';
import {
  Athlete,
  ClubSearch,
  UserRole,
  InverseMatchOpportunity,
  AutoApplicationSetting,
  SmartNotificationItem,
  PredictiveSuccessModel,
  SmartGoalItem,
  ExecutiveDashboardData,
  Tournament,
} from '../types';
import {
  calculateInverseMatches,
  calculatePredictiveSuccess,
  generateSmartGoals,
  generateSmartNotifications,
  calculateExecutiveDashboardData,
} from '../lib/scoutAiEngine';
import {
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Award,
  CheckCircle2,
  Video,
  Bell,
  Eye,
  UserCheck,
  Send,
  MapPin,
  Bot,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Building2,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface SmartFeedViewProps {
  currentUserRole: UserRole;
  currentAthlete?: Athlete;
  activeSearches: ClubSearch[];
  allCandidates: Athlete[];
  tournaments: Tournament[];
  onOpenCoachAi: () => void;
  onOpenScoutAi: () => void;
  onApplyToSearch: (searchId: string, isAuto?: boolean) => void;
  onSelectSearch?: (search: ClubSearch) => void;
  onSelectAthlete?: (athlete: Athlete) => void;
  onOpenExecutiveDashboard: () => void;
}

export const SmartFeedView: React.FC<SmartFeedViewProps> = ({
  currentUserRole,
  currentAthlete,
  activeSearches,
  allCandidates,
  tournaments,
  onOpenCoachAi,
  onOpenScoutAi,
  onApplyToSearch,
  onSelectSearch,
  onSelectAthlete,
  onOpenExecutiveDashboard,
}) => {
  // Auto-application settings state
  const [autoApplySettings, setAutoApplySettings] = useState<AutoApplicationSetting>({
    enabled: true,
    minMatchScoreThreshold: 95,
    maxMonthlyApplications: 10,
    notifyOnApply: true,
    history: [
      {
        id: 'auto_1',
        searchId: activeSearches[0]?.id || 's1',
        searchTitle: activeSearches[0]?.title || 'Delantero Titular LPF',
        clubName: activeSearches[0]?.clubName || 'Central Córdoba',
        matchScore: 97,
        appliedAt: 'Ayer, 18:30 hs',
      },
    ],
  });

  const [appliedSearchIds, setAppliedSearchIds] = useState<string[]>([]);
  const [showAutoSettingsModal, setShowAutoSettingsModal] = useState(false);

  // If role is Athlete / Professional
  const isAthlete = currentUserRole === 'athlete';

  // Calculations for athlete
  const athleteObj = currentAthlete || allCandidates[0];
  if (!athleteObj) return null;
  const inverseMatches = calculateInverseMatches(athleteObj, activeSearches);
  const predictions: PredictiveSuccessModel = calculatePredictiveSuccess(athleteObj, activeSearches);
  const smartGoals: SmartGoalItem[] = generateSmartGoals(athleteObj);
  const smartNotifications: SmartNotificationItem[] = generateSmartNotifications(athleteObj, activeSearches);
  const execData: ExecutiveDashboardData = calculateExecutiveDashboardData(athleteObj, activeSearches);

  const completedGoals = smartGoals.filter((g) => g.completed).length;

  const handleManualApply = (searchId: string) => {
    setAppliedSearchIds((prev) => [...prev, searchId]);
    onApplyToSearch(searchId, false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      {/* HEADER BANNER - DESCUBRIMIENTO INTELIGENTE SCOUTAR AI */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#121214] via-[#1a1a1e] to-[#0d1f12] p-6 sm:p-8 rounded-3xl border border-[#00ff41]/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff41]/10 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] text-xs font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Motor ScoutAR AI Activo v5.0
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white italic tracking-tight uppercase">
              {isAthlete ? (
                <>Hola <span className="text-[#00ff41]">{athleteObj?.name}</span>, ¡Tu Feed Inteligente está Listo!</>
              ) : (
                <>Ecosistema de Scouting e Inteligencia Deportiva</>
              )}
            </h1>

            <p className="text-sm text-white/70 max-w-2xl leading-relaxed">
              {isAthlete
                ? 'ScoutAR AI analiza continuamente tus estadísticas, videos y verificaciones para conectarte automáticamente con convocatorias oficiales de clubes.'
                : 'Descubrimiento proactivo de talentos, convocatorias optimizadas y asistente conversacional de contrataciones para clubes.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isAthlete ? (
              <button
                onClick={onOpenCoachAi}
                className="px-5 py-3 bg-[#00ff41] hover:bg-[#00e038] text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-[#00ff41]/20 flex items-center gap-2 hover:scale-105 transition-all"
              >
                <Bot className="w-4 h-4" /> Hablar con Coach IA
              </button>
            ) : (
              <button
                onClick={onOpenScoutAi}
                className="px-5 py-3 bg-[#00ff41] hover:bg-[#00e038] text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-[#00ff41]/20 flex items-center gap-2 hover:scale-105 transition-all"
              >
                <Bot className="w-4 h-4" /> Asistente Scout IA
              </button>
            )}

            <button
              onClick={onOpenExecutiveDashboard}
              className="px-5 py-3 bg-[#161618] hover:bg-[#222226] text-white border border-white/20 font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all"
            >
              <BarChart3 className="w-4 h-4 text-[#00ff41]" /> Dashboard Ejecutivo
            </button>
          </div>
        </div>
      </div>

      {/* METRIC STRIP (4 METRICS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Índice Visibilidad</span>
            <Eye className="w-4 h-4 text-[#00ff41]" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{execData.visibilityIndex}%</p>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-[#00ff41] h-full rounded-full" style={{ width: `${execData.visibilityIndex}%` }} />
          </div>
        </div>

        <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Prob. Contratación</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">{predictions.hiringProbability}%</p>
          <span className="text-[10px] text-white/50">{predictions.expectedInterestLevel} interés esperado</span>
        </div>

        <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Objetivos Cumplidos</span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">{completedGoals} / {smartGoals.length}</p>
          <span className="text-[10px] text-white/50">+{execData.visibilityIndex - 35}% visibilidad extra</span>
        </div>

        <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Ranking Categoría</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-lg font-black text-purple-300 truncate">{execData.nationalRankCategory}</p>
          <span className="text-[10px] text-white/50">Región NOA / Argentina</span>
        </div>
      </div>

      {/* ATHLETE FEED OR CLUB FEED */}
      {isAthlete ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN COLUMN (LEFT 2 COLS) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. MATCH INVERSO - OPORTUNIDADES AUTOMÁTICAS */}
            <div className="bg-[#161618] p-6 rounded-3xl border border-[#00ff41]/30 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#00ff41]/10 rounded-2xl border border-[#00ff41]/30 text-[#00ff41]">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white italic uppercase">
                      Match Inverso – Nuevas Oportunidades Encontradas
                    </h2>
                    <p className="text-xs text-white/60">
                      Búsquedas activas recalculadas en tiempo real para tu perfil ({inverseMatches.length} detectadas)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAutoSettingsModal(true)}
                  className="px-3 py-1.5 bg-[#0a0a0c] hover:bg-[#202025] text-xs text-[#00ff41] border border-[#00ff41]/30 rounded-xl flex items-center gap-1.5 font-bold transition-all"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Postulación Auto ({autoApplySettings.enabled ? 'ON' : 'OFF'})
                </button>
              </div>

              {/* AUTOMATIC APPLY STATUS BANNER */}
              {autoApplySettings.enabled && (
                <div className="bg-[#00ff41]/10 border border-[#00ff41]/30 p-4 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-white">
                    <ShieldCheck className="w-4 h-4 text-[#00ff41]" />
                    <span>
                      Modo Automático Activo: La IA enviará tu perfil cuando la compatibilidad supere el{' '}
                      <strong className="text-[#00ff41]">{autoApplySettings.minMatchScoreThreshold}%</strong>.
                    </span>
                  </div>
                  <span className="text-[10px] bg-[#00ff41] text-black font-black px-2 py-0.5 rounded-lg">
                    {autoApplySettings.history.length} Enviadas
                  </span>
                </div>
              )}

              {/* LIST OF INVERSE MATCHES */}
              <div className="space-y-4">
                {inverseMatches.slice(0, 4).map((opp) => {
                  const isApplied = appliedSearchIds.includes(opp.searchId);
                  const isHighMatch = opp.compatibilityScore >= 90;

                  return (
                    <div
                      key={opp.id}
                      className="bg-[#0a0a0c] p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-[#00ff41]/50 transition-all space-y-4 group w-full box-border overflow-hidden"
                    >
                      {/* CARD HEADER: LOGO, CLUB NAME, MATCH BADGE */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 w-full">
                        <div className="flex items-center gap-3 min-w-0 flex-1 w-full sm:w-auto">
                          <img
                            src={opp.clubLogo}
                            alt={opp.clubName}
                            className="w-12 h-12 rounded-2xl object-cover border border-white/10 bg-white/5 shrink-0"
                          />
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-2 max-w-full">
                              <h3 className="font-black text-white text-base group-hover:text-[#00ff41] transition-colors truncate">
                                {opp.clubName}
                              </h3>
                              <span className="text-xs text-amber-400 font-mono shrink-0 font-bold">
                                ★ {opp.starRating}
                              </span>
                            </div>
                            <p className="text-xs text-white/70 font-medium truncate">
                              <span className="text-white font-semibold">{opp.searchTitle}</span>
                              <span className="text-white/30 mx-1.5">•</span>
                              <span className="text-white/50">{opp.positionNeeded} ({opp.city}, {opp.province})</span>
                            </p>
                          </div>
                        </div>

                        {/* MATCH PERCENT BADGE */}
                        <div className="self-start sm:self-center shrink-0 max-w-full">
                          <span
                            className={`px-3 py-1.5 rounded-xl font-black font-mono text-xs sm:text-sm border flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
                              isHighMatch
                                ? 'bg-[#00ff41]/20 text-[#00ff41] border-[#00ff41]/40 shadow-[#00ff41]/10'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5 text-[#00ff41] shrink-0" />
                            {opp.compatibilityScore}% Compatibilidad
                          </span>
                        </div>
                      </div>

                      {/* JUSTIFICATION REASONS */}
                      <div className="bg-[#121214] p-3.5 sm:p-4 rounded-xl space-y-2.5 border border-white/5 w-full box-border">
                        <span className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-wider block">
                          ¿Por qué fue encontrada por ScoutAR AI?
                        </span>
                        <div className="flex flex-wrap gap-2.5">
                          {opp.matchReasons.map((reason, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-white/5 text-white/90 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 max-w-full leading-snug"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff41] shrink-0" />
                              <span className="truncate">{reason}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* ACTION CONTROLS (POSTULACIÓN INTELIGENTE) */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3.5 border-t border-white/10 w-full">
                        <div className="flex items-center gap-1.5 text-xs text-white/60 min-w-0">
                          <Bot className="w-4 h-4 text-[#00ff41] shrink-0" />
                          <span className="truncate">
                            Modo Asistido: {isHighMatch ? 'Recomendación Alta de Postulación' : 'Compatibilidad Sólida'}
                          </span>
                        </div>

                        <div className="w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                          {isApplied ? (
                            <span className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Postulación Enviada
                            </span>
                          ) : (
                            <button
                              onClick={() => handleManualApply(opp.searchId)}
                              className="w-full sm:w-auto px-5 py-2.5 bg-[#00ff41] hover:bg-[#00e038] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#00ff41]/20 active:scale-[0.98]"
                            >
                              <Send className="w-3.5 h-3.5" /> Postularme ahora
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. PREDICCIÓN DE ÉXITO Y MODELOS IA */}
            <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 rounded-2xl border border-purple-500/30 text-purple-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white italic uppercase">
                      Predicción de Éxito & Proyección Competitiva
                    </h2>
                    <p className="text-xs text-white/60">
                      Algoritmo predictivo basado en más de 10.000 contrataciones y pruebas históricas
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-xs text-white/50 uppercase font-bold">Probabilidad de Convocatoria</span>
                  <p className="text-3xl font-black text-[#00ff41] font-mono">{predictions.convocationProbability}%</p>
                  <p className="text-xs text-white/70">Estimación alta para pruebas directas en clubes de la región.</p>
                </div>

                <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-xs text-white/50 uppercase font-bold">Encaje Categorías Superiores</span>
                  <p className="text-lg font-bold text-amber-400">{predictions.superiorCategoryFit}</p>
                  <p className="text-xs text-white/70">Basado en tu nivel {athleteObj?.level} y verificaciones.</p>
                </div>
              </div>

              {/* EXPLANATIONS OF PREDICTION */}
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                  Fundamento del Modelo Predictivo ScoutAR
                </span>
                <ul className="space-y-1.5 text-xs text-white/80">
                  {predictions.explanations.map((exp, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-[#00ff41] shrink-0" />
                      <span>{exp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 3. TORNEOS Y EVENTOS CERCANOS */}
            <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-black text-white italic uppercase">
                    Torneos Cercanos & Próximos Eventos Deportivos
                  </h2>
                </div>
                <span className="text-xs text-white/50">{tournaments.length} eventos activos</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournaments.slice(0, 2).map((tour) => (
                  <div key={tour.id} className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-white">{tour.title}</span>
                      <span className="text-[#00ff41] font-mono">{tour.status}</span>
                    </div>
                    <p className="text-xs text-white/60">{tour.organizerName} • {tour.city}, {tour.province}</p>
                    <p className="text-xs text-amber-400 font-semibold">Inicio: {tour.startDate}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (SIDEBAR 1 COL) */}
          <div className="space-y-8">
            
            {/* COACH IA QUICK BANNER */}
            <div className="bg-gradient-to-br from-[#121214] to-[#091a0d] p-6 rounded-3xl border border-[#00ff41]/40 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#00ff41]/20 rounded-2xl border border-[#00ff41]/40 text-[#00ff41]">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base italic uppercase">Coach IA Deportivo</h3>
                  <p className="text-xs text-[#00ff41]">Tu Asistente Deportivo Personal 24/7</p>
                </div>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">
                Pregunta qué aspectos debes mejorar, evalúa tu nivel para Federal A o descubre qué posición favorece tu rendimiento.
              </p>

              <button
                onClick={onOpenCoachAi}
                className="w-full py-3 bg-[#00ff41] hover:bg-[#00e038] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#00ff41]/20 flex items-center justify-center gap-2"
              >
                Preguntar al Coach IA <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* OBJETIVOS INTELIGENTES PARA MAS VISIBILIDAD */}
            <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-white text-base italic uppercase">Objetivos Inteligentes</h3>
                </div>
                <span className="text-xs text-amber-400 font-bold font-mono">
                  {completedGoals}/{smartGoals.length}
                </span>
              </div>

              <p className="text-xs text-white/60">
                Completa estos pasos para aumentar tu índice de visibilidad ante directores técnicos:
              </p>

              <div className="space-y-3">
                {smartGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-3.5 rounded-2xl border transition-all text-xs space-y-1 ${
                      goal.completed
                        ? 'bg-[#0a0a0c] border-emerald-500/30 text-white/70'
                        : 'bg-[#121214] border-amber-500/30 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-2">
                        {goal.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#00ff41]" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        )}
                        {goal.title}
                      </span>
                      <span className="text-[#00ff41] font-mono font-bold">+{goal.visibilityBonusPercent}%</span>
                    </div>
                    <p className="text-[11px] text-white/50 pl-6">{goal.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* NOTIFICACIONES INTELIGENTES */}
            <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Bell className="w-5 h-5 text-[#00ff41]" />
                <h3 className="font-black text-white text-base italic uppercase">Notificaciones Inteligentes</h3>
              </div>

              <div className="space-y-3">
                {smartNotifications.map((notif) => (
                  <div key={notif.id} className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/5 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{notif.title}</span>
                      {notif.badgeLabel && (
                        <span className="text-[10px] bg-[#00ff41]/20 text-[#00ff41] px-2 py-0.5 rounded-md font-mono">
                          {notif.badgeLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-[11px]">{notif.message}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* CLUB FEED */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* CLUB RADAR & RECENT TALENTS */}
            <div className="bg-[#161618] p-6 rounded-3xl border border-[#00ff41]/30 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#00ff41]/10 rounded-2xl border border-[#00ff41]/30 text-[#00ff41]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white italic uppercase">
                      Nuevos Talentos Detectados & Radar Activo
                    </h2>
                    <p className="text-xs text-white/60">Perfiles destacados compatibles con la institución</p>
                  </div>
                </div>

                <button
                  onClick={onOpenScoutAi}
                  className="px-4 py-2 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#00ff41]/20"
                >
                  Asistente Conversacional IA
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allCandidates.slice(0, 4).map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => onSelectAthlete && onSelectAthlete(candidate)}
                    className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 hover:border-[#00ff41]/50 cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={candidate.avatar}
                        alt={candidate.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm group-hover:text-[#00ff41] transition-colors">
                          {candidate.name}
                        </h4>
                        <p className="text-xs text-white/60">
                          {candidate.category || 'Deportista'} • {candidate.position} ({candidate.age}a)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                      <span className="text-white/50">{candidate.city}, {candidate.province}</span>
                      <span className="text-[#00ff41] font-mono font-bold">
                        Trust Score: {candidate.trustScore || 75}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="space-y-8">
            <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 className="font-black text-white text-base italic uppercase">Convocatorias Activas</h3>
              <p className="text-xs text-white/60">Gestiona tus búsquedas institucionales publicadas.</p>
              
              <div className="space-y-3">
                {activeSearches.slice(0, 3).map((search) => (
                  <div key={search.id} className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/10 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>{search.title}</span>
                      <span className="text-[#00ff41] font-mono">{search.applicantCount} Postulados</span>
                    </div>
                    <p className="text-white/50">{search.positionNeeded} • {search.city}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACION POSTULACION AUTOMATICA */}
      {showAutoSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161618] border border-[#00ff41]/40 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-white">
                <SlidersHorizontal className="w-5 h-5 text-[#00ff41]" />
                <h3 className="font-black text-lg italic uppercase">
                  Configuración de Postulación Automática
                </h3>
              </div>
              <button
                onClick={() => setShowAutoSettingsModal(false)}
                className="text-white/40 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-4 bg-[#0a0a0c] rounded-2xl border border-white/10">
                <div>
                  <p className="font-bold text-white text-sm">Habilitar Modo Automático</p>
                  <p className="text-white/50">La IA enviará tu ficha cuando la coincidencia sea muy alta.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoApplySettings.enabled}
                  onChange={(e) => setAutoApplySettings({ ...autoApplySettings, enabled: e.target.checked })}
                  className="w-5 h-5 accent-[#00ff41]"
                />
              </div>

              <div className="space-y-2 bg-[#0a0a0c] p-4 rounded-2xl border border-white/10">
                <div className="flex justify-between font-bold text-white">
                  <span>Umbral Mínimo de Compatibilidad</span>
                  <span className="text-[#00ff41] font-mono">{autoApplySettings.minMatchScoreThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={85}
                  max={98}
                  value={autoApplySettings.minMatchScoreThreshold}
                  onChange={(e) =>
                    setAutoApplySettings({ ...autoApplySettings, minMatchScoreThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-[#00ff41]"
                />
                <p className="text-[10px] text-white/40">
                  Solo se enviará tu postulación si el algoritmo ScoutAR confirma más de este porcentaje de encaje.
                </p>
              </div>

              {/* AUDIT LOG OF AUTO APPLICATIONS */}
              <div className="space-y-2">
                <p className="font-bold text-white/70 uppercase text-[10px]">Historial de Postulaciones Automáticas</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {autoApplySettings.history.map((hist) => (
                    <div key={hist.id} className="p-3 bg-[#0a0a0c] rounded-xl border border-white/5 flex items-center justify-between text-[11px]">
                      <div>
                        <p className="font-bold text-white">{hist.clubName} - {hist.searchTitle}</p>
                        <p className="text-white/40">{hist.appliedAt}</p>
                      </div>
                      <span className="text-[#00ff41] font-mono font-bold">{hist.matchScore}% Match</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAutoSettingsModal(false)}
              className="w-full py-3 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-xl"
            >
              Guardar Preferencias
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
