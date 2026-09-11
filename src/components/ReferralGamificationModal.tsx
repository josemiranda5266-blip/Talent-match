import React, { useState } from 'react';
import {
  Trophy,
  Share2,
  Copy,
  Check,
  Award,
  Zap,
  Gift,
  X,
  Mail,
  MessageSquare,
  Sparkles,
  Users,
  ChevronRight,
  ShieldCheck,
  Star
} from 'lucide-react';
import { UserGrowthProfile } from '../types';

interface ReferralGamificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  growthProfile: UserGrowthProfile;
  userName: string;
  userRole: 'athlete' | 'club' | 'scout';
}

export const ReferralGamificationModal: React.FC<ReferralGamificationModalProps> = ({
  isOpen,
  onClose,
  growthProfile,
  userName,
  userRole,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'share' | 'achievements' | 'rewards'>('share');

  if (!isOpen) return null;

  const referralLink = `https://scoutar.app/ref/${growthProfile.referralCode}`;
  const whatsappMessage = encodeURIComponent(
    `¡Hola! Sumate a ScoutAR / TalentMatch, la plataforma de scouting deportivo líder en Argentina. Creá tu perfil gratis y conectá con clubes y representantes. Usá mi código de invitación *${growthProfile.referralCode}* o ingresá desde acá: ${referralLink}`
  );
  const emailSubject = encodeURIComponent(`Te invito a ScoutAR / TalentMatch - Plataforma de Scouting Deportivo`);
  const emailBody = encodeURIComponent(
    `¡Hola!\n\nTe invito a sumarte a ScoutAR, la comunidad deportiva donde clubes y deportistas de todo el país conectan diariamente.\n\nCreá tu perfil gratuito usando mi código de recomendación: ${growthProfile.referralCode}\nEnlace directo: ${referralLink}\n\n¡Nos vemos adentro!`
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-[#00ff41]/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#00ff41]/10 border border-[#00ff41]/30 flex items-center justify-center text-[#00ff41]">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
                  Crecimiento & Referidos
                </h2>
                <span className="text-[10px] font-mono font-bold text-black bg-[#00ff41] px-2 py-0.5 rounded-full uppercase">
                  {growthProfile.currentLevel}
                </span>
              </div>
              <p className="text-xs text-white/60">
                Ganá puntos, desbloqueá pases PRO gratis y sumá deportistas a la comunidad.
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

        {/* Level & Points Banner */}
        <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase block font-mono">Tus Puntos de Talento</span>
              <strong className="text-xl font-black text-white font-mono">{growthProfile.points} PTS</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00ff41]/10 border border-[#00ff41]/30 flex items-center justify-center text-[#00ff41]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase block font-mono">Referidos Exitosos</span>
              <strong className="text-xl font-black text-[#00ff41] font-mono">{growthProfile.totalReferrals} Deportistas</strong>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('share')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'share'
                ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" /> Invitar Amigos
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'achievements'
                ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Logros & Insignias
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'rewards'
                ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" /> Recompensas PRO
          </button>
        </div>

        {/* TAB 1: INVITE / SHARE */}
        {activeTab === 'share' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl p-5 space-y-3">
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                Tu Código Único de Referido
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={growthProfile.referralCode}
                  className="w-full bg-[#161618] border border-[#00ff41]/30 rounded-xl px-4 py-3 text-lg font-black font-mono text-[#00ff41] tracking-widest text-center focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-5 py-3 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado' : 'Copiar Link'}
                </button>
              </div>
              <p className="text-[11px] text-white/50">
                Por cada amigo o club que se registre con tu enlace, ganás <strong>100 Puntos</strong> + <strong>7 días de PRO Bonificado</strong>.
              </p>
            </div>

            {/* Direct Social Channels */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Compartir Directamente
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 text-[#25D366] font-extrabold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare className="w-4 h-4" /> Compartir en WhatsApp
                </a>

                <a
                  href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
                  className="p-3.5 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 font-extrabold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <Mail className="w-4 h-4" /> Enviar por Correo
                </a>
              </div>
            </div>

            {/* Reward Milestone Card */}
            <div className="bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-[#00ff41] tracking-wider block">Próximo Hito de Referidos</span>
                <p className="text-xs font-bold text-white">Llegá a 5 referidos y desbloqueá 1 Mes de Atleta/Club PRO Gratis</p>
              </div>
              <span className="text-xs font-mono font-black text-black bg-[#00ff41] px-3 py-1 rounded-xl shrink-0">
                {growthProfile.totalReferrals} / 5
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: ACHIEVEMENTS & BADGES */}
        {activeTab === 'achievements' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Profile Completion Bar */}
            <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase">
                <span className="text-white">Completitud del Perfil</span>
                <span className="text-[#00ff41] font-mono">{growthProfile.profileCompletionPercent}%</span>
              </div>
              <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#00ff41] h-full rounded-full transition-all duration-500"
                  style={{ width: `${growthProfile.profileCompletionPercent}%` }}
                />
              </div>
              {growthProfile.profileCompletionPercent < 100 && (
                <p className="text-[11px] text-white/60">
                  Completa tus fotos de partidos y videos de jugadas para alcanzar el 100% y ganar +150 PTS adicionales.
                </p>
              )}
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {growthProfile.achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2 ${
                    ach.unlocked
                      ? 'bg-[#0a0a0c] border-[#00ff41]/30 shadow-md shadow-[#00ff41]/5'
                      : 'bg-white/5 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{ach.badgeIcon}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        ach.unlocked
                          ? 'bg-[#00ff41]/20 text-[#00ff41]'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      +{ach.pointsBonus} PTS
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white uppercase italic">{ach.title}</h4>
                    <p className="text-[11px] text-white/60 mt-0.5">{ach.description}</p>
                  </div>

                  {ach.unlocked && (
                    <span className="text-[9px] text-[#00ff41] font-mono uppercase block pt-1">
                      Desbloqueado el {ach.unlockedAt}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: UNLOCKED REWARDS */}
        {activeTab === 'rewards' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-[#00ff41]" /> Beneficios Desbloqueados
              </h3>

              <div className="space-y-2">
                {growthProfile.unlockedRewards.map((reward, idx) => (
                  <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#00ff41]" /> {reward}
                    </span>
                    <span className="text-[10px] font-mono text-[#00ff41] bg-[#00ff41]/10 px-2 py-0.5 rounded">
                      ACTIVO
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 leading-relaxed">
              <strong>Canje de Puntos:</strong> Tus puntos de talento acumulados ({growthProfile.points} PTS) podrán ser canjeados por merchandising deportivo oficial, descuentos en indumentaria y prioridad en pruebas masivas de AFA.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
