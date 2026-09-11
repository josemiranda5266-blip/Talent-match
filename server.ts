import express from 'express';
import path from 'path';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import * as admin from 'firebase-admin';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { requireAuthenticated, requireAdmin, enforceAiBudget } from './runtime-security';

if (!(admin as any).apps?.length) {
  try {
    (admin as any).initializeApp();
  } catch (e) {
    console.error('Firebase Admin initialization notice:', e);
  }
}

async function verifyFirebaseToken(req: any, res: any, next: any) {
  return requireAuthenticated(req, res, next);
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

app.use(express.json({ limit: '2mb' }));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes al servidor. Por favor intente más tarde.' },
});

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.uid || req.ip || 'anonymous',
  message: { error: 'Límite de consultas de Inteligencia Artificial alcanzado (40 solicitudes cada 10 minutos). Por favor aguarde unos minutos.' },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de pago o validación. Intente más tarde.' },
});

app.use('/api/', generalLimiter);
app.use('/api/ai/', verifyFirebaseToken, aiLimiter, enforceAiBudget);
app.use('/api/mercadopago/', paymentLimiter);
app.use('/api/admin/', requireAdmin);

const ADMIN_FINANCIAL_ROUTES = new Set([
  '/api/financial/summary',
  '/api/financial/reserve-config',
  '/api/financial/executive-report',
]);

app.use('/api/financial/', (req, res, next) => {
  if (ADMIN_FINANCIAL_ROUTES.has(req.path)) return requireAdmin(req, res, next);
  return requireAuthenticated(req, res, next);
});

const aiCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCachedAIResponse(key: string): any | null {
  const cached = aiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.data;
  if (cached) aiCache.delete(key);
  return null;
}

function setCachedAIResponse(key: string, data: any) {
  if (aiCache.size > 200) {
    const firstKey = aiCache.keys().next().value;
    if (firstKey) aiCache.delete(firstKey);
  }
  aiCache.set(key, { timestamp: Date.now(), data });
}

function generateCacheKey(endpoint: string, payload: any): string {
  const str = JSON.stringify(payload);
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
  overallScore: number;
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
    title: 'Pico de consultas IA detectado',
    metricVariation: 'Dato histórico simulado: +145%',
    aiCauseExplanation: 'Registro de demostración para validar la interfaz de monitoreo.',
    mitigationApplied: 'Registro informativo; no representa una métrica de producción.'
  },
  {
    id: 'anom_02',
    detectedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    type: 'FIRESTORE_READ_SPIKE',
    severity: 'MEDIA',
    title: 'Lecturas Firestore por encima del objetivo',
    metricVariation: 'Dato histórico simulado: +210%',
    aiCauseExplanation: 'Registro de demostración para validar la interfaz de monitoreo.',
    mitigationApplied: 'Registro informativo; no representa una métrica de producción.'
  },
  {
    id: 'anom_03',
    detectedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    type: 'STORAGE_GROWTH',
    severity: 'BAJA',
    title: 'Crecimiento de almacenamiento multimedia',
    metricVariation: 'Dato histórico simulado: +3.2 GB',
    aiCauseExplanation: 'Registro de demostración para validar la interfaz de monitoreo.',
    mitigationApplied: 'Registro informativo; no representa una métrica de producción.'
  }
];

const actionableRecommendations: ActionableRecommendation[] = [
  {
    id: 'rec_01',
    category: 'IA_LIMITS',
    title: 'Revisar límites de IA según consumo real',
    impactEstimate: 'Requiere métricas reales de uso',
    description: 'No se debe modificar el límite comercial basándose en datos sintéticos.',
    recommendedAction: 'Medir consumo real por plan antes de cambiar cuotas.'
  },
  {
    id: 'rec_02',
    category: 'PRECIOS',
    title: 'Validar precios con métricas reales',
    impactEstimate: 'Requiere datos reales de conversión y churn',
    description: 'Las decisiones de precio deben basarse en ingresos y conversión observados.',
    recommendedAction: 'Conectar el informe financiero a datos de producción.'
  },
  {
    id: 'rec_03',
    category: 'COST_OPTIMIZATION',
    title: 'Medir coste real de generación de documentos',
    impactEstimate: 'Pendiente de medición',
    description: 'No se debe atribuir un déficit a PDF sin telemetría real de coste y uso.',
    recommendedAction: 'Instrumentar generación de documentos y almacenamiento.'
  },
  {
    id: 'rec_04',
    category: 'MARKETING',
    title: 'Medir CAC y LTV antes de escalar adquisición',
    impactEstimate: 'Pendiente de medición',
    description: 'Evitar decisiones de marketing basadas en supuestos estáticos.',
    recommendedAction: 'Registrar adquisición, conversión, retención y cancelaciones.'
  }
];

const businessHealthScore: BusinessHealthScore = {
  overallScore: 0,
  status: 'EN_RIESGO',
  components: { security: 0, availability: 0, profitability: 0, growth: 0, costControl: 0, userSatisfaction: 0, performance: 0 },
  summaryText: 'Sin métricas de producción conectadas: no se debe declarar una puntuación financiera operativa.'
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
  operationalPoolUsd: 0,
  growthPoolUsd: 0,
  emergencyPoolUsd: 0,
};

const featureProfitabilityData: FeatureProfitability[] = [];
const financialAlerts: FinancialAlert[] = [];

const financialState = {
  incomeMonthlyArs: 0,
  incomeMonthlyUsd: 0,
  currentMonthSpendUsd: { ai: 0, firestore: 0, storage: 0, cloudRun: 0, hosting: 0, notificationsEmail: 0, total: 0 },
  todaySpendUsd: { ai: 0, firestore: 0, storage: 0, cloudRun: 0, hosting: 0, notificationsEmail: 0, total: 0 },
  totalsCounters: { aiCallsMonth: 0, aiTokensMonth: 0, firestoreReadsMonth: 0, firestoreWritesMonth: 0, storageBytesMonth: 0, activeFreeUsers: 0, activePremiumUsers: 0 }
};

const userCostMap = new Map<string, UserCostRecord>();
const financialAuditLogs: FinancialAuditLog[] = [];

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
  financialAuditLogs.unshift({
    id: `flog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    reason,
    estimatedSavingsUsd,
    protectionLevel: status
  });
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
    revenueGeneratedArs: 0,
    netProfitUsd: 0,
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
    addFinancialAuditLog('BLOQUEO_PROTECCIÓN_100%', 'Límite de presupuesto mensual alcanzado.', 0);
    return { allowed: false, reason: 'Modo de protección financiera activo.', protectionModeActive: true };
  }
  if (userId) {
    const userRec = userCostMap.get(userId);
    const limit = isPremium ? budgetConfig.premiumUserDailyAiLimit : budgetConfig.freeUserDailyAiLimit;
    if (userRec && userRec.aiCallsToday >= limit) return { allowed: false, reason: `Has alcanzado tu límite diario de ${limit} consultas con Inteligencia Artificial.`, protectionModeActive: false };
  }
  return { allowed: true, protectionModeActive: false };
}

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY process env is missing. AI features will fallback to smart mock heuristic.');
    return null;
  }
  return new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
};

// API Routes

// 1. Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// FINANCIAL CONTROL & SUSTAINABILITY ENDPOINTS
// ==========================================

// Get full financial dashboard summary
app.get('/api/financial/summary', (_req, res) => {
  res.json({ financialState, budgetConfig, protectionStatus: getProtectionStatus(), unitEconomics: unitEconomicsData, businessHealthScore, featureProfitability: featureProfitabilityData, anomalyDetections, actionableRecommendations, financialAlerts, userCosts: Array.from(userCostMap.values()), auditLogs: financialAuditLogs });
});

// Get reserve fund configuration
app.get('/api/financial/reserve-config', (_req, res) => {
  res.json(reserveFundConfig);
});

// Get profitability simulation
app.post('/api/financial/simulate', (req, res) => {
  const { additionalUsers = 100, aiMultiplier = 1, firestorePriceMultiplier = 1, conversionRatePct = 5 } = req.body;
  const currentUsers = financialState.totalsCounters.activeFreeUsers + financialState.totalsCounters.activePremiumUsers;
  const newTotalUsers = currentUsers + Number(additionalUsers);
  const estimatedNewPremiumUsers = Math.round(newTotalUsers * (Number(conversionRatePct) / 100));
  const estimatedMonthlyIncomeUsd = estimatedNewPremiumUsers * 14900 / 1300;
  const projectedAiCostUsd = financialState.currentMonthSpendUsd.ai * Number(aiMultiplier);
  const projectedDbCostUsd = (financialState.currentMonthSpendUsd.firestore + financialState.currentMonthSpendUsd.storage) * Number(firestorePriceMultiplier);
  const projectedInfraCostUsd = financialState.currentMonthSpendUsd.cloudRun + financialState.currentMonthSpendUsd.hosting;
  const projectedTotalCostUsd = projectedAiCostUsd + projectedDbCostUsd + projectedInfraCostUsd;
  const projectedGrossProfitUsd = estimatedMonthlyIncomeUsd - projectedTotalCostUsd;
  const breakEvenUsersNeeded = estimatedMonthlyIncomeUsd > 0 ? Math.ceil(projectedTotalCostUsd / (14900 / 1300 * Math.max(Number(conversionRatePct) / 100, 0.0001))) : 0;
  res.json({ scenario: { additionalUsers, aiMultiplier, firestorePriceMultiplier, conversionRatePct }, results: { newTotalUsers, estimatedNewPremiumUsers, projectedMonthlyIncomeUsd: Number(estimatedMonthlyIncomeUsd.toFixed(2)), projectedMonthlyIncomeArs: Math.round(estimatedMonthlyIncomeUsd * 1300), projectedCosts: { aiUsd: Number(projectedAiCostUsd.toFixed(2)), firestoreUsd: Number(projectedDbCostUsd.toFixed(2)), storageCloudRunUsd: Number(projectedInfraCostUsd.toFixed(2)), totalUsd: Number(projectedTotalCostUsd.toFixed(2)) }, projectedGrossProfitUsd: Number(projectedGrossProfitUsd.toFixed(2)), projectedGrossProfitArs: Math.round(projectedGrossProfitUsd * 1300), breakEvenUsersNeeded, netProfitMarginPct: estimatedMonthlyIncomeUsd > 0 ? Math.round((projectedGrossProfitUsd / estimatedMonthlyIncomeUsd) * 100) : 0, risks: ['Modelo de simulación: no representa ingresos reales.'], recommendations: ['Usar métricas reales de producción antes de tomar decisiones comerciales.'] } });
});

// Simulation Engine for Pricing Models
app.post('/api/financial/simulate-pricing', (req, res) => {
  const { monthlySubArs = 14900, annualSubArs = 129000, clubSubArs = 49900, freeAiDailyLimit = 5, projectedSubscribers = 50 } = req.body;
  const monthlySubUsd = Number(monthlySubArs) / 1300;
  const estimatedMrrArs = Number(projectedSubscribers) * Number(monthlySubArs) + (5 * Number(clubSubArs));
  const estimatedMrrUsd = estimatedMrrArs / 1300;
  const currentTotalCostUsd = financialState.currentMonthSpendUsd.total;
  const netProfitUsd = estimatedMrrUsd - currentTotalCostUsd;
  const breakEvenSubscribers = monthlySubUsd > 0 ? Math.ceil(currentTotalCostUsd / monthlySubUsd) : 0;
  res.json({ pricingConfig: { monthlySubArs, annualSubArs, clubSubArs, freeAiDailyLimit, projectedSubscribers }, results: { estimatedMrrArs, estimatedMrrUsd: Number(estimatedMrrUsd.toFixed(2)), currentTotalCostUsd: Number(currentTotalCostUsd.toFixed(2)), netProfitUsd: Number(netProfitUsd.toFixed(2)), netProfitArs: Math.round(netProfitUsd * 1300), breakEvenSubscribers, profitMarginPct: estimatedMrrUsd > 0 ? Math.round((netProfitUsd / estimatedMrrUsd) * 100) : 0, recommendation: netProfitUsd > 0 ? 'Modelo comercial sostenible con alto margen de retorno.' : 'Revisar precios hacia arriba para asegurar punto de equilibrio.' } });
});

// Automatic Executive Report Endpoint
app.get('/api/financial/executive-report', (req, res) => {
  const period = (req.query.period as string) || 'monthly';
  const report = { generatedAt: new Date().toISOString(), period: period.toUpperCase(), title: `Informe Ejecutivo de FinOps & Rentabilidad TalentMatch (${period.toUpperCase()})`, financialSummary: { incomeArs: financialState.incomeMonthlyArs, incomeUsd: financialState.incomeMonthlyUsd, expensesUsd: financialState.currentMonthSpendUsd.total, netProfitUsd: Number((financialState.incomeMonthlyUsd - financialState.currentMonthSpendUsd.total).toFixed(2)), profitMarginPct: financialState.incomeMonthlyUsd > 0 ? Math.round(((financialState.incomeMonthlyUsd - financialState.currentMonthSpendUsd.total) / financialState.incomeMonthlyUsd) * 100) : 0, reserveAllocation: { operation: reserveFundConfig.operationalPoolUsd, growth: reserveFundConfig.growthPoolUsd, emergency: reserveFundConfig.emergencyPoolUsd } }, topProfitableFeatures: featureProfitabilityData.filter(f => !f.isDeficit), deficitFeatures: featureProfitabilityData.filter(f => f.isDeficit), savingsFromOptimizationsUsd: financialAuditLogs.reduce((acc, l) => acc + l.estimatedSavingsUsd, 0), strategicRecommendations: ['No se muestran conclusiones de rentabilidad sin métricas reales conectadas.'] };
  return res.json(report);
});

// 2. AI Candidate Matching for Club Search
app.post('/api/ai/match-candidates', async (req, res) => {
  try {
    const { search, athletes } = req.body;
    if (!search || !athletes || !Array.isArray(athletes)) return res.status(400).json({ error: 'Faltan datos de búsqueda o atletas.' });
    const verifiedAthletes = await getAuthoritativeCandidates(athletes);
    const trimmedAthletes = verifiedAthletes.slice(0, 30);
    const cacheKey = generateCacheKey('/api/ai/match-candidates', { search, athletesCount: trimmedAthletes.length, ids: trimmedAthletes.map(a => a.id) });
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
        score = Math.min(99, Math.max(30, score));
        return { athleteId: ath.id, score, keyReasons: keyReasons.length > 0 ? keyReasons : ['Perfil compatible en nivel general'], tacticalAnalysis: `El perfil de ${ath.name} cumple con los requerimientos físicos y técnicos básicos postulados por ${search.clubName}.`, recommendedRole: score > 80 ? 'Titular / Refuerzo Directo' : 'Candidato a Evaluación en Pruebas' };
      });
      return res.json({ matches });
    }
    const prompt = `\nEres un Director Deportivo, Jefe de Scouting y Reclutador de Red Profesional de Talento Deportivo en Argentina y Latinoamérica.\nEvalúa a los siguientes profesionales y deportistas para la búsqueda institucional del club:\n\nDATOS DE LA BÚSQUEDA DEL CLUB:\n- Club: ${search.clubName}\n- Categoría Requerida: ${search.categoryNeeded || 'Deportista / Profesional'}\n- Deporte: ${search.sport}\n- Posición / Rol requerido: ${search.positionNeeded}\n- Rango de edad: ${search.minAge} a ${search.maxAge} años\n- Ubicación: ${search.city}, ${search.province}\n- Nivel requerido: ${search.levelRequired}\n- Ofrecimiento / Remuneración: ${search.salaryOrRemuneration || 'A convenir'}\n- Descripción: ${search.description}\n- Requisitos: ${(search.requirements || []).join(', ')}\n\nLISTA DE CANDIDATOS Y PROFESIONALES REGISTRADOS:\n${JSON.stringify(trimmedAthletes.map((a: any) => ({ id: a.id, name: a.name, category: a.category || 'Deportista', sport: a.sport, position: a.position, age: a.age, city: a.city, province: a.province, level: a.level, bio: a.bio, certificationsAndLicenses: a.certificationsAndLicenses || [], yearsExperience: a.yearsExperience || 1, availability: a.availability || 'Inmediata', willingToRelocate: a.willingToRelocate ?? true, workHistory: a.workHistory || [], isVerified: a.isVerified, trustScore: a.trustScore })), null, 2)}\n\nCalcula un puntaje de compatibilidad (score de 0 a 100), razones clave del match, un análisis táctico o profesional breve y un rol recomendado para cada candidato.\n`;
    const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { matches: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { athleteId: { type: Type.STRING }, score: { type: Type.INTEGER }, keyReasons: { type: Type.ARRAY, items: { type: Type.STRING } }, tacticalAnalysis: { type: Type.STRING }, recommendedRole: { type: Type.STRING } }, required: ['athleteId', 'score', 'keyReasons', 'tacticalAnalysis', 'recommendedRole'] } } }, required: ['matches'] } } });
    const parsed = JSON.parse(response.text || '{}');
    setCachedAIResponse(cacheKey, parsed);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/match-candidates:', error);
    return res.status(500).json({ error: 'Error procesando recomendación con IA' });
  }
});

// 3. AI Scout Report Generator
app.post('/api/ai/scout-report', async (req, res) => {
  try {
    const { athlete } = req.body;
    if (!athlete) return res.status(400).json({ error: 'Faltan datos del atleta.' });
    const authoritativeAthlete = await getAuthoritativeAthlete(athlete);
    const ai = getGeminiClient();
    if (!ai) return res.json({ report: { athleteId: authoritativeAthlete.id, summary: `${authoritativeAthlete.name} es un deportista con sólida base en ${authoritativeAthlete.sport} (${authoritativeAthlete.position}).`, strengths: ['Juego físico en el mano a mano', 'Dominio de la posición', 'Disciplina de entrenamiento'], areasToImprove: ['Toma de decisiones bajo presión', 'Técnica de pie no hábil'], suggestedLevel: authoritativeAthlete.level === 'Amateur' ? 'Liga Regional / Torneo Local' : 'Semiprofesional / Federal', overallRating: 8.5, keyStatsAnalysis: `Regularidad registrada: ${authoritativeAthlete.stats?.matchesPlayed || 0} partidos.` } });
    const prompt = `\nEres un Director Deportivo y Auditor de Talento Profesional en el Deporte Argentino y Latinoamericano.\nGenera un Reporte Técnico / Ficha Profesional para el siguiente candidato:\n\nNombre: ${authoritativeAthlete.name}\nCategoría Profesional: ${authoritativeAthlete.category || 'Deportista'}\nDeporte: ${authoritativeAthlete.sport}\nRol / Posición: ${authoritativeAthlete.position}\nEdad: ${authoritativeAthlete.age} años | Años de Experiencia: ${authoritativeAthlete.yearsExperience || 1}\nUbicación: ${authoritativeAthlete.city}, ${authoritativeAthlete.province}\nDisponibilidad: ${authoritativeAthlete.availability || 'Inmediata'}\nRelocalización: ${authoritativeAthlete.willingToRelocate ? 'Sí' : 'No'}\nCertificaciones & Licencias: ${(authoritativeAthlete.certificationsAndLicenses || []).join(', ') || 'En trámite'}\nNivel actual: ${authoritativeAthlete.level}\nVerificado: ${authoritativeAthlete.isVerified ? 'Sí' : 'No'} | Índice de Confianza: ${authoritativeAthlete.trustScore || 70}%\nBiografía: ${authoritativeAthlete.bio}\nHistorial Laboral: ${JSON.stringify(authoritativeAthlete.workHistory || [])}\n\nDevuelve un informe profesional en español con resumen del perfil, 3 fortalezas clave, 2 aspectos a mejorar, nivel competitivo recomendado, nota general de 1.0 a 10.0 y análisis de trayectoria.\n`;
    const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { report: { type: Type.OBJECT, properties: { athleteId: { type: Type.STRING }, summary: { type: Type.STRING }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING } }, suggestedLevel: { type: Type.STRING }, overallRating: { type: Type.NUMBER }, keyStatsAnalysis: { type: Type.STRING } }, required: ['athleteId', 'summary', 'strengths', 'areasToImprove', 'suggestedLevel', 'overallRating', 'keyStatsAnalysis'] } }, required: ['report'] } } });
    return res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/ai/scout-report:', error);
    return res.status(500).json({ error: 'Error generando informe de scouting con IA' });
  }
});

// 3.5 AI Candidate Comparator (Side-by-side comparison for up to 4 candidates)
app.post('/api/ai/compare-candidates', async (req, res) => {
  try {
    const { candidates, searchContext } = req.body;
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) return res.status(400).json({ error: 'Debe enviar entre 2 y 4 candidatos para comparar.' });
    const authoritativeCandidates = await getAuthoritativeCandidates(candidates);
    const ai = getGeminiClient();
    if (!ai) {
      const topCandidate = authoritativeCandidates.reduce((prev: any, current: any) => (current.trustScore || 0) > (prev.trustScore || 0) ? current : prev, authoritativeCandidates[0]);
      return res.json({ comparison: { summary: `El candidato con mayor índice de confianza es ${topCandidate?.name || 'el perfil seleccionado'}.`, recommendation: topCandidate?.id || null } });
    }
    const prompt = `Compara estos candidatos de forma profesional para ${searchContext ? JSON.stringify(searchContext) : 'la búsqueda del club'}: ${JSON.stringify(authoritativeCandidates.slice(0, 4))}. Devuelve fortalezas, debilidades y recomendación. Solo usa los datos suministrados.`;
    const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
    return res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/ai/compare-candidates:', error);
    return res.status(500).json({ error: 'Error comparando candidatos' });
  }
});

// 4. AI Smart Search
app.post('/api/ai/smart-search', async (req, res) => {
  try {
    const { queryPrompt, candidates } = req.body;
    if (!queryPrompt || !candidates || !Array.isArray(candidates)) return res.status(400).json({ error: 'Faltan datos de consulta o candidatos.' });
    const authoritativeCandidates = await getAuthoritativeCandidates(candidates);
    const ai = getGeminiClient();
    if (!ai) return res.json({ summaryReasoning: 'Búsqueda heurística disponible sin proveedor IA.', matches: authoritativeCandidates.slice(0, 10).map((c: any, i: number) => ({ athleteId: c.id, relevanceScore: Math.max(30, 90 - i * 5), matchReason: `Coincidencia heurística para: ${queryPrompt}` })) });
    const prompt = `Analiza qué atletas satisfacen mejor la intención del reclutador. Consulta: ${queryPrompt}. Candidatos: ${JSON.stringify(authoritativeCandidates.slice(0, 30))}. Devuelve lista ordenada por relevancia de 0 a 100, razón específica y resumen. Solo usa los datos suministrados.`;
    const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
    return res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/ai/smart-search:', error);
    return res.status(500).json({ error: 'Error procesando búsqueda inteligente' });
  }
});

// 5. AI Recruitment Description Helper
app.post('/api/ai/generate-search-description', async (req, res) => {
  try {
    const { clubName, sport, positionNeeded, minAge, maxAge, city, levelRequired } = req.body;
    const ai = getGeminiClient();
    if (!ai) return res.json({ description: `${clubName} abre convocatoria para incorporar ${positionNeeded} de ${minAge} a ${maxAge} años en la ciudad de ${city}.`, requirements: [`Edad entre ${minAge} y ${maxAge} años`, `Experiencia en ${sport} categoría ${levelRequired}`, `Disponibilidad para pruebas presenciales en ${city}`] });
    const prompt = `Genera una descripción profesional para una búsqueda: Club ${clubName}; deporte ${sport}; posición ${positionNeeded}; edad ${minAge}-${maxAge}; ciudad ${city}; nivel ${levelRequired}. Devuelve description y 3-4 requirements.`;
    const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
    return res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/ai/generate-search-description:', error);
    return res.status(500).json({ error: 'Error redactando convocatoria' });
  }
});

// 6. AI Athlete Profile Assistant
app.post('/api/ai/generate-athlete-profile', async (req, res) => {
  try {
    const { name, sport, position, age, level, athleteNotes } = req.body;
    const ai = getGeminiClient();
    if (!ai) return res.json({ bio: `${name || 'Deportista'} es un ${position || 'jugador'} de ${sport || 'deporte'} (${age || 20} años) con visión técnica y constancia.`, sportsExperience: `Trayectoria en ${sport || 'deporte'}: ${athleteNotes || 'Experiencia registrada por el atleta.'}`, keyAchievements: [`Formación continua en ${sport || 'deporte'}`, `Regularidad competitiva (${level || 'Liga Local'})`, 'Trabajo en equipo'] });
    const prompt = `Redacta y perfecciona una ficha profesional para un atleta. Datos: ${JSON.stringify({ name, sport, position, age, level, athleteNotes })}. Devuelve bio, sportsExperience y 3 keyAchievements.`;
    const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
    return res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/ai/generate-athlete-profile:', error);
    return res.status(500).json({ error: 'Error generando ficha de atleta con IA' });
  }
});

// 7. AI Custom Training Routine Generator
app.post('/api/ai/generate-training-routine', async (req, res) => {
  try {
    const { name, sport, position, level, areasToImprove } = req.body;
    const ai = getGeminiClient();
    if (!ai) return res.json({ routineTitle: `Rutina de ${position || 'Jugador'} (${sport || 'Deporte'})`, weeklyFocus: 'Plan orientativo; adaptar a evaluación profesional.', drills: [{ name: 'Trabajo de agilidad', duration: '20 min', instructions: 'Progresión técnica moderada y controlada.' }, { name: 'Drill técnico específico', duration: '25 min', instructions: 'Repeticiones según nivel y posición.' }, { name: 'Resistencia', duration: '15 min', instructions: 'Intervalos adaptados al nivel del atleta.' }], recoveryTip: 'Hidratación y recuperación según indicación profesional.' });
    const prompt = `Crea un plan de entrenamiento individualizado. Atleta ${name}; deporte ${sport}; posición ${position}; nivel ${level}; áreas ${Array.isArray(areasToImprove) ? areasToImprove.join(', ') : 'resistencia, velocidad y técnica'}. Devuelve título, enfoque semanal, 3-4 ejercicios con duración e instrucciones y recuperación.`;
    const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
    return res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/ai/generate-training-routine:', error);
    return res.status(500).json({ error: 'Error generando rutina de entrenamiento' });
  }
});

// 8. FASE 5: Coach IA para Deportistas
app.post('/api/ai/athlete-coach', async (req, res) => {
  try {
    const { athlete, question } = req.body;
    if (!athlete || !question) return res.status(400).json({ error: 'Faltan datos de atleta o la pregunta.' });
    const authoritativeAthlete = await getAuthoritativeAthlete(athlete);
    const ai = getGeminiClient();
    if (!ai) return res.json({ answer: `Hola ${authoritativeAthlete.name}. Analizando tu perfil de ${authoritativeAthlete.sport} (${authoritativeAthlete.position}, ${authoritativeAthlete.age} años, nivel ${authoritativeAthlete.level}).`, strengths: ['Regularidad en partidos jugados', 'Formación en la posición', 'Ubicación estratégica'], weaknesses: ['Falta cargar más evidencia deportiva', 'Verificación documental pendiente'], competitiveLevel: authoritativeAthlete.level === 'Amateur' ? 'Liga Regional' : 'Federal A / Semiprofesional', hiringProbability: 78, priorityActions: ['Subir evidencia deportiva reciente', 'Completar verificaciones disponibles', 'Solicitar una referencia'] });
    const prompt = `Eres un Coach Deportivo. Atleta: ${JSON.stringify(authoritativeAthlete)}. Pregunta: ${question}. Responde motivadora y técnicamente, solo con datos reales. Devuelve answer, strengths, weaknesses, competitiveLevel, hiringProbability 0-100 y 3 priorityActions.`;
    const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
    return res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/ai/athlete-coach:', error);
    return res.status(500).json({ error: 'Error procesando Coach IA' });
  }
});

// 9. FASE 5: Scout IA para Clubes
app.post('/api/ai/club-scout-assistant', async (req, res) => {
  try {
    const { queryPrompt, candidates, clubName } = req.body;
    if (!queryPrompt || !candidates || !Array.isArray(candidates)) return res.status(400).json({ error: 'Faltan datos de consulta o candidatos.' });
    const authoritativeCandidates = await getAuthoritativeCandidates(candidates);
    const ai = getGeminiClient();
    if (!ai) return res.json({ executiveRecommendation: `Se analizaron ${authoritativeCandidates.length} perfiles para ${clubName || 'el club'}.`, topMatches: authoritativeCandidates.slice(0, 3).map((c: any, idx: number) => ({ candidateId: c.id, candidateName: c.name, compatibilityScore: 95 - idx * 4, keyReason: `Coincidencia con ${c.position}` })) });
    const prompt = `Eres scout deportivo. Club: ${clubName || 'Club'}. Consulta: ${queryPrompt}. Candidatos: ${JSON.stringify(authoritativeCandidates.slice(0, 30))}. Devuelve recomendación ejecutiva y topMatches. Solo usa datos suministrados.`;
    const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
    return res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/ai/club-scout-assistant:', error);
    return res.status(500).json({ error: 'Error procesando asistente de scouting' });
  }
});

// ==========================================
// STATIC / CLIENT APP
// ==========================================

app.get('/api/status', (_req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Preserve the remainder of the existing server implementation below this point.

app.use(express.static(path.join(process.cwd(), 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TalentMatch server running on port ${PORT}`);
});
