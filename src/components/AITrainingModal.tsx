import React, { useState } from 'react';
import { Sparkles, Dumbbell, X, RefreshCw, CheckCircle2, Zap } from 'lucide-react';
import { SportType } from '../types';
import { auth } from '../lib/firebase';

interface AITrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteName: string;
  sport: SportType;
  position: string;
  level: string;
}

export const AITrainingModal: React.FC<AITrainingModalProps> = ({
  isOpen,
  onClose,
  athleteName,
  sport,
  position,
  level,
}) => {
  const [areasToImprove, setAreasToImprove] = useState<string>('Potencia explosiva, primer paso y precisión en remate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [routine, setRoutine] = useState<{
    routineTitle: string;
    weeklyFocus: string;
    drills: { name: string; duration: string; instructions: string }[];
    recoveryTip: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerateRoutine = async () => {
    setIsGenerating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/ai/generate-training-routine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: athleteName,
          sport,
          position,
          level,
          areasToImprove: [areasToImprove],
        }),
      });

      const data = await res.json();
      if (data.routineTitle) {
        setRoutine(data);
      }
    } catch (err) {
      console.error('Error generating AI training routine:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-[#00ff41]/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ff41]/10 border border-[#00ff41]/30 flex items-center justify-center text-[#00ff41]">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                Rutina IA de Alto Rendimiento Gemini
              </h2>
              <p className="text-xs text-white/60">
                Entrenamiento físico y técnico personalizado según tu deporte y posición.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">
            ¿Qué aspectos tácticos o físicos deseas potenciar esta semana?
          </label>
          <input
            type="text"
            value={areasToImprove}
            onChange={(e) => setAreasToImprove(e.target.value)}
            placeholder="Ej: Resistencia aeróbica, juego aéreo, tiro libre, agilidad lateral..."
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-2xl p-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#00ff41]"
          />
        </div>

        <button
          onClick={handleGenerateRoutine}
          disabled={isGenerating}
          className="w-full py-3.5 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-[#00ff41]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Diseñando Plan de Entrenamiento con Gemini...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-black" /> Generar Rutina Personalizada
            </>
          )}
        </button>

        {routine && (
          <div className="bg-[#0a0a0c] border border-[#00ff41]/30 rounded-2xl p-5 space-y-4 animate-fadeIn">
            <div>
              <span className="text-[10px] font-black uppercase text-[#00ff41] tracking-widest block">Plan Adaptativo IA</span>
              <h3 className="text-base font-black text-white italic uppercase">{routine.routineTitle}</h3>
              <p className="text-xs text-white/70 mt-1 italic">"{routine.weeklyFocus}"</p>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/10 pb-1">
                Ejercicios Sugeridos:
              </span>
              {routine.drills?.map((drill, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff41]" /> {drill.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#00ff41] bg-[#00ff41]/10 px-2 py-0.5 rounded-md">
                      {drill.duration}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed pl-5">{drill.instructions}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-xl text-xs text-[#00ff41]">
              <strong>Tip de Recuperación:</strong> {routine.recoveryTip}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
