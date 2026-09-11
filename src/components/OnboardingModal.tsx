import React, { useState } from 'react';
import {
  X,
  Trophy,
  Users,
  Search,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Crown,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Bienvenido a TalentMatch',
      subtitle: 'La Plataforma Inteligente para Atletas y Profesionales del Deporte',
      icon: Trophy,
      badge: 'Red Oficial de Scouteo',
      description:
        'Conectamos a deportistas, cuerpos técnicos, cuerpo médico y gestores deportivos directamente con clubes de Argentina y Latinoamérica.',
      bulletPoints: [
        'Perfil dinámico adaptado a tu profesión exacta (18 categorías)',
        'Sin intermediarios confusos ni comisiones ocultas',
        'Sello de verificación oficial y scouting en tiempo real'
      ],
      image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: '1. Completa tu Perfil Especializado',
      subtitle: 'Muestra lo que te distingue según tu profesión',
      icon: Users,
      badge: 'Campos Personalizados',
      description:
        'Si eres deportista, muestra tus goles y videos de jugadas. Si eres Preparador Físico, Médico o DT, destaca tus licencias (CONMEBOL/AFA), matrícula e historial de clubes.',
      bulletPoints: [
        'Deportistas: Partidos, minutos, pierna hábil y video highlights',
        'Cuerpo Técnico: Licencias oficiales, metodología táctica y trayectoria',
        'Área Médica: Matrícula habilitante, especialidad clínica y certificaciones'
      ],
      image: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: '2. Explora Convocatorias & Pruebas',
      subtitle: 'Encuentra las búsquedas activas de clubes y academias',
      icon: Search,
      badge: 'Scouting Activo',
      description:
        'Filtra las búsquedas institucionales por deporte, provincia, ciudad, categoría requerida y remuneración u ofrecimiento de viáticos.',
      bulletPoints: [
        'Fechas y ubicaciones exactas de pruebas presenciales',
        'Búsquedas adaptadas para cuerpo técnico y profesionales de salud',
        'Postulación directa en 1-click con tu ficha deportiva'
      ],
      image: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: '3. Inteligencia Artificial Gemini',
      subtitle: 'Tu Asesor Táctico y Evaluador Personal',
      icon: Sparkles,
      badge: 'Motor de IA Avanzado',
      description:
        'Nuestra IA analisa tu perfil en lenguaje natural, calcula tu porcentaje de compatibilidad con las búsquedas y genera recomendaciones de mejora.',
      bulletPoints: [
        'Análisis contextualizado según tu perfil profesional',
        'Sugerencias específicas para destacar ante directores deportivos',
        'Buscador inteligente de talentos en lenguaje natural'
      ],
      image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: '4. Potencia tu Carrera con TalentMatch PRO',
      subtitle: 'Destaca en las búsquedas y accede a contacto directo',
      icon: Crown,
      badge: 'Plan PRO Preferencial',
      description:
        'Obtén prioridad en los listados de directores deportivos, insignia de verificación oficial y mensajes ilimitados con scouts.',
      bulletPoints: [
        'Aparece primero en las búsquedas de reclutadores',
        'Insignia de atleta / profesional verificado',
        'Reportes periódicos de scouteo técnico y rendimiento'
      ],
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80'
    }
  ];

  const currentData = steps[currentStep] ?? steps[0];
  const IconComponent = currentData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
      if (onOpenAuth) onOpenAuth();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-[#00ff41]/30 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col space-y-6">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#00ff41]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="bg-[#00ff41]/20 border border-[#00ff41]/40 text-[#00ff41] text-[10px] uppercase font-black px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> {currentData.badge}
            </span>
            <span className="text-xs text-white/50 font-mono">
              Paso {currentStep + 1} de {steps.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          {/* Left Text */}
          <div className="sm:col-span-7 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#00ff41] text-black flex items-center justify-center font-black">
                <IconComponent className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
                {currentData.title}
              </h3>
            </div>

            <p className="text-xs font-bold text-[#00ff41] uppercase tracking-wider">
              {currentData.subtitle}
            </p>

            <p className="text-xs text-white/70 leading-relaxed">
              {currentData.description}
            </p>

            <ul className="space-y-2 pt-2">
              {currentData.bulletPoints.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-white/90">
                  <CheckCircle2 className="w-4 h-4 text-[#00ff41] shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Preview Card */}
          <div className="sm:col-span-5 relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0c] shadow-lg h-48 sm:h-64 flex items-end p-4">
            <img
              src={currentData.image}
              alt={currentData.title}
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent" />
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] text-[#00ff41] font-mono font-bold block">TALENTMATCH PLATFORM</span>
              <p className="text-xs text-white font-black uppercase italic">{currentData.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Progress Dots & Navigation */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6 bg-[#00ff41]'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 font-bold rounded-xl text-xs flex items-center gap-1 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Anterior
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-[#00ff41] text-black font-black uppercase text-xs rounded-xl shadow-lg shadow-[#00ff41]/20 hover:bg-[#00ff41]/90 transition-all flex items-center gap-1.5"
            >
              {currentStep === steps.length - 1 ? (
                <>Comenzar Ahora <Sparkles className="w-3.5 h-3.5" /></>
              ) : (
                <>Siguiente <ChevronRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
