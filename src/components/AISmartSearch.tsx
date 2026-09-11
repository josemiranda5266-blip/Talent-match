import React, { useState } from 'react';
import { Athlete } from '../types';
import { auth } from '../lib/firebase';
import { Sparkles, Search, MapPin, User, ArrowRight, Trophy, Zap, Crown, Star, MessageSquare } from 'lucide-react';
import { AdvancedSearchFilter, SearchFilterState } from './AdvancedSearchFilter';

interface AISmartSearchProps {
  athletes: Athlete[];
  onOpenCandidateModal: (ath: Athlete) => void;
  onOpenReviewsModal?: (athId: string, athName: string) => void;
}

export const AISmartSearch: React.FC<AISmartSearchProps> = ({
  athletes,
  onOpenCandidateModal,
  onOpenReviewsModal,
}) => {
  const [queryPrompt, setQueryPrompt] = useState<string>('Defensor central alto con buen pie en Santiago del Estero');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [aiResults, setAiResults] = useState<{
    summaryReasoning: string;
    matches: { athleteId: string; relevanceScore: number; matchReason: string }[];
  } | null>(null);

  // Granular Filter State
  const [filters, setFilters] = useState<SearchFilterState>({
    category: 'Todas',
    sport: 'Todos',
    province: 'Todas',
    city: '',
    position: 'Todas',
    minAge: 12,
    maxAge: 65,
    level: 'Todos',
    availableOnly: false,
  });

  const presetQueries = [
    'Director Técnico con Licencia CONMEBOL PRO en Mendoza',
    'Preparador Físico con manejo de GPS y carga en Córdoba',
    'Kinesióloga especializada en rehabilitación de rodilla en Santa Fe o CABA',
    'Analista de Video con certificación Hudl y Wyscout',
    'Defensor central alto con juego aéreo en Santiago del Estero',
  ];

  const handleSearch = async (promptToUse?: string) => {
    const textToSearch = promptToUse || queryPrompt;
    if (!textToSearch.trim()) return;

    setIsSearching(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ queryPrompt: textToSearch, athletes }),
      });
      const data = await response.json();
      if (data.matches) {
        setAiResults(data);
      }
    } catch (err) {
      console.error('Error running smart AI search:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Granular filtered list
  const filteredAthletes = athletes.filter((ath) => {
    const athCategory = ath.category || 'Deportista';
    if (filters.category && filters.category !== 'Todas' && athCategory !== filters.category) return false;
    if (filters.sport !== 'Todos' && ath.sport.toLowerCase() !== filters.sport.toLowerCase()) return false;
    if (filters.province !== 'Todas' && !ath.province.toLowerCase().includes(filters.province.toLowerCase())) return false;
    if (filters.city.trim() && !ath.city.toLowerCase().includes(filters.city.trim().toLowerCase())) return false;
    if (filters.position !== 'Todas' && !ath.position.toLowerCase().includes(filters.position.toLowerCase())) return false;
    if (filters.level !== 'Todos' && ath.level !== filters.level) return false;
    if (ath.age < filters.minAge || ath.age > filters.maxAge) return false;
    if (filters.availableOnly && !ath.availableForTrials) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#161618] rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#00ff41]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] text-[10px] sm:text-xs px-3 py-1 rounded-full font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Motor de Búsqueda Inteligente Gemini
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter uppercase italic leading-tight">
            Buscador Avanzado de Talentos Deportivos
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            Busca en lenguaje natural con IA o aplica los filtros por provincia, ciudad, edad, posición y categoría.
          </p>

          {/* Prompt Search Input */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <div className="relative w-full">
              <Search className="w-5 h-5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="ai-smart-search-input"
                type="text"
                value={queryPrompt}
                onChange={(e) => setQueryPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ej: 'Defensor central diestro en Santiago del Estero de más de 1.85m'"
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#00ff41] shadow-inner font-mono"
              />
            </div>
            <button
              id="btn-run-ai-search"
              onClick={() => handleSearch()}
              disabled={isSearching}
              className="w-full sm:w-auto px-6 py-3 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-[#00ff41]/20 hover:scale-105 transition-transform flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-black" />
                  Buscar con IA
                </>
              )}
            </button>
          </div>

          {/* Presets / Quick Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-white/40 font-bold uppercase tracking-wider">Sugerencias:</span>
            {presetQueries.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQueryPrompt(preset);
                  handleSearch(preset);
                }}
                className="bg-white/5 hover:bg-white/10 text-white/80 text-[11px] px-3 py-1 rounded-xl border border-white/10 transition-colors text-left"
              >
                "{preset}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filter Component */}
      <AdvancedSearchFilter
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={() =>
          setFilters({
            category: 'Todas',
            sport: 'Todos',
            province: 'Todas',
            city: '',
            position: 'Todas',
            minAge: 12,
            maxAge: 65,
            level: 'Todos',
            availableOnly: false,
          })
        }
      />

      {/* Results Section */}
      {aiResults ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#161618] border border-[#00ff41]/30 p-5 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#00ff41] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#00ff41]">Análisis de Intención de Búsqueda IA</h3>
              <p className="text-xs text-white/80 mt-1">{aiResults.summaryReasoning}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {aiResults.matches.map((item) => {
              const ath = athletes.find((a) => a.id === item.athleteId);
              if (!ath) return null;

              return (
                <div
                  key={ath.id}
                  id={`ai-result-card-${ath.id}`}
                  className="bg-[#161618] rounded-3xl p-5 border border-white/10 hover:border-[#00ff41]/50 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 font-mono">
                        {item.relevanceScore}% Match IA
                      </span>
                      {ath.isPremium && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#00ff41] text-black uppercase tracking-wider flex items-center gap-1">
                          <Crown className="w-3 h-3" /> PRO
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <img src={ath.avatar} alt={ath.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10" />
                      <div>
                        <h4 className="text-sm font-extrabold text-white">{ath.name}</h4>
                        <p className="text-xs text-white/60">{ath.sport} • {ath.position} ({ath.age} años)</p>
                        <p className="text-[11px] text-white/40 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {ath.city}, {ath.province}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#0a0a0c] p-3 rounded-xl border border-white/5 text-xs text-[#00ff41]/90 leading-relaxed">
                      <span className="font-bold text-white/50 block mb-0.5 text-[10px] uppercase tracking-wider">Recomendación IA:</span>
                      {item.matchReason}
                    </div>

                    <p className="text-xs text-white/60 line-clamp-2">{ath.bio}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`btn-open-modal-ai-${ath.id}`}
                      onClick={() => onOpenCandidateModal(ath)}
                      className="flex-1 py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#00ff41]/10"
                    >
                      Ver Ficha Completa <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {onOpenReviewsModal && (
                      <button
                        onClick={() => onOpenReviewsModal(ath.id, ath.name)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors border border-white/10"
                        title="Ver Reputación y Reseñas"
                      >
                        <Star className="w-4 h-4 text-yellow-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Standard Filtered Results */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Mostrando {filteredAthletes.length} deportistas encontrados</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAthletes.map((ath) => (
              <div
                key={ath.id}
                className="bg-[#161618] rounded-3xl p-5 border border-white/10 hover:border-[#00ff41]/50 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 uppercase">
                      {ath.sport} • {ath.position}
                    </span>
                    {ath.isPremium && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#00ff41] text-black uppercase tracking-wider flex items-center gap-1">
                        <Crown className="w-3 h-3" /> PRO
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <img src={ath.avatar} alt={ath.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10" />
                    <div>
                      <h4 className="text-sm font-extrabold text-white">{ath.name}</h4>
                      <p className="text-xs text-white/60">{ath.level} • {ath.age} años</p>
                      <p className="text-[11px] text-white/40 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ath.city}, {ath.province}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-white/60 line-clamp-2">{ath.bio}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenCandidateModal(ath)}
                    className="flex-1 py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md"
                  >
                    Ficha Técnica <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  {onOpenReviewsModal && (
                    <button
                      onClick={() => onOpenReviewsModal(ath.id, ath.name)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors border border-white/10"
                      title="Ver Reputación y Reseñas"
                    >
                      <Star className="w-4 h-4 text-yellow-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
