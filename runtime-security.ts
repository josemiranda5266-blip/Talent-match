import * as admin from 'firebase-admin';
import express from 'express';

if (!(admin as any).apps?.length) {
  try {
    (admin as any).initializeApp();
  } catch (error) {
    console.error('Firebase Admin initialization notice:', error);
  }
}

async function requireAuthenticated(req: any, res: any, next: any) {
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

async function requireAdmin(req: any, res: any, next: any) {
  await requireAuthenticated(req, res, async () => {
    const claims = req.user || {};
    if (claims.admin === true || claims.role === 'admin') return next();
    return res.status(403).json({ error: 'Se requieren permisos administrativos.' });
  });
}

const originalGet = express.application.get;
const originalPost = express.application.post;
const originalPut = express.application.put;
const originalPatch = express.application.patch;
const originalDelete = express.application.delete;

function protectFinancialRoute(original: any) {
  return function protectedRoute(this: any, path: any, ...handlers: any[]) {
    if (typeof path === 'string' && path.startsWith('/api/financial/')) {
      const adminOnly = new Set([
        '/api/financial/summary',
        '/api/financial/reserve-config',
        '/api/financial/executive-report',
      ]);
      const middleware = adminOnly.has(path) ? requireAdmin : requireAuthenticated;
      return original.call(this, path, middleware, ...handlers);
    }

    if (typeof path === 'string' && path.startsWith('/api/admin/')) {
      return original.call(this, path, requireAdmin, ...handlers);
    }

    return original.call(this, path, ...handlers);
  };
}

express.application.get = protectFinancialRoute(originalGet) as any;
express.application.post = protectFinancialRoute(originalPost) as any;
express.application.put = protectFinancialRoute(originalPut) as any;
express.application.patch = protectFinancialRoute(originalPatch) as any;
express.application.delete = protectFinancialRoute(originalDelete) as any;

export {};
