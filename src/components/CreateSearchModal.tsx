import React, { useState } from 'react';
import { ClubSearch, ProfessionalCategory, SportType } from '../types';
import { auth } from '../lib/firebase';
import { SPORTS_LIST, PROFESSIONAL_CATEGORIES_LIST } from '../data/mockData';
import { ARGENTINA_PROVINCES } from '../constants/provinces';
import { X, Sparkles, PlusCircle, Building2, Calendar, MapPin, Briefcase, DollarSign } from 'lucide-react';

interface CreateSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSearch: (newSearch: ClubSearch) => void;
}

export const CreateSearchModal: React.FC<CreateSearchModalProps> = ({
  isOpen,
  onClose,
  onCreateSearch,
}) => {
  const [clubName, setClubName] = useState('Club Atlético Central Córdoba');
  const [title, setTitle] = useState('');
  const [categoryNeeded, setCategoryNeeded] = useState<ProfessionalCategory>('Deportista');
  const [sport, setSport] = useState<SportType>('Fútbol');
  const [positionNeeded, setPositionNeeded] = useState('Defensor Central');
  const [salaryOrRemuneration, setSalaryOrRemuneration] = useState('A convenir / Viáticos + Honorarios');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(35);
  const [city, setCity] = useState('Santiago del Estero');
  const [province, setProvince] = useState('Santiago del Estero');
  const [levelRequired, setLevelRequired] = useState<any>('Liga Local / Regional');
  const [trialDate, setTrialDate] = useState('2026-08-25');
  const [trialTime, setTrialTime] = useState('16:00 hs');
  const [locationDetails, setLocationDetails] = useState('Predio Deportivo Central Córdoba');
  const [description, setDescription] = useState('');
  const [requirementsText, setRequirementsText] = useState('Experiencia previa demostrable\nLicencia / Título profesional correspondiente\nDisponibilidad horaria');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  if (!isOpen) return null;

  const handleGenerateAiDescription = async () => {
    setIsGeneratingAi(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/ai/generate-search-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          clubName,
          sport,
          positionNeeded,
          minAge,
          maxAge,
          city,
          levelRequired,
        }),
      });
      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
      }
      if (data.requirements && Array.isArray(data.requirements)) {
        setRequirementsText(data.requirements.join('\n'));
      }
    } catch (err) {
      console.error('Error generating AI search description:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSearch: ClubSearch = {
      id: `search-${Date.now()}`,
      clubName,
      clubLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80',
      title: title || `Convocatoria de ${positionNeeded} (${categoryNeeded}) para ${clubName}`,
      sport,
      categoryNeeded,
      positionNeeded,
      salaryOrRemuneration,
      minAge,
      maxAge,
      city,
      province,
      levelRequired,
      trialDate,
      trialTime,
      locationDetails,
      description: description || `Búsqueda abierta de ${positionNeeded} (${categoryNeeded}) para ${clubName} en ${city}.`,
      requirements: requirementsText.split('\n').filter((r) => r.trim().length > 0),
      isFeatured: true,
      postedAt: new Date().toISOString().split('T')[0],
      applicantCount: 0,
      status: 'Abierta',
    };

    onCreateSearch(newSearch);
    onClose();
  };

  const availablePositions = SPORTS_LIST.find((s) => s.name === sport)?.positions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#161618]/95 backdrop-blur z-20">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#00ff41]" />
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Publicar Convocatoria</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Nombre del Club / Institución</label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-white/60 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#00ff41]" /> Categoría Profesional Buscada
              </label>
              <select
                value={categoryNeeded}
                onChange={(e) => setCategoryNeeded(e.target.value as ProfessionalCategory)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41] font-medium"
              >
                {PROFESSIONAL_CATEGORIES_LIST.map((cat) => (
                  <option key={cat.name} value={cat.name} className="bg-[#161618]">
                    {cat.name} ({cat.group})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-white/60 uppercase tracking-wider mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[#00ff41]" /> Remuneración / Ofrecimiento
              </label>
              <input
                type="text"
                value={salaryOrRemuneration}
                onChange={(e) => setSalaryOrRemuneration(e.target.value)}
                placeholder="Ej: Sueldo a convenir + Viáticos / Alojamiento"
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
              />
            </div>

            <div>
              <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Deporte / Disciplina</label>
              <select
                value={sport}
                onChange={(e) => {
                  const newSport = e.target.value as SportType;
                  setSport(newSport);
                  const pos = SPORTS_LIST.find((s) => s.name === newSport)?.positions[0] || '';
                  setPositionNeeded(pos);
                }}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
              >
                {SPORTS_LIST.map((s) => (
                  <option key={s.name} value={s.name} className="bg-[#161618]">{s.name}</option>
                ))}
              </select>
            </div>

            {/* DYNAMIC FORM ADAPTATION BY CATEGORY */}
            {(!categoryNeeded || categoryNeeded === 'Deportista') ? (
              <>
                <div>
                  <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Posición Requerida</label>
                  <select
                    value={positionNeeded}
                    onChange={(e) => setPositionNeeded(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  >
                    {availablePositions.map((pos) => (
                      <option key={pos} value={pos} className="bg-[#161618]">{pos}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Edad Mínima</label>
                    <input
                      type="number"
                      value={minAge}
                      onChange={(e) => setMinAge(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41] font-mono"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Edad Máxima</label>
                    <input
                      type="number"
                      value={maxAge}
                      onChange={(e) => setMaxAge(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41] font-mono"
                    />
                  </div>
                </div>
              </>
            ) : ['Director Técnico', 'Ayudante de Campo', 'Preparador Físico', 'Entrenador de Arqueros', 'Analista de Video', 'Scout'].includes(categoryNeeded) ? (
              <>
                <div>
                  <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Licencia / Título Requerido</label>
                  <input
                    type="text"
                    value={positionNeeded}
                    onChange={(e) => setPositionNeeded(e.target.value)}
                    placeholder="Ej: Licencia CONMEBOL A / Título ATFA / Hudl"
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Años Exp. Mínima</label>
                    <input
                      type="number"
                      value={minAge}
                      onChange={(e) => setMinAge(Number(e.target.value))}
                      placeholder="Ej: 3"
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41] font-mono"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Categoría a Cargo</label>
                    <select
                      value={levelRequired}
                      onChange={(e) => setLevelRequired(e.target.value as any)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    >
                      <option value="Amateur" className="bg-[#161618]">Infantiles / Juveniles</option>
                      <option value="Liga Local / Regional" className="bg-[#161618]">Reserva / Liga Regional</option>
                      <option value="Semiprofesional" className="bg-[#161618]">Torneo Federal / Semiprofesional</option>
                      <option value="Profesional" className="bg-[#161618]">Plantel Profesional de Primera</option>
                    </select>
                  </div>
                </div>
              </>
            ) : ['Kinesiólogo', 'Fisioterapeuta', 'Médico Deportivo', 'Nutricionista Deportivo', 'Psicólogo Deportivo', 'Masajista'].includes(categoryNeeded) ? (
              <>
                <div>
                  <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Especialidad Clínica / Matrícula</label>
                  <input
                    type="text"
                    value={positionNeeded}
                    onChange={(e) => setPositionNeeded(e.target.value)}
                    placeholder="Ej: Matrícula Nacional/Provincial habilitante"
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Años Experiencia</label>
                    <input
                      type="number"
                      value={minAge}
                      onChange={(e) => setMinAge(Number(e.target.value))}
                      placeholder="Ej: 2"
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41] font-mono"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Modalidad de Trabajo</label>
                    <input
                      type="text"
                      value={locationDetails}
                      onChange={(e) => setLocationDetails(e.target.value)}
                      placeholder="Ej: Presencial en Entrenamientos y Partidos"
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Área / Requisito Principal</label>
                  <input
                    type="text"
                    value={positionNeeded}
                    onChange={(e) => setPositionNeeded(e.target.value)}
                    placeholder="Ej: Gestión de Plantel y Acreditación Oficial"
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Años de Experiencia</label>
                  <input
                    type="number"
                    value={minAge}
                    onChange={(e) => setMinAge(Number(e.target.value))}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41] font-mono"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Ciudad</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej: La Plata, Rosario, Capital..."
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Provincia</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                  required
                >
                  <option value="" disabled>Seleccionar provincia</option>
                  {ARGENTINA_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Fecha de Prueba Presencial</label>
              <input
                type="date"
                value={trialDate}
                onChange={(e) => setTrialDate(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41] font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Lugar Exacto / Predio</label>
              <input
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
              />
            </div>
          </div>

          {/* AI Description Generator Button */}
          <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="text-white/50 text-xs">¿Quieres que la IA redacte el texto de la convocatoria?</span>
            <button
              type="button"
              onClick={handleGenerateAiDescription}
              disabled={isGeneratingAi}
              className="px-3.5 py-1.5 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGeneratingAi ? 'Redactando con IA...' : 'Redactar con IA'}
            </button>
          </div>

          <div>
            <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Descripción de la Búsqueda</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre el estilo de juego buscado, objetivos del equipo y dinámica de las pruebas..."
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
            />
          </div>

          <div>
            <label className="block font-bold text-white/60 uppercase tracking-wider mb-1">Requisitos (Un requisito por línea)</label>
            <textarea
              rows={3}
              value={requirementsText}
              onChange={(e) => setRequirementsText(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00ff41]"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 text-white/70 font-bold text-xs uppercase rounded-xl hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00ff41]/20"
            >
              Publicar Convocatoria Ahora
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
