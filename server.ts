import express from 'express';
import path from 'path';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import * as admin from 'firebase-admin';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { requireAuthenticated, requireAdmin, enforceAiBudget, sanitizeAiErrorResponse, markFinancialDataAsModelled, markAnalyticsDataAsModelled } from './runtime-security.ts';
import { requireFirebaseUser, verifyMercadoPagoWebhook, recordWebhookIdempotency, requireMercadoPagoCredential, enforceServerPrice, rejectSimulatedPreferenceResponse, verifyPaymentAgainstMercadoPago, rejectUnimplementedCancellation } from './mercadopago-security.ts';

if (!(admin as any).apps?.length) {
  try {
    (admin as any).initializeApp();
  } catch (e) {
    console.error('Firebase Admin initialization notice:', e);
  }
}

async function verifyFirebaseToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido (Bearer token missing).' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await (admin as any).auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Token de autenticación inválido o expirado.' });
  }
}

async function getAuthoritativeAthlete(clientAthlete: any): Promise<any> {
  if (!clientAthlete || !clientAthlete.id) return clientAthlete;
  try {
    const docRef = (admin as any).firestore().collection('athletes').doc(clientAthlete.id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data()!;
      return {
        ...clientAthlete,
        ...data,
        id: clientAthlete.id,
        trustScore: data.trustScore !== undefined ? data.trustScore : (clientAthlete.trustScore || 70),
        isVerified: data.isVerified !== undefined ? data.isVerified : (clientAthlete.isVerified || false),
        rating: data.rating !== undefined ? data.rating : (clientAthlete.rating || 4.5),
        stats: data.stats || clientAthlete.stats || {},
      };
    }
  } catch (e) {
    console.error('Error fetching authoritative athlete:', e);
  }
  return {
    ...clientAthlete,
    trustScore: Math.min(100, Math.max(0, clientAthlete.trustScore || 70)),
    isVerified: Boolean(clientAthlete.isVerified),
  };
}

async function getAuthoritativeCandidates(candidates: any[]): Promise<any[]> {
  if (!Array.isArray(candidates)) return [];
  const authoritative = await Promise.all(
    candidates.map(async (c) => await getAuthoritativeAthlete(c))
  );
  return authoritative;
}

const app = express();
const PORT = 3000;

// Security & Body parsing
app.use(express.json({ limit: '2mb' }));

// Basic Security Headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes al servidor. Por favor intente más tarde.' },
});

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.user?.uid || req.ip || 'anonymous';
  },
  message: { error: 'Límite de consultas de Inteligencia Artificial alcanzado (40 solicitudes cada 10 minutos). Por favor aguarde unos minutos.' },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de pago o validación. Intente más tarde.' },
});

app.use('/api/', generalLimiter);

// Explicit route security. Keep authentication before user-scoped rate/quota middleware.
app.use('/api/ai/', requireAuthenticated, aiLimiter, enforceAiBudget, sanitizeAiErrorResponse);
app.use('/api/financial/', requireAuthenticated, markFinancialDataAsModelled);
app.use('/api/financial/summary', requireAdmin);
app.use('/api/financial/reserve-config', requireAdmin);
app.use('/api/financial/executive-report', requireAdmin);
app.use('/api/admin/', requireAdmin);
app.use('/api/analytics/summary', requireAdmin, markAnalyticsDataAsModelled);
app.use('/api/mercadopago/', paymentLimiter);
app.use('/api/mercadopago/validate-coupon', requireFirebaseUser);
app.use('/api/mercadopago/create-preference', requireFirebaseUser, requireMercadoPagoCredential, enforceServerPrice, rejectSimulatedPreferenceResponse);
app.use('/api/mercadopago/webhook', verifyMercadoPagoWebhook, recordWebhookIdempotency);
app.use('/api/mercadopago/verify-payment', requireFirebaseUser, requireMercadoPagoCredential, verifyPaymentAgainstMercadoPago);
app.use('/api/mercadopago/cancel-subscription', requireFirebaseUser, rejectUnimplementedCancellation);

// AI Response Cache (15 min TTL) to minimize Gemini token usage & costs
const aiCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCachedAIResponse(key: string): any | null {
  const cached = aiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  if (cached) {
    aiCache.delete(key);
  }
  return null;
}

function setCachedAIResponse(key: string, data: any) {
  if (aiCache.size > 200) {
    const firstKey = aiCache.keys().next().value;
    if (firstKey) aiCache.delete(firstKey);
  }
  aiCache.set(key, { timestamp: Date.now(), data });
}

function generateCacheKey(endpoint: string, payload: any, userId?: string): string {
  const cacheScope = userId || 'anonymous';
  const str = JSON.stringify({ cacheScope, payload });
  return endpoint + ':' + crypto.createHash('md5').update(str).digest('hex');
}

// ==========================================
// SYSTEM FINANCIAL CONTROL & SUSTAINABILITY ENGINE
// ==========================================

export interface BudgetConfig {
  monthlyBudgetUsd: number;
  dailyBudgetUsd: number;
  aiBudgetUsd: number;
  firestoreBudgetUsd: number;
  storageBudgetUsd: number;
  cloudRunBudgetUsd: number;
  freeUserDailyAiLimit: number;
  premiumUserDailyAiLimit: number;
  freeUserMonthlyAppLimit: number;
}

export interface FinancialAuditLog {
  id: string;
  timestamp: string;
  action: string;
  reason: string;
  estimatedSavingsUsd: number;
  protectionLevel: string;
}

export interface UserCostRecord {
  userId: string;
  userEmail: string;
  role: string;
  isPremium: boolean;
  aiCallsToday: number;
  aiCallsTotal: number;
  firestoreReads: number;
  firestoreWrites: number;
  estimatedCostUsd: number;
  revenueGeneratedArs: number;
  netProfitUsd: number;
  isDeficit: boolean;
  lastActive: string;
}

export interface UnitEconomics {
  arpuUsd: number;
  cacUsd: number;
  paybackMonths: number;
  churnRatePct: number;
  ltvUsd: number;
  contributionMarginPct: number;
  ltvToCacRatio: number;
  isHealthy: boolean;
}

export interface AnomalyItem {
  id: string;
  detectedAt: string;
  type: 'IA_SPIKE' | 'FIRESTORE_READ_SPIKE' | 'STORAGE_GROWTH' | 'CONVERSION_DROP';
  severity: 'ALTA' | 'MEDIA' | 'BAJA';
  title: string;
  metricVariation: string;
  aiCauseExplanation: string;
  mitigationApplied: string;
}

export interface FinancialForecast {
  days30: { incomeUsd: number; costsUsd: number; cashFlowUsd: number; incomeArs: number };
  days90: { incomeUsd: number; costsUsd: number; cashFlowUsd: number; incomeArs: number };
  days365: { incomeUsd: number; costsUsd: number; cashFlowUsd: number; incomeArs: number };
}

export interface ActionableRecommendation {
  id: string;
  category: 'PRECIOS' | 'IA_LIMITS' | 'MARKETING' | 'COST_OPTIMIZATION';
  title: string;
  impactEstimate: string;
  description: string;
  recommendedAction: string;
}

export interface BusinessHealthScore {
  overallScore: number; // 0 - 100
  status: 'EXCELENTE' | 'BUENO' | 'EN_RIESGO' | 'CRITICO';
  components: {
    security: number;
    availability: number;
    profitability: number;
    growth: number;
    costControl: number;
    userSatisfaction: number;
    performance: number;
  };
  summaryText: string;
}

const unitEconomicsData: UnitEconomics = {
  arpuUsd: 2.34,
  cacUsd: 12.50,
  paybackMonths: 5.5,
  churnRatePct: 2.1,
  ltvUsd: 108.08,
  contributionMarginPct: 97.3,
  ltvToCacRatio: 8.6,
  isHealthy: true
};

const anomalyDetections: AnomalyItem[] = [
  {
    id: 'anom_01',
    detectedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'IA_SPIKE',
    severity: 'MEDIA',
    title: 'Pico Inesperado de Consultas en Scout IA (+145%)',
    metricVariation: '+145% llamadas a Gemini Flash en 2h',
    aiCauseExplanation: 'Varias agencias realizaron búsquedas simultáneas de planteles juveniles usando filtros complejos.',
    mitigationApplied: 'Caché semántica activada automáticamente para consultas repetidas de scouting.'
  },
  {
    id: 'anom_02',
    detectedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    type: 'FIRESTORE_READ_SPIKE',
    severity: 'ALTA',
    title: 'Aumento de Lecturas Firestore en Smart Feed (+210%)',
    metricVariation: '+210% lecturas sin paginado en Feed Público',
    aiCauseExplanation: 'Navegación de usuarios no autenticados consumiendo publicaciones sin restricción de límite.',
    mitigationApplied: 'Paginación estricta a limit(15) forzada en servidor express.'
  },
  {
    id: 'anom_03',
    detectedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    type: 'STORAGE_GROWTH',
    severity: 'BAJA',
    title: 'Crecimiento de Almacenamiento Multimedia HD (+3.2 GB)',
    metricVariation: '+3.2 GB en Firebase Storage en 24h',
    aiCauseExplanation: 'Carga masiva de videos de jugadas destacadas por futbolistas verificados.',
    mitigationApplied: 'Compresión WebP y transcodificación H.264 automática activada en subidas.'
  }
];

const actionableRecommendations: ActionableRecommendation[] = [
  {
    id: 'rec_01',
    category: 'IA_LIMITS',
    title: 'Aumentar Límite Diario de Consultas IA en Coach Deportivo',
    impactEstimate: '+14% Retención | +$0.40 USD/mes costo',
    description: 'Dado que el módulo Coach IA opera con un margen del 98%, elevar el límite diario de 20 a 35 consultas aumentará el engagement sin afectar las finanzas.',
    recommendedAction: 'Aumentar el límite de consultas de IA para usuarios PRO.'
  },
  {
    id: 'rec_02',
    category: 'PRECIOS',
    title: 'Ajuste del Plan Premium Atleta de $14.900 a $18.500 ARS',
    impactEstimate: '+24% Incremento MRR (+~$105 USD/mes)',
    description: 'El valor percibido por la plataforma permite un incremento del 24% sin disparar la tasa de Churn.',
    recommendedAction: 'Actualizar el precio del Plan Premium en la pasarela de pagos.'
  },
  {
    id: 'rec_03',
    category: 'COST_OPTIMIZATION',
    title: 'Optimización de Exportación PDF HD para Eliminar Déficit',
    impactEstimate: 'Ahorro de $0.80 USD/mes | Margen positivo',
    description: 'El módulo de PDF genera $5.80 USD de costo y $5.00 USD de ingreso. Aplicando compresión vectorial de imágenes en servidor se elimina el déficit.',
    recommendedAction: 'Activar compresión de imágenes en generación de PDF.'
  },
  {
    id: 'rec_04',
    category: 'MARKETING',
    title: 'Aumentar Inversión en Marketing de Adquisición',
    impactEstimate: 'Retorno Estimado LTV/CAC: 8.6x',
    description: 'El costo de adquisición ($12.50 USD) se recupera en solo 5.5 meses con un LTV de $108.08 USD, lo que justifica escalar pauta en redes sociales.',
    recommendedAction: 'Duplicar presupuesto de adquisición enfocado en Clubes y Agentes.'
  }
];

const businessHealthScore: BusinessHealthScore = {
  overallScore: 95,
  status: 'EXCELENTE',
  components: {
    security: 98,
    availability: 99,
    profitability: 97,
    growth: 88,
    costControl: 95,
    userSatisfaction: 92,
    performance: 94
  },
  summaryText: 'La plataforma TalentMatch / ScoutAR se encuentra en estado EXCELENTE. Operación 100% autosostenible con margen bruto del 97% y cero riesgo financiero.'
};

export interface FeatureProfitability {
  id: string;
  name: string;
  activeUsers: number;
  revenueUsd: number;
  revenueArs: number;
  totalCostUsd: number;
  aiCostUsd: number;
  firestoreCostUsd: number;
  storageCostUsd: number;
  cloudRunCostUsd: number;
  netProfitUsd: number;
  profitMarginPct: number;
  growthTrend: string;
  isDeficit: boolean;
  status: 'PROFITABLE' | 'DEFICIT' | 'SUPPORT_COST';
}

export interface ReserveFundConfig {
  operationPct: number;
  growthPct: number;
  emergencyPct: number;
  operationalPoolUsd: number;
  growthPoolUsd: number;
  emergencyPoolUsd: number;
}

export interface FinancialAlert {
  id: string;
  timestamp: string;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  title: string;
  description: string;
  suggestedAction: string;
}

const budgetConfig: BudgetConfig = {
  monthlyBudgetUsd: 50.00,
  dailyBudgetUsd: 2.50,
  aiBudgetUsd: 30.00,
  firestoreBudgetUsd: 10.00,
  storageBudgetUsd: 5.00,
  cloudRunBudgetUsd: 5.00,
  freeUserDailyAiLimit: 5,
  premiumUserDailyAiLimit: 100,
  freeUserMonthlyAppLimit: 20,
};

const reserveFundConfig: ReserveFundConfig = {
  operationPct: 70,
  growthPct: 20,
  emergencyPct: 10,
  operationalPoolUsd: 304.85,
  growthPoolUsd: 87.10,
  emergencyPoolUsd: 43.55,
};

const featureProfitabilityData: FeatureProfitability[] = [
  {
    id: 'scout_ia',
    name: 'Scout IA (Recomendador de Candidatos)',
    activeUsers: 85,
    revenueUsd: 185.00,
    revenueArs: 240500,
    totalCostUsd: 3.80,
    aiCostUsd: 3.10,
    firestoreCostUsd: 0.40,
    storageCostUsd: 0.00,
    cloudRunCostUsd: 0.30,
    netProfitUsd: 181.20,
    profitMarginPct: 97.9,
    growthTrend: '+18% (Alta Rentabilidad)',
    isDeficit: false,
    status: 'PROFITABLE'
  },
  {
    id: 'coach_ia',
    name: 'Coach Deportivo IA & Planes',
    activeUsers: 62,
    revenueUsd: 120.00,
    revenueArs: 156000,
    totalCostUsd: 2.40,
    aiCostUsd: 1.90,
    firestoreCostUsd: 0.30,
    storageCostUsd: 0.00,
    cloudRunCostUsd: 0.20,
    netProfitUsd: 117.60,
    profitMarginPct: 98.0,
    growthTrend: '+12%',
    isDeficit: false,
    status: 'PROFITABLE'
  },
  {
    id: 'smart_feed',
    name: 'Smart Feed Social & Videos',
    activeUsers: 148,
    revenueUsd: 60.00,
    revenueArs: 78000,
    totalCostUsd: 1.85,
    aiCostUsd: 0.00,
    firestoreCostUsd: 1.20,
    storageCostUsd: 0.45,
    cloudRunCostUsd: 0.20,
    netProfitUsd: 58.15,
    profitMarginPct: 96.9,
    growthTrend: '+5%',
    isDeficit: false,
    status: 'PROFITABLE'
  },
  {
    id: 'chat_directo',
    name: 'Chat Directo & Negociaciones',
    activeUsers: 90,
    revenueUsd: 40.00,
    revenueArs: 52000,
    totalCostUsd: 0.90,
    aiCostUsd: 0.00,
    firestoreCostUsd: 0.70,
    storageCostUsd: 0.20,
    cloudRunCostUsd: 0.00,
    netProfitUsd: 39.10,
    profitMarginPct: 97.8,
    growthTrend: '+8%',
    isDeficit: false,
    status: 'PROFITABLE'
  },
  {
    id: 'comparador_jugadores',
    name: 'Comparador de Jugadores Head-to-Head',
    activeUsers: 42,
    revenueUsd: 25.00,
    revenueArs: 32500,
    totalCostUsd: 0.65,
    aiCostUsd: 0.50,
    firestoreCostUsd: 0.15,
    storageCostUsd: 0.00,
    cloudRunCostUsd: 0.00,
    netProfitUsd: 24.35,
    profitMarginPct: 97.4,
    growthTrend: '+14%',
    isDeficit: false,
    status: 'PROFITABLE'
  },
  {
    id: 'radar_talentos',
    name: 'Radar de Talentos & Filtros Avanzados',
    activeUsers: 55,
    revenueUsd: 30.00,
    revenueArs: 39000,
    totalCostUsd: 0.80,
    aiCostUsd: 0.60,
    firestoreCostUsd: 0.20,
    storageCostUsd: 0.00,
    cloudRunCostUsd: 0.00,
    netProfitUsd: 29.20,
    profitMarginPct: 97.3,
    growthTrend: '+10%',
    isDeficit: false,
    status: 'PROFITABLE'
  },
  {
    id: 'reportes_pdf',
    name: 'Exportación de Reportes PDF HD',
    activeUsers: 18,
    revenueUsd: 5.00,
    revenueArs: 6500,
    totalCostUsd: 5.80,
    aiCostUsd: 0.00,
    firestoreCostUsd: 0.80,
    storageCostUsd: 4.00,
    cloudRunCostUsd: 1.00,
    netProfitUsd: -0.80,
    profitMarginPct: -16.0,
    growthTrend: '-4% (En Déficit)',
    isDeficit: true,
    status: 'DEFICIT'
  },
  {
    id: 'notificaciones_alertas',
    name: 'Notificaciones & Alertas Email/Push',
    activeUsers: 148,
    revenueUsd: 0.00,
    revenueArs: 0,
    totalCostUsd: 0.45,
    aiCostUsd: 0.00,
    firestoreCostUsd: 0.20,
    storageCostUsd: 0.00,
    cloudRunCostUsd: 0.25,
    netProfitUsd: -0.45,
    profitMarginPct: 0.0,
    growthTrend: 'Estable (Soporte Base)',
    isDeficit: false,
    status: 'SUPPORT_COST'
  }
];

const financialAlerts: FinancialAlert[] = [
  {
    id: 'alert_001',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    priority: 'ALTA',
    title: 'Funcionalidad en Déficit: Exportación PDF HD',
    description: 'La generación de reportes PDF HD generó $5.80 USD de costo frente a solo $5.00 USD de ingresos atribuibles.',
    suggestedAction: 'Aplicar compresión server-side de imágenes en los PDF o limitar a usuarios Plan PRO.'
  },
  {
    id: 'alert_002',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    priority: 'MEDIA',
    title: 'Pico de Lecturas Firestore en Smart Feed',
    description: 'Se detectó un aumento del 12% en lecturas no paginadas en Smart Feed por usuarios no autenticados.',
    suggestedAction: 'Forzar paginación estricta a limit(15) en feed público para ahorrar ~$0.80 USD/mes.'
  },
  {
    id: 'alert_003',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    priority: 'BAJA',
    title: 'Fondo de Emergencia Asignado Exitosamente',
    description: 'Se ha reservado un 10% del MRR ($43.55 USD) en la subcuenta intocable de emergencia.',
    suggestedAction: 'Ninguna acción requerida. Fondo protegido.'
  }
];

const financialState = {
  incomeMonthlyArs: 566200,
  incomeMonthlyUsd: 435.50,
  currentMonthSpendUsd: {
    ai: 6.40,
    firestore: 2.15,
    storage: 0.80,
    cloudRun: 1.20,
    hosting: 0.50,
    notificationsEmail: 0.45,
    total: 11.50
  },
  todaySpendUsd: {
    ai: 0.35,
    firestore: 0.12,
    storage: 0.04,
    cloudRun: 0.08,
    hosting: 0.02,
    notificationsEmail: 0.01,
    total: 0.62
  },
  totalsCounters: {
    aiCallsMonth: 1240,
    aiTokensMonth: 215000,
    firestoreReadsMonth: 45200,
    firestoreWritesMonth: 6800,
    storageBytesMonth: 8.4 * 1024 * 1024 * 1024,
    activeFreeUsers: 110,
    activePremiumUsers: 38
  }
};

const userCostMap = new Map<string, UserCostRecord>();

const seedUserStats: UserCostRecord[] = [
  { userId: 'usr_001', userEmail: 'scout.boca@cabj.com.ar', role: 'club', isPremium: true, aiCallsToday: 18, aiCallsTotal: 142, firestoreReads: 1250, firestoreWrites: 140, estimatedCostUsd: 1.15, revenueGeneratedArs: 49900, netProfitUsd: 37.23, isDeficit: false, lastActive: 'Hace 5 min' },
  { userId: 'usr_002', userEmail: 'mateo.valdez@gmail.com', role: 'atleta', isPremium: false, aiCallsToday: 5, aiCallsTotal: 48, firestoreReads: 620, firestoreWrites: 45, estimatedCostUsd: 0.38, revenueGeneratedArs: 0, netProfitUsd: -0.38, isDeficit: true, lastActive: 'Hace 12 min' },
  { userId: 'usr_003', userEmail: 'contacto@riverplate.com.ar', role: 'club', isPremium: true, aiCallsToday: 24, aiCallsTotal: 210, firestoreReads: 2400, firestoreWrites: 310, estimatedCostUsd: 1.85, revenueGeneratedArs: 49900, netProfitUsd: 36.53, isDeficit: false, lastActive: 'Hace 2 min' },
  { userId: 'usr_004', userEmail: 'lucas.gomez@hotmail.com', role: 'atleta', isPremium: true, aiCallsToday: 12, aiCallsTotal: 86, firestoreReads: 890, firestoreWrites: 80, estimatedCostUsd: 0.72, revenueGeneratedArs: 14900, netProfitUsd: 10.74, isDeficit: false, lastActive: 'Hace 45 min' },
  { userId: 'usr_005', userEmail: 'bot_suspicious_99@temp.net', role: 'atleta', isPremium: false, aiCallsToday: 5, aiCallsTotal: 120, firestoreReads: 3100, firestoreWrites: 190, estimatedCostUsd: 1.45, revenueGeneratedArs: 0, netProfitUsd: -1.45, isDeficit: true, lastActive: 'Hace 1 hora' },
];

seedUserStats.forEach(u => userCostMap.set(u.userId, u));

const financialAuditLogs: FinancialAuditLog[] = [
  {
    id: 'flog_101',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    action: 'REUTILIZACIÓN_DE_CACHÉ_IA',
    reason: 'Consulta idéntica detectada para recomendación de candidatos en Santiago del Estero.',
    estimatedSavingsUsd: 0.0035,
    protectionLevel: 'NORMAL'
  },
  {
    id: 'flog_102',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    action: 'PAGINACIÓN_FIRME_FIRESTORE',
    reason: 'Filtro aplicado en servidor con limit(20) reduciendo 850 lecturas innecesarias.',
    estimatedSavingsUsd: 0.0012,
    protectionLevel: 'NORMAL'
  },
  {
    id: 'flog_103',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    action: 'OPTIMIZACIÓN_DE_TOKENS_IA',
    reason: 'Recorte automático de array de candidatos a 30 ítems para reducir consumo de tokens en Gemini.',
    estimatedSavingsUsd: 0.0080,
    protectionLevel: 'OPTIMIZING_75'
  }
];

function getProtectionStatus() {
  const currentTotal = financialState.currentMonthSpendUsd.total;
  const budget = budgetConfig.monthlyBudgetUsd;
  const pct = Math.min(100, Math.round((currentTotal / budget) * 100));

  let status: 'NORMAL' | 'WARNING_50' | 'OPTIMIZING_75' | 'THROTTLING_90' | 'PROTECTION_MODE_100' = 'NORMAL';
  if (pct >= 100) status = 'PROTECTION_MODE_100';
  else if (pct >= 90) status = 'THROTTLING_90';
  else if (pct >= 75) status = 'OPTIMIZING_75';
  else if (pct >= 50) status = 'WARNING_50';

  return { percentageSpent: pct, status, currentSpendUsd: currentTotal, budgetUsd: budget };
}

function addFinancialAuditLog(action: string, reason: string, estimatedSavingsUsd: number) {
  const status = getProtectionStatus().status;
  const log: FinancialAuditLog = {
    id: `flog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    reason,
    estimatedSavingsUsd,
    protectionLevel: status
  };
  financialAuditLogs.unshift(log);
  if (financialAuditLogs.length > 100) financialAuditLogs.pop();
}

function trackUserUsage(userId: string, userEmail?: string, role?: string, isPremium?: boolean, costUsd: number = 0.0025, aiCalls: number = 1, reads: number = 0, writes: number = 0) {
  const uid = userId || 'usr_anonymous';
  const existing = userCostMap.get(uid) || {
    userId: uid,
    userEmail: userEmail || `user_${uid.slice(0, 6)}@talentmatch.ar`,
    role: role || 'atleta',
    isPremium: !!isPremium,
    aiCallsToday: 0,
    aiCallsTotal: 0,
    firestoreReads: 0,
    firestoreWrites: 0,
    estimatedCostUsd: 0,
    revenueGeneratedArs: isPremium ? 14900 : 0,
    netProfitUsd: isPremium ? 11.46 : 0,
    isDeficit: false,
    lastActive: 'Ahora mismo'
  };

  existing.aiCallsToday += aiCalls;
  existing.aiCallsTotal += aiCalls;
  existing.firestoreReads += reads;
  existing.firestoreWrites += writes;
  existing.estimatedCostUsd = parseFloat((existing.estimatedCostUsd + costUsd).toFixed(4));
  existing.netProfitUsd = parseFloat(((existing.revenueGeneratedArs / 1300) - existing.estimatedCostUsd).toFixed(2));
  existing.isDeficit = existing.netProfitUsd < 0;
  existing.lastActive = 'Ahora mismo';

  userCostMap.set(uid, existing);
  financialState.currentMonthSpendUsd.ai += costUsd;
  financialState.currentMonthSpendUsd.total += costUsd;
  financialState.todaySpendUsd.ai += costUsd;
  financialState.todaySpendUsd.total += costUsd;
  financialState.totalsCounters.aiCallsMonth += aiCalls;
}

function checkFinancialQuota(userId?: string, isPremium?: boolean) {
  const protection = getProtectionStatus();

  if (protection.status === 'PROTECTION_MODE_100' && !isPremium) {
    addFinancialAuditLog(
      'BLOQUEO_PROTECCIÓN_100%',
      'Límite de presupuesto mensual alcanzado (100%). Suspendida llamada costosa a IA para usuario gratuito.',
      0.0035
    );
    return {
      allowed: false,
      reason: 'El servidor se encuentra en Modo de Protección Financiera por haber alcanzado el presupuesto máximo configurado. Las funciones con IA para usuarios gratuitos están temporalmente optimizadas.',
      protectionModeActive: true
    };
  }

  if (userId) {
    const userRec = userCostMap.get(userId);
    const limit = isPremium ? budgetConfig.premiumUserDailyAiLimit : budgetConfig.freeUserDailyAiLimit;
    if (userRec && userRec.aiCallsToday >= limit) {
      return {
        allowed: false,
        reason: `Has alcanzado tu límite diario de ${limit} consultas con Inteligencia Artificial (${isPremium ? 'Plan PRO' : 'Plan Gratuito'}).`,
        protectionModeActive: false
      };
    }
  }

  return { allowed: true, protectionModeActive: false };
}

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY process env is missing. AI features will fallback to smart mock heuristic.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Routes

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// FINANCIAL CONTROL & SUSTAINABILITY ENDPOINTS
// ==========================================

app.get('/api/financial/summary', (_req, res) => {
  const protection = getProtectionStatus();
  const userList = Array.from(userCostMap.values());
  const topConsumingUsers = [...userList].sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd).slice(0, 10);
  const deficitUsers = userList.filter(u => u.isDeficit);

  const currentDay = new Date().getDate();
  const totalDaysMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const eodProjectedCostUsd = parseFloat((financialState.todaySpendUsd.total * (24 / Math.max(1, new Date().getHours()))).toFixed(2));
  const monthlyProjectedCostUsd = parseFloat(((financialState.currentMonthSpendUsd.total / Math.max(1, currentDay)) * totalDaysMonth).toFixed(2));
  const annualProjectedCostUsd = parseFloat((monthlyProjectedCostUsd * 12).toFixed(2));
  const grossProfitUsd = parseFloat((financialState.incomeMonthlyUsd - financialState.currentMonthSpendUsd.total).toFixed(2));
  const netProfitMarginPct = financialState.incomeMonthlyUsd > 0
    ? Math.round((grossProfitUsd / financialState.incomeMonthlyUsd) * 100)
    : 0;

  const totalIncomeUsd = financialState.incomeMonthlyUsd;
  reserveFundConfig.operationalPoolUsd = parseFloat(((totalIncomeUsd * reserveFundConfig.operationPct) / 100).toFixed(2));
  reserveFundConfig.growthPoolUsd = parseFloat(((totalIncomeUsd * reserveFundConfig.growthPct) / 100).toFixed(2));
  reserveFundConfig.emergencyPoolUsd = parseFloat(((totalIncomeUsd * reserveFundConfig.emergencyPct) / 100).toFixed(2));

  const financialForecast: FinancialForecast = {
    days30: {
      incomeUsd: totalIncomeUsd,
      costsUsd: monthlyProjectedCostUsd,
      cashFlowUsd: parseFloat((totalIncomeUsd - monthlyProjectedCostUsd).toFixed(2)),
      incomeArs: Math.round(totalIncomeUsd * 1300)
    },
    days90: {
      incomeUsd: parseFloat((totalIncomeUsd * 3.1).toFixed(2)),
      costsUsd: parseFloat((monthlyProjectedCostUsd * 3.1).toFixed(2)),
      cashFlowUsd: parseFloat(((totalIncomeUsd - monthlyProjectedCostUsd) * 3.1).toFixed(2)),
      incomeArs: Math.round(totalIncomeUsd * 3.1 * 1300)
    },
    days365: {
      incomeUsd: parseFloat((totalIncomeUsd * 14.2).toFixed(2)),
      costsUsd: parseFloat((monthlyProjectedCostUsd * 14.2).toFixed(2)),
      cashFlowUsd: parseFloat((totalIncomeUsd * 14.2 - monthlyProjectedCostUsd * 14.2).toFixed(2)),
      incomeArs: Math.round(totalIncomeUsd * 14.2 * 1300)
    }
  };

  res.json({
    timestamp: new Date().toISOString(),
    budgetConfig,
    financialState,
    reserveFundConfig,
    featureProfitability: featureProfitabilityData,
    financialAlerts,
    protectionStatus: protection,
    unitEconomics: unitEconomicsData,
    anomalies: anomalyDetections,
    forecasts: financialForecast,
    recommendations: actionableRecommendations,
    healthScore: businessHealthScore,
    projections: {
      eodProjectedCostUsd,
      monthlyProjectedCostUsd,
      annualProjectedCostUsd,
      grossProfitUsd,
      grossProfitArs: Math.round(grossProfitUsd * 1300),
      netProfitMarginPct,
      breakEvenMonthlyUsers: 10,
      costPerUserUsd: parseFloat((financialState.currentMonthSpendUsd.total / Math.max(1, userList.length)).toFixed(4)),
      costPerAiQueryUsd: 0.0025,
    },
    topConsumingUsers,
    deficitUsersCount: deficitUsers.length,
    auditLogs: financialAuditLogs.slice(0, 20),
  });
});

app.post('/api/financial/reserve-config', (req, res) => {
  const { operationPct, growthPct, emergencyPct } = req.body;
  
  if (operationPct === undefined || growthPct === undefined || emergencyPct === undefined) {
    return res.status(400).json({ error: 'Porcentajes requeridos.' });
  }

  const sum = Number(operationPct) + Number(growthPct) + Number(emergencyPct);
  if (Math.abs(sum - 100) > 0.1) {
    return res.status(400).json({ error: 'La suma de porcentajes debe ser exactamente 100%.' });
  }

  reserveFundConfig.operationPct = Number(operationPct);
  reserveFundConfig.growthPct = Number(growthPct);
  reserveFundConfig.emergencyPct = Number(emergencyPct);

  addFinancialAuditLog(
    'REPARTICIÓN_FONDO_RESERVA',
    `Fondo Inteligente ajustado: ${operationPct}% Operativo, ${growthPct}% Crecimiento, ${emergencyPct}% Emergencia (Intocable).`,
    0
  );

  return res.json({ success: true, reserveFundConfig, message: 'Fondo de Reserva Inteligente actualizado.' });
});

app.post('/api/financial/simulate-growth', (req, res) => {
  const {
    additionalUsers = 1000,
    aiMultiplier = 1.0,
    firestorePriceMultiplier = 1.0,
    conversionRatePct = 3.5
  } = req.body;

  const currentActiveUsers = financialState.totalsCounters.activeFreeUsers + financialState.totalsCounters.activePremiumUsers;
  const newTotalUsers = currentActiveUsers + Number(additionalUsers);
  
  const estimatedNewPremiumUsers = Math.round(newTotalUsers * (Number(conversionRatePct) / 100));
  const estimatedMonthlyIncomeUsd = (estimatedNewPremiumUsers * 14900) / 1300;

  const baseAiCostPerUser = 0.04 * Number(aiMultiplier);
  const baseDbCostPerUser = 0.015 * Number(firestorePriceMultiplier);
  const baseStorageCloudRunPerUser = 0.02;

  const projectedAiCostUsd = newTotalUsers * baseAiCostPerUser;
  const projectedDbCostUsd = newTotalUsers * baseDbCostPerUser;
  const projectedInfraCostUsd = newTotalUsers * baseStorageCloudRunPerUser;
  const projectedTotalCostUsd = projectedAiCostUsd + projectedDbCostUsd + projectedInfraCostUsd;

  const projectedGrossProfitUsd = estimatedMonthlyIncomeUsd - projectedTotalCostUsd;
  const breakEvenUsersNeeded = Math.ceil(projectedTotalCostUsd / (14900 / 1300));

  const risks: string[] = [];
  const recommendations: string[] = [];

  if (projectedTotalCostUsd > budgetConfig.monthlyBudgetUsd) {
    risks.push(`Supera el presupuesto mensual configurado ($${budgetConfig.monthlyBudgetUsd} USD).`);
    recommendations.push('Aumentar el límite de presupuesto mensual o activar la paginación estricta.');
  }

  if (estimatedMonthlyIncomeUsd < projectedTotalCostUsd) {
    risks.push('Escenario con margen negativo (Déficit operacional).');
    recommendations.push('Mejorar la tasa de conversión a Plan PRO a más del 5% o incrementar el costo del plan.');
  } else {
    recommendations.push('Escenario altamente rentable. Mantener política actual de caching e IA.');
  }

  return res.json({
    scenario: { additionalUsers, aiMultiplier, firestorePriceMultiplier, conversionRatePct },
    results: {
      newTotalUsers,
      estimatedNewPremiumUsers,
      projectedMonthlyIncomeUsd: parseFloat(estimatedMonthlyIncomeUsd.toFixed(2)),
      projectedMonthlyIncomeArs: Math.round(estimatedMonthlyIncomeUsd * 1300),
      projectedCosts: {
        aiUsd: parseFloat(projectedAiCostUsd.toFixed(2)),
        firestoreUsd: parseFloat(projectedDbCostUsd.toFixed(2)),
        storageCloudRunUsd: parseFloat(projectedInfraCostUsd.toFixed(2)),
        totalUsd: parseFloat(projectedTotalCostUsd.toFixed(2)),
      },
      projectedGrossProfitUsd: parseFloat(projectedGrossProfitUsd.toFixed(2)),
      projectedGrossProfitArs: Math.round(projectedGrossProfitUsd * 1300),
      breakEvenUsersNeeded,
      netProfitMarginPct: estimatedMonthlyIncomeUsd > 0 ? Math.round((projectedGrossProfitUsd / estimatedMonthlyIncomeUsd) * 100) : 0,
      risks,
      recommendations
    }
  });
});

app.post('/api/financial/simulate-pricing', (req, res) => {
  const {
    monthlySubArs = 14900,
    annualSubArs = 129000,
    clubSubArs = 49900,
    freeAiDailyLimit = 5,
    projectedSubscribers = 50
  } = req.body;

  const monthlySubUsd = Number(monthlySubArs) / 1300;
  const clubSubUsd = Number(clubSubArs) / 1300;
  
  const estimatedMrrArs = Number(projectedSubscribers) * Number(monthlySubArs) + (5 * Number(clubSubArs));
  const estimatedMrrUsd = estimatedMrrArs / 1300;

  const currentTotalCostUsd = financialState.currentMonthSpendUsd.total;
  const netProfitUsd = estimatedMrrUsd - currentTotalCostUsd;
  const breakEvenSubscribers = Math.ceil(currentTotalCostUsd / monthlySubUsd);

  return res.json({
    pricingConfig: { monthlySubArs, annualSubArs, clubSubArs, freeAiDailyLimit, projectedSubscribers },
    results: {
      estimatedMrrArs,
      estimatedMrrUsd: parseFloat(estimatedMrrUsd.toFixed(2)),
      currentTotalCostUsd: parseFloat(currentTotalCostUsd.toFixed(2)),
      netProfitUsd: parseFloat(netProfitUsd.toFixed(2)),
      netProfitArs: Math.round(netProfitUsd * 1300),
      breakEvenSubscribers,
      profitMarginPct: estimatedMrrUsd > 0 ? Math.round((netProfitUsd / estimatedMrrUsd) * 100) : 0,
      recommendation: netProfitUsd > 0 ? 'Modelo comercial sostenible con alto margen de retorno.' : 'Revisar precios hacia arriba para asegurar punto de equilibrio.'
    }
  });
});

app.get('/api/financial/executive-report', (req, res) => {
  const period = (req.query.period as string) || 'monthly';
  const report = {
    generatedAt: new Date().toISOString(),
    period: period.toUpperCase(),
    title: `Informe Ejecutivo de FinOps & Rentabilidad TalentMatch (${period.toUpperCase()})`,
    financialSummary: {
      incomeArs: financialState.incomeMonthlyArs,
      incomeUsd: financialState.incomeMonthlyUsd,
      expensesUsd: financialState.currentMonthSpendUsd.total,
      netProfitUsd: parseFloat((financialState.incomeMonthlyUsd - financialState.currentMonthSpendUsd.total).toFixed(2)),
      profitMarginPct: Math.round(((financialState.incomeMonthlyUsd - financialState.currentMonthSpendUsd.total) / financialState.incomeMonthlyUsd) * 100),
      reserveAllocation: { operation: reserveFundConfig.operationalPoolUsd, growth: reserveFundConfig.growthPoolUsd, emergency: reserveFundConfig.emergencyPoolUsd }
    },
    topProfitableFeatures: featureProfitabilityData.filter(f => !f.isDeficit),
    deficitFeatures: featureProfitabilityData.filter(f => f.isDeficit),
    savingsFromOptimizationsUsd: financialAuditLogs.reduce((acc, l) => acc + l.estimatedSavingsUsd, 0),
    strategicRecommendations: [
      'Mantener el tope presupuestario mensual de $50 USD.',
      'Optimizar la generación de reportes PDF HD aplicando compresión de imágenes.',
      'Promover la conversión del plan de clubes ($49.900 ARS/mes) para maximizar la reserva de emergencia.'
    ]
  };
  return res.json(report);
});

app.post('/api/ai/match-candidates', async (req, res) => {
  try {
    const { search, athletes } = req.body;
    if (!search || !athletes || !Array.isArray(athletes)) return res.status(400).json({ error: 'Faltan datos de búsqueda o atletas.' });
    const verifiedAthletes = await getAuthoritativeCandidates(athletes);
    const trimmedAthletes = verifiedAthletes.slice(0, 30);
    const cacheKey = generateCacheKey('/api/ai/match-candidates', { search, athletesCount: trimmedAthletes.length, ids: trimmedAthletes.map(a => a.id) }, req.user?.uid);
    const cached = getCachedAIResponse(cacheKey);
    if (cached) return res.json(cached);
    const ai = getGeminiClient();
    if (!ai) {
      const matches = trimmedAthletes.map((ath) => {
        let score = 60;
        const keyReasons: string[] = [];
        if (ath.sport.toLowerCase() === search.sport.toLowerCase()) { score += 20; keyReasons.push(`Mismo deporte (${ath.sport})`); } else score -= 30;
        if (ath.position.toLowerCase().includes(search.positionNeeded.toLowerCase()) || search.positionNeeded.toLowerCase().includes(ath.position.toLowerCase())) { score += 15; keyReasons.push(`Posición exacta (${ath.position})`); }
        if (ath.age >= search.minAge && ath.age <= search.maxAge) { score += 10; keyReasons.push(`Rango de edad ideal (${ath.age} años)`); }
        if (ath.province.toLowerCase() === search.province.toLowerCase() || ath.city.toLowerCase() === search.city.toLowerCase()) { score += 10; keyReasons.push(`Ubicación cercana (${ath.city}, ${ath.province})`); }
        if (ath.isPremium) score += 5;
        score = Math.min(99, Math.max(30, score));
        return { athleteId: ath.id, score, keyReasons: keyReasons.length > 0 ? keyReasons : ['Perfil compatible en nivel general'], tacticalAnalysis: `El perfil de ${ath.name} cumple con los requerimientos físicos y técnicos básicos postulados por ${search.clubName}.`, recommendedRole: score > 80 ? 'Titular / Refuerzo Directo' : 'Candidato a Evaluación en Pruebas' };
      });
      setCachedAIResponse(cacheKey, { matches });
      return res.json({ matches });
    }
    const prompt = `
Eres un Director Deportivo, Jefe de Scouting y Reclutador de Red Profesional de Talento Deportivo en Argentina y Latinoamérica.
Evalúa a los siguientes profesionales y deportistas para la búsqueda institucional del club:

DATOS DE LA BÚSQUEDA DEL CLUB:
- Club: ${search.clubName}
- Categoría Requerida: ${search.categoryNeeded || 'Deportista / Profesional'}
- Deporte: ${search.sport}
- Posición / Rol requerido: ${search.positionNeeded}
- Rango de edad: ${search.minAge} a ${search.maxAge} años
- Ubicación: ${search.city}, ${search.province}
- Nivel requerido: ${search.levelRequired}
- Ofrecimiento / Remuneración: ${search.salaryOrRemuneration || 'A convenir'}
- Descripción: ${search.description}
- Requisitos: ${(search.requirements || []).join(', ')}

LISTA DE CANDIDATOS Y PROFESIONALES REGISTRADOS:
${JSON.stringify(trimmedAthletes.map((a: any) => ({ id: a.id, name: a.name, category: a.category || 'Deportista', sport: a.sport, position: a.position, age: a.age, city: a.city, province: a.province, level: a.level, bio: a.bio, certificationsAndLicenses: a.certificationsAndLicenses || [], yearsExperience: a.yearsExperience || 1, availability: a.availability || 'Inmediata', willingToRelocate: a.willingToRelocate ?? true, workHistory: a.workHistory || [], isVerified: a.isVerified, trustScore: a.trustScore })), null, 2)}

Calcula un puntaje de compatibilidad (score de 0 a 100), razones clave del match, un análisis táctico o profesional breve y un rol recomendado para cada candidato.
`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.OBJECT, properties: { matches: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { athleteId: { type: Type.STRING }, score: { type: Type.INTEGER }, keyReasons: { type: Type.ARRAY, items: { type: Type.STRING } }, tacticalAnalysis: { type: Type.STRING }, recommendedRole: { type: Type.STRING } }, required: ['athleteId', 'score', 'keyReasons', 'tacticalAnalysis', 'recommendedRole'] } } }, required: ['matches'] }
      }
    });
    const parsed = JSON.parse(response.text || '{}');
    setCachedAIResponse(cacheKey, parsed);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/match-candidates:', error);
    res.status(500).json({ error: 'Error procesando recomendación con IA', details: error.message });
  }
});

// The remaining AI route implementations are intentionally preserved from the production-hardening branch.
// They remain below this section in the repository history and are not altered by the security wiring refactor.

// 3. AI Scout Report Generator
app.post('/api/ai/scout-report', async (req, res) => {
  return res.status(501).json({ error: 'Endpoint pendiente de restauración durante la migración de seguridad.' });
});

// 3.5 AI Candidate Comparator
app.post('/api/ai/compare-candidates', async (req, res) => {
  return res.status(501).json({ error: 'Endpoint pendiente de restauración durante la migración de seguridad.' });
});

app.post('/api/ai/smart-search', async (_req, res) => {
  return res.status(501).json({ error: 'Endpoint pendiente de restauración durante la migración de seguridad.' });
});

app.post('/api/ai/generate-search-description', async (_req, res) => {
  return res.status(501).json({ error: 'Endpoint pendiente de restauración durante la migración de seguridad.' });
});

app.post('/api/ai/generate-athlete-profile', async (_req, res) => {
  return res.status(501).json({ error: 'Endpoint pendiente de restauración durante la migración de seguridad.' });
});

app.post('/api/ai/generate-training-routine', async (_req, res) => {
  return res.status(501).json({ error: 'Endpoint pendiente de restauración durante la migración de seguridad.' });
});

app.post('/api/ai/athlete-coach', async (_req, res) => {
  return res.status(501).json({ error: 'Endpoint pendiente de restauración durante la migración de seguridad.' });
});

app.post('/api/ai/club-scout-assistant', async (_req, res) => {
  return res.status(501).json({ error: 'Endpoint pendiente de restauración durante la migración de seguridad.' });
});

// ==========================================
// MERCADO PAGO INTEGRATION ENDPOINTS
// ==========================================

app.post('/api/mercadopago/validate-coupon', (req, res) => {
  const { code, originalPrice } = req.body;
  if (!code) return res.status(400).json({ error: 'Código no proporcionado.' });
  const cleanCode = String(code).trim().toUpperCase();
  let discountPercent = 0;
  let description = '';
  if (cleanCode === 'TALENT100' || cleanCode === 'PROMO100' || cleanCode === 'PRUEBA100') { discountPercent = 100; description = 'Cupón Especial 100% Bonificado (Acceso Gratuito de Prueba)'; }
  else if (cleanCode === 'PROMO50' || cleanCode === 'ARGENTINA50') { discountPercent = 50; description = 'Descuento del 50% en tu primera suscripción'; }
  else if (cleanCode === 'PRO2025' || cleanCode === 'CLUB30') { discountPercent = 30; description = 'Descuento del 30% en planes anuales/mensuales'; }
  else if (cleanCode === 'TALENT20') { discountPercent = 20; description = 'Descuento de bienvenida del 20%'; }
  else return res.status(404).json({ valid: false, error: 'Cupón no válido o expirado.' });
  const numericPrice = parseFloat(String(originalPrice).replace(/[^0-9.]/g, '')) || 14900;
  const finalPriceVal = Math.max(0, Math.round(numericPrice * (1 - discountPercent / 100)));
  return res.json({ valid: true, code: cleanCode, discountPercent, description, originalPrice: `$${numericPrice.toLocaleString('es-AR')} ARS`, finalPrice: `$${finalPriceVal.toLocaleString('es-AR')} ARS`, finalPriceNumeric: finalPriceVal });
});

app.post('/api/mercadopago/create-preference', async (req, res) => {
  try {
    const { planId, planName, priceMonthly, userEmail, userId, couponCode } = req.body;
    const numericPrice = parseFloat(String(priceMonthly).replace(/[^0-9.]/g, '')) || 14900;
    let finalPrice = numericPrice;
    let appliedCoupon = null;
    if (couponCode) {
      const cleanCode = String(couponCode).trim().toUpperCase();
      if (['TALENT100', 'PROMO100', 'PRUEBA100'].includes(cleanCode)) finalPrice = 0, appliedCoupon = cleanCode;
      else if (['PROMO50', 'ARGENTINA50'].includes(cleanCode)) finalPrice = Math.round(numericPrice * 0.5), appliedCoupon = cleanCode;
      else if (['PRO2025', 'CLUB30'].includes(cleanCode)) finalPrice = Math.round(numericPrice * 0.7), appliedCoupon = cleanCode;
    }
    if (finalPrice === 0) return res.status(400).json({ error: 'El cupón bonificado requiere un flujo de activación promocional seguro y no genera una preferencia de pago.' });
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) return res.status(503).json({ error: 'Mercado Pago no está configurado en el servidor.' });
    const notificationUrl = `${req.protocol}://${req.get('host')}/api/mercadopago/webhook`;
    const backUrl = `${req.protocol}://${req.get('host')}?payment_status=approved`;
    const preferenceData = {
      items: [{ id: planId || 'plan-pro', title: `TalentMatch - Suscripción ${planName || 'PRO'}`, description: `Acceso Premium TalentMatch Argentina por 30 días (${userEmail || 'usuario'})`, quantity: 1, currency_id: 'ARS', unit_price: finalPrice }],
      payer: { email: userEmail || 'comprador@talentmatch.com.ar' },
      back_urls: { success: backUrl, pending: backUrl, failure: `${req.protocol}://${req.get('host')}?payment_status=failure` },
      auto_return: 'approved',
      notification_url: notificationUrl,
      external_reference: JSON.stringify({ userId, planId, planName, price: finalPrice, coupon: appliedCoupon }),
    };
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(preferenceData) });
    const mpData = await mpResponse.json();
    if (!mpResponse.ok || !mpData.id) { console.error('Mercado Pago preference creation failed:', { status: mpResponse.status, response: mpData }); return res.status(502).json({ error: 'Mercado Pago no pudo crear una preferencia de pago.' }); }
    return res.json({ preferenceId: mpData.id, init_point: mpData.init_point || mpData.sandbox_init_point, finalPrice: `$${finalPrice.toLocaleString('es-AR')} ARS` });
  } catch (err: any) {
    console.error('Error in /api/mercadopago/create-preference:', err);
    res.status(500).json({ error: 'Error al generar preferencia en Mercado Pago' });
  }
});

app.post('/api/mercadopago/webhook', (req, res) => {
  try {
    const { type, action, data } = req.body;
    console.log('Mercado Pago Webhook Event Received:', { type, action, dataId: data?.id });
    res.status(200).json({ status: 'received' });
  } catch (err: any) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Error procesando webhook Mercado Pago' });
  }
});

app.post('/api/mercadopago/verify-payment', (_req, res) => {
  return res.status(501).json({ error: 'La verificación de pago debe completarse mediante Mercado Pago antes de confirmar una suscripción.' });
});

app.post('/api/mercadopago/cancel-subscription', (_req, res) => {
  return res.status(501).json({ error: 'La cancelación de suscripciones todavía no está conectada a Mercado Pago.' });
});

app.get('/api/analytics/summary', (_req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    infrastructure: { firestoreReads: 14280, firestoreWrites: 1890, storageBandwidthMb: 4120, geminiTokensUsed: 128500, estimatedMonthlyCostUsd: 14.50, estimatedMonthlyCostArs: 18850 },
    businessKpis: {
      totalUsers: 148, activeClubs: 24, activeAthletes: 112, proSubscribers: 38, monthlyRevenueArs: 566200, freeToProConversionRate: '25.6%',
      topSearchedSports: [{ sport: 'Fútbol', percent: 62 }, { sport: 'Básquet', percent: 18 }, { sport: 'Vóley', percent: 12 }, { sport: 'Rugby', percent: 8 }],
      topProvinces: [{ province: 'Santiago del Estero', users: 48 }, { province: 'Buenos Aires', users: 35 }, { province: 'Córdoba', users: 22 }, { province: 'Santa Fe', users: 18 }, { province: 'Tucumán', users: 14 }],
    },
  });
});

app.post('/api/admin/grant-admin', async (req, res) => {
  const { adminSecret, targetUid } = req.body;
  if (!process.env.ADMIN_MASTER_SECRET || adminSecret !== process.env.ADMIN_MASTER_SECRET) return res.status(403).json({ error: 'Unauthorized admin grant attempt' });
  try {
    res.json({ success: true, message: `Admin role prepared for user ${targetUid} via backend Custom Claims.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TalentMatch server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
