import React, { useState } from 'react';
import { Sparkles, Wand2, Check, X, Bot, AlertCircle } from 'lucide-react';
import { SportType } from '../types';
import { auth } from '../lib/firebase';

interface AthleteAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteName: string;
  sport: SportType;
  position: string;
  age: number;
  level: string;
  currentExperience?: string;
  onApplyGeneratedData: (data: { bio: string; sportsExperience: string; keyAchievements: string[] }) => void;
}

export const AthleteAIAssistantModal: React.FC<AthleteAIAssistantModalProps> = ({
  isOpen,
  onClose,
  athleteName,
  sport,
  position,
  age,
  level,
  currentExperience = '',
  onApplyGeneratedData,
}) => {
  const [athleteNotes, setAthleteNotes] = useState(currentExperience);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    bio: string;
    sportsExperience: string;
    keyAchievements: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/ai/generate-athlete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: athleteName,
          sport,
          position,
          age,
          level,
          athleteNotes,
        }),
      });
      const data = await response.json();
      if (data.bio && data.sportsExperience) {
        setResult({
          bio: data.bio,
          sportsExperience: data.sportsExperience,
          keyAchievements: data.keyAchievements || [],
        });
      }
    } catch (err) {
      console.error('Error in AI Profile Assistant:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyGeneratedData(result);
      onClose();
    }
  };

  const handleQuickChip = (text: string) => {
    setAthleteNotes((prev) => (prev ? `${prev}. ${text}` : text));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-[#00ff41]/30 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Top Glow Accent */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-[#00ff41]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#00ff41]/10 border border-[#00ff41]/30 flex items-center justify-center text-[#00ff41]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                Asistente IA de Perfil Deportivo
              </h2>
              <p className="text-xs text-white/60">
                Optimiza y redacta tu trayectoria profesional para ser visto por scouts.
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

        {/* Input Section */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">
            Cuéntale a la IA sobre tu experiencia deportiva:
          </label>
          <textarea
            rows={4}
            value={athleteNotes}
            onChange={(e) => setAthleteNotes(e.target.value)}
            placeholder="Ejemplo: Jugué 4 años en las inferiores de Banfield, zurdo, buen remate lejano. En 2024 disputé 22 partidos y fuimos campeones de la Liga Local..."
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00ff41] transition-all"
          />

          {/* Quick Idea Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sugerencias rápidas para agregar:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickChip('2 años jugados en Liga Regional')}
                className="text-[10px] bg-white/5 hover:bg-[#00ff41]/20 hover:text-[#00ff41] text-white/70 px-2.5 py-1 rounded-lg border border-white/5 transition-all"
              >
                + 2 años en Liga Regional
              </button>
              <button
                type="button"
                onClick={() => handleQuickChip('Campeón provincial Sub-20')}
                className="text-[10px] bg-white/5 hover:bg-[#00ff41]/20 hover:text-[#00ff41] text-white/70 px-2.5 py-1 rounded-lg border border-white/5 transition-all"
              >
                + Campeón provincial Sub-20
              </button>
              <button
                type="button"
                onClick={() => handleQuickChip('Especialista en pelota parada y centros precisos')}
                className="text-[10px] bg-white/5 hover:bg-[#00ff41]/20 hover:text-[#00ff41] text-white/70 px-2.5 py-1 rounded-lg border border-white/5 transition-all"
              >
                + Especialista en pelota parada
              </button>
              <button
                type="button"
                onClick={() => handleQuickChip('Capitán y voz de mando en cancha')}
                className="text-[10px] bg-white/5 hover:bg-[#00ff41]/20 hover:text-[#00ff41] text-white/70 px-2.5 py-1 rounded-lg border border-white/5 transition-all"
              >
                + Capitán
              </button>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-[#00ff41]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Gemini Redactando tu Ficha...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Redactar Ficha Profesional con IA
            </>
          )}
        </button>

        {/* Results Preview */}
        {result && (
          <div className="bg-[#0a0a0c] border border-[#00ff41]/40 rounded-2xl p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black text-[#00ff41] uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4" /> Perfil Generado por IA
              </span>
              <span className="text-[10px] text-white/50">Listo para aplicar</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-0.5">Biografía Profesional:</span>
                <p className="text-white/90 bg-white/5 p-3 rounded-xl leading-relaxed">{result.bio}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-0.5">Trayectoria y Experiencia:</span>
                <p className="text-white/90 bg-white/5 p-3 rounded-xl leading-relaxed">{result.sportsExperience}</p>
              </div>

              {result.keyAchievements.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Hitos Destacados:</span>
                  <ul className="space-y-1">
                    {result.keyAchievements.map((ach, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-white/80">
                        <Check className="w-3.5 h-3.5 text-[#00ff41]" />
                        {ach}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApply}
              className="w-full py-2.5 bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-white/90 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              Aplicar a Mi Ficha Deportivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
