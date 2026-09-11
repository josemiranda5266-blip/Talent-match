import React from 'react';
import { Athlete, ExecutiveDashboardData } from '../types';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Briefcase,
  Award,
  Users,
  MapPin,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface ExecutiveDashboardViewProps {
  athlete: Athlete;
  dashboardData: ExecutiveDashboardData;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  athlete,
  dashboardData,
}) => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      {/* BANNER HEADER */}
      <div className="bg-gradient-to-r from-[#121214] via-[#18181c] to-[#0a2210] p-6 sm:p-8 rounded-3xl border border-[#00ff41]/30 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] text-xs font-mono font-bold uppercase">
              <BarChart3 className="w-3.5 h-3.5" /> Dashboard Ejecutivo de Métricas de Carrera
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase">
              Rendimiento & Empleabilidad – <span className="text-[#00ff41]">{athlete.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/70">
              Auditoría en tiempo real de visibilidad, tasa de conversión y proyección nacional por categoría.
            </p>
          </div>

          <div className="bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 text-right font-mono">
            <span className="text-[10px] text-white/50 uppercase block">Ranking Nacional Categoría</span>
            <span className="text-lg font-black text-purple-400">{dashboardData.nationalRankCategory}</span>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS (4 CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Índice de Empleabilidad</span>
            <Briefcase className="w-4 h-4 text-[#00ff41]" />
          </div>
          <p className="text-3xl font-black text-[#00ff41] font-mono">{dashboardData.employabilityIndex}%</p>
          <p className="text-[10px] text-white/50">Alta probabilidad de contratación activa</p>
        </div>

        <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Índice de Visibilidad</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400 font-mono">{dashboardData.visibilityIndex}%</p>
          <p className="text-[10px] text-white/50">{dashboardData.monthlyProfileViews} vistas este mes</p>
        </div>

        <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Conversión a Entrevistas</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400 font-mono">{dashboardData.interviewConversionRate}%</p>
          <p className="text-[10px] text-white/50">{dashboardData.monthlyDirectContacts} contactos directos</p>
        </div>

        <div className="bg-[#161618] p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Conversión a Fichajes</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-purple-400 font-mono">{dashboardData.contractConversionRate}%</p>
          <p className="text-[10px] text-white/50">Proporción de cierre de contratos</p>
        </div>
      </div>

      {/* CHARTS & MAP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* EVOLUCIÓN MENSUAL DE VISTAS Y CONTACTOS */}
        <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="font-black text-white text-base italic uppercase flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00ff41]" /> Evolución Mensual de Interés
            </h3>
            <span className="text-xs text-[#00ff41] font-mono font-bold">+28% vs mes anterior</span>
          </div>

          <div className="space-y-3">
            {dashboardData.monthlyViewsTrend.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">{item.month}</span>
                  <span className="text-white/60 font-mono">
                    {item.views} Vistas / {item.contacts} Contactos
                  </span>
                </div>
                <div className="w-full bg-[#0a0a0c] h-3 rounded-full overflow-hidden flex">
                  <div
                    className="bg-[#00ff41] h-full transition-all"
                    style={{ width: `${Math.min(100, item.views * 2)}%` }}
                  />
                  <div
                    className="bg-amber-400 h-full transition-all"
                    style={{ width: `${Math.min(100, item.contacts * 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MAPA GEOGRÁFICO DE OPORTUNIDADES */}
        <div className="bg-[#161618] p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="font-black text-white text-base italic uppercase flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" /> Mapa Geográfico de Oportunidades
            </h3>
            <span className="text-xs text-white/50">Por provincias argentinas</span>
          </div>

          <div className="space-y-3">
            {dashboardData.geoOpportunitiesMap.map((geo, idx) => (
              <div key={idx} className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">{geo.province}</p>
                  <p className="text-white/50">{geo.searchCount} convocatorias activas en la región</p>
                </div>
                <span className="text-[#00ff41] font-mono font-bold text-sm">
                  {geo.avgMatchPercent}% Match Promedio
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
