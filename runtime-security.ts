import * as admin from 'firebase-admin';

if (!(admin as any).apps?.length) {
  try { (admin as any).initializeApp(); } catch (error) { console.error('Runtime security Firebase initialization notice:', error); }
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

async function reserveDailyAiQuota(uid: string, day: string, limit: number): Promise<number> {
  const db = (admin as any).firestore();
  const quotaRef = db.collection('aiUsageDaily').doc(`${uid}_${day}`);
  return db.runTransaction(async (transaction: any) => {
    const snapshot = await transaction.get(quotaRef);
    const currentCount = snapshot.exists ? Number(snapshot.data()?.count || 0) : 0;
    if (currentCount >= limit) return -1;
    const nextCount = currentCount + 1;
    transaction.set(quotaRef, { uid, day, count: nextCount, limit, updatedAt: (admin as any).firestore.FieldValue.serverTimestamp() }, { merge: true });
    return nextCount;
  });
}

export async function enforceAiBudget(req: any, res: any, next: any) {
  const uid = String(req.user?.uid || '');
  if (!uid) return res.status(401).json({ error: 'Usuario autenticado requerido.' });
  const isPremium = await resolvePremiumEntitlement(uid);
  const limit = isPremium ? PREMIUM_AI_DAILY_LIMIT : FREE_AI_DAILY_LIMIT;
  const day = new Date().toISOString().slice(0, 10);
  try {
    const count = await reserveDailyAiQuota(uid, day, limit);
    if (count < 0) return res.status(429).json({ error: `Has alcanzado tu límite diario de ${limit} consultas con Inteligencia Artificial.`, limit, resetAt: `${day}T23:59:59.999Z` });
    res.setHeader('X-AI-Daily-Limit', String(limit));
    res.setHeader('X-AI-Daily-Remaining', String(Math.max(0, limit - count)));
    return next();
  } catch (error) {
    console.error('AI quota transaction failed:', error);
    return res.status(503).json({ error: 'No se pudo verificar el límite diario de IA. Intente nuevamente.' });
  }
}

export function requirePaymentAuthentication(req: any, res: any, next: any) {
  return requireAuthenticated(req, res, () => {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) return res.status(503).json({ error: 'Mercado Pago no está configurado para operar en este entorno.' });
    if (!req.body || typeof req.body !== 'object') req.body = {};
    req.body.userId = req.user.uid;
    if (req.user.email) req.body.userEmail = req.user.email;
    return next();
  });
}

export function markFinancialDataAsModelled(_req: any, res: any, next: any) {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (body && typeof body === 'object' && !Array.isArray(body)) body = { ...body, financialDataSource: 'MODELLED', productionMetricsConnected: false, dataWarning: 'Estos datos financieros son de modelo/simulación y no representan métricas contables o de producción verificadas.' };
    return originalJson(body);
  };
  return next();
}

export function markAnalyticsDataAsModelled(_req: any, res: any, next: any) {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (body && typeof body === 'object' && !Array.isArray(body)) body = { ...body, analyticsDataSource: 'MODELLED', productionMetricsConnected: false, dataWarning: 'Estas métricas son de modelo/simulación y no representan telemetría de producción verificada.' };
    return originalJson(body);
  };
  return next();
}

export function sanitizeAiErrorResponse(_req: any, res: any, next: any) {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 400 && body && typeof body === 'object' && !Array.isArray(body)) {
      const { details, stack, rawError, ...safeBody } = body;
      return originalJson(safeBody);
    }
    return originalJson(body);
  };
  return next();
}
