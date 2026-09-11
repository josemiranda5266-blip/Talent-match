import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  Send,
  CheckCircle2
} from 'lucide-react';
import { submitUserReport, UserProfile } from '../services/firebaseService';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  currentUser: UserProfile | null;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  currentUser
}) => {
  const [reason, setReason] = useState<
    'fake_identity' | 'spam' | 'harassment' | 'payment_fraud' | 'false_credentials' | 'other'
  >('fake_identity');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !currentUser) return;

    setSubmitting(true);
    try {
      await submitUserReport({
        id: `rep-${Date.now()}`,
        reporterUserId: currentUser.uid,
        reporterName: currentUser.displayName || 'Usuario Reportante',
        reportedUserId: targetUserId,
        reportedUserName: targetUserName,
        reason,
        description,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121214] border border-rose-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center font-black">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase italic">
                Denunciar Perfil / Actividad
              </h3>
              <p className="text-[11px] text-white/50">
                Para: <span className="text-white font-bold">{targetUserName}</span>
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

        {submitted ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#00ff41] mx-auto animate-bounce" />
            <h4 className="font-black text-white text-base uppercase">
              Denuncia Recibida
            </h4>
            <p className="text-xs text-white/60">
              El equipo de Trust & Safety revisará la evidencia y tomará las medidas pertinentes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                Motivo Principal de la Denuncia *
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as any)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
              >
                <option value="fake_identity">Perfil / Identidad Falsa o Usurpada</option>
                <option value="payment_fraud">Fraude Financiero / Pedido de Dinero por Pruebas</option>
                <option value="false_credentials">Licencias, Matrículas o Documentos Falsificados</option>
                <option value="spam">Spam / Mensajes Masivos No Solicitados</option>
                <option value="harassment">Acoso o Comportamiento Inapropiado</option>
                <option value="other">Otro Incumplimiento de las Normas</option>
              </select>
            </div>

            <div>
              <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                Detalle y Evidencia *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Explica detalladamente lo sucedido o los mensajes recibidos..."
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              {submitting ? 'Enviando...' : 'Enviar Denuncia para Moderación'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
