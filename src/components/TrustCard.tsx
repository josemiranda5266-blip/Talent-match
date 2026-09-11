import React from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Clock,
  Star,
  MessageSquare,
  FileText,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { Athlete, VerificationTier, TrustProfileMetrics } from '../types';
import { calculateTrustMetrics } from '../services/firebaseService';

interface TrustCardProps {
  athlete: Athlete;
  onOpenVerificationModal?: () => void;
  onOpenReviewsModal?: () => void;
  onReportUser?: () => void;
}

export const TrustCard: React.FC<TrustCardProps> = ({
  athlete,
  onOpenVerificationModal,
  onOpenReviewsModal,
  onReportUser
}) => {
  const metrics: TrustProfileMetrics = calculateTrustMetrics(athlete);

  const getTierBadge = (tier: VerificationTier) => {
    switch (tier) {
      case 'featured':
        return {
          label: 'Perfil Destacado PRO',
          color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          icon: <Award className="w-3.5 h-3.5 text-amber-400" />
        };
      case 'professional':
        return {
          label: 'Verificación Profesional',
          color: 'bg-[#00ff41]/20 text-[#00ff41] border-[#00ff41]/50',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-[#00ff41]" />
        };
      case 'documental':
        return {
          label: 'Verificación Documental',
          color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
          icon: <FileText className="w-3.5 h-3.5 text-cyan-400" />
        };
      case 'identity':
        return {
          label: 'Verificación de Identidad',
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
          icon: <UserCheck className="w-3.5 h-3.5 text-blue-400" />
        };
      default:
        return {
          label: 'Perfil Sin Verificar',
          color: 'bg-white/5 text-white/50 border-white/10',
          icon: <Clock className="w-3.5 h-3.5 text-white/40" />
        };
    }
  };

  const tierInfo = getTierBadge(metrics.verificationTier);

  return (
    <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
      {/* Background glow based on trust score */}
      <div
        className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
          metrics.trustScore >= 80
            ? 'bg-[#00ff41]/10'
            : metrics.trustScore >= 50
            ? 'bg-blue-500/10'
            : 'bg-white/5'
        }`}
      />

      {/* Header with Trust Score */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#00ff41]/15 text-[#00ff41] border border-[#00ff41]/30 flex items-center justify-center font-black">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-white uppercase italic tracking-wider">
                Nivel de Confianza
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${tierInfo.color}`}>
                {tierInfo.icon}
                {tierInfo.label}
              </span>
            </div>
            <p className="text-[11px] text-white/50">
              Índice verificado por auditoría de TalentMatch Trust & Safety
            </p>
          </div>
        </div>

        {/* Big percentage score */}
        <div className="text-right">
          <div className="text-2xl font-black text-[#00ff41] tracking-tight">
            {metrics.trustScore}%
          </div>
          <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest block">
            {metrics.trustScore >= 80
              ? 'Confianza Alta'
              : metrics.trustScore >= 50
              ? 'Confianza Media'
              : 'Verificación Inicial'}
          </span>
        </div>
      </div>

      {/* Grid of Trust Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-white/50 uppercase font-semibold block mb-1">
            Actividad
          </span>
          <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
            {metrics.activityLevel}
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-white/50 uppercase font-semibold block mb-1">
            Respuesta Media
          </span>
          <div className="flex items-center gap-1 font-bold text-white text-[11px]">
            <Clock className="w-3.5 h-3.5 text-white/60" />
            &lt; {metrics.avgResponseMinutes} min
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-white/50 uppercase font-semibold block mb-1">
            Valoración Promedio
          </span>
          <button
            onClick={onOpenReviewsModal}
            className="flex items-center gap-1 font-bold text-amber-400 text-[11px] hover:underline"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            {athlete.rating || 5.0} ★ ({metrics.totalReviewsCount})
          </button>
        </div>

        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-white/50 uppercase font-semibold block mb-1">
            Referencias
          </span>
          <div className="flex items-center gap-1 font-bold text-cyan-400 text-[11px]">
            <Building2 className="w-3.5 h-3.5" />
            {metrics.verifiedReferencesCount} Verificadas
          </div>
        </div>
      </div>

      {/* Verification Level Progress Checklist */}
      <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-2">
        <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
          Insignias de Validación Obtenidas:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${
            metrics.hasIdentityVerified
              ? 'bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/30 font-semibold'
              : 'bg-white/5 text-white/40 border-white/5'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            1. Identidad DNI
          </div>

          <div className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${
            metrics.hasDocumentVerified
              ? 'bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/30 font-semibold'
              : 'bg-white/5 text-white/40 border-white/5'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            2. Documental / Licencia
          </div>

          <div className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${
            metrics.hasProfessionalVerified
              ? 'bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/30 font-semibold'
              : 'bg-white/5 text-white/40 border-white/5'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            3. Validación Club
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        {onOpenVerificationModal && (
          <button
            onClick={onOpenVerificationModal}
            className="px-3 py-1.5 bg-[#00ff41]/15 hover:bg-[#00ff41]/25 text-[#00ff41] border border-[#00ff41]/40 rounded-xl font-bold transition-all flex items-center gap-1.5 text-[11px]"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Subir Nivel de Verificación
          </button>
        )}

        {onReportUser && (
          <button
            onClick={onReportUser}
            className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 ml-auto"
          >
            <AlertTriangle className="w-3 h-3" />
            Denunciar Actividad Sospechosa
          </button>
        )}
      </div>
    </div>
  );
};
