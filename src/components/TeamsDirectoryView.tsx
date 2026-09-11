import React, { useState } from 'react';
import { FreeTeamProfile, FreeTeamCategory, SportType } from '../types';
import { SPORTS_LIST } from '../data/mockData';
import { ARGENTINA_PROVINCES } from '../constants/provinces';
import {
  Users,
  MapPin,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Phone,
  Instagram,
  Sparkles,
  Map,
  Grid,
  X,
  Share2,
  Info,
  ShieldCheck,
  Award,
  ChevronRight,
  UserPlus,
  MessageSquare
} from 'lucide-react';

interface TeamsDirectoryViewProps {
  teams: FreeTeamProfile[];
  onAddTeam: (team: FreeTeamProfile) => void;
}

const CATEGORIES_LIST: FreeTeamCategory[] = [
  'Escuela de Fútbol Infantil / Juvenil',
  'Club Deportivo (Profesional / Semiprofesional / Barrio)',
  'Academia de Formación Deportiva',
  'Club / Escuela de Fútbol Femenino',
  'Complejo / Predio Deportivo Institucional',
];

const PROVINCES_LIST = [
  'Todas',
  ...ARGENTINA_PROVINCES,
];

export const TeamsDirectoryView: React.FC<TeamsDirectoryViewProps> = ({
  teams,
  onAddTeam,
}) => {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedProvince, setSelectedProvince] = useState<string>('Todas');
  const [selectedSport, setSelectedSport] = useState<string>('Todos');
  const [onlyLookingForPlayers, setOnlyLookingForPlayers] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeamForDetail, setSelectedTeamForDetail] = useState<FreeTeamProfile | null>(null);

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newCategory, setNewCategory] = useState<FreeTeamCategory>('Escuela de Fútbol Infantil / Juvenil');
  const [newSport, setNewSport] = useState<SportType>('Fútbol');
  const [newCity, setNewCity] = useState('');
  const [newProvince, setNewProvince] = useState('Buenos Aires');
  const [newAddress, setNewAddress] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [newWhatsApp, setNewWhatsApp] = useState('');
  const [newInstagram, setNewInstagram] = useState('');
  const [newLookingForPlayers, setNewLookingForPlayers] = useState(true);
  const [newLookingForFriendlies, setNewLookingForFriendlies] = useState(true);
  const [newLogoUrl, setNewLogoUrl] = useState('');

  // Filtered Teams
  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'Todas' || t.category === selectedCategory;
    const matchesProvince = selectedProvince === 'Todas' || t.province === selectedProvince;
    const matchesSport = selectedSport === 'Todos' || t.sport === selectedSport;
    const matchesLookingForPlayers = !onlyLookingForPlayers || t.lookingForPlayers;

    return matchesSearch && matchesCategory && matchesProvince && matchesSport && matchesLookingForPlayers;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !newCity) return;

    const created: FreeTeamProfile = {
      id: `free-team-${Date.now()}`,
      name: newTeamName,
      category: newCategory,
      sport: newSport,
      logoUrl:
        newLogoUrl ||
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=300&auto=format&fit=crop&q=80',
      city: newCity,
      province: newProvince,
      address: newAddress || `${newCity}, ${newProvince}`,
      lat: -34.6037 + (Math.random() - 0.5) * 2,
      lng: -58.3816 + (Math.random() - 0.5) * 2,
      description: newDescription || 'Espacio abierto deportivo registrado en TalentMatch.',
      schedule: newSchedule || 'A convenir',
      contactWhatsApp: newWhatsApp || '+54 9 11 0000 0000',
      contactInstagram: newInstagram,
      lookingForPlayers: newLookingForPlayers,
      lookingForFriendlies: newLookingForFriendlies,
      isFreeListing: true,
      isVerified: true,
      createdAt: new Date().toISOString().split('T')[0],
      memberCount: 15,
    };

    onAddTeam(created);
    setIsCreateModalOpen(false);

    // Reset Form
    setNewTeamName('');
    setNewCity('');
    setNewAddress('');
    setNewDescription('');
    setNewSchedule('');
    setNewWhatsApp('');
    setNewInstagram('');
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner & Free Registration Callout */}
      <div className="bg-[#161618] border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff41]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Directorio Institucional Gratuito
              </span>
              <span className="bg-white/10 text-white/70 font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/10">
                {teams.length} Instituciones Registradas
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight">
              Clubes, Escuelas Deportivas & Academias
            </h1>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Exclusivo para clubes de barrio, escuelas formativas, academias y complejos deportivos institucionales de cualquier deporte.
              Publica las convocatorias de tu entidad, ubicación, categorías de entrenamiento y contacto directo de WhatsApp.
            </p>
          </div>

          <button
            id="btn-open-create-free-team"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-[#00ff41]/20 hover:scale-105 transition-all flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> Registrar Club / Escuela Gratis
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-[#161618] border border-white/10 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, barrio, ciudad o descripción..."
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#00ff41]"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2 bg-[#0a0a0c] p-1 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#00ff41] text-black font-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Grilla
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                viewMode === 'map'
                  ? 'bg-[#00ff41] text-black font-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" /> Mapa Interactivo
            </button>
          </div>
        </div>

        {/* Categories & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
              Categoría del Equipo
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
            >
              <option value="Todas">Todas las Categorías</option>
              {CATEGORIES_LIST.map((cat) => (
                <option key={cat} value={cat} className="bg-[#161618]">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Province Dropdown */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
              Provincia
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
            >
              {PROVINCES_LIST.map((prov) => (
                <option key={prov} value={prov} className="bg-[#161618]">
                  {prov}
                </option>
              ))}
            </select>
          </div>

          {/* Sport Dropdown */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
              Deporte
            </label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
            >
              <option value="Todos">Todos los Deportes</option>
              {SPORTS_LIST.map((s) => (
                <option key={s.name} value={s.name} className="bg-[#161618]">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Checkbox */}
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer text-white/80 select-none">
              <input
                type="checkbox"
                checked={onlyLookingForPlayers}
                onChange={(e) => setOnlyLookingForPlayers(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#0a0a0c] text-[#00ff41] focus:ring-0"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-[#00ff41]">
                Solo los que buscan jugadores
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* MAP VIEW MODE */}
      {viewMode === 'map' && (
        <div className="bg-[#161618] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#00ff41]" />
              <h3 className="text-base font-black text-white uppercase italic">
                Mapa Geolocalizado de Equipos ({filteredTeams.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-white/50">
              Haz clic en cualquier pin del mapa para ver detalles y contacto
            </span>
          </div>

          {/* Simulated Dark Interactive Map Canvas */}
          <div className="relative w-full h-[450px] bg-[#0a0a0c] rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
            {/* Map Background Grid Visuals */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#00ff41_1px,transparent_1px)] [background-size:24px_24px]"></div>

            {/* Map Roads & Geographic Stylized Visual Elements */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,100 Q300,150 600,80 T1200,200" fill="none" stroke="#00ff41" strokeWidth="4" />
              <path d="M200,0 Q250,300 400,600" fill="none" stroke="#ffffff" strokeWidth="3" />
              <path d="M700,0 Q650,250 800,600" fill="none" stroke="#ffffff" strokeWidth="3" />
            </svg>

            {/* Simulated Interactive Map Pins */}
            <div className="relative w-full h-full p-8">
              {filteredTeams.map((team, index) => {
                // Calculate random visual layout positions based on index for simulation
                const topPos = 20 + ((index * 37) % 65);
                const leftPos = 15 + ((index * 29) % 70);

                return (
                  <div
                    key={team.id}
                    style={{ top: `${topPos}%`, left: `${leftPos}%` }}
                    className="absolute z-20 group cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                    onClick={() => setSelectedTeamForDetail(team)}
                  >
                    {/* Pin Marker */}
                    <div className="relative flex flex-col items-center">
                      <div className="px-2 py-1 bg-[#161618] border border-[#00ff41] rounded-lg shadow-xl text-[10px] font-black text-white uppercase whitespace-nowrap group-hover:scale-110 transition-transform flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-ping"></span>
                        {team.name}
                      </div>
                      <div className="w-3 h-3 bg-[#00ff41] rotate-45 border-2 border-black -mt-1 shadow-lg"></div>
                    </div>

                    {/* Hover Card Preview */}
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 p-3 bg-[#161618] border border-white/20 rounded-xl shadow-2xl text-xs space-y-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                      <div className="font-bold text-white leading-tight">{team.name}</div>
                      <div className="text-[10px] text-[#00ff41] font-bold uppercase">{team.category}</div>
                      <div className="text-[10px] text-white/60 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-white/40" /> {team.city}, {team.province}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* GRID VIEW MODE */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="bg-[#161618] border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-[#00ff41]/50 transition-all shadow-xl hover:shadow-2xl hover:shadow-[#00ff41]/5 group"
            >
              <div className="space-y-4">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={team.logoUrl}
                      alt={team.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-white/10 group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30">
                          {team.category.split('/')[0]}
                        </span>
                        {team.isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#00ff41]" title="Equipo Verificado" />
                        )}
                      </div>
                      <h3 className="text-base font-black text-white uppercase italic mt-1 leading-snug">
                        {team.name}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[9px] font-mono text-[#00ff41] font-bold uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shrink-0">
                    100% Gratis
                  </span>
                </div>

                {/* Badges Status */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  {team.lookingForPlayers && (
                    <span className="px-2.5 py-1 bg-[#00ff41]/10 text-[#00ff41] font-bold uppercase rounded-lg border border-[#00ff41]/30 flex items-center gap-1">
                      <UserPlus className="w-3 h-3" /> Busca Jugadores
                    </span>
                  )}
                  {team.lookingForFriendlies && (
                    <span className="px-2.5 py-1 bg-white/5 text-white/80 font-bold uppercase rounded-lg border border-white/10 flex items-center gap-1">
                      ⚽ Amistosos
                    </span>
                  )}
                </div>

                {/* Details */}
                <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">
                  {team.description}
                </p>

                <div className="space-y-1.5 text-xs text-white/60 font-mono pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#00ff41]" />
                    <span>{team.address}</span>
                  </div>
                  {team.schedule && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-white/40" />
                      <span>{team.schedule}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-4 border-t border-white/10 flex items-center gap-2">
                <a
                  href={`https://wa.me/${team.contactWhatsApp.replace(/[^0-9]/g, '')}?text=Hola!%20Vi%20su%20equipo%20${encodeURIComponent(
                    team.name
                  )}%20en%20TalentMatch.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/10 flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </a>

                <button
                  onClick={() => setSelectedTeamForDetail(team)}
                  className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase rounded-xl border border-white/10 transition-colors"
                  title="Ver Perfil Completo"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REGISTER FREE TEAM MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#161618] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#161618]/95 backdrop-blur z-20">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#00ff41]" />
                <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
                  Registrar Club, Escuela o Entidad Deportiva
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-[#00ff41]/10 border border-[#00ff41]/30 p-3.5 rounded-2xl flex items-center gap-3 text-[#00ff41]">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span className="font-bold">
                  Registro exclusivo para Clubes, Escuelas de Formación y Entidades Deportivas de cualquier deporte.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-white/60 uppercase mb-1">
                    Nombre de la Institución / Club / Escuela *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Club Deportivo San Martín / Escuela Formativa Tigre"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-white/60 uppercase mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as FreeTeamCategory)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  >
                    {CATEGORIES_LIST.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#161618]">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-white/60 uppercase mb-1">Deporte</label>
                  <select
                    value={newSport}
                    onChange={(e) => setNewSport(e.target.value as SportType)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  >
                    {SPORTS_LIST.map((s) => (
                      <option key={s.name} value={s.name} className="bg-[#161618]">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-white/60 uppercase mb-1">Provincia</label>
                  <select
                    value={newProvince}
                    onChange={(e) => setNewProvince(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  >
                    {PROVINCES_LIST.filter((p) => p !== 'Todas').map((p) => (
                      <option key={p} value={p} className="bg-[#161618]">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-white/60 uppercase mb-1">Ciudad / Barrio</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Palermo / Quilmes / Rosario Centro"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-white/60 uppercase mb-1">Dirección Exacta del Predio / Cancha</label>
                  <input
                    type="text"
                    placeholder="Ej: Av. Mitre 1920, Predio Costa Salguero"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-white/60 uppercase mb-1">WhatsApp de Contacto</label>
                  <input
                    type="text"
                    required
                    placeholder="+54 9 11 3920 1920"
                    value={newWhatsApp}
                    onChange={(e) => setNewWhatsApp(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00ff41]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-white/60 uppercase mb-1">Instagram (Opcional)</label>
                  <input
                    type="text"
                    placeholder="@miequipo_oficial"
                    value={newInstagram}
                    onChange={(e) => setNewInstagram(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-white/60 uppercase mb-1">
                  Días y Horarios de Práctica / Encuentros
                </label>
                <input
                  type="text"
                  placeholder="Ej: Martes y Jueves 18:00 a 20:00 hs"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                />
              </div>

              <div>
                <label className="block font-bold text-white/60 uppercase mb-1">
                  Descripción del Equipo / Escuela
                </label>
                <textarea
                  rows={3}
                  placeholder="Escribe brevemente sobre la historia del equipo, nivel de juego, edades recibidas u objetivos..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newLookingForPlayers}
                    onChange={(e) => setNewLookingForPlayers(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-[#0a0a0c] text-[#00ff41] focus:ring-0"
                  />
                  <span className="font-bold text-white">Buscando incorporar nuevos jugadores</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newLookingForFriendlies}
                    onChange={(e) => setNewLookingForFriendlies(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-[#0a0a0c] text-[#00ff41] focus:ring-0"
                  />
                  <span className="font-bold text-white">Buscando rivales para partidos amistosos</span>
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white/5 text-white/70 font-bold uppercase rounded-xl hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20"
                >
                  Publicar Ficha Gratis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAM DETAIL MODAL */}
      {selectedTeamForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#161618] border border-white/10 rounded-3xl max-w-xl w-full p-6 space-y-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedTeamForDetail(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <img
                src={selectedTeamForDetail.logoUrl}
                alt={selectedTeamForDetail.name}
                className="w-16 h-16 rounded-2xl object-cover border border-white/10"
              />
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30">
                  {selectedTeamForDetail.category}
                </span>
                <h3 className="text-xl font-black text-white uppercase italic mt-1">
                  {selectedTeamForDetail.name}
                </h3>
              </div>
            </div>

            <p className="text-xs text-white/80 leading-relaxed font-sans">
              {selectedTeamForDetail.description}
            </p>

            <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4 text-[#00ff41]" />
                <span>
                  <strong>Ubicación:</strong> {selectedTeamForDetail.address}, {selectedTeamForDetail.city},{' '}
                  {selectedTeamForDetail.province}
                </span>
              </div>

              {selectedTeamForDetail.schedule && (
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="w-4 h-4 text-white/40" />
                  <span>
                    <strong>Horarios:</strong> {selectedTeamForDetail.schedule}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-white">
                <Phone className="w-4 h-4 text-white/40" />
                <span>
                  <strong>Contacto Directo:</strong> {selectedTeamForDetail.contactWhatsApp}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`https://wa.me/${selectedTeamForDetail.contactWhatsApp.replace(
                  /[^0-9]/g,
                  ''
                )}?text=Hola!%20Quisiera%20consultar%20sobre%20el%20equipo%20${encodeURIComponent(
                  selectedTeamForDetail.name
                )}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Enviar Mensaje WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
