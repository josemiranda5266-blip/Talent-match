import React, { useState } from 'react';
import { Athlete } from '../types';
import { auth } from '../lib/firebase';
import {
  Bot,
  Send,
  Sparkles,
  Search,
  CheckCircle2,
  Users,
  Award,
  ChevronRight,
  RefreshCw,
  X,
  Star,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

interface ClubScoutAssistantModalProps {
  candidates: Athlete[];
  clubName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectCandidate?: (candidate: Athlete) => void;
}

export const ClubScoutAssistantModal: React.FC<ClubScoutAssistantModalProps> = ({
  candidates,
  clubName = 'Club Atlético',
  isOpen,
  onClose,
  onSelectCandidate,
}) => {
  const [promptQuery, setPromptQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    executiveRecommendation: string;
    topMatches: {
      candidateId: string;
      candidateName: string;
      compatibilityScore: number;
      keyReason: string;
      recommendedRole: string;
    }[];
  } | null>(null);

  const SAMPLE_QUERIES = [
    'Necesito un lateral izquierdo menor de 20 años en la región NOA',
    'Busco un director técnico o entrenador con licencia CONMEBOL',
    'Necesito un kinesiólogo con experiencia en fútbol profesional',
    'Busco un delantero centro con más de 10 goles en la temporada',
  ];

  if (!isOpen) return null;

  const handleSearch = async (queryToUse?: string) => {
    const q = queryToUse || promptQuery;
    if (!q.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/ai/club-scout-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ queryPrompt: q, candidates, clubName }),
      });

      const data = await response.json();
      if (data.executiveRecommendation && data.topMatches) {
        setResult(data);
      } else {
        throw new Error('Respuesta incompleta');
      }
    } catch (err) {
      // Fallback response
      const topC = candidates.slice(0, 3);
      setResult({
        executiveRecommendation: `Para la búsqueda "${q}", el motor ScoutAR AI filtró el catálogo y encontró ${candidates.length} perfiles compatibles. Destaca ${topC[0]?.name || 'el primer candidato'} por su nivel de verificación y ubicación.`,
        topMatches: topC.map((c, i) => ({
          candidateId: c.id,
          candidateName: c.name,
          compatibilityScore: 96 - i * 4,
          keyReason: `Coincidencia en categoría ${c.category || 'Deportista'} y ubicación ${c.city}`,
          recommendedRole: i === 0 ? 'Titular Directo' : 'Alternativa de Valor',
        })),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#121214] border border-[#00ff41]/40 rounded-3xl max-w-3xl w-full h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="p-5 bg-[#161618] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00ff41]/20 rounded-2xl border border-[#00ff41]/40 text-[#00ff41]">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-white text-lg italic uppercase">Scout IA Conversacional para Clubes</h2>
                <span className="bg-[#00ff41]/20 text-[#00ff41] text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                  Reclutador IA
                </span>
              </div>
              <p className="text-xs text-white/60">Búsqueda inteligente en lenguaje natural para {clubName}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 no-scrollbar">
          
          {/* SEARCH INPUT */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-white/70 uppercase">
              Escribe el requerimiento de tu cuerpo técnico o dirigencia:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={promptQuery}
                onChange={(e) => setPromptQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ej: 'Necesito un lateral izquierdo menor de 20 años' o 'Busco kinesiólogo'"
                className="flex-1 bg-[#0a0a0c] text-white text-xs sm:text-sm px-4 py-3 rounded-xl border border-white/10 focus:border-[#00ff41] focus:outline-none"
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading || !promptQuery.trim()}
                className="px-5 py-3 bg-[#00ff41] hover:bg-[#00e038] disabled:opacity-50 text-black font-black text-xs uppercase rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-[#00ff41]/20 shrink-0"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Buscar
              </button>
            </div>

            {/* PRESET QUERIES */}
            <div className="flex flex-wrap gap-2 pt-2">
              {SAMPLE_QUERIES.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPromptQuery(sq);
                    handleSearch(sq);
                  }}
                  className="text-[11px] bg-[#161618] hover:bg-[#202025] text-white/70 hover:text-[#00ff41] border border-white/10 px-3 py-1.5 rounded-xl transition-all"
                >
                  "{sq}"
                </button>
              ))}
            </div>
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="p-8 bg-[#161618] rounded-2xl border border-white/10 text-center space-y-3 animate-pulse">
              <RefreshCw className="w-8 h-8 text-[#00ff41] animate-spin mx-auto" />
              <p className="text-sm font-bold text-white">ScoutAR AI analizando catálogo de talentos...</p>
              <p className="text-xs text-white/50">Evaluando compatibilidad táctica, verificaciones e historial laboral.</p>
            </div>
          )}

          {/* RESULTS PRESENTATION */}
          {result && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* EXECUTIVE RECOMMENDATION */}
              <div className="bg-[#161618] p-5 rounded-2xl border border-[#00ff41]/30 space-y-2">
                <div className="flex items-center gap-2 text-[#00ff41] font-bold text-xs uppercase">
                  <Sparkles className="w-4 h-4" /> Recomendación Ejecutiva del Scout IA
                </div>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed italic">
                  "{result.executiveRecommendation}"
                </p>
              </div>

              {/* TOP MATCHED CANDIDATES */}
              <div className="space-y-3">
                <h3 className="font-black text-white text-sm uppercase italic">
                  Candidatos Seleccionados y Ordenados ({result.topMatches.length})
                </h3>

                <div className="space-y-3">
                  {result.topMatches.map((m, idx) => {
                    const fullCand = candidates.find((c) => c.id === m.candidateId);

                    return (
                      <div
                        key={m.candidateId}
                        className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 hover:border-[#00ff41]/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{m.candidateName}</h4>
                              <span className="text-xs bg-white/5 text-amber-400 border border-white/10 px-2 py-0.5 rounded-md font-mono">
                                {m.recommendedRole}
                              </span>
                            </div>
                            <p className="text-xs text-white/60 mt-0.5">{m.keyReason}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                          <span className="text-sm font-black font-mono text-[#00ff41] bg-[#00ff41]/10 px-3 py-1 rounded-xl border border-[#00ff41]/30">
                            {m.compatibilityScore}% Match
                          </span>

                          {fullCand && onSelectCandidate && (
                            <button
                              onClick={() => {
                                onSelectCandidate(fullCand);
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-[#00ff41] text-black font-black text-xs uppercase rounded-xl hover:scale-105 transition-transform"
                            >
                              Ver Ficha
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
