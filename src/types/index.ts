export type UserRole = 'citizen' | 'official' | 'admin';

export type UserGender = 'Male' | 'Female' | 'Other';

export const OFFICIAL_DOMAINS = [
  'District Administration / Collectorate',
  'Land & Revenue Officer',
  'Town / Urban Planning Officer',
  'Rural Development Officer',
  'Infrastructure / PWD Officer',
  'Environment & Forest Officer',
  'Disaster Management Officer',
  'Agriculture & Rural Resources Officer',
  'GIS / Geospatial Officer',
  'Policy & Planning Officer',
  'Other',
] as const;

export type OfficialDomain = (typeof OFFICIAL_DOMAINS)[number];

export const GENDER_OPTIONS: UserGender[] = ['Male', 'Female', 'Other'];

export type Language = 'en' | 'hi' | 'gu';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gender?: UserGender | string;
  phone?: string;
  domain?: string;
  customDomain?: string;
  designation?: string;
  department?: string;
  jurisdiction?: string;
  district?: string;
  state?: string;
  address?: string;
  avatar?: string;
}

// ==================== Real-data provenance ====================
// Every dataset-backed record carries an explicit status so the UI never
// presents synthetic/provisional numbers as if they were measured facts.
export type DataStatus = 'REAL' | 'PROVISIONAL' | 'SYNTHETIC_SAMPLE';

// ==================== Cadastral parcels (real, synthetic-sample) ====================
// Source: ahmedabad_synthetic_cadastral.geojson - the dataset's own metadata
// self-labels this a "Synthetic sample cadastral grid for demo purposes -
// NOT real parcel boundaries or records", covering a ~4.4km x 3.3km sample
// zone near Bopal / S.P. Ring Road, Ahmedabad - not district-wide. We surface
// it as-is with that disclaimer attached, rather than inventing fields
// (slope, flood risk, road distance, cost, zoning status) the source never provides.
export type LandUseCategory =
  | 'Industrial'
  | 'Residential'
  | 'Forest/Protected'
  | 'Government Revenue Land'
  | 'Water Bodies'
  | 'Commercial'
  | 'Agriculture';

export type OwnershipType = 'Private' | 'Government' | 'Forest';

export type ParcelFilterType = LandUseCategory | 'All';

export interface Parcel {
  id: string;
  plotId: string;
  landUse: LandUseCategory;
  ownership: OwnershipType;
  areaAcres: number;
  areaSqMeters: number;
  coordinates: [number, number][]; // Polygon ring, [lat, lng]
  centerLat: number;
  centerLng: number;
  district: string;
  sampleZoneLabel: string; // e.g. "Bopal / S.P. Ring Road sample zone"
  dataStatus: DataStatus; // always 'SYNTHETIC_SAMPLE' for this layer
  disclaimer: string;
}

// ==================== Real infrastructure points ====================
// Source: ahmedabad_schools.geojson (4,111 real UDISE schools) +
// ahmedabad_processed_infra.json (7 provisional hospital/police/bus points,
// explicitly marked "Manually-curated placeholder seed list - NOT comprehensive").
export type InfrastructureAssetType = 'school' | 'hospital' | 'police' | 'bus_station' | 'fire_station' | 'amenity';

export interface InfrastructureAsset {
  id: string;
  name: string;
  type: InfrastructureAssetType;
  lat: number;
  lng: number;
  facilityClass?: string; // e.g. "Government", "Local body"
  category?: string; // school category, e.g. "Primary with Upper Primary"
  ruralUrban?: 'Rural' | 'Urban';
  village?: string;
  address?: string;
  beds?: number;
  operationalCondition: string; // passed through verbatim from source
  dataStatus: DataStatus;
}

export interface WardFeature {
  id: string;
  name: string;
  zone: string;
  wardNo?: number;
  geometry: any;
  centerLat?: number;
  centerLng?: number;
}

export interface EnvironmentalSummary {
  region: string;
  datasetRows: number;
  environmentalMetrics: {
    averageLandSurfaceTempCelsius: number;
    averageVegetationIndexNdvi: number;
    averageBuiltIntensityNdbi: number;
  };
  heatVulnerabilityBreakdown: {
    lowRiskZones: number;
    moderateRiskZones: number;
    highRiskZones: number;
  };
}

// Categories a citizen can file a grievance about - a UI taxonomy for
// user-submitted input, not a claim about measured infrastructure data.
export type GrievanceCategory =
  | 'Roads'
  | 'Water Supply'
  | 'Electricity'
  | 'Sanitation'
  | 'School'
  | 'Hospital'
  | 'Police'
  | 'Bus Stand'
  | 'Other';

export interface JurisdictionState {
  code: string;
  name: string;
  districts: {
    id: string;
    name: string;
    talukas: string[];
  }[];
}

// ==================== District metrics (real, mixed provenance) ====================
// Source: ahmedabad_socio_economic.json (Census 2011, REAL) and
// ahmedabad_deficit_indices.json (education block REAL from UDISE;
// healthcare/public-safety blocks explicitly PROVISIONAL in the source).
export interface DistrictMetrics {
  id: string;
  name: string;
  state: string;
  centerLat: number;
  centerLng: number;

  totalPopulation: number;
  urbanPopulation: number;
  ruralPopulation: number;
  ruralPopulationPercent: number;
  literacyRatePercent: number;
  sexRatio: number;
  scPopulationPercent: number;
  stPopulationPercent: number;
  marginalizedPopulationPercent: number; // SC + ST, computed
  areaSqKm: number;
  populationDensityPerSqKm: number;
  avgHouseholdSize: number;
  relativeDeprivationProxy0to100: number; // dataset-constructed index, see data_notes

  totalSchools: number;
  ruralSchools: number;
  urbanSchools: number;
  populationPerSchool: number;

  totalHospitals: number;
  populationPerHospital: number;
  totalPoliceStations: number;
  totalBusStations: number;
  populationPerPoliceStation: number;

  dataStatus: {
    socioEconomic: DataStatus;
    education: DataStatus;
    healthcare: DataStatus;
    publicSafetyTransit: DataStatus;
  };
  dataNotes: string[];
}

// ==================== Infrastructure siting (real-data-only model) ====================
// Reduced from the earlier 7-factor mock model to only what can be honestly
// computed from real fields: land suitability (area + ownership), accessibility
// (actual distance to the nearest real infrastructure point), and a
// district-level socio-economic equity weight from the real deprivation proxy.
export interface SuitabilityWeights {
  accessibility: number; // default 45
  landSuitability: number; // default 35
  socioEconomicEquity: number; // default 20
}

export interface CandidateSiteScore {
  siteId: string;
  parcelId: string;
  plotId: string;
  siteName: string;
  district: string;
  lat: number;
  lng: number;
  areaAcres: number;
  landUse: LandUseCategory;
  ownership: OwnershipType;

  compositeScore: number;
  rank: number;

  factors: {
    accessibilityScore: number;
    landSuitabilityScore: number;
    socioEconomicEquityScore: number;
  };

  weightedContributions: {
    accessibility: number;
    landSuitability: number;
    socioEconomicEquity: number;
  };

  nearestInfrastructure: {
    name: string;
    type: InfrastructureAssetType;
    distanceKm: number;
  } | null;

  justificationSummary: string;
  dataDisclaimer: string;
}

export type ReportSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type ReportStatus = 'Submitted' | 'Under Review' | 'Verified' | 'Assigned' | 'In Progress' | 'Resolved';

export interface CitizenReport {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenPhone?: string;
  category: GrievanceCategory;
  district: string;
  locationName: string;
  lat: number;
  lng: number;
  description: string;
  severity: ReportSeverity;
  status: ReportStatus;
  photoUrl?: string;
  submittedAt: string;
  updatedAt: string;
  assignedDepartment?: string;
  officialNotes?: string;
  resolutionTimelineDays?: number;
}

// ==================== Data quality audit (computed from real loaded data) ====================
export interface DataQualityAudit {
  overallQualityScore: number;
  totalRecordsLoaded: number;
  realRecordsCount: number;
  provisionalRecordsCount: number;
  syntheticSampleRecordsCount: number;
  schoolCoordinatesFlaggedForReview: number;
  lastComputedAt: string;
  sourceBreakdown: {
    source: string;
    dataStatus: DataStatus;
    recordCount: number;
    note: string;
  }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  entityType: 'Site Recommendation' | 'Weight Adjustment' | 'Citizen Grievance' | 'Dataset Ingestion' | 'Land Registry';
  entityId: string;
  district?: string;
}

export interface AskGlisQuery {
  question: string;
  districtContext?: string;
}

export interface AskGlisResponse {
  answer: string;
  confidence: number;
  suggestedAction?: string;
}

export interface OfficerProject {
  id: string;
  name: string;
  category: string;
  district: string;
  status: 'In Progress' | 'Under Review' | 'Tendering' | 'Completed' | 'Delayed';
  progressPercentage: number;
  allocatedBudgetCr: number;
  startDate: string;
  targetCompletion: string;
  priority: 'High' | 'Critical' | 'Medium';
}

// ==================== Redevelopment candidates ====================
// Replaces the old fictional "dead capital" drift/NDVI/dormancy explorer,
// which had zero backing in either dataset. This is a plain, honest filter
// over the real (synthetic-sample-labeled) cadastral parcels for
// Government/Forest-owned land that isn't already built up - no fabricated
// encroachment, drift, or valuation metrics.
export interface RedevelopmentCandidate {
  id: string;
  plotId: string;
  landUse: LandUseCategory;
  ownership: OwnershipType;
  areaAcres: number;
  centerLat: number;
  centerLng: number;
  sampleZoneLabel: string;
  rationale: string;
  dataStatus: DataStatus;
}

// ==================== Urban Planning ====================
// Reworked to only use real fields (land_use x ownership), since the old
// zoneType/restrictionLevel fields never existed in real cadastral data -
// there was never a "planned zone vs actual use" comparison to make.
export interface LandUseOwnershipAnomaly {
  parcelId: string;
  plotId: string;
  district: string;
  landUse: LandUseCategory;
  ownership: OwnershipType;
  areaAcres: number;
  anomalyType: string;
  severity: 'High' | 'Moderate';
  description: string;
  recommendedAction: string;
}

export interface SampleZoneLandUseComposition {
  district: string;
  sampleZoneLabel: string;
  totalParcels: number;
  totalAreaAcres: number;
  breakdown: { landUse: LandUseCategory; parcelCount: number; areaAcres: number; percentOfSample: number }[];
}

export interface UrbanExpansionIndex {
  district: string;
  populationDensityPerSqKm: number;
  urbanPopulationPercent: number;
  expansionPressureScore: number;
  pressureLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  recommendedAction: string;
  narrative: string;
}

// ==================== Environmental Conservation ====================
// Reworked to drop the fabricated environmentalSensitivity/floodRisk scores
// (never sourced per the dataset README) and rely only on real land_use and
// ownership category combinations.
export interface EcologicalParcelEntry {
  parcelId: string;
  plotId: string;
  district: string;
  landUse: LandUseCategory;
  ownership: OwnershipType;
  areaAcres: number;
  concernLevel: 'High' | 'Moderate' | 'Low';
  narrative: string;
}

export interface ProtectedAreaEntry {
  parcelId: string;
  plotId: string;
  district: string;
  landUse: LandUseCategory;
  ownership: OwnershipType;
  areaAcres: number;
  protectionBasis: string;
}

// ==================== Land Management & Governance ====================
// The old per-parcel "encroachment risk" score is dropped entirely - the
// real cadastral data has no dispute/verification/occupancy field to score
// from. Replaced with a plain government/forest land registry (real, unscored)
// and a single real district-level equity statement.
export interface GovernmentLandRegistryEntry {
  parcelId: string;
  plotId: string;
  district: string;
  landUse: LandUseCategory;
  ownership: OwnershipType;
  areaAcres: number;
  centerLat: number;
  centerLng: number;
}

export interface DistrictEquityStatement {
  district: string;
  sampleZoneGovernmentLandPercent: number;
  relativeDeprivationProxy0to100: number;
  classification: 'High Need, Limited Sample-Zone Government Land' | 'High Need, Notable Sample-Zone Government Land' | 'Lower Need';
  narrative: string;
  scopeCaveat: string;
}

// ==================== National scope (glis_india_dataset) ====================
// Real government-sourced state/national land-utilization statistics
// (from the mainpagedatasets CSVs) and real Survey-of-India-derived
// assembly-constituency boundaries (groupable by district). The per-state
// Datasets/*.csv files in the source dataset are excluded entirely - they
// were found to be fabricated filler data (identical shuffled numbers
// reused across every state file).
export interface LandUtilizationRecord {
  scope: string; // 'India' or a state name
  year: string;
  reportingAreaThousandHa: number;
  forestsThousandHa: number;
  notAvailableForCultivationThousandHa: number;
  permanentPasturesThousandHa: number;
  miscTreeCropsThousandHa: number;
  culturableWasteThousandHa: number;
  fallowOtherThousandHa: number;
  currentFallowsThousandHa: number;
  netAreaSownThousandHa: number;
  totalCroppedAreaThousandHa: number;
  areaSownMoreThanOnceThousandHa: number;
}

export interface IndiaStateGeographyInfo {
  state: string;
  schema: 'constituency-level' | 'state-boundary-only';
  districtCount: number;
  featureCount: number;
}
