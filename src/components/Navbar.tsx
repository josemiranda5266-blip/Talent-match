import React from 'react';
import { UserRole } from '../types';
import {
  Trophy,
  Search,
  Sparkles,
  Calendar,
  BadgeCheck,
  Bell,
  Crown,
  Shield,
  Users,
  Scale,
  MessageSquare,
  User,
  LogOut,
  ShieldCheck,
  Award
} from 'lucide-react';
import { UserProfile } from '../services/firebaseService';

interface NavbarProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeTab: 'explore' | 'smart-feed' | 'executive-dashboard' | 'athletes' | 'calendar' | 'teams' | 'tournaments' | 'monetization' | 'my-profile' | 'club-panel' | 'admin';
  setActiveTab: (tab: 'explore' | 'smart-feed' | 'executive-dashboard' | 'athletes' | 'calendar' | 'teams' | 'tournaments' | 'monetization' | 'my-profile' | 'club-panel' | 'admin') => void;
  isAthletePro: boolean;
  isClubPro: boolean;
  onOpenMonetization: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenLegalModal?: () => void;
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onOpenChat: () => void;
  onOpenVerificationModal: () => void;
  onOpenGrowthModal?: () => void;
  onOpenOnboarding?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  setCurrentRole,
  activeTab,
  setActiveTab,
  isAthletePro,
  isClubPro,
  onOpenMonetization,
  unreadCount,
  onOpenNotifications,
  onOpenLegalModal,
  currentUser,
  onOpenAuthModal,
  onOpenChat,
  onOpenVerificationModal,
  onOpenGrowthModal,
  onOpenOnboarding,
  onLogout
}) => {
  return (
    <>
      <header id="main-header" className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/10 text-white transition-all py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#161618] border border-white/10 rounded-2xl px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-2xl gap-2">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                id="logo-button"
                onClick={() => setActiveTab('explore')}
                className="flex items-center gap-2 sm:gap-3 text-left group focus:outline-none"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#00ff41] rounded-xl flex items-center justify-center shadow-lg shadow-[#00ff41]/20 group-hover:scale-105 transition-transform shrink-0">
                  <Trophy className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-black font-black" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-black text-lg sm:text-2xl tracking-tighter uppercase italic text-white">
                      Talent<span className="text-[#00ff41]">Match</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 hidden sm:inline-block">
                      ScoutAR
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 tracking-widest uppercase hidden md:block font-bold">Red Inteligente de Scouteo Deportivo</p>
                </div>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                id="nav-tab-smart-feed"
                onClick={() => setActiveTab('smart-feed')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'smart-feed'
                    ? 'bg-[#00ff41] text-black font-black shadow-md shadow-[#00ff41]/20'
                    : 'text-[#00ff41] hover:bg-[#00ff41]/10'
                }`}
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                Feed IA
              </button>

              <button
                id="nav-tab-explore"
                onClick={() => setActiveTab('explore')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'explore'
                    ? 'bg-[#00ff41] text-black font-black shadow-md shadow-[#00ff41]/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Search className="w-4 h-4" />
                Búsquedas
              </button>

              <button
                id="nav-tab-athletes"
                onClick={() => setActiveTab('athletes')}
                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'athletes'
                    ? 'bg-[#00ff41] text-black font-black shadow-md shadow-[#00ff41]/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Buscador IA
              </button>

              <button
                id="nav-tab-calendar"
                onClick={() => setActiveTab('calendar')}
                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'calendar'
                    ? 'bg-[#00ff41] text-black font-black shadow-md shadow-[#00ff41]/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Pruebas
              </button>

              <button
                id="nav-tab-teams"
                onClick={() => setActiveTab('teams')}
                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'teams'
                    ? 'bg-[#00ff41] text-black font-black shadow-md shadow-[#00ff41]/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4" />
                Clubes / Escuelas
              </button>

              <button
                id="nav-tab-tournaments"
                onClick={() => setActiveTab('tournaments')}
                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'tournaments'
                    ? 'bg-[#00ff41] text-black font-black shadow-md shadow-[#00ff41]/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Torneos
              </button>

              <button
                id="nav-tab-role-view"
                onClick={() => setActiveTab(currentRole === 'club' ? 'club-panel' : 'my-profile')}
                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'my-profile' || activeTab === 'club-panel'
                    ? 'bg-[#00ff41] text-black font-black shadow-md shadow-[#00ff41]/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {currentRole === 'club' ? <Shield className="w-4 h-4" /> : <BadgeCheck className="w-4 h-4" />}
                {currentRole === 'club' ? 'Panel Club' : 'Mi Perfil'}
              </button>

              {currentUser?.role === 'admin' && (
                <button
                  id="nav-tab-admin"
                  onClick={() => setActiveTab('admin')}
                  className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'admin'
                      ? 'bg-[#00ff41] text-black font-black shadow-md shadow-[#00ff41]/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#00ff41]" />
                  Admin
                </button>
              )}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Tour / Onboarding */}
              {onOpenOnboarding && (
                <button
                  onClick={onOpenOnboarding}
                  className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-[#00ff41] transition-all flex items-center gap-1 text-xs font-bold"
                  title="Recorrido Interactivo de TalentMatch"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00ff41]" />
                  <span className="hidden xl:inline text-[11px] uppercase tracking-wider font-extrabold">Guía Tour</span>
                </button>
              )}

              {/* Referrals & Gamification Button */}
              {onOpenGrowthModal && (
                <button
                  onClick={onOpenGrowthModal}
                  className="px-2.5 py-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center gap-1 text-xs font-bold animate-pulse"
                  title="Programa de Referidos y Logros PRO"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline uppercase tracking-wider font-extrabold text-[11px]">Ganá PRO</span>
                </button>
              )}

              {/* Live Chat Button */}
              {currentUser && (
                <button
                  onClick={onOpenChat}
                  className="p-2.5 rounded-xl bg-[#00ff41]/10 text-[#00ff41] hover:bg-[#00ff41]/20 transition-all border border-[#00ff41]/30 flex items-center gap-1.5 text-xs font-bold"
                  title="Chat Privado en Tiempo Real"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
              )}

              {/* Auth Button or User Profile */}
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenVerificationModal}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-[#00ff41] transition-all border border-white/10 text-xs font-bold"
                    title="Obtener Insignia de Verificación Oficial"
                  >
                    <Award className="w-3.5 h-3.5 text-[#00ff41]" />
                    <span>Verificar</span>
                  </button>

                  <div className="flex items-center gap-2 bg-[#0a0a0c] border border-white/10 rounded-xl px-2.5 py-1">
                    <User className="w-4 h-4 text-[#00ff41]" />
                    <span className="text-xs font-bold text-white max-w-[100px] truncate hidden sm:inline">
                      {currentUser.displayName}
                    </span>
                    <button
                      onClick={onLogout}
                      className="p-1 hover:text-red-400 transition-colors text-white/50"
                      title="Cerrar Sesión"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 transition-all flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>Ingresar</span>
                </button>
              )}

              {/* Notification Bell */}
              <button
                id="notifications-button"
                onClick={onOpenNotifications}
                className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors border border-white/10"
                title="Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00ff41] text-black font-black text-[10px] rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Touch-optimized Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161618]/95 backdrop-blur-md border-t border-white/10 px-2 py-1.5 flex items-center justify-around text-[10px] text-white/70 shadow-2xl">
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
            activeTab === 'explore' ? 'text-[#00ff41] font-bold' : 'text-white/60'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Búsquedas</span>
        </button>

        <button
          onClick={() => setActiveTab('athletes')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
            activeTab === 'athletes' ? 'text-[#00ff41] font-bold' : 'text-white/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Talentos IA</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
            activeTab === 'calendar' ? 'text-[#00ff41] font-bold' : 'text-white/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Pruebas</span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
            activeTab === 'teams' ? 'text-[#00ff41] font-bold' : 'text-white/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clubes</span>
        </button>

        <button
          onClick={() => setActiveTab('my-profile')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
            activeTab === 'my-profile' || activeTab === 'club-panel' ? 'text-[#00ff41] font-bold' : 'text-white/60'
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          <span>Perfil</span>
        </button>
      </div>
    </>
  );
};
