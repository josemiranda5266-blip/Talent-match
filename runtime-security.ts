import * as admin from 'firebase-admin';

if (!(admin as any).apps?.length) {
  try {
    (admin as any).initializeApp();
  } catch (error) {
    console.error('Firebase Admin initialization notice:', error);
  }
}

export async function requireAuthenticated(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido.' });
  }

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
  if (!req.user) {
    return requireAuthenticated(req, res, () => requireAdmin(req, res, next));
  }

  const claims = req.user || {};
  if (claims.admin === true || claims.role === 'admin') return next();
  return res.status(403).json({ error: 'Se requieren permisos administrativos.' });
}

const FREE_AI_DAILY_LIMIT = 5;
const PREMIUM_AI_DAILY_LIMIT = 100;
const aiUsage = new Map<string, { day: string; count: number }>();

export function enforceAiBudget(req: any, res: any, next: any) {
  const uid = String(req.user?.uid || '');
  if (!uid) return res.status(401).json({ error: 'Usuario autenticado requerido.' });

  const claims = req.user || {};
  const isPremium = claims.isPremium === true || claims.premium === true || claims.plan === 'PRO' || claims.plan === 'PREMIUM';
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
    return res.status(429).json({
      error: `Has alcanzado tu límite diario de ${limit} consultas con Inteligencia Artificial.`,
      limit,
      resetAt: `${day}T23:59:59.999Z`,
    });
  }

  current.count += 1;
  res.setHeader('X-AI-Daily-Limit', String(limit));
  res.setHeader('X-AI-Daily-Remaining', String(Math.max(0, limit - current.count)));
  return next();
}
