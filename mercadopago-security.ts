import crypto from 'crypto';
import * as admin from 'firebase-admin';
import express from 'express';

const firebaseAuth = () => (admin as any).auth();

async function requireFirebaseUser(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido.' });
  }

  try {
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) return res.status(401).json({ error: 'Token de autenticación requerido.' });
    req.user = await firebaseAuth().verifyIdToken(token);
    res.setHeader('Cache-Control', 'no-store');
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

async function verifyMercadoPagoWebhook(req: any, res: any, next: any) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const signature = String(req.headers['x-signature'] || '');
  const requestId = String(req.headers['x-request-id'] || '');
  const dataId = String(req.query?.['data.id'] || req.body?.data?.id || '');

  if (!secret) {
    console.error('MERCADOPAGO_WEBHOOK_SECRET is not configured; refusing unsigned webhook.');
    return res.status(503).json({ error: 'Webhook de Mercado Pago no configurado.' });
  }

  const signatureParts = Object.fromEntries(
    signature.split(',').map((part: string) => {
      const [key, ...value] = part.trim().split('=');
      return [key, value.join('=')];
    }).filter(([key, value]) => key && value)
  );

  const timestamp = Number(signatureParts.ts);
  const version = String(signatureParts.v1 || '');
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (!Number.isFinite(timestamp) || Math.abs(nowSeconds - timestamp) > 300) {
    return res.status(401).json({ error: 'Firma de webhook expirada o inválida.' });
  }

  if (!version || !dataId) {
    return res.status(401).json({ error: 'Firma de webhook incompleta.' });
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  if (!constantTimeHexEqual(expected, version)) {
    return res.status(401).json({ error: 'Firma de webhook inválida.' });
  }

  req.mercadoPagoWebhookVerified = true;
  return next();
}

async function recordWebhookIdempotency(req: any, res: any, next: any) {
  const eventId = String(req.body?.id || `${req.body?.type || 'unknown'}:${req.body?.action || 'unknown'}:${req.body?.data?.id || 'unknown'}`);
  const ref = admin.firestore().collection('mercadopagoWebhookEvents').doc(crypto.createHash('sha256').update(eventId).digest('hex'));

  try {
    const result = await admin.firestore().runTransaction(async (transaction: any) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.exists) return false;
      transaction.create(ref, {
        eventId,
        type: req.body?.type || null,
        action: req.body?.action || null,
        dataId: req.body?.data?.id || null,
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    });

    if (!result) {
      return res.status(200).json({ status: 'already_processed' });
    }

    return next();
  } catch (error) {
    console.error('Mercado Pago webhook idempotency failure:', error);
    return res.status(503).json({ error: 'No se pudo registrar el evento de pago.' });
  }
}

async function requireMercadoPagoCredential(req: any, res: any, next: any) {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return res.status(503).json({ error: 'Mercado Pago no está configurado en el servidor.' });
  }
  return next();
}

function enforceServerPrice(req: any, res: any, next: any) {
  const allowedPrices = new Set([14900, 49900, 129000]);
  const price = Number(String(req.body?.priceMonthly ?? '').replace(/[^0-9.]/g, ''));
  const coupon = String(req.body?.couponCode || '').trim().toUpperCase();

  if (!Number.isFinite(price) || !allowedPrices.has(price)) {
    return res.status(400).json({ error: 'Plan o precio no autorizado por el servidor.' });
  }

  if (req.body?.userId && req.body.userId !== req.user?.uid) {
    return res.status(403).json({ error: 'El usuario del pago no coincide con la sesión autenticada.' });
  }

  req.body.userId = req.user.uid;
  req.body.userEmail = req.user.email || undefined;
  req.body.priceMonthly = price;

  if (coupon && !['TALENT100', 'PROMO100', 'PRUEBA100', 'PROMO50', 'ARGENTINA50', 'PRO2025', 'CLUB30', 'TALENT20'].includes(coupon)) {
    return res.status(400).json({ error: 'Cupón no autorizado.' });
  }

  return next();
}

async function verifyPaymentAgainstMercadoPago(req: any, res: any, next: any) {
  const paymentId = String(req.body?.paymentId || '').trim();
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken || !paymentId) {
    return res.status(400).json({ error: 'No es posible verificar el pago sin credenciales y paymentId.' });
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Mercado Pago no pudo validar el pago.' });
    }

    const payment = await response.json();
    const externalReference = String(payment.external_reference || '');
    let reference: any = {};
    try {
      reference = JSON.parse(externalReference);
    } catch {
      reference = {};
    }

    if (payment.status !== 'approved' || reference.userId !== req.user?.uid) {
      return res.status(403).json({ error: 'El pago no está aprobado o no pertenece al usuario autenticado.' });
    }

    req.body.paymentId = String(payment.id);
    req.body.amount = payment.transaction_amount;
    req.body.planName = reference.planName || req.body.planName;
    req.body.userId = req.user.uid;
    return next();
  } catch (error) {
    console.error('Mercado Pago payment verification failed:', error);
    return res.status(502).json({ error: 'Error verificando el pago con Mercado Pago.' });
  }
}

async function rejectUnimplementedCancellation(_req: any, res: any, _next: any) {
  return res.status(501).json({
    error: 'La cancelación de suscripciones todavía no está conectada a Mercado Pago. No se informa una cancelación hasta que exista confirmación real del proveedor.',
  });
}

function protectMercadoPagoRoute(original: any) {
  return function protectedRoute(this: any, path: any, ...handlers: any[]) {
    if (typeof path === 'string') {
      if (path === '/api/mercadopago/webhook') {
        return original.call(this, path, verifyMercadoPagoWebhook, recordWebhookIdempotency, ...handlers);
      }

      if (path === '/api/mercadopago/validate-coupon') {
        return original.call(this, path, requireFirebaseUser, ...handlers);
      }

      if (path === '/api/mercadopago/create-preference') {
        return original.call(this, path, requireFirebaseUser, requireMercadoPagoCredential, enforceServerPrice, ...handlers);
      }

      if (path === '/api/mercadopago/verify-payment') {
        return original.call(this, path, requireFirebaseUser, requireMercadoPagoCredential, verifyPaymentAgainstMercadoPago, ...handlers);
      }

      if (path === '/api/mercadopago/cancel-subscription') {
        return original.call(this, path, requireFirebaseUser, rejectUnimplementedCancellation, ...handlers);
      }
    }

    return original.call(this, path, ...handlers);
  };
}

const originalPost = express.application.post;
express.application.post = protectMercadoPagoRoute(originalPost) as any;

export {};
