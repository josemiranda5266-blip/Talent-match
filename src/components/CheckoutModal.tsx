import React, { useState } from 'react';
import { SubscriptionPlan, TransactionReceipt } from '../types';
import { auth } from '../services/firebaseService';
import { X, ShieldCheck, Lock, QrCode, Tag, Gift, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  onSuccess: (receipt: TransactionReceipt) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, plan }) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountPercent: number; description: string; finalPrice: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  if (!isOpen || !plan) return null;

  const validateCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    setPaymentError('');
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      if (!token) {
        setCouponError('Debes iniciar sesión para aplicar un cupón.');
        return;
      }
      const response = await fetch('/api/mercadopago/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, originalPrice: plan.priceMonthly }),
      });
      const data = await response.json();
      if (!response.ok || !data.valid || data.discountPercent === 100) {
        setAppliedDiscount(null);
        setCouponError(data.error || 'Ese cupón no está disponible para pagos reales.');
        return;
      }
      setAppliedDiscount({
        code: data.code,
        discountPercent: Number(data.discountPercent),
        description: String(data.description || 'Descuento aplicado'),
        finalPrice: String(data.finalPrice || ''),
      });
    } catch {
      setAppliedDiscount(null);
      setCouponError('No se pudo validar el cupón. Intenta nuevamente.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const startMercadoPagoCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);
    setPaymentError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Debes iniciar sesión antes de realizar un pago.');
      const token = await user.getIdToken();

      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          // Always send the canonical plan price. The server calculates the final
          // discounted amount and ignores client-supplied identity/email fields.
          priceMonthly: plan.priceMonthly,
          couponCode: appliedDiscount?.code,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.init_point || data.immediateApproval) {
        throw new Error(data.error || 'Mercado Pago no devolvió una preferencia real.');
      }

      // Checkout Pro owns the payment, card/3DS flow and approval. Never create
      // a local receipt or grant Premium from the browser.
      window.location.assign(String(data.init_point));
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'No se pudo iniciar el pago.');
      setIsProcessing(false);
    }
  };

  const displayedPrice = appliedDiscount ? appliedDiscount.finalPrice : plan.priceMonthly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-white/10 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
        <div className="bg-[#0a0a0c] border-b border-white/10 px-6 py-3 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2 text-[#00ff41]"><Lock className="w-3.5 h-3.5" /><span className="font-bold tracking-wider">PAGO PROTEGIDO</span></div>
          <ShieldCheck className="w-4 h-4 text-[#00ff41]" />
        </div>

        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30">Mercado Pago Checkout Pro</span>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight mt-2">Suscripción {plan.name}</h2>
          </div>
          <button id="btn-close-checkout-modal" onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/40 block">Plan seleccionado</span>
              <span className="text-base font-black text-white italic uppercase">{plan.name}</span>
              <p className="text-xs text-white/60 mt-1">El pago se procesa íntegramente en Mercado Pago.</p>
            </div>
            <div className="text-right font-mono">
              {appliedDiscount && <span className="text-xs text-white/40 line-through block">{plan.priceMonthly}</span>}
              <span className="text-2xl font-black text-[#00ff41]">{displayedPrice}</span>
              <span className="text-xs text-white/40 block">/ mes</span>
            </div>
          </div>

          <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-[#00ff41]" /><span className="text-xs font-bold text-white uppercase tracking-wider">Cupón</span></div>
            <div className="flex gap-2">
              <input type="text" placeholder="PROMO50, PRO2025..." value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="flex-1 bg-[#161618] border border-white/10 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-[#00ff41]" />
              <button type="button" onClick={validateCoupon} disabled={isValidatingCoupon || !couponCode.trim()} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase rounded-xl border border-white/10 disabled:opacity-40">{isValidatingCoupon ? 'Validando...' : 'Aplicar'}</button>
            </div>
            {appliedDiscount && <div className="p-2 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-xl text-[11px] text-[#00ff41] flex items-center gap-1.5 font-bold"><Gift className="w-3.5 h-3.5" />{appliedDiscount.description} (-{appliedDiscount.discountPercent}%)</div>}
            {couponError && <p className="text-[11px] text-red-400">{couponError}</p>}
          </div>

          <form onSubmit={startMercadoPagoCheckout} className="space-y-4">
            <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/10 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-[#0081FF]/10 border border-[#0081FF]/30 flex items-center justify-center"><QrCode className="w-10 h-10 text-[#0081FF]" /></div>
              <div><h4 className="text-sm font-black text-white uppercase">Continuar en Mercado Pago</h4><p className="text-[11px] text-white/60 mt-1">Serás redirigido al entorno oficial de Mercado Pago para elegir el medio de pago y completar la autenticación.</p></div>
              <button type="submit" disabled={isProcessing} className="w-full py-3.5 bg-[#0081FF] hover:bg-[#0070E0] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isProcessing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generando pago seguro...</> : <>Pagar {displayedPrice} <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </form>

          {paymentError && <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{paymentError}</div>}

          <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 text-[11px] text-white/50 leading-relaxed">
            <strong className="text-white block mb-1">Activación Premium</strong>
            La suscripción solo se activa después de que el servidor verifique un pago aprobado directamente con Mercado Pago. La aplicación no acepta comprobantes, OTP, tarjetas ni aprobaciones simuladas desde el navegador.
          </div>
        </div>
      </div>
    </div>
  );
};
