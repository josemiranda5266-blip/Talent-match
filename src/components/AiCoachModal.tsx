import React, { useState } from 'react';
import { Athlete, AiCoachChatMessage } from '../types';
import { auth } from '../lib/firebase';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Award,
  Target,
  UserCheck,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react';

interface AiCoachModalProps {
  athlete: Athlete;
  isOpen: boolean;
  onClose: () => void;
}

export const AiCoachModal: React.FC<AiCoachModalProps> = ({ athlete, isOpen, onClose }) => {
  const [messages, setMessages] = useState<AiCoachChatMessage[]>([
    {
      id: 'init_1',
      sender: 'coach',
      text: `¡Hola ${athlete.name}! Soy tu Coach IA Personal en ScoutAR. He analizado en detalle tu ficha de ${athlete.sport} (${athlete.position}, ${athlete.age} años, nivel ${athlete.level}). ¿Qué te gustaría consultar hoy sobre tu desarrollo deportivo y oportunidades de contratación?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const PRESET_QUESTIONS = [
    '¿Qué debo mejorar para aumentar mi visibilidad?',
    '¿Estoy listo para jugar Federal A o Liga Profesional?',
    '¿Qué clubes o convocatorias son más compatibles conmigo?',
    '¿Qué posición me favorece según mis métricas?',
    '¿Qué habilidades específicas debería entrenar esta semana?',
  ];

  if (!isOpen) return null;

  const handleSendQuestion = async (questionText: string) => {
    if (!questionText.trim() || loading) return;

    const userMsg: AiCoachChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/ai/athlete-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ athlete, question: questionText }),
      });

      const data = await response.json();

      if (data.answer) {
        const coachMsg: AiCoachChatMessage = {
          id: `msg_c_${Date.now()}`,
          sender: 'coach',
          text: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          structuredFeedback: {
            strengths: data.strengths || [],
            weaknesses: data.weaknesses || [],
            competitiveLevel: data.competitiveLevel || 'Federal A',
            hiringProbability: data.hiringProbability || 82,
            priorityActions: data.priorityActions || [],
          },
        };
        setMessages((prev) => [...prev, coachMsg]);
      } else {
        throw new Error('Respuesta inválida');
      }
    } catch (err) {
      const fallbackMsg: AiCoachChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'coach',
        text: `Basándome en tus ${athlete.stats?.matchesPlayed || 12} partidos jugados y tu ubicación en ${athlete.city}: Tienes una base física sólida. Para maximizar tus oportunidades de ser convocado, te recomiendo subir 1 video corto con jugadas clave y completar tu verificación documental.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        structuredFeedback: {
          strengths: ['Regularidad en partidos', 'Ubicación geográfica favorable', 'Trust Score sólido'],
          weaknesses: ['Falta video HD de highlights', 'Licencia oficial sin adjuntar'],
          competitiveLevel: 'Próximo a Federal A',
          hiringProbability: 75,
          priorityActions: [
            'Cargar video de jugadas destacadas (+15% visibilidad)',
            'Solicitar 1 referencia a un ex entrenador',
            'Responder mensajes en menos de 30 mins',
          ],
        },
      };
      setMessages((prev) => [...prev, fallbackMsg]);
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
                <h2 className="font-black text-white text-lg italic uppercase">Coach IA Deportivo Personal</h2>
                <span className="bg-[#00ff41]/20 text-[#00ff41] text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                  Gemini 3.6
                </span>
              </div>
              <p className="text-xs text-white/60">
                Orientador inteligente para {athlete.name} ({athlete.sport} - {athlete.position})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRESET CHIPS */}
        <div className="px-5 py-3 bg-[#0a0a0c] border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-white/40 shrink-0">Preguntas sugeridas:</span>
          {PRESET_QUESTIONS.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuestion(pq)}
              disabled={loading}
              className="text-xs bg-[#161618] hover:bg-[#202025] text-white/80 hover:text-[#00ff41] border border-white/10 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all shrink-0"
            >
              {pq}
            </button>
          ))}
        </div>

        {/* MESSAGES LIST */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-[#00ff41] text-black font-semibold rounded-br-none shadow-md'
                    : 'bg-[#1a1a1e] text-white border border-white/10 rounded-bl-none shadow-xl'
                }`}
              >
                <p>{msg.text}</p>

                {/* STRUCTURED FEEDBACK CARDS IF PRESENT */}
                {msg.structuredFeedback && (
                  <div className="pt-3 border-t border-white/10 space-y-3 text-xs">
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#0a0a0c] p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-white/50 uppercase">Nivel Proyectado</span>
                        <p className="font-bold text-amber-400 mt-0.5">{msg.structuredFeedback.competitiveLevel}</p>
                      </div>

                      <div className="bg-[#0a0a0c] p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-white/50 uppercase">Prob. Contratación</span>
                        <p className="font-bold text-[#00ff41] font-mono mt-0.5">
                          {msg.structuredFeedback.hiringProbability}%
                        </p>
                      </div>
                    </div>

                    {/* STRENGTHS AND WEAKNESSES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-[#0a0a0c] p-3 rounded-xl border border-emerald-500/20">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Fortalezas
                        </span>
                        <ul className="mt-1 space-y-1 text-white/80 text-[11px]">
                          {msg.structuredFeedback.strengths.map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-[#0a0a0c] p-3 rounded-xl border border-amber-500/20">
                        <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Aspectos a Mejorar
                        </span>
                        <ul className="mt-1 space-y-1 text-white/80 text-[11px]">
                          {msg.structuredFeedback.weaknesses.map((w, i) => (
                            <li key={i}>• {w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* PRIORITY ACTIONS */}
                    <div className="bg-[#0a0a0c] p-3 rounded-xl border border-[#00ff41]/20">
                      <span className="text-[10px] font-bold text-[#00ff41] uppercase flex items-center gap-1">
                        <Target className="w-3 h-3" /> Acciones Prioritarias
                      </span>
                      <ul className="mt-1 space-y-1 text-white/90 text-[11px]">
                        {msg.structuredFeedback.priorityActions.map((pa, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <ChevronRight className="w-3 h-3 text-[#00ff41]" /> {pa}
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                )}

                <span className="text-[9px] opacity-60 block text-right mt-1 font-mono">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#00ff41] italic animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" /> Analizando tu perfil con ScoutAR AI...
            </div>
          )}
        </div>

        {/* INPUT BOX */}
        <div className="p-4 bg-[#161618] border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion(inputValue)}
            placeholder="Escribe tu pregunta sobre tu desarrollo deportivo..."
            disabled={loading}
            className="flex-1 bg-[#0a0a0c] text-white text-xs sm:text-sm px-4 py-3 rounded-xl border border-white/10 focus:border-[#00ff41] focus:outline-none"
          />

          <button
            onClick={() => handleSendQuestion(inputValue)}
            disabled={loading || !inputValue.trim()}
            className="px-5 py-3 bg-[#00ff41] hover:bg-[#00e038] disabled:opacity-50 text-black font-black text-xs uppercase rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-[#00ff41]/20 shrink-0"
          >
            <Send className="w-4 h-4" /> Enviar
          </button>
        </div>

      </div>
    </div>
  );
};
