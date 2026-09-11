import * as admin from 'firebase-admin';
import express from 'express';

if (!(admin as any).apps?.length) {
  try {
    (admin as any).initializeApp();
  } catch (error) {
    console.error('Firebase Admin initialization notice:', error);
  }
}

export async function requireAuthenticated(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token de autenticación requerido.' });
  try {
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) return res.status(401).json({ error: 'Token de autenticación requerido.' });
    req.user = await (admin as any).auth().verifyIdToken(token);
    res.setHeader('Cache-Control', 'no-store');
    return next();
  } catch (error) {
    console.error('Runtime security token verification failed:', error);
    return res.status(401).json({ error: 'Token de autenticación inválido o expirado.' });
  }
}

export async function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) return requireAuthenticated(req, res, () => requireAdmin(req, res, next));
  const claims = req.user || {};
  if (claims.admin === true || claims.role === 'admin') return next();
  return res.status(403).json({ error: 'Se requieren permisos administrativos.' });
}

const aiUsage = new Map<string, { day: string; count: number }>();
const entitlementCache = new Map<string, { expiresAt: number; isPremium: boolean }>();
const FREE_AI_DAILY_LIMIT = 5;
const PREMIUM_AI_DAILY_LIMIT = 100;
const ENTITLEMENT_CACHE_TTL_MS = 5 * 60 * 1000;

async function resolvePremiumEntitlement(uid: string): Promise<boolean> {
  const cached = entitlementCache.get(uid);
  if (cached && cached.expiresAt > Date.now()) return cached.isPremium;
  try {
    const snapshot = await (admin as any).firestore().collection('users').doc(uid).get();
    const data = snapshot.exists ? snapshot.data() || {} : {};
    const plan = String(data.plan || '').toUpperCase();
    const isPremium = data.isPremium === true || data.premium === true || plan === 'PRO' || plan === 'PREMIUM';
    entitlementCache.set(uid, { expiresAt: Date.now() + ENTITLEMENT_CACHE_TTL_MS, isPremium });
    return isPremium;
  } catch (error) {
    console.error('AI entitlement lookup failed; using free-tier limit:', error);
    entitlementCache.set(uid, { expiresAt: Date.now() + 30_000, isPremium: false });
    return false;
  }
}

export async function enforceAiBudget(req: any, res: any, next: any) {
  const uid = String(req.user?.uid || '');
  if (!uid) return res.status(401).json({ error: 'Usuario autenticado requerido.' });
  const isPremium = await resolvePremiumEntitlement(uid);
  const limit = isPremium ? PREMIUM_AI_DAILY_LIMIT : FREE_AI_DAILY_LIMIT;
  const day = new Date().toISOString().slice(0, 10);
  const current = aiUsage.get(uid);
  if (!current || current.day !== day) {
    aiUsage.set(uid, { day, count: 1 });
    res.setHeader('X-AI-Daily-Limit', String(limit));
    res.setHeader('X-AI-Daily-Remaining', String(Math.max(0, limit - 1)));
    return next();
  }
  if (current.count >= limit) {
    return res.status(429).json({ error: `Has alcanzado tu límite diario de ${limit} consultas con Inteligencia Artificial.`, limit, resetAt: `${day}T23:59:59.999Z` });
  }
  current.count += 1;
  res.setHeader('X-AI-Daily-Limit', String(limit));
  res.setHeader('X-AI-Daily-Remaining', String(Math.max(0, limit - current.count)));
  return next();
}

function requirePaymentAuthentication(req: any, res: any, next: any) {
  return requireAuthenticated(req, res, () => {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) return res.status(503).json({ error: 'Mercado Pago no está configurado para operar en este entorno.' });
    if (!req.body || typeof req.body !== 'object') req.body = {};
    req.body.userId = req.user.uid;
    if (req.user.email) req.body.userEmail = req.user.email;
    return next();
  });
}

const originalGet = express.application.get;
const originalPost = express.application.post;
const originalPut = express.application.put;
const originalPatch = express.application.patch;
const originalDelete = express.application.delete;
const originalUse = express.application.use;

function protectSensitiveRoute(original: any) {
  return function protectedRoute(this: any, path: any, ...handlers: any[]) {
    if (typeof path === 'string' && path.startsWith('/api/financial/')) {
      const adminOnly = new Set(['/api/financial/summary', '/api/financial/reserve-config', '/api/financial/executive-report']);
      return original.call(this, path, adminOnly.has(path) ? requireAdmin : requireAuthenticated, ...handlers);
    }
    if (typeof path === 'string' && path.startsWith('/api/admin/')) return original.call(this, path, requireAdmin, ...handlers);
    if (typeof path === 'string' && path.startsWith('/api/mercadopago/')) {
      const protectedPaymentRoutes = new Set(['/api/mercadopago/create-preference', '/api/mercadopago/verify-payment', '/api/mercadopago/cancel-subscription']);
      if (protectedPaymentRoutes.has(path)) return original.call(this, path, requirePaymentAuthentication, ...handlers);
    }
    return original.call(this, path, ...handlers);
  };
}

function protectAiMiddleware(original: any) {
  return function protectedUse(this: any, path: any, ...handlers: any[]) {
    if (path === '/api/ai/' && handlers.length > 0) {
      if (handlers.length === 1) return original.call(this, path, handlers[0], enforceAiBudget);
      return original.call(this, path, handlers[0], enforceAiBudget, ...handlers.slice(1));
    }
    return original.call(this, path, ...handlers);
  };
}

express.application.get = protectSensitiveRoute(originalGet) as any;
express.application.post = protectSensitiveRoute(originalPost) as any;
express.application.put = protectSensitiveRoute(originalPut) as any;
express.application.patch = protectSensitiveRoute(originalPatch) as any;
express.application.delete = protectSensitiveRoute(originalDelete) as any;
express.application.use = protectAiMiddleware(originalUse) as any;
