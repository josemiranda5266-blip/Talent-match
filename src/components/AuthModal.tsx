import React, { useState } from 'react';
import { ARGENTINA_PROVINCES } from '../constants/provinces';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Briefcase,
  Users,
  Award,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { UserRole, ProfessionalCategory } from '../types';
import { PROFESSIONAL_CATEGORIES_LIST } from '../data/mockData';
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  resetUserPassword,
  UserProfile
} from '../services/firebaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userProfile: UserProfile) => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'admin'>('athlete');
  const [selectedCategory, setSelectedCategory] = useState<ProfessionalCategory>('Deportista');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [activeGroupTab, setActiveGroupTab] = useState<string>('Deportistas');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const categoryGroups = [
    { id: 'Deportistas', label: 'Deportistas', icon: Trophy },
    { id: 'Cuerpo Técnico', label: 'Cuerpo Técnico', icon: Users },
    { id: 'Área Médica & Rendimiento', label: 'Área Médica', icon: Award },
    { id: 'Gestión & Logística', label: 'Gestión & Logística', icon: Briefcase },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'register' && registerStep === 1) {
      setRegisterStep(2);
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const profile = await loginUser(email, password);
        if (profile) {
          setSuccessMsg('¡Sesión iniciada exitosamente!');
          setTimeout(() => {
            onAuthSuccess(profile);
            onClose();
          }, 600);
        } else {
          setErrorMsg('No se pudo obtener el perfil del usuario. Verifica tus datos.');
        }
      } else if (mode === 'register') {
        if (!email || !password || !displayName) {
          setErrorMsg('Por favor completa los campos obligatorios.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
          setLoading(false);
          return;
        }

        const newProfile = await registerUser(
          email,
          password,
          displayName,
          selectedRole,
          phone,
          city,
          province,
          selectedCategory
        );
        setSuccessMsg(`¡Bienvenido/a como ${selectedCategory} en TalentMatch!`);
        setTimeout(() => {
          onAuthSuccess(newProfile);
          onClose();
        }, 700);
      } else if (mode === 'forgot') {
        if (!email) {
          setErrorMsg('Ingresa tu correo electrónico.');
          setLoading(false);
          return;
        }
        await resetUserPassword(email);
        setSuccessMsg('Enviamos un enlace de recuperación a tu correo.');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('El correo ya está registrado en TalentMatch. Inicia sesión.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('⚠️ El proveedor "Correo electrónico/Contraseña" no está habilitado en Firebase. Puedes activarlo en Firebase Console > Authentication > Sign-in method, o bien usar el botón de Google a continuación.');
      } else {
        setErrorMsg(err.message || 'Error de autenticación en Firebase.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const profile = await loginWithGoogle(selectedRole, selectedCategory);
      setSuccessMsg('¡Autenticado exitosamente con Google!');
      setTimeout(() => {
        onAuthSuccess(profile);
        onClose();
      }, 600);
    } catch (err: any) {
      console.error('Google auth error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Ventana de autenticación con Google cerrada.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('⚠️ El proveedor Google no está habilitado en la consola de Firebase. Activa Google Provider en Firebase Console > Authentication.');
      } else {
        setErrorMsg(err.message || 'Error al autenticar con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-[#00ff41]/40 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Glow Background */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#00ff41]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00ff41] text-black flex items-center justify-center font-black shadow-lg shadow-[#00ff41]/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">
                {mode === 'login' && 'Iniciar Sesión'}
                {mode === 'register' && `Registro Inteligente (${registerStep}/2)`}
                {mode === 'forgot' && 'Recuperar Contraseña'}
              </h3>
              <p className="text-[11px] text-white/60">
                TalentMatch • Red Profesional de Scouteo Deportivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && registerStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#00ff41]/10 border border-[#00ff41]/30 p-3 rounded-2xl flex items-center gap-2 text-white/90">
                <Sparkles className="w-4 h-4 text-[#00ff41] shrink-0" />
                <p className="text-[11px] font-medium">
                  Selecciona tu categoría profesional exacta para adaptar tu perfil con campos específicos.
                </p>
              </div>

              {/* Group Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#0a0a0c] p-1.5 rounded-xl border border-white/10">
                {categoryGroups.map((grp) => {
                  const IconComp = grp.icon;
                  const isActive = activeGroupTab === grp.id;
                  return (
                    <button
                      type="button"
                      key={grp.id}
                      onClick={() => setActiveGroupTab(grp.id)}
                      className={`px-2 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex flex-col items-center gap-1 ${
                        isActive
                          ? 'bg-[#00ff41] text-black shadow-md'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span className="truncate">{grp.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {PROFESSIONAL_CATEGORIES_LIST.filter(cat => cat.group === activeGroupTab).map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      type="button"
                      key={cat.name}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        // Auto-assign matching user role
                        if (cat.group === 'Deportistas') setSelectedRole('athlete');
                        else if (['Director Deportivo', 'Manager', 'Secretario Deportivo'].includes(cat.name)) setSelectedRole('scout');
                        else setSelectedRole('athlete'); // default profile container
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#00ff41]/15 border-[#00ff41] shadow-lg shadow-[#00ff41]/10'
                          : 'bg-[#0a0a0c] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-white text-xs">{cat.name}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#00ff41]" />}
                        </div>
                        <p className="text-[10px] text-white/60 leading-tight">{cat.description}</p>
                      </div>
                      <div className="mt-2 text-[9px] text-[#00ff41] font-mono">
                        Licencias: {cat.suggestedLicenses[0] || 'Certificación'}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setRegisterStep(2)}
                  className="px-5 py-2.5 bg-[#00ff41] text-black font-black uppercase text-xs rounded-xl shadow-lg shadow-[#00ff41]/20 hover:bg-[#00ff41]/90 transition-all flex items-center gap-1.5"
                >
                  Continuar a Datos de Acceso
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && registerStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between bg-[#0a0a0c] p-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="bg-[#00ff41]/20 text-[#00ff41] text-[10px] uppercase font-black px-2 py-0.5 rounded-md border border-[#00ff41]/30">
                    {selectedCategory}
                  </span>
                  <span className="text-xs text-white/70 font-medium">Categoría seleccionada</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRegisterStep(1)}
                  className="text-xs text-[#00ff41] hover:underline flex items-center gap-1 font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Cambiar
                </button>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                  Nombre Completo / Institución *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej: Mateo Benítez o Prof. Carlos Rossi"
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>
              </div>

              {/* Phone & Location */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                    WhatsApp / Teléfono
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+54 9 11..."
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>
                <div>
                  <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                    Provincia *
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                  >
                    <option value="" disabled>Seleccionar provincia</option>
                    {ARGENTINA_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@deporte.com"
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••• (mín. 6 caracteres)"
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setRegisterStep(1)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 font-bold rounded-xl text-xs"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                  ) : (
                    'Completar Registro e Ingresar'
                  )}
                </button>
              </div>

              {/* Google Auth Option */}
              <div className="relative my-2 flex items-center justify-center">
                <div className="border-t border-white/10 w-full"></div>
                <span className="bg-[#161618] px-3 text-[10px] text-white/40 uppercase font-semibold shrink-0">o regístrate con</span>
                <div className="border-t border-white/10 w-full"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 bg-white hover:bg-gray-100 text-black font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continuar con Google
              </button>
            </div>
          )}

          {mode === 'login' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Email */}
              <div>
                <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@deporte.com"
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-white/60 font-bold uppercase text-[10px]">
                    Contraseña *
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] text-[#00ff41] hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                ) : (
                  'Ingresar a Mi Cuenta'
                )}
              </button>

              {/* Google Auth Option */}
              <div className="relative my-2 flex items-center justify-center">
                <div className="border-t border-white/10 w-full"></div>
                <span className="bg-[#161618] px-3 text-[10px] text-white/40 uppercase font-semibold shrink-0">o ingresa con</span>
                <div className="border-t border-white/10 w-full"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 bg-white hover:bg-gray-100 text-black font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continuar con Google
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                  Correo Electrónico de tu Cuenta
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@deporte.com"
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                ) : (
                  'Enviar Enlace de Recuperación'
                )}
              </button>
            </div>
          )}
        </form>

        {/* Footer Toggle Mode */}
        <div className="pt-3 border-t border-white/10 text-center text-[11px] text-white/60">
          {mode === 'login' && (
            <p>
              ¿Aún no tienes cuenta?{' '}
              <button
                onClick={() => {
                  setMode('register');
                  setRegisterStep(1);
                }}
                className="text-[#00ff41] font-bold hover:underline"
              >
                Regístrate gratis
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p>
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-[#00ff41] font-bold hover:underline"
              >
                Inicia sesión aquí
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p>
              Volver a{' '}
              <button
                onClick={() => setMode('login')}
                className="text-[#00ff41] font-bold hover:underline"
              >
                Inicio de sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

