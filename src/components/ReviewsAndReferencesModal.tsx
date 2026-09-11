import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Building2,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  Award,
  AlertCircle,
  Plus,
  Send,
  ThumbsUp
} from 'lucide-react';
import { Athlete, UserRatingReview, VerifiedReference } from '../types';
import {
  getUserRatingReviews,
  submitUserRatingReview,
  getUserVerifiedReferences,
  submitVerifiedReference,
  UserProfile
} from '../services/firebaseService';

interface ReviewsAndReferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAthlete: Athlete;
  currentUser: UserProfile | null;
}

export const ReviewsAndReferencesModal: React.FC<ReviewsAndReferencesModalProps> = ({
  isOpen,
  onClose,
  targetAthlete,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'reviews' | 'references'>('reviews');
  const [reviews, setReviews] = useState<UserRatingReview[]>([]);
  const [references, setReferences] = useState<VerifiedReference[]>([]);
  const [loading, setLoading] = useState(true);

  // New review form
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [punctuality, setPunctuality] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [quality, setQuality] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [comment, setComment] = useState('');
  const [interactionType, setInteractionType] = useState<'trial' | 'application' | 'contract' | 'chat'>('trial');
  const [submitting, setSubmitting] = useState(false);

  // New reference form
  const [isAddingRef, setIsAddingRef] = useState(false);
  const [refereeName, setRefereeName] = useState('');
  const [refereeRole, setRefereeRole] = useState('');
  const [refereeInstitution, setRefereeInstitution] = useState('');
  const [relationship, setRelationship] = useState('');
  const [quote, setQuote] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [revs, refs] = await Promise.all([
        getUserRatingReviews(targetAthlete.id),
        getUserVerifiedReferences(targetAthlete.id)
      ]);
      setReviews(revs);
      setReferences(refs);
    } catch (e) {
      console.error('Error loading reviews & refs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, targetAthlete.id]);

  if (!isOpen) return null;

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !comment.trim()) return;

    setSubmitting(true);
    try {
      const avg = Math.round(((punctuality + professionalism + quality + communication) / 4) * 10) / 10;
      const newReview: UserRatingReview = {
        id: `rev-${Date.now()}`,
        targetUserId: targetAthlete.id,
        authorUserId: currentUser.uid,
        authorName: currentUser.displayName || 'Usuario Verificado',
        authorRole: currentUser.role,
        authorAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        authorVerified: currentUser.isVerified || false,
        punctualityScore: punctuality,
        professionalismScore: professionalism,
        experienceQualityScore: quality,
        communicationScore: communication,
        averageScore: avg,
        comment,
        interactionType,
        interactionConfirmed: true,
        createdAt: new Date().toISOString()
      };

      await submitUserRatingReview(newReview);
      setIsAddingReview(false);
      setComment('');
      loadData();
    } catch (e) {
      console.error('Error submitting review:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refereeName.trim() || !quote.trim()) return;

    setSubmitting(true);
    try {
      const newRef: VerifiedReference = {
        id: `ref-${Date.now()}`,
        targetUserId: targetAthlete.id,
        refereeName,
        refereeRole: refereeRole || 'Entrenador / Coordinador',
        refereeInstitution: refereeInstitution || 'Club Deportivo',
        relationship: relationship || 'Supervisión de Desempeño',
        quote,
        status: 'verified',
        createdAt: new Date().toISOString()
      };

      await submitVerifiedReference(newRef);
      setIsAddingRef(false);
      setRefereeName('');
      setRefereeRole('');
      setRefereeInstitution('');
      setRelationship('');
      setQuote('');
      loadData();
    } catch (e) {
      console.error('Error submitting reference:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121214] border border-white/10 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <img
              src={targetAthlete.avatar}
              alt={targetAthlete.name}
              className="w-12 h-12 rounded-xl object-cover border border-[#00ff41]/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white uppercase italic">
                  {targetAthlete.name}
                </h3>
                {targetAthlete.isVerified && (
                  <ShieldCheck className="w-4 h-4 text-[#00ff41]" />
                )}
              </div>
              <p className="text-xs text-white/50">
                Reputación, Valoraciones de Interacciones y Referencias Institucionales
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            Valoraciones Verificadas ({reviews.length})
          </button>

          <button
            onClick={() => setActiveTab('references')}
            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all flex items-center gap-2 ${
              activeTab === 'references'
                ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Referencias de Clubes ({references.length})
          </button>
        </div>

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {/* Header action */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/60">
                <span className="font-bold text-amber-400 text-sm mr-1">
                  ★ {targetAthlete.rating || 5.0}
                </span>
                promedio de valoraciones en la plataforma
              </div>

              {currentUser && !isAddingReview && (
                <button
                  onClick={() => setIsAddingReview(true)}
                  className="px-3 py-1.5 bg-[#00ff41]/10 hover:bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Calificar Interacción Real
                </button>
              )}
            </div>

            {/* Create Review Form */}
            {isAddingReview && (
              <form onSubmit={handleCreateReview} className="bg-black/50 border border-[#00ff41]/30 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-[#00ff41] uppercase text-[11px] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Valoración por Interacción Confirmada
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingReview(false)}
                    className="text-white/50 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                      Tipo de Interacción *
                    </label>
                    <select
                      value={interactionType}
                      onChange={e => setInteractionType(e.target.value as any)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-[#00ff41]"
                    >
                      <option value="trial">Prueba Presencial de Selección</option>
                      <option value="application">Postulación / Búsqueda Abierta</option>
                      <option value="contract">Vínculo Profesional / Contrato</option>
                      <option value="chat">Intercambio Técnico en Chat Directo</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <label className="text-white/60 uppercase font-bold block">Puntualidad: {punctuality}★</label>
                      <input type="range" min="1" max="5" value={punctuality} onChange={e => setPunctuality(Number(e.target.value))} className="w-full accent-[#00ff41]" />
                    </div>
                    <div>
                      <label className="text-white/60 uppercase font-bold block">Profesionalismo: {professionalism}★</label>
                      <input type="range" min="1" max="5" value={professionalism} onChange={e => setProfessionalism(Number(e.target.value))} className="w-full accent-[#00ff41]" />
                    </div>
                    <div>
                      <label className="text-white/60 uppercase font-bold block">Calidad: {quality}★</label>
                      <input type="range" min="1" max="5" value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full accent-[#00ff41]" />
                    </div>
                    <div>
                      <label className="text-white/60 uppercase font-bold block">Comunicación: {communication}★</label>
                      <input type="range" min="1" max="5" value={communication} onChange={e => setCommunication(Number(e.target.value))} className="w-full accent-[#00ff41]" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                    Comentario y Feedback Profesional *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Describe la experiencia de trabajo o prueba presencial..."
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="w-full py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black uppercase tracking-wider rounded-lg text-xs"
                >
                  {submitting ? 'Publicando...' : 'Publicar Valoración Verificada'}
                </button>
              </form>
            )}

            {/* List */}
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-xs border border-dashed border-white/10 rounded-2xl space-y-1">
                <p className="font-bold text-white/60">Aún no posee valoraciones públicas.</p>
                <p className="text-[11px]">Las calificaciones requieren interacciones previas confirmadas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(rev => (
                  <div key={rev.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img src={rev.authorAvatar} alt={rev.authorName} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                            {rev.authorName}
                            {rev.authorVerified && <ShieldCheck className="w-3.5 h-3.5 text-[#00ff41]" />}
                          </div>
                          <span className="text-[10px] text-white/40 capitalize">
                            Interacción: {rev.interactionType === 'trial' ? 'Prueba Presencial' : rev.interactionType}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 font-bold text-amber-400 text-xs bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {rev.averageScore} / 5.0
                      </div>
                    </div>

                    <p className="text-xs text-white/80 leading-relaxed italic">
                      "{rev.comment}"
                    </p>

                    <div className="grid grid-cols-4 gap-1 text-[9px] text-white/50 pt-2 border-t border-white/5 font-mono">
                      <div>Puntualidad: <span className="text-white font-bold">{rev.punctualityScore}★</span></div>
                      <div>Profesionalismo: <span className="text-white font-bold">{rev.professionalismScore}★</span></div>
                      <div>Calidad: <span className="text-white font-bold">{rev.experienceQualityScore}★</span></div>
                      <div>Comunicación: <span className="text-white font-bold">{rev.communicationScore}★</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REFERENCES TAB */}
        {activeTab === 'references' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">
                Cartas de recomendación y referencias de antiguos coordinadores o directores
              </span>

              {currentUser && !isAddingRef && (
                <button
                  onClick={() => setIsAddingRef(true)}
                  className="px-3 py-1.5 bg-[#00ff41]/10 hover:bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Emitir Referencia Oficial
                </button>
              )}
            </div>

            {/* Create Reference Form */}
            {isAddingRef && (
              <form onSubmit={handleCreateReference} className="bg-black/50 border border-[#00ff41]/30 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-[#00ff41] uppercase text-[11px] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    Emitir Referencia Institucional
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingRef(false)}
                    className="text-white/50 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                      Nombre del Emisor / Certificante *
                    </label>
                    <input
                      type="text"
                      required
                      value={refereeName}
                      onChange={e => setRefereeName(e.target.value)}
                      placeholder="Ej: Lic. Mariano Albarracín"
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                      Cargo / Puesto *
                    </label>
                    <input
                      type="text"
                      required
                      value={refereeRole}
                      onChange={e => setRefereeRole(e.target.value)}
                      placeholder="Ej: Coordinador Inferiores / Director Deportivo"
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                      Club / Institución *
                    </label>
                    <input
                      type="text"
                      required
                      value={refereeInstitution}
                      onChange={e => setRefereeInstitution(e.target.value)}
                      placeholder="Ej: Central Córdoba de Santiago del Estero"
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                      Relación o Vínculo *
                    </label>
                    <input
                      type="text"
                      required
                      value={relationship}
                      onChange={e => setRelationship(e.target.value)}
                      placeholder="Ej: Coordinador de Selección Reserva 2023-2024"
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                    Cita o Recomendación Oficial *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={quote}
                    onChange={e => setQuote(e.target.value)}
                    placeholder="Escribe la recomendación detallada del desempeño profesional..."
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !refereeName.trim() || !quote.trim()}
                  className="w-full py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black uppercase tracking-wider rounded-lg text-xs"
                >
                  {submitting ? 'Guardando...' : 'Guardar Referencia Verificada'}
                </button>
              </form>
            )}

            {references.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-xs border border-dashed border-white/10 rounded-2xl space-y-1">
                <p className="font-bold text-white/60">Sin referencias institucionales registradas.</p>
                <p className="text-[11px]">Solicita a tu ex-entrenador o club que certifique tu desempeño.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {references.map(refItem => (
                  <div key={refItem.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                          {refItem.refereeName}
                          <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                            {refItem.refereeRole}
                          </span>
                        </h5>
                        <p className="text-[11px] text-white/60">
                          {refItem.refereeInstitution} • <span className="italic">{refItem.relationship}</span>
                        </p>
                      </div>

                      <span className="text-[10px] text-[#00ff41] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verificada
                      </span>
                    </div>

                    <p className="text-xs text-white/80 italic leading-relaxed border-l-2 border-[#00ff41] pl-3 py-1">
                      "{refItem.quote}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
