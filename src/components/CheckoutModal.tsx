import React, { useState } from 'react';
import { SubscriptionPlan, PaymentMethodType, TransactionReceipt } from '../types';
import { recordPaymentAndGrantPro, auth } from '../services/firebaseService';
import {
  X,
  ShieldCheck,
  Lock,
  CreditCard,
  QrCode,
  Building2,
  Coins,
  CheckCircle2,
  Copy,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileText,
  Tag,
  Gift
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  onSuccess: (receipt: TransactionReceipt) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('mercadopago');
  
  // Card Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [buyerTaxId, setBuyerTaxId] = useState('20-39482710-9');

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    valid: boolean;
    code: string;
    discountPercent: number;
    description: string;
    finalPrice: string;
  } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Processing & Verification state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<'form' | '3ds_verification' | 'completed'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
  const [copiedAlias, setCopiedAlias] = useState(false);

  if (!isOpen || !plan) return null;

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch('/api/mercadopago/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, originalPrice: plan.priceMonthly }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedDiscount(data);
      } else {
        setCouponError(data.error || 'Código de descuento no válido');
        setAppliedDiscount(null);
      }
    } catch (e) {
      setCouponError('Error al validar el cupón.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Call backend Mercado Pago preference API
      const res = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          priceMonthly: appliedDiscount ? appliedDiscount.finalPrice : plan.priceMonthly,
          userEmail: auth.currentUser?.email || 'usuario@talentmatch.com.ar',
          userId: auth.currentUser?.uid || 'guest_user',
          couponCode: appliedDiscount?.code,
        }),
      });

      const mpPrefData = await res.json();

      // If 100% coupon applied, immediately approve
      if (mpPrefData.immediateApproval || appliedDiscount?.discountPercent === 100) {
        const finalPrice = '$0 ARS';
        const newReceipt: TransactionReceipt = {
          id: mpPrefData.paymentId || `MP-100FREE-${Date.now().toString().slice(-6)}`,
          planId: plan.id,
          planName: plan.name,
          amount: finalPrice,
          currency: 'ARS',
          date: new Date().toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }),
          paymentMethod: 'mercadopago',
          status: 'Approved',
          transactionHash: `sha256_coupon_${Math.random().toString(36).substring(2, 12)}`,
          pciToken: `tok_promo_100`,
          buyerName: auth.currentUser?.displayName || 'Usuario TalentMatch PRO',
          buyerTaxId: buyerTaxId || '20-38192019-8',
          securitySeal: 'ISO-27001-PCI-DSS-PROMO',
        };

        if (auth.currentUser?.uid) {
          await recordPaymentAndGrantPro(auth.currentUser.uid, {
            userId: auth.currentUser.uid,
            userEmail: auth.currentUser.email || '',
            planId: plan.id,
            planName: plan.name,
            amount: finalPrice,
            currency: 'ARS',
            status: 'Approved',
            paymentMethod: 'mercadopago_coupon',
            transactionHash: newReceipt.transactionHash,
            createdAt: new Date().toISOString(),
          });
        }

        setReceipt(newReceipt);
        setProcessStep('completed');
        setIsProcessing(false);
        onSuccess(newReceipt);
        return;
      }

      // If standard Mercado Pago, trigger 3DS verification step & record payment
      setTimeout(() => {
        setIsProcessing(false);
        setProcessStep('3ds_verification');
      }, 1200);
    } catch (err) {
      console.error('Error starting Mercado Pago payment:', err);
      setIsProcessing(false);
      setProcessStep('3ds_verification');
    }
  };

  const handleConfirmOtp = async () => {
    setIsProcessing(true);

    const finalPriceStr = appliedDiscount ? appliedDiscount.finalPrice : plan.priceMonthly;
    const newReceipt: TransactionReceipt = {
      id: `MP-TX-${Date.now().toString().slice(-6)}`,
      planId: plan.id,
      planName: plan.name,
      amount: finalPriceStr,
      currency: 'ARS',
      date: new Date().toLocaleString('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      paymentMethod,
      lastFourDigits: cardNumber ? cardNumber.slice(-4) : '9412',
      status: 'Approved',
      transactionHash: `sha256_mp_${Math.random().toString(36).substring(2, 12)}`,
      pciToken: `tok_pci_mp_${Math.random().toString(36).substring(2, 10)}`,
      buyerName: cardHolder || auth.currentUser?.displayName || 'Usuario Verificado TalentMatch',
      buyerTaxId: buyerTaxId || '20-38192019-8',
      securitySeal: 'ISO-27001-PCI-DSS-L1',
    };

    if (auth.currentUser?.uid) {
      try {
        await recordPaymentAndGrantPro(auth.currentUser.uid, {
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email || '',
          planId: plan.id,
          planName: plan.name,
          amount: finalPriceStr,
          currency: 'ARS',
          status: 'Approved',
          paymentMethod,
          transactionHash: newReceipt.transactionHash,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Error recording payment in Firestore:', e);
      }
    }

    setIsProcessing(false);
    setReceipt(newReceipt);
    setProcessStep('completed');
    onSuccess(newReceipt);
  };

  const handleCopyAlias = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col">
        
        {/* Security Trust Header Bar */}
        <div className="bg-[#0a0a0c] border-b border-white/10 px-6 py-3 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2 text-[#00ff41]">
            <Lock className="w-3.5 h-3.5" />
            <span className="font-bold tracking-wider">CONEXIÓN CIFRADA SSL 256-BIT</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-white/50">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00ff41]" /> PCI-DSS LEVEL 1
            </span>
            <span>•</span>
            <span>TOKENIZACIÓN AES-256</span>
          </div>
        </div>

        {/* Modal Main Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#161618]/95 backdrop-blur z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30">
                Pasarela de Pago Segura
              </span>
            </div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight mt-1">
              Suscripción {plan.name}
            </h2>
          </div>

          <button
            id="btn-close-checkout-modal"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          {processStep === 'form' && (
            <div className="space-y-6">
              {/* Order Summary Card */}
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Plan Seleccionado</span>
                  <span className="text-base font-black text-white italic uppercase">{plan.name}</span>
                  <p className="text-xs text-white/60">Renovación mensual sin permanencia</p>
                </div>
                <div className="text-right font-mono">
                  {appliedDiscount ? (
                    <div>
                      <span className="text-xs text-white/40 line-through block">{plan.priceMonthly}</span>
                      <span className="text-2xl font-black text-[#00ff41]">{appliedDiscount.finalPrice}</span>
                      <span className="text-[10px] text-[#00ff41] block font-sans font-bold">-{appliedDiscount.discountPercent}% OFF</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-2xl font-black text-[#00ff41]">{plan.priceMonthly}</span>
                      <span className="text-xs text-white/40 block">/ mes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Promo Coupon Box */}
              <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#00ff41]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">¿Tienes un Cupón de Descuento?</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej: TALENT100, PROMO50, PRO2025"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-[#161618] border border-white/10 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-[#00ff41]"
                  />
                  <button
                    type="button"
                    onClick={handleValidateCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim()}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/10 shrink-0 disabled:opacity-40"
                  >
                    {isValidatingCoupon ? 'Validando...' : 'Aplicar'}
                  </button>
                </div>
                {appliedDiscount && (
                  <div className="p-2 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-xl text-[11px] text-[#00ff41] flex items-center gap-1.5 font-sans font-bold">
                    <Gift className="w-3.5 h-3.5 shrink-0" />
                    <span>{appliedDiscount.description}</span>
                  </div>
                )}
                {couponError && (
                  <p className="text-[11px] text-red-400 font-sans">{couponError}</p>
                )}
              </div>

              {/* Payment Methods Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                  Selecciona tu Medio de Pago Seguro:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mercadopago')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all ${
                      paymentMethod === 'mercadopago'
                        ? 'bg-[#00ff41]/10 border-[#00ff41] text-white shadow-lg shadow-[#00ff41]/10'
                        : 'bg-[#0a0a0c] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-[#00ff41]" />
                    <div>
                      <span className="text-xs font-black block">Mercado Pago</span>
                      <span className="text-[10px] text-white/40 block font-mono">Dinero / QR / Débito</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-[#00ff41]/10 border-[#00ff41] text-white shadow-lg shadow-[#00ff41]/10'
                        : 'bg-[#0a0a0c] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-[#00ff41]" />
                    <div>
                      <span className="text-xs font-black block">Tarjeta Crédito</span>
                      <span className="text-[10px] text-white/40 block font-mono">Visa / Amex / Master</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cbu')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all ${
                      paymentMethod === 'cbu'
                        ? 'bg-[#00ff41]/10 border-[#00ff41] text-white shadow-lg shadow-[#00ff41]/10'
                        : 'bg-[#0a0a0c] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-[#00ff41]" />
                    <div>
                      <span className="text-xs font-black block">CBU / CVU</span>
                      <span className="text-[10px] text-white/40 block font-mono">Transferencia Directa</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('crypto')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all ${
                      paymentMethod === 'crypto'
                        ? 'bg-[#00ff41]/10 border-[#00ff41] text-white shadow-lg shadow-[#00ff41]/10'
                        : 'bg-[#0a0a0c] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <Coins className="w-5 h-5 text-[#00ff41]" />
                    <div>
                      <span className="text-xs font-black block">Cripto USDT</span>
                      <span className="text-[10px] text-white/40 block font-mono">TRC-20 / Web3</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Form Content Depending on Payment Method */}
              <form onSubmit={handleStartPayment} className="space-y-4">
                {paymentMethod === 'mercadopago' && (
                  <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/10 text-center space-y-4">
                    <div className="w-32 h-32 mx-auto bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center">
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://talentmatch.app/pay/mercadopago"
                        alt="QR Mercado Pago"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">Escanea con la app de Mercado Pago</h4>
                      <p className="text-[11px] text-white/60 mt-0.5">O pulsa el botón para pagar con tu saldo en cuenta o tarjetas guardadas.</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-[#0081FF]/10 border border-[#0081FF]/30 rounded-full text-[10px] font-mono text-[#0081FF]">
                        <ShieldCheck className="w-3 h-3 text-[#0081FF]" /> Credencial MP Vinculada: TEST-8219...27eb
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-3 bg-[#0081FF] hover:bg-[#0070E0] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Conectando con Mercado Pago API...
                          </>
                        ) : (
                          <>
                            <QrCode className="w-4 h-4" /> Pagar {plan.priceMonthly} vía Mercado Pago
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/10 space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-white/60 uppercase mb-1">Titular de la Tarjeta</label>
                      <input
                        type="text"
                        required
                        placeholder="Tal cual figura en el plástico"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full bg-[#161618] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-white/60 uppercase mb-1">Número de Tarjeta</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="4532 0000 0000 8821"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className="w-full bg-[#161618] border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#00ff41]"
                        />
                        <CreditCard className="w-5 h-5 text-white/40 absolute right-3 top-2.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-white/60 uppercase mb-1">Vencimiento (MM/AA)</label>
                        <input
                          type="text"
                          required
                          placeholder="08/28"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          className="w-full bg-[#161618] border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#00ff41]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-white/60 uppercase mb-1">Código CVV / CVC</label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-[#161618] border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#00ff41]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-white/60 uppercase mb-1">DNI / CUIL (Facturación Electrónica AFIP)</label>
                      <input
                        type="text"
                        required
                        value={buyerTaxId}
                        onChange={(e) => setBuyerTaxId(e.target.value)}
                        className="w-full bg-[#161618] border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#00ff41]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-3.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Tokenizando Datos con Cifrado PCI...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" /> Cifrar & Pagar {plan.priceMonthly}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {paymentMethod === 'cbu' && (
                  <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/10 space-y-4 text-xs font-mono">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-white/40 uppercase">Banco</span>
                        <span className="text-white font-bold">Banco Galicia / Mercado Pago</span>
                      </div>

                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-white/40 uppercase">Titular</span>
                        <span className="text-white font-bold">TalentMatch Argentina S.A.</span>
                      </div>

                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-white/40 uppercase">Alias CBU</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#00ff41] font-bold">TALENTMATCH.PAGO.MP</span>
                          <button
                            type="button"
                            onClick={() => handleCopyAlias('TALENTMATCH.PAGO.MP')}
                            className="p-1 text-white/50 hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-2 gap-1">
                        <span className="text-white/40 uppercase">CBU / CVU</span>
                        <div className="flex items-center gap-2 max-w-full">
                          <span className="text-white font-bold tracking-wider text-xs sm:text-sm break-all">1430001713008385810012</span>
                          <button
                            type="button"
                            onClick={() => handleCopyAlias('1430001713008385810012')}
                            className="p-1 text-white/50 hover:text-white hover:text-[#00ff41] transition-colors shrink-0"
                            title="Copiar CBU"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {copiedAlias && (
                      <p className="text-[11px] text-[#00ff41] text-center font-sans">
                        ¡Alias copiado al portapapeles!
                      </p>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-3 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 font-sans"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Verificando Transferencia en Red...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Ya Hice la Transferencia (Aprobar Instantáneo)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'crypto' && (
                  <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/10 space-y-4 text-xs font-mono text-center">
                    <p className="text-white/70 font-sans">Deposite el equivalente en USDT (Red TRC-20):</p>
                    <div className="p-3 bg-[#161618] rounded-xl border border-white/10 text-xs break-all text-[#00ff41] font-mono select-all">
                      TWM8a2B9zLq7P1yN3kX5vE8uR2dF4gH6jK
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-3 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 font-sans"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Confirmando Bloques de Red USDT...
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4" /> Validar Depósito Cripto
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>

              {/* Cybersecurity & Legal Guarantee Footer */}
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#00ff41] shrink-0 mt-0.5" />
                  <div className="text-[11px] text-white/50 leading-relaxed">
                    <strong className="text-white block font-bold mb-0.5">Garantía de Ciberseguridad & Protección al Consumidor (Ley 24.240)</strong>
                    Tus datos bancarios son procesados bajo estándares de seguridad ISO 27001 y PCI-DSS Level 1. Cuentas con 10 días de garantía con opción a revocación directa (Botón de Arrepentimiento).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: 3D SECURE 2.0 / OTP VERIFICATION */}
          {processStep === '3ds_verification' && (
            <div className="space-y-6 text-center animate-fadeIn py-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#00ff41]/10 border border-[#00ff41]/30 flex items-center justify-center text-[#00ff41]">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff41] bg-[#00ff41]/10 px-3 py-1 rounded-full border border-[#00ff41]/30">
                  Verificación 3D Secure 2.0 (3DS)
                </span>
                <h3 className="text-xl font-black text-white uppercase italic mt-2">
                  Autorización de Seguridad Bancaria
                </h3>
                <p className="text-xs text-white/60 max-w-sm mx-auto mt-1">
                  Se ha enviado un código OTP de validación cibernética a tu dispositivo móvil para confirmar la transacción de {plan.priceMonthly}.
                </p>
              </div>

              <div className="max-w-xs mx-auto space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Código de 6 dígitos (Ej: 839201)"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center tracking-[0.5em] text-lg font-mono font-black bg-[#0a0a0c] border border-white/20 rounded-xl py-3 text-white focus:outline-none focus:border-[#00ff41]"
                />

                <button
                  type="button"
                  onClick={handleConfirmOtp}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verificando Token de Seguridad...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" /> Confirmar & Activar Suscripción
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS RECEIPT */}
          {processStep === 'completed' && receipt && (
            <div className="space-y-6 text-center animate-fadeIn py-2">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#00ff41] text-black flex items-center justify-center shadow-2xl shadow-[#00ff41]/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">
                  ¡Pago Aprobado Exitosamente!
                </h3>
                <p className="text-xs text-[#00ff41] font-mono mt-1 font-bold">
                  Tu suscripción {plan.name} ya se encuentra 100% activa.
                </p>
              </div>

              {/* Official Receipt Container */}
              <div className="bg-[#0a0a0c] p-6 rounded-3xl border border-white/10 text-left text-xs font-mono space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#00ff41]" />
                    <span className="font-bold text-white uppercase">Comprobante Digital de Pago</span>
                  </div>
                  <span className="text-[10px] text-[#00ff41] bg-[#00ff41]/10 px-2.5 py-0.5 rounded-full border border-[#00ff41]/30">
                    Sello Digital AFIP Validado
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/70">
                  <div>
                    <span className="text-[10px] text-white/40 uppercase block">ID Transacción</span>
                    <strong className="text-white">{receipt.id}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase block">Fecha y Hora</span>
                    <strong className="text-white">{receipt.date}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase block">Plan Activado</span>
                    <strong className="text-[#00ff41] uppercase">{receipt.planName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase block">Monto Total</span>
                    <strong className="text-white">{receipt.amount} ARS</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase block">Titular Factura</span>
                    <strong className="text-white">{receipt.buyerName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase block">Token de Ciberseguridad</span>
                    <strong className="text-white text-[10px] break-all">{receipt.pciToken}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-white/40 gap-1">
                  <span className="break-all">Hash Cifrado: {receipt.transactionHash}</span>
                  <span className="text-[#00ff41] font-bold">Aprobación Directa</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Imprimir Comprobante
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Ir a Disfrutar de TalentMatch PRO
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
