import React, { useState } from 'react';
import {
  X,
  Award,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Building,
  UserCheck
} from 'lucide-react';
import { submitVerificationRequest, UserProfile } from '../services/firebaseService';
import { VerificationTier } from '../types';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [requestedTier, setRequestedTier] = useState<VerificationTier>('documental');
  const [docType, setDocType] = useState('DNI Frente / Dorso (Atleta)');
  const [docUrl, setDocUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docUrl.trim()) return;

    setLoading(true);
    try {
      await submitVerificationRequest({
        id: `verif-${Date.now()}`,
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: currentUser.displayName || 'Usuario',
        userRole: currentUser.role,
        category: (currentUser as any).category || 'Deportista',
        requestedTier: requestedTier,
        dniDocumentUrl: docUrl,
        notes: `${docType}: ${notes}`,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Error submitting verification:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-[#00ff41]/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00ff41] text-black flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">
                Verificación de Identidad
              </h3>
              <p className="text-[11px] text-white/60">
                Insignia Oficial de Confianza TalentMatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#00ff41] mx-auto animate-bounce" />
            <h4 className="font-black text-white text-base uppercase">
              ¡Solicitud Enviada!
            </h4>
            <p className="text-xs text-white/60">
              Un administrador revisará tu documentación. Tu perfil recibirá la insignia oficial verificada en breve.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                Tipo de Documentación Oficial
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#00ff41]"
              >
                <option value="DNI Frente / Dorso (Atleta)">DNI Frente y Dorso (Atleta / Deportista)</option>
                <option value="Constancia AFA / Liga Regional">Constancia AFA / Liga Regional / Federación</option>
                <option value="Estatuto o Personería Jurídica (Club)">Estatuto / Personería Jurídica de Club</option>
                <option value="Matrícula Agente FIFA / Scouting">Matrícula de Agente / Representante FIFA</option>
              </select>
            </div>

            <div>
              <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                URL de Imagen / Documento *
              </label>
              <input
                type="text"
                required
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://... (Foto clara de tu documento)"
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#00ff41]"
              />
              <span className="text-[10px] text-white/40 block mt-1">
                Asegúrate de que los datos del documento coincidan con tu cuenta.
              </span>
            </div>

            <div>
              <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                Notas adicionales (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ej: Liga Santafesina de Fútbol, Ficha de jugador N° 8492"
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#00ff41]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !docUrl.trim()}
              className="w-full py-3 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Enviando Verificación...' : 'Enviar para Revisión Oficial'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
