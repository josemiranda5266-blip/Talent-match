import React, { useState } from 'react';
import { Tournament, SportType } from '../types';
import { SPORTS_LIST } from '../data/mockData';
import { ARGENTINA_PROVINCES } from '../constants/provinces';
import {
  Trophy,
  Calendar,
  MapPin,
  PlusCircle,
  Search,
  ExternalLink,
  MessageSquare,
  Award,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Sparkles,
  DollarSign,
  ShieldCheck,
  Instagram,
  Mail,
  Filter,
  Link as LinkIcon,
  Info
} from 'lucide-react';

interface TournamentsViewProps {
  tournaments: Tournament[];
  onAddTournament: (tournament: Tournament) => void;
  initialOpenPublishModal?: boolean;
}

const PROVINCES_LIST = [
  'Todas',
  ...ARGENTINA_PROVINCES,
];

const PRESET_BANNERS = [
  { label: 'Cancha de Noche HD', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80' },
  { label: 'Básquet Pro Indoor', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80' },
  { label: 'Cancha de Césped', url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&auto=format&fit=crop&q=80' },
  { label: 'Estadio Lleno', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80' },
];

export const TournamentsView: React.FC<TournamentsViewProps> = ({
  tournaments,
  onAddTournament,
  initialOpenPublishModal = false,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('Todos');
  const [selectedProvince, setSelectedProvince] = useState<string>('Todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');

  // Modals state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(initialOpenPublishModal);
  const [publishStep, setPublishStep] = useState<'form' | 'payment' | 'processing' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'card' | 'transfer'>('mercadopago');
  const [selectedTournamentDetail, setSelectedTournamentDetail] = useState<Tournament | null>(null);

  // Form State for publishing tournament
  const [title, setTitle] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [sport, setSport] = useState<SportType>('Fútbol');
  const [category, setCategory] = useState('');
  const [province, setProvince] = useState('Buenos Aires');
  const [city, setCity] = useState('');
  const [venueName, setVenueName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [prizes, setPrizes] = useState('');
  const [registrationFee, setRegistrationFee] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [contactWhatsApp, setContactWhatsApp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactInstagram, setContactInstagram] = useState('');
  const [bannerImage, setBannerImage] = useState(PRESET_BANNERS[0].url);

  // Payment Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [createdTournamentTemp, setCreatedTournamentTemp] = useState<Tournament | null>(null);
  const [lastReceipt, setLastReceipt] = useState<{ id: string; hash: string; date: string } | null>(null);

  // Image Upload Handling
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setBannerImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !organizerName || !city || !contactWhatsApp) return;

    const newTournament: Tournament = {
      id: `tourn-${Date.now()}`,
      title,
      organizerName,
      sport,
      category: category || 'Categoría General',
      province,
      city,
      venueName: venueName || `${city}, ${province}`,
      startDate: startDate || new Date().toISOString().split('T')[0] ?? new Date().toISOString() ?? new Date().toISOString(),
      endDate: endDate || undefined,
      description,
      prizes: prizes || undefined,
      registrationFee: registrationFee || 'A consultar',
      registrationLink: registrationLink ? (registrationLink.startsWith('http') ? registrationLink : `https://${registrationLink}`) : undefined,
      contactWhatsApp,
      contactEmail,
      contactInstagram,
      bannerImage: bannerImage || PRESET_BANNERS[0].url,
      isVerifiedOrganizer: true,
      createdAt: new Date().toISOString().split('T')[0] ?? new Date().toISOString() ?? new Date().toISOString(),
      status: 'Inscripciones Abiertas',
    };

    setCreatedTournamentTemp(newTournament);
    setPublishStep('payment');
  };

  const handleConfirmPaymentAndPublish = () => {
    if (!createdTournamentTemp) return;

    setPublishStep('processing');

    setTimeout(() => {
      onAddTournament(createdTournamentTemp);
      setLastReceipt({
        id: `TX-TRN-${Math.floor(100000 + Math.random() * 900000)}`,
        hash: `sha256_${Math.random().toString(36).substring(2, 12)}`,
        date: new Date().toLocaleString('es-AR'),
      });
      setPublishStep('success');
    }, 1500);
  };

  const resetPublishModal = () => {
    setIsPublishModalOpen(false);
    setPublishStep('form');
    setCreatedTournamentTemp(null);
    setTitle('');
    setOrganizerName('');
    setCategory('');
    setCity('');
    setVenueName('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setPrizes('');
    setRegistrationFee('');
    setRegistrationLink('');
    setContactWhatsApp('');
    setContactEmail('');
    setContactInstagram('');
    setBannerImage(PRESET_BANNERS[0].url);
    setCardNumber('');
    setCardHolder('');
    setCardExpiry('');
    setCardCvv('');
  };

  // Filtered List
  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.organizerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport = selectedSport === 'Todos' || t.sport === selectedSport;
    const matchesProvince = selectedProvince === 'Todas' || t.province === selectedProvince;
    const matchesStatus = selectedStatus === 'Todos' || t.status === selectedStatus;

    return matchesSearch && matchesSport && matchesProvince && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Banner Callout */}
      <div className="bg-[#161618] border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff41]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> Portal Oficial de Competencias y Torneos
              </span>
              <span className="bg-white/10 text-white/70 font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/10">
                {tournaments.length} Torneos Activos
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight">
              Torneos & Ligas Deportivas Nacionales
            </h1>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Publica tu torneo, liga o copa. Añade fotos e información detallada, botones de inscripción directa a tu formulario y contacto directo de WhatsApp para los equipos.
            </p>
          </div>

          <button
            id="btn-open-publish-tournament"
            onClick={() => setIsPublishModalOpen(true)}
            className="px-6 py-3.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-[#00ff41]/20 hover:scale-105 transition-all flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> Publicar Mi Torneo
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-[#161618] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar torneo, sede o liga..."
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
            />
          </div>

          {/* Sport Selector */}
          <div>
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

          {/* Province Selector */}
          <div>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
            >
              {PROVINCES_LIST.map((p) => (
                <option key={p} value={p} className="bg-[#161618]">
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Inscripciones Abiertas">Inscripciones Abiertas</option>
              <option value="En Curso">En Curso</option>
              <option value="Próximamente">Próximamente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((t) => (
          <div
            key={t.id}
            className="bg-[#161618] border border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between hover:border-[#00ff41]/50 transition-all shadow-xl hover:shadow-2xl hover:shadow-[#00ff41]/5 group"
          >
            <div>
              {/* Image Banner Header */}
              <div className="relative h-48 w-full overflow-hidden bg-black/50">
                <img
                  src={t.bannerImage}
                  alt={t.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-transparent to-black/40"></div>

                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-3 py-1 bg-[#00ff41] text-black font-black text-[10px] uppercase tracking-wider rounded-full shadow-lg">
                    {t.status}
                  </span>
                  <span className="px-2.5 py-1 bg-black/60 backdrop-blur border border-white/20 text-white font-mono text-[10px] uppercase rounded-full">
                    {t.sport}
                  </span>
                </div>

                {/* Category Badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-black/70 backdrop-blur border border-white/20 text-[#00ff41] font-bold text-[11px] uppercase rounded-lg">
                    {t.category}
                  </span>
                  {t.isVerifiedOrganizer && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 rounded-md text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" /> Verificado
                    </span>
                  )}
                </div>
              </div>

              {/* Tournament Info Body */}
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
                    {t.organizerName}
                  </div>
                  <h3 className="text-lg font-black text-white uppercase italic leading-tight group-hover:text-[#00ff41] transition-colors">
                    {t.title}
                  </h3>
                </div>

                <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">
                  {t.description}
                </p>

                {/* Key Attributes */}
                <div className="space-y-2 text-xs text-white/70 font-mono bg-[#0a0a0c] p-3 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#00ff41]" />
                    <span className="truncate">{t.venueName} ({t.city}, {t.province})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-white/40" />
                    <span>Inicia: {t.startDate} {t.endDate ? `| Finaliza: ${t.endDate}` : ''}</span>
                  </div>

                  {t.prizes && (
                    <div className="flex items-center gap-2 text-[#00ff41]">
                      <Award className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate"><strong>Premios:</strong> {t.prizes}</span>
                    </div>
                  )}

                  {t.registrationFee && (
                    <div className="flex items-center gap-2 text-white">
                      <DollarSign className="w-3.5 h-3.5 text-white/40" />
                      <span><strong>Arancel:</strong> {t.registrationFee}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="p-4 sm:p-6 pt-0 space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {t.registrationLink && (
                  <a
                    href={t.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/10 flex items-center justify-center gap-1.5 transition-all text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Inscribirme / Formulario
                  </a>
                )}

                <a
                  href={`https://wa.me/${t.contactWhatsApp.replace(/[^0-9]/g, '')}?text=Hola!%20Quisiera%20inscribir%20mi%20equipo%20en%20el%20torneo%20${encodeURIComponent(
                    t.title
                  )}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition-colors ${
                    !t.registrationLink ? 'w-full bg-[#00ff41] text-black hover:bg-[#00ff41]/90' : 'px-4'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Consultar WhatsApp
                </a>
              </div>

              <button
                onClick={() => setSelectedTournamentDetail(t)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-bold uppercase rounded-xl border border-white/5 transition-colors flex items-center justify-center gap-1"
              >
                <Info className="w-3.5 h-3.5" /> Ver Bases y Contactos
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PUBLISH TOURNAMENT MODAL WITH LOW COST CHECKOUT STEP ($4.900 ARS) */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#161618] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#161618]/95 backdrop-blur z-20">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#00ff41]" />
                <div>
                  <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
                    Publicar Nuevo Torneo o Competencia
                  </h2>
                  <p className="text-[10px] text-[#00ff41] font-mono uppercase tracking-wider">
                    Arancel Accesible de Publicación: $4.900 ARS (60 días de difusión)
                  </p>
                </div>
              </div>
              <button
                onClick={resetPublishModal}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: FORM FILLING */}
            {publishStep === 'form' && (
              <form onSubmit={handleGoToPayment} className="p-6 space-y-5 text-xs">
                <div className="bg-[#00ff41]/10 border border-[#00ff41]/30 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-[#00ff41]">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 shrink-0" />
                    <span className="font-bold">
                      Difusión nacional para tu torneo por solo <span className="underline font-black">$4.900 ARS</span>.
                    </span>
                  </div>
                  <span className="bg-[#00ff41] text-black font-black text-[9px] uppercase px-2.5 py-1 rounded-full shrink-0">
                    Bajo Costo
                  </span>
                </div>

                {/* Tournament Title & Organizer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-white/60 uppercase mb-1">
                      Nombre del Torneo / Copa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Copa Nocturna de Verano Fútbol 8"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-white/60 uppercase mb-1">
                      Entidad u Organizador *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Liga Salguero / Club San Martín"
                      value={organizerName}
                      onChange={(e) => setOrganizerName(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>
                </div>

                {/* Sport & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-white/60 uppercase mb-1">Deporte</label>
                    <select
                      value={sport}
                      onChange={(e) => setSport(e.target.value as SportType)}
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
                    <label className="block font-bold text-white/60 uppercase mb-1">
                      Categoría / Formato
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Fútbol 8 Libre / Femenino Sub-18 / Senior +35"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>
                </div>

                {/* Location Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-white/60 uppercase mb-1">Provincia</label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
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
                    <label className="block font-bold text-white/60 uppercase mb-1">Ciudad *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Córdoba / CABA"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-white/60 uppercase mb-1">
                      Predio / Sede Principal
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Complejo Costa Salguero"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>
                </div>

                {/* Dates & Fees */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-white/60 uppercase mb-1">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-white/60 uppercase mb-1">
                      Fecha de Cierre (Opcional)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-white/60 uppercase mb-1">
                      Valor / Arancel para Equipos
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: $45.000 por equipo"
                      value={registrationFee}
                      onChange={(e) => setRegistrationFee(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>
                </div>

                {/* Prizes & Registration Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-white/60 uppercase mb-1">
                      Premios y Trofeos
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: $500.000 ARS en efectivo + Trofeo"
                      value={prizes}
                      onChange={(e) => setPrizes(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#00ff41] uppercase mb-1 flex items-center gap-1">
                      <LinkIcon className="w-3.5 h-3.5" /> Link de Formulario / Web (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://forms.gle/tu_formulario_o_web"
                      value={registrationLink}
                      onChange={(e) => setRegistrationLink(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-[#00ff41]/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>
                </div>

                {/* Contacts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-white/60 uppercase mb-1">
                      WhatsApp de Contacto *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+54 9 11 1234 5678"
                      value={contactWhatsApp}
                      onChange={(e) => setContactWhatsApp(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-white/60 uppercase mb-1">
                      Email de la Organización
                    </label>
                    <input
                      type="email"
                      placeholder="torneo@organizacion.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-white/60 uppercase mb-1">
                      Instagram (@usuario)
                    </label>
                    <input
                      type="text"
                      placeholder="@torneo_oficial"
                      value={contactInstagram}
                      onChange={(e) => setContactInstagram(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>
                </div>

                {/* IMAGE UPLOAD FROM PC / PHONE SECTION */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="block font-bold text-white uppercase flex items-center justify-between">
                    <span>Imagen / Banner del Torneo</span>
                    <span className="text-[10px] font-mono text-[#00ff41]">Subir desde Celular o PC</span>
                  </label>

                  <div className="border-2 border-dashed border-white/20 hover:border-[#00ff41] bg-[#0a0a0c] rounded-2xl p-4 text-center transition-all relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <Upload className="w-8 h-8 text-[#00ff41] animate-bounce" />
                      <span className="font-bold text-white text-xs">
                        Haz clic para seleccionar o arrastrar una foto desde tu equipo / celular
                      </span>
                    </div>
                  </div>

                  {bannerImage && (
                    <div className="relative h-28 w-full rounded-2xl overflow-hidden border border-[#00ff41] shadow-xl mt-2">
                      <img src={bannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-[#00ff41] text-black font-black text-[9px] uppercase px-2 py-0.5 rounded-full">
                        Imagen Cargada
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-white/60 uppercase mb-1">
                    Descripción y Reglamento General
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Modalidad del torneo, servicios del predio (árbitros, médicos, buffet)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>

                {/* Form Actions */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white/50 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-[#00ff41]" />
                    <span>Publicación inmediata tras confirmar el arancel de $4.900 ARS</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={resetPublishModal}
                      className="px-4 py-2 bg-white/5 text-white/70 font-bold uppercase rounded-xl hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 flex items-center gap-1.5"
                    >
                      Continuar al Pago ($4.900 ARS) ➔
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 2: PAYMENT METHOD & CHECKOUT */}
            {publishStep === 'payment' && (
              <div className="p-6 space-y-6 text-xs animate-fadeIn">
                {/* Summary Box */}
                <div className="bg-[#0a0a0c] border border-[#00ff41]/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-extrabold uppercase text-white text-sm">{title}</span>
                    <span className="text-[#00ff41] font-mono font-black text-lg">$4.900 ARS</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-white/70 text-[11px]">
                    <div>
                      <strong className="text-white">Organiza:</strong> {organizerName}
                    </div>
                    <div>
                      <strong className="text-white">Ubicación:</strong> {city}, {province}
                    </div>
                    <div>
                      <strong className="text-white">Validez:</strong> 60 días de presencia destacada
                    </div>
                    <div>
                      <strong className="text-white">Insignia:</strong> Organizador Verificado
                    </div>
                  </div>
                </div>

                {/* Payment Options */}
                <div className="space-y-3">
                  <label className="block font-black text-white uppercase tracking-wider text-xs">
                    Selecciona tu medio de pago:
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mercadopago')}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 font-bold transition-all ${
                        paymentMethod === 'mercadopago'
                          ? 'border-[#00ff41] bg-[#00ff41]/10 text-[#00ff41]'
                          : 'border-white/10 bg-[#0a0a0c] text-white/60 hover:text-white'
                      }`}
                    >
                      <DollarSign className="w-5 h-5" />
                      Mercado Pago
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 font-bold transition-all ${
                        paymentMethod === 'card'
                          ? 'border-[#00ff41] bg-[#00ff41]/10 text-[#00ff41]'
                          : 'border-white/10 bg-[#0a0a0c] text-white/60 hover:text-white'
                      }`}
                    >
                      <Trophy className="w-5 h-5" />
                      Tarjeta Débito/Crédito
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 font-bold transition-all ${
                        paymentMethod === 'transfer'
                          ? 'border-[#00ff41] bg-[#00ff41]/10 text-[#00ff41]'
                          : 'border-white/10 bg-[#0a0a0c] text-white/60 hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-5 h-5" />
                      Transferencia CBU
                    </button>
                  </div>
                </div>

                {/* Card Form */}
                {paymentMethod === 'card' && (
                  <div className="bg-[#0a0a0c] border border-white/10 p-4 rounded-2xl space-y-3">
                    <div>
                      <label className="block font-bold text-white/60 mb-1 uppercase">Número de Tarjeta</label>
                      <input
                        type="text"
                        placeholder="4509 8400 9182 4410"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-[#161618] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block font-bold text-white/60 mb-1 uppercase">Nombre Titular</label>
                        <input
                          type="text"
                          placeholder="JUAN PEREZ"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full bg-[#161618] border border-white/10 rounded-xl px-3 py-2 text-white uppercase"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-white/60 mb-1 uppercase">Venc / CVV</label>
                        <input
                          type="text"
                          placeholder="08/28 - 123"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-[#161618] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Transfer Info */}
                {paymentMethod === 'transfer' && (
                  <div className="bg-[#0a0a0c] border border-white/10 p-4 rounded-2xl space-y-2 font-mono">
                    <div className="flex justify-between text-white/70">
                      <span>Alias Mercado Pago:</span>
                      <strong className="text-[#00ff41]">talentmatch.pago.mp</strong>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>CBU / CVU:</span>
                      <strong className="text-white">1430001713008385810012</strong>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Titular:</span>
                      <strong className="text-white">TalentMatch Argentina S.A.</strong>
                    </div>
                    <p className="text-[10px] text-white/40 pt-1 font-sans">
                      Acreditación inmediata. Al transferir $4.900 ARS el sistema verifica y publica el torneo automáticamente.
                    </p>
                  </div>
                )}

                {/* Mercado Pago Prompt */}
                {paymentMethod === 'mercadopago' && (
                  <div className="bg-[#009ee3]/10 border border-[#009ee3]/30 p-4 rounded-2xl text-center space-y-2">
                    <span className="text-[#009ee3] font-black text-sm uppercase block">
                      Checkout Oficial Mercado Pago Argentina
                    </span>
                    <p className="text-white/70 text-xs">
                      Paga con dinero en cuenta, Débito Mercado Pago o cuotas sin interés.
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setPublishStep('form')}
                    className="px-4 py-2 bg-white/5 text-white/70 font-bold uppercase rounded-xl hover:bg-white/10"
                  >
                    ← Modificar Datos
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmPaymentAndPublish}
                    className="px-6 py-3 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20 flex items-center gap-2 text-xs"
                  >
                    Confirmar Pago y Publicar ($4.900 ARS)
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PROCESSING */}
            {publishStep === 'processing' && (
              <div className="p-12 text-center space-y-4 animate-fadeIn">
                <div className="w-16 h-16 border-4 border-[#00ff41] border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="text-xl font-black text-white uppercase italic">
                  Procesando Pago Seguro ($4.900 ARS)...
                </h3>
                <p className="text-xs text-white/60">
                  Verificando credenciales con la red de pagos y activando tu torneo en el portal nacional.
                </p>
              </div>
            )}

            {/* STEP 4: SUCCESS RECEIPT */}
            {publishStep === 'success' && (
              <div className="p-8 text-center space-y-6 animate-fadeIn">
                <div className="w-16 h-16 bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase italic">
                    ¡Torneo Publicado Con Éxito!
                  </h3>
                  <p className="text-xs text-white/70 max-w-md mx-auto">
                    Tu competencia <strong className="text-[#00ff41]">{title}</strong> ya se encuentra activa en el portal oficial y visible para miles de clubes y atletas.
                  </p>
                </div>

                {/* Receipt Box */}
                {lastReceipt && (
                  <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2 text-xs font-mono">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-white/50">Comprobante N°:</span>
                      <span className="text-white font-bold">{lastReceipt.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Importe Abonado:</span>
                      <span className="text-[#00ff41] font-bold">$4.900 ARS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Fecha & Hora:</span>
                      <span className="text-white">{lastReceipt.date}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-2 text-[10px]">
                      <span className="text-white/40">Hash Transacción:</span>
                      <span className="text-white/60 truncate max-w-[180px]">{lastReceipt.hash}</span>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={resetPublishModal}
                    className="px-6 py-3 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20"
                  >
                    Ver Mi Torneo Publicado
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOURNAMENT DETAIL MODAL */}
      {selectedTournamentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#161618] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Banner Header */}
            <div className="relative h-56 w-full">
              <img
                src={selectedTournamentDetail.bannerImage}
                alt={selectedTournamentDetail.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-transparent to-black/60"></div>

              <button
                onClick={() => setSelectedTournamentDetail(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 backdrop-blur text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6">
                <span className="px-2.5 py-1 bg-[#00ff41] text-black font-black text-[10px] uppercase rounded-full">
                  {selectedTournamentDetail.status}
                </span>
                <h3 className="text-2xl font-black text-white uppercase italic mt-1 leading-tight">
                  {selectedTournamentDetail.title}
                </h3>
                <p className="text-xs text-white/80 font-mono">
                  Organizado por {selectedTournamentDetail.organizerName}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold text-white/50 uppercase tracking-wider text-[10px]">
                  Información y Reglamento
                </h4>
                <p className="text-white/80 leading-relaxed font-sans text-sm">
                  {selectedTournamentDetail.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 font-mono">
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Sede & Ubicación</span>
                  <span className="text-white font-bold">{selectedTournamentDetail.venueName}</span>
                  <span className="text-white/60 block">{selectedTournamentDetail.city}, {selectedTournamentDetail.province}</span>
                </div>

                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Fechas</span>
                  <span className="text-white font-bold">{selectedTournamentDetail.startDate}</span>
                  {selectedTournamentDetail.endDate && (
                    <span className="text-white/60 block">Hasta: {selectedTournamentDetail.endDate}</span>
                  )}
                </div>

                {selectedTournamentDetail.prizes && (
                  <div>
                    <span className="text-[#00ff41] block text-[10px] uppercase font-bold">Premios</span>
                    <span className="text-white font-bold">{selectedTournamentDetail.prizes}</span>
                  </div>
                )}

                {selectedTournamentDetail.registrationFee && (
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Arancel</span>
                    <span className="text-white font-bold">{selectedTournamentDetail.registrationFee}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {selectedTournamentDetail.registrationLink && (
                  <a
                    href={selectedTournamentDetail.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-[#00ff41]/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" /> Ir al Formulario / Link de Inscripción
                  </a>
                )}

                <a
                  href={`https://wa.me/${selectedTournamentDetail.contactWhatsApp.replace(
                    /[^0-9]/g,
                    ''
                  )}?text=Hola!%20Deseo%20más%20información%20para%20inscribir%20un%20equipo%20en%20el%20torneo%20${encodeURIComponent(
                    selectedTournamentDetail.title
                  )}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-[#00ff41]" /> Contactar por WhatsApp ({selectedTournamentDetail.contactWhatsApp})
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
