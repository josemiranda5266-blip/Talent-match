import React, { useState } from 'react';
import { Athlete, AIScoutReport } from '../types';
import { auth } from '../lib/firebase';
import {
  X,
  MapPin,
  Sparkles,
  Trophy,
  Video,
  CheckCircle2,
  Phone,
  Mail,
  Crown,
  Play,
  Share2,
  Send,
  Activity,
  MessageSquare,
  Star,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { TrustCard } from './TrustCard';
import { CareerTimeline } from './CareerTimeline';
import { ReviewsAndReferencesModal } from './ReviewsAndReferencesModal';
import { ReportUserModal } from './ReportUserModal';

interface CandidateModalProps {
  athlete: Athlete | null;
  onClose: () => void;
  onInviteToTrial?: (athleteId: string) => void;
  onOpenChatWithAthlete?: (ath: Athlete) => void;
  onOpenReviewsModal?: (athId: string, athName: string) => void;
  currentUser?: any;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  athlete,
  onClose,
  onInviteToTrial,
  onOpenChatWithAthlete,
  onOpenReviewsModal,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'video' | 'stats' | 'scout'>('profile');
  const [isGeneratingScout, setIsGeneratingScout] = useState(false);
  const [aiReport, setAiReport] = useState<AIScoutReport | null>(null);
  const [invitedStatus, setInvitedStatus] = useState(false);

  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (!athlete) return null;

  const handleGenerateScoutReport = async () => {
    setIsGeneratingScout(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/ai/scout-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ athlete }),
      });
      const data = await response.json();
      if (data.report) {
        setAiReport(data.report);
      }
    } catch (err) {
      console.error('Error in modal AI scout report:', err);
    } finally {
      setIsGeneratingScout(false);
    }
  };

  const handleInvite = () => {
    if (onInviteToTrial) {
      onInviteToTrial(athlete.id);
    }
    setInvitedStatus(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-white/10 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
        {/* Top Header Bar */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4 sticky top-0 bg-[#161618]/95 backdrop-blur z-20">
          <div className="flex items-center gap-4">
            <img
              src={athlete.avatar}
              alt={athlete.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#00ff41]/50"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tight">{athlete.name}</h2>
                {athlete.isVerified && (
                  <CheckCircle2 className="w-4 h-4 text-[#00ff41]" />
                )}
                {athlete.isPremium && (
                  <span className="bg-[#00ff41] text-black text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                    <Crown className="w-3 h-3" /> PRO
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-widest">
                  {athlete.category || 'Deportista'}
                </span>
                <span className="text-xs text-white/60">
                  <span className="text-[#00ff41] font-bold">{athlete.sport} • {athlete.position}</span> • {athlete.age} años
                </span>
              </div>
              <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#00ff41]" /> {athlete.city}, {athlete.province}
              </p>
            </div>
          </div>

          <button
            id="btn-close-candidate-modal"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-white/10 bg-[#0a0a0c] flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 font-extrabold border-b-2 transition-colors uppercase tracking-wider ${
              activeTab === 'profile'
                ? 'border-[#00ff41] text-[#00ff41]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Ficha Técnica
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-4 py-3 font-extrabold border-b-2 transition-colors flex items-center gap-1.5 uppercase tracking-wider ${
              activeTab === 'video'
                ? 'border-[#00ff41] text-[#00ff41]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" /> Video Highlight
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-3 font-extrabold border-b-2 transition-colors flex items-center gap-1.5 uppercase tracking-wider ${
              activeTab === 'stats'
                ? 'border-[#00ff41] text-[#00ff41]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Estadísticas
          </button>
          <button
            onClick={() => setActiveTab('scout')}
            className={`px-4 py-3 font-extrabold border-b-2 transition-colors flex items-center gap-1.5 uppercase tracking-wider ${
              activeTab === 'scout'
                ? 'border-[#00ff41] text-[#00ff41]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00ff41]" /> Informe IA
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6 flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Trust & Verification Card (FASE 3) */}
              <TrustCard
                athlete={athlete}
                onOpenReviewsModal={() => setIsReviewsModalOpen(true)}
                onReportUser={() => setIsReportModalOpen(true)}
              />

              {/* Professional Parameters & Availability Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block">Disponibilidad</span>
                  <span className="text-xs font-black text-[#00ff41]">{athlete.availability || 'Inmediata'}</span>
                </div>
                <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block">Años Experiencia</span>
                  <span className="text-base font-black text-white font-mono">{athlete.yearsExperience || 1} {athlete.yearsExperience === 1 ? 'Año' : 'Años'}</span>
                </div>
                <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block">Relocalización</span>
                  <span className="text-xs font-black text-white">{athlete.willingToRelocate ? 'Sí (Nacional / Int.)' : 'Solo Local'}</span>
                </div>
                <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block">Nivel</span>
                  <span className="text-xs font-black text-white">{athlete.level}</span>
                </div>
              </div>

              {/* Career Timeline (FASE 3) */}
              <CareerTimeline userId={athlete.id} isOwner={currentUser?.uid === athlete.id} />

              {/* Certifications & Licenses */}
              {athlete.certificationsAndLicenses && athlete.certificationsAndLicenses.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Licencias & Certificaciones Profesionales</h4>
                  <div className="flex flex-wrap gap-2 bg-[#0a0a0c] p-4 rounded-2xl border border-white/5">
                    {athlete.certificationsAndLicenses.map((cert, idx) => (
                      <span key={idx} className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs px-3 py-1 rounded-xl font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work History / Trayectoria Institucional */}
              {athlete.workHistory && athlete.workHistory.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Historial Laboral / Trayectoria en Clubes</h4>
                  <div className="space-y-2 bg-[#0a0a0c] p-4 rounded-2xl border border-white/5">
                    {athlete.workHistory.map((work, idx) => (
                      <div key={idx} className="border-b border-white/5 last:border-b-0 pb-2.5 last:pb-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-white">{work.clubOrInstitution}</span>
                          <span className="text-[#00ff41] font-mono text-[11px] bg-[#00ff41]/10 px-2 py-0.5 rounded-md">{work.period}</span>
                        </div>
                        <p className="text-xs text-white/70 mt-0.5">{work.role}</p>
                        {work.achievements && (
                          <p className="text-[11px] text-white/50 italic mt-0.5">🏆 {work.achievements}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              <div>
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Biografía & Perfil Deportivo</h4>
                <p className="text-sm text-white/80 leading-relaxed bg-[#0a0a0c] p-4 rounded-2xl border border-white/5 font-normal">
                  {athlete.bio}
                </p>
              </div>

              {/* Photos Gallery */}
              {athlete.galleryPhotos && athlete.galleryPhotos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Galería de Fotos ({athlete.galleryPhotos.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {athlete.galleryPhotos.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="rounded-xl overflow-hidden border border-white/10 aspect-square group bg-[#0a0a0c]">
                        <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Contact Info & Communication Buttons */}
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider">Contacto & Canales Directos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/80 font-mono">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#00ff41]" />
                    <span>{athlete.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#00ff41]" />
                    <span>{athlete.contactPhone}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  {onOpenChatWithAthlete && (
                    <button
                      onClick={() => onOpenChatWithAthlete(athlete)}
                      className="px-4 py-2 bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 hover:bg-[#00ff41]/20 font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4" /> Chat Privado en Tiempo Real
                    </button>
                  )}
                  {onOpenReviewsModal && (
                    <button
                      onClick={() => onOpenReviewsModal(athlete.id, athlete.name)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Star className="w-4 h-4 text-yellow-400" /> Ver Reseñas ({athlete.rating} ★)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0c]">
                <img
                  src={athlete.videoThumbnail || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80'}
                  alt="Video Highlight"
                  className="w-full h-72 object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-[#0a0a0c]/50 flex items-center justify-center">
                  <a
                    href={athlete.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-16 h-16 rounded-full bg-[#00ff41] text-black flex items-center justify-center shadow-2xl shadow-[#00ff41]/40 hover:scale-110 transition-transform"
                  >
                    <Play className="w-8 h-8 ml-1 fill-black" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4 animate-fadeIn">
              {athlete.stats ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/5 text-center font-mono">
                      <span className="text-xs text-white/40 uppercase block">Partidos Jugados</span>
                      <span className="text-2xl font-black text-white">{athlete.stats.matchesPlayed}</span>
                    </div>
                    <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/5 text-center font-mono">
                      <span className="text-xs text-white/40 uppercase block">Goles / Puntos</span>
                      <span className="text-2xl font-black text-[#00ff41]">{athlete.stats.goalsOrPoints}</span>
                    </div>
                    {athlete.stats.assists !== undefined && (
                      <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/5 text-center font-mono">
                        <span className="text-xs text-white/40 uppercase block">Asistencias</span>
                        <span className="text-2xl font-black text-white">{athlete.stats.assists}</span>
                      </div>
                    )}
                  </div>

                  {athlete.stats.achievements && athlete.stats.achievements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Palmarés & Logros Destacados</h4>
                      <ul className="space-y-2">
                        {athlete.stats.achievements.map((ach, idx) => (
                          <li key={idx} className="bg-[#0a0a0c] p-3 rounded-xl border border-white/5 text-xs text-white/80 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-[#00ff41] shrink-0" /> {ach}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-[#0a0a0c] p-6 rounded-2xl border border-white/5 text-center space-y-2">
                  <Trophy className="w-8 h-8 text-[#00ff41] mx-auto opacity-80" />
                  <p className="text-xs text-white font-bold uppercase tracking-wider">Perfil Profesional ({athlete.category || 'Técnico / Especialista'})</p>
                  <p className="text-xs text-white/60 max-w-md mx-auto">
                    Este perfil no registra estadísticas de competencia de campo, pero cuenta con {athlete.yearsExperience || 1} años de experiencia profesional certificada.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scout' && (
            <div className="space-y-4 animate-fadeIn">
              {!aiReport ? (
                <div className="text-center py-8 space-y-3 bg-[#0a0a0c] p-6 rounded-2xl border border-white/5">
                  <Sparkles className="w-8 h-8 text-[#00ff41] mx-auto" />
                  <h4 className="text-base font-black text-white uppercase italic">Generar Reporte de Scouting Gemini IA</h4>
                  <p className="text-xs text-white/50 max-w-md mx-auto">
                    Solicita una evaluación técnica objetiva en tiempo real sobre este atleta.
                  </p>
                  <button
                    onClick={handleGenerateScoutReport}
                    disabled={isGeneratingScout}
                    className="px-5 py-2.5 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 hover:scale-105 transition-transform"
                  >
                    {isGeneratingScout ? 'Generando Reporte IA...' : 'Generar Informe de Scouting Ahora'}
                  </button>
                </div>
              ) : (
                <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-[#00ff41]/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs text-white/60">Nivel Recomendado: <strong className="text-[#00ff41]">{aiReport.suggestedLevel}</strong></span>
                    <span className="text-sm font-black text-white bg-[#00ff41]/10 px-3 py-1 rounded-xl border border-[#00ff41]/30 font-mono">
                      Rating: {aiReport.overallRating} / 10
                    </span>
                  </div>

                  <p className="text-xs text-white/80 leading-relaxed font-normal">{aiReport.summary}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
                      <strong className="text-[#00ff41] block mb-1 uppercase tracking-wider">Fortalezas Clave:</strong>
                      <ul className="space-y-1 text-white/80">
                        {aiReport.strengths.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
                      <strong className="text-amber-400 block mb-1 uppercase tracking-wider">Áreas a Mejorar:</strong>
                      <ul className="space-y-1 text-white/80">
                        {aiReport.areasToImprove.map((a, i) => (
                          <li key={i}>• {a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-[#0a0a0c] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 text-white/70 text-xs font-bold uppercase rounded-xl hover:bg-white/10"
          >
            Cerrar Ficha
          </button>
          <button
            id="btn-modal-invite-trial"
            onClick={handleInvite}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              invitedStatus
                ? 'bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40'
                : 'bg-[#00ff41] hover:bg-[#00ff41]/90 text-black shadow-lg shadow-[#00ff41]/20'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            {invitedStatus ? 'Cita Enviada ✓' : 'Citar a Prueba Presencial'}
          </button>
        </div>
      </div>

      {/* Trust & Safety Modals */}
      <ReviewsAndReferencesModal
        isOpen={isReviewsModalOpen}
        onClose={() => setIsReviewsModalOpen(false)}
        targetAthlete={athlete}
        currentUser={currentUser}
      />

      <ReportUserModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetUserId={athlete.id}
        targetUserName={athlete.name}
        currentUser={currentUser}
      />
    </div>
  );
};
