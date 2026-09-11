import crypto from 'crypto';
import * as admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const firebaseAuth = () => (admin as any).auth();
const db = getFirestore();
const ALLOWED_PLAN_PRICES_ARS = new Set([14900, 49900, 129000]);
const COUPON_DISCOUNTS = new Map<string, number>([
  ['TALENT100', 100],
  ['PROMO100', 100],
  ['PROMO50', 50],
  ['ARGENTINA50', 50],
  ['PRO2025', 30],
  ['CLUB30', 30],
]);

function calculateCouponPrice(basePrice: number, couponCode?: string | null): { finalPrice: number; coupon: string | null; discountPercent: number } {
  const coupon = String(couponCode || '').trim().toUpperCase();
  if (!coupon) return { finalPrice: basePrice, coupon: null, discountPercent: 0 };
  const discountPercent = COUPON_DISCOUNTS.get(coupon);
  if (discountPercent === undefined) throw new Error('UNAUTHORIZED_COUPON');
  return { finalPrice: Math.max(0, Math.round(basePrice * (1 - discountPercent / 100))), coupon, discountPercent };
}

function resolveCanonicalBasePrice(finalPrice: number, couponCode?: string | null): number | null {
  const coupon = String(couponCode || '').trim().toUpperCase();
  if (!coupon) return ALLOWED_PLAN_PRICES_ARS.has(finalPrice) ? finalPrice : null;
  for (const basePrice of ALLOWED_PLAN_PRICES_ARS) {
    try {
      if (calculateCouponPrice(basePrice, coupon).finalPrice === finalPrice) return basePrice;
    } catch {
      return null;
    }
  }
  return null;
}

export async function requireFirebaseUser(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token de autenticación requerido.' });
  try {
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) return res.status(401).json({ error: 'Token de autenticación requerido.' });
    req.user = await firebaseAuth().verifyIdToken(token);
    res.setHeader('Cache-Control', 'no-store');
    const requestedCoupon = String(req.body?.code || req.body?.couponCode || '').trim().toUpperCase();
    if (requestedCoupon === 'PRUEBA100') return res.status(404).json({ valid: false, error: 'Cupón no válido o expirado.' });
    return next();
  } catch (error) {
    console.error('Mercado Pago auth verification failed:', error);
    return res.status(401).json({ error: 'Token de autenticación inválido o expirado.' });
  }
}

function constantTimeHexEqual(expectedHex: string, receivedHex: string): boolean {
  if (!/^[a-f0-9]+$/i.test(expectedHex) || !/^[a-f0-9]+$/i.test(receivedHex)) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const received = Buffer.from(receivedHex, 'hex');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export async function verifyMercadoPagoWebhook(req: any, res: any, next: any) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const signature = String(req.headers['x-signature'] || '');
  const requestId = String(req.headers['x-request-id'] || '');
  const dataId = String(req.query?.['data.id'] || req.body?.data?.id || '');
  if (!secret) {
    console.error('MERCADOPAGO_WEBHOOK_SECRET is not configured; refusing unsigned webhook.');
    return res.status(503).json({ error: 'Webhook de Mercado Pago no configurado.' });
  }
  const signatureParts = Object.fromEntries(signature.split(',').map((part: string) => {
    const [key, ...value] = part.trim().split('=');
    return [key, value.join('=')];
  }).filter(([key, value]) => key && value));
  const timestamp = Number(signatureParts.ts);
  const version = String(signatureParts.v1 || '');
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(timestamp) || Math.abs(nowSeconds - timestamp) > 300) return res.status(401).json({ error: 'Firma de webhook expirada o inválida.' });
  if (!version || !dataId) return res.status(401).json({ error: 'Firma de webhook incompleta.' });
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  if (!constantTimeHexEqual(expected, version)) return res.status(401).json({ error: 'Firma de webhook inválida.' });
  req.mercadoPagoWebhookVerified = true;
  return next();
}

export async function recordWebhookIdempotency(req: any, res: any, next: any) {
  const eventId = String(req.body?.id || `${req.body?.type || 'unknown'}:${req.body?.action || 'unknown'}:${req.body?.data?.id || 'unknown'}`);
  const ref = db.collection('mercadopagoWebhookEvents').doc(crypto.createHash('sha256').update(eventId).digest('hex'));
  try {
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.exists) return false;
      transaction.create(ref, { eventId, type: req.body?.type || null, action: req.body?.action || null, dataId: req.body?.data?.id || null, receivedAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (!result) return res.status(200).json({ status: 'already_processed' });
    return next();
  } catch (error) {
    console.error('Mercado Pago webhook idempotency failure:', error);
    return res.status(503).json({ error: 'No se pudo registrar el evento de pago.' });
  }
}

export async function requireMercadoPagoCredential(_req: any, res: any, next: any) {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) return res.status(503).json({ error: 'Mercado Pago no está configurado en el servidor.' });
  return next();
}

export function enforceServerPrice(req: any, res: any, next: any) {
  const price = Number(String(req.body?.priceMonthly ?? '').replace(/[^0-9.]/g, ''));
  const coupon = String(req.body?.couponCode || '').trim().toUpperCase();
  if (!Number.isFinite(price) || !ALLOWED_PLAN_PRICES_ARS.has(price)) return res.status(400).json({ error: 'Plan o precio no autorizado por el servidor.' });
  if (req.body?.userId && req.body.userId !== req.user?.uid) return res.status(403).json({ error: 'El usuario del pago no coincide con la sesión autenticada.' });
  req.body.userId = req.user.uid;
  req.body.userEmail = req.user.email || undefined;
  req.body.priceMonthly = price;
  if (coupon === 'PRUEBA100') return res.status(400).json({ error: 'Cupón no autorizado.' });
  if (coupon && !COUPON_DISCOUNTS.has(coupon)) return res.status(400).json({ error: 'Cupón no autorizado.' });
  return next();
}

export function rejectSimulatedPreferenceResponse(req: any, res: any, next: any) {
  const originalJson = res.json.bind(res);
  res.json = (payload: any) => {
    const preferenceId = String(payload?.preferenceId || '');
    const initPoint = String(payload?.init_point || '');
    const sandboxInitPoint = String(payload?.sandbox_init_point || '');
    const isSimulated = Boolean(payload?.immediateApproval)
      || preferenceId.startsWith('PREF-MP-')
      || preferenceId.startsWith('pref_free_')
      || initPoint.includes('/checkout/v1/redirect?pref_id=PREF-MP-')
      || sandboxInitPoint.includes('/checkout/v1/redirect?pref_id=PREF-MP-');
    if (isSimulated) {
      console.error('Mercado Pago returned a simulated/fallback preference; refusing to expose it as a real payment result.');
      return originalJson({ error: 'Mercado Pago no devolvió una preferencia real. Configure credenciales válidas y vuelva a intentar.' });
    }
    return originalJson(payload);
  };
  return next();
}

export async function verifyPaymentAgainstMercadoPago(req: any, res: any, next: any) {
  const paymentId = String(req.body?.paymentId || '').trim();
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken || !paymentId) return res.status(400).json({ error: 'No es posible verificar el pago sin credenciales y paymentId.' });
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) return res.status(502).json({ error: 'Mercado Pago no pudo validar el pago.' });
    const payment = await response.json();
    const externalReference = String(payment.external_reference || '');
    let reference: any = {};
    try { reference = JSON.parse(externalReference); } catch { reference = {}; }
    const transactionAmount = Number(payment.transaction_amount);
    const referencedPrice = Number(reference.price);
    const expectedRequestedAmount = Number(req.body?.amount);
    if (payment.status !== 'approved' || reference.userId !== req.user?.uid) return res.status(403).json({ error: 'El pago no está aprobado o no pertenece al usuario autenticado.' });
    const coupon = String(reference.coupon || '').trim().toUpperCase();
    const canonicalBasePrice = resolveCanonicalBasePrice(referencedPrice, coupon);
    if (canonicalBasePrice === null) return res.status(403).json({ error: 'El importe o cupón del pago no corresponde a un plan autorizado.' });
    if (coupon === 'TALENT100' || coupon === 'PROMO100') return res.status(403).json({ error: 'El cupón bonificado no puede confirmarse mediante un pago.' });
    const expectedFinalPrice = calculateCouponPrice(canonicalBasePrice, coupon).finalPrice;
    if (transactionAmount !== expectedFinalPrice || referencedPrice !== expectedFinalPrice) return res.status(403).json({ error: 'El importe confirmado por Mercado Pago no coincide con el importe autorizado.' });
    if (Number.isFinite(expectedRequestedAmount) && expectedRequestedAmount > 0 && transactionAmount !== expectedRequestedAmount) return res.status(403).json({ error: 'El importe confirmado por Mercado Pago no coincide con el importe esperado.' });
    if (reference.planId && req.body?.planId && String(reference.planId) !== String(req.body.planId)) return res.status(403).json({ error: 'El plan confirmado por Mercado Pago no coincide con la solicitud.' });
    req.body.paymentId = String(payment.id);
    req.body.amount = transactionAmount;
    req.body.planName = reference.planName || req.body.planName;
    req.body.userId = req.user.uid;
    return next();
  } catch (error) {
    console.error('Mercado Pago payment verification failed:', error);
    return res.status(502).json({ error: 'Error verificando el pago con Mercado Pago.' });
  }
}

export async function rejectUnimplementedCancellation(_req: any, res: any, _next: any) {
  return res.status(501).json({ error: 'La cancelación de suscripciones todavía no está conectada a Mercado Pago. No se informa una cancelación hasta que exista confirmación real del proveedor.' });
}
