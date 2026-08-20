import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  AHMEDABAD_DISTRICT,
  AHMEDABAD_TALUKAS,
  AHMEDABAD_WARDS_GEOJSON,
  ALL_INFRASTRUCTURE,
  DATA_QUALITY_AUDIT,
  ENVIRONMENTAL_SUMMARY,
  NATIONAL_LAND_UTILIZATION,
  OFFICIAL_LULC_WASTELAND,
  PARCELS,
  PROTECTED_FORESTS_GEOJSON,
  PROXIMITY_LAYERS,
  REAL_AMENITIES,
  REAL_BUS_STATIONS,
  REAL_HOSPITALS,
  SCHOOLS,
  STATEWISE_LAND_UTILIZATION,
  WATER_AND_BUSES_GEOJSON,
  getStateBoundaryGeoJson,
  getStateDistrictList,
  getStateGeographyInfo,
  listIndiaStates,
} from './src/services/dataLoader';
import { AUDIT_LOGS, CITIZEN_REPORTS, DEMO_USERS } from './src/data/seedData';
import { calculateCandidateSiteScores, DEFAULT_WEIGHTS } from './src/services/scoringEngine';
import { explainSiteRecommendation, queryAskGlis } from './src/services/geminiService';
import { calculateLandUseComposition, calculateUrbanExpansionIndex, detectLandUseOwnershipAnomalies } from './src/services/zoningEngine';
import { getEcologicalParcels, getProtectedAreaRegistry } from './src/services/conservationEngine';
import { calculateDistrictEquityStatement, getGovernmentLandRegistry, getRedevelopmentCandidates } from './src/services/governanceEngine';
import { haversineDistanceKm } from './src/services/geoUtils';
import { CitizenReport, OfficerProject, SuitabilityWeights, User } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // In-memory mutable state. Geospatial/statistical data comes from the real
  // datasets loaded in dataLoader.ts; only user accounts, citizen grievances,
  // and audit logs are runtime app state that legitimately starts small/empty.
  let users: User[] = [...DEMO_USERS];
  let citizenReports: CitizenReport[] = [...CITIZEN_REPORTS];
  let auditLogs = [...AUDIT_LOGS];
  let officerProjects: OfficerProject[] = [];
  let currentWeights: SuitabilityWeights = { ...DEFAULT_WEIGHTS };

  const logAction = (entry: Omit<(typeof auditLogs)[number], 'id' | 'timestamp'>) => {
    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      ...entry,
    });
  };

  // ================= HEALTH =================
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      platform: 'Bhoo Drishti / GLIS Geospatial Intelligence Platform',
      version: '2.0.0',
      dataSources: {
        ahmedabadParcels: `${PARCELS.length} (synthetic sample zone)`,
        ahmedabadInfrastructure: `${ALL_INFRASTRUCTURE.length} (${ALL_INFRASTRUCTURE.filter((a) => a.dataStatus === 'REAL').length} real, ${ALL_INFRASTRUCTURE.filter((a) => a.dataStatus === 'PROVISIONAL').length} provisional)`,
        indiaStatesLoaded: listIndiaStates().length,
      },
    });
  });

  // ================= AUTH =================
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, password, confirmPassword, role, phone, gender, domain, customDomain, address, state, district } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Full Name is required.' });
    if (!email || !email.trim()) return res.status(400).json({ success: false, error: 'Email address is required.' });
    if (!password) return res.status(400).json({ success: false, error: 'Password is required.' });
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match. Please re-enter identical passwords.' });
    }
    if (phone && phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit phone number.' });
    }

    const assignedRole = role === 'official' ? 'official' : 'citizen';
    let resolvedDomain = domain;
    if (assignedRole === 'official') {
      if (!domain) resolvedDomain = 'District Administration / Collectorate';
      else if (domain === 'Other') {
        if (!customDomain || !customDomain.trim()) {
          return res.status(400).json({ success: false, error: 'Please specify your official domain / designation.' });
        }
        resolvedDomain = customDomain.trim();
      }
    }

    const validGender = ['Male', 'Female', 'Other'].includes(gender) ? gender : 'Other';

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: assignedRole,
      phone: phone?.trim() || '+91 98765 43210',
      gender: validGender,
      domain: assignedRole === 'official' ? resolvedDomain : undefined,
      customDomain: assignedRole === 'official' && domain === 'Other' ? customDomain?.trim() : undefined,
      designation: assignedRole === 'official' ? resolvedDomain : undefined,
      department: assignedRole === 'official' ? `${resolvedDomain} Division` : undefined,
      jurisdiction: assignedRole === 'official' ? `${district || 'Ahmedabad'} District & State Jurisdiction` : undefined,
      address: address || '',
      state: state || 'Gujarat',
      district: district || 'Ahmedabad',
    };

    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existingIndex >= 0) users[existingIndex] = { ...users[existingIndex], ...newUser };
    else users.push(newUser);

    logAction({
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: `${assignedRole === 'official' ? 'Official' : 'Citizen'} Account Registered`,
      details: `New ${assignedRole} account created for ${newUser.name} (${newUser.gender}, Domain: ${newUser.domain || 'Resident'}) in ${newUser.state}.`,
      entityType: 'Citizen Grievance',
      entityId: newUser.id,
      district: newUser.district || 'State Level',
    });

    res.json({ success: true, message: 'Account created successfully.', user: newUser, token: `bhoo-jwt-${newUser.id}-${Date.now()}` });
  });

  app.post('/api/auth/official/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Official email and password are required.' });

    const cleanEmail = email.trim().toLowerCase();
    let officialUser = users.find((u) => u.email.toLowerCase() === cleanEmail && u.role === 'official');
    if (!officialUser) {
      officialUser = {
        id: `usr-off-${Date.now()}`,
        name: cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ', IAS',
        email: cleanEmail,
        role: 'official',
        designation: 'District Development Officer (DDO)',
        department: 'Urban Development & Infrastructure Board',
        jurisdiction: 'Ahmedabad District',
        district: 'Ahmedabad',
        state: 'Gujarat',
        phone: '+91 98765 43210',
      };
      users.push(officialUser);
    }

    logAction({
      userId: officialUser.id,
      userName: officialUser.name,
      userRole: 'official',
      action: 'Official Sign-In',
      details: `Official ${officialUser.name} signed in successfully.`,
      entityType: 'Site Recommendation',
      entityId: officialUser.id,
      district: officialUser.district,
    });

    res.json({ success: true, message: 'Official authentication successful.', user: officialUser, token: `bhoo-official-jwt-${officialUser.id}-${Date.now()}` });
  });

  app.post('/api/auth/citizen/login', (req: Request, res: Response) => {
    const { email, password, address, state } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required.' });

    const cleanEmail = email.trim().toLowerCase();
    let citizenUser = users.find((u) => u.email.toLowerCase() === cleanEmail && u.role === 'citizen');
    if (!citizenUser) {
      citizenUser = {
        id: `usr-cit-${Date.now()}`,
        name: cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: cleanEmail,
        role: 'citizen',
        address: address || 'Resident Address',
        state: state || 'Gujarat',
        district: 'Ahmedabad',
        phone: '+91 98111 22334',
      };
      users.push(citizenUser);
    } else {
      if (address) citizenUser.address = address;
      if (state) citizenUser.state = state;
    }

    logAction({
      userId: citizenUser.id,
      userName: citizenUser.name,
      userRole: 'citizen',
      action: 'Citizen Portal Sign-In',
      details: `Citizen ${citizenUser.name} authenticated with registered state: ${citizenUser.state}.`,
      entityType: 'Citizen Grievance',
      entityId: citizenUser.id,
      district: citizenUser.district,
    });

    res.json({ success: true, message: 'Citizen authenticated successfully.', user: citizenUser, token: `bhoo-citizen-jwt-${citizenUser.id}-${Date.now()}` });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, role } = req.body;
    let foundUser = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!foundUser) foundUser = users.find((u) => u.role === (role || 'official')) || users[0];
    res.json({ success: true, user: foundUser, token: `glis-jwt-${foundUser.id}-${Date.now()}` });
  });

  // ================= USERS (real, in-memory registered accounts) =================
  app.get('/api/users', (req: Request, res: Response) => {
    res.json({ success: true, count: users.length, users });
  });

  // ================= JURISDICTION (real) =================
  app.get('/api/jurisdiction/states', (req: Request, res: Response) => {
    const states = listIndiaStates().map((state) => {
      const info = getStateGeographyInfo(state);
      return {
        name: state,
        hasRealDistrictStats: state === 'Gujarat',
        geographySchema: info?.schema || 'unknown',
      };
    });
    res.json({ success: true, count: states.length, states });
  });

  app.get('/api/jurisdiction/districts', (req: Request, res: Response) => {
    const { state } = req.query;
    const stateName = String(state || 'Gujarat');
    if (stateName.toLowerCase() === 'gujarat') {
      return res.json({ success: true, state: stateName, districts: ['Ahmedabad'], note: 'Real district-level statistics currently only exist for Ahmedabad district.' });
    }
    const districts = getStateDistrictList(stateName);
    res.json({ success: true, state: stateName, districts });
  });

  app.get('/api/jurisdiction/talukas', (req: Request, res: Response) => {
    res.json({ success: true, district: 'Ahmedabad', count: AHMEDABAD_TALUKAS.length, talukas: AHMEDABAD_TALUKAS });
  });

  // ================= DISTRICTS (real, Ahmedabad only) =================
  app.get('/api/districts', (req: Request, res: Response) => {
    res.json({ success: true, districts: [AHMEDABAD_DISTRICT] });
  });

  app.get('/api/districts/:id', (req: Request, res: Response) => {
    if (req.params.id !== AHMEDABAD_DISTRICT.id) {
      return res.status(404).json({ success: false, error: 'District not found. Real district-level data currently only exists for Ahmedabad.' });
    }
    res.json({ success: true, district: AHMEDABAD_DISTRICT });
  });

  // ================= PARCELS (real geometry pattern, synthetic-sample-labeled) =================
  app.get('/api/parcels', (req: Request, res: Response) => {
    const { landUse, ownership } = req.query;
    let list = [...PARCELS];
    if (landUse && String(landUse).toLowerCase() !== 'all') {
      list = list.filter((p) => p.landUse.toLowerCase() === String(landUse).toLowerCase());
    }
    if (ownership && String(ownership).toLowerCase() !== 'all') {
      list = list.filter((p) => p.ownership.toLowerCase() === String(ownership).toLowerCase());
    }
    res.json({
      success: true,
      count: list.length,
      totalAcres: Number(list.reduce((acc, p) => acc + p.areaAcres, 0).toFixed(1)),
      sampleZoneLabel: PARCELS[0]?.sampleZoneLabel,
      parcels: list,
    });
  });

  app.get('/api/parcels/stats', (req: Request, res: Response) => {
    res.json({ success: true, composition: calculateLandUseComposition(PARCELS) });
  });

  app.get('/api/parcels/locate/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const target = PARCELS.find((p) => p.id === id || p.plotId === id);
    if (!target) return res.status(404).json({ success: false, error: 'Parcel not found' });
    res.json({
      success: true,
      parcel: target,
      center: [target.centerLat, target.centerLng],
      coordinates: target.coordinates,
      suggestedZoom: 17,
    });
  });

  // ================= INFRASTRUCTURE (real schools + provisional hospital/police/bus) =================
  app.get('/api/infrastructure', (req: Request, res: Response) => {
    const { type } = req.query;
    let list = [...ALL_INFRASTRUCTURE];
    if (type && String(type).toLowerCase() !== 'all') {
      list = list.filter((a) => a.type === String(type).toLowerCase());
    }
    res.json({
      success: true,
      count: list.length,
      realCount: list.filter((a) => a.dataStatus === 'REAL').length,
      provisionalCount: list.filter((a) => a.dataStatus === 'PROVISIONAL').length,
      assets: list,
    });
  });

  app.get('/api/proximity-layers', (req: Request, res: Response) => {
    res.json({ success: true, geojson: PROXIMITY_LAYERS });
  });

  // ================= INTEGRATED REAL DATASET LAYERS =================
  app.get('/api/wards', (req: Request, res: Response) => {
    res.json({ success: true, count: AHMEDABAD_WARDS_GEOJSON.features?.length || 0, geojson: AHMEDABAD_WARDS_GEOJSON });
  });

  app.get('/api/protected-forests', (req: Request, res: Response) => {
    res.json({ success: true, count: PROTECTED_FORESTS_GEOJSON.features?.length || 0, geojson: PROTECTED_FORESTS_GEOJSON });
  });

  app.get('/api/water-bodies', (req: Request, res: Response) => {
    res.json({ success: true, count: WATER_AND_BUSES_GEOJSON.features?.length || 0, geojson: WATER_AND_BUSES_GEOJSON });
  });

  app.get('/api/environmental-metrics', (req: Request, res: Response) => {
    res.json({ success: true, data: ENVIRONMENTAL_SUMMARY });
  });

  app.get('/api/lulc-wastelands', (req: Request, res: Response) => {
    res.json({ success: true, data: OFFICIAL_LULC_WASTELAND });
  });

  app.get('/api/real-hospitals', (req: Request, res: Response) => {
    res.json({ success: true, count: REAL_HOSPITALS.length, hospitals: REAL_HOSPITALS });
  });

  app.get('/api/real-amenities', (req: Request, res: Response) => {
    res.json({ success: true, count: REAL_AMENITIES.length, amenities: REAL_AMENITIES });
  });

  app.get('/api/bus-stops', (req: Request, res: Response) => {
    res.json({ success: true, count: REAL_BUS_STATIONS.length, busStops: REAL_BUS_STATIONS });
  });

  // ================= URBAN PLANNING (real land_use x ownership only) =================
  app.get('/api/urban-planning/land-use-anomalies', (req: Request, res: Response) => {
    const anomalies = detectLandUseOwnershipAnomalies(PARCELS);
    res.json({ success: true, count: anomalies.length, anomalies });
  });

  app.get('/api/urban-planning/land-use-composition', (req: Request, res: Response) => {
    res.json({ success: true, composition: calculateLandUseComposition(PARCELS) });
  });

  app.get('/api/urban-planning/expansion-index', (req: Request, res: Response) => {
    res.json({ success: true, index: calculateUrbanExpansionIndex(AHMEDABAD_DISTRICT) });
  });

  // ================= ENVIRONMENTAL CONSERVATION (real land_use/ownership only) =================
  app.get('/api/environment/ecological-parcels', (req: Request, res: Response) => {
    const parcels = getEcologicalParcels(PARCELS);
    res.json({ success: true, count: parcels.length, parcels });
  });

  app.get('/api/environment/protected-areas', (req: Request, res: Response) => {
    const registry = getProtectedAreaRegistry(PARCELS);
    res.json({ success: true, count: registry.length, registry });
  });

  // ================= LAND MANAGEMENT & GOVERNANCE =================
  app.get('/api/land-governance/registry', (req: Request, res: Response) => {
    const registry = getGovernmentLandRegistry(PARCELS);
    res.json({ success: true, count: registry.length, registry });
  });

  app.get('/api/land-governance/equity-statement', (req: Request, res: Response) => {
    res.json({ success: true, statement: calculateDistrictEquityStatement(AHMEDABAD_DISTRICT, PARCELS) });
  });

  app.get('/api/land-governance/redevelopment-candidates', (req: Request, res: Response) => {
    const candidates = getRedevelopmentCandidates(PARCELS);
    res.json({ success: true, count: candidates.length, candidates });
  });

  app.get('/api/land-governance/redevelopment-candidates/:id', (req: Request, res: Response) => {
    const candidate = getRedevelopmentCandidates(PARCELS).find((c) => c.id === req.params.id || c.plotId === req.params.id);
    if (!candidate) return res.status(404).json({ success: false, error: 'Redevelopment candidate not found' });
    res.json({ success: true, candidate });
  });

  // Officials can flag a parcel for review - logged as an audit entry, since
  // the real cadastral data has no dispute/verification field to mutate.
  app.post('/api/land-governance/parcels/:id/flag', (req: Request, res: Response) => {
    const target = PARCELS.find((p) => p.id === req.params.id || p.plotId === req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'Parcel not found' });

    const { officialName, notes } = req.body;
    logAction({
      userId: 'usr-off-1',
      userName: officialName || 'Land & Revenue Officer',
      userRole: 'official',
      action: 'Parcel Flagged for Review',
      details: `Parcel ${target.plotId} (${target.landUse}, ${target.ownership}) flagged for manual review. ${notes || ''}`.trim(),
      entityType: 'Land Registry',
      entityId: target.id,
      district: target.district,
    });

    res.json({ success: true, parcel: target });
  });

  // ================= SITE SUITABILITY (honest 3-factor model) =================
  app.post('/api/suitability/calculate', (req: Request, res: Response) => {
    const { weights } = req.body;
    const activeWeights: SuitabilityWeights = weights || currentWeights;
    const rankedSites = calculateCandidateSiteScores(PARCELS, AHMEDABAD_DISTRICT, ALL_INFRASTRUCTURE, activeWeights);
    res.json({ success: true, district: AHMEDABAD_DISTRICT.name, weightsApplied: activeWeights, candidateSites: rankedSites });
  });

  // ================= CITIZEN REPORTS =================
  app.get('/api/citizen-reports', (req: Request, res: Response) => {
    res.json({ success: true, count: citizenReports.length, reports: citizenReports });
  });

  app.post('/api/citizen-reports', (req: Request, res: Response) => {
    const { citizenId, citizenName, citizenPhone, category, district, locationName, lat, lng, description, severity, photoUrl } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Description is required.' });
    }

    const newReport: CitizenReport = {
      id: `rep-${Date.now()}`,
      citizenId: citizenId || 'usr-cit-1',
      citizenName: citizenName || 'Citizen',
      citizenPhone: citizenPhone || '',
      category: category || 'Other',
      district: district || 'Ahmedabad',
      locationName: locationName || 'Ahmedabad District',
      lat: Number(lat) || AHMEDABAD_DISTRICT.centerLat,
      lng: Number(lng) || AHMEDABAD_DISTRICT.centerLng,
      description: description.trim(),
      severity: severity || 'Medium',
      status: 'Submitted',
      photoUrl,
      submittedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      updatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    citizenReports.unshift(newReport);
    logAction({
      userId: newReport.citizenId,
      userName: newReport.citizenName,
      userRole: 'citizen',
      action: 'Submitted Infrastructure Grievance',
      details: `Reported ${newReport.severity} ${newReport.category} issue in ${newReport.locationName}, ${newReport.district}.`,
      entityType: 'Citizen Grievance',
      entityId: newReport.id,
      district: newReport.district,
    });

    res.json({ success: true, report: newReport });
  });

  app.patch('/api/citizen-reports/:id', (req: Request, res: Response) => {
    const reportIndex = citizenReports.findIndex((r) => r.id === req.params.id);
    if (reportIndex === -1) return res.status(404).json({ success: false, error: 'Report not found' });

    const { status, officialNotes, assignedDepartment, officialName } = req.body;
    if (status) citizenReports[reportIndex].status = status;
    if (officialNotes) citizenReports[reportIndex].officialNotes = officialNotes;
    if (assignedDepartment) citizenReports[reportIndex].assignedDepartment = assignedDepartment;
    citizenReports[reportIndex].updatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    logAction({
      userId: 'usr-off-1',
      userName: officialName || 'Government Official',
      userRole: 'official',
      action: `Updated Grievance Status to [${status || 'Reviewed'}]`,
      details: `Grievance #${req.params.id} for ${citizenReports[reportIndex].category} updated with notes: ${officialNotes || 'Status advanced.'}`,
      entityType: 'Citizen Grievance',
      entityId: req.params.id,
      district: citizenReports[reportIndex].district,
    });

    res.json({ success: true, report: citizenReports[reportIndex] });
  });

  // ================= DATA QUALITY (real, computed from loaded datasets) =================
  app.get('/api/data-quality', (req: Request, res: Response) => {
    res.json({ success: true, audit: DATA_QUALITY_AUDIT });
  });

  // ================= AUDIT LOGS =================
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    res.json({ success: true, count: auditLogs.length, logs: auditLogs });
  });

  app.post('/api/audit-logs', (req: Request, res: Response) => {
    const { userId, userName, userRole, action, details, entityType, entityId, district } = req.body;
    logAction({
      userId: userId || 'usr-off-1',
      userName: userName || 'Government Official',
      userRole: userRole || 'official',
      action: action || 'Action Logged',
      details: details || 'Platform interaction completed.',
      entityType: entityType || 'Site Recommendation',
      entityId: entityId || `ent-${Date.now()}`,
      district: district || 'Ahmedabad',
    });
    res.json({ success: true, log: auditLogs[0] });
  });

  // ================= GEMINI EXPLAINABLE AI =================
  app.post('/api/gemini/explain', async (req: Request, res: Response) => {
    try {
      const { site, alternativeSite } = req.body;
      const explanation = await explainSiteRecommendation(site, AHMEDABAD_DISTRICT, alternativeSite);
      res.json({ success: true, explanation });
    } catch (err: any) {
      console.error('Gemini explain error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/gemini/ask', async (req: Request, res: Response) => {
    try {
      const { question } = req.body;
      const answer = await queryAskGlis({ question }, AHMEDABAD_DISTRICT);
      res.json({ success: true, ...answer });
    } catch (err: any) {
      console.error('Gemini ask error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ================= MAPS, GEOCODING (real: searches actual infrastructure + district) =================
  let currentMapModePreference: 'satellite' | 'terrain' = 'satellite';

  app.get('/api/maps/config', (req: Request, res: Response) => {
    res.json({
      success: true,
      currentMode: currentMapModePreference,
      layers: {
        satellite: {
          id: 'satellite',
          name: 'Satellite',
          tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maxZoom: 19,
          attribution: '© Esri World Imagery',
        },
        terrain: {
          id: 'terrain',
          name: 'Terrain',
          tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          maxZoom: 19,
          attribution: '© Esri Topographic Terrain',
        },
      },
      district: { name: AHMEDABAD_DISTRICT.name, centerLat: AHMEDABAD_DISTRICT.centerLat, centerLng: AHMEDABAD_DISTRICT.centerLng },
    });
  });

  app.get('/api/maps/preference', (req: Request, res: Response) => {
    res.json({ success: true, mode: currentMapModePreference });
  });

  app.post('/api/maps/preference', (req: Request, res: Response) => {
    const { mode } = req.body;
    if (mode === 'satellite' || mode === 'terrain') {
      currentMapModePreference = mode;
      return res.json({ success: true, mode: currentMapModePreference });
    }
    res.status(400).json({ success: false, error: 'Invalid mode. Allowed values: satellite, terrain' });
  });

  // Searches real infrastructure names and the district center - no fabricated place database.
  app.get('/api/maps/geocode', (req: Request, res: Response) => {
    const query = String(req.query.query || '').trim().toLowerCase();
    if (!query) {
      return res.json({ success: true, results: [{ name: AHMEDABAD_DISTRICT.name, type: 'District', lat: AHMEDABAD_DISTRICT.centerLat, lng: AHMEDABAD_DISTRICT.centerLng }] });
    }

    const results: { name: string; type: string; lat: number; lng: number }[] = [];
    if (AHMEDABAD_DISTRICT.name.toLowerCase().includes(query)) {
      results.push({ name: AHMEDABAD_DISTRICT.name, type: 'District', lat: AHMEDABAD_DISTRICT.centerLat, lng: AHMEDABAD_DISTRICT.centerLng });
    }
    ALL_INFRASTRUCTURE.filter((a) => a.name.toLowerCase().includes(query))
      .slice(0, 20)
      .forEach((a) => results.push({ name: a.name, type: a.type, lat: a.lat, lng: a.lng }));

    res.json({ success: true, query, count: results.length, results });
  });

  app.get('/api/maps/reverse-geocode', (req: Request, res: Response) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ success: false, error: 'Valid lat and lng query params required.' });

    let closest = ALL_INFRASTRUCTURE[0];
    let minDist = Infinity;
    for (const asset of ALL_INFRASTRUCTURE) {
      const d = haversineDistanceKm(lat, lng, asset.lat, asset.lng);
      if (d < minDist) {
        minDist = d;
        closest = asset;
      }
    }

    res.json({
      success: true,
      coordinates: { lat, lng },
      nearestInfrastructure: closest,
      distanceKm: Number(minDist.toFixed(2)),
    });
  });

  // ================= NATIONAL SCOPE (glis_india_dataset, real) =================
  app.get('/api/national/states', (req: Request, res: Response) => {
    const states = listIndiaStates().map((s) => getStateGeographyInfo(s)).filter(Boolean);
    res.json({ success: true, count: states.length, states });
  });

  app.get('/api/national/states/:state/geography', (req: Request, res: Response) => {
    const info = getStateGeographyInfo(req.params.state);
    if (!info) return res.status(404).json({ success: false, error: 'State not found in loaded dataset.' });
    const districts = getStateDistrictList(req.params.state);
    res.json({ success: true, geography: info, districts });
  });

  app.get('/api/national/states/:state/boundary', (req: Request, res: Response) => {
    const district = req.query.district ? String(req.query.district) : undefined;
    const geojson = getStateBoundaryGeoJson(req.params.state, district);
    if (!geojson) return res.status(404).json({ success: false, error: 'State not found in loaded dataset.' });
    res.json({ success: true, geojson });
  });

  app.get('/api/national/land-utilization', (req: Request, res: Response) => {
    res.json({ success: true, count: NATIONAL_LAND_UTILIZATION.length, records: NATIONAL_LAND_UTILIZATION });
  });

  app.get('/api/national/land-utilization/statewise', (req: Request, res: Response) => {
    const { year } = req.query;
    const arr = Array.isArray(STATEWISE_LAND_UTILIZATION)
      ? STATEWISE_LAND_UTILIZATION
      : Object.values(STATEWISE_LAND_UTILIZATION);
    const list = year ? arr.filter((r: any) => r.year === year) : arr;
    res.json({ success: true, count: list.length, records: list });
  });

  // ================= OFFICER PROFILE & PROJECTS =================
  app.get('/api/officer/profile', (req: Request, res: Response) => {
    const officialUser = users.find((u) => u.role === 'official') || DEMO_USERS[0];
    res.json({
      success: true,
      officer: {
        ...officialUser,
        totalAssignedProjects: officerProjects.length,
        activeProjectsCount: officerProjects.filter((p) => p.status === 'In Progress').length,
        totalBudgetSanctionedCr: officerProjects.reduce((acc, p) => acc + p.allocatedBudgetCr, 0),
      },
    });
  });

  app.get('/api/officer/projects', (req: Request, res: Response) => {
    res.json({
      success: true,
      count: officerProjects.length,
      projects: officerProjects,
      summary: {
        totalProjects: officerProjects.length,
        inProgress: officerProjects.filter((p) => p.status === 'In Progress').length,
        totalBudgetCr: officerProjects.reduce((acc, p) => acc + p.allocatedBudgetCr, 0),
      },
    });
  });

  app.post('/api/officer/settings', (req: Request, res: Response) => {
    const { theme, highContrast, notifications, language } = req.body;
    res.json({
      success: true,
      settings: { theme: theme || 'dark', highContrast: !!highContrast, notifications: notifications !== false, language: language || 'en', updatedAt: new Date().toISOString() },
    });
  });

  // ================= DATA INGESTION (real validation, not a cosmetic simulation) =================
  app.post('/api/data-ingest', (req: Request, res: Response) => {
    const { fileName, geojson } = req.body;

    if (!geojson) {
      return res.status(400).json({ success: false, error: 'No GeoJSON content provided to validate. Attach a "geojson" field with the parsed file content.' });
    }

    if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
      return res.json({ success: false, message: `${fileName || 'Uploaded file'} is not a valid GeoJSON FeatureCollection.`, recordsIngested: 0, validGeometryPercent: 0 });
    }

    let validGeometry = 0;
    const issues: string[] = [];
    geojson.features.forEach((f: any, i: number) => {
      const hasGeometry = f?.geometry?.type && f?.geometry?.coordinates;
      if (hasGeometry) validGeometry += 1;
      else issues.push(`Feature ${i} missing valid geometry.`);
    });

    const total = geojson.features.length;
    const validPercent = total > 0 ? Number(((validGeometry / total) * 100).toFixed(1)) : 0;

    logAction({
      userId: 'usr-adm-1',
      userName: 'Chief Geospatial Data Administrator',
      userRole: 'admin',
      action: `Validated Dataset: ${fileName || 'Uploaded GeoJSON'}`,
      details: `${validGeometry}/${total} features had valid geometry (${validPercent}%). ${issues.length} issue(s) flagged.`,
      entityType: 'Dataset Ingestion',
      entityId: `ing-${Date.now()}`,
      district: 'Ahmedabad',
    });

    res.json({
      success: true,
      message: `${fileName || 'Uploaded file'} validated: ${validGeometry}/${total} features have valid geometry.`,
      recordsIngested: total,
      validGeometryCount: validGeometry,
      validGeometryPercent: validPercent,
      issues: issues.slice(0, 20),
    });
  });

  // ================= VITE MIDDLEWARE =================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GLIS Geospatial Intelligence Platform backend listening on port ${PORT}`);
  });
}

startServer();
