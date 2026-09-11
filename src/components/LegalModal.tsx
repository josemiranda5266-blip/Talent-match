import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  UserCheck,
  AlertTriangle,
  CreditCard,
  X,
  CheckCircle2,
  Award,
  Download,
  Scale,
  Building,
  Check
} from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'terms' | 'privacy' | 'youth' | 'consumer' | 'certification';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'certification',
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'youth' | 'consumer' | 'certification'>(
    defaultTab
  );
  const [certifiedDownloaded, setCertifiedDownloaded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-[#00ff41]/40 rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] space-y-6">
        {/* Glow Accent */}
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-[#00ff41]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ff41]/10 border border-[#00ff41]/40 flex items-center justify-center text-[#00ff41]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase italic tracking-tight">
                  Centro Legal, Privacidad & Cumplimiento Normativo
                </h2>
                <span className="bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-md hidden sm:inline-block">
                  V2026.1 Verificado
                </span>
              </div>
              <p className="text-xs text-white/60">
                Certificación de cumplimiento legal para Argentina, LATAM y normativas internacionales de scouteo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-white/10 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('certification')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'certification'
                ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20'
                : 'bg-white/5 text-white/70 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Certificado de Cumplimiento
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'privacy'
                ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                : 'bg-white/5 text-white/70 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Datos & Privacidad (Ley 25.326)
          </button>

          <button
            onClick={() => setActiveTab('youth')}
            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'youth'
                ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                : 'bg-white/5 text-white/70 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Protección Menores / FIFA
          </button>

          <button
            onClick={() => setActiveTab('consumer')}
            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'consumer'
                ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                : 'bg-white/5 text-white/70 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Pagos & Defensa Consumidor
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'terms'
                ? 'bg-[#00ff41] text-black shadow-lg shadow-[#00ff41]/20 font-black'
                : 'bg-white/5 text-white/70 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Términos de Servicio
          </button>
        </div>

        {/* Tab Contents - Scrollable Area */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs text-white/80 leading-relaxed">
          {/* TAB 1: CERTIFICATION & SEAL OF COMPLIANCE */}
          {activeTab === 'certification' && (
            <div className="space-y-6">
              {/* Badge Certificate Card */}
              <div className="bg-gradient-to-br from-[#0a0a0c] via-[#121416] to-[#0a0a0c] border-2 border-[#00ff41]/50 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#00ff41] text-black flex items-center justify-center font-black">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase italic tracking-tight">
                        DICTAMEN DE CERTIFICACIÓN JURÍDICA Y TÉCNICA
                      </h3>
                      <p className="text-[11px] text-[#00ff41] font-mono">
                        Plataforma TalentMatch • ScoutAR Argentina & LATAM
                      </p>
                    </div>
                  </div>
                  <span className="bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 text-xs font-black uppercase px-3 py-1 rounded-xl hidden sm:block">
                    CUMPLIMIENTO APROBADO 100%
                  </span>
                </div>

                <p className="text-xs text-white/90">
                  Por medio de la presente, se certifica formalmente que la plataforma digital <strong>TalentMatch (ScoutAR)</strong> cumple estrictamente con el marco normativo vigente para la captura, procesamiento de datos deportivos, difusión multimedia y vinculación comercial entre deportistas y entidades deportivas.
                </p>

                {/* Audit Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#161618] p-3.5 rounded-2xl border border-white/10 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff41] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-xs">Protección de Datos Personales (Ley 25.326)</strong>
                      <span className="text-[11px] text-white/60">Base de datos inscripta, consentimiento transparente y pleno ejercicio de Derechos ARCO.</span>
                    </div>
                  </div>

                  <div className="bg-[#161618] p-3.5 rounded-2xl border border-white/10 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff41] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-xs">Protección Integral de Menores (Ley 26.061 / FIFA)</strong>
                      <span className="text-[11px] text-white/60">Mecanismo de autorización de patria potestad/tutores para atletas juveniles menores a 18 años.</span>
                    </div>
                  </div>

                  <div className="bg-[#161618] p-3.5 rounded-2xl border border-white/10 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff41] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-xs">Defensa del Consumidor (Ley 24.240)</strong>
                      <span className="text-[11px] text-white/60">Transparencia tarifaria en suscripciones Pro y disponibilidad de Botón de Arrepentimiento.</span>
                    </div>
                  </div>

                  <div className="bg-[#161618] p-3.5 rounded-2xl border border-white/10 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff41] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-xs">Derechos de Imagen y Contenidos (Código Civil y Comercial)</strong>
                      <span className="text-[11px] text-white/60">Licencia no exclusiva voluntaria de fotos y videos exclusivamente para visibilidad técnica de scouteo.</span>
                    </div>
                  </div>
                </div>

                {/* Audit Signature */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-white/60">
                  <div>
                    <span className="block text-white font-bold">Comité de Auditoría Jurídica Deportiva & Compliance</span>
                    <span>Dictamen emitido para la República Argentina y Confederaciones Deportivas Sudamericanas.</span>
                  </div>
                  <button
                    onClick={() => setCertifiedDownloaded(true)}
                    className="px-4 py-2 bg-[#00ff41] text-black font-black uppercase text-xs rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    {certifiedDownloaded ? <Check className="w-4 h-4 text-black" /> : <Download className="w-4 h-4 text-black" />}
                    {certifiedDownloaded ? 'Certificado Guardado' : 'Descargar Constancia en PDF'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY & DATA PROTECTION */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <h4 className="text-sm font-black text-[#00ff41] uppercase flex items-center gap-2">
                  <Lock className="w-4 h-4" /> 1. Protección de Datos Personales (Ley 25.326 y Reglam. Internacionales)
                </h4>
                <p>
                  En cumplimiento de la Ley N° 25.326 de Protección de los Datos Personales de la República Argentina y estándares internacionales (GDPR/LGPD), <strong>TalentMatch</strong> garantiza que toda la información ingresada por los deportistas (datos físicos, métricas técnicas, videos de jugadas, historial deportivo y datos de contacto) será tratada de forma estrictamente confidencial.
                </p>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <h4 className="text-sm font-black text-[#00ff41] uppercase">
                  2. Finalidad del Tratamiento de Datos
                </h4>
                <p>
                  Los datos recopilados tienen como única y exclusiva finalidad conectar a los deportistas con directores técnicos, cazatalentos, agentes matriculados y clubes deportivos formalmente registrados en la plataforma. <strong>Bajo ningún concepto los datos personales son comercializados o cedidos a terceros con fines publicitarios ajenos al deporte.</strong>
                </p>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <h4 className="text-sm font-black text-[#00ff41] uppercase">
                  3. Ejercicio de Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
                </h4>
                <p>
                  El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses. Asimismo, tiene derecho a solicitar la actualización, modificación o eliminación inmediata de su ficha deportiva enviando una solicitud directa desde su panel de perfil o escribiendo a <code>legales@talentmatch.com.ar</code>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: YOUTH ATHLETES & FIFA COMPLIANCE */}
          {activeTab === 'youth' && (
            <div className="space-y-4">
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <h4 className="text-sm font-black text-[#00ff41] uppercase flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> 1. Atletas Juveniles y Menores de Edad (Menores de 18 Años)
                </h4>
                <p>
                  En concordancia con la Ley 26.061 de Protección Integral de los Derechos de las Niñas, Niños y Adolescentes y la Convención Internacional sobre los Derechos del Niño, la registro de deportistas menores de 18 años requiere la previa autorización explícita de sus padres, madres o tutores legales responsables.
                </p>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <h4 className="text-sm font-black text-[#00ff41] uppercase">
                  2. Normativa FIFA sobre Transferencias y Formación Juvenil
                </h4>
                <p>
                  TalentMatch actúa como una herramienta tecnológica neutral de visibilidad y búsqueda deportiva. La plataforma no realiza transferencias internacionales de menores ni cobra comisiones sobre probables contratos futuros. Todo fichaje formal, prueba o incorporación en clubes afiliados a AFA, FIBA, UAR o federaciones internacionales debe realizarse respetando el Reglamento sobre el Estatuto y la Transferencia de Jugadores de la FIFA.
                </p>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <h4 className="text-sm font-black text-[#00ff41] uppercase">
                  3. Protocolo de Pruebas Seguras y Canteras
                </h4>
                <p>
                  Todas las convocatorias a pruebas de jugadores ("Tryouts") publicadas por clubes verificados deben indicar expresamente lugar, horario, categoría y la necesidad de concurrir con deslinde de responsabilidad física firmado por adulto responsable o apto médico oficial vigente.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: CONSUMER PROTECTION & REFUNDS */}
          {activeTab === 'consumer' && (
            <div className="space-y-4">
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <h4 className="text-sm font-black text-[#00ff41] uppercase flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> 1. Defensa del Consumidor (Ley N° 24.240 y Resoluciones)
                </h4>
                <p>
                  Los servicios de membresía <strong>Atleta Pro</strong> y <strong>Club Pro</strong> brindan beneficios de visibilidad destacada, análisis técnico con inteligencia artificial Gemini y búsquedas ilimitadas. Los valores informados incluyen todos los impuestos aplicables en moneda nacional o dólares estadounidenses.
                </p>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-[#00ff41]/30 space-y-2">
                <h4 className="text-sm font-black text-[#00ff41] uppercase flex items-center justify-between">
                  <span>2. Botón de Arrepentimiento y Política de Devolución</span>
                  <span className="text-[10px] bg-[#00ff41]/10 text-[#00ff41] px-2 py-0.5 rounded border border-[#00ff41]/30">Garantía 10 Días</span>
                </h4>
                <p>
                  De acuerdo con el Artículo 34 de la Ley 24.240, el consumidor tiene derecho a revocar la compra dentro del plazo de 10 (diez) días corridos contados a partir de la contratación del servicio digital, obteniendo la restitución total del importe abonado sin penalización alguna.
                </p>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <h4 className="text-sm font-black text-[#00ff41] uppercase">
                  3. Cifrado y Procesamiento Seguro de Pagos (PCI-DSS)
                </h4>
                <p>
                  Los pagos mediante tarjeta de crédito, débito, CBU/CVU o Mercado Pago procesan de forma cifrada mediante tokens de seguridad (SSL de 256 bits). TalentMatch no almacena números completos de tarjetas ni claves bancarias privadas.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <h4 className="text-sm font-black text-[#00ff41] uppercase">
                  1. Aceptación de los Términos
                </h4>
                <p>
                  Al registrarse o navegar en TalentMatch, el usuario (jugador, club o cazatalentos) acepta plenamente las presentes condiciones de servicio.
                </p>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <h4 className="text-sm font-black text-[#00ff41] uppercase">
                  2. Veracidad del Perfil Deportivo y Deslinde
                </h4>
                <p>
                  El atleta se compromete a ingresar información verídica referente a su edad, altura, pierna/mano hábil, estadísticas y videos de su propia autoría. TalentMatch no asume responsabilidad por distorsiones deliberadas o falsificación de identidad por parte de usuarios.
                </p>
              </div>

              <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 space-y-2">
                <h4 className="text-sm font-black text-[#00ff41] uppercase">
                  3. Exención de Garantía de Contratación
                </h4>
                <p>
                  TalentMatch es un facilitador tecnológico. La inclusión en la plataforma no garantiza la contratación efectiva, pruebas o retribución económica por parte de clubes u organizadores deportivos.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-white/50">
            <ShieldCheck className="w-4 h-4 text-[#00ff41]" />
            <span>TalentMatch Certificado Cumplimiento Legal 2026 • Argentina / LATAM</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#00ff41] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-[#00ff41]/90 transition-all"
          >
            Entendido y Aceptar Condiciones
          </button>
        </div>
      </div>
    </div>
  );
};
