import React from 'react';
import { Athlete, ScoutMatchBreakdown } from '../types';
import {
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Award,
  Zap,
  UserCheck,
  Activity
} from 'lucide-react';

interface MatchBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: Athlete | null;
  breakdown: ScoutMatchBreakdown | null;
  searchTitle?: string;
  onInviteToTrial?: (athId: string) => void;
}

export const MatchBreakdownModal: React.FC<MatchBreakdownModalProps> = ({
  isOpen,
  onClose,
  athlete,
  breakdown,
  searchTitle,
  onInviteToTrial,
}) => {
  if (!isOpen || !athlete || !breakdown) return null;

  const factorList = [
    { label: 'Posición y Deporte', score: breakdown.factorScores.positionScore, weight: '20%' },
    { label: 'Categoría y Nivel', score: breakdown.factorScores.categoryLevelScore, weight: '15%' },
    { label: 'Ubicación y Edad', score: breakdown.factorScores.locationScore, weight: '15%' },
    { label: 'Verificación e Identidad', score: breakdown.factorScores.verificationScore, weight: '15%' },
    { label: 'Trayectoria y Licencias', score: breakdown.factorScores.experienceScore, weight: '15%' },
    { label: 'Estadísticas y Videos', score: breakdown.factorScores.statsMediaScore, weight: '10%' },
    { label: 'Reputación y Referencias', score: breakdown.factorScores.reputationScore, weight: '10%' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121214] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#161618] via-[#1a1c1e] to-[#121214] border-b border-white/10 flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={athlete.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={athlete.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#00ff41]"
              />
              <span className="absolute -bottom-1 -right-1 bg-[#00ff41] text-black text-[10px] font-black px-1.5 py-0.2 rounded-md">
                {breakdown.score}%
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#00ff41] font-mono tracking-widest uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> ScoutAR AI Engine
                </span>
                <span className="text-amber-400 font-bold text-xs tracking-wider">{breakdown.starRating}</span>
              </div>
              <h2 className="text-lg font-black text-white uppercase italic tracking-tight">{athlete.name}</h2>
              <p className="text-xs text-white/60">
                Análisis de compatibilidad para: <span className="text-white font-bold">{searchTitle || 'Búsqueda de Club'}</span>
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

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Score Banner */}
          <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Rol Sugerido por IA</span>
              <h3 className="text-base font-black text-[#00ff41] uppercase tracking-wide mt-0.5">
                {breakdown.recommendedRole}
              </h3>
              <p className="text-xs text-white/70 italic mt-1 leading-relaxed">
                "{breakdown.tacticalAnalysis}"
              </p>
            </div>

            <div className="shrink-0 text-center bg-[#0a0a0c] p-4 rounded-xl border border-[#00ff41]/30">
              <span className="text-2xl font-black text-[#00ff41] tracking-tight">{breakdown.score}%</span>
              <span className="block text-[9px] text-white/50 uppercase font-mono mt-0.5">Compatibilidad</span>
            </div>
          </div>

          {/* Pros & Cons Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pros */}
            <div className="bg-[#161618] p-4 rounded-2xl border border-[#00ff41]/20 space-y-2">
              <h4 className="text-xs font-black text-[#00ff41] uppercase italic tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00ff41]" /> Factores Favorables (PROS)
              </h4>
              <ul className="space-y-1.5">
                {breakdown.pros.map((pro, i) => (
                  <li key={i} className="text-xs text-white/90 flex items-start gap-1.5">
                    <span className="text-[#00ff41] font-bold">✓</span> {pro}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div className="bg-[#161618] p-4 rounded-2xl border border-rose-500/20 space-y-2">
              <h4 className="text-xs font-black text-rose-400 uppercase italic tracking-wider flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-400" /> Limitaciones / Aspectos a Evaluar
              </h4>
              <ul className="space-y-1.5">
                {breakdown.cons.map((con, i) => (
                  <li key={i} className="text-xs text-white/80 flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">✗</span> {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Factor Breakdown Sliders */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase italic tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Puntuación Desglosada por Factores de Evaluación
            </h4>

            <div className="space-y-2.5">
              {factorList.map((item, idx) => (
                <div key={idx} className="bg-[#161618] p-3 rounded-xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white/90">{item.label}</span>
                    <span className="font-mono text-cyan-400 font-bold">{item.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        item.score >= 85
                          ? 'bg-[#00ff41]'
                          : item.score >= 65
                          ? 'bg-cyan-400'
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-[#161618] border-t border-white/10 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase rounded-xl"
          >
            Cerrar
          </button>

          {onInviteToTrial && (
            <button
              onClick={() => {
                onInviteToTrial(athlete.id);
                onClose();
              }}
              className="px-5 py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" /> Convocar a Prueba Directa
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
