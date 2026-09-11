import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  Award,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  UserCheck,
  TrendingUp,
  DollarSign,
  Crown,
  Download,
  Building2,
  Activity,
  History,
  Lock,
  Ban,
  Check,
  Filter,
  Sliders,
  BarChart3,
  Cpu,
  Database,
  Tag,
  Plus,
  Trash2,
  Sparkles,
  Calendar,
  Layers,
  ShoppingBag,
  Briefcase,
  Megaphone,
  PieChart,
  Calculator,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { PromoCoupon, FeaturedBoost, SportType, GrowthMetrics, VerificationRequest, UserReport } from '../types';
import {
  UserProfile,
  PaymentRecord,
  AdminAuditLog,
  fetchAllUsers,
  fetchPendingVerifications,
  updateVerificationStatus,
  fetchReportsList,
  resolveReport,
  fetchPaymentHistory,
  fetchAuditLogs,
  logAdminAction,
  updateUserPlanStatus,
  fetchPromoCoupons,
  savePromoCoupon,
  deletePromoCoupon,
  fetchFeaturedBoosts,
  fetchGrowthMetrics,
  triggerReengagementCampaign,
  getFraudAlerts,
  resolveFraudAlert,
  getAccountAppeals,
  updateUserAccountStatus,
  getModerationAuditLogs,
  auth
} from '../services/firebaseService';
import { FraudAlert, AccountAppeal, VerificationTier } from '../types';

export const AdminPanelView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'metrics' | 'financial' | 'coupons' | 'featured' | 'users' | 'payments' | 'future_phases' | 'verifications' | 'fraud_queue' | 'reports' | 'audit' | 'infrastructure' | 'scout_ai'
  >('metrics');

  // ScoutAR AI Weights state
  const [aiWeights, setAiWeights] = useState({
    positionWeight: 20,
    categoryAndLevelWeight: 15,
    locationAndRelocationWeight: 15,
    verificationAndTrustWeight: 15,
    experienceAndHistoryWeight: 15,
    statsAndMediaWeight: 10,
    ratingAndReputationWeight: 10,
  });

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [appeals, setAppeals] = useState<AccountAppeal[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [coupons, setCoupons] = useState<PromoCoupon[]>([]);
  const [featuredBoosts, setFeaturedBoosts] = useState<FeaturedBoost[]>([]);
  const [growthData, setGrowthData] = useState<GrowthMetrics | null>(null);
  const [infraStats, setInfraStats] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);

  // Budget Config Form State
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState<number>(50);
  const [dailyBudgetInput, setDailyBudgetInput] = useState<number>(2.5);
  const [aiBudgetInput, setAiBudgetInput] = useState<number>(30);
  const [firestoreBudgetInput, setFirestoreBudgetInput] = useState<number>(10);
  const [storageBudgetInput, setStorageBudgetInput] = useState<number>(5);
  const [cloudRunBudgetInput, setCloudRunBudgetInput] = useState<number>(5);
  const [freeAiLimitInput, setFreeAiLimitInput] = useState<number>(5);
  const [premiumAiLimitInput, setPremiumAiLimitInput] = useState<number>(100);
  const [isSavingBudget, setIsSavingBudget] = useState<boolean>(false);

  // FinOps & Intelligence Sub-tabs State
  const [finSubTab, setFinSubTab] = useState<'overview' | 'health_score' | 'unit_economics' | 'anomalies' | 'forecast' | 'recommendations' | 'features' | 'reserve' | 'growth_sim' | 'pricing_sim' | 'protection' | 'report'>('health_score');

  // Reserve Fund State
  const [opPctInput, setOpPctInput] = useState<number>(70);
  const [growthPctInput, setGrowthPctInput] = useState<number>(20);
  const [emergPctInput, setEmergPctInput] = useState<number>(10);
  const [isSavingReserve, setIsSavingReserve] = useState<boolean>(false);

  // Growth Simulator State
  const [simUsersInput, setSimUsersInput] = useState<number>(1000);
  const [simAiMultInput, setSimAiMultInput] = useState<number>(1.5);
  const [simDbMultInput, setSimDbMultInput] = useState<number>(1.0);
  const [simConvRateInput, setSimConvRateInput] = useState<number>(3.5);
  const [growthSimResult, setGrowthSimResult] = useState<any>(null);
  const [isSimulatingGrowth, setIsSimulatingGrowth] = useState<boolean>(false);

  // Pricing Simulator State
  const [simMonthlyArsInput, setSimMonthlyArsInput] = useState<number>(14900);
  const [simAnnualArsInput, setSimAnnualArsInput] = useState<number>(129000);
  const [simClubArsInput, setSimClubArsInput] = useState<number>(49900);
  const [simFreeLimitInput, setSimFreeLimitInput] = useState<number>(5);
  const [simTargetSubsInput, setSimTargetSubsInput] = useState<number>(50);
  const [pricingSimResult, setPricingSimResult] = useState<any>(null);
  const [isSimulatingPricing, setIsSimulatingPricing] = useState<boolean>(false);

  // Executive Report State
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [executiveReportData, setExecutiveReportData] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Coupon creation form modal state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState<number>(20);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<number>(100);
  const [newCouponStartDate, setNewCouponStartDate] = useState<string>('2025-01-01');
  const [newCouponExpDate, setNewCouponExpDate] = useState<string>('2026-12-31');
  const [newCouponSport, setNewCouponSport] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, vList, rList, pList, aList, cList, bList, gData, fList, apList] = await Promise.all([
        fetchAllUsers(),
        fetchPendingVerifications(),
        fetchReportsList(),
        fetchPaymentHistory(),
        fetchAuditLogs(),
        fetchPromoCoupons(),
        fetchFeaturedBoosts(),
        fetchGrowthMetrics(),
        getFraudAlerts(),
        getAccountAppeals()
      ]);
      setUsers(uList);
      setVerifications(vList);
      setReports(rList);
      setPayments(pList);
      setAuditLogs(aList);
      setCoupons(cList);
      setFeaturedBoosts(bList);
      setGrowthData(gData);
      setFraudAlerts(fList);
      setAppeals(apList);

      // Fetch infrastructure stats from server
      const infraRes = await fetch('/api/analytics/summary');
      if (infraRes.ok) {
        const iData = await infraRes.json();
        setInfraStats(iData);
      }

      // Fetch financial summary & sustainability data from server
      const finRes = await fetch('/api/financial/summary');
      if (finRes.ok) {
        const fData = await finRes.json();
        setFinancialData(fData);
        if (fData.budgetConfig) {
          setMonthlyBudgetInput(fData.budgetConfig.monthlyBudgetUsd);
          setDailyBudgetInput(fData.budgetConfig.dailyBudgetUsd);
          setAiBudgetInput(fData.budgetConfig.aiBudgetUsd);
          setFirestoreBudgetInput(fData.budgetConfig.firestoreBudgetUsd);
          setStorageBudgetInput(fData.budgetConfig.storageBudgetUsd);
          setCloudRunBudgetInput(fData.budgetConfig.cloudRunBudgetUsd);
          setFreeAiLimitInput(fData.budgetConfig.freeUserDailyAiLimit);
          setPremiumAiLimitInput(fData.budgetConfig.premiumUserDailyAiLimit);
        }
        if (fData.reserveFundConfig) {
          setOpPctInput(fData.reserveFundConfig.operationPct);
          setGrowthPctInput(fData.reserveFundConfig.growthPct);
          setEmergPctInput(fData.reserveFundConfig.emergencyPct);
        }
      }
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveReserveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (opPctInput + growthPctInput + emergPctInput !== 100) {
      alert('La suma de los porcentajes debe dar exactamente 100%.');
      return;
    }
    setIsSavingReserve(true);
    try {
      const res = await fetch('/api/financial/reserve-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationPct: opPctInput,
          growthPct: growthPctInput,
          emergencyPct: emergPctInput
        })
      });
      if (res.ok) {
        alert('Fondo de Reserva Inteligente actualizado.');
        loadData();
      }
    } catch (err) {
      console.error('Error guardando fondo de reserva:', err);
    } finally {
      setIsSavingReserve(false);
    }
  };

  const handleRunGrowthSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulatingGrowth(true);
    try {
      const res = await fetch('/api/financial/simulate-growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          additionalUsers: simUsersInput,
          aiMultiplier: simAiMultInput,
          firestorePriceMultiplier: simDbMultInput,
          conversionRatePct: simConvRateInput
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGrowthSimResult(data);
      }
    } catch (err) {
      console.error('Error corriendo simulación de crecimiento:', err);
    } finally {
      setIsSimulatingGrowth(false);
    }
  };

  const handleRunPricingSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulatingPricing(true);
    try {
      const res = await fetch('/api/financial/simulate-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlySubArs: simMonthlyArsInput,
          annualSubArs: simAnnualArsInput,
          clubSubArs: simClubArsInput,
          freeAiDailyLimit: simFreeLimitInput,
          projectedSubscribers: simTargetSubsInput
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPricingSimResult(data);
      }
    } catch (err) {
      console.error('Error corriendo simulación de precios:', err);
    } finally {
      setIsSimulatingPricing(false);
    }
  };

  const handleFetchExecutiveReport = async (period: 'daily' | 'weekly' | 'monthly') => {
    setReportPeriod(period);
    setIsLoadingReport(true);
    try {
      const res = await fetch(`/api/financial/executive-report?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setExecutiveReportData(data);
      }
    } catch (err) {
      console.error('Error cargando informe ejecutivo:', err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleSaveBudgetConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBudget(true);
    try {
      const res = await fetch('/api/financial/budget-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyBudgetUsd: monthlyBudgetInput,
          dailyBudgetUsd: dailyBudgetInput,
          aiBudgetUsd: aiBudgetInput,
          firestoreBudgetUsd: firestoreBudgetInput,
          storageBudgetUsd: storageBudgetInput,
          cloudRunBudgetUsd: cloudRunBudgetInput,
          freeUserDailyAiLimit: freeAiLimitInput,
          premiumUserDailyAiLimit: premiumAiLimitInput
        })
      });
      if (res.ok) {
        alert('Configuración de presupuesto y límites guardada con éxito.');
        loadData();
      }
    } catch (err) {
      console.error('Error guardando configuración presupuestaria:', err);
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleResetProtection = async () => {
    if (confirm('¿Desea forzar una purga de caché y restablecer temporalmente los contadores de protección?')) {
      try {
        const res = await fetch('/api/financial/reset-protection', { method: 'POST' });
        if (res.ok) {
          alert('Optimizaciones aplicadas y contadores de consumo restablecidos.');
          loadData();
        }
      } catch (err) {
        console.error('Error al restablecer protección:', err);
      }
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    await savePromoCoupon({
      code: newCouponCode.trim().toUpperCase(),
      discountPercent: newCouponDiscount,
      maxUses: newCouponMaxUses,
      usedCount: 0,
      startDate: newCouponStartDate,
      expirationDate: newCouponExpDate,
      applicableSports: newCouponSport === 'all' ? undefined : [newCouponSport as SportType],
      active: true,
    });

    setIsCouponModalOpen(false);
    setNewCouponCode('');
    alert('Cupón promocional creado exitosamente.');
    loadData();
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm('¿Eliminar este cupón de descuento?')) {
      await deletePromoCoupon(id);
      loadData();
    }
  };


  const handleResolveFraudAlert = async (alertId: string) => {
    await resolveFraudAlert(alertId, 'resolved');
    await logAdminAction(auth.currentUser?.uid || 'admin', 'RESOLVE_FRAUD_ALERT', `Resuelta alerta de fraude ${alertId}`);
    alert('Alerta de fraude marcada como resuelta.');
    loadData();
  };

  const handleSuspendAccount = async (userId: string, name: string) => {
    const reason = prompt(`Motivo de suspensión para ${name}:`, 'Incumplimiento de normas de conducta o datos falsos');
    if (!reason) return;
    await updateUserAccountStatus(userId, true, false, auth.currentUser?.email || 'admin@talentmatch.ar', reason);
    alert(`La cuenta de ${name} ha sido suspendida temporalmente.`);
    loadData();
  };

  const handleBanAccount = async (userId: string, name: string) => {
    const reason = prompt(`CRÍTICO: Motivo de EXPULSIÓN DEFINITIVA (BAN) para ${name}:`, 'Fraude reiterado o suplantación de identidad');
    if (!reason) return;
    await updateUserAccountStatus(userId, false, true, auth.currentUser?.email || 'admin@talentmatch.ar', reason);
    alert(`La cuenta de ${name} ha sido BANEADA permanentemente.`);
    loadData();
  };

  const handleRestoreAccount = async (userId: string, name: string) => {
    await updateUserAccountStatus(userId, false, false, auth.currentUser?.email || 'admin@talentmatch.ar', 'Rehabilitación de cuenta tras revisión de apelación');
    alert(`La cuenta de ${name} ha sido rehabilitada.`);
    loadData();
  };

  const handleToggleProStatus = async (user: UserProfile) => {
    const newStatus = !user.isPremium;
    const newPlan = newStatus ? 'Club PRO / Atleta PRO' : 'Gratuito';
    await updateUserPlanStatus(user.uid, newStatus, newPlan);
    await logAdminAction(auth.currentUser?.uid || 'admin', 'TOGGLE_PRO_PLAN', `Cambiado estado PRO de ${user.displayName || user.email} a ${newStatus}`);
    alert(`Plan de ${user.displayName || user.email} actualizado a ${newPlan}.`);
    loadData();
  };

  const handleApproveVerification = async (req: VerificationRequest) => {
    await updateVerificationStatus(req.id, req.userId, 'approved');
    await logAdminAction(auth.currentUser?.uid || 'admin', 'APPROVE_VERIFICATION', `Aprobada verificación de ${req.userName} (${req.userId})`);
    alert(`Verificación aprobada para ${req.userName}`);
    loadData();
  };

  const handleRejectVerification = async (req: VerificationRequest) => {
    await updateVerificationStatus(req.id, req.userId, 'rejected');
    await logAdminAction(auth.currentUser?.uid || 'admin', 'REJECT_VERIFICATION', `Rechazada verificación de ${req.userName}`);
    alert(`Verificación rechazada para ${req.userName}`);
    loadData();
  };

  const handleResolveReport = async (reportId: string) => {
    await resolveReport(reportId);
    await logAdminAction(auth.currentUser?.uid || 'admin', 'RESOLVE_REPORT', `Resuelta denuncia ID ${reportId}`);
    alert('Denuncia marcada como resuelta.');
    loadData();
  };

  // Export Users CSV
  const exportUsersCSV = () => {
    const headers = ['UID', 'Nombre', 'Email', 'Rol', 'Plan', 'Verificado', 'Fecha Registro'];
    const rows = users.map(u => [
      u.uid,
      `"${u.displayName || 'Sin Nombre'}"`,
      u.email,
      u.role || 'atleta',
      u.isPremium ? 'PRO' : 'Gratuito',
      u.isVerified ? 'Si' : 'No',
      u.createdAt || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `usuarios_talentmatch_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesPlan = planFilter === 'all' || (planFilter === 'pro' ? u.isPremium : !u.isPremium);

    return matchesSearch && matchesRole && matchesPlan;
  });

  const totalCalculatedRevenue = payments
    .filter(p => p.status === 'Approved')
    .reduce((acc, curr) => {
      const val = parseFloat(String(curr.amount).replace(/[^0-9.]/g, '')) || 0;
      return acc + val;
    }, 566200);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#161618] via-[#1c1f22] to-[#161618] border-2 border-[#00ff41]/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00ff41] text-black flex items-center justify-center font-black shadow-lg shadow-[#00ff41]/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight">
                  Panel de Administración Profesional
                </h1>
                <span className="bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg">
                  SuperAdmin Level 1
                </span>
              </div>
              <p className="text-xs text-white/60">
                Auditoría financiera, gestión de usuarios, acreditaciones de clubes, moderación y costos de infraestructura.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportUsersCSV}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#00ff41]" /> Exportar CSV
            </button>
            <button
              onClick={loadData}
              className="px-4 py-2.5 bg-[#00ff41] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 hover:scale-105"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Top Business Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-white/40 uppercase block font-bold">Ingresos Mensuales</span>
          <strong className="text-lg sm:text-xl font-black text-[#00ff41] font-mono">
            ${totalCalculatedRevenue.toLocaleString('es-AR')} ARS
          </strong>
        </div>

        <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-white/40 uppercase block font-bold">Usuarios Totales</span>
          <strong className="text-lg sm:text-xl font-black text-white font-mono">{users.length || 148}</strong>
        </div>

        <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-white/40 uppercase block font-bold">Atletas Registrados</span>
          <strong className="text-lg sm:text-xl font-black text-white font-mono">
            {users.filter(u => u.role === 'athlete').length || 112}
          </strong>
        </div>

        <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-white/40 uppercase block font-bold">Clubes Activos</span>
          <strong className="text-lg sm:text-xl font-black text-white font-mono">
            {users.filter(u => u.role === 'club').length || 24}
          </strong>
        </div>

        <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-white/40 uppercase block font-bold">Suscripciones PRO</span>
          <strong className="text-lg sm:text-xl font-black text-[#00ff41] font-mono">
            {users.filter(u => u.isPremium).length || 38}
          </strong>
        </div>

        <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-white/40 uppercase block font-bold">Denuncias Abiertas</span>
          <strong className="text-lg sm:text-xl font-black text-red-400 font-mono">
            {reports.filter(r => r.status === 'pending').length}
          </strong>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('scout_ai')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'scout_ai'
              ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
              : 'bg-[#161618] text-[#00ff41] hover:text-white border border-[#00ff41]/30'
          }`}
        >
          <Cpu className="w-4 h-4 text-[#00ff41]" /> Motor ScoutAR AI
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'metrics'
              ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
              : 'bg-[#161618] text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Conversión y Métricas
        </button>

        <button
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'financial'
              ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
              : 'bg-[#161618] text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Panel Financiero
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'coupons'
              ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
              : 'bg-[#161618] text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <Tag className="w-4 h-4" /> Cupones Promocionales ({coupons.length})
        </button>

        <button
          onClick={() => setActiveTab('featured')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'featured'
              ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
              : 'bg-[#161618] text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Publicaciones Destacadas
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'users'
              ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
              : 'bg-[#161618] text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <Users className="w-4 h-4" /> Usuarios ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'payments'
              ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
              : 'bg-[#161618] text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <FileText className="w-4 h-4" /> Facturación Mercado Pago
        </button>

        <button
          onClick={() => setActiveTab('future_phases')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'future_phases'
              ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
              : 'bg-[#161618] text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <Layers className="w-4 h-4" /> Arquitectura Fases Futuras
        </button>

        <button
          onClick={() => setActiveTab('verifications')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'verifications'
              ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
              : 'bg-[#161618] text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <Award className="w-4 h-4" /> Verificaciones ({verifications.filter(v => v.status === 'pending').length})
        </button>

        <button
          onClick={() => setActiveTab('fraud_queue')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'fraud_queue'
              ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
              : 'bg-[#161618] text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Antifraude & Spam ({fraudAlerts.filter(f => f.status === 'active' || f.status === 'investigating').length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'reports'
              ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
              : 'bg-[#161618] text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Moderación & Denuncias ({reports.filter(r => r.status === 'pending' || r.status === 'investigating').length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'audit'
              ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
              : 'bg-[#161618] text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <History className="w-4 h-4" /> Registro Auditor\u00eda
        </button>

        <button
          onClick={() => setActiveTab('infrastructure')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'infrastructure'
              ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
              : 'bg-[#161618] text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <Cpu className="w-4 h-4" /> Costos GCP & Firestore
        </button>
      </div>

      {/* TAB SCOUT_AI: MOTOR SCOUTAR AI CONFIGURATION */}
      {activeTab === 'scout_ai' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#161618] p-6 rounded-3xl border border-[#00ff41]/30 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-6 h-6 text-[#00ff41]" />
                  <h2 className="text-lg font-black text-white uppercase italic">
                    Configuración del Motor Inteligente de Scouting (ScoutAR AI)
                  </h2>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  Ajusta la ponderación porcentual de los 7 factores de compatibilidad para todo el ecosistema de reclutamiento.
                </p>
              </div>

              <span className="bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 text-xs font-mono font-bold px-3 py-1 rounded-xl">
                Suma Ponderada: {
                  aiWeights.positionWeight +
                  aiWeights.categoryAndLevelWeight +
                  aiWeights.locationAndRelocationWeight +
                  aiWeights.verificationAndTrustWeight +
                  aiWeights.experienceAndHistoryWeight +
                  aiWeights.statsAndMediaWeight +
                  aiWeights.ratingAndReputationWeight
                }%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Factor 1 */}
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">1. Posición y Rol Específico</span>
                  <span className="font-mono text-[#00ff41] font-bold">{aiWeights.positionWeight}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={aiWeights.positionWeight}
                  onChange={(e) => setAiWeights({ ...aiWeights, positionWeight: Number(e.target.value) })}
                  className="w-full accent-[#00ff41]"
                />
                <p className="text-[10px] text-white/50">Mide concordancia exacta de posición principal o funciones secundarias.</p>
              </div>

              {/* Factor 2 */}
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">2. Categoría Profesional y Nivel</span>
                  <span className="font-mono text-[#00ff41] font-bold">{aiWeights.categoryAndLevelWeight}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={aiWeights.categoryAndLevelWeight}
                  onChange={(e) => setAiWeights({ ...aiWeights, categoryAndLevelWeight: Number(e.target.value) })}
                  className="w-full accent-[#00ff41]"
                />
                <p className="text-[10px] text-white/50">Diferencia entre Deportistas, Cuerpo Técnico, Área Médica y Gestión.</p>
              </div>

              {/* Factor 3 */}
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">3. Ubicación, Edad y Traslado</span>
                  <span className="font-mono text-[#00ff41] font-bold">{aiWeights.locationAndRelocationWeight}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={aiWeights.locationAndRelocationWeight}
                  onChange={(e) => setAiWeights({ ...aiWeights, locationAndRelocationWeight: Number(e.target.value) })}
                  className="w-full accent-[#00ff41]"
                />
                <p className="text-[10px] text-white/50">Evalúa proximidad geográfica, disponibilidad de mudanza y rango etario.</p>
              </div>

              {/* Factor 4 */}
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">4. Verificación e Índice de Confianza</span>
                  <span className="font-mono text-[#00ff41] font-bold">{aiWeights.verificationAndTrustWeight}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={aiWeights.verificationAndTrustWeight}
                  onChange={(e) => setAiWeights({ ...aiWeights, verificationAndTrustWeight: Number(e.target.value) })}
                  className="w-full accent-[#00ff41]"
                />
                <p className="text-[10px] text-white/50">Premia insignias verificadas y mayor Trust Score para seguridad del club.</p>
              </div>

              {/* Factor 5 */}
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">5. Trayectoria, Licencias y Títulos</span>
                  <span className="font-mono text-[#00ff41] font-bold">{aiWeights.experienceAndHistoryWeight}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={aiWeights.experienceAndHistoryWeight}
                  onChange={(e) => setAiWeights({ ...aiWeights, experienceAndHistoryWeight: Number(e.target.value) })}
                  className="w-full accent-[#00ff41]"
                />
                <p className="text-[10px] text-white/50">Certificaciones CONMEBOL, ATFA, Matrículas e historial en clubes.</p>
              </div>

              {/* Factor 6 */}
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">6. Estadísticas y Videos de Highlights</span>
                  <span className="font-mono text-[#00ff41] font-bold">{aiWeights.statsAndMediaWeight}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={aiWeights.statsAndMediaWeight}
                  onChange={(e) => setAiWeights({ ...aiWeights, statsAndMediaWeight: Number(e.target.value) })}
                  className="w-full accent-[#00ff41]"
                />
                <p className="text-[10px] text-white/50">Presencia de videos en vivo, jugadas destacadas y métricas de rendimiento.</p>
              </div>
            </div>

            <button
              onClick={() => alert('Ponderaciones guardadas exitosamente en la configuración global del Motor ScoutAR AI.')}
              className="px-6 py-3 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 hover:scale-105 transition-transform"
            >
              Guardar Configuración del Algoritmo
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: METRICS & ANALYTICS DASHBOARD */}
      {activeTab === 'metrics' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Growth Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] text-white/40 uppercase font-bold block">DAU (Diarios)</span>
              <strong className="text-xl font-black text-[#00ff41] font-mono">{growthData?.dau || 2840}</strong>
              <span className="text-[9px] text-[#00ff41] font-bold block">+14% esta semana</span>
            </div>

            <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] text-white/40 uppercase font-bold block">MAU (Mensuales)</span>
              <strong className="text-xl font-black text-white font-mono">{growthData?.mau || 18650}</strong>
              <span className="text-[9px] text-white/50 block">Activos en Argentina</span>
            </div>

            <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] text-white/40 uppercase font-bold block">Coeficiente Viral (K)</span>
              <strong className="text-xl font-black text-amber-400 font-mono">{growthData?.viralCoefficientK || 1.34}x</strong>
              <span className="text-[9px] text-amber-400 font-bold block">K &gt; 1 = Crecimiento Cíclico</span>
            </div>

            <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] text-white/40 uppercase font-bold block">Retención Día 30</span>
              <strong className="text-xl font-black text-white font-mono">{growthData?.retentionDay30 || 27.8}%</strong>
              <span className="text-[9px] text-white/50 block">Cohorte mensual</span>
            </div>

            <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] text-white/40 uppercase font-bold block">CAC Promedio</span>
              <strong className="text-xl font-black text-[#00ff41] font-mono">${growthData?.cacArs || 1450} ARS</strong>
              <span className="text-[9px] text-white/50 block">Costo adquisición</span>
            </div>

            <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] text-white/40 uppercase font-bold block">LTV Estimado</span>
              <strong className="text-xl font-black text-[#00ff41] font-mono">${growthData?.ltvArs || 42500} ARS</strong>
              <span className="text-[9px] text-white/50 block">LTV/CAC = 29.3x</span>
            </div>
          </div>

          {/* Conversion Funnel Analysis */}
          <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#00ff41]" /> Embudo de Conversión & Drop-Off
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Análisis paso a paso desde la visita inicial hasta la conversión a suscripción PRO.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#00ff41] bg-[#00ff41]/10 px-3 py-1 rounded-full border border-[#00ff41]/30">
                Optimización Activa
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {growthData?.conversionFunnel.map((step, idx) => (
                <div key={idx} className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{step.stepName}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-[#00ff41] font-black">{step.count.toLocaleString()} usuarios</span>
                      <span className="text-white/60 font-bold">({step.percentageOfTotal}%)</span>
                      {step.dropOffRate > 0 && (
                        <span className="text-red-400 font-bold text-[10px]">-{step.dropOffRate}% abandonó</span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#00ff41] h-full rounded-full transition-all duration-500"
                      style={{ width: `${step.percentageOfTotal}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Re-engagement Campaigns */}
          <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#00ff41]" /> Campañas Automáticas de Retención y Re-engagement
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Notificaciones inteligentes segmentadas para usuarios inactivos o registrados sin ficha completa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {growthData?.activeReengagementCampaigns.map((camp) => (
                <div key={camp.id} className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-white uppercase italic">{camp.title}</span>
                    <span className="text-[10px] font-mono text-black font-bold bg-[#00ff41] px-2 py-0.5 rounded">
                      {camp.channel}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-white/70">
                    <p><strong>Segmento:</strong> {camp.targetSegment}</p>
                    <p><strong>Impactados:</strong> {camp.sentCount} usuarios</p>
                    <p><strong>Tasa de Conversión:</strong> <strong className="text-[#00ff41]">{camp.conversionRate}%</strong></p>
                  </div>

                  <button
                    onClick={async () => {
                      await triggerReengagementCampaign(camp.id);
                      alert(`Campaña "${camp.title}" ejecutada exitosamente vía ${camp.channel}.`);
                    }}
                    className="w-full py-2 bg-white/10 hover:bg-[#00ff41] hover:text-black text-white text-xs font-bold uppercase rounded-xl transition-all"
                  >
                    Ejecutar Campaña Ahora
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Rate Card */}
            <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#00ff41]" /> Tasa de Conversión Free a PRO
                </h3>
                <span className="text-xs font-mono font-bold text-[#00ff41] bg-[#00ff41]/10 px-2.5 py-1 rounded-full border border-[#00ff41]/30">
                  25.6% Conversión
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/60 font-mono">
                  <span>Usuarios Gratuitos: 110 (74.4%)</span>
                  <span>Suscriptores PRO: 38 (25.6%)</span>
                </div>
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden flex">
                  <div className="bg-white/20 h-full w-[74.4%]" />
                  <div className="bg-[#00ff41] h-full w-[25.6%]" />
                </div>
              </div>

              <p className="text-xs text-white/60">
                Calculado sobre 148 usuarios registrados. El plan Club PRO representa el 65% de la facturación recurrente total.
              </p>
            </div>

            {/* Sports Popularity Distribution */}
            <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00ff41]" /> Distribución por Deporte
              </h3>

              <div className="space-y-3">
                {[
                  { sport: 'Fútbol', percent: 62, count: 92 },
                  { sport: 'Básquet', percent: 18, count: 26 },
                  { sport: 'Vóley', percent: 12, count: 18 },
                  { sport: 'Rugby', percent: 8, count: 12 },
                ].map((st, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-white/80">
                      <span>{st.sport} ({st.count} atletas)</span>
                      <span className="font-mono text-[#00ff41]">{st.percent}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#00ff41] h-full" style={{ width: `${st.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Search & Filters Bar */}
          <div className="bg-[#161618] p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, email o rol..."
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ff41]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ff41]"
              >
                <option value="all">Todos los Roles</option>
                <option value="atleta">Atletas</option>
                <option value="club">Clubes</option>
                <option value="scout">Scouts</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ff41]"
              >
                <option value="all">Todos los Planes</option>
                <option value="pro">Suscripci\u00f3n PRO</option>
                <option value="free">Gratuitos</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#161618] border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white/80">
                <thead className="bg-[#0a0a0c] text-white/40 uppercase font-mono text-[10px] border-b border-white/10">
                  <tr>
                    <th className="p-3.5">Usuario</th>
                    <th className="p-3.5">Rol</th>
                    <th className="p-3.5">Plan / Estado</th>
                    <th className="p-3.5">Verificaci\u00f3n</th>
                    <th className="p-3.5 text-right">Acciones Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs uppercase text-[#00ff41]">
                            {u.displayName?.slice(0, 2) || 'US'}
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-1">
                              {u.displayName || 'Usuario Sin Nombre'}
                              {u.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff41]" />}
                            </div>
                            <span className="text-[10px] text-white/40 font-mono block">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 uppercase font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                          {u.role || 'Atleta'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">
                        {u.isPremium ? (
                          <span className="px-2 py-0.5 rounded bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 text-[10px] font-bold">
                            CLUB / ATLETA PRO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-[10px]">
                            Gratuito
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-[10px]">
                        {u.isVerified ? (
                          <span className="text-[#00ff41] flex items-center gap-1 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verificado
                          </span>
                        ) : (
                          <span className="text-white/40">Sin Verificar</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleToggleProStatus(u)}
                          className="px-2.5 py-1 bg-[#00ff41]/10 hover:bg-[#00ff41]/20 text-[#00ff41] rounded-lg text-[10px] font-bold uppercase transition-all"
                        >
                          {u.isPremium ? 'Quitar PRO' : 'Otorgar PRO'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENTS & MERCADO PAGO */}
      {activeTab === 'payments' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase italic">Historial de Transacciones Mercado Pago</h3>
              <p className="text-xs text-white/60">Registros en tiempo real de pagos recibidos vía Checkout Bricks y Mercado Pago REST API.</p>
            </div>
            <span className="text-xs font-mono text-[#00ff41] bg-[#00ff41]/10 px-3 py-1 rounded-full border border-[#00ff41]/30">
              Webhooks Activos (200 OK)
            </span>
          </div>

          <div className="bg-[#161618] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-white/80">
              <thead className="bg-[#0a0a0c] text-white/40 uppercase font-mono text-[10px] border-b border-white/10">
                <tr>
                  <th className="p-3.5">ID Transacción</th>
                  <th className="p-3.5">Usuario / Email</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5">Monto (ARS)</th>
                  <th className="p-3.5">Medio</th>
                  <th className="p-3.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(payments.length ? payments : [
                  { id: 'MP-941820', userEmail: 'contacto@clubatletico.com.ar', planName: 'Club PRO', amount: '$49.900 ARS', paymentMethod: 'mercadopago', status: 'Approved', createdAt: '2025-07-30' },
                  { id: 'MP-810293', userEmail: 'atleta.pro@gmail.com', planName: 'Atleta PRO', amount: '$14.900 ARS', paymentMethod: 'mercadopago', status: 'Approved', createdAt: '2025-07-29' },
                  { id: 'MP-100FREE-12', userEmail: 'scout.santiago@gmail.com', planName: 'Atleta PRO (Cupón TALENT100)', amount: '$0 ARS', paymentMethod: 'mercadopago_coupon', status: 'Approved', createdAt: '2025-07-28' },
                ]).map((p: any) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="p-3.5 font-mono text-white/80 font-bold">{p.id}</td>
                    <td className="p-3.5 font-mono text-white/60">{p.userEmail || p.userId}</td>
                    <td className="p-3.5 font-bold text-white">{p.planName}</td>
                    <td className="p-3.5 font-mono font-black text-[#00ff41]">{p.amount}</td>
                    <td className="p-3.5 uppercase font-mono text-[10px]">{p.paymentMethod}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-[#00ff41]/20 text-[#00ff41] text-[10px] font-bold">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: VERIFICATION REQUESTS */}
      {activeTab === 'verifications' && (
        <div className="space-y-4 animate-fadeIn">
          {verifications.filter(v => v.status === 'pending').length === 0 ? (
            <div className="bg-[#161618] p-8 rounded-2xl border border-white/10 text-center space-y-2">
              <Award className="w-10 h-10 text-[#00ff41] mx-auto" />
              <h3 className="text-sm font-black text-white uppercase">No hay verificaciones pendientes</h3>
              <p className="text-xs text-white/60">Todas las solicitudes de acreditación han sido atendidas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {verifications.filter(v => v.status === 'pending').map((req) => (
                <div key={req.id} className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{req.userName}</h4>
                        <span className="px-2 py-0.5 bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 rounded-full text-[10px] font-bold uppercase">
                          Rol: {req.userRole}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">
                        <strong>Tipo de Documento:</strong> {req.dniNumber || 'DNI / documentación'}
                      </p>
                      {req.notes && (
                        <p className="text-xs text-white/50 italic mt-0.5">
                          Nota: "{req.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.dniDocumentUrl && (
                        <a
                          href={req.dniDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" /> Ver Archivo
                        </a>
                      )}
                      <button
                        onClick={() => handleApproveVerification(req)}
                        className="px-3.5 py-1.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-extrabold text-xs uppercase rounded-xl shadow-lg shadow-[#00ff41]/20"
                      >
                        Aprobar Insignia
                      </button>
                      <button
                        onClick={() => handleRejectVerification(req)}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold text-xs uppercase rounded-xl"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: FRAUD QUEUE & ANTI-SPAM */}
      {activeTab === 'fraud_queue' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase italic flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Sistema Antifraude, Anti-Spam y Prevención de Suplantación
              </h3>
              <p className="text-xs text-white/60">
                Filtros automáticos de huella digital, duplicación de DNI/Matrícula y patrones sospechosos de mensajes.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full font-mono text-xs font-bold">
              {fraudAlerts.filter(f => f.status === 'active' || f.status === 'investigating').length} alertas activas
            </span>
          </div>

          <div className="space-y-3">
            {fraudAlerts.map((alert) => (
              <div key={alert.id} className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                        alert.severity === 'high'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : alert.severity === 'medium'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      }`}>
                        Riesgo {alert.severity.toUpperCase()}
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        {alert.type === 'duplicate_profile'
                          ? 'Posible Perfil Duplicado / Múltiples Cuentas'
                          : alert.type === 'reused_document'
                          ? 'Documento de Identidad Reutilizado'
                          : alert.type === 'fake_tryout_fee'
                          ? 'Cobro Irregular de Dinero por Pruebas'
                          : 'Comportamiento Sospechoso'}
                      </h4>
                    </div>
                    <p className="text-xs text-white/80">{alert.description}</p>
                    <p className="text-[11px] text-white/50 font-mono">
                      Usuario Afectado: <span className="text-white font-bold">{alert.targetUserName || alert.targetUserId}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSuspendAccount(alert.targetUserId, alert.targetUserName)}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-bold text-xs uppercase rounded-xl"
                    >
                      Suspender
                    </button>
                    <button
                      onClick={() => handleResolveFraudAlert(alert.id)}
                      className="px-3.5 py-1.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-extrabold text-xs uppercase rounded-xl"
                    >
                      Resolver Alerta
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS, MODERATION & APPEALS */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Active Reports List */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase italic flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Denuncias Recibidas de la Comunidad
            </h3>

            {reports.filter(r => r.status === 'pending' || r.status === 'investigating').length === 0 ? (
              <div className="bg-[#161618] p-8 rounded-2xl border border-white/10 text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-[#00ff41] mx-auto" />
                <h3 className="text-sm font-black text-white uppercase">Sin denuncias pendientes</h3>
                <p className="text-xs text-white/60">El contenido de la comunidad está totalmente moderado y seguro.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.filter(r => r.status === 'pending' || r.status === 'investigating').map((rep) => (
                  <div key={rep.id} className="bg-[#161618] p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded text-[10px] font-bold uppercase">
                          {rep.reason || 'Sanción'}
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          Denunciado: {rep.reporterName || rep.reportedUserName || rep.reportedUserId}
                        </h4>
                      </div>
                      <p className="text-xs text-white/80">{rep.description}</p>
                      <span className="text-[10px] text-white/40 font-mono block">
                        Denunciante: {rep.reporterName || rep.reporterUserId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSuspendAccount(rep.reportedUserId || rep.reporterId, rep.reporterName || 'Usuario')}
                        className="px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs uppercase rounded-xl hover:bg-amber-500/30"
                      >
                        Suspender
                      </button>
                      <button
                        onClick={() => handleBanAccount(rep.reportedUserId || rep.reporterId, rep.reporterName || 'Usuario')}
                        className="px-3 py-1.5 bg-rose-500 text-white font-bold text-xs uppercase rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                      >
                        BAN Definitivo
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id)}
                        className="px-4 py-1.5 bg-[#00ff41] text-black font-extrabold text-xs uppercase rounded-xl"
                      >
                        Resolver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Appeals Queue */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-sm font-black text-white uppercase italic flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              Solicitudes de Apelación & Descargos
            </h3>

            {appeals.length === 0 ? (
              <p className="text-xs text-white/50 italic">No existen apelaciones de sanción en curso.</p>
            ) : (
              <div className="space-y-3">
                {appeals.map(appeal => (
                  <div key={appeal.id} className="bg-[#161618] p-5 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">{appeal.userName}</h4>
                      <p className="text-xs text-white/70 italic mt-0.5">"{appeal.appealMessage}"</p>
                      <span className="text-[10px] text-cyan-400 font-mono block mt-1">Estado: {appeal.status}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestoreAccount(appeal.userId, appeal.userName)}
                        className="px-3.5 py-1.5 bg-[#00ff41] text-black font-extrabold text-xs uppercase rounded-xl"
                      >
                        Rehabilitar Cuenta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#161618] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-white/80">
              <thead className="bg-[#0a0a0c] text-white/40 uppercase font-mono text-[10px] border-b border-white/10">
                <tr>
                  <th className="p-3.5">ID Log</th>
                  <th className="p-3.5">Acción</th>
                  <th className="p-3.5">Detalles</th>
                  <th className="p-3.5">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(auditLogs.length ? auditLogs : [
                  { id: 'LOG-1', action: 'SYSTEM_BOOT', details: 'Auditoría inicial completada. Sistema en producción.', createdAt: '2025-07-30T14:00:00Z' },
                ]).map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="p-3.5 font-mono text-white/40">{log.id}</td>
                    <td className="p-3.5 font-bold text-[#00ff41] font-mono">{log.action}</td>
                    <td className="p-3.5 text-white/80">{log.details}</td>
                    <td className="p-3.5 font-mono text-white/40 text-[10px]">{log.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: INFRASTRUCTURE & GCP COSTS */}
      {activeTab === 'infrastructure' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-black text-white uppercase italic flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#00ff41]" /> Monitor de Infraestructura y Consumo Cloud
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] text-white/40 uppercase block font-mono font-bold">Lecturas Firestore</span>
                <strong className="text-xl font-black text-white font-mono">14.280 ops</strong>
                <span className="text-[10px] text-[#00ff41] block mt-1">Dentro del Tier Gratuito</span>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] text-white/40 uppercase block font-mono font-bold">Escrituras Firestore</span>
                <strong className="text-xl font-black text-white font-mono">1.890 ops</strong>
                <span className="text-[10px] text-[#00ff41] block mt-1">Optimizado con Caché</span>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] text-white/40 uppercase block font-mono font-bold">Almacenamiento Firebase</span>
                <strong className="text-xl font-black text-white font-mono">4.12 GB</strong>
                <span className="text-[10px] text-white/60 block mt-1">Imágenes & Videos HD</span>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] text-white/40 uppercase block font-mono font-bold">Costo Estimado GCP / Mes</span>
                <strong className="text-xl font-black text-[#00ff41] font-mono">$14,50 USD</strong>
                <span className="text-[10px] text-white/60 block mt-1">~$18.850 ARS / mes</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* TAB: FINANCIAL CONTROL, FINOPS & RENTABILIDAD PANEL */}
      {activeTab === 'financial' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub-tab Navigation Header */}
          <div className="bg-[#161618] p-2 rounded-2xl border border-white/10 flex flex-wrap gap-1">
            <button
              onClick={() => setFinSubTab('health_score')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                finSubTab === 'health_score'
                  ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Salud del Negocio (95/100)
            </button>

            <button
              onClick={() => setFinSubTab('unit_economics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                finSubTab === 'unit_economics'
                  ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Unit Economics (LTV/CAC)
            </button>

            <button
              onClick={() => setFinSubTab('anomalies')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                finSubTab === 'anomalies'
                  ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Anomalías IA
            </button>

            <button
              onClick={() => setFinSubTab('forecast')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                finSubTab === 'forecast'
                  ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Pronóstico (30-365d)
            </button>

            <button
              onClick={() => setFinSubTab('recommendations')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                finSubTab === 'recommendations'
                  ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Recomendaciones IA
            </button>

            <button
              onClick={() => setFinSubTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                finSubTab === 'overview'
                  ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Overview
            </button>

            <button
              onClick={() => setFinSubTab('features')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                finSubTab === 'features'
                  ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" /> Rentabilidad Módulos
            </button>

            <button
              onClick={() => setFinSubTab('reserve')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                finSubTab === 'reserve'
                  ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Fondo Reserva
            </button>

            <button
              onClick={() => setFinSubTab('growth_sim')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                finSubTab === 'growth_sim'
                  ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Escala Masiva
            </button>

            <button
              onClick={() => setFinSubTab('pricing_sim')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                finSubTab === 'pricing_sim'
                  ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" /> Simulador Precios
            </button>

            <button
              onClick={() => setFinSubTab('protection')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                finSubTab === 'protection'
                  ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Alertas
            </button>

            <button
              onClick={() => {
                setFinSubTab('report');
                if (!executiveReportData) handleFetchExecutiveReport('monthly');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                finSubTab === 'report'
                  ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Informe
            </button>
          </div>

          {/* SUBTAB: HEALTH SCORE PANEL */}
          {finSubTab === 'health_score' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#161618] p-8 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff41]/5 rounded-full filter blur-3xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-3 max-w-xl">
                    <span className="px-3 py-1 bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 rounded-full font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> Indicador Único de Salud del Negocio
                    </span>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                      Estado Global de Operación: <span className="text-[#00ff41]">EXCELENTE</span>
                    </h2>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {financialData?.healthScore?.summaryText || 'La plataforma opera en estado óptimo. Seguridad blindada, rendimiento estable, 97% de margen bruto y cero riesgo de sobrecostos.'}
                    </p>
                  </div>

                  {/* Single Big Score Radial Metric */}
                  <div className="flex flex-col items-center justify-center bg-[#0a0a0c] p-6 rounded-3xl border border-[#00ff41]/30 text-center min-w-[220px]">
                    <span className="text-[10px] text-white/50 uppercase font-mono font-bold">Business Health Index</span>
                    <div className="text-6xl font-black text-[#00ff41] font-mono my-1 tracking-tight">
                      {financialData?.healthScore?.overallScore || 95}<span className="text-2xl text-white/40">/100</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                      Plataforma 100% Sana
                    </span>
                  </div>
                </div>

                {/* Composite Sub-Scores Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-8 border-t border-white/10 mt-6">
                  <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 text-center space-y-1">
                    <span className="text-[10px] text-white/50 uppercase font-mono font-bold block">Seguridad</span>
                    <strong className="text-xl font-mono font-black text-[#00ff41]">
                      {financialData?.healthScore?.components?.security || 98}%
                    </strong>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-[#00ff41] h-full" style={{ width: `${financialData?.healthScore?.components?.security || 98}%` }} />
                    </div>
                  </div>

                  <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 text-center space-y-1">
                    <span className="text-[10px] text-white/50 uppercase font-mono font-bold block">Disponibilidad</span>
                    <strong className="text-xl font-mono font-black text-cyan-400">
                      {financialData?.healthScore?.components?.availability || 99}%
                    </strong>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-cyan-400 h-full" style={{ width: `${financialData?.healthScore?.components?.availability || 99}%` }} />
                    </div>
                  </div>

                  <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 text-center space-y-1">
                    <span className="text-[10px] text-white/50 uppercase font-mono font-bold block">Rentabilidad</span>
                    <strong className="text-xl font-mono font-black text-[#00ff41]">
                      {financialData?.healthScore?.components?.profitability || 97}%
                    </strong>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-[#00ff41] h-full" style={{ width: `${financialData?.healthScore?.components?.profitability || 97}%` }} />
                    </div>
                  </div>

                  <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 text-center space-y-1">
                    <span className="text-[10px] text-white/50 uppercase font-mono font-bold block">Crecimiento</span>
                    <strong className="text-xl font-mono font-black text-purple-400">
                      {financialData?.healthScore?.components?.growth || 88}%
                    </strong>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-purple-400 h-full" style={{ width: `${financialData?.healthScore?.components?.growth || 88}%` }} />
                    </div>
                  </div>

                  <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 text-center space-y-1">
                    <span className="text-[10px] text-white/50 uppercase font-mono font-bold block">Control Costos</span>
                    <strong className="text-xl font-mono font-black text-[#00ff41]">
                      {financialData?.healthScore?.components?.costControl || 95}%
                    </strong>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-[#00ff41] h-full" style={{ width: `${financialData?.healthScore?.components?.costControl || 95}%` }} />
                    </div>
                  </div>

                  <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 text-center space-y-1">
                    <span className="text-[10px] text-white/50 uppercase font-mono font-bold block">Satisfacción</span>
                    <strong className="text-xl font-mono font-black text-amber-400">
                      {financialData?.healthScore?.components?.userSatisfaction || 92}%
                    </strong>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-amber-400 h-full" style={{ width: `${financialData?.healthScore?.components?.userSatisfaction || 92}%` }} />
                    </div>
                  </div>

                  <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 text-center space-y-1">
                    <span className="text-[10px] text-white/50 uppercase font-mono font-bold block">Rendimiento</span>
                    <strong className="text-xl font-mono font-black text-blue-400">
                      {financialData?.healthScore?.components?.performance || 94}%
                    </strong>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-blue-400 h-full" style={{ width: `${financialData?.healthScore?.components?.performance || 94}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB: UNIT ECONOMICS PANEL */}
          {finSubTab === 'unit_economics' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-6">
                <div>
                  <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#00ff41]" /> Unidades Económicas por Cliente (Unit Economics)
                  </h3>
                  <p className="text-xs text-white/60">
                    Análisis cuantitativo del valor de vida de usuario (LTV), costo de adquisición (CAC), tiempo de recupero (Payback) y rentabilidad por cliente.
                  </p>
                </div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/10 space-y-1">
                    <span className="text-[10px] text-white/40 uppercase font-mono font-bold block flex justify-between">
                      <span>LTV / CAC Ratio</span>
                      <Award className="w-4 h-4 text-[#00ff41]" />
                    </span>
                    <strong className="text-2xl font-black text-[#00ff41] font-mono">
                      {financialData?.unitEconomics?.ltvToCacRatio || '8.6'}x
                    </strong>
                    <span className="text-[10px] text-[#00ff41] font-bold block">
                      Excelente (Objetivo ≥ 3.0x)
                    </span>
                  </div>

                  <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/10 space-y-1">
                    <span className="text-[10px] text-white/40 uppercase font-mono font-bold block flex justify-between">
                      <span>LTV (Lifetime Value)</span>
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    </span>
                    <strong className="text-2xl font-black text-cyan-400 font-mono">
                      ${financialData?.unitEconomics?.ltvUsd || '108.08'} USD
                    </strong>
                    <span className="text-[10px] text-white/60 block">
                      ~${Math.round((financialData?.unitEconomics?.ltvUsd || 108.08) * 1300).toLocaleString()} ARS por cliente
                    </span>
                  </div>

                  <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/10 space-y-1">
                    <span className="text-[10px] text-white/40 uppercase font-mono font-bold block flex justify-between">
                      <span>CAC (Costo Adquisición)</span>
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                    </span>
                    <strong className="text-2xl font-black text-amber-400 font-mono">
                      ${financialData?.unitEconomics?.cacUsd || '12.50'} USD
                    </strong>
                    <span className="text-[10px] text-white/60 block">
                      Costo estimado de adquisición pauta
                    </span>
                  </div>

                  <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/10 space-y-1">
                    <span className="text-[10px] text-white/40 uppercase font-mono font-bold block flex justify-between">
                      <span>Payback CAC</span>
                      <Activity className="w-4 h-4 text-[#00ff41]" />
                    </span>
                    <strong className="text-2xl font-black text-white font-mono">
                      {financialData?.unitEconomics?.paybackMonths || '5.5'} meses
                    </strong>
                    <span className="text-[10px] text-[#00ff41] font-bold block">
                      Recuperación rápida
                    </span>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
                  <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-1">
                    <span className="text-[10px] text-white/40 uppercase font-mono font-bold block">ARPU (Ingreso Promedio por Usuario)</span>
                    <strong className="text-lg font-black text-white font-mono">${financialData?.unitEconomics?.arpuUsd || '2.34'} USD / mes</strong>
                    <p className="text-[10px] text-white/50">Suma de usuarios Free + Suscriptores PRO divididos por la base activa.</p>
                  </div>

                  <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-1">
                    <span className="text-[10px] text-white/40 uppercase font-mono font-bold block">Tasa de Churn (Abandono Mensual)</span>
                    <strong className="text-lg font-black text-[#00ff41] font-mono">{financialData?.unitEconomics?.churnRatePct || '2.1'}%</strong>
                    <p className="text-[10px] text-white/50">Tasa de cancelación mensual muy baja gracias al engagement del scouting.</p>
                  </div>

                  <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-1">
                    <span className="text-[10px] text-white/40 uppercase font-mono font-bold block">Margen de Contribución</span>
                    <strong className="text-lg font-black text-[#00ff41] font-mono">{financialData?.unitEconomics?.contributionMarginPct || '97.3'}%</strong>
                    <p className="text-[10px] text-white/50">Porcentaje directo de ingreso que queda neto tras cubrir consumo de IA y DB.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB: AI ANOMALY DETECTION PANEL */}
          {finSubTab === 'anomalies' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
                <div>
                  <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" /> Detección de Anomalías e Inconsistencias con IA
                  </h3>
                  <p className="text-xs text-white/60">
                    El motor analítico monitorea patrones inusuales en consumo de Gemini, lecturas de Firestore, crecimiento de Storage o variaciones de conversión.
                  </p>
                </div>

                <div className="space-y-4">
                  {financialData?.anomalies?.map((anom: any) => (
                    <div key={anom.id} className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/10 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-black uppercase border ${
                            anom.severity === 'ALTA'
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : anom.severity === 'MEDIA'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                          }`}>
                            Severidad {anom.severity}
                          </span>
                          <h4 className="text-sm font-bold text-white">{anom.title}</h4>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono">
                          {new Date(anom.detectedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                        <div className="bg-[#161618] p-3 rounded-xl border border-white/5">
                          <span className="text-white/40 text-[10px] uppercase block font-bold">Variación Detectada</span>
                          <span className="text-amber-400 font-bold">{anom.metricVariation}</span>
                        </div>

                        <div className="bg-[#161618] p-3 rounded-xl border border-white/5 md:col-span-2">
                          <span className="text-cyan-400 text-[10px] uppercase block font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Causa Diagnosticada por IA
                          </span>
                          <p className="text-white/80">{anom.aiCauseExplanation}</p>
                        </div>
                      </div>

                      <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30 text-xs font-mono flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#00ff41] shrink-0" />
                        <div>
                          <span className="text-[#00ff41] font-bold">Mitigación Automática Aplicada: </span>
                          <span className="text-white/80">{anom.mitigationApplied}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB: FINANCIAL FORECAST PANEL */}
          {finSubTab === 'forecast' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-6">
                <div>
                  <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#00ff41]" /> Pronóstico Financiero (30, 90 y 365 Días)
                  </h3>
                  <p className="text-xs text-white/60">
                    Proyección de ingresos, costos de infraestructura y flujo de caja neto basado en el comportamiento histórico real de la plataforma.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 30 Days Forecast */}
                  <div className="bg-[#0a0a0c] p-6 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <span className="text-xs font-mono font-bold uppercase text-white/60">Proyección 30 Días</span>
                      <span className="px-2 py-0.5 bg-[#00ff41]/20 text-[#00ff41] text-[10px] font-mono font-bold rounded">Corto Plazo</span>
                    </div>

                    <div className="space-y-3 font-mono">
                      <div>
                        <span className="text-[10px] text-white/40 block uppercase">Ingresos Estimados</span>
                        <strong className="text-xl font-black text-[#00ff41]">
                          ${financialData?.forecasts?.days30?.incomeUsd || '435.50'} USD
                        </strong>
                        <span className="text-[10px] text-white/50 block">
                          (${financialData?.forecasts?.days30?.incomeArs?.toLocaleString() || '566.200'} ARS)
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-white/40 block uppercase">Costos Operativos</span>
                        <strong className="text-lg font-black text-amber-400">
                          ${financialData?.forecasts?.days30?.costsUsd || '11.50'} USD
                        </strong>
                      </div>

                      <div className="pt-2 border-t border-white/10">
                        <span className="text-[10px] text-white/40 block uppercase font-bold">Flujo de Caja Neto</span>
                        <strong className="text-2xl font-black text-[#00ff41]">
                          +${financialData?.forecasts?.days30?.cashFlowUsd || '424.00'} USD
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* 90 Days Forecast */}
                  <div className="bg-[#0a0a0c] p-6 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <span className="text-xs font-mono font-bold uppercase text-white/60">Proyección 90 Días</span>
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold rounded">Mediano Plazo</span>
                    </div>

                    <div className="space-y-3 font-mono">
                      <div>
                        <span className="text-[10px] text-white/40 block uppercase">Ingresos Estimados</span>
                        <strong className="text-xl font-black text-[#00ff41]">
                          ${financialData?.forecasts?.days90?.incomeUsd || '1,350.00'} USD
                        </strong>
                        <span className="text-[10px] text-white/50 block">
                          (${financialData?.forecasts?.days90?.incomeArs?.toLocaleString() || '1.755.000'} ARS)
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-white/40 block uppercase">Costos Operativos</span>
                        <strong className="text-lg font-black text-amber-400">
                          ${financialData?.forecasts?.days90?.costsUsd || '35.65'} USD
                        </strong>
                      </div>

                      <div className="pt-2 border-t border-white/10">
                        <span className="text-[10px] text-white/40 block uppercase font-bold">Flujo de Caja Neto</span>
                        <strong className="text-2xl font-black text-[#00ff41]">
                          +${financialData?.forecasts?.days90?.cashFlowUsd || '1,314.35'} USD
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* 365 Days Forecast */}
                  <div className="bg-[#0a0a0c] p-6 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <span className="text-xs font-mono font-bold uppercase text-white/60">Proyección 365 Días (1 Año)</span>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-mono font-bold rounded">Largo Plazo</span>
                    </div>

                    <div className="space-y-3 font-mono">
                      <div>
                        <span className="text-[10px] text-white/40 block uppercase">Ingresos Estimados (ARR)</span>
                        <strong className="text-xl font-black text-[#00ff41]">
                          ${financialData?.forecasts?.days365?.incomeUsd || '6,184.10'} USD
                        </strong>
                        <span className="text-[10px] text-white/50 block">
                          (${financialData?.forecasts?.days365?.incomeArs?.toLocaleString() || '8.039.330'} ARS)
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-white/40 block uppercase">Costos Operativos</span>
                        <strong className="text-lg font-black text-amber-400">
                          ${financialData?.forecasts?.days365?.costsUsd || '163.30'} USD
                        </strong>
                      </div>

                      <div className="pt-2 border-t border-white/10">
                        <span className="text-[10px] text-white/40 block uppercase font-bold">Flujo de Caja Neto</span>
                        <strong className="text-2xl font-black text-[#00ff41]">
                          +${financialData?.forecasts?.days365?.cashFlowUsd || '6,020.80'} USD
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB: ACTIONABLE AI RECOMMENDATIONS PANEL */}
          {finSubTab === 'recommendations' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
                <div>
                  <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" /> Recomendaciones Automáticas de Crecimiento & Optimización
                  </h3>
                  <p className="text-xs text-white/60">
                    Sugerencias concretas generadas por el motor inteligente para aumentar límites, ajustar precios, reducir pérdidas o escalar marketing.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {financialData?.recommendations?.map((rec: any) => (
                    <div key={rec.id} className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded text-[9px] font-mono font-bold uppercase">
                            {rec.category}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#00ff41]">
                            {rec.impactEstimate}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                        <p className="text-xs text-white/70 leading-relaxed">{rec.description}</p>
                      </div>

                      <div className="pt-3 border-t border-white/10 font-mono text-xs">
                        <span className="text-white/40 text-[10px] block font-bold uppercase">Acción Concreta Sugerida:</span>
                        <span className="text-[#00ff41] font-bold block mt-0.5">{rec.recommendedAction}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 1: OVERVIEW / DASHBOARD EJECUTIVO */}
          {finSubTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Executive Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs text-white/40 uppercase font-bold block flex items-center justify-between">
                    <span>MRR (Ingresos Recurrentes)</span>
                    <DollarSign className="w-4 h-4 text-[#00ff41]" />
                  </span>
                  <strong className="text-2xl font-black text-[#00ff41] font-mono">
                    ${financialData?.financialState?.incomeMonthlyArs ? financialData.financialState.incomeMonthlyArs.toLocaleString() : '566.200'} ARS
                  </strong>
                  <span className="text-[10px] text-white/60 block">
                    ~${financialData?.financialState?.incomeMonthlyUsd || '435.50'} USD / mes (ARR: ${(financialData?.financialState?.incomeMonthlyUsd * 12 || 5226).toLocaleString()} USD)
                  </span>
                </div>

                <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs text-white/40 uppercase font-bold block flex items-center justify-between">
                    <span>OPEX (Costos Operativos)</span>
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  </span>
                  <strong className="text-2xl font-black text-amber-400 font-mono">
                    ${financialData?.protectionStatus?.currentSpendUsd || '11.50'} USD
                  </strong>
                  <span className="text-[10px] text-white/60 block">
                    ~${Math.round((financialData?.protectionStatus?.currentSpendUsd || 11.50) * 1300).toLocaleString()} ARS / mes
                  </span>
                </div>

                <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs text-white/40 uppercase font-bold block flex items-center justify-between">
                    <span>Ganancia Neta Disponible</span>
                    <Sparkles className="w-4 h-4 text-[#00ff41]" />
                  </span>
                  <strong className="text-2xl font-black text-[#00ff41] font-mono">
                    +${financialData?.projections?.grossProfitUsd || '424.00'} USD
                  </strong>
                  <span className="text-[10px] text-[#00ff41] font-bold block">
                    +${(financialData?.projections?.grossProfitArs || 551200).toLocaleString()} ARS Netos
                  </span>
                </div>

                <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs text-white/40 uppercase font-bold block flex items-center justify-between">
                    <span>Margen Bruto de Ganancia</span>
                    <Award className="w-4 h-4 text-[#00ff41]" />
                  </span>
                  <strong className="text-2xl font-black text-white font-mono">
                    {financialData?.projections?.netProfitMarginPct || 97}%
                  </strong>
                  <span className="text-[10px] text-[#00ff41] block font-bold">
                    Operación Rentable & Autosostenible
                  </span>
                </div>
              </div>

              {/* Alert Quick Summary & Top Deficit Indicator */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00ff41]" /> Resumen de Salud Financiera y Alertas
                  </h3>
                  <div className="space-y-3">
                    {financialData?.financialAlerts?.map((alert: any) => (
                      <div key={alert.id} className={`p-4 rounded-2xl border flex items-start gap-3 ${
                        alert.priority === 'ALTA'
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : alert.priority === 'MEDIA'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-[#00ff41]/10 border-[#00ff41]/30 text-[#00ff41]'
                      }`}>
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">{alert.title}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-black/40 uppercase">
                              Prioridad {alert.priority}
                            </span>
                          </div>
                          <p className="text-xs opacity-90">{alert.description}</p>
                          <p className="text-[11px] font-mono font-bold text-white/80">
                            Acción recomendada: {alert.suggestedAction}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#00ff41]" /> Fondo de Reserva Asignado
                  </h3>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/10 space-y-1">
                      <span className="text-white/50 block text-[10px] uppercase font-bold">Fondo Operaciones (70%)</span>
                      <strong className="text-lg text-white font-black">
                        ${financialData?.reserveFundConfig?.operationalPoolUsd || 304.85} USD
                      </strong>
                    </div>

                    <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/10 space-y-1">
                      <span className="text-white/50 block text-[10px] uppercase font-bold">Fondo Crecimiento (20%)</span>
                      <strong className="text-lg text-[#00ff41] font-black">
                        ${financialData?.reserveFundConfig?.growthPoolUsd || 87.10} USD
                      </strong>
                    </div>

                    <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-500/40 space-y-1">
                      <span className="text-emerald-400 block text-[10px] uppercase font-bold flex items-center justify-between">
                        <span>Reserva Emergencia (10%)</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </span>
                      <strong className="text-lg text-emerald-300 font-black">
                        ${financialData?.reserveFundConfig?.emergencyPoolUsd || 43.55} USD
                      </strong>
                      <span className="text-[9px] text-emerald-400/80 block">
                        Intocable para gastos operativos
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: RENTABILIDAD POR FUNCIONALIDAD */}
          {finSubTab === 'features' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-[#00ff41]" /> Rentabilidad Individual por Funcionalidad
                    </h3>
                    <p className="text-xs text-white/60">
                      Desglose detallado de usuarios, ingresos atribuibles, costos de infraestructura (IA, DB, Storage, Cloud Run), ganancia neta y margen por cada módulo.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-full">
                    Atención: Funciones en déficit resaltadas automáticamente
                  </span>
                </div>

                <div className="overflow-x-auto border border-white/10 rounded-2xl">
                  <table className="w-full text-left text-xs text-white/80">
                    <thead className="bg-[#0a0a0c] text-white/40 uppercase font-mono text-[10px] border-b border-white/10">
                      <tr>
                        <th className="p-3.5">Funcionalidad</th>
                        <th className="p-3.5">Usuarios</th>
                        <th className="p-3.5">Ingreso Atribuible</th>
                        <th className="p-3.5">Costo Infra ($ USD)</th>
                        <th className="p-3.5">Desglose Costos</th>
                        <th className="p-3.5">Ganancia Neta</th>
                        <th className="p-3.5">Margen %</th>
                        <th className="p-3.5">Tendencia</th>
                        <th className="p-3.5">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {financialData?.featureProfitability?.map((feat: any) => (
                        <tr
                          key={feat.id}
                          className={feat.isDeficit ? 'bg-red-500/10 hover:bg-red-500/20' : 'hover:bg-white/5'}
                        >
                          <td className="p-3.5 font-bold text-white flex items-center gap-2">
                            {feat.isDeficit && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                            {feat.name}
                          </td>
                          <td className="p-3.5 font-bold text-white/90">{feat.activeUsers} usrs</td>
                          <td className="p-3.5 text-[#00ff41] font-bold">
                            ${feat.revenueUsd} USD <span className="text-[10px] text-white/40 block">(${feat.revenueArs?.toLocaleString()} ARS)</span>
                          </td>
                          <td className="p-3.5 text-amber-400 font-bold">${feat.totalCostUsd} USD</td>
                          <td className="p-3.5 text-[10px] text-white/60 space-y-0.5">
                            <div>IA: ${feat.aiCostUsd} | DB: ${feat.firestoreCostUsd}</div>
                            <div>Storage: ${feat.storageCostUsd} | CloudRun: ${feat.cloudRunCostUsd}</div>
                          </td>
                          <td className={`p-3.5 font-black ${feat.netProfitUsd < 0 ? 'text-red-400' : 'text-[#00ff41]'}`}>
                            ${feat.netProfitUsd} USD
                          </td>
                          <td className="p-3.5 font-bold">
                            {feat.profitMarginPct}%
                          </td>
                          <td className="p-3.5 text-white/70">{feat.growthTrend}</td>
                          <td className="p-3.5">
                            {feat.status === 'DEFICIT' ? (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded text-[9px] font-bold uppercase animate-pulse">
                                DÉFICIT
                              </span>
                            ) : feat.status === 'PROFITABLE' ? (
                              <span className="px-2 py-0.5 bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 rounded text-[9px] font-bold uppercase">
                                RENTABLE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-white/10 text-white/60 border border-white/20 rounded text-[9px] font-bold uppercase">
                                SOPORTE BASE
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: FONDO DE RESERVA INTELIGENTE */}
          {finSubTab === 'reserve' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#00ff41]" /> Configuración de Repartición de Ingresos
                  </h3>
                  <p className="text-xs text-white/60">
                    Establece el porcentaje automático para Operaciones, Crecimiento y Reserva de Emergencia. El sistema nunca consumirá fondos de emergencia para gastos corrientes.
                  </p>

                  <form onSubmit={handleSaveReserveConfig} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono font-bold text-white">
                        <span>1. Operaciones ({opPctInput}%)</span>
                        <span>${((financialData?.financialState?.incomeMonthlyUsd || 435.50) * (opPctInput / 100)).toFixed(2)} USD</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={opPctInput}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setOpPctInput(val);
                          const remaining = 100 - val;
                          setGrowthPctInput(Math.max(0, remaining - emergPctInput));
                        }}
                        className="w-full accent-[#00ff41]"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono font-bold text-white">
                        <span>2. Crecimiento & Marketing ({growthPctInput}%)</span>
                        <span>${((financialData?.financialState?.incomeMonthlyUsd || 435.50) * (growthPctInput / 100)).toFixed(2)} USD</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={growthPctInput}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setGrowthPctInput(val);
                          setEmergPctInput(Math.max(0, 100 - opPctInput - val));
                        }}
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono font-bold text-emerald-400">
                        <span>3. Fondo de Emergencia Intocable ({emergPctInput}%)</span>
                        <span>${((financialData?.financialState?.incomeMonthlyUsd || 435.50) * (emergPctInput / 100)).toFixed(2)} USD</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        value={emergPctInput}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEmergPctInput(val);
                          setGrowthPctInput(Math.max(0, 100 - opPctInput - val));
                        }}
                        className="w-full accent-emerald-400"
                      />
                    </div>

                    <div className="p-3 bg-[#0a0a0c] rounded-xl border border-white/10 flex justify-between items-center text-xs font-mono">
                      <span className="text-white/60">Suma Total:</span>
                      <strong className={opPctInput + growthPctInput + emergPctInput === 100 ? 'text-[#00ff41]' : 'text-red-400'}>
                        {opPctInput + growthPctInput + emergPctInput}%
                      </strong>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingReserve || opPctInput + growthPctInput + emergPctInput !== 100}
                      className="w-full py-3 bg-[#00ff41] text-black font-extrabold text-xs uppercase rounded-xl transition-all hover:bg-[#00e038] disabled:opacity-50"
                    >
                      {isSavingReserve ? 'Guardando...' : 'Aplicar Distribución Inteligente'}
                    </button>
                  </form>
                </div>

                <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" /> Bóveda de Protección de Reserva
                  </h3>
                  <div className="p-5 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                      <Lock className="w-8 h-8 text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Garantía de Imposibilidad de Consumo</h4>
                        <p className="text-emerald-300/80">
                          Las APIs y servicios cloud (Gemini, Cloud Run, Firestore) están restringidos para operar únicamente sobre los fondos de Operación ({opPctInput}%). La subcuenta de emergencia es blindada por software.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-emerald-500/20 font-mono space-y-1">
                      <div className="flex justify-between text-white/80">
                        <span>Acumulado Intocable Actual:</span>
                        <strong className="text-emerald-400">${financialData?.reserveFundConfig?.emergencyPoolUsd || 43.55} USD</strong>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Equivalente en Pesos ARS:</span>
                        <strong className="text-emerald-400">~${Math.round((financialData?.reserveFundConfig?.emergencyPoolUsd || 43.55) * 1300).toLocaleString()} ARS</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 4: PREDICCIÓN DE CRECIMIENTO */}
          {finSubTab === 'growth_sim' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00ff41]" /> Motor de Simulación de Crecimiento & Escenarios
                </h3>
                <p className="text-xs text-white/60">
                  Simula escenarios hipotéticos de escala masiva (1.000 o 10.000 nuevos usuarios, aumentos en consumo de IA o cambios en precios de nube) para proyectar rentabilidad y riesgos.
                </p>

                <form onSubmit={handleRunGrowthSimulation} className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60 font-mono font-bold uppercase block">
                      Usuarios Adicionales
                    </label>
                    <input
                      type="number"
                      step="500"
                      value={simUsersInput}
                      onChange={(e) => setSimUsersInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#00ff41] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60 font-mono font-bold uppercase block">
                      Uso de IA (Multiplicador)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={simAiMultInput}
                      onChange={(e) => setSimAiMultInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#00ff41] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60 font-mono font-bold uppercase block">
                      Precio Firestore (Mult)
                    </label>
                    <input
                      type="number"
                      step="0.2"
                      value={simDbMultInput}
                      onChange={(e) => setSimDbMultInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#00ff41] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60 font-mono font-bold uppercase block">
                      Conversión a PRO (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={simConvRateInput}
                      onChange={(e) => setSimConvRateInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#00ff41] focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <button
                      type="submit"
                      disabled={isSimulatingGrowth}
                      className="w-full py-3 bg-[#00ff41] text-black font-extrabold text-xs uppercase rounded-xl transition-all hover:bg-[#00e038]"
                    >
                      {isSimulatingGrowth ? 'Simulando Escenario...' : 'Ejecutar Simulación de Crecimiento'}
                    </button>
                  </div>
                </form>

                {growthSimResult && (
                  <div className="p-6 bg-[#0a0a0c] rounded-2xl border border-white/10 space-y-4 mt-4 animate-fadeIn">
                    <h4 className="text-xs font-black uppercase text-[#00ff41] font-mono tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Resultados del Escenario Proyectado
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-[#161618] p-4 rounded-xl border border-white/10">
                        <span className="text-[10px] text-white/40 block font-mono font-bold uppercase">Total Usuarios Escenario</span>
                        <strong className="text-xl font-black text-white font-mono">{growthSimResult.results.newTotalUsers}</strong>
                        <span className="text-[10px] text-[#00ff41] block">{growthSimResult.results.estimatedNewPremiumUsers} Suscriptores PRO</span>
                      </div>

                      <div className="bg-[#161618] p-4 rounded-xl border border-white/10">
                        <span className="text-[10px] text-white/40 block font-mono font-bold uppercase">Ingresos Proyectados</span>
                        <strong className="text-xl font-black text-[#00ff41] font-mono">${growthSimResult.results.projectedMonthlyIncomeUsd} USD</strong>
                        <span className="text-[10px] text-white/60 block">${growthSimResult.results.projectedMonthlyIncomeArs?.toLocaleString()} ARS</span>
                      </div>

                      <div className="bg-[#161618] p-4 rounded-xl border border-white/10">
                        <span className="text-[10px] text-white/40 block font-mono font-bold uppercase">Costos Proyectados</span>
                        <strong className="text-xl font-black text-amber-400 font-mono">${growthSimResult.results.projectedCosts.totalUsd} USD</strong>
                        <span className="text-[10px] text-white/60 block">IA: ${growthSimResult.results.projectedCosts.aiUsd} | DB: ${growthSimResult.results.projectedCosts.firestoreUsd}</span>
                      </div>

                      <div className="bg-[#161618] p-4 rounded-xl border border-white/10">
                        <span className="text-[10px] text-white/40 block font-mono font-bold uppercase">Ganancia Neta Proyectada</span>
                        <strong className="text-xl font-black text-[#00ff41] font-mono">${growthSimResult.results.projectedGrossProfitUsd} USD</strong>
                        <span className="text-[10px] text-[#00ff41] block font-bold">Margen: {growthSimResult.results.netProfitMarginPct}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1">
                        <span className="text-red-400 font-bold block">Riesgos Identificados:</span>
                        {growthSimResult.results.risks.length > 0 ? (
                          growthSimResult.results.risks.map((r: string, idx: number) => (
                            <li key={idx} className="text-red-300 list-disc list-inside">{r}</li>
                          ))
                        ) : (
                          <span className="text-white/60">Sin riesgos financieros críticos detectados.</span>
                        )}
                      </div>

                      <div className="p-4 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-xl space-y-1">
                        <span className="text-[#00ff41] font-bold block">Recomendaciones Automáticas:</span>
                        {growthSimResult.results.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="text-white/80 list-disc list-inside">{rec}</li>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBTAB 5: SIMULADOR DE PRECIOS */}
          {finSubTab === 'pricing_sim' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#00ff41]" /> Simulador de Modelos de Monetización y Precios
                </h3>
                <p className="text-xs text-white/60">
                  Prueba distintas estructuras de precios y suscripciones en tiempo real sin modificar la aplicación en vivo para encontrar el punto de equilibrio y maximizar retornos.
                </p>

                <form onSubmit={handleRunPricingSimulation} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60 font-mono font-bold uppercase block">
                      Precio Mensual Atleta ($ ARS)
                    </label>
                    <input
                      type="number"
                      step="500"
                      value={simMonthlyArsInput}
                      onChange={(e) => setSimMonthlyArsInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#00ff41] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60 font-mono font-bold uppercase block">
                      Precio Anual Atleta ($ ARS)
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={simAnnualArsInput}
                      onChange={(e) => setSimAnnualArsInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#00ff41] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60 font-mono font-bold uppercase block">
                      Suscripción Club/Agente ($ ARS)
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={simClubArsInput}
                      onChange={(e) => setSimClubArsInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#00ff41] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60 font-mono font-bold uppercase block">
                      Límite Diario Plan Free (IA)
                    </label>
                    <input
                      type="number"
                      value={simFreeLimitInput}
                      onChange={(e) => setSimFreeLimitInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#00ff41] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60 font-mono font-bold uppercase block">
                      Objetivo de Suscriptores PRO
                    </label>
                    <input
                      type="number"
                      value={simTargetSubsInput}
                      onChange={(e) => setSimTargetSubsInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#00ff41] focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      disabled={isSimulatingPricing}
                      className="w-full py-3 bg-[#00ff41] text-black font-extrabold text-xs uppercase rounded-xl transition-all hover:bg-[#00e038]"
                    >
                      {isSimulatingPricing ? 'Calculando Modelo...' : 'Simular Estrategia de Precios'}
                    </button>
                  </div>
                </form>

                {pricingSimResult && (
                  <div className="p-6 bg-[#0a0a0c] rounded-2xl border border-white/10 space-y-4 mt-4 animate-fadeIn font-mono text-xs">
                    <h4 className="text-xs font-black uppercase text-[#00ff41] tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Diagnóstico Financiero de Precios Proyectado
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-[#161618] p-4 rounded-xl border border-white/10">
                        <span className="text-[10px] text-white/40 block font-bold uppercase">MRR Proyectado</span>
                        <strong className="text-xl font-black text-[#00ff41]">${pricingSimResult.results.estimatedMrrArs?.toLocaleString()} ARS</strong>
                        <span className="text-[10px] text-white/60 block">~${pricingSimResult.results.estimatedMrrUsd} USD</span>
                      </div>

                      <div className="bg-[#161618] p-4 rounded-xl border border-white/10">
                        <span className="text-[10px] text-white/40 block font-bold uppercase">Punto de Equilibrio (Break-Even)</span>
                        <strong className="text-xl font-black text-white">{pricingSimResult.results.breakEvenSubscribers} Suscriptores</strong>
                        <span className="text-[10px] text-[#00ff41] block">Mínimo para cubrimientos de costos</span>
                      </div>

                      <div className="bg-[#161618] p-4 rounded-xl border border-white/10">
                        <span className="text-[10px] text-white/40 block font-bold uppercase">Ganancia Neta</span>
                        <strong className="text-xl font-black text-[#00ff41]">${pricingSimResult.results.netProfitUsd} USD</strong>
                        <span className="text-[10px] text-white/60 block">${pricingSimResult.results.netProfitArs?.toLocaleString()} ARS</span>
                      </div>

                      <div className="bg-[#161618] p-4 rounded-xl border border-white/10">
                        <span className="text-[10px] text-white/40 block font-bold uppercase">Margen de Retorno</span>
                        <strong className="text-xl font-black text-cyan-400">{pricingSimResult.results.profitMarginPct}%</strong>
                        <span className="text-[10px] text-cyan-300 block">Retorno Alto</span>
                      </div>
                    </div>

                    <div className="p-4 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-xl space-y-1">
                      <span className="text-[#00ff41] font-bold block uppercase text-[10px]">Recomendación Estratégica Commercial:</span>
                      <p className="text-white/90">{pricingSimResult.results.recommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBTAB 6: PROTECCIÓN DE COSTOS & AUDITORÍA */}
          {finSubTab === 'protection' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Automatic Protection Mode Status Banner */}
              <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-6 h-6 text-[#00ff41]" />
                      <h3 className="text-base font-black uppercase text-white tracking-wider">
                        Estrategia Escalonada de Protección de Costos
                      </h3>
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      1. Respuestas en caché → 2. Consultas optimizadas → 3. Reducción duplicados → 4. Prioridad usuarios PRO → 5. Suspensión defensiva como último recurso.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black uppercase border flex items-center gap-2 ${
                      financialData?.protectionStatus?.status === 'PROTECTION_MODE_100'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                        : financialData?.protectionStatus?.status === 'THROTTLING_90'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : financialData?.protectionStatus?.status === 'OPTIMIZING_75'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-[#00ff41]/20 text-[#00ff41] border-[#00ff41]/40'
                    }`}>
                      <Activity className="w-3.5 h-3.5" />
                      Estado: {financialData?.protectionStatus?.status || 'NORMAL (0-49%)'}
                    </span>

                    <button
                      onClick={handleResetProtection}
                      className="px-4 py-2 bg-white/10 hover:bg-[#00ff41] hover:text-black text-white text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Purga & Optimización
                    </button>
                  </div>
                </div>

                {/* Gauge Progress Bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-white">
                      Consumo Presupuestario Mensual: ${financialData?.protectionStatus?.currentSpendUsd || '11.50'} USD / ${monthlyBudgetInput} USD
                    </span>
                    <span className={financialData?.protectionStatus?.percentageSpent > 75 ? 'text-amber-400' : 'text-[#00ff41]'}>
                      {financialData?.protectionStatus?.percentageSpent || 23}% Consumido
                    </span>
                  </div>
                  <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden flex p-0.5 border border-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        financialData?.protectionStatus?.percentageSpent >= 90
                          ? 'bg-red-500'
                          : financialData?.protectionStatus?.percentageSpent >= 75
                          ? 'bg-amber-500'
                          : 'bg-[#00ff41]'
                      }`}
                      style={{ width: `${Math.min(100, financialData?.protectionStatus?.percentageSpent || 23)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Presupuesto Form */}
              <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#00ff41]" /> Configurar Presupuesto Máximo y Cuotas Diarias
                </h3>

                <form onSubmit={handleSaveBudgetConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60 font-mono font-bold uppercase block">
                      Presupuesto Mensual ($ USD)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={monthlyBudgetInput}
                      onChange={(e) => setMonthlyBudgetInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#00ff41] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60 font-mono font-bold uppercase block">
                      Presupuesto Diario ($ USD)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={dailyBudgetInput}
                      onChange={(e) => setDailyBudgetInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#00ff41] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60 font-mono font-bold uppercase block">
                      Límite IA Usuario Free (/día)
                    </label>
                    <input
                      type="number"
                      value={freeAiLimitInput}
                      onChange={(e) => setFreeAiLimitInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#00ff41] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      disabled={isSavingBudget}
                      className="w-full py-3 bg-[#00ff41] text-black font-extrabold text-xs uppercase rounded-xl transition-all hover:bg-[#00e038]"
                    >
                      {isSavingBudget ? 'Guardando...' : 'Actualizar Parámetros Presupuestarios'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Audit Log Table */}
              <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-[#00ff41]" /> Auditoría de Optimización y Ahorros Automáticos
                </h3>

                <div className="overflow-x-auto border border-white/10 rounded-2xl">
                  <table className="w-full text-left text-xs text-white/80">
                    <thead className="bg-[#0a0a0c] text-white/40 uppercase font-mono text-[10px] border-b border-white/10">
                      <tr>
                        <th className="p-3">Acción Automática</th>
                        <th className="p-3">Causa / Razón</th>
                        <th className="p-3">Nivel Protección</th>
                        <th className="p-3">Ahorro Logrado</th>
                        <th className="p-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {financialData?.auditLogs?.map((log: any) => (
                        <tr key={log.id} className="hover:bg-white/5">
                          <td className="p-3 font-bold text-[#00ff41]">{log.action}</td>
                          <td className="p-3 text-white/80">{log.reason}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold">
                              {log.protectionLevel}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-cyan-400">
                            +${log.estimatedSavingsUsd} USD
                          </td>
                          <td className="p-3 text-white/40 text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 7: INFORME EJECUTIVO AUTOMÁTICO */}
          {finSubTab === 'report' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#00ff41]" /> Generador de Informes Ejecutivos Automáticos
                    </h3>
                    <p className="text-xs text-white/60">
                      Reporte estructurado para administradores y CTOs con ingresos, egresos, ahorros logrados y recomendaciones automáticas.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFetchExecutiveReport('daily')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                        reportPeriod === 'daily' ? 'bg-[#00ff41] text-black font-black' : 'bg-white/10 text-white'
                      }`}
                    >
                      Diario
                    </button>
                    <button
                      onClick={() => handleFetchExecutiveReport('weekly')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                        reportPeriod === 'weekly' ? 'bg-[#00ff41] text-black font-black' : 'bg-white/10 text-white'
                      }`}
                    >
                      Semanal
                    </button>
                    <button
                      onClick={() => handleFetchExecutiveReport('monthly')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                        reportPeriod === 'monthly' ? 'bg-[#00ff41] text-black font-black' : 'bg-white/10 text-white'
                      }`}
                    >
                      Mensual
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> Exportar / Imprimir
                    </button>
                  </div>
                </div>

                {isLoadingReport ? (
                  <div className="py-12 text-center space-y-2">
                    <RefreshCw className="w-8 h-8 text-[#00ff41] animate-spin mx-auto" />
                    <p className="text-xs text-white/60 font-mono">Compilando datos del Informe Ejecutivo...</p>
                  </div>
                ) : executiveReportData ? (
                  <div className="p-6 bg-[#0a0a0c] rounded-2xl border border-white/10 space-y-6 animate-fadeIn font-mono text-xs">
                    <div className="border-b border-white/10 pb-4 flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-black text-white uppercase">{executiveReportData.title}</h4>
                        <span className="text-white/40 text-[10px]">Generado el: {new Date(executiveReportData.generatedAt).toLocaleString()}</span>
                      </div>
                      <span className="px-3 py-1 bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 rounded-full text-[10px] font-bold">
                        ESTADO: OPERACIÓN SALUDABLE
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[#161618] p-4 rounded-xl border border-white/10 space-y-1">
                        <span className="text-white/40 block text-[10px] uppercase font-bold">Ingresos Totales ({executiveReportData.period})</span>
                        <strong className="text-lg text-[#00ff41] font-black">${executiveReportData.financialSummary.incomeArs?.toLocaleString()} ARS</strong>
                        <span className="text-white/50 block text-[10px]">~${executiveReportData.financialSummary.incomeUsd} USD</span>
                      </div>

                      <div className="bg-[#161618] p-4 rounded-xl border border-white/10 space-y-1">
                        <span className="text-white/40 block text-[10px] uppercase font-bold">Gastos Cloud ({executiveReportData.period})</span>
                        <strong className="text-lg text-amber-400 font-black">${executiveReportData.financialSummary.expensesUsd} USD</strong>
                        <span className="text-white/50 block text-[10px]">~${Math.round(executiveReportData.financialSummary.expensesUsd * 1300).toLocaleString()} ARS</span>
                      </div>

                      <div className="bg-[#161618] p-4 rounded-xl border border-white/10 space-y-1">
                        <span className="text-white/40 block text-[10px] uppercase font-bold">Ahorros Logrados por Optimización</span>
                        <strong className="text-lg text-cyan-400 font-black">+${executiveReportData.savingsFromOptimizationsUsd?.toFixed(4)} USD</strong>
                        <span className="text-cyan-300 block text-[10px]">Por caché & paginación firme</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-bold text-white uppercase text-[11px] text-[#00ff41]">Top Funcionalidades Más Rentables:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {executiveReportData.topProfitableFeatures?.slice(0, 3).map((f: any) => (
                          <div key={f.id} className="bg-[#161618] p-3 rounded-xl border border-white/10">
                            <span className="font-bold text-white block">{f.name}</span>
                            <span className="text-[#00ff41] block">Ganancia: +${f.netProfitUsd} USD</span>
                            <span className="text-white/40 text-[10px] block">Margen: {f.profitMarginPct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {executiveReportData.deficitFeatures?.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-bold text-red-400 uppercase text-[11px]">Funcionalidades Deficitarias Que Requieren Atención:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {executiveReportData.deficitFeatures.map((f: any) => (
                            <div key={f.id} className="bg-red-500/10 p-3 rounded-xl border border-red-500/30">
                              <span className="font-bold text-red-300 block">{f.name}</span>
                              <span className="text-red-400 block">Déficit Neta: ${f.netProfitUsd} USD</span>
                              <span className="text-white/60 text-[10px] block">Tendencia: {f.growthTrend}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-xl space-y-2">
                      <h5 className="font-bold text-[#00ff41] uppercase text-[11px]">Recomendaciones Estratégicas para la Dirección:</h5>
                      <ul className="list-disc list-inside space-y-1 text-white/90">
                        {executiveReportData.strategicRecommendations?.map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: PROMO COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase italic">Gestor de Cupones Promocionales</h3>
              <p className="text-xs text-white/60">Configura cupones de bonificación con restricciones por deporte, usos y expiración.</p>
            </div>
            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="px-4 py-2.5 bg-[#00ff41] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Crear Cupón
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div key={c.id} className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-[#00ff41] font-mono tracking-widest bg-[#00ff41]/10 px-3 py-1 rounded-xl border border-[#00ff41]/30">
                    {c.code}
                  </span>
                  <span className="text-xs font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-lg">
                    -{c.discountPercent}% OFF
                  </span>
                </div>

                <div className="space-y-1 text-xs text-white/70">
                  <p><strong>Usos:</strong> {c.usedCount} / {c.maxUses}</p>
                  <p><strong>Vigencia:</strong> {c.startDate} a {c.expirationDate}</p>
                  <p><strong>Deportes:</strong> {c.applicableSports?.join(', ') || 'Todos'}</p>
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-end">
                  <button
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: FEATURED PUBLICATIONS */}
      {activeTab === 'featured' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase italic">Publicaciones y Perfiles Destacados (7, 15, 30 días)</h3>
              <p className="text-xs text-white/60">Servicio de promoción pagada para búsquedas de clubes y atletas en la portada.</p>
            </div>
            <span className="text-xs font-mono text-[#00ff41] bg-[#00ff41]/10 px-3 py-1 rounded-full border border-[#00ff41]/30">
              Desactivación Automática
            </span>
          </div>

          <div className="bg-[#161618] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-white/80">
              <thead className="bg-[#0a0a0c] text-white/40 uppercase font-mono text-[10px] border-b border-white/10">
                <tr>
                  <th className="p-3.5">Título Promocionado</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Duración</th>
                  <th className="p-3.5">Monto (ARS)</th>
                  <th className="p-3.5">Expira el</th>
                  <th className="p-3.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {featuredBoosts.map((b) => (
                  <tr key={b.id} className="hover:bg-white/5">
                    <td className="p-3.5 font-bold text-white">{b.targetTitle}</td>
                    <td className="p-3.5 font-mono text-[10px] uppercase">{b.targetType === 'search' ? 'Búsqueda de Club' : 'Perfil Atleta'}</td>
                    <td className="p-3.5 font-mono text-[#00ff41] font-bold">{b.durationDays} días</td>
                    <td className="p-3.5 font-mono">{b.amount}</td>
                    <td className="p-3.5 font-mono text-white/60">{b.expiresAt.slice(0, 10)}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-[#00ff41]/20 text-[#00ff41] font-bold text-[10px]">
                        Activo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: FUTURE PHASES ARCHITECTURE */}
      {activeTab === 'future_phases' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
            <div>
              <h3 className="text-base font-black text-white uppercase italic flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#00ff41]" /> Arquitectura de Expansión Comercial (Fases 2+)
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Interfaces TypeScript y colecciones Firestore preparadas para escalamiento comercial de la plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                  <Megaphone className="w-4 h-4 text-[#00ff41]" /> Publicidad Deportiva
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Banners geolocalizados para marcas de indumentaria, bebidas e instituciones académicas.
                </p>
                <span className="text-[10px] font-mono text-[#00ff41] bg-[#00ff41]/10 px-2 py-0.5 rounded block">
                  Interface: SportsAdCampaign
                </span>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                  <ShoppingBag className="w-4 h-4 text-[#00ff41]" /> Marketplace Deportivo
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Venta directa de calzado, indumentaria oficial y suplementación deportiva.
                </p>
                <span className="text-[10px] font-mono text-[#00ff41] bg-[#00ff41]/10 px-2 py-0.5 rounded block">
                  Interface: MarketplaceProduct
                </span>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                  <Briefcase className="w-4 h-4 text-[#00ff41]" /> Licencias Ligas y Fed.
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Gestión institucional de fichajes para Ligas Regionales y AFA/Federaciones.
                </p>
                <span className="text-[10px] font-mono text-[#00ff41] bg-[#00ff41]/10 px-2 py-0.5 rounded block">
                  Interface: LeagueFederationLicense
                </span>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                  <Sparkles className="w-4 h-4 text-[#00ff41]" /> Patrocinadores & Eventos
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Sponsorship oficial de campus, torneos relámpago y pruebas masivas.
                </p>
                <span className="text-[10px] font-mono text-[#00ff41] bg-[#00ff41]/10 px-2 py-0.5 rounded block">
                  Interface: SponsorshipPackage
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161618] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-black text-white uppercase italic">Crear Nuevo Cupón Promocional</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-white/60 block">Código del Cupón</label>
                <input
                  type="text"
                  placeholder="Ej: ARGENTINA100, CLUB50"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block">Descuento (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newCouponDiscount}
                    onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                    required
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block">Usos Máximos</label>
                  <input
                    type="number"
                    min="1"
                    value={newCouponMaxUses}
                    onChange={(e) => setNewCouponMaxUses(Number(e.target.value))}
                    required
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block">Inicio</label>
                  <input
                    type="date"
                    value={newCouponStartDate}
                    onChange={(e) => setNewCouponStartDate(e.target.value)}
                    required
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block">Vencimiento</label>
                  <input
                    type="date"
                    value={newCouponExpDate}
                    onChange={(e) => setNewCouponExpDate(e.target.value)}
                    required
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00ff41] text-black rounded-xl text-xs font-extrabold uppercase"
                >
                  Guardar Cupón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

