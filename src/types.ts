export type SportType =
  | 'Fútbol'
  | 'Básquet'
  | 'Vóley'
  | 'Rugby'
  | 'Hockey'
  | 'Tenis'
  | 'Pádel'
  | 'Atletismo'
  | 'Handbol';

export type UserRole = 'athlete' | 'club' | 'scout' | 'admin';

export type ProfessionalCategory =
  | 'Deportista'
  | 'Director Técnico'
  | 'Ayudante de Campo'
  | 'Preparador Físico'
  | 'Entrenador de Arqueros'
  | 'Analista de Video'
  | 'Scout'
  | 'Kinesiólogo'
  | 'Fisioterapeuta'
  | 'Médico Deportivo'
  | 'Nutricionista Deportivo'
  | 'Psicólogo Deportivo'
  | 'Utilero'
  | 'Masajista'
  | 'Coordinador Deportivo'
  | 'Director Deportivo'
  | 'Manager'
  | 'Secretario Deportivo';

export interface WorkExperienceItem {
  clubOrInstitution: string;
  role: string;
  period: string; // e.g., "2021 - 2024"
  achievements?: string;
}

export type AthleteLevel = 'Amateur' | 'Liga Local / Regional' | 'Semiprofesional' | 'Profesional';

export type ApplicationStatus = 'Pendiente' | 'Preseleccionado' | 'Citado a Prueba' | 'Descartado';

export interface AthleteStats {
  matchesPlayed: number;
  goalsOrPoints: number;
  assists?: number;
  minutesPlayed?: number;
  achievements: string[];
}

export interface AthleteVideo {
  title: string;
  url: string;
  thumbnail?: string;
}

export interface Athlete {
  id: string;
  name: string;
  avatar: string;
  category?: ProfessionalCategory;
  sport: SportType;
  position: string;
  age: number;
  heightCm?: number;
  weightKg?: number;
  city: string;
  province: string;
  level: AthleteLevel;
  preferredFootOrHand?: string; // e.g., 'Zurdo / Izquierda', 'Diestro / Derecha', 'Ambidiestro'
  bio: string;
  sportsExperience?: string; // Experiencia y trayectoria deportiva detallada
  certificationsAndLicenses?: string[]; // Licencias y Certificaciones (e.g., CONMEBOL PRO, Titulo Univ)
  yearsExperience?: number;
  availability?: 'Inmediata' | 'A convenir' | 'Con contrato vigente';
  willingToRelocate?: boolean;
  workHistory?: WorkExperienceItem[];
  galleryPhotos?: string[]; // Colección de fotos de partidos y entrenamientos
  videosList?: AthleteVideo[]; // Múltiples videos de jugadas e hitos
  videoUrl?: string;
  videoThumbnail?: string;
  stats?: AthleteStats;
  availableForTrials: boolean;
  isPremium: boolean;
  isVerified: boolean;
  verificationTier?: VerificationTier;
  trustScore?: number; // 0 - 100%
  activityLevel?: 'Muy Activo' | 'Moderado' | 'Ocasional';
  avgResponseMinutes?: number;
  contactEmail: string;
  contactPhone: string;
  rating: number; // 1-5
  ratingBreakdown?: {
    punctuality: number;
    professionalism: number;
    experienceQuality: number;
    communication: number;
    totalCount: number;
  };
  referencesCount?: number;
  isSuspended?: boolean;
  isBanned?: boolean;
}

export interface ClubSearch {
  id: string;
  clubName: string;
  clubLogo: string;
  title: string;
  sport: SportType;
  categoryNeeded?: ProfessionalCategory;
  positionNeeded: string;
  minAge: number;
  maxAge: number;
  city: string;
  province: string;
  levelRequired: AthleteLevel;
  trialDate: string; // YYYY-MM-DD or formatted date
  trialTime: string;
  locationDetails: string;
  description: string;
  requirements: string[];
  salaryOrRemuneration?: string;
  isFeatured: boolean;
  postedAt: string;
  applicantCount: number;
  status: 'Abierta' | 'Cerrada' | 'En Pruebas';
}

export interface SearchApplication {
  id: string;
  searchId: string;
  athleteId: string;
  appliedAt: string;
  status: ApplicationStatus;
  noteFromAthlete?: string;
  matchScore?: number;
  matchReason?: string;
}

export interface ScoutAiWeights {
  positionWeight: number;    // e.g. 20%
  categoryAndLevelWeight: number; // e.g. 15%
  locationAndRelocationWeight: number; // e.g. 15%
  verificationAndTrustWeight: number;  // e.g. 15%
  experienceAndHistoryWeight: number;  // e.g. 15%
  statsAndMediaWeight: number;        // e.g. 10%
  ratingAndReputationWeight: number;  // e.g. 10%
}

export interface ScoutMatchBreakdown {
  athleteId: string;
  score: number; // 0 - 100
  starRating: string; // e.g. "★★★★★"
  pros: string[]; // e.g. ["✓ Posición exacta", "✓ Edad ideal (19 años)"]
  cons: string[]; // e.g. ["✗ No posee Licencia CONMEBOL"]
  factorScores: {
    positionScore: number;
    categoryLevelScore: number;
    locationScore: number;
    verificationScore: number;
    experienceScore: number;
    statsMediaScore: number;
    reputationScore: number;
  };
  tacticalAnalysis: string;
  recommendedRole: string;
}

export interface TalentRadarRule {
  id: string;
  clubId: string;
  clubName: string;
  title: string;
  sport: SportType;
  categoryNeeded?: ProfessionalCategory;
  positionNeeded: string;
  minAge: number;
  maxAge: number;
  province?: string;
  city?: string;
  minLevel?: AthleteLevel;
  minTrustScore?: number;
  active: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  createdAt: string;
  lastAlertAt?: string;
  matchesCount?: number;
}

export interface ClubDecisionFeedback {
  id: string;
  clubId: string;
  athleteId: string;
  actionType: 'favorite' | 'invite' | 'hire' | 'reject';
  category: string;
  age: number;
  province: string;
  level: string;
  trustScore: number;
  timestamp: string;
}

export interface CandidateComparisonResult {
  candidateIds: string[];
  aiStrategicConclusion: string;
  recommendedSelectionId: string;
  summaryByCandidate: Record<string, {
    strengths: string[];
    weaknesses: string[];
    fitRating: string;
    idealRole: string;
  }>;
}

export interface AIScoutMatch {
  athleteId: string;
  score: number; // 0 - 100
  starRating?: string;
  keyReasons: string[];
  pros?: string[];
  cons?: string[];
  tacticalAnalysis: string;
  recommendedRole: string;
}

export interface AIScoutReport {
  athleteId: string;
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  suggestedLevel: string;
  overallRating: number;
  keyStatsAnalysis: string;
}

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  target: 'athlete' | 'club';
  priceMonthly: string;
  priceYearly: string;
  popular?: boolean;
  features: PlanFeature[];
}

export type PaymentMethodType = 'mercadopago' | 'card' | 'cbu' | 'crypto';

export type FreeTeamCategory =
  | 'Escuela de Fútbol Infantil / Juvenil'
  | 'Club Deportivo (Profesional / Semiprofesional / Barrio)'
  | 'Academia de Formación Deportiva'
  | 'Club / Escuela de Fútbol Femenino'
  | 'Complejo / Predio Deportivo Institucional';

export interface FreeTeamProfile {
  id: string;
  name: string;
  category: FreeTeamCategory;
  sport: SportType;
  logoUrl: string;
  city: string;
  province: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  schedule?: string;
  contactWhatsApp: string;
  contactInstagram?: string;
  lookingForPlayers: boolean;
  lookingForFriendlies: boolean;
  isFreeListing: boolean;
  isVerified: boolean;
  createdAt: string;
  memberCount?: number;
}

export interface TransactionReceipt {
  id: string;
  planId: string;
  planName: string;
  amount: string;
  currency: string;
  date: string;
  paymentMethod: PaymentMethodType;
  lastFourDigits?: string;
  status: 'Approved' | 'Pending';
  transactionHash: string;
  pciToken: string;
  buyerName: string;
  buyerTaxId: string;
  securitySeal: string;
}

export interface PromoCoupon {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  expirationDate: string;
  applicableSports?: SportType[];
  allowedUserEmails?: string[];
  active: boolean;
  createdAt: string;
}

export interface FeaturedBoost {
  id: string;
  targetType: 'search' | 'athlete_profile';
  targetId: string;
  targetTitle: string;
  userId: string;
  userEmail: string;
  durationDays: 7 | 15 | 30;
  amount: string;
  activatedAt: string;
  expiresAt: string;
  active: boolean;
  paymentId: string;
}

export interface FinancialDashboardStats {
  dailyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  activeSubscriptions: number;
  newSubscriptionsThisMonth: number;
  cancelledSubscriptionsThisMonth: number;
  renewalsThisMonth: number;
  featuredBoostsSold: number;
  couponsRedeemed: number;
  revenueByProduct: {
    atletaPro: number;
    clubPro: number;
    featuredBoosts: number;
  };
  userConversion: {
    totalUsers: number;
    freeUsers: number;
    proUsers: number;
    conversionRate: string;
    avgTimeToConvertDays: number;
    arpu: string;
  };
}

// ==========================================
// FUTURE EXPANSION ARCHITECTURE (PHASE 2+)
// ==========================================

export interface SportsAdCampaign {
  id: string;
  advertiserName: string;
  bannerUrl: string;
  targetSport?: SportType;
  targetProvince?: string;
  clickUrl: string;
  impressionsCount: number;
  clicksCount: number;
  status: 'Draft' | 'Active' | 'Paused' | 'Expired';
}

export interface MarketplaceProduct {
  id: string;
  sellerId: string;
  title: string;
  category: 'Calzado' | 'Equipamiento' | 'Nutrición' | 'Indumentaria';
  price: number;
  imageUrl: string;
  stock: number;
  active: boolean;
}

export interface LeagueFederationLicense {
  id: string;
  organizationName: string;
  officialRegion: string;
  assignedAdmins: string[];
  clubsAffiliatedCount: number;
  validUntil: string;
  status: 'Active' | 'Pending' | 'Expired';
}

export interface SponsorshipPackage {
  id: string;
  sponsorBrand: string;
  sponsoredEventId?: string;
  sponsorshipTier: 'Bronze' | 'Silver' | 'Gold' | 'Official Partner';
  amountContracted: number;
  contractEndsAt: string;
}

export interface UserGrowthProfile {
  referralCode: string;
  referredByCode?: string;
  totalReferrals: number;
  successfulConversions: number;
  points: number;
  currentLevel: 'Novato' | 'Promesa' | 'Profesional' | 'Élite Scout';
  achievements: {
    id: string;
    title: string;
    description: string;
    badgeIcon: string;
    unlocked: boolean;
    unlockedAt?: string;
    pointsBonus: number;
  }[];
  profileCompletionPercent: number;
  unlockedRewards: string[];
}

export interface FunnelStep {
  stepName: string;
  count: number;
  percentageOfTotal: number;
  dropOffRate: number;
}

export interface GrowthMetrics {
  dau: number;
  mau: number;
  retentionDay1: number;
  retentionDay7: number;
  retentionDay30: number;
  cacArs: number;
  arpuArs: number;
  ltvArs: number;
  viralCoefficientK: number;
  conversionFunnel: FunnelStep[];
  activeReengagementCampaigns: {
    id: string;
    title: string;
    targetSegment: string;
    channel: 'WhatsApp' | 'Email' | 'In-App Push';
    sentCount: number;
    conversionRate: number;
    status: 'Active' | 'Paused';
  }[];
}

export interface Tournament {
  id: string;
  title: string;
  organizerName: string;
  sport: SportType;
  category: string;
  province: string;
  city: string;
  venueName: string;
  startDate: string;
  endDate?: string;
  description: string;
  prizes?: string;
  registrationFee?: string;
  registrationLink?: string;
  contactWhatsApp?: string;
  contactInstagram?: string;
  contactEmail?: string;
  bannerImage?: string;
  isVerifiedOrganizer?: boolean;
  createdAt: string;
  status: 'Inscripciones Abiertas' | 'En Cierre' | 'Finalizado';
}

// ==========================================
// FASE 3: SISTEMA DE CONFIANZA Y TRUST & SAFETY
// ==========================================

export type VerificationTier =
  | 'none'          // Perfil sin verificar
  | 'identity'      // Verificación de Identidad (DNI / Cédula)
  | 'documental'    // Verificación Documental (Títulos, Licencias CONMEBOL/AFA, Matrículas)
  | 'professional'  // Verificación Profesional (Validación de Clubes / Ligas Oficiales)
  | 'featured';     // Perfil Destacado / Insignia Oficial PRO

export interface VerificationRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole | string;
  category: ProfessionalCategory;
  requestedTier: VerificationTier;
  dniNumber?: string;
  dniDocumentUrl?: string;
  professionalLicenseNumber?: string; // CONMEBOL, AFA, Matrícula
  licenseDocumentUrl?: string;
  institutionConfirmationLetterUrl?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface UserRatingReview {
  id: string;
  targetUserId: string;
  authorUserId: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  authorVerified: boolean;
  punctualityScore: number;       // 1 - 5
  professionalismScore: number;   // 1 - 5
  experienceQualityScore: number; // 1 - 5
  communicationScore: number;     // 1 - 5
  averageScore: number;           // 1 - 5
  comment: string;
  interactionType: 'trial' | 'application' | 'contract' | 'chat';
  interactionConfirmed: boolean;  // Solo interacciones reales confirmadas
  createdAt: string;
}

export interface VerifiedReference {
  id: string;
  targetUserId: string;
  refereeName: string;
  refereeRole: string;        // e.g. "DT Reserva River Plate"
  refereeInstitution: string; // e.g. "C.A. River Plate"
  relationship: string;       // e.g. "Entrenador principal 2022-2023"
  quote: string;
  contactEmailOrPhone?: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface CareerTimelineEntry {
  id: string;
  userId: string;
  institutionName: string;    // Club / Sanatorio / Universidad
  roleOrPosition: string;     // Posición / Puesto
  startYear: number;
  endYear?: number | 'Presente';
  divisionOrTournament?: string; // e.g. "Primera B Nacional", "Liga Cordobesa"
  achievements: string[];     // e.g. ["Campeón Anual", "Ascenso a LPF"]
  verifiedByClub?: boolean;
  verificationSource?: string;
}

export interface FraudAlert {
  id: string;
  targetUserId?: string;
  targetUserName?: string;
  targetSearchId?: string;
  alertType:
    | 'duplicate_profile'
    | 'reused_documentation'
    | 'suspicious_bulk_messages'
    | 'fake_trial_scam'
    | 'spam_behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidenceDetails: string;
  detectedAt: string;
  status: 'active' | 'investigating' | 'resolved' | 'dismissed';
  autoFlagged: boolean;
}

export interface UserReport {
  id: string;
  reporterUserId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: 'fake_identity' | 'spam' | 'harassment' | 'payment_fraud' | 'false_credentials' | 'other';
  description: string;
  status: 'pending' | 'investigating' | 'actioned' | 'dismissed';
  createdAt: string;
  resolutionNotes?: string;
}

export interface ModerationAuditLog {
  id: string;
  adminUserId: string;
  adminEmail: string;
  actionType:
    | 'approve_verification'
    | 'reject_verification'
    | 'suspend_user'
    | 'ban_user'
    | 'unban_user'
    | 'resolve_fraud'
    | 'resolve_report'
    | 'review_appeal';
  targetUserId: string;
  targetUserName?: string;
  reason: string;
  timestamp: string;
}

export interface AccountAppeal {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  appealMessage: string;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  resolutionNotes?: string;
}

export interface TrustProfileMetrics {
  trustScore: number; // 0 - 100%
  verificationTier: VerificationTier;
  activityLevel: 'Muy Activo' | 'Moderado' | 'Ocasional';
  avgResponseMinutes: number;
  memberSince: string;
  verifiedReferencesCount: number;
  totalReviewsCount: number;
  avgRating: number;
  hasIdentityVerified: boolean;
  hasDocumentVerified: boolean;
  hasProfessionalVerified: boolean;
}

// ==========================================
// FASE 5: DESCUBRIMIENTO INTELIGENTE Y IA
// ==========================================

export interface InverseMatchOpportunity {
  id: string;
  searchId: string;
  searchTitle: string;
  clubName: string;
  clubLogo: string;
  sport: SportType;
  categoryNeeded?: ProfessionalCategory;
  positionNeeded: string;
  city: string;
  province: string;
  compatibilityScore: number; // 0 - 100%
  starRating: string;
  matchReasons: string[];
  tacticalAnalysis: string;
  foundAt: string;
  status: 'new' | 'viewed' | 'applied' | 'ignored';
}

export interface AutoApplicationSetting {
  enabled: boolean;
  minMatchScoreThreshold: number; // e.g. 95%
  maxMonthlyApplications: number;
  notifyOnApply: boolean;
  history: {
    id: string;
    searchId: string;
    searchTitle: string;
    clubName: string;
    matchScore: number;
    appliedAt: string;
  }[];
}

export interface SmartNotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'match_boost' | 'profile_view' | 'opportunity_alert' | 'smart_goal' | 'recommendation';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  badgeLabel?: string;
}

export interface PredictiveSuccessModel {
  convocationProbability: number; // 0 - 100%
  hiringProbability: number;      // 0 - 100%
  expectedInterestLevel: 'Muy Alto' | 'Alto' | 'Moderado' | 'En Crecimiento';
  superiorCategoryFit: string;    // e.g. "Listo para Federal A / LPF"
  churnOrAbandonmentRisk: 'Bajo' | 'Medio' | 'Atención Requerida';
  growthVelocityScore: number;    // 0 - 100
  explanations: string[];
}

export interface SmartGoalItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  visibilityBonusPercent: number; // e.g. +15%
  actionType: 'complete_profile' | 'upload_video' | 'add_stats' | 'request_reference' | 'get_verified' | 'reply_messages';
  category: 'perfil' | 'multimedia' | 'confianza' | 'actividad';
}

export interface AiCoachChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  structuredFeedback?: {
    strengths: string[];
    weaknesses: string[];
    competitiveLevel: string;
    hiringProbability: number;
    priorityActions: string[];
  };
}

export interface ExecutiveDashboardData {
  employabilityIndex: number;  // 0 - 100%
  visibilityIndex: number;     // 0 - 100%
  nationalRankCategory: string; // e.g. "#12 en Delanteros NOA"
  monthlyProfileViews: number;
  monthlyDirectContacts: number;
  interviewConversionRate: number; // e.g. 32%
  contractConversionRate: number;  // e.g. 18%
  monthlyViewsTrend: { month: string; views: number; contacts: number }[];
  geoOpportunitiesMap: { province: string; searchCount: number; avgMatchPercent: number }[];
}





