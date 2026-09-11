import {
  Athlete,
  ClubSearch,
  ScoutAiWeights,
  ScoutMatchBreakdown,
  ClubDecisionFeedback,
  InverseMatchOpportunity,
  PredictiveSuccessModel,
  SmartGoalItem,
  SmartNotificationItem,
  ExecutiveDashboardData,
} from '../types';

export const DEFAULT_SCOUT_AI_WEIGHTS: ScoutAiWeights = {
  positionWeight: 20,
  categoryAndLevelWeight: 15,
  locationAndRelocationWeight: 15,
  verificationAndTrustWeight: 15,
  experienceAndHistoryWeight: 15,
  statsAndMediaWeight: 10,
  ratingAndReputationWeight: 10,
};

/**
 * Calculates a star rating string based on 0-100 score
 */
export function getStarRatingStr(score: number): string {
  if (score >= 95) return '★★★★★';
  if (score >= 88) return '★★★★☆';
  if (score >= 80) return '★★★★☆';
  if (score >= 70) return '★★★☆☆';
  return '★★★☆☆';
}

/**
 * ScoutAR AI Engine - Calculates precise compatibility breakdown for any candidate
 */
export function calculateCandidateCompatibility(
  candidate: Athlete,
  search: Partial<ClubSearch>,
  customWeights: ScoutAiWeights = DEFAULT_SCOUT_AI_WEIGHTS,
  clubFeedback: ClubDecisionFeedback[] = []
): ScoutMatchBreakdown {
  const pros: string[] = [];
  const cons: string[] = [];

  // 1. POSITION & ROL SCORE
  let positionScore = 50;
  const targetPos = (search.positionNeeded || '').toLowerCase().trim();
  const candPos = (candidate.position || '').toLowerCase().trim();
  const candSport = (candidate.sport || '').toLowerCase().trim();
  const targetSport = (search.sport || '').toLowerCase().trim();

  if (candSport === targetSport) {
    if (targetPos && (candPos.includes(targetPos) || targetPos.includes(candPos))) {
      positionScore = 100;
      pros.push(`Posición principal exacta (${candidate.position})`);
    } else if (candPos) {
      positionScore = 75;
      pros.push(`Deporte coincidente (${candidate.sport}) - Posición versátil (${candidate.position})`);
    } else {
      positionScore = 60;
    }
  } else {
    positionScore = 20;
    cons.push(`Deporte diferente (${candidate.sport} vs ${search.sport})`);
  }

  // 2. CATEGORY & LEVEL SCORE
  let categoryLevelScore = 60;
  const targetCat = search.categoryNeeded || 'Deportista';
  const candCat = candidate.category || 'Deportista';

  if (targetCat === candCat) {
    categoryLevelScore += 25;
    pros.push(`Categoría profesional exacta (${candCat})`);
  } else if (targetCat === 'Deportista' && candCat === 'Deportista') {
    categoryLevelScore += 25;
    pros.push(`Perfil de Deportista / Atleta`);
  } else {
    categoryLevelScore -= 20;
    cons.push(`Categoría distinta (${candCat} vs requerida ${targetCat})`);
  }

  if (search.levelRequired) {
    if (candidate.level === search.levelRequired) {
      categoryLevelScore += 15;
      pros.push(`Nivel competitivo requerido (${candidate.level})`);
    } else if (
      (candidate.level === 'Profesional' || candidate.level === 'Semiprofesional') &&
      search.levelRequired !== 'Profesional'
    ) {
      categoryLevelScore += 15;
      pros.push(`Nivel competitivo superior (${candidate.level})`);
    }
  }
  categoryLevelScore = Math.min(100, Math.max(10, categoryLevelScore));

  // 3. LOCATION & RELOCATION / AGE SCORE
  let locationScore = 50;
  const targetCity = (search.city || '').toLowerCase();
  const targetProv = (search.province || '').toLowerCase();
  const candCity = (candidate.city || '').toLowerCase();
  const candProv = (candidate.province || '').toLowerCase();

  if (candCity && targetCity && candCity === targetCity) {
    locationScore = 100;
    pros.push(`Misma ciudad (${candidate.city})`);
  } else if (candProv && targetProv && candProv === targetProv) {
    locationScore = 85;
    pros.push(`Misma provincia / zona (${candidate.province})`);
  } else if (candidate.willingToRelocate) {
    locationScore = 75;
    pros.push(`Disponible para traslado / mudanza`);
  } else {
    locationScore = 35;
    cons.push(`Ubicación distinta (${candidate.city}, ${candidate.province}) sin traslado preferente`);
  }

  // Age factor adjustment
  if (search.minAge && search.maxAge) {
    if (candidate.age >= search.minAge && candidate.age <= search.maxAge) {
      locationScore = Math.min(100, locationScore + 10);
      pros.push(`Edad dentro del rango ideal (${candidate.age} años)`);
    } else if (candidate.age < search.minAge) {
      cons.push(`Menor a la edad esperada (${candidate.age} años)`);
      locationScore = Math.max(10, locationScore - 15);
    } else {
      cons.push(`Mayor a la edad esperada (${candidate.age} años)`);
      locationScore = Math.max(10, locationScore - 15);
    }
  }

  // 4. VERIFICATION & TRUST SCORE
  let verificationScore = 50;
  const tier = candidate.verificationTier || (candidate.isVerified ? 'documental' : 'none');
  if (tier === 'professional' || tier === 'featured') {
    verificationScore = 100;
    pros.push(`Insignia Verificada Nivel Profesional / Élite`);
  } else if (tier === 'documental') {
    verificationScore = 85;
    pros.push(`Acreditación Documental Verificada (DNI / Licencia)`);
  } else if (tier === 'identity') {
    verificationScore = 70;
    pros.push(`Identidad Validada`);
  } else {
    verificationScore = 40;
    cons.push(`Perfil en proceso de verificación`);
  }

  const trust = candidate.trustScore || 70;
  if (trust >= 85) {
    pros.push(`Excelente reputación e índice de confianza (${trust}%)`);
    verificationScore = Math.min(100, verificationScore + 10);
  }

  // 5. EXPERIENCE & HISTORY / LICENSES SCORE
  let experienceScore = 50;
  const yearsExp = candidate.yearsExperience || 1;
  const historyLen = (candidate.workHistory || []).length;
  const certs = candidate.certificationsAndLicenses || [];

  if (yearsExp >= 3 || historyLen >= 2) {
    experienceScore += 25;
    pros.push(`Trayectoria comprobada (${yearsExp} años / ${historyLen} instituciones)`);
  }

  if (certs.length > 0) {
    experienceScore += 25;
    pros.push(`Licencias & Títulos (${certs.slice(0, 2).join(', ')})`);
  } else if (candCat !== 'Deportista') {
    cons.push(`Sin licencias oficiales acreditadas aún`);
    experienceScore -= 15;
  }
  experienceScore = Math.min(100, Math.max(10, experienceScore));

  // 6. STATS & MEDIA SCORE
  let statsMediaScore = 40;
  const hasVideo = Boolean((candidate.videosList && candidate.videosList.length > 0) || candidate.videoUrl);
  if (hasVideo) {
    statsMediaScore += 35;
    pros.push(`Video de jugadas / highlights cargado`);
  } else {
    cons.push(`No tiene video de highlights cargado`);
  }

  if (candidate.stats && (candidate.stats.matchesPlayed > 10 || candidate.stats.goalsOrPoints > 0)) {
    statsMediaScore += 25;
    pros.push(`Estadísticas de rendimiento activas (${candidate.stats.matchesPlayed} PJ)`);
  }
  statsMediaScore = Math.min(100, Math.max(10, statsMediaScore));

  // 7. RATING & REPUTATION SCORE
  let reputationScore = 50;
  const ratingVal = candidate.rating || 4.5;
  reputationScore = Math.round(ratingVal * 20); // 4.5 -> 90
  if (ratingVal >= 4.5) {
    pros.push(`Calificación promedio destacada (${ratingVal.toFixed(1)}★)`);
  } else if (ratingVal < 3.5) {
    cons.push(`Calificación comunitaria regular (${ratingVal.toFixed(1)}★)`);
  }

  // Calculate Weighted Total
  const totalWeight =
    customWeights.positionWeight +
    customWeights.categoryAndLevelWeight +
    customWeights.locationAndRelocationWeight +
    customWeights.verificationAndTrustWeight +
    customWeights.experienceAndHistoryWeight +
    customWeights.statsAndMediaWeight +
    customWeights.ratingAndReputationWeight;

  let rawScore =
    (positionScore * customWeights.positionWeight +
      categoryLevelScore * customWeights.categoryAndLevelWeight +
      locationScore * customWeights.locationAndRelocationWeight +
      verificationScore * customWeights.verificationAndTrustWeight +
      experienceScore * customWeights.experienceAndHistoryWeight +
      statsMediaScore * customWeights.statsAndMediaWeight +
      reputationScore * customWeights.ratingAndReputationWeight) /
    (totalWeight || 100);

  // Behavioral adaptation offset from club decisions
  if (clubFeedback && clubFeedback.length > 0) {
    const hiredOrFavorited = clubFeedback.filter((f) => f.actionType === 'hire' || f.actionType === 'favorite');
    if (hiredOrFavorited.length > 0) {
      // If club frequently favors young players
      const avgFavAge = hiredOrFavorited.reduce((acc, curr) => acc + curr.age, 0) / hiredOrFavorited.length;
      if (Math.abs(candidate.age - avgFavAge) <= 3) {
        rawScore += 3;
      }
      // If club favors verified profiles
      const verifiedFavs = hiredOrFavorited.filter((f) => f.trustScore >= 80);
      if (verifiedFavs.length / hiredOrFavorited.length > 0.5 && trust >= 80) {
        rawScore += 3;
      }
    }
  }

  const finalScore = Math.min(99, Math.max(30, Math.round(rawScore)));
  const starRating = getStarRatingStr(finalScore);

  // Tactical / Strategic summary
  let tacticalAnalysis = '';
  let recommendedRole = '';

  if (finalScore >= 90) {
    recommendedRole = 'Titular Inmediato / Refuerzo Clave';
    tacticalAnalysis = `${candidate.name} reúne las credenciales óptimas de jerarquía, ubicación y perfil verificado para incorporarse inmediatamente al plantel de ${search.clubName || 'la institución'}.`;
  } else if (finalScore >= 80) {
    recommendedRole = 'Candidato a Evaluación Directa';
    tacticalAnalysis = `${candidate.name} muestra un alto nivel de ajuste físico-táctico. Su incorporación aportará solidez y alternativas estratégicas al esquema del equipo.`;
  } else if (finalScore >= 68) {
    recommendedRole = 'Observación / Citación a Prueba';
    tacticalAnalysis = `${candidate.name} cuenta con atributos valiosos pero requiere evaluación presencial en prueba para certificar ritmo y adaptación.`;
  } else {
    recommendedRole = 'Reserva de Talentos';
    tacticalAnalysis = `Perfil con proyección futura. Se sugiere mantener en radar para próximas convocatorias según evolución.`;
  }

  return {
    athleteId: candidate.id,
    score: finalScore,
    starRating,
    pros,
    cons: cons.length > 0 ? cons : ['Sin observaciones críticas registradas'],
    factorScores: {
      positionScore,
      categoryLevelScore,
      locationScore,
      verificationScore,
      experienceScore,
      statsMediaScore,
      reputationScore,
    },
    tacticalAnalysis,
    recommendedRole,
  };
}

/**
 * FASE 5 - MATCH INVERSO (Oportunidades Automáticas)
 * Analiza continuamente las búsquedas activas y genera las mejores coincidencias automáticas para el deportista.
 */
export function calculateInverseMatches(
  candidate: Athlete,
  activeSearches: ClubSearch[],
  customWeights: ScoutAiWeights = DEFAULT_SCOUT_AI_WEIGHTS
): InverseMatchOpportunity[] {
  if (!activeSearches || activeSearches.length === 0) return [];

  const opportunities: InverseMatchOpportunity[] = activeSearches.map((search) => {
    const breakdown = calculateCandidateCompatibility(candidate, search, customWeights);

    return {
      id: `inv_${search.id}_${candidate.id}`,
      searchId: search.id,
      searchTitle: search.title,
      clubName: search.clubName,
      clubLogo: search.clubLogo,
      sport: search.sport,
      categoryNeeded: search.categoryNeeded,
      positionNeeded: search.positionNeeded,
      city: search.city,
      province: search.province,
      compatibilityScore: breakdown.score,
      starRating: breakdown.starRating,
      matchReasons: breakdown.pros.slice(0, 3),
      tacticalAnalysis: breakdown.tacticalAnalysis,
      foundAt: new Date().toISOString(),
      status: 'new',
    };
  });

  // Filter out low match scores (< 60%) and sort descending
  return opportunities
    .filter((opp) => opp.compatibilityScore >= 60)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

/**
 * FASE 5 - MODELO PREDICTIVO DE ÉXITO
 * Calcula métricas predictivas de convocatoria, contratación, interés y proyección competitiva.
 */
export function calculatePredictiveSuccess(
  candidate: Athlete,
  activeSearches: ClubSearch[] = []
): PredictiveSuccessModel {
  const inverseMatches = calculateInverseMatches(candidate, activeSearches);
  const topMatch = inverseMatches[0]?.compatibilityScore || 65;

  const trust = candidate.trustScore || 70;
  const isVerified = candidate.isVerified || candidate.verificationTier !== 'none';
  const hasVideos = Boolean((candidate.videosList && candidate.videosList.length > 0) || candidate.videoUrl);
  const matchesPlayed = candidate.stats?.matchesPlayed || 10;
  const rating = candidate.rating || 4.2;

  // Convocation Probability calculation
  let convocationProb = Math.round(
    topMatch * 0.4 + trust * 0.25 + (hasVideos ? 20 : 5) + (isVerified ? 15 : 5)
  );
  convocationProb = Math.min(98, Math.max(25, convocationProb));

  // Hiring Probability calculation
  let hiringProb = Math.round(
    topMatch * 0.35 + rating * 12 + (isVerified ? 20 : 5) + (matchesPlayed > 15 ? 15 : 5)
  );
  hiringProb = Math.min(96, Math.max(20, hiringProb));

  // Expected Interest
  let expectedInterestLevel: 'Muy Alto' | 'Alto' | 'Moderado' | 'En Crecimiento' = 'Moderado';
  if (hiringProb >= 85) expectedInterestLevel = 'Muy Alto';
  else if (hiringProb >= 72) expectedInterestLevel = 'Alto';
  else if (hiringProb >= 55) expectedInterestLevel = 'Moderado';
  else expectedInterestLevel = 'En Crecimiento';

  // Superior Category Fit
  let superiorCategoryFit = 'Proyección 1-2 años';
  if (candidate.level === 'Profesional' || isVerified) {
    superiorCategoryFit = 'Listo para Liga Profesional / Primera A';
  } else if (candidate.level === 'Semiprofesional' || matchesPlayed > 20) {
    superiorCategoryFit = 'Listo para Federal A / Liga Nacional B';
  } else if (hasVideos && trust >= 75) {
    superiorCategoryFit = 'En Adaptación a Torneos Superiores';
  }

  // Churn/Abandonment risk
  let churnOrAbandonmentRisk: 'Bajo' | 'Medio' | 'Atención Requerida' = 'Bajo';
  if (trust < 50 || (!hasVideos && matchesPlayed < 5)) {
    churnOrAbandonmentRisk = 'Atención Requerida';
  } else if (!isVerified && !hasVideos) {
    churnOrAbandonmentRisk = 'Medio';
  }

  // Growth Velocity Score
  let growthVelocityScore = Math.round(
    (hasVideos ? 30 : 10) +
    (isVerified ? 30 : 10) +
    (candidate.bio.length > 50 ? 20 : 5) +
    (candidate.stats ? 20 : 5)
  );
  growthVelocityScore = Math.min(99, Math.max(30, growthVelocityScore));

  const explanations = [
    `Probabilidad de convocatoria del ${convocationProb}% basada en coincidencia del ${topMatch}% con convocatorias activas.`,
    `Índice de confianza del ${trust}% y acreditación ${isVerified ? 'verificada' : 'en proceso'}.`,
    hasVideos ? 'Perfil enriquecido con material audiovisual en alta definición.' : 'Subir un video aumentaría un +15% las probabilidades.',
    `Nivel de adaptación: ${superiorCategoryFit}.`,
  ];

  return {
    convocationProbability: convocationProb,
    hiringProbability: hiringProb,
    expectedInterestLevel,
    superiorCategoryFit,
    churnOrAbandonmentRisk,
    growthVelocityScore,
    explanations,
  };
}

/**
 * FASE 5 - OBJETIVOS INTELIGENTES
 * Genera objetivos personalizados para incrementar el índice de visibilidad del perfil.
 */
export function generateSmartGoals(candidate: Athlete): SmartGoalItem[] {
  const goals: SmartGoalItem[] = [];

  // Goal 1: Complete Profile Bio & History
  const bioComplete = candidate.bio.length > 40 && Boolean(candidate.sportsExperience);
  goals.push({
    id: 'goal_profile',
    title: 'Completar Biografía y Trayectoria',
    description: 'Añade una descripción detallada de tus clubes anteriores y rol defensivo/ofensivo.',
    completed: bioComplete,
    visibilityBonusPercent: 10,
    actionType: 'complete_profile',
    category: 'perfil',
  });

  // Goal 2: Upload Videos
  const hasVideos = Boolean((candidate.videosList && candidate.videosList.length >= 2) || candidate.videoUrl);
  goals.push({
    id: 'goal_videos',
    title: 'Subir al menos 2 Videos de Jugadas',
    description: 'Los reclutadores priorizan un 400% más los perfiles con videos en vivo.',
    completed: hasVideos,
    visibilityBonusPercent: 15,
    actionType: 'upload_video',
    category: 'multimedia',
  });

  // Goal 3: Add Stats
  const hasStats = Boolean(candidate.stats && candidate.stats.matchesPlayed > 0);
  goals.push({
    id: 'goal_stats',
    title: 'Registrar Estadísticas de la Temporada',
    description: 'Ingresa partidos disputados, goles, asistencias o puntos del mes.',
    completed: hasStats,
    visibilityBonusPercent: 12,
    actionType: 'add_stats',
    category: 'actividad',
  });

  // Goal 4: Request References
  const hasReferences = (candidate.referencesCount || 0) >= 1;
  goals.push({
    id: 'goal_references',
    title: 'Solicitar Referencia a un Entrenador',
    description: 'Valida tu conducta profesional con el aval de un ex DT o Coordinador.',
    completed: hasReferences,
    visibilityBonusPercent: 10,
    actionType: 'request_reference',
    category: 'confianza',
  });

  // Goal 5: Get Verified
  const isVerified = Boolean(candidate.isVerified || candidate.verificationTier !== 'none');
  goals.push({
    id: 'goal_verification',
    title: 'Obtener Verificación Oficial de Identidad',
    description: 'Envía tu DNI o Licencia Oficial para activar la insignia de confianza en búsquedas.',
    completed: isVerified,
    visibilityBonusPercent: 20,
    actionType: 'get_verified',
    category: 'confianza',
  });

  // Goal 6: Response Activity
  const isActive = candidate.activityLevel === 'Muy Activo';
  goals.push({
    id: 'goal_activity',
    title: 'Mantener Respuesta Rápida a Mensajes',
    description: 'Responde los contactos de clubes en menos de 30 minutos.',
    completed: isActive,
    visibilityBonusPercent: 8,
    actionType: 'reply_messages',
    category: 'actividad',
  });

  return goals;
}

/**
 * FASE 5 - NOTIFICACIONES INTELIGENTES
 * Genera notificaciones personalizadas basadas en cambios de compatibilidad y actividad.
 */
export function generateSmartNotifications(
  candidate: Athlete,
  searches: ClubSearch[] = []
): SmartNotificationItem[] {
  const notifications: SmartNotificationItem[] = [];
  const inverseMatches = calculateInverseMatches(candidate, searches);
  const topMatch = inverseMatches[0];

  if (topMatch && topMatch.compatibilityScore >= 90) {
    notifications.push({
      id: `sn_match_${topMatch.searchId}`,
      userId: candidate.id,
      title: '¡Nueva búsqueda con 90%+ de Coincidencia!',
      message: `Tu compatibilidad con la convocatoria de ${topMatch.clubName} para ${topMatch.positionNeeded} es del ${topMatch.compatibilityScore}%.`,
      type: 'opportunity_alert',
      read: false,
      createdAt: new Date().toISOString(),
      badgeLabel: `${topMatch.compatibilityScore}% Match`,
      actionUrl: `/búsquedas?id=${topMatch.searchId}`,
    });
  }

  notifications.push({
    id: `sn_views_${candidate.id}`,
    userId: candidate.id,
    title: 'Aumento de Visibilidad Semanal',
    message: 'Tu perfil fue visitado 8 veces esta semana por scouts de Liga Profesional y Federal A.',
    type: 'profile_view',
    read: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    badgeLabel: '8 Visitas',
  });

  if (!candidate.videoUrl && (!candidate.videosList || candidate.videosList.length === 0)) {
    notifications.push({
      id: `sn_recommend_video_${candidate.id}`,
      userId: candidate.id,
      title: 'Recomendación IA: Subir Highlights',
      message: 'Subir un video corto de jugadas aumentará un +15% tus oportunidades de ser convocado.',
      type: 'recommendation',
      read: false,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      badgeLabel: '+15% Oportunidades',
    });
  }

  return notifications;
}

/**
 * FASE 5 - DASHBOARD EJECUTIVO
 * Genera métricas analíticas de empleabilidad, visibilidad, ranking y mapa geográfico.
 */
export function calculateExecutiveDashboardData(
  candidate: Athlete,
  searches: ClubSearch[] = []
): ExecutiveDashboardData {
  const goals = generateSmartGoals(candidate);
  const completedGoalsCount = goals.filter((g) => g.completed).length;
  const visibilityBonusTotal = goals
    .filter((g) => g.completed)
    .reduce((acc, curr) => acc + curr.visibilityBonusPercent, 0);

  const visibilityIndex = Math.min(100, 35 + visibilityBonusTotal + (candidate.trustScore || 70) * 0.2);
  const employabilityIndex = Math.min(100, Math.round(visibilityIndex * 0.85 + (candidate.rating || 4.5) * 4));

  return {
    employabilityIndex,
    visibilityIndex: Math.round(visibilityIndex),
    nationalRankCategory: `#${Math.max(1, 18 - completedGoalsCount * 3)} en ${candidate.position || 'Deportista'} (${candidate.province || 'Nacional'})`,
    monthlyProfileViews: 24 + completedGoalsCount * 12,
    monthlyDirectContacts: 5 + completedGoalsCount * 2,
    interviewConversionRate: 35,
    contractConversionRate: 18,
    monthlyViewsTrend: [
      { month: 'Mar', views: 12, contacts: 2 },
      { month: 'Abr', views: 18, contacts: 3 },
      { month: 'May', views: 28, contacts: 5 },
      { month: 'Jun', views: 36, contacts: 8 },
      { month: 'Jul', views: 48, contacts: 11 },
    ],
    geoOpportunitiesMap: [
      { province: 'Santiago del Estero', searchCount: 8, avgMatchPercent: 92 },
      { province: 'Tucumán', searchCount: 6, avgMatchPercent: 88 },
      { province: 'Córdoba', searchCount: 12, avgMatchPercent: 85 },
      { province: 'Buenos Aires', searchCount: 19, avgMatchPercent: 81 },
      { province: 'Santa Fe', searchCount: 7, avgMatchPercent: 78 },
    ],
  };
}

