import express from 'express';
import path from 'path';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { requireAuthenticated, requireAdmin, enforceAiBudget, sanitizeAiErrorResponse, markFinancialDataAsModelled, markAnalyticsDataAsModelled, invalidatePremiumEntitlement } from './runtime-security.ts';
import { requireFirebaseUser, verifyMercadoPagoWebhook, recordWebhookIdempotency, requireMercadoPagoCredential, enforceServerPrice, rejectSimulatedPreferenceResponse, verifyPaymentAgainstMercadoPago, rejectUnimplementedCancellation, calculateCouponPrice, resolveCanonicalBasePrice, getCanonicalPlan } from './mercadopago-security.ts';

if (!(admin as any).apps?.length) {
  try { (admin as any).initializeApp(); } catch (e) { console.error('Firebase Admin initialization notice:', e); }
}

const AI_PUBLIC_ATHLETE_FIELDS = [
  'name', 'avatar', 'sport', 'position', 'age', 'city', 'province', 'level',
  'preferredFootOrHand', 'bio', 'stats', 'availableForTrials', 'isVerified',
  'rating', 'verificationTier', 'activityLevel', 'trustScore'
];

function toPublicAiAthlete(id: string, data: any): any {
  const publicAthlete: any = { id };
  for (const field of AI_PUBLIC_ATHLETE_FIELDS) {
    if (data?.[field] !== undefined) publicAthlete[field] = data[field];
  }
  return publicAthlete;
}

async function getAuthoritativeAthlete(clientAthlete: any): Promise<any> {
  if (!clientAthlete || !clientAthlete.id) return null;
  const id = String(clientAthlete.id);
  try {
    const docSnap = await (admin as any).firestore().collection('publicAthletes').doc(id).get();
    if (docSnap.exists) return toPublicAiAthlete(id, docSnap.data() || {});
  } catch (e) { console.error('Error fetching public athlete projection for AI:', e); }
  return null;
}

async function getAuthoritativeCandidates(candidates: any[]): Promise<any[]> {
  if (!Array.isArray(candidates)) return [];
  const resolved = await Promise.all(candidates.map(async c => getAuthoritativeAthlete(c)));
  return resolved.filter(Boolean);
}

function finiteNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}
function boundedNumber(value: unknown, min: number, max: number): number | null {
  const n = finiteNumber(value);
  return n !== null && n >= min && n <= max ? n : null;
}

const app = express();
// Cloud Run terminates TLS at the proxy; trust the single managed proxy hop so req.protocol is HTTPS.
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 8080;
function getPublicAppUrl(req: any): string {
  const configured = String(process.env.PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
  if (configured) {
    let parsed: URL;
    try { parsed = new URL(configured); } catch { throw new Error('PUBLIC_APP_URL is invalid'); }
    if (parsed.protocol !== 'https:') throw new Error('PUBLIC_APP_URL must use HTTPS');
    return configured;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PUBLIC_APP_URL is required in production');
  }
  const host = req.get('host');
  if (!host) throw new Error('Unable to determine development host');
  return `${req.protocol}://${host}`;
}

app.use(express.json({ limit: '2mb' }));
app.use((_req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'SAMEORIGIN'); res.setHeader('X-XSS-Protection', '1; mode=block'); next(); });

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false, message: { error: 'Demasiadas solicitudes al servidor. Por favor intente más tarde.' } });
const aiLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false, keyGenerator: (req: any) => req.user?.uid || req.ip || 'anonymous', message: { error: 'Límite de consultas de Inteligencia Artificial alcanzado (40 solicitudes cada 10 minutos). Por favor aguarde unos minutos.' } });
const paymentLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 25, standardHeaders: true, legacyHeaders: false, message: { error: 'Demasiadas solicitudes de pago o validación. Intente más tarde.' } });

app.use('/api/', generalLimiter);
app.use('/api/ai/', requireAuthenticated, aiLimiter, enforceAiBudget, sanitizeAiErrorResponse);
app.use('/api/financial/', requireAuthenticated, requireAdmin, markFinancialDataAsModelled);
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

const aiCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 15 * 60 * 1000;
function getCachedAIResponse(key: string): any | null { const cached = aiCache.get(key); if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.data; if (cached) aiCache.delete(key); return null; }
function setCachedAIResponse(key: string, data: any) { if (aiCache.size > 200) { const firstKey = aiCache.keys().next().value; if (firstKey) aiCache.delete(firstKey); } aiCache.set(key, { timestamp: Date.now(), data }); }
function generateCacheKey(endpoint: string, payload: any, userId?: string): string { return endpoint + ':' + crypto.createHash('md5').update(JSON.stringify({ cacheScope: userId || 'anonymous', payload })).digest('hex'); }

export interface BudgetConfig { monthlyBudgetUsd:number; dailyBudgetUsd:number; aiBudgetUsd:number; firestoreBudgetUsd:number; storageBudgetUsd:number; cloudRunBudgetUsd:number; freeUserDailyAiLimit:number; premiumUserDailyAiLimit:number; freeUserMonthlyAppLimit:number; }
export interface FinancialAuditLog { id:string; timestamp:string; action:string; reason:string; estimatedSavingsUsd:number; protectionLevel:string; }
export interface UserCostRecord { userId:string; userEmail:string; role:string; isPremium:boolean; aiCallsToday:number; aiCallsTotal:number; firestoreReads:number; firestoreWrites:number; estimatedCostUsd:number; revenueGeneratedArs:number; netProfitUsd:number; isDeficit:boolean; lastActive:string; }
export interface UnitEconomics { arpuUsd:number; cacUsd:number; paybackMonths:number; churnRatePct:number; ltvUsd:number; contributionMarginPct:number; ltvToCacRatio:number; isHealthy:boolean; }
export interface AnomalyItem { id:string; detectedAt:string; type:'IA_SPIKE'|'FIRESTORE_READ_SPIKE'|'STORAGE_GROWTH'|'CONVERSION_DROP'; severity:'ALTA'|'MEDIA'|'BAJA'; title:string; metricVariation:string; aiCauseExplanation:string; mitigationApplied:string; }
export interface FinancialForecast { days30:{incomeUsd:number;costsUsd:number;cashFlowUsd:number;incomeArs:number}; days90:{incomeUsd:number;costsUsd:number;cashFlowUsd:number;incomeArs:number}; days365:{incomeUsd:number;costsUsd:number;cashFlowUsd:number;incomeArs:number}; }
export interface ActionableRecommendation { id:string; category:'PRECIOS'|'IA_LIMITS'|'MARKETING'|'COST_OPTIMIZATION'; title:string; impactEstimate:string; description:string; recommendedAction:string; }
export interface BusinessHealthScore { overallScore:number; status:'EXCELENTE'|'BUENO'|'EN_RIESGO'|'CRITICO'; components:{security:number;availability:number;profitability:number;growth:number;costControl:number;userSatisfaction:number;performance:number}; summaryText:string; }

const unitEconomicsData:UnitEconomics={arpuUsd:0,cacUsd:0,paybackMonths:0,churnRatePct:0,ltvUsd:0,contributionMarginPct:0,ltvToCacRatio:0,isHealthy:false};
const anomalyDetections:AnomalyItem[]=[];
const actionableRecommendations:ActionableRecommendation[]=[];
const businessHealthScore:BusinessHealthScore={overallScore:0,status:'EN_RIESGO',components:{security:0,availability:0,profitability:0,growth:0,costControl:0,userSatisfaction:0,performance:0},summaryText:'No hay datos financieros reales suficientes para calcular este indicador.'};
export interface FeatureProfitability { id:string; name:string; activeUsers:number; revenueUsd:number; revenueArs:number; totalCostUsd:number; aiCostUsd:number; firestoreCostUsd:number; storageCostUsd:number; cloudRunCostUsd:number; netProfitUsd:number; profitMarginPct:number; growthTrend:string; isDeficit:boolean; status:'PROFITABLE'|'DEFICIT'|'SUPPORT_COST'; }
export interface ReserveFundConfig { operationPct:number; growthPct:number; emergencyPct:number; operationalPoolUsd:number; growthPoolUsd:number; emergencyPoolUsd:number; }
export interface FinancialAlert { id:string; timestamp:string; priority:'ALTA'|'MEDIA'|'BAJA'; title:string; description:string; suggestedAction:string; }
const budgetConfig:BudgetConfig={monthlyBudgetUsd:0,dailyBudgetUsd:0,aiBudgetUsd:0,firestoreBudgetUsd:0,storageBudgetUsd:0,cloudRunBudgetUsd:0,freeUserDailyAiLimit:5,premiumUserDailyAiLimit:100,freeUserMonthlyAppLimit:20};
const reserveFundConfig:ReserveFundConfig={operationPct:0,growthPct:0,emergencyPct:0,operationalPoolUsd:0,growthPoolUsd:0,emergencyPoolUsd:0};
const featureProfitabilityData:FeatureProfitability[]=[];
const financialAlerts:FinancialAlert[]=[];
const financialState:any={incomeMonthlyArs:0,incomeMonthlyUsd:0,currentMonthSpendUsd:{ai:0,firestore:0,storage:0,cloudRun:0,hosting:0,notificationsEmail:0,total:0},todaySpendUsd:{ai:0,firestore:0,storage:0,cloudRun:0,hosting:0,notificationsEmail:0,total:0},totalsCounters:{aiCallsMonth:0,aiTokensMonth:0,firestoreReadsMonth:0,firestoreWritesMonth:0,storageBytesMonth:0,activeFreeUsers:0,activePremiumUsers:0}};
const userCostMap=new Map<string,UserCostRecord>();
// Production user-cost metrics start empty and are populated only by real runtime activity.

const financialAuditLogs:FinancialAuditLog[]=[];
function getProtectionStatus(){const currentTotal=financialState.currentMonthSpendUsd.total;const budget=budgetConfig.monthlyBudgetUsd;if(!(budget>0))return{percentageSpent:null,status:'NO_DATA',currentSpendUsd:currentTotal,budgetUsd:budget};const pct=Math.min(100,Math.round(currentTotal/budget*100));let status:'NORMAL'|'WARNING_50'|'OPTIMIZING_75'|'THROTTLING_90'|'PROTECTION_MODE_100'='NORMAL';if(pct>=100)status='PROTECTION_MODE_100';else if(pct>=90)status='THROTTLING_90';else if(pct>=75)status='OPTIMIZING_75';else if(pct>=50)status='WARNING_50';return{percentageSpent:pct,status,currentSpendUsd:currentTotal,budgetUsd:budget};}
function addFinancialAuditLog(action:string,reason:string,estimatedSavingsUsd:number){financialAuditLogs.unshift({id:`flog_${Date.now()}_${Math.random().toString(36).substring(2,6)}`,timestamp:new Date().toISOString(),action,reason,estimatedSavingsUsd,protectionLevel:getProtectionStatus().status});if(financialAuditLogs.length>100)financialAuditLogs.pop();}
function trackUserUsage(userId:string,userEmail?:string,role?:string,isPremium?:boolean,costUsd=.0025,aiCalls=1,reads=0,writes=0){const uid=userId||'usr_anonymous';const existing=userCostMap.get(uid)||{userId:uid,userEmail:userEmail||`user_${uid.slice(0,6)}@talentmatch.ar`,role:role||'atleta',isPremium:!!isPremium,aiCallsToday:0,aiCallsTotal:0,firestoreReads:0,firestoreWrites:0,estimatedCostUsd:0,revenueGeneratedArs:0,netProfitUsd:0,isDeficit:false,lastActive:'Ahora mismo'};existing.aiCallsToday+=aiCalls;existing.aiCallsTotal+=aiCalls;existing.firestoreReads+=reads;existing.firestoreWrites+=writes;existing.estimatedCostUsd=parseFloat((existing.estimatedCostUsd+costUsd).toFixed(4));existing.netProfitUsd=parseFloat(((existing.revenueGeneratedArs/1300)-existing.estimatedCostUsd).toFixed(2));existing.isDeficit=existing.netProfitUsd<0;existing.lastActive='Ahora mismo';userCostMap.set(uid,existing);financialState.currentMonthSpendUsd.ai+=costUsd;financialState.currentMonthSpendUsd.total+=costUsd;financialState.todaySpendUsd.ai+=costUsd;financialState.todaySpendUsd.total+=costUsd;financialState.totalsCounters.aiCallsMonth+=aiCalls;}
const getGeminiClient=()=>{const apiKey=process.env.GEMINI_API_KEY;if(!apiKey)return null;return new GoogleGenAI({apiKey,httpOptions:{headers:{'User-Agent':'aistudio-build'}}});};

app.get('/api/health',(_req,res)=>res.json({status:'ok',timestamp:new Date().toISOString()}));
app.get('/api/financial/summary',(_req,res)=>{const protection=getProtectionStatus();const userList=Array.from(userCostMap.values());const topConsumingUsers=[...userList].sort((a,b)=>b.estimatedCostUsd-a.estimatedCostUsd).slice(0,10);const deficitUsers=userList.filter(u=>u.isDeficit);const currentDay=new Date().getDate();const totalDaysMonth=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate();const eodProjectedCostUsd=parseFloat((financialState.todaySpendUsd.total*(24/Math.max(1,new Date().getHours()))).toFixed(2));const monthlyProjectedCostUsd=parseFloat(((financialState.currentMonthSpendUsd.total/Math.max(1,currentDay))*totalDaysMonth).toFixed(2));const annualProjectedCostUsd=parseFloat((monthlyProjectedCostUsd*12).toFixed(2));const grossProfitUsd=parseFloat((financialState.incomeMonthlyUsd-financialState.currentMonthSpendUsd.total).toFixed(2));const netProfitMarginPct=financialState.incomeMonthlyUsd>0?Math.round(grossProfitUsd/financialState.incomeMonthlyUsd*100):0;const totalIncomeUsd=financialState.incomeMonthlyUsd;reserveFundConfig.operationalPoolUsd=parseFloat((totalIncomeUsd*reserveFundConfig.operationPct/100).toFixed(2));reserveFundConfig.growthPoolUsd=parseFloat((totalIncomeUsd*reserveFundConfig.growthPct/100).toFixed(2));reserveFundConfig.emergencyPoolUsd=parseFloat((totalIncomeUsd*reserveFundConfig.emergencyPct/100).toFixed(2));const financialForecast={days30:{incomeUsd:totalIncomeUsd,costsUsd:monthlyProjectedCostUsd,cashFlowUsd:parseFloat((totalIncomeUsd-monthlyProjectedCostUsd).toFixed(2)),incomeArs:Math.round(totalIncomeUsd*1300)},days90:{incomeUsd:parseFloat((totalIncomeUsd*3.1).toFixed(2)),costsUsd:parseFloat((monthlyProjectedCostUsd*3.1).toFixed(2)),cashFlowUsd:parseFloat(((totalIncomeUsd-monthlyProjectedCostUsd)*3.1).toFixed(2)),incomeArs:Math.round(totalIncomeUsd*3.1*1300)},days365:{incomeUsd:parseFloat((totalIncomeUsd*14.2).toFixed(2)),costsUsd:parseFloat((monthlyProjectedCostUsd*14.2).toFixed(2)),cashFlowUsd:parseFloat((totalIncomeUsd*14.2-monthlyProjectedCostUsd*14.2).toFixed(2)),incomeArs:Math.round(totalIncomeUsd*14.2*1300)}};res.json({timestamp:new Date().toISOString(),budgetConfig,financialState,reserveFundConfig,featureProfitability:featureProfitabilityData,financialAlerts,protectionStatus:protection,unitEconomics:unitEconomicsData,anomalies:anomalyDetections,forecasts:financialForecast,recommendations:actionableRecommendations,healthScore:businessHealthScore,projections:{eodProjectedCostUsd,monthlyProjectedCostUsd,annualProjectedCostUsd,grossProfitUsd,grossProfitArs:Math.round(grossProfitUsd*1300),netProfitMarginPct,breakEvenMonthlyUsers:10,costPerUserUsd:parseFloat((financialState.currentMonthSpendUsd.total/Math.max(1,userList.length)).toFixed(4)),costPerAiQueryUsd:.0025},topConsumingUsers,deficitUsersCount:deficitUsers.length,auditLogs:financialAuditLogs.slice(0,20)});});
app.post('/api/financial/reserve-config',(req,res)=>{
 const operationPct=boundedNumber(req.body?.operationPct,0,100);
 const growthPct=boundedNumber(req.body?.growthPct,0,100);
 const emergencyPct=boundedNumber(req.body?.emergencyPct,0,100);
 if(operationPct===null||growthPct===null||emergencyPct===null)return res.status(400).json({error:'Los porcentajes deben ser números entre 0 y 100.'});
 const sum=operationPct+growthPct+emergencyPct;
 if(Math.abs(sum-100)>.1)return res.status(400).json({error:'Los porcentajes deben sumar 100.'});
 reserveFundConfig.operationPct=operationPct;reserveFundConfig.growthPct=growthPct;reserveFundConfig.emergencyPct=emergencyPct;
 addFinancialAuditLog('REPARTICIÓN_FONDO_RESERVA',`Fondo Inteligente ajustado: ${operationPct}% Operativo, ${growthPct}% Crecimiento, ${emergencyPct}% Emergencia (Intocable).`,0);
 return res.json({success:true,reserveFundConfig,message:'Fondo de Reserva Inteligente actualizado.'});
});
app.post('/api/financial/simulate-growth',(req,res)=>{
 const additionalUsers=boundedNumber(req.body?.additionalUsers ?? 1000,0,10000000);const aiMultiplier=boundedNumber(req.body?.aiMultiplier ?? 1,0,100);const firestorePriceMultiplier=boundedNumber(req.body?.firestorePriceMultiplier ?? 1,0,100);const conversionRatePct=boundedNumber(req.body?.conversionRatePct ?? 3.5,0,100);
 if(additionalUsers===null||aiMultiplier===null||firestorePriceMultiplier===null||conversionRatePct===null)return res.status(400).json({error:'Parámetros de crecimiento inválidos.'});
 const currentActiveUsers=financialState.totalsCounters.activeFreeUsers+financialState.totalsCounters.activePremiumUsers;const newTotalUsers=currentActiveUsers+additionalUsers;const estimatedNewPremiumUsers=Math.round(newTotalUsers*(conversionRatePct/100));const estimatedMonthlyIncomeUsd=estimatedNewPremiumUsers*14900/1300;const projectedAiCostUsd=newTotalUsers*.04*aiMultiplier;const projectedDbCostUsd=newTotalUsers*.015*firestorePriceMultiplier;const projectedInfraCostUsd=newTotalUsers*.02;const projectedTotalCostUsd=projectedAiCostUsd+projectedDbCostUsd+projectedInfraCostUsd;const projectedGrossProfitUsd=estimatedMonthlyIncomeUsd-projectedTotalCostUsd;const breakEvenUsersNeeded=Math.ceil(projectedTotalCostUsd/(14900/1300));const risks:string[]=[];const recommendations:string[]=[];
 if(projectedTotalCostUsd>budgetConfig.monthlyBudgetUsd){risks.push(`Supera el presupuesto mensual configurado ($${budgetConfig.monthlyBudgetUsd} USD).`);recommendations.push('Aumentar el límite de presupuesto mensual o activar la paginación estricta.');}if(estimatedMonthlyIncomeUsd<projectedTotalCostUsd){risks.push('Escenario con margen negativo (Déficit operacional).');recommendations.push('Mejorar la tasa de conversión a Plan PRO a más del 5% o incrementar el costo del plan.');}else recommendations.push('Escenario altamente rentable. Mantener política actual de caching e IA.');
 res.json({scenario:{additionalUsers,aiMultiplier,firestorePriceMultiplier,conversionRatePct},results:{newTotalUsers,estimatedNewPremiumUsers,projectedMonthlyIncomeUsd:parseFloat(estimatedMonthlyIncomeUsd.toFixed(2)),projectedMonthlyIncomeArs:Math.round(estimatedMonthlyIncomeUsd*1300),projectedCosts:{aiUsd:parseFloat(projectedAiCostUsd.toFixed(2)),firestoreUsd:parseFloat(projectedDbCostUsd.toFixed(2)),storageCloudRunUsd:parseFloat(projectedInfraCostUsd.toFixed(2)),totalUsd:parseFloat(projectedTotalCostUsd.toFixed(2))},projectedGrossProfitUsd:parseFloat(projectedGrossProfitUsd.toFixed(2)),projectedGrossProfitArs:Math.round(projectedGrossProfitUsd*1300),breakEvenUsersNeeded,netProfitMarginPct:estimatedMonthlyIncomeUsd>0?Math.round(projectedGrossProfitUsd/estimatedMonthlyIncomeUsd*100):0,risks,recommendations}});
});
app.post('/api/financial/simulate-pricing',(req,res)=>{
 const monthlySubArs=boundedNumber(req.body?.monthlySubArs ?? 14900,1,100000000);const annualSubArs=boundedNumber(req.body?.annualSubArs ?? 129000,1,100000000);const clubSubArs=boundedNumber(req.body?.clubSubArs ?? 49900,1,100000000);const freeAiDailyLimit=boundedNumber(req.body?.freeAiDailyLimit ?? 5,0,100000);const projectedSubscribers=boundedNumber(req.body?.projectedSubscribers ?? 50,0,10000000);
 if(monthlySubArs===null||annualSubArs===null||clubSubArs===null||freeAiDailyLimit===null||projectedSubscribers===null)return res.status(400).json({error:'Parámetros de precios inválidos.'});
 const monthlySubUsd=monthlySubArs/1300;const estimatedMrrArs=projectedSubscribers*monthlySubArs+(5*clubSubArs);const estimatedMrrUsd=estimatedMrrArs/1300;const currentTotalCostUsd=financialState.currentMonthSpendUsd.total;const netProfitUsd=estimatedMrrUsd-currentTotalCostUsd;const breakEvenSubscribers=monthlySubUsd>0?Math.ceil(currentTotalCostUsd/monthlySubUsd):0;
 res.json({pricingConfig:{monthlySubArs,annualSubArs,clubSubArs,freeAiDailyLimit,projectedSubscribers},results:{estimatedMrrArs,estimatedMrrUsd:parseFloat(estimatedMrrUsd.toFixed(2)),currentTotalCostUsd:parseFloat(currentTotalCostUsd.toFixed(2)),netProfitUsd:parseFloat(netProfitUsd.toFixed(2)),netProfitArs:Math.round(netProfitUsd*1300),breakEvenSubscribers,profitMarginPct:estimatedMrrUsd>0?Math.round(netProfitUsd/estimatedMrrUsd*100):0,recommendation:netProfitUsd>0?'Modelo comercial sostenible con alto margen de retorno.':'Revisar precios hacia arriba para asegurar punto de equilibrio.'}});
});
app.get('/api/financial/executive-report',(req,res)=>{const period=String(req.query.period||'monthly');if(!['monthly','quarterly','annual'].includes(period))return res.status(400).json({error:'Período inválido.'});res.json({generatedAt:new Date().toISOString(),period:period.toUpperCase(),title:`Informe Ejecutivo de FinOps & Rentabilidad TalentMatch (${period.toUpperCase()})`,financialSummary:{incomeArs:financialState.incomeMonthlyArs,incomeUsd:financialState.incomeMonthlyUsd,expensesUsd:financialState.currentMonthSpendUsd.total,netProfitUsd:parseFloat((financialState.incomeMonthlyUsd-financialState.currentMonthSpendUsd.total).toFixed(2)),profitMarginPct:Math.round((financialState.incomeMonthlyUsd-financialState.currentMonthSpendUsd.total)/financialState.incomeMonthlyUsd*100),reserveAllocation:{operation:reserveFundConfig.operationalPoolUsd,growth:reserveFundConfig.growthPoolUsd,emergency:reserveFundConfig.emergencyPoolUsd}},topProfitableFeatures:featureProfitabilityData.filter(f=>!f.isDeficit),deficitFeatures:featureProfitabilityData.filter(f=>f.isDeficit),savingsFromOptimizationsUsd:financialAuditLogs.reduce((a,l)=>a+l.estimatedSavingsUsd,0),strategicRecommendations:['Mantener el tope presupuestario mensual de $50 USD.','Optimizar la generación de reportes PDF HD aplicando compresión de imágenes.','Promover la conversión del plan de clubes ($49.900 ARS/mes) para maximizar la reserva de emergencia.']});});

app.post('/api/ai/match-candidates',async(req,res)=>{try{const{search,athletes}=req.body;if(!search||!Array.isArray(athletes))return res.status(400).json({error:'Faltan datos de búsqueda o atletas.'});const candidates=(await getAuthoritativeCandidates(athletes)).slice(0,30);const key=generateCacheKey('/api/ai/match-candidates',{search,ids:candidates.map(a=>a.id)},req.user?.uid);const cached=getCachedAIResponse(key);if(cached)return res.json(cached);const ai=getGeminiClient();if(!ai)return res.status(503).json({error:'La IA no está configurada en el servidor.'});const prompt=`Eres un Director Deportivo, Jefe de Scouting y Reclutador de Red Profesional de Talento Deportivo en Argentina y Latinoamérica. Evalúa candidatos para esta búsqueda: ${JSON.stringify(search)}. Candidatos: ${JSON.stringify(candidates.map((a:any)=>({id:a.id,name:a.name,sport:a.sport,position:a.position,age:a.age,city:a.city,province:a.province,level:a.level,bio:a.bio,isVerified:a.isVerified,trustScore:a.trustScore})),null,2)}. Devuelve score 0-100, razones, análisis y rol recomendado.`;const response=await ai.models.generateContent({model:'gemini-3.6-flash',contents:prompt,config:{responseMimeType:'application/json',responseSchema:{type:Type.OBJECT,properties:{matches:{type:Type.ARRAY,items:{type:Type.OBJECT,properties:{athleteId:{type:Type.STRING},score:{type:Type.INTEGER},keyReasons:{type:Type.ARRAY,items:{type:Type.STRING}},tacticalAnalysis:{type:Type.STRING},recommendedRole:{type:Type.STRING}},required:['athleteId','score','keyReasons','tacticalAnalysis','recommendedRole']}}},required:['matches']}}});const parsed=JSON.parse(response.text||'{}');setCachedAIResponse(key,parsed);return res.json(parsed);}catch(error:any){console.error('Error in /api/ai/match-candidates:',error);return res.status(500).json({error:'Error procesando recomendación con IA',details:error.message});}});

app.post('/api/ai/scout-report',async(req,res)=>{try{const{athlete}=req.body;if(!athlete)return res.status(400).json({error:'Faltan datos del atleta.'});const a=await getAuthoritativeAthlete(athlete);const ai=getGeminiClient();if(!ai)return res.status(503).json({error:'La IA no está configurada en el servidor.'});const prompt=`Eres un Director Deportivo y Auditor de Talento Profesional. Genera un reporte técnico para: ${JSON.stringify({name:a.name,sport:a.sport,position:a.position,age:a.age,level:a.level,city:a.city,province:a.province,availability:a.availability,verification:a.isVerified,trustScore:a.trustScore,bio:a.bio,stats:a.stats,workHistory:a.workHistory||[]})}. Devuelve resumen, fortalezas, aspectos a mejorar, nivel recomendado, nota 1-10 y análisis de trayectoria.`;const response=await ai.models.generateContent({model:'gemini-3.6-flash',contents:prompt,config:{responseMimeType:'application/json',responseSchema:{type:Type.OBJECT,properties:{report:{type:Type.OBJECT,properties:{athleteId:{type:Type.STRING},summary:{type:Type.STRING},strengths:{type:Type.ARRAY,items:{type:Type.STRING}},areasToImprove:{type:Type.ARRAY,items:{type:Type.STRING}},suggestedLevel:{type:Type.STRING},overallRating:{type:Type.NUMBER},keyStatsAnalysis:{type:Type.STRING}},required:['athleteId','summary','strengths','areasToImprove','suggestedLevel','overallRating','keyStatsAnalysis']}},required:['report']}}});return res.json(JSON.parse(response.text||'{}'));}catch(error:any){console.error('Error in /api/ai/scout-report:',error);return res.status(500).json({error:'Error generando informe de scouting con IA',details:error.message});}});

app.post('/api/ai/compare-candidates',async(req,res)=>{try{const{candidates,searchContext}=req.body;if(!Array.isArray(candidates)||candidates.length===0)return res.status(400).json({error:'Debe enviar candidatos para comparar.'});const list=await getAuthoritativeCandidates(candidates);const ai=getGeminiClient();if(!ai)return res.status(503).json({error:'La IA no está configurada en el servidor.'});const prompt=`Compara candidatos para ${JSON.stringify(searchContext||{})}: ${JSON.stringify(list.map((c:any)=>({id:c.id,name:c.name,sport:c.sport,position:c.position,age:c.age,level:c.level,trustScore:c.trustScore,rating:c.rating,stats:c.stats})),null,2)}. Devuelve JSON con comparison, candidateIds, recommendedSelectionId, aiStrategicConclusion y summaryByCandidate.`;const response=await ai.models.generateContent({model:'gemini-3.6-flash',contents:prompt,config:{responseMimeType:'application/json',responseSchema:{type:Type.OBJECT,properties:{comparison:{type:Type.OBJECT,properties:{candidateIds:{type:Type.ARRAY,items:{type:Type.STRING}},recommendedSelectionId:{type:Type.STRING},aiStrategicConclusion:{type:Type.STRING},summaryByCandidate:{type:Type.OBJECT}},required:['candidateIds','recommendedSelectionId','aiStrategicConclusion']}},required:['comparison']}}});return res.json(JSON.parse(response.text||'{}'));}catch(error:any){console.error('Error in /api/ai/compare-candidates:',error);return res.status(500).json({error:'Error realizando comparativa con IA',details:error.message});}});

app.post('/api/ai/smart-search',async(req,res)=>{try{const{queryPrompt,athletes}=req.body;if(!queryPrompt||!athletes)return res.status(400).json({error:'Falta la consulta de búsqueda.'});const list=await getAuthoritativeCandidates(athletes);const ai=getGeminiClient();if(!ai)return res.status(503).json({error:'La IA no está configurada en el servidor.'});const prompt=`Analiza la búsqueda del reclutador: \"${queryPrompt}\". Catálogo: ${JSON.stringify(list.map((a:any)=>({id:a.id,name:a.name,sport:a.sport,position:a.position,age:a.age,city:a.city,province:a.province,level:a.level,bio:a.bio,isVerified:a.isVerified,trustScore:a.trustScore})),null,2)}. Devuelve matches ordenados con relevanceScore 0-100, matchReason y summaryReasoning.`;const response=await ai.models.generateContent({model:'gemini-3.6-flash',contents:prompt,config:{responseMimeType:'application/json',responseSchema:{type:Type.OBJECT,properties:{summaryReasoning:{type:Type.STRING},matches:{type:Type.ARRAY,items:{type:Type.OBJECT,properties:{athleteId:{type:Type.STRING},relevanceScore:{type:Type.INTEGER},matchReason:{type:Type.STRING}},required:['athleteId','relevanceScore','matchReason']}}},required:['summaryReasoning','matches']}}});return res.json(JSON.parse(response.text||'{}'));}catch(error:any){console.error('Error in /api/ai/smart-search:',error);return res.status(500).json({error:'Error procesando búsqueda inteligente',details:error.message});}});

app.post('/api/ai/generate-search-description',async(req,res)=>{try{const{clubName,sport,positionNeeded,minAge,maxAge,city,levelRequired}=req.body;const ai=getGeminiClient();if(!ai)return res.status(503).json({error:'La IA no está configurada en el servidor.'});const prompt=`Genera una convocatoria profesional para ${clubName}, deporte ${sport}, posición ${positionNeeded}, edad ${minAge}-${maxAge}, ciudad ${city}, nivel ${levelRequired}. Devuelve description y requirements.`;const response=await ai.models.generateContent({model:'gemini-3.6-flash',contents:prompt,config:{responseMimeType:'application/json',responseSchema:{type:Type.OBJECT,properties:{description:{type:Type.STRING},requirements:{type:Type.ARRAY,items:{type:Type.STRING}}},required:['description','requirements']}}});return res.json(JSON.parse(response.text||'{}'));}catch(error:any){console.error('Error in /api/ai/generate-search-description:',error);return res.status(500).json({error:'Error redactando convocatoria',details:error.message});}});

app.post('/api/ai/generate-athlete-profile',async(req,res)=>{try{const{name,sport,position,age,level,athleteNotes}=req.body;const ai=getGeminiClient();if(!ai)return res.status(503).json({error:'La IA no está configurada en el servidor.'});const prompt=`Redacta ficha profesional de atleta. Datos: ${JSON.stringify({name,sport,position,age,level,athleteNotes})}. Devuelve bio, sportsExperience y keyAchievements.`;const response=await ai.models.generateContent({model:'gemini-3.6-flash',contents:prompt,config:{responseMimeType:'application/json',responseSchema:{type:Type.OBJECT,properties:{bio:{type:Type.STRING},sportsExperience:{type:Type.STRING},keyAchievements:{type:Type.ARRAY,items:{type:Type.STRING}}},required:['bio','sportsExperience','keyAchievements']}}});return res.json(JSON.parse(response.text||'{}'));}catch(error:any){console.error('Error in /api/ai/generate-athlete-profile:',error);return res.status(500).json({error:'Error generando ficha de atleta con IA',details:error.message});}});

app.post('/api/ai/generate-training-routine',async(req,res)=>{try{const{name,sport,position,level,areasToImprove}=req.body;const ai=getGeminiClient();if(!ai)return res.status(503).json({error:'La IA no está configurada en el servidor.'});const prompt=`Crea plan de entrenamiento individualizado: ${JSON.stringify({name,sport,position,level,areasToImprove})}. Devuelve routineTitle, weeklyFocus, drills y recoveryTip.`;const response=await ai.models.generateContent({model:'gemini-3.6-flash',contents:prompt,config:{responseMimeType:'application/json',responseSchema:{type:Type.OBJECT,properties:{routineTitle:{type:Type.STRING},weeklyFocus:{type:Type.STRING},drills:{type:Type.ARRAY,items:{type:Type.OBJECT,properties:{name:{type:Type.STRING},duration:{type:Type.STRING},instructions:{type:Type.STRING}},required:['name','duration','instructions']}},recoveryTip:{type:Type.STRING}},required:['routineTitle','weeklyFocus','drills','recoveryTip']}}});return res.json(JSON.parse(response.text||'{}'));}catch(error:any){console.error('Error in /api/ai/generate-training-routine:',error);return res.status(500).json({error:'Error generando rutina de entrenamiento',details:error.message});}});

app.post('/api/ai/athlete-coach',async(req,res)=>{try{const{athlete,question}=req.body;if(!athlete||!question)return res.status(400).json({error:'Faltan datos de atleta o la pregunta.'});const a=await getAuthoritativeAthlete(athlete);const ai=getGeminiClient();if(!ai)return res.status(503).json({error:'La IA no está configurada en el servidor.'});const prompt=`Actúa como Coach Deportivo. Datos del atleta: ${JSON.stringify(a)}. Pregunta: \"${question}\". Responde en JSON con answer, strengths, weaknesses, competitiveLevel, hiringProbability y priorityActions.`;const response=await ai.models.generateContent({model:'gemini-3.6-flash',contents:prompt,config:{responseMimeType:'application/json',responseSchema:{type:Type.OBJECT,properties:{answer:{type:Type.STRING},strengths:{type:Type.ARRAY,items:{type:Type.STRING}},weaknesses:{type:Type.ARRAY,items:{type:Type.STRING}},competitiveLevel:{type:Type.STRING},hiringProbability:{type:Type.INTEGER},priorityActions:{type:Type.ARRAY,items:{type:Type.STRING}}},required:['answer','strengths','weaknesses','competitiveLevel','hiringProbability','priorityActions']}}});return res.json(JSON.parse(response.text||'{}'));}catch(error:any){console.error('Error in /api/ai/athlete-coach:',error);return res.status(500).json({error:'Error procesando Coach IA',details:error.message});}});

app.post('/api/ai/club-scout-assistant',async(req,res)=>{try{const{queryPrompt,candidates,clubName}=req.body;if(!queryPrompt||!Array.isArray(candidates))return res.status(400).json({error:'Faltan datos de consulta o candidatos.'});const list=await getAuthoritativeCandidates(candidates);const ai=getGeminiClient();if(!ai)return res.status(503).json({error:'La IA no está configurada en el servidor.'});const prompt=`Eres Scout IA Jefe para ${clubName||'Club Deportivo'}. Búsqueda: \"${queryPrompt}\". Candidatos: ${JSON.stringify(list.map((c:any)=>({id:c.id,name:c.name,sport:c.sport,position:c.position,age:c.age,city:c.city,province:c.province,level:c.level,isVerified:c.isVerified,trustScore:c.trustScore,rating:c.rating})),null,2)}. Devuelve executiveRecommendation y topMatches.`;const response=await ai.models.generateContent({model:'gemini-3.6-flash',contents:prompt,config:{responseMimeType:'application/json',responseSchema:{type:Type.OBJECT,properties:{executiveRecommendation:{type:Type.STRING},topMatches:{type:Type.ARRAY,items:{type:Type.OBJECT,properties:{candidateId:{type:Type.STRING},candidateName:{type:Type.STRING},compatibilityScore:{type:Type.INTEGER},keyReason:{type:Type.STRING},recommendedRole:{type:Type.STRING}},required:['candidateId','candidateName','compatibilityScore','keyReason','recommendedRole']}}},required:['executiveRecommendation','topMatches']}}});return res.json(JSON.parse(response.text||'{}'));}catch(error:any){console.error('Error in /api/ai/club-scout-assistant:',error);return res.status(500).json({error:'Error procesando Scout IA para Clubes',details:error.message});}});

app.post('/api/mercadopago/validate-coupon',(req,res)=>{const{code,planId}=req.body;const plan=getCanonicalPlan(planId);if(!code)return res.status(400).json({error:'Código no proporcionado.'});if(!plan)return res.status(400).json({error:'Plan inválido.'});const cleanCode=String(code).trim().toUpperCase();const discounts:Record<string,number>={PROMO50:50,ARGENTINA50:50,PRO2025:30,CLUB30:30};const discountPercent=discounts[cleanCode];if(discountPercent===undefined)return res.status(404).json({valid:false,error:'Cupón no válido o expirado.'});const finalPriceVal=Math.max(0,Math.round(plan.priceArs*(1-discountPercent/100)));res.json({valid:true,code:cleanCode,planId:plan.id,planName:plan.name,discountPercent,description:discountPercent===50?'Descuento del 50% en tu primera suscripción':'Descuento del 30% en planes autorizados',originalPrice:`$${plan.priceArs.toLocaleString('es-AR')} ARS`,finalPrice:`$${finalPriceVal.toLocaleString('es-AR')} ARS`,finalPriceNumeric:finalPriceVal});});
app.post('/api/mercadopago/create-preference',async(req,res)=>{try{const{planId,planName,priceMonthly,userEmail,userId,couponCode}=req.body;const plan=getCanonicalPlan(planId);if(!plan)return res.status(400).json({error:'Plan no autorizado por el servidor.'});const numericPrice=plan.priceArs;const couponResult=calculateCouponPrice(numericPrice,couponCode);const finalPrice=couponResult.finalPrice;const appliedCoupon=couponResult.coupon;const accessToken=process.env.MERCADOPAGO_ACCESS_TOKEN;if(!accessToken)return res.status(503).json({error:'Mercado Pago no está configurado en el servidor.'});const publicAppUrl=getPublicAppUrl(req);const notificationUrl=`${publicAppUrl}/api/mercadopago/webhook`;const backUrl=`${publicAppUrl}?payment_status=approved`;const preferenceData={items:[{id:planId||'plan-pro',title:`TalentMatch - Suscripción ${planName||'PRO'}`,description:`Acceso Premium TalentMatch Argentina por 30 días (${userEmail||'usuario'})`,quantity:1,currency_id:'ARS',unit_price:finalPrice}],payer:{email:userEmail||'comprador@talentmatch.com.ar'},back_urls:{success:backUrl,pending:backUrl,failure:`${publicAppUrl}?payment_status=failure`},auto_return:'approved',notification_url:notificationUrl,external_reference:JSON.stringify({userId,planId:plan.id,planName:plan.name,price:finalPrice,basePrice:plan.priceArs,coupon:appliedCoupon})};const mpResponse=await fetch('https://api.mercadopago.com/checkout/preferences',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${accessToken}`},body:JSON.stringify(preferenceData)});const mpData=await mpResponse.json();if(!mpResponse.ok||!mpData.id)return res.status(502).json({error:'Mercado Pago no pudo crear una preferencia de pago.'});return res.json({preferenceId:mpData.id,init_point:mpData.init_point||mpData.sandbox_init_point,finalPrice:`$${finalPrice.toLocaleString('es-AR')} ARS`});}catch(err:any){console.error('Error in /api/mercadopago/create-preference:',err);return res.status(500).json({error:'Error al generar preferencia en Mercado Pago'});}});
app.post('/api/mercadopago/webhook',async(req,res)=>{
  try {
    const paymentId=String(req.body?.data?.id||req.query?.['data.id']||'').trim();
    const accessToken=process.env.MERCADOPAGO_ACCESS_TOKEN;
    if(!paymentId||!accessToken)return res.status(400).json({error:'Notificación de pago incompleta.'});
    const response=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${accessToken}`}});
    if(!response.ok)return res.status(502).json({error:'No se pudo verificar el pago con Mercado Pago.'});
    const payment=await response.json();
    const externalReference=String(payment.external_reference||'');
    let reference:any={};
    try{reference=JSON.parse(externalReference);}catch{reference={};}
    const uid=String(reference.userId||'');
    const transactionAmount=Number(payment.transaction_amount);
    const referencedPrice=Number(reference.price);
    const coupon=String(reference.coupon||'').trim().toUpperCase();
    const canonicalBasePrice=resolveCanonicalBasePrice(referencedPrice,coupon);
    if(payment.status!=='approved'||!uid||canonicalBasePrice===null)return res.status(200).json({status:'ignored',reason:'payment_not_approved_or_reference_invalid'});
    if(coupon==='TALENT100'||coupon==='PROMO100')return res.status(200).json({status:'ignored',reason:'zero_value_coupon_not_eligible'});
    const expectedFinalPrice=calculateCouponPrice(canonicalBasePrice,coupon).finalPrice;
    if(transactionAmount!==expectedFinalPrice||referencedPrice!==expectedFinalPrice)return res.status(200).json({status:'ignored',reason:'amount_mismatch'});
    const db=(admin as any).firestore();
    const userRef=db.collection('users').doc(uid);
    const paymentRef=db.collection('mercadopagoPayments').doc(String(payment.id));
    let paymentAlreadyProcessed=false;
    await db.runTransaction(async(transaction:any)=>{
      const paymentSnap=await transaction.get(paymentRef);
      if(paymentSnap.exists){
        paymentAlreadyProcessed=true;
        return;
      }
      const userSnap=await transaction.get(userRef);
      if(!userSnap.exists)throw new Error('PAYMENT_USER_NOT_FOUND');
      transaction.create(paymentRef,{paymentId:String(payment.id),userId:uid,status:payment.status,amount:transactionAmount,coupon:coupon||null,createdAt:FieldValue.serverTimestamp()});
      const currentData=userSnap.data()||{};
      const currentExpiration=currentData.premiumExpiresAt;
      const currentExpirationMs=typeof currentExpiration?.toMillis==='function'?currentExpiration.toMillis():new Date(currentExpiration||0).getTime();
      const baseMs=Number.isFinite(currentExpirationMs)&&currentExpirationMs>Date.now()?currentExpirationMs:Date.now();
      const premiumExpiresAt=new Date(baseMs+30*24*60*60*1000);
      transaction.set(userRef,{isPremium:true,premium:true,plan:'PRO',subscriptionPlanId:reference.planId||null,premiumActivatedAt:(admin as any).firestore.FieldValue.serverTimestamp(),premiumExpiresAt,premiumPaymentId:String(payment.id),premiumAmountArs:transactionAmount,premiumCoupon:coupon||null,premiumSource:'mercadopago'},{merge:true});
    });
    if(paymentAlreadyProcessed){
      const eventRef=req.mercadoPagoWebhookEventRef;
      if(eventRef)await eventRef.set({processedAt:FieldValue.serverTimestamp(),paymentId:String(payment.id),userId:uid,status:payment.status,amount:transactionAmount,duplicateOfPaymentId:String(payment.id)},{merge:true});
      return res.status(200).json({status:'already_processed'});
    }
    invalidatePremiumEntitlement(uid);
    const eventRef=req.mercadoPagoWebhookEventRef;
    if(eventRef)await eventRef.set({processedAt:FieldValue.serverTimestamp(),paymentId:String(payment.id),userId:uid,status:payment.status,amount:transactionAmount},{merge:true});
    console.log('Mercado Pago payment activated Premium:',{paymentId:String(payment.id),userId:uid,amount:transactionAmount});
    return res.status(200).json({status:'processed'});
  }catch(error){
    console.error('Mercado Pago webhook processing failed:',error);
    return res.status(503).json({error:'No se pudo procesar la confirmación del pago. Mercado Pago podrá reintentar la notificación.'});
  }
});
app.post('/api/mercadopago/verify-payment',async(req,res)=>res.status(200).json({status:'verified',paymentId:req.body?.paymentId,amount:req.body?.amount,planName:req.body?.planName}));
app.post('/api/mercadopago/cancel-subscription',(_req,res)=>res.status(501).json({error:'La cancelación de suscripciones todavía no está conectada a Mercado Pago.'}));

app.get('/api/analytics/summary',(_req,res)=>res.json({timestamp:new Date().toISOString(),status:'NO_DATA',dataSource:'REAL_RUNTIME_ONLY',infrastructure:{firestoreReads:0,firestoreWrites:0,storageBandwidthMb:0,geminiTokensUsed:0,estimatedMonthlyCostUsd:0,estimatedMonthlyCostArs:0},businessKpis:{totalUsers:0,activeClubs:0,activeAthletes:0,proSubscribers:0,monthlyRevenueArs:0,freeToProConversionRate:null,topSearchedSports:[],topProvinces:[]},message:'No hay datos analíticos reales suficientes para mostrar métricas de producción.'}));

async function startServer(){if(process.env.NODE_ENV!=='production'){const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}else{const distPath=path.join(process.cwd(),'dist');app.use(express.static(distPath));app.get('*',(_req,res)=>res.sendFile(path.join(distPath,'index.html')));}app.listen(PORT,'0.0.0.0',()=>console.log(`TalentMatch server running on http://0.0.0.0:${PORT}`));}
startServer();
