import React, { useState } from 'react';
import { Athlete, ClubSearch, SearchApplication, AIScoutReport, AthleteVideo, ProfessionalCategory } from '../types';
import { auth } from '../lib/firebase';
import { PROFESSIONAL_CATEGORIES_LIST } from '../data/mockData';
import { ARGENTINA_PROVINCES } from '../constants/provinces';
import { AthleteAIAssistantModal } from './AthleteAIAssistantModal';
import { AITrainingModal } from './AITrainingModal';
import { uploadMediaFile } from '../services/firebaseService';
import {
  User,
  MapPin,
  Sparkles,
  Trophy,
  Video,
  Crown,
  CheckCircle2,
  Clock,
  Send,
  Edit3,
  Save,
  Play,
  Share2,
  Activity,
  AlertCircle,
  Image,
  Plus,
  Trash2,
  Wand2,
  History,
  Award,
  ExternalLink,
  X,
  Upload,
  Loader2,
  Briefcase
} from 'lucide-react';

interface AthleteViewProps {
  athlete: Athlete;
  onUpdateAthlete: (updated: Athlete) => void;
  searches: ClubSearch[];
  applications: SearchApplication[];
  onApplyToSearch: (searchId: string, note?: string) => void;
  onOpenCandidateModal: (ath: Athlete) => void;
  onOpenMonetization: () => void;
}

export const AthleteView: React.FC<AthleteViewProps> = ({
  athlete,
  onUpdateAthlete,
  searches,
  applications,
  onApplyToSearch,
  onOpenMonetization,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Athlete>({ ...athlete });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [scoutReport, setScoutReport] = useState<AIScoutReport | null>(null);
  const [applyNote, setApplyNote] = useState<Record<string, string>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  // New states for AI Assistant & Media
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isAITrainingOpen, setIsAITrainingOpen] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [newPhotoInput, setNewPhotoInput] = useState('');
  const [newVideoTitleInput, setNewVideoTitleInput] = useState('');
  const [newVideoUrlInput, setNewVideoUrlInput] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const handleFileUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const url = await uploadMediaFile(file, `athletes/${formData.id}/photos`);
      const updatedPhotos = [...(formData.galleryPhotos || []), url];
      const updated = { ...formData, galleryPhotos: updatedPhotos };
      setFormData(updated);
      onUpdateAthlete(updated);
    } catch (err) {
      console.error('Error uploading photo:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFileUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    try {
      const url = await uploadMediaFile(file, `athletes/${formData.id}/videos`);
      const newVid: AthleteVideo = {
        title: file.name.split('.')[0] || 'Video Adjunto de Jugadas',
        url,
        thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
      };
      const updatedVideos = [...(formData.videosList || []), newVid];
      const updated = { ...formData, videosList: updatedVideos, videoUrl: formData.videoUrl || url };
      setFormData(updated);
      onUpdateAthlete(updated);
    } catch (err) {
      console.error('Error uploading video:', err);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Filter searches compatible with player's sport
  const compatibleSearches = searches.filter(
    (s) => s.sport.toLowerCase() === athlete.sport.toLowerCase()
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAthlete(formData);
    setIsEditing(false);
  };

  const handleApplyAIData = (data: { bio: string; sportsExperience: string; keyAchievements: string[] }) => {
    const updatedStats = { ...formData.stats };
    if (data.keyAchievements.length > 0) {
      updatedStats.achievements = Array.from(new Set([...updatedStats.achievements, ...data.keyAchievements]));
    }

    const updatedAthlete = {
      ...formData,
      bio: data.bio,
      sportsExperience: data.sportsExperience,
      stats: updatedStats,
    };

    setFormData(updatedAthlete);
    onUpdateAthlete(updatedAthlete);
  };

  const handleAddPhoto = () => {
    if (!newPhotoInput.trim()) return;
    const updatedPhotos = [...(formData.galleryPhotos || []), newPhotoInput.trim()];
    const updated = { ...formData, galleryPhotos: updatedPhotos };
    setFormData(updated);
    onUpdateAthlete(updated);
    setNewPhotoInput('');
  };

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = (formData.galleryPhotos || []).filter((_, i) => i !== index);
    const updated = { ...formData, galleryPhotos: updatedPhotos };
    setFormData(updated);
    onUpdateAthlete(updated);
  };

  const handleAddVideo = () => {
    if (!newVideoUrlInput.trim()) return;
    const newVid: AthleteVideo = {
      title: newVideoTitleInput.trim() || 'Video de Jugadas y Destacados',
      url: newVideoUrlInput.trim(),
      thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    };
    const updatedVideos = [...(formData.videosList || []), newVid];
    const updated = { ...formData, videosList: updatedVideos, videoUrl: formData.videoUrl || newVid.url };
    setFormData(updated);
    onUpdateAthlete(updated);
    setNewVideoTitleInput('');
    setNewVideoUrlInput('');
  };

  const handleRemoveVideo = (index: number) => {
    const updatedVideos = (formData.videosList || []).filter((_, i) => i !== index);
    const updated = { ...formData, videosList: updatedVideos };
    setFormData(updated);
    onUpdateAthlete(updated);
  };

  const handleGenerateScoutReport = async () => {
    setIsGeneratingReport(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/ai/scout-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ athlete: formData }),
      });
      const data = await response.json();
      if (data.report) {
        setScoutReport(data.report);
      }
    } catch (err) {
      console.error('Error generating AI scout report:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Athlete Header Bento Card */}
      <div id="athlete-profile-card" className="bg-[#161618] rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Background Accent Glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#00ff41]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 items-start justify-between relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="relative group">
              <img
                src={formData.avatar}
                alt={formData.name}
                className="w-28 h-28 rounded-3xl object-cover ring-2 ring-[#00ff41]/50 shadow-xl"
              />
              {formData.isPremium && (
                <span id="badge-pro" className="absolute -top-2 -right-2 bg-[#00ff41] text-black font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                  <Crown className="w-3 h-3" /> PRO
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter uppercase italic">{formData.name}</h1>
                {formData.isVerified && (
                  <span className="text-[#00ff41] flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-[#00ff41]/10 border border-[#00ff41]/30 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-white/80 font-medium">
                <span className="bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {formData.category || 'Deportista'}
                </span>
                <span className="bg-[#00ff41] text-black px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm">
                  {formData.sport} • {formData.position}
                </span>
                <span className="flex items-center gap-1 text-white/60 text-xs">
                  <MapPin className="w-4 h-4 text-[#00ff41]" />
                  {formData.city}, {formData.province}
                </span>
                <span className="bg-white/5 px-3 py-1 rounded-xl text-white/80 text-xs font-bold border border-white/10 uppercase tracking-wider">
                  Nivel: {formData.level}
                </span>
              </div>

              <p className="text-white/70 text-sm max-w-2xl leading-relaxed pt-1 font-normal">{formData.bio}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
            <button
              id="btn-ai-training"
              onClick={() => setIsAITrainingOpen(true)}
              className="px-4 py-2.5 bg-[#00ff41]/10 hover:bg-[#00ff41]/20 text-[#00ff41] text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all border border-[#00ff41]/30 flex items-center gap-1.5 shadow-md shadow-[#00ff41]/10"
            >
              <Activity className="w-3.5 h-3.5 text-[#00ff41]" />
              Rutina IA Gemini
            </button>

            <button
              id="btn-ai-assistant"
              onClick={() => setIsAIAssistantOpen(true)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all border border-white/10 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00ff41]" />
              Asistente IA Ficha
            </button>

            <button
              id="btn-edit-profile"
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all border border-white/10 flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'Cancelar Edición' : 'Editar Perfil'}
            </button>

            <button
              id="btn-share-profile"
              onClick={handleShareProfile}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all border border-white/10 flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedLink ? '¡Enlace Copiado!' : 'Compartir'}
            </button>

            {!formData.isPremium && (
              <button
                id="btn-upgrade-banner"
                onClick={onOpenMonetization}
                className="px-4 py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 hover:scale-105 transition-transform flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" />
                Hazte PRO
              </button>
            )}
          </div>
        </div>

        {/* Physical & Professional Stats Row (Bento Grid) */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center">
          <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block">Edad</span>
            <span className="text-lg font-black text-white font-mono">{formData.age} años</span>
          </div>
          <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block">Altura / Exp.</span>
            <span className="text-lg font-black text-white font-mono">{formData.heightCm ? `${formData.heightCm} cm` : `${formData.yearsExperience || 1}a Exp`}</span>
          </div>
          <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block">Peso / Disp.</span>
            <span className="text-lg font-black text-white font-mono">{formData.weightKg ? `${formData.weightKg} kg` : (formData.availability || 'Inmediata')}</span>
          </div>
          <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block">Perfil / Rol</span>
            <span className="text-lg font-black text-[#00ff41] truncate block px-1">{formData.preferredFootOrHand || formData.category || 'Profesional'}</span>
          </div>
          <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block">Partidos / Trajectory</span>
            <span className="text-lg font-black text-white font-mono">{formData.stats?.matchesPlayed ?? (formData.yearsExperience ? `${formData.yearsExperience}a` : '1a')}</span>
          </div>
          <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block">Estado</span>
            <span className="text-xs font-extrabold text-[#00ff41] uppercase tracking-wider flex items-center justify-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-ping" />
              Disponible
            </span>
          </div>
        </div>
      </div>

      {/* Edit Profile Form Drawer */}
      {isEditing && (
        <form
          id="edit-profile-form"
          onSubmit={handleSaveProfile}
          className="bg-[#161618] border border-[#00ff41]/30 rounded-3xl p-6 sm:p-8 space-y-4 animate-fadeIn shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-base font-black text-white uppercase italic tracking-tight flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#00ff41]" /> Editar Mi Ficha de Atleta
            </h3>
            <span className="text-xs text-white/50">Sincronización en tiempo real</span>
          </div>

          {/* AI Assistance Banner inside Form */}
          <div className="bg-[#0a0a0c] border border-[#00ff41]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00ff41]/20 flex items-center justify-center text-[#00ff41]">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">¿Querés que la IA complete o mejore tu ficha?</h4>
                <p className="text-[11px] text-white/60">Redacta tu trayectoria deportiva con inteligencia artificial en segundos.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAIAssistantOpen(true)}
              className="px-4 py-2 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md shrink-0 hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Redactar Ficha con IA
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Nombre Completo</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#00ff41] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#00ff41]" /> Categoría Profesional
              </label>
              <select
                value={formData.category || 'Deportista'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProfessionalCategory })}
                className="w-full bg-[#0a0a0c] border border-[#00ff41]/40 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
              >
                {PROFESSIONAL_CATEGORIES_LIST.map((cat) => (
                  <option key={cat.name} value={cat.name} className="bg-[#161618]">
                    {cat.name} ({cat.group})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Deporte</label>
              <select
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value as any })}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
              >
                <option value="Fútbol">Fútbol</option>
                <option value="Básquet">Básquet</option>
                <option value="Vóley">Vóley</option>
                <option value="Rugby">Rugby</option>
                <option value="Hockey">Hockey</option>
                <option value="Pádel">Pádel</option>
                <option value="Tenis">Tenis</option>
                <option value="Handbol">Handbol</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Rol / Posición Específica</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Ej: Director Técnico / Defensor / Kinesiólogo"
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Disponibilidad Actual</label>
              <select
                value={formData.availability || 'Inmediata'}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value as any })}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
              >
                <option value="Inmediata">Inmediata</option>
                <option value="A convenir">A convenir</option>
                <option value="Con contrato vigente">Con contrato vigente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Años de Experiencia</label>
              <input
                type="number"
                value={formData.yearsExperience || 1}
                onChange={(e) => setFormData({ ...formData, yearsExperience: Number(e.target.value) })}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Edad (Años)</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Altura (cm)</label>
              <input
                type="number"
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Peso (kg)</label>
              <input
                type="number"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Ciudad</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Provincia</label>
              <select
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
                required
              >
                <option value="" disabled>Seleccionar provincia</option>
                {ARGENTINA_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Perfil (Pie / Mano)</label>
              <select
                value={formData.preferredFootOrHand}
                onChange={(e) => setFormData({ ...formData, preferredFootOrHand: e.target.value })}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
              >
                <option value="Diestro / Derecha">Diestro / Derecha</option>
                <option value="Zurdo / Izquierda">Zurdo / Izquierda</option>
                <option value="Ambidiestro">Ambidiestro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Biografía Resumida</label>
            <textarea
              rows={2}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#00ff41] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <History className="w-4 h-4" /> Experiencia & Trayectoria en {formData.sport}
            </label>
            <textarea
              rows={3}
              value={formData.sportsExperience || ''}
              onChange={(e) => setFormData({ ...formData, sportsExperience: e.target.value })}
              placeholder="Detalla clubes anteriores, años practicando el deporte, categorías, campeonatos disputados..."
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-white/5 text-white/70 text-xs font-bold uppercase rounded-xl hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#00ff41] text-black text-xs font-black uppercase rounded-xl shadow-lg shadow-[#00ff41]/20 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Guardar Cambios
            </button>
          </div>
        </form>
      )}

      {/* Trayectoria & Experiencia Deportiva Section */}
      <div id="sports-experience-card" className="bg-[#161618] rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#00ff41]" />
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
                Trayectoria & Experiencia Deportiva
              </h2>
              <p className="text-xs text-white/50 mt-0.5">Historial de clubes, ligas disputadas, palmarés y logros en {formData.sport}.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAIAssistantOpen(true)}
            className="px-3.5 py-1.5 bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 hover:bg-[#00ff41]/20 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" /> Redactar / Mejorar con IA
          </button>
        </div>

        {formData.sportsExperience ? (
          <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/5 text-sm text-white/90 leading-relaxed font-normal">
            <p className="whitespace-pre-line">{formData.sportsExperience}</p>
          </div>
        ) : (
          <div className="bg-[#0a0a0c] p-6 rounded-2xl border border-dashed border-white/10 text-center space-y-3">
            <p className="text-xs text-white/50 uppercase tracking-wider font-bold">Aún no has detallado tu experiencia en {formData.sport}.</p>
            <button
              type="button"
              onClick={() => setIsAIAssistantOpen(true)}
              className="px-4 py-2 bg-[#00ff41] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 flex items-center gap-1.5 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5" /> Generar Trayectoria con IA
            </button>
          </div>
        )}
      </div>

      {/* Galería de Fotos Section */}
      <div id="photos-gallery-card" className="bg-[#161618] rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Image className="w-5 h-5 text-[#00ff41]" />
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
                Fotos de Partidos & Entrenamientos ({formData.galleryPhotos?.length || 0})
              </h2>
              <p className="text-xs text-white/50">Anexa capturas de juego, fotos del equipo e imágenes físicas para scouts.</p>
            </div>
          </div>
        </div>

        {/* Photo Input & File Upload Field */}
        <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="url"
            placeholder="Pega el enlace URL de tu foto (o foto de entrenamiento/partido)..."
            value={newPhotoInput}
            onChange={(e) => setNewPhotoInput(e.target.value)}
            className="w-full bg-[#161618] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00ff41]"
          />
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleAddPhoto}
              className="flex-1 sm:flex-initial px-4 py-2 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-[#00ff41]/20 hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" /> Anexar
            </button>
            <label className="flex-1 sm:flex-initial px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all border border-white/10">
              {isUploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#00ff41]" />
              ) : (
                <Upload className="w-4 h-4 text-[#00ff41]" />
              )}
              <span>{isUploadingPhoto ? 'Subiendo...' : 'Subir Archivo'}</span>
              <input type="file" accept="image/*" onChange={handleFileUploadPhoto} disabled={isUploadingPhoto} className="hidden" />
            </label>
          </div>
        </div>

        {/* Preset sample photos selector if gallery is empty */}
        {(!formData.galleryPhotos || formData.galleryPhotos.length === 0) && (
          <div className="bg-[#0a0a0c]/60 p-3 rounded-xl border border-white/5 text-xs text-white/60 space-y-2">
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Demostración: Anexar foto de muestra con un clic:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewPhotoInput('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80');
                  setTimeout(() => handleAddPhoto(), 100);
                }}
                className="text-[10px] bg-white/5 hover:bg-[#00ff41]/20 hover:text-[#00ff41] text-white/80 px-2.5 py-1 rounded-lg border border-white/10"
              >
                + Foto de Partido
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewPhotoInput('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80');
                  setTimeout(() => handleAddPhoto(), 100);
                }}
                className="text-[10px] bg-white/5 hover:bg-[#00ff41]/20 hover:text-[#00ff41] text-white/80 px-2.5 py-1 rounded-lg border border-white/10"
              >
                + Foto Entrenamiento Físico
              </button>
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {formData.galleryPhotos && formData.galleryPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {formData.galleryPhotos.map((photo, idx) => (
              <div key={idx} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0c] aspect-square">
                <img
                  src={photo}
                  alt={`Foto Atleta ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                  onClick={() => setSelectedPhotoPreview(photo)}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoPreview(photo)}
                    className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur"
                    title="Ampliar foto"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-xl backdrop-blur"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0a0a0c] p-6 rounded-2xl border border-dashed border-white/10 text-center text-xs text-white/40 font-bold uppercase tracking-wider">
            Anexa fotos para enriquecer tu perfil y captar atención de clubes.
          </div>
        )}
      </div>

      {/* Videos & Compilaciones Section */}
      <div id="video-highlights-card" className="bg-[#161618] rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Video className="w-5 h-5 text-[#00ff41]" />
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Videos & Highlight Reels</h2>
              <p className="text-xs text-white/50">Comparte enlaces a tu canal de YouTube, Instagram Reels o compilaciones.</p>
            </div>
          </div>
          <span className="text-[10px] text-[#00ff41] bg-[#00ff41]/10 px-3 py-1 rounded-full border border-[#00ff41]/30 font-black uppercase tracking-widest shrink-0">
            Reclutamiento
          </span>
        </div>

        {/* Add Video Form & Direct Video Upload */}
        <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <input
              type="text"
              placeholder="Título del video (ej. Jugadas Destacadas 2025)..."
              value={newVideoTitleInput}
              onChange={(e) => setNewVideoTitleInput(e.target.value)}
              className="sm:col-span-5 bg-[#161618] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00ff41]"
            />
            <input
              type="url"
              placeholder="Link de YouTube, Vimeo, Instagram o MP4..."
              value={newVideoUrlInput}
              onChange={(e) => setNewVideoUrlInput(e.target.value)}
              className="sm:col-span-4 bg-[#161618] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00ff41]"
            />
            <button
              type="button"
              onClick={handleAddVideo}
              className="sm:col-span-3 px-3 py-2 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 shadow-md shadow-[#00ff41]/20 hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" /> Anexar URL
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs text-white/60">
            <span>¿Tienes un archivo de video en tu dispositivo (MP4 / MOV)?</span>
            <label className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-all border border-white/10 shrink-0">
              {isUploadingVideo ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#00ff41]" />
              ) : (
                <Upload className="w-4 h-4 text-[#00ff41]" />
              )}
              <span>{isUploadingVideo ? 'Subiendo Video...' : 'Subir Video MP4/MOV'}</span>
              <input type="file" accept="video/*" onChange={handleFileUploadVideo} disabled={isUploadingVideo} className="hidden" />
            </label>
          </div>
        </div>

        {/* Videos List Grid */}
        {formData.videosList && formData.videosList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formData.videosList.map((vid, idx) => (
              <div key={idx} className="relative rounded-2xl overflow-hidden group border border-white/10 bg-[#0a0a0c] space-y-2 p-3">
                <div className="relative h-44 rounded-xl overflow-hidden">
                  <img
                    src={vid.thumbnail || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80'}
                    alt={vid.title}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full bg-[#00ff41] text-black flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                    >
                      <Play className="w-6 h-6 ml-0.5 fill-black" />
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVideo(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 text-red-400 hover:text-red-300 rounded-lg backdrop-blur"
                    title="Eliminar video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-white px-1">
                  <span className="font-extrabold line-clamp-1">{vid.title}</span>
                  <a
                    href={vid.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00ff41] font-mono text-[11px] flex items-center gap-1 hover:underline"
                  >
                    Ver <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden group border border-white/10 bg-[#0a0a0c]">
            <img
              src={formData.videoThumbnail || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80'}
              alt="Video Highlight Principal"
              className="w-full h-64 object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent flex items-center justify-center">
              <a
                href={formData.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-16 h-16 rounded-full bg-[#00ff41] text-black flex items-center justify-center shadow-2xl shadow-[#00ff41]/40 hover:scale-110 transition-transform"
              >
                <Play className="w-8 h-8 ml-1 fill-black" />
              </a>
            </div>
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white">
              <span className="bg-[#0a0a0c]/90 px-3 py-1 rounded-xl backdrop-blur font-bold">Mejores Jugadas HD</span>
              <span className="bg-[#00ff41] text-black px-3 py-1 rounded-xl font-black uppercase tracking-wider">Compilación Oficial</span>
            </div>
          </div>
        )}
      </div>

      {/* AI Scouting Report Section */}
      <div id="ai-scout-report-card" className="bg-[#161618] rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00ff41]" />
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Informe de Scouting Gemini IA</h2>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Evaluación técnica en tiempo real generada a partir de tu ficha de atleta.
            </p>
          </div>

          <button
            id="btn-generate-scout-report"
            onClick={handleGenerateScoutReport}
            disabled={isGeneratingReport}
            className="px-5 py-2.5 bg-[#00ff41] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            {isGeneratingReport ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Analizando con IA...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {scoutReport ? 'Actualizar Informe IA' : 'Generar Informe IA'}
              </>
            )}
          </button>
        </div>

        {scoutReport ? (
          <div className="bg-[#0a0a0c] rounded-2xl p-6 border border-[#00ff41]/20 space-y-4 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Nivel Sugerido</span>
                <p className="text-sm font-black text-[#00ff41] uppercase">{scoutReport.suggestedLevel}</p>
              </div>
              <div className="flex items-center gap-2 bg-[#00ff41]/10 px-4 py-2 rounded-xl border border-[#00ff41]/30">
                <Trophy className="w-4 h-4 text-[#00ff41]" />
                <span className="text-xs text-white/70 font-bold uppercase">Valoración IA:</span>
                <span className="text-xl font-black text-white font-mono">{scoutReport.overallRating} / 10</span>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-extrabold text-[#00ff41] uppercase tracking-[0.2em] mb-1">Resumen Ejecutivo</h4>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal">{scoutReport.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <h5 className="text-xs font-black text-[#00ff41] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4" /> Fortalezas Clave
                </h5>
                <ul className="space-y-1.5 text-xs text-white/80">
                  {scoutReport.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#00ff41] font-bold">•</span> {str}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Activity className="w-4 h-4" /> Desarrollo Físico-Táctico
                </h5>
                <ul className="space-y-1.5 text-xs text-white/80">
                  {scoutReport.areasToImprove.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">•</span> {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-xs text-white/60 bg-[#161618] p-3 rounded-xl border border-white/5 font-mono">
              <span className="font-bold text-white">Análisis de Rendimiento:</span> {scoutReport.keyStatsAnalysis}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl">
            <Sparkles className="w-8 h-8 text-white/30 mx-auto mb-2" />
            <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Haz clic en "Generar Informe IA" para evaluar tu ficha con Gemini</p>
          </div>
        )}
      </div>

      {/* Applications & Compatible Club Searches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mis Postulaciones */}
        <div id="my-applications-card" className="bg-[#161618] rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-black text-white uppercase italic tracking-tight flex items-center gap-2">
              <Send className="w-5 h-5 text-[#00ff41]" /> Postulaciones Activas ({applications.length})
            </h3>
          </div>

          {applications.length > 0 ? (
            <div className="space-y-3">
              {applications.map((app) => {
                const search = searches.find((s) => s.id === app.searchId);
                if (!search) return null;

                const getStatusBadge = (status: string) => {
                  switch (status) {
                    case 'Citado a Prueba':
                      return <span className="bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Citado a Prueba</span>;
                    case 'Preseleccionado':
                      return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Preseleccionado</span>;
                    default:
                      return <span className="bg-white/5 text-white/50 border border-white/10 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> En Revisión</span>;
                  }
                };

                return (
                  <div key={app.id} className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="text-[10px] text-[#00ff41] font-black uppercase tracking-widest">{search.sport}</span>
                      <h4 className="text-sm font-extrabold text-white">{search.title}</h4>
                      <p className="text-xs text-white/50">{search.clubName} • {search.city}</p>
                    </div>
                    <div>{getStatusBadge(app.status)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-white/40 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-6 h-6 mx-auto mb-1 opacity-50 text-[#00ff41]" />
              Aún no te has postulado a ninguna búsqueda.
            </div>
          )}
        </div>

        {/* Búsquedas Recomendadas para este Atleta */}
        <div id="compatible-searches-card" className="bg-[#161618] rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-black text-white uppercase italic tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#00ff41]" /> Convocatorias para {athlete.sport}
            </h3>
            <span className="text-xs text-white/50 font-mono">{compatibleSearches.length} disponibles</span>
          </div>

          <div className="space-y-3">
            {compatibleSearches.map((search) => {
              const hasApplied = applications.some((a) => a.searchId === search.id);

              return (
                <div key={search.id} className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30">
                        {search.clubName}
                      </span>
                      <h4 className="text-sm font-extrabold text-white mt-1">{search.title}</h4>
                      <p className="text-xs text-white/50">{search.city}, {search.province} • Prueba: {search.trialDate}</p>
                    </div>
                  </div>

                  <p className="text-xs text-white/70 line-clamp-2">{search.description}</p>

                  <div className="flex items-center justify-between pt-1">
                    <input
                      type="text"
                      placeholder="Nota opcional al DT..."
                      value={applyNote[search.id] || ''}
                      onChange={(e) => setApplyNote({ ...applyNote, [search.id]: e.target.value })}
                      disabled={hasApplied}
                      className="bg-[#161618] border border-white/10 text-xs px-3 py-1.5 rounded-xl text-white w-3/5 focus:outline-none focus:border-[#00ff41] font-mono"
                    />

                    <button
                      id={`btn-apply-${search.id}`}
                      onClick={() => onApplyToSearch(search.id, applyNote[search.id])}
                      disabled={hasApplied}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
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
      </div>

      {/* AI Profile Assistant Modal */}
      <AthleteAIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        athleteName={formData.name}
        sport={formData.sport}
        position={formData.position}
        age={formData.age}
        level={formData.level}
        currentExperience={formData.sportsExperience || formData.bio}
        onApplyGeneratedData={handleApplyAIData}
      />

      <AITrainingModal
        isOpen={isAITrainingOpen}
        onClose={() => setIsAITrainingOpen(false)}
        athleteName={formData.name}
        sport={formData.sport}
        position={formData.position}
        level={formData.level}
      />

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedPhotoPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <button
            onClick={() => setSelectedPhotoPreview(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
            title="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] p-2 bg-[#161618] rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            <img
              src={selectedPhotoPreview}
              alt="Vista ampliada"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl mx-auto"
            />
            <div className="flex justify-between items-center px-4 py-2 text-xs text-white/60">
              <span>Foto de Atleta TalentMatch</span>
              <button
                onClick={() => setSelectedPhotoPreview(null)}
                className="text-[#00ff41] font-bold hover:underline"
              >
                Cerrar vista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
