import React, { useState } from 'react';
import { SUBSCRIPTION_PLANS } from '../data/mockData';
import { SubscriptionPlan } from '../types';
import { X, Crown, Check, Zap, Building2, Sparkles, Award, ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

interface MonetizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAthletePro: boolean;
  isClubPro: boolean;
  onToggleAthletePro: () => void;
  onToggleClubPro: () => void;
  onOpenCheckout: (plan: SubscriptionPlan) => void;
}

export const MonetizationModal: React.FC<MonetizationModalProps> = ({
  isOpen,
  onClose,
  isAthletePro,
  isClubPro,
  onToggleAthletePro,
  onToggleClubPro,
  onOpenCheckout,
}) => {
  const [activeTab, setActiveTab] = useState<'athlete' | 'club' | 'sponsors' | 'security'>('athlete');

  if (!isOpen) return null;

  const athletePlans = SUBSCRIPTION_PLANS.filter((p) => p.target === 'athlete');
  const clubPlans = SUBSCRIPTION_PLANS.filter((p) => p.target === 'club');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#161618]/95 backdrop-blur z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ff41] text-black flex items-center justify-center font-black">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Planes, Pagos & Monetización</h2>
              <p className="text-xs text-white/60">Suscripciones para atletas, clubes, sponsors y medios de pago protegidos</p>
            </div>
          </div>

          <button
            id="btn-close-monetization-modal"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 border-b border-white/10 bg-[#0a0a0c] flex items-center gap-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('athlete')}
            className={`py-3 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-colors shrink-0 ${
              activeTab === 'athlete'
                ? 'border-[#00ff41] text-[#00ff41]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            🏃 Para Deportistas
          </button>
          <button
            onClick={() => setActiveTab('club')}
            className={`py-3 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-colors shrink-0 ${
              activeTab === 'club'
                ? 'border-[#00ff41] text-[#00ff41]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            🏟️ Para Clubes y Entrenadores
          </button>
          <button
            onClick={() => setActiveTab('sponsors')}
            className={`py-3 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-colors shrink-0 ${
              activeTab === 'sponsors'
                ? 'border-[#00ff41] text-[#00ff41]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            🏷️ Marcas y Publicidad
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-[#00ff41] text-[#00ff41]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#00ff41]" /> Ciberseguridad & Pagos
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {activeTab === 'athlete' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {athletePlans.map((plan) => {
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-3xl p-6 border transition-all flex flex-col justify-between relative ${
                        plan.popular
                          ? 'bg-[#0a0a0c] border-[#00ff41] shadow-2xl shadow-[#00ff41]/10'
                          : 'bg-[#0a0a0c]/60 border-white/10'
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-3 right-6 bg-[#00ff41] text-black font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                          MÁS POPULAR
                        </span>
                      )}

                      <div className="space-y-4">
                        <h3 className="text-lg font-black text-white uppercase italic">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 font-mono">
                          <span className="text-2xl sm:text-3xl font-black text-white">{plan.priceMonthly}</span>
                          <span className="text-xs text-white/40">/ mes</span>
                        </div>

                        <ul className="space-y-2.5 pt-3 border-t border-white/10 text-xs">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              {feat.included ? (
                                <Check className="w-4 h-4 text-[#00ff41] shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-white/30 shrink-0" />
                              )}
                              <span className={feat.included ? 'text-white/80' : 'text-white/30 line-through'}>
                                {feat.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        id={`btn-select-plan-${plan.id}`}
                        onClick={() => {
                          if (plan.popular) {
                            onOpenCheckout(plan);
                          }
                        }}
                        className={`mt-6 w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          plan.popular
                            ? isAthletePro
                              ? 'bg-[#00ff41]/20 border border-[#00ff41] text-[#00ff41]'
                              : 'bg-[#00ff41] hover:bg-[#00ff41]/90 text-black hover:scale-[1.02] shadow-lg shadow-[#00ff41]/20'
                            : 'bg-white/5 text-white/40 cursor-default'
                        }`}
                      >
                        {plan.popular ? (
                          isAthletePro ? (
                            'PRO ACTIVADO ✓ (Ver Factura / Gestionar)'
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" /> Pagar & Activar Plan PRO
                            </>
                          )
                        ) : (
                          'Plan Básico Activo'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'club' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clubPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-3xl p-6 border transition-all flex flex-col justify-between relative ${
                      plan.popular
                        ? 'bg-[#0a0a0c] border-[#00ff41] shadow-2xl shadow-[#00ff41]/10'
                        : 'bg-[#0a0a0c]/60 border-white/10'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 right-6 bg-[#00ff41] text-black font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                        RECOMENDADO CLUBES
                      </span>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-white uppercase italic">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 font-mono">
                        <span className="text-2xl sm:text-3xl font-black text-white">{plan.priceMonthly}</span>
                        <span className="text-xs text-white/40">/ mes</span>
                      </div>

                      <ul className="space-y-2.5 pt-3 border-t border-white/10 text-xs">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            {feat.included ? (
                              <Check className="w-4 h-4 text-[#00ff41] shrink-0" />
                            ) : (
                              <X className="w-4 h-4 text-white/30 shrink-0" />
                            )}
                            <span className={feat.included ? 'text-white/80' : 'text-white/30 line-through'}>
                              {feat.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      id={`btn-select-club-plan-${plan.id}`}
                      onClick={() => {
                        if (plan.popular) {
                          onOpenCheckout(plan);
                        }
                      }}
                      className={`mt-6 w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        plan.popular
                          ? isClubPro
                            ? 'bg-[#00ff41]/20 border border-[#00ff41] text-[#00ff41]'
                            : 'bg-[#00ff41] hover:bg-[#00ff41]/90 text-black hover:scale-[1.02] shadow-lg shadow-[#00ff41]/20'
                          : 'bg-white/5 text-white/40 cursor-default'
                      }`}
                    >
                      {plan.popular ? (
                        isClubPro ? (
                          'CLUB ELITE ACTIVO ✓'
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" /> Pagar & Activar Club Elite
                          </>
                        )
                      ) : (
                        'Plan Inicial Activo'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sponsors' && (
            <div className="space-y-4 animate-fadeIn bg-[#0a0a0c] p-6 rounded-3xl border border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-wide">
                <Award className="w-5 h-5 text-[#00ff41]" /> Alianzas Comerciales & Publicidad para Marcas y Academias
              </h3>
              <p className="text-xs text-white/70 leading-relaxed font-normal">
                TalentMatch ofrece espacios publicitarios segmentados por deporte, región geográfica y categoría para marcas de indumentaria deportiva, bebidas de alto rendimiento, gimnasios y academias de formación.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 font-mono">
                <div className="bg-[#161618] p-4 rounded-2xl border border-white/5 space-y-2">
                  <span className="font-extrabold text-[#00ff41] uppercase block">Banner en Pruebas</span>
                  <p className="text-white/50 font-sans text-xs">Presencia destacada en el calendario de convocatorias abiertas.</p>
                  <button
                    onClick={() => onOpenCheckout({ id: 'sponsor-1', name: 'Sponsor Banner Pruebas', target: 'club', priceMonthly: '$35,000 ARS', priceYearly: '$350,000 ARS', features: [] })}
                    className="w-full py-2 bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 font-bold rounded-xl text-[11px] uppercase"
                  >
                    Contratar ($35,000/mes)
                  </button>
                </div>

                <div className="bg-[#161618] p-4 rounded-2xl border border-white/5 space-y-2">
                  <span className="font-extrabold text-[#00ff41] uppercase block">Sponsor de Reportes IA</span>
                  <p className="text-white/50 font-sans text-xs">Inclusión de logo en fichas de scouting exportables.</p>
                  <button
                    onClick={() => onOpenCheckout({ id: 'sponsor-2', name: 'Sponsor Reportes IA', target: 'club', priceMonthly: '$50,000 ARS', priceYearly: '$500,000 ARS', features: [] })}
                    className="w-full py-2 bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 font-bold rounded-xl text-[11px] uppercase"
                  >
                    Contratar ($50,000/mes)
                  </button>
                </div>

                <div className="bg-[#161618] p-4 rounded-2xl border border-white/5 space-y-2">
                  <span className="font-extrabold text-[#00ff41] uppercase block">Atleta del Mes</span>
                  <p className="text-white/50 font-sans text-xs">Patrocinio directo de becas y equipamiento para talentos.</p>
                  <button
                    onClick={() => onOpenCheckout({ id: 'sponsor-3', name: 'Beca Atleta del Mes', target: 'club', priceMonthly: '$25,000 ARS', priceYearly: '$250,000 ARS', features: [] })}
                    className="w-full py-2 bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 font-bold rounded-xl text-[11px] uppercase"
                  >
                    Contratar ($25,000/mes)
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-fadeIn bg-[#0a0a0c] p-6 rounded-3xl border border-white/10">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <ShieldCheck className="w-8 h-8 text-[#00ff41]" />
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic">
                    Protocolos de Ciberseguridad & Protección Financiera
                  </h3>
                  <p className="text-xs text-white/60">
                    Estándares bancarios de procesamiento transaccional e integridad de datos
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-[#161618] p-4 rounded-2xl border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#00ff41] font-bold uppercase">
                    <Lock className="w-4 h-4" /> Cifrado End-to-End SSL 256-Bit
                  </div>
                  <p className="text-white/60 font-sans">
                    Todas las comunicaciones entre el navegador y nuestros servidores viajan por canales cifrados con certificados TLS 1.3 de grado militar.
                  </p>
                </div>

                <div className="bg-[#161618] p-4 rounded-2xl border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#00ff41] font-bold uppercase">
                    <ShieldCheck className="w-4 h-4" /> Certificación PCI-DSS Level 1
                  </div>
                  <p className="text-white/60 font-sans">
                    Las tarjetas no son guardadas en texto plano. Se utilizan tokens aleatorios (`pci_tok_...`) procesados directamente por la pasarela bancaria.
                  </p>
                </div>

                <div className="bg-[#161618] p-4 rounded-2xl border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#00ff41] font-bold uppercase">
                    <Zap className="w-4 h-4" /> Verificación 3D Secure 2.0 (3DS)
                  </div>
                  <p className="text-white/60 font-sans">
                    Protección contra fraudes con doble factor de autenticación OTP vía SMS o Token bancario directo.
                  </p>
                </div>

                <div className="bg-[#161618] p-4 rounded-2xl border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#00ff41] font-bold uppercase">
                    <FileText className="w-4 h-4" /> Facturación Electrónica Validada AFIP
                  </div>
                  <p className="text-white/60 font-sans">
                    Generación automática de comprobantes con Código QR y CAI fiscal para clubes, empresas y particulares.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

