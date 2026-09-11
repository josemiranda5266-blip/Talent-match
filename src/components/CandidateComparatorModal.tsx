import React, { useState } from 'react';
import { Athlete, ClubSearch, CandidateComparisonResult } from '../types';
import { auth } from '../lib/firebase';
import {
  X,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Zap,
  Users,
  Video,
  Award,
  Loader2
} from 'lucide-react';
import { calculateCandidateCompatibility } from '../lib/scoutAiEngine';

interface CandidateComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Athlete[];
  searchContext?: Partial<ClubSearch>;
  onInviteCandidate?: (athleteId: string) => void;
}

export const CandidateComparatorModal: React.FC<CandidateComparatorModalProps> = ({
  isOpen,
  onClose,
  candidates,
  searchContext = {},
  onInviteCandidate
}) => {
  const [isComparingAi, setIsComparingAi] = useState(false);
  const [aiResult, setAiResult] = useState<CandidateComparisonResult | null>(null);

  if (!isOpen || candidates.length === 0) return null;

  const handleRunAiComparison = async () => {
    setIsComparingAi(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/ai/compare-candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          candidates,
          searchContext
        })
      });
      const data = await response.json();
      if (data.comparison) {
        setAiResult(data.comparison);
      }
    } catch (err) {
      console.error('Error generating candidate comparison:', err);
    } finally {
      setIsComparingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121214] border border-white/10 w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 bg-[#161618] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-2xl text-[#00ff41]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#00ff41] font-mono uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Comparador Profesional de Talentos
                </span>
                <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {candidates.length} / 4 Perfiles
                </span>
              </div>
              <h2 className="text-lg font-black text-white uppercase italic tracking-tight">
                Análisis Comparativo Lado a Lado
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAiComparison}
              disabled={isComparingAi}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              {isComparingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Procesando IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generar Conclusión Estratégica
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Comparison Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* AI Strategic Conclusion Banner */}
          {aiResult && (
            <div className="bg-[#161618] p-5 rounded-2xl border border-cyan-500/30 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase italic tracking-wider">
                  Dictamen Estratégico de IA (ScoutAR Auditor)
                </h3>
              </div>
              <p className="text-xs text-white/80 leading-relaxed font-sans">
                {aiResult.aiStrategicConclusion}
              </p>
            </div>
          )}

          {/* Matrix Grid Side-by-Side */}
          <div className={`grid gap-4 ${
            candidates.length === 2
              ? 'grid-cols-2'
              : candidates.length === 3
              ? 'grid-cols-3'
              : 'grid-cols-4'
          }`}>
            {candidates.map((candidate) => {
              const breakdown = calculateCandidateCompatibility(candidate, searchContext);
              const isBestMatch = aiResult?.recommendedSelectionId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  className={`bg-[#161618] rounded-2xl border p-5 space-y-4 relative flex flex-col justify-between transition-all ${
                    isBestMatch
                      ? 'border-[#00ff41] ring-2 ring-[#00ff41]/50 shadow-xl shadow-[#00ff41]/10'
                      : 'border-white/10'
                  }`}
                >
                  {isBestMatch && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00ff41] text-black font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      RECOMENDACIÓN TOP IA
                    </span>
                  )}

                  {/* Candidate Profile Top */}
                  <div className="space-y-3 text-center">
                    <img
                      src={candidate.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={candidate.name}
                      className="w-16 h-16 rounded-2xl object-cover mx-auto border-2 border-white/20"
                    />

                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">{candidate.name}</h4>
                      <p className="text-[11px] text-[#00ff41] font-bold mt-0.5">
                        {candidate.category || 'Deportista'} • {candidate.position}
                      </p>
                    </div>

                    {/* Score Badge */}
                    <div className="bg-[#0a0a0c] p-2.5 rounded-xl border border-white/10 inline-block w-full">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60 font-mono text-[10px]">COMPATIBILIDAD</span>
                        <span className="text-amber-400 font-bold">{breakdown.starRating}</span>
                      </div>
                      <span className="text-xl font-black text-[#00ff41]">{breakdown.score}%</span>
                    </div>
                  </div>

                  {/* Comparison Rows */}
                  <div className="space-y-2 text-xs divide-y divide-white/5 pt-2">
                    <div className="pt-2 flex justify-between">
                      <span className="text-white/50">Edad</span>
                      <span className="text-white font-bold">{candidate.age} años</span>
                    </div>

                    <div className="pt-2 flex justify-between">
                      <span className="text-white/50">Ubicación</span>
                      <span className="text-white font-bold">{candidate.city}, {candidate.province}</span>
                    </div>

                    <div className="pt-2 flex justify-between">
                      <span className="text-white/50">Nivel Competitivo</span>
                      <span className="text-white font-bold">{candidate.level}</span>
                    </div>

                    <div className="pt-2 flex justify-between">
                      <span className="text-white/50">Acreditación</span>
                      <span className="text-[#00ff41] font-bold capitalize">
                        {candidate.verificationTier || 'Estándar'}
                      </span>
                    </div>

                    <div className="pt-2 flex justify-between">
                      <span className="text-white/50">Índice de Confianza</span>
                      <span className="text-cyan-400 font-mono font-bold">
                        {candidate.trustScore || 75}%
                      </span>
                    </div>

                    <div className="pt-2 flex justify-between">
                      <span className="text-white/50">Trayectoria</span>
                      <span className="text-white font-bold">
                        {candidate.yearsExperience || 1} años ({candidate.workHistory?.length || 1} clubes)
                      </span>
                    </div>

                    <div className="pt-2 flex justify-between">
                      <span className="text-white/50">Estadísticas</span>
                      <span className="text-white font-bold">
                        {candidate.stats?.matchesPlayed || 0} PJ / {candidate.stats?.goalsOrPoints || 0} G/Pts
                      </span>
                    </div>

                    <div className="pt-2 flex justify-between">
                      <span className="text-white/50">Reputación</span>
                      <span className="text-amber-400 font-bold">
                        {(candidate.rating || 4.5).toFixed(1)}★
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-3">
                    {onInviteCandidate && (
                      <button
                        onClick={() => onInviteCandidate(candidate.id)}
                        className="w-full py-2 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" /> Convocar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#161618] border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase rounded-xl"
          >
            Cerrar Comparador
          </button>
        </div>
      </div>
    </div>
  );
};
