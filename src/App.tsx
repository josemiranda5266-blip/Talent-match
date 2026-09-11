import React, { useState, useEffect } from 'react';
import { UserRole, Athlete, ClubSearch, SearchApplication, FreeTeamProfile, Tournament } from './types';
import { INITIAL_ATHLETES, INITIAL_SEARCHES, SPORTS_LIST, INITIAL_FREE_TEAMS, INITIAL_TOURNAMENTS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { AthleteView } from './components/AthleteView';
import { ClubView } from './components/ClubView';
import { AISmartSearch } from './components/AISmartSearch';
import { CandidateModal } from './components/CandidateModal';
import { TryoutsCalendar } from './components/TryoutsCalendar';
import { TeamsDirectoryView } from './components/TeamsDirectoryView';
import { TournamentsView } from './components/TournamentsView';
import { MonetizationModal } from './components/MonetizationModal';
import { CreateSearchModal } from './components/CreateSearchModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { LegalModal } from './components/LegalModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanelView } from './components/AdminPanelView';
import { ChatModal } from './components/ChatModal';
import { VerificationModal } from './components/VerificationModal';
import { ReviewsModal } from './components/ReviewsModal';
import { ReferralGamificationModal } from './components/ReferralGamificationModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SmartFeedView } from './components/SmartFeedView';
import { AiCoachModal } from './components/AiCoachModal';
import { ClubScoutAssistantModal } from './components/ClubScoutAssistantModal';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView';
import { calculateExecutiveDashboardData } from './lib/scoutAiEngine';
import { SubscriptionPlan, TransactionReceipt, UserGrowthProfile } from './types';
import { auth, onAuthStateChanged } from './lib/firebase';
import {
  UserProfile,
  fetchUserProfile,
  logoutUser,
  fetchAthletes,
  fetchClubSearches,
  fetchTeamsList,
  fetchTournamentsList,
  saveAthleteProfile,
  createClubSearch,
  submitApplication,
  createTeamProfile,
  createTournament,
  listenUserNotifications,
  seedInitialFirestoreDataIfNeeded,
  getUserGrowthProfile,
  isDemoMode
} from './services/firebaseService';
import {
  Trophy,
  Sparkles,
  Search,
  Building2,
  Users,
  MapPin,
  CheckCircle2,
  Calendar,
  Crown,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  PlusCircle,
  Video
} from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('athlete');
  const [activeTab, setActiveTab] = useState<
    'smart-feed' | 'explore' | 'executive-dashboard' | 'athletes' | 'calendar' | 'teams' | 'tournaments' | 'monetization' | 'my-profile' | 'club-panel' | 'admin'
  >('smart-feed');

  // AI Modal States (Phase 5)
  const [isCoachAiOpen, setIsCoachAiOpen] = useState<boolean>(false);
  const [isScoutAiOpen, setIsScoutAiOpen] = useState<boolean>(false);

  // Firebase User Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // New Feature Modals
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatTargetUser, setChatTargetUser] = useState<{ uid: string; name: string; avatar: string; role: string } | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [isGrowthModalOpen, setIsGrowthModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [growthProfile, setGrowthProfile] = useState<UserGrowthProfile>({
    referralCode: 'TALENT100',
    totalReferrals: 4,
    successfulConversions: 2,
    points: 450,
    currentLevel: 'Promesa',
    profileCompletionPercent: 85,
    unlockedRewards: ['7 días PRO Bonificado', 'Insignia Perfil Destacado'],
    achievements: [
      {
        id: 'ACH-1',
        title: 'Ficha Completa 100%',
        description: 'Completaste foto, estadísticas y videos de jugadas.',
        badgeIcon: '🏆',
        unlocked: true,
        unlockedAt: '2025-06-10',
        pointsBonus: 150,
      },
      {
        id: 'ACH-2',
        title: 'Primer Video de Highlights',
        description: 'Subiste un video de jugadas destacado.',
        badgeIcon: '🎬',
        unlocked: true,
        unlockedAt: '2025-06-12',
        pointsBonus: 100,
      },
      {
        id: 'ACH-3',
        title: 'Embajador Viral (3 Referidos)',
        description: 'Invitaste a 3 deportistas o clubes a la plataforma.',
        badgeIcon: '🤝',
        unlocked: true,
        unlockedAt: '2025-07-01',
        pointsBonus: 200,
      },
      {
        id: 'ACH-4',
        title: 'Talent Hunter PRO',
        description: 'Conseguiste 5 referidos que se convirtieron a PRO.',
        badgeIcon: '⚡',
        unlocked: false,
        pointsBonus: 500,
      },
    ],
  });

  const [reviewsModalTarget, setReviewsModalTarget] = useState<{ id: string; name: string } | null>(null);

  // Core Datasets from Firestore / Demo Mode
  const demoActive = isDemoMode();
  const [athletes, setAthletes] = useState<Athlete[]>(demoActive ? INITIAL_ATHLETES : []);
  const [freeTeams, setFreeTeams] = useState<FreeTeamProfile[]>(demoActive ? INITIAL_FREE_TEAMS : []);
  const [tournaments, setTournaments] = useState<Tournament[]>(demoActive ? INITIAL_TOURNAMENTS : []);
  const [searches, setSearches] = useState<ClubSearch[]>(demoActive ? INITIAL_SEARCHES : []);
  const [currentAthlete, setCurrentAthlete] = useState<Athlete>(demoActive ? INITIAL_ATHLETES[0] : ({} as Athlete));
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [applications, setApplications] = useState<SearchApplication[]>([
    {
      id: 'app-1',
      searchId: 'search-1',
      athleteId: 'ath-1',
      appliedAt: '2026-07-28',
      status: 'Citado a Prueba',
      noteFromAthlete: 'Disponible para viajar a Santiago del Estero la fecha de la prueba.',
      matchScore: 94,
    },
  ]);

  // Initial Data Loading
  useEffect(() => {
    loadFirestoreData();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const profile = await fetchUserProfile(fbUser.uid);
        if (profile) {
          setCurrentUser(profile);
          setCurrentRole(profile.role === 'admin' ? 'club' : (profile.role as UserRole));
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadFirestoreData = async () => {
    try {
      setFirestoreError(null);
      const [athList, searchList, teamList, tournList] = await Promise.all([
        fetchAthletes(),
        fetchClubSearches(),
        fetchTeamsList(),
        fetchTournamentsList()
      ]);
      setAthletes(athList);
      setSearches(searchList);
      setFreeTeams(teamList);
      setTournaments(tournList);
      if (athList.length) {
        setCurrentAthlete(athList[0]);
      }
    } catch (e) {
      console.error('Error loading Firestore data:', e);
      if (!isDemoMode()) {
        setFirestoreError('No se pudo conectar a la base de datos de producción (Firestore). Verifique la conexión o credenciales.');
      } else {
        setAthletes(INITIAL_ATHLETES);
        setSearches(INITIAL_SEARCHES);
        setFreeTeams(INITIAL_FREE_TEAMS);
        setTournaments(INITIAL_TOURNAMENTS);
        if (INITIAL_ATHLETES.length) setCurrentAthlete(INITIAL_ATHLETES[0]);
      }
    }
  };

  const handleAddFreeTeam = async (newTeam: FreeTeamProfile) => {
    setFreeTeams((prev) => [newTeam, ...prev]);
    await createTeamProfile(newTeam);
  };

  const handleAddTournament = async (newTournament: Tournament) => {
    setTournaments((prev) => [newTournament, ...prev]);
    await createTournament(newTournament);
  };

  // Subscription & Checkout States
  const [isAthletePro, setIsAthletePro] = useState<boolean>(true);
  const [isClubPro, setIsClubPro] = useState<boolean>(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [transactionReceipts, setTransactionReceipts] = useState<TransactionReceipt[]>([]);

  // Legal & Compliance Modal State
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'youth' | 'consumer' | 'certification'>('certification');

  const handlePaymentSuccess = (receipt: TransactionReceipt) => {
    setTransactionReceipts((prev) => [receipt, ...prev]);

    if (receipt.planName.toLowerCase().includes('atleta') || receipt.planId.includes('athlete')) {
      setIsAthletePro(true);
    } else if (receipt.planName.toLowerCase().includes('club') || receipt.planId.includes('club')) {
      setIsClubPro(true);
    }
  };

  // Filter States for Main Explore
  const [filterSport, setFilterSport] = useState<string>('Todos');

  // Modal States
  const [selectedCandidate, setSelectedCandidate] = useState<Athlete | null>(null);
  const [isCreateSearchOpen, setIsCreateSearchOpen] = useState(false);
  const [isMonetizationOpen, setIsMonetizationOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Notifications Feed
  const [notifications, setNotifications] = useState([
    {
      id: 'n-1',
      title: '¡Nueva Búsqueda en tu Deporte!',
      message: 'Central Córdoba busca Defensor Central para prueba presencial en Santiago del Estero.',
      time: 'Hace 10 min',
      unread: true,
      type: 'match' as const,
    },
    {
      id: 'n-2',
      title: 'Visita a tu Video Highlight',
      message: 'Un scout de Atenas de Córdoba vio tu video de mejores jugadas.',
      time: 'Hace 2 horas',
      unread: true,
      type: 'view' as const,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Handlers
  const handleUpdateAthlete = async (updated: Athlete) => {
    setCurrentAthlete(updated);
    setAthletes((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    await saveAthleteProfile(updated);
  };

  const handleApplyToSearch = async (searchId: string, note?: string) => {
    const existing = applications.find((a) => a.searchId === searchId && a.athleteId === currentAthlete.id);
    if (existing) return;

    const newApp: SearchApplication = {
      id: `app-${Date.now()}`,
      searchId,
      athleteId: currentAthlete.id,
      appliedAt: new Date().toISOString().split('T')[0],
      status: 'Pendiente',
      noteFromAthlete: note,
    };

    setApplications((prev) => [newApp, ...prev]);

    // Update search applicant count
    setSearches((prev) =>
      prev.map((s) => (s.id === searchId ? { ...s, applicantCount: s.applicantCount + 1 } : s))
    );

    await submitApplication(newApp);
  };

  const handleCreateSearch = async (newSearch: ClubSearch) => {
    setSearches((prev) => [newSearch, ...prev]);
    await createClubSearch(newSearch);
  };

  const handleUpdateApplicationStatus = (appId: string, newStatus: any) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );
  };

  const filteredSearches = searches.filter(
    (s) => filterSport === 'Todos' || s.sport === filterSport
  );

  const filteredAthletes = athletes.filter(
    (a) => filterSport === 'Todos' || a.sport === filterSport
  );

  const handleOpenChatWithAthlete = (ath: Athlete) => {
    setChatTargetUser({
      uid: ath.id,
      name: ath.name,
      avatar: ath.avatar,
      role: 'athlete'
    });
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f4f4f6] flex flex-col font-sans selection:bg-[#00ff41] selection:text-black overflow-x-hidden w-full max-w-full">
      {/* Production Firestore Connection Error Banner */}
      {firestoreError && (
        <div className="bg-red-950/90 border-b border-red-500/50 text-red-200 px-4 py-3 text-sm flex items-center justify-between shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span className="font-semibold">⚠️ Alerta de Producción (Firestore):</span>
            <span>{firestoreError}</span>
          </div>
          <button
            onClick={() => setFirestoreError(null)}
            className="text-red-300 hover:text-white text-xs bg-red-900/50 px-2 py-1 rounded border border-red-500/30 transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAthletePro={isAthletePro}
        isClubPro={isClubPro}
        onOpenMonetization={() => setIsMonetizationOpen(true)}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenLegalModal={() => {
          setLegalModalTab('certification');
          setIsLegalModalOpen(true);
        }}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenChat={() => {
          setChatTargetUser(null);
          setIsChatOpen(true);
        }}
        onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
        onOpenGrowthModal={() => setIsGrowthModalOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onLogout={logoutUser}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 overflow-x-hidden">
        {/* VIEW 0: SMART FEED IA (FASE 5) */}
        {activeTab === 'smart-feed' && (
          <SmartFeedView
            currentUserRole={currentRole}
            currentAthlete={currentAthlete}
            activeSearches={searches}
            allCandidates={athletes}
            tournaments={tournaments}
            onOpenCoachAi={() => setIsCoachAiOpen(true)}
            onOpenScoutAi={() => setIsScoutAiOpen(true)}
            onApplyToSearch={(sId, note) => handleApplyToSearch(sId)}
            onSelectSearch={(s) => setActiveTab('explore')}
            onSelectAthlete={(ath) => setSelectedCandidate(ath)}
            onOpenExecutiveDashboard={() => setActiveTab('executive-dashboard')}
          />
        )}

        {/* VIEW 0.5: EXECUTIVE DASHBOARD (FASE 5) */}
        {activeTab === 'executive-dashboard' && (
          <ExecutiveDashboardView
            athlete={currentAthlete}
            dashboardData={calculateExecutiveDashboardData(currentAthlete, searches)}
          />
        )}

        {/* VIEW 1: EXPLORE / HOME VIEW (BENTO GRID STYLE) */}
        {activeTab === 'explore' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Bento Hero & Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Main Bento Hero Card (Spans 2 cols) */}
              <div id="hero-banner" className="lg:col-span-2 relative rounded-3xl overflow-hidden bg-[#161618] border border-white/10 p-5 sm:p-10 shadow-2xl flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff41]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-2 bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] text-[10px] sm:text-xs px-3 py-1 rounded-full font-bold tracking-widest uppercase">
                    <Sparkles className="w-3.5 h-3.5" /> Red Nacional de Scouteo Deportivo
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase italic leading-tight">
                    El <span className="text-[#00ff41] underline decoration-[#00ff41]/40">LinkedIn Deportivo</span> con Scouteo Inteligente
                  </h1>

                  <p className="text-white/70 text-sm leading-relaxed max-w-2xl font-normal">
                    Fútbol, básquet, vóley, rugby, hockey y más. Los atletas crean su ficha técnica verificada, los clubes publican convocatorias y la inteligencia artificial genera recomendaciones en tiempo real.
                  </p>
                </div>

                {/* Hero CTAs */}
                <div className="relative z-10 flex flex-wrap items-center gap-3 pt-6 border-t border-white/10 mt-6">
                  <button
                    id="hero-btn-profile"
                    onClick={() => setActiveTab(currentRole === 'club' ? 'club-panel' : 'my-profile')}
                    className="px-6 py-3 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Trophy className="w-4 h-4" />
                    {currentRole === 'club' ? 'Gestionar Convocatorias' : 'Mi Ficha de Atleta'}
                  </button>

                  <button
                    id="hero-btn-ai-search"
                    onClick={() => setActiveTab('athletes')}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-[#00ff41]" />
                    Buscador IA Talentos
                  </button>
                </div>
              </div>

              {/* Secondary Bento Widget: Live Platform Stats */}
              <div className="rounded-3xl bg-[#161618] border border-white/10 p-6 shadow-2xl flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-[#00ff41] text-[10px] font-bold tracking-[0.2em] uppercase">Ecosistema ScoutAR</span>
                  <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-ping" />
                </div>

                <div className="space-y-4">
                  <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/5">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider block">Atletas Activos</span>
                    <span className="text-3xl font-black text-white font-mono mt-0.5 block">+{athletes.length}</span>
                  </div>

                  <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/5">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider block">Clubes / Escuelas</span>
                    <span className="text-3xl font-black text-[#00ff41] font-mono mt-0.5 block">+{freeTeams.length}</span>
                  </div>

                  <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/5">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider block">Base Firestore</span>
                    <span className="text-3xl font-black text-white font-mono mt-0.5 block">Online ✓</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Base de datos en tiempo real</span>
                </div>
              </div>
            </div>

            {/* ADVERTISEMENT / PROMOTIONAL BANNER */}
            <div className="bg-gradient-to-r from-[#161618] via-[#1a1c1e] to-[#161618] border-2 border-[#00ff41]/40 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden group hover:border-[#00ff41] transition-all">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#00ff41]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16 group-hover:bg-[#00ff41]/15 transition-all" />

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-[#00ff41] text-black font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                      <Zap className="w-3.5 h-3.5" /> Anuncio Oficial • Difusión Deportiva
                    </span>
                    <span className="bg-white/10 text-[#00ff41] font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#00ff41]/30">
                      Arancel Simbólico: $4.900 ARS
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-3xl font-black text-white uppercase italic tracking-tight leading-tight">
                    🏆 ¿Organizas un <span className="text-[#00ff41]">Torneo, Copa o Liga</span> Deportivo?
                  </h2>

                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                    Publica tu competencia en el portal nacional de TalentMatch y promociónala ante más de 15.000 deportistas, clubes y escuelas de todo el país por un arancel bajo único de <strong className="text-white">$4.900 ARS por 60 días</strong>.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold text-white/70">
                    <span className="bg-[#0a0a0c] px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff41] shrink-0" /> Botón Directo WhatsApp
                    </span>
                    <span className="bg-[#0a0a0c] px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff41] shrink-0" /> Link a Formulario / Web
                    </span>
                    <span className="bg-[#0a0a0c] px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff41] shrink-0" /> Carga Fotos Celular / PC
                    </span>
                    <span className="bg-[#0a0a0c] px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff41] shrink-0" /> Sello Verificado
                    </span>
                  </div>
                </div>

                <button
                  id="home-ad-btn-publish-tournament"
                  onClick={() => setActiveTab('tournaments')}
                  className="w-full lg:w-auto px-6 py-3.5 sm:py-4 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-[#00ff41]/25 hover:scale-105 transition-all flex items-center justify-center gap-2.5 shrink-0"
                >
                  <Trophy className="w-5 h-5" /> Publicar Mi Torneo Ahora ➔
                </button>
              </div>
            </div>

            {/* Sports Category Filter Pills */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#00ff41] flex items-center gap-2">
                  <Search className="w-4 h-4" /> Categoría por Disciplina
                </h2>
                <span className="text-[11px] text-white/50 font-mono">Argentina & Latam</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setFilterSport('Todos')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl whitespace-nowrap transition-all border ${
                    filterSport === 'Todos'
                      ? 'bg-[#00ff41] text-black border-[#00ff41] shadow-md shadow-[#00ff41]/20 font-black'
                      : 'bg-[#161618] text-white/70 border-white/10 hover:border-white/20'
                  }`}
                >
                  Todas las Disciplinas
                </button>
                {SPORTS_LIST.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setFilterSport(s.name)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl whitespace-nowrap transition-all border ${
                      filterSport === s.name
                        ? 'bg-[#00ff41] text-black border-[#00ff41] shadow-md shadow-[#00ff41]/20 font-black'
                        : 'bg-[#161618] text-white/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Bento Grid Section: Búsquedas Destacadas de Clubes */}
            <div id="featured-searches-section" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#00ff41]" /> Búsquedas y Convocatorias Abiertas
                  </h2>
                  <p className="text-xs text-white/50">Clubes buscando talentos y refuerzos en curso</p>
                </div>
                {currentRole === 'club' && (
                  <button
                    onClick={() => setIsCreateSearchOpen(true)}
                    className="px-4 py-2 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> Publicar Búsqueda
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSearches.map((search) => {
                  const hasApplied = applications.some((a) => a.searchId === search.id && a.athleteId === currentAthlete.id);

                  return (
                    <div
                      key={search.id}
                      id={`explore-search-card-${search.id}`}
                      className="bg-[#161618] rounded-3xl border border-white/10 p-6 shadow-xl hover:border-[#00ff41]/50 transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30">
                              {search.sport} • {search.positionNeeded}
                            </span>
                            <h3 className="text-base font-extrabold text-white mt-2">{search.title}</h3>
                            <p className="text-xs text-white/60 flex items-center gap-1 mt-1">
                              <Building2 className="w-3.5 h-3.5 text-[#00ff41]" />
                              <strong className="text-white">{search.clubName}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-white/70 bg-[#0a0a0c] p-3 rounded-2xl border border-white/5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#00ff41]" /> {search.city}, {search.province}
                          </span>
                          <span>•</span>
                          <span className="font-mono">Prueba: {search.trialDate}</span>
                        </div>

                        <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">{search.description}</p>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-white/50 font-mono">{search.applicantCount} postulantes</span>

                        <button
                          id={`btn-postulate-${search.id}`}
                          onClick={() => handleApplyToSearch(search.id)}
                          disabled={hasApplied}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                            hasApplied
                              ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
                              : 'bg-[#00ff41] hover:bg-[#00ff41]/90 text-black shadow-md shadow-[#00ff41]/20'
                          }`}
                        >
                          {hasApplied ? 'Postulado ✓' : 'Postularse'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bento Grid Section: Atletas Destacados */}
            <div id="featured-athletes-section" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#00ff41]" /> Atletas Promesas Destacados
                  </h2>
                  <p className="text-xs text-white/50">Fichas técnicas de deportistas en búsqueda de club</p>
                </div>

                <button
                  onClick={() => setActiveTab('athletes')}
                  className="text-xs font-extrabold uppercase tracking-wider text-[#00ff41] hover:underline flex items-center gap-1"
                >
                  Buscador IA <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredAthletes.map((ath) => (
                  <div
                    key={ath.id}
                    id={`featured-athlete-card-${ath.id}`}
                    className="bg-[#161618] rounded-3xl p-5 border border-white/10 hover:border-[#00ff41]/50 transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={ath.avatar}
                          alt={ath.name}
                          className="w-full h-40 object-cover rounded-2xl ring-1 ring-white/10"
                        />
                        {ath.isPremium && (
                          <span className="absolute top-2 right-2 bg-[#00ff41] text-black font-black text-[9px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                            <Crown className="w-3 h-3" /> PRO
                          </span>
                        )}
                        <span className="absolute bottom-2 left-2 bg-[#0a0a0c]/90 text-[#00ff41] text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border border-white/10 uppercase tracking-wider">
                          {ath.sport}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-extrabold text-white flex items-center gap-1">
                          {ath.name}
                          {ath.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff41]" />}
                        </h3>
                        <p className="text-xs text-white/60 font-medium">{ath.position} • {ath.age} años</p>
                        <p className="text-[11px] text-white/40 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {ath.city}, {ath.province}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-center text-[10px] bg-[#0a0a0c] p-2 rounded-xl border border-white/5 text-white/80 font-mono">
                        <div>
                          <span className="text-white/40 block text-[9px]">Exp. / Alt.</span>
                          <span className="font-bold">{ath.heightCm ? `${ath.heightCm}cm` : `${ath.yearsExperience || 1}a exp`}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px]">Perfil / Disp.</span>
                          <span className="font-bold text-[#00ff41]">{ath.preferredFootOrHand || ath.availability || 'Inmediata'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px]">Partidos / Puntos</span>
                          <span className="font-bold">{ath.stats?.matchesPlayed ?? (ath.yearsExperience ? `${ath.yearsExperience}a` : '1a')}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      id={`btn-open-dossier-${ath.id}`}
                      onClick={() => setSelectedCandidate(ath)}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-white/10"
                    >
                      Ver Ficha Completa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: AI SMART SEARCH & ADVANCED FILTERS */}
        {activeTab === 'athletes' && (
          <AISmartSearch
            athletes={athletes}
            onOpenCandidateModal={(ath) => setSelectedCandidate(ath)}
            onOpenReviewsModal={(id, name) => setReviewsModalTarget({ id, name })}
          />
        )}

        {/* VIEW 3: TRYOUTS CALENDAR */}
        {activeTab === 'calendar' && (
          <TryoutsCalendar
            searches={searches}
            onApplyToSearch={(id) => handleApplyToSearch(id)}
          />
        )}

        {/* VIEW 4: TEAMS DIRECTORY & MAP */}
        {activeTab === 'teams' && (
          <TeamsDirectoryView
            teams={freeTeams}
            onAddTeam={handleAddFreeTeam}
          />
        )}

        {/* VIEW 5: TOURNAMENTS PORTAL */}
        {activeTab === 'tournaments' && (
          <TournamentsView
            tournaments={tournaments}
            onAddTournament={handleAddTournament}
          />
        )}

        {/* VIEW 6: ATHLETE MY-PROFILE */}
        {activeTab === 'my-profile' && (
          <AthleteView
            athlete={currentAthlete}
            onUpdateAthlete={handleUpdateAthlete}
            searches={searches}
            applications={applications}
            onApplyToSearch={handleApplyToSearch}
            onOpenCandidateModal={(ath) => setSelectedCandidate(ath)}
            onOpenMonetization={() => setIsMonetizationOpen(true)}
          />
        )}

        {/* VIEW 7: CLUB PANEL */}
        {activeTab === 'club-panel' && (
          <ClubView
            searches={searches}
            athletes={athletes}
            applications={applications}
            onOpenCreateSearchModal={() => setIsCreateSearchOpen(true)}
            onOpenCandidateModal={(ath) => setSelectedCandidate(ath)}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
          />
        )}

        {/* VIEW 8: ADMIN PANEL */}
        {activeTab === 'admin' && (
          <AdminPanelView />
        )}
      </main>

      {/* Global Modals & Drawers */}
      <CandidateModal
        athlete={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onInviteToTrial={(athleteId) => {
          console.log('Invited athlete:', athleteId);
        }}
        onOpenChatWithAthlete={handleOpenChatWithAthlete}
        onOpenReviewsModal={(id, name) => setReviewsModalTarget({ id, name })}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(profile) => {
          setCurrentUser(profile);
          setCurrentRole(profile.role === 'admin' ? 'club' : (profile.role as UserRole));
        }}
      />

      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUser={currentUser}
        targetUser={chatTargetUser}
      />

      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        currentUser={currentUser}
      />

      <ReviewsModal
        isOpen={!!reviewsModalTarget}
        onClose={() => setReviewsModalTarget(null)}
        targetId={reviewsModalTarget?.id || ''}
        targetName={reviewsModalTarget?.name || ''}
        currentUser={currentUser}
      />

      <CreateSearchModal
        isOpen={isCreateSearchOpen}
        onClose={() => setIsCreateSearchOpen(false)}
        onCreateSearch={handleCreateSearch}
      />

      <MonetizationModal
        isOpen={isMonetizationOpen}
        onClose={() => setIsMonetizationOpen(false)}
        isAthletePro={isAthletePro}
        isClubPro={isClubPro}
        onToggleAthletePro={() => setIsAthletePro(!isAthletePro)}
        onToggleClubPro={() => setIsClubPro(!isClubPro)}
        onOpenCheckout={(plan) => {
          setIsMonetizationOpen(false);
          setSelectedPlanForCheckout(plan);
        }}
      />

      <CheckoutModal
        isOpen={!!selectedPlanForCheckout}
        onClose={() => setSelectedPlanForCheckout(null)}
        plan={selectedPlanForCheckout}
        onSuccess={handlePaymentSuccess}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
        }
      />

      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        defaultTab={legalModalTab}
      />

      {/* Footer */}
      <footer className="mt-12 bg-[#161618] border-t border-white/10 py-10 text-xs text-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#00ff41] text-black flex items-center justify-center font-black shadow-md shadow-[#00ff41]/20">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="font-extrabold uppercase tracking-tight text-white text-sm">TalentMatch • ScoutAR</span>
              <span className="text-white/40 hidden sm:inline">— Red Inteligente de Scouteo Deportivo Argentina & LATAM</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Cumplimiento Legal Certificado
              </span>
            </div>
          </div>

          {/* Legal Links Footer Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-[11px]">
            <div className="flex flex-wrap items-center gap-3 text-white/60">
              <button
                onClick={() => {
                  setLegalModalTab('certification');
                  setIsLegalModalOpen(true);
                }}
                className="hover:text-[#00ff41] transition-colors font-bold flex items-center gap-1 text-white"
              >
                📜 Dictamen de Certificación
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setLegalModalTab('privacy');
                  setIsLegalModalOpen(true);
                }}
                className="hover:text-[#00ff41] transition-colors"
              >
                Protección de Datos (Ley 25.326)
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setLegalModalTab('youth');
                  setIsLegalModalOpen(true);
                }}
                className="hover:text-[#00ff41] transition-colors"
              >
                Atletas Juveniles & FIFA
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setLegalModalTab('consumer');
                  setIsLegalModalOpen(true);
                }}
                className="hover:text-[#00ff41] transition-colors"
              >
                Defensa Consumidor & Arrepentimiento
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setLegalModalTab('terms');
                  setIsLegalModalOpen(true);
                }}
                className="hover:text-[#00ff41] transition-colors"
              >
                Términos de Servicio
              </button>
            </div>

            <p className="text-white/40 text-[10px]">
              © 2026 TalentMatch. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Onboarding & Walkthrough Tour Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Referral & Gamification Modal */}
      <ReferralGamificationModal
        isOpen={isGrowthModalOpen}
        onClose={() => setIsGrowthModalOpen(false)}
        growthProfile={growthProfile}
        userName={currentUser?.displayName || currentAthlete.name}
        userRole={currentRole}
      />

      {/* Phase 5 AI Coach Modal */}
      <AiCoachModal
        athlete={currentAthlete}
        isOpen={isCoachAiOpen}
        onClose={() => setIsCoachAiOpen(false)}
      />

      {/* Phase 5 AI Scout Assistant Modal */}
      <ClubScoutAssistantModal
        candidates={athletes}
        clubName="Central Córdoba"
        isOpen={isScoutAiOpen}
        onClose={() => setIsScoutAiOpen(false)}
        onSelectCandidate={(ath) => setSelectedCandidate(ath)}
      />
    </div>
  );
}
