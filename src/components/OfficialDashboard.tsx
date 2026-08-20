import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AskGlisResponse,
  AuditLog,
  CandidateSiteScore,
  CitizenReport,
  DataQualityAudit,
  DistrictMetrics,
  GrievanceCategory,
  InfrastructureAsset,
  InfrastructureAssetType,
  Language,
  OfficerProject,
  OwnershipType,
  Parcel,
  ParcelFilterType,
  RedevelopmentCandidate,
  ReportStatus,
  SampleZoneLandUseComposition,
  SuitabilityWeights,
  User,
} from '../types';
import { DevelopmentTrendsModule } from './analytics/DevelopmentTrendsModule';
import { ExploreParcelsModule } from './parcels/ExploreParcelsModule';
import { GISMap, LAND_CATEGORIES } from './GISMap';
import {
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle,
  FileText,
  Sliders,
  Send,
  Building,
  MapPin,
  ChevronRight,
  ShieldCheck,
  X,
  Clock,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Navigation,
  Bell,
  Bookmark,
  GraduationCap,
  Hospital,
  Bus,
  ShieldAlert,
  Loader2,
  Info,
  AlertTriangle,
  Percent,
  Landmark,
  Trees,
} from 'lucide-react';

interface OfficialDashboardProps {
  currentUser: User | null;
  language: Language;
  districts: DistrictMetrics[];
  selectedDistrict: DistrictMetrics;
  onSelectDistrict: (district: DistrictMetrics) => void;
  parcels: Parcel[];
  selectedParcel: Parcel | null;
  onSelectParcel: (parcel: Parcel | null) => void;
  infrastructureAssets: InfrastructureAsset[];
  candidateSites: CandidateSiteScore[];
  selectedSite: CandidateSiteScore | null;
  onSelectSite: (site: CandidateSiteScore | null) => void;
  citizenReports: CitizenReport[];
  onUpdateReportStatus: (id: string, status: CitizenReport['status'], notes?: string) => void;
  dataQualityAudit: DataQualityAudit | null;
  auditLogs: AuditLog[];
  weights: SuitabilityWeights;
  onRecalculateSuitability: (newWeights: SuitabilityWeights) => void;
  onOpenReportModal: (site?: CandidateSiteScore) => void;
  onAskGlisQuery: (q: string) => Promise<any>;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onLogout?: () => void;
  onNavigate?: (view: string) => void;
}

type TabType = 'land' | 'infra' | 'sites' | 'analytics' | 'explore';

const INFRA_TYPE_LABEL: Record<InfrastructureAssetType, string> = {
  school: 'Schools (UDISE)',
  hospital: 'Hospitals (MoHFW)',
  police: 'Police & Safety',
  bus_station: 'AMTS/BRTS Bus Hubs',
  fire_station: 'Fire Stations',
  amenity: 'Civic Amenities',
};

const INFRA_TYPE_ICON: Record<InfrastructureAssetType, React.FC<{ className?: string }>> = {
  school: GraduationCap,
  hospital: Hospital,
  police: ShieldAlert,
  bus_station: Bus,
  fire_station: ShieldCheck,
  amenity: Building,
};

const OWNERSHIP_META: Record<OwnershipType, { color: string; icon: React.FC<{ className?: string }> }> = {
  Private: { color: '#0ea5e9', icon: Landmark },
  Government: { color: '#e5a93b', icon: Building },
  Forest: { color: '#10b981', icon: Trees },
};

const REPORT_STATUS_OPTIONS: ReportStatus[] = ['Submitted', 'Under Review', 'Verified', 'Assigned', 'In Progress', 'Resolved'];

const PROJECT_CATEGORY_OPTIONS = [
  'Hospital & Healthcare',
  'Education',
  'Water & Utilities',
  'Roads & Transit',
  'Public Safety',
  'Agriculture',
  'Other',
];

export const OfficialDashboard: React.FC<OfficialDashboardProps> = ({
  currentUser,
  language,
  districts,
  selectedDistrict,
  onSelectDistrict,
  parcels,
  selectedParcel,
  onSelectParcel,
  infrastructureAssets,
  candidateSites,
  selectedSite,
  onSelectSite,
  citizenReports,
  onUpdateReportStatus,
  dataQualityAudit,
  auditLogs,
  weights,
  onRecalculateSuitability,
  onOpenReportModal,
  onAskGlisQuery,
  isDarkMode = true,
  onToggleTheme,
  onLogout,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('land');
  const [parcelFilter, setParcelFilter] = useState<ParcelFilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Profile Dropdown State
  const [profileOpen, setProfileOpen] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Officer's real assigned projects - starts empty (no seeded fake pipeline)
  const [officerProjects, setOfficerProjects] = useState<OfficerProject[]>([]);
  const [officerProjectsLoading, setOfficerProjectsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/officer/projects')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) setOfficerProjects(d.projects);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setOfficerProjectsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Real sample-zone land-use composition (Bopal / S.P. Ring Road sample zone)
  const [composition, setComposition] = useState<SampleZoneLandUseComposition | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/parcels/stats')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) setComposition(d.composition);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  // AI Assistant (Ask GLIS) State
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AskGlisResponse | null>(null);

  const handleSendAiQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await onAskGlisQuery(aiPrompt);
      setAiResult(res as AskGlisResponse);
    } catch {
      setAiResult({ answer: 'Unable to reach the GLIS analytics service right now. Please try again shortly.', confidence: 0 });
    } finally {
      setAiLoading(false);
    }
  };

  // Citizen Grievance Review State
  const [grievanceOpen, setGrievanceOpen] = useState(false);
  const [grievanceStatusFilter, setGrievanceStatusFilter] = useState<'all' | ReportStatus>('all');
  const pendingGrievanceCount = useMemo(
    () => citizenReports.filter((r) => r.status === 'Submitted' || r.status === 'Under Review').length,
    [citizenReports]
  );
  const filteredGrievances = useMemo(
    () => (grievanceStatusFilter === 'all' ? citizenReports : citizenReports.filter((r) => r.status === grievanceStatusFilter)),
    [citizenReports, grievanceStatusFilter]
  );

  // Local Suitability Sliders (3-factor real model)
  const [localWeights, setLocalWeights] = useState<SuitabilityWeights>(weights);
  useEffect(() => {
    setLocalWeights(weights);
  }, [weights]);

  // Site Management Feature Set State
  const [shortlistedSiteIds, setShortlistedSiteIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState<boolean>(false);
  const [createdProjectToast, setCreatedProjectToast] = useState<string | null>(null);
  const [projectNameInput, setProjectNameInput] = useState<string>('');
  const [projectCategoryInput, setProjectCategoryInput] = useState<string>(PROJECT_CATEGORY_OPTIONS[0]);
  const [projectBudgetInput, setProjectBudgetInput] = useState<string>('');

  const toggleShortlistSite = (siteId: string) => {
    setShortlistedSiteIds((prev) => (prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]));
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeSite = selectedSite || candidateSites[0];
    const pName = projectNameInput.trim() || (activeSite ? `${activeSite.landUse} Development (${activeSite.plotId})` : 'New Infrastructure Project');
    setCreateProjectModalOpen(false);
    setCreatedProjectToast(`Draft noted: "${pName}" - forward to your department's project intake workflow to formally sanction it.`);
    setProjectNameInput('');
    setProjectBudgetInput('');
    setTimeout(() => setCreatedProjectToast(null), 4500);
  };

  // Map Navigation & Fly-To State
  const [flyToTarget, setFlyToTarget] = useState<{ parcel: Parcel; timestamp: number } | null>(null);
  const [flyToLocationTarget, setFlyToLocationTarget] = useState<{ lat: number; lng: number; zoom?: number; timestamp: number } | null>(null);
  const [isLocatingParcel, setIsLocatingParcel] = useState(false);

  const handleLocateParcelOnMap = async (parcel: Parcel) => {
    setIsLocatingParcel(true);
    setFlyToTarget({ parcel, timestamp: Date.now() });
    try {
      await fetch(`/api/parcels/locate/${parcel.id}`);
    } catch {
      // Graceful fallback to client-side spatial routing
    } finally {
      setTimeout(() => setIsLocatingParcel(false), 1200);
    }
  };

  // ================= LAND TAB DERIVED DATA (real fields only) =================
  const totalParcelsCount = parcels.length;
  const totalAcres = useMemo(() => Number(parcels.reduce((sum, p) => sum + (p.areaAcres || 0), 0).toFixed(1)), [parcels]);

  const ownershipBreakdown = useMemo(() => {
    const map: Record<string, { count: number; acres: number }> = {};
    parcels.forEach((p) => {
      if (!map[p.ownership]) map[p.ownership] = { count: 0, acres: 0 };
      map[p.ownership].count += 1;
      map[p.ownership].acres += p.areaAcres || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count) as [OwnershipType, { count: number; acres: number }][];
  }, [parcels]);

  const activeFilteredParcels = useMemo(() => {
    let list = parcelFilter === 'All' ? parcels : parcels.filter((p) => p.landUse === parcelFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((p) => p.plotId.toLowerCase().includes(q));
    }
    return list;
  }, [parcels, parcelFilter, searchQuery]);

  const activeTotalAcres = useMemo(() => Number(activeFilteredParcels.reduce((sum, p) => sum + (p.areaAcres || 0), 0).toFixed(1)), [activeFilteredParcels]);

  // ================= INFRA TAB DERIVED DATA =================
  const [infraTypeFilter, setInfraTypeFilter] = useState<InfrastructureAssetType | 'all'>('all');
  const filteredInfrastructure = useMemo(
    () => (infraTypeFilter === 'all' ? infrastructureAssets : infrastructureAssets.filter((a) => a.type === infraTypeFilter)),
    [infrastructureAssets, infraTypeFilter]
  );
  const infraRealCount = useMemo(() => infrastructureAssets.filter((a) => a.dataStatus === 'REAL').length, [infrastructureAssets]);
  const infraProvisionalCount = infrastructureAssets.length - infraRealCount;
  const infraTypeCounts = useMemo(() => {
    const counts: Record<string, number> = { school: 0, hospital: 0, police: 0, bus_station: 0, fire_station: 0, amenity: 0 };
    infrastructureAssets.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, [infrastructureAssets]);

  // ================= SITES TAB DERIVED DATA =================
  const activeSite = selectedSite || candidateSites[0] || null;
  const compareList = useMemo(() => {
    if (shortlistedSiteIds.length > 0) {
      return candidateSites.filter((s) => shortlistedSiteIds.includes(s.siteId)).slice(0, 4);
    }
    return candidateSites.slice(0, 3);
  }, [candidateSites, shortlistedSiteIds]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#0C131F] text-[#E5E2D9] select-none font-sans"
    >
      {/* Top Floating Glassmorphic Header */}
      <header
        className="absolute top-3 left-4 right-4 h-14 rounded-2xl border border-white/10 bg-[#0C131F]/40 backdrop-blur-2xl flex items-center justify-between px-6 z-20 shadow-2xl text-white"
      >
        {/* Left: Devanagari Brand Title - Sand Ivory */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xl font-black tracking-[-0.02em] text-white select-none">भू-दृष्टि</span>
          </div>

          {/* Navigation Tabs with Sunset Coral Underline */}
          <nav className="flex items-center gap-6">
            {(
              [
                { id: 'land', label: 'LAND OVERVIEW' },
                { id: 'infra', label: 'INFRASTRUCTURE MONITORING' },
                { id: 'sites', label: 'SITE SUITABILITY' },
                { id: 'analytics', label: 'ANALYTICS' },
              ] as { id: TabType; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-3.5 text-xs font-bold tracking-wider uppercase transition-colors ${
                  activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#FF6B53] rounded-t-full shadow-[0_0_8px_rgba(255,107,83,0.8)]" />}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setActiveTab('explore')}
              className={`relative py-3.5 text-xs font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                activeTab === 'explore' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#FF6B53]" />
              <span>EXPLORE PARCELS</span>
              {activeTab === 'explore' && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#FF6B53] rounded-t-full shadow-[0_0_8px_rgba(255,107,83,0.8)]" />}
            </button>
          </nav>
        </div>

        {/* Right: District Location, Grievances, AI Assistant, Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-300">
            <MapPin className="w-3 h-3 text-[#FF6B53]" />
            <span>
              {selectedDistrict.name} District, {selectedDistrict.state}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setGrievanceOpen(true)}
            title="Citizen Grievances"
            className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {pendingGrievanceCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                {pendingGrievanceCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAiOpen(true)}
            title="Ask GLIS - AI Assistant"
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-[#FF6B53]/30 bg-[#FF6B53]/10 text-[#FF6B53] hover:bg-[#FF6B53]/20 transition-colors text-xs font-bold"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">Ask GLIS</span>
          </button>

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 h-9 rounded-xl border transition-all shadow-md text-xs font-semibold ${
                profileOpen
                  ? 'bg-white/10 border-[#FF6B53] text-[#FF6B53] ring-1 ring-[#FF6B53]/40'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[#FF6B53]/20 text-[#FF6B53] flex items-center justify-center font-bold text-[10px] border border-[#FF6B53]/40">
                {currentUser?.name ? currentUser.name.charAt(0) : <UserIcon className="w-3 h-3" />}
              </div>
              <span>Profile</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${profileOpen ? 'rotate-180 text-[#FF6B53]' : 'text-slate-400'}`} />
            </button>

            {/* Profile Dropdown Menu - Glassmorphic */}
            {profileOpen && (
              <div
                className={`absolute right-0 top-11 w-96 max-h-[85vh] overflow-y-auto border rounded-xl shadow-2xl z-[10000] p-4 space-y-4 custom-scrollbar ring-1 ${
                  isDarkMode ? 'bg-[#181512] border-[#3d3328] text-[#d4cbbf] ring-black/40' : 'bg-white border-[#e7e5e4] text-[#44403c] ring-black/10'
                }`}
              >
                {/* Officer Profile Header */}
                <div className={`flex items-start gap-3 pb-3 border-b ${isDarkMode ? 'border-[#2e2720]' : 'border-[#e7e5e4]'}`}>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#e5a93b]/30 to-[#e5a93b]/10 text-[#e5a93b] flex items-center justify-center font-bold text-base border border-[#e5a93b]/60 shrink-0 shadow-inner">
                    {currentUser?.name
                      ? currentUser.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                      : 'GO'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-[#1c1917]'}`}>{currentUser?.name || 'Government Official'}</h3>
                      <ShieldCheck className="w-4 h-4 text-[#e5a93b] shrink-0" />
                    </div>
                    <div className="text-xs font-semibold text-[#e5a93b] mt-0.5 truncate">{currentUser?.designation || 'District Development Officer (DDO)'}</div>
                    <div className={`text-[11px] mt-0.5 leading-snug ${isDarkMode ? 'text-[#a89f91]' : 'text-[#78716c]'}`}>
                      {currentUser?.department || 'Urban Development & Infrastructure Board'}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border ${
                          isDarkMode ? 'bg-[#241f1a] text-[#c7bcaf] border-[#3d3328]' : 'bg-[#f5f5f4] text-[#44403c] border-[#e7e5e4]'
                        }`}
                      >
                        {currentUser?.jurisdiction || `${selectedDistrict.name} District`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Projects Toggle Section (real, from /api/officer/projects) */}
                <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'bg-[#141210] border-[#2a241e]' : 'bg-[#fafaf9] border-[#e7e5e4]'}`}>
                  <button
                    type="button"
                    onClick={() => setProjectsExpanded(!projectsExpanded)}
                    className={`w-full flex items-center justify-between p-3 transition-colors text-left ${isDarkMode ? 'hover:bg-[#1d1916]' : 'hover:bg-[#f5f5f4]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#e5a93b]" />
                      <span className={`text-xs font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-[#1c1917]'}`}>Assigned Projects</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#e5a93b]/20 text-[#e5a93b] font-bold border border-[#e5a93b]/40">{officerProjects.length}</span>
                    </div>
                    {projectsExpanded ? (
                      <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#a8a29e]'}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#a8a29e]'}`} />
                    )}
                  </button>

                  {projectsExpanded && (
                    <div className="p-3 pt-0 space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar">
                      {officerProjectsLoading ? (
                        <div className="flex items-center gap-2 text-xs text-[#8e8577] py-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Loading assigned projects&hellip;</span>
                        </div>
                      ) : officerProjects.length === 0 ? (
                        <div className={`text-xs italic py-2 text-center ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>No projects currently assigned.</div>
                      ) : (
                        officerProjects.map((proj) => (
                          <div
                            key={proj.id}
                            className={`p-2.5 rounded border transition-colors space-y-1.5 ${
                              isDarkMode ? 'bg-[#1c1916] border-[#332b22] hover:border-[#4d3d2c]' : 'bg-white border-[#e7e5e4] hover:border-[#d6d3d1] shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className={`font-semibold text-xs leading-tight ${isDarkMode ? 'text-white' : 'text-[#1c1917]'}`}>{proj.name}</div>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                                  proj.status === 'In Progress'
                                    ? 'bg-[#064e3b] text-[#6ee7b7] border border-[#047857]'
                                    : proj.status === 'Tendering'
                                    ? 'bg-[#1e3a8a] text-[#93c5fd] border border-[#1d4ed8]'
                                    : 'bg-[#78350f] text-[#fcd34d] border border-[#b45309]'
                                }`}
                              >
                                {proj.status}
                              </span>
                            </div>
                            <div className={`flex items-center justify-between text-[10px] ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>
                              <span>
                                District: <b className={isDarkMode ? 'text-[#d4cbbf]' : 'text-[#1c1917]'}>{proj.district}</b>
                              </span>
                              <span>
                                Budget: <b className="text-[#e5a93b]">₹{proj.allocatedBudgetCr} Cr</b>
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className={isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}>Progress</span>
                                <span className={`font-mono font-bold ${isDarkMode ? 'text-[#f4ede4]' : 'text-[#1c1917]'}`}>{proj.progressPercentage}%</span>
                              </div>
                              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#26201a]' : 'bg-[#e7e5e4]'}`}>
                                <div className="h-full bg-gradient-to-r from-[#e5a93b] to-[#fbbf24] rounded-full transition-all" style={{ width: `${proj.progressPercentage}%` }} />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Recent Activity (real audit log) */}
                <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'bg-[#141210] border-[#2a241e]' : 'bg-[#fafaf9] border-[#e7e5e4]'}`}>
                  <button
                    type="button"
                    onClick={() => setActivityExpanded(!activityExpanded)}
                    className={`w-full flex items-center justify-between p-3 transition-colors text-left ${isDarkMode ? 'hover:bg-[#1d1916]' : 'hover:bg-[#f5f5f4]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#e5a93b]" />
                      <span className={`text-xs font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-[#1c1917]'}`}>Recent Activity</span>
                    </div>
                    {activityExpanded ? (
                      <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#a8a29e]'}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#a8a29e]'}`} />
                    )}
                  </button>
                  {activityExpanded && (
                    <div className="p-3 pt-0 space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                      {auditLogs.length === 0 ? (
                        <div className={`text-xs italic py-2 text-center ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>No activity logged yet.</div>
                      ) : (
                        auditLogs.slice(0, 6).map((log) => (
                          <div key={log.id} className={`text-[11px] leading-snug ${isDarkMode ? 'text-[#a89f91]' : 'text-[#78716c]'}`}>
                            <span className={`font-semibold ${isDarkMode ? 'text-[#d4cbbf]' : 'text-[#44403c]'}`}>{log.action}</span>
                            <span className="block text-[10px]">
                              {log.userName} &bull; {log.timestamp}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Settings Toggle Section */}
                <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'bg-[#141210] border-[#2a241e]' : 'bg-[#fafaf9] border-[#e7e5e4]'}`}>
                  <button
                    type="button"
                    onClick={() => setSettingsExpanded(!settingsExpanded)}
                    className={`w-full flex items-center justify-between p-3 transition-colors text-left ${isDarkMode ? 'hover:bg-[#1d1916]' : 'hover:bg-[#f5f5f4]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#e5a93b]" />
                      <span className={`text-xs font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-[#1c1917]'}`}>System & Display Settings</span>
                    </div>
                    {settingsExpanded ? (
                      <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#a8a29e]'}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#a8a29e]'}`} />
                    )}
                  </button>

                  {settingsExpanded && (
                    <div className="p-3 pt-0 space-y-3">
                      <div className="space-y-1.5">
                        <label className={`text-[11px] font-semibold block ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>Appearance & Theme Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isDarkMode && onToggleTheme) onToggleTheme();
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                              !isDarkMode ? 'bg-[#e5a93b] text-[#1a1613] border-[#e5a93b] shadow-md ring-2 ring-[#e5a93b]/40' : 'bg-[#1c1916] text-[#a89f91] border-[#332b22] hover:text-white hover:bg-[#26211c]'
                            }`}
                          >
                            <Sun className="w-3.5 h-3.5" />
                            <span>Light Mode</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!isDarkMode && onToggleTheme) onToggleTheme();
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                              isDarkMode ? 'bg-[#2b241d] text-[#e5a93b] border-[#e5a93b]/70 shadow-sm ring-2 ring-[#e5a93b]/40' : 'bg-white text-[#78716c] border-[#e7e5e4] hover:text-[#1c1917] hover:bg-[#f5f5f4]'
                            }`}
                          >
                            <Moon className="w-3.5 h-3.5" />
                            <span>Dark Mode</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Log Out Option */}
                <div className={`pt-2 border-t ${isDarkMode ? 'border-[#2e2720]' : 'border-[#e7e5e4]'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      if (onLogout) onLogout();
                      else if (onNavigate) onNavigate('home');
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all shadow-sm group ${
                      isDarkMode
                        ? 'bg-[#241a18] hover:bg-[#381d1a] text-[#f87171] border border-[#4d2522] hover:border-[#ef4444]'
                        : 'bg-[#fef2f2] hover:bg-[#fee2e2] text-[#dc2626] border border-[#fecaca] hover:border-[#f87171]'
                    }`}
                  >
                    <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace — Map is ALWAYS full-screen background */}
      <div className="absolute inset-0 z-0">
        <GISMap
          selectedDistrict={selectedDistrict}
          parcels={parcels}
          selectedParcel={selectedParcel}
          onSelectParcel={onSelectParcel}
          infrastructureAssets={infrastructureAssets}
          candidateSites={candidateSites}
          selectedSite={selectedSite}
          onSelectSite={onSelectSite}
          isDarkMode={true}
          parcelFilter={parcelFilter}
          onFilterChange={setParcelFilter}
          showPillFilters={activeTab === 'land'}
          flyToParcelTarget={flyToTarget}
          flyToLocationTarget={flyToLocationTarget}
        />
      </div>

      {/* Floating Overlay Panels */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Explore Parcels Glass Panel */}
        {activeTab === 'explore' && (
          <div className="pointer-events-auto absolute left-4 right-4 top-20 bottom-4 rounded-2xl border border-white/10 bg-[#0B1220]/45 backdrop-blur-2xl overflow-hidden shadow-2xl flex flex-col">
            <ExploreParcelsModule
              isDarkMode={true}
              onLocateOnMap={(candidate: RedevelopmentCandidate) => {
                const match = parcels.find((p) => p.id === candidate.id || p.plotId === candidate.plotId);
                if (match) {
                  onSelectParcel(match);
                  handleLocateParcelOnMap(match);
                }
                setActiveTab('land');
                setFlyToLocationTarget({ lat: candidate.centerLat, lng: candidate.centerLng, zoom: 17, timestamp: Date.now() });
              }}
            />
          </div>
        )}

        {/* Analytics Glass Panel */}
        {activeTab === 'analytics' && (
          <div className="pointer-events-auto absolute left-4 right-4 top-20 bottom-4 rounded-2xl border border-white/10 bg-[#0B1220]/45 backdrop-blur-2xl p-6 overflow-y-auto shadow-2xl">
            <DevelopmentTrendsModule isDarkMode={true} language={language} />
          </div>
        )}

        {/* Right Floating Glassmorphic Sidebar */}
        {activeTab !== 'explore' && activeTab !== 'analytics' && (
          <aside
            className={`pointer-events-auto absolute right-4 top-20 bottom-4 flex flex-col p-4 overflow-y-auto gap-3 rounded-2xl border border-white/10 bg-[#0B1220]/45 backdrop-blur-2xl shadow-2xl text-white transition-all duration-300 ${
              activeTab === 'sites' ? 'w-[55%]' : 'w-80'
            }`}
          >
              {activeTab === 'land' && (
                <div className="flex flex-col gap-3">
                  {/* Sample Zone Overview */}
                  <div className="rounded-xl p-3.5 border border-white/[0.08] bg-white/[0.03]">
                    <div className="text-xs font-bold tracking-wide uppercase mb-2.5 pb-1.5 border-b border-white/10 flex items-center justify-between text-[#E5E2D9]">
                      <span>Sample Zone Overview</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FF6B53]/20 text-[#FF6B53] border border-[#FF6B53]/40 font-bold normal-case">Synthetic Sample</span>
                    </div>
                    <div className="text-[11px] mb-2 leading-snug italic text-slate-400">{composition?.sampleZoneLabel || 'Bopal / S.P. Ring Road sample zone, Ahmedabad'}</div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-400">Total parcels :</span>
                        <span className="font-semibold text-white">{totalParcelsCount}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-400">Total area :</span>
                        <span className="font-semibold text-white">{totalAcres.toLocaleString()} Acres</span>
                      </div>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                    <Search className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Plot ID…"
                      className="w-full bg-transparent outline-none text-xs text-white placeholder:text-slate-500"
                    />
                  </div>

                  {/* Land Use Composition (real, from /api/parcels/stats) */}
                  <div className="rounded-xl p-3.5 border border-white/[0.08] bg-white/[0.03]">
                    <div className="text-xs font-bold tracking-wide uppercase mb-2 pb-1.5 border-b border-white/10 text-[#E5E2D9]">
                      Land Use Split
                    </div>
                    <div className="space-y-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setParcelFilter('All')}
                        className={`w-full flex items-center justify-between py-1.5 px-2 rounded transition-colors ${
                          parcelFilter === 'All' ? 'bg-[#FF6B53]/20 text-[#FF6B53]' : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <span className="font-semibold">All Land</span>
                        <span className="font-bold font-mono">{totalParcelsCount}</span>
                      </button>
                      {LAND_CATEGORIES.map((cat) => {
                        const entry = composition?.breakdown.find((b) => b.landUse === cat.id);
                        const count = entry?.parcelCount ?? parcels.filter((p) => p.landUse === cat.id).length;
                        const pct = entry?.percentOfSample ?? (totalParcelsCount > 0 ? Math.round((count / totalParcelsCount) * 100) : 0);
                        const isSelected = parcelFilter === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setParcelFilter(cat.id)}
                            className={`w-full flex items-center justify-between py-1.5 px-2 rounded cursor-pointer transition-colors ${
                              isSelected ? 'bg-[#FF6B53]/20 text-[#FF6B53]' : 'hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                              {cat.shortLabel}
                            </span>
                            <span className="text-right">
                              <span className="font-bold font-mono">{count}</span>
                              <span className="text-[10px] ml-1 opacity-60">({pct}%)</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ownership Breakdown */}
                  <div className="rounded-xl p-3.5 border border-white/[0.08] bg-white/[0.03]">
                    <div className="text-xs font-bold tracking-wide uppercase mb-2 pb-1.5 border-b border-white/10 text-[#E5E2D9]">
                      Ownership
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {ownershipBreakdown.map(([ownership, data]) => {
                        const meta = OWNERSHIP_META[ownership];
                        const Icon = meta?.icon || Building;
                        const pct = totalParcelsCount > 0 ? Math.round((data.count / totalParcelsCount) * 100) : 0;
                        return (
                          <div key={ownership} className="flex items-center justify-between py-1 px-1">
                            <span className="flex items-center gap-1.5 font-medium" style={{ color: meta?.color }}>
                              <Icon className="w-3.5 h-3.5" />
                              {ownership}
                            </span>
                            <span className="text-slate-300">
                              <b className="font-mono text-white">{data.count}</b> ({pct}%) &bull; {data.acres.toFixed(1)} ac
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filtered parcel list */}
                  {parcelFilter !== 'All' && (
                    <div className="rounded-xl p-3.5 border border-white/[0.08] bg-white/[0.03] flex-1">
                      <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/10 text-[#E5E2D9]">
                        <span className="text-xs font-bold tracking-wide uppercase">
                          {parcelFilter} ({activeFilteredParcels.length}, {activeTotalAcres} ac)
                        </span>
                        <button type="button" onClick={() => setParcelFilter('All')} className="text-[10px] underline font-medium text-[#FF6B53]">
                          Clear
                        </button>
                      </div>
                      <div className="space-y-1.5 text-xs max-h-72 overflow-y-auto custom-scrollbar">
                        {activeFilteredParcels.slice(0, 60).map((p) => {
                          const isSelected = selectedParcel?.id === p.id;
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                onSelectParcel(p);
                                handleLocateParcelOnMap(p);
                              }}
                              className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#FF6B53]/20 border-[#FF6B53]/50 text-white'
                                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-white">{p.plotId}</span>
                                <span className="text-[11px] font-mono text-slate-400">{p.areaAcres} Acres</span>
                              </div>
                              <div className="text-[11px] mt-0.5 flex justify-between text-slate-500">
                                <span>{p.ownership}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Data quality mini card */}
                  {dataQualityAudit && (
                    <div className={`rounded-lg p-3 border transition-all ${isDarkMode ? 'bg-[#181512] border-[#2e2720]' : 'bg-[#fafaf9] border-[#e7e5e4]'}`}>
                      <div className={`text-[10px] font-bold tracking-wide uppercase mb-1.5 flex items-center gap-1 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>
                        <Info className="w-3 h-3" />
                        <span>Data Quality</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-bold text-emerald-500 font-mono">{dataQualityAudit.overallQualityScore}%</span>
                        <span className={isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}>
                          {dataQualityAudit.realRecordsCount.toLocaleString()} real &bull; {dataQualityAudit.provisionalRecordsCount.toLocaleString()} provisional &bull;{' '}
                          {dataQualityAudit.syntheticSampleRecordsCount.toLocaleString()} synthetic-sample
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Infrastructure Monitoring Tab Controls */}
              {activeTab === 'infra' && (
                <div className="space-y-3">
                  <div className={`rounded-lg p-3.5 shadow-md border ${isDarkMode ? 'bg-[#1a1714] border-[#2e2720]' : 'bg-[#fafaf9] border-[#e7e5e4]'}`}>
                    <div className={`text-[11px] font-bold tracking-wider uppercase mb-1 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>INTEGRATED GEOSPATIAL ASSETS</div>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1c1917]'}`}>{infrastructureAssets.length.toLocaleString()} Geocoded Facilities</div>
                    <div className={`grid grid-cols-2 gap-2 mt-2 pt-2 border-t text-xs ${isDarkMode ? 'border-[#26201a]' : 'border-[#e7e5e4]'}`}>
                      <div>
                        <span className={`block text-[10px] ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>VERIFIED REAL DATA</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{infraRealCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className={`block text-[10px] ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>DATA ACCURACY</span>
                        <span className="text-[#e5a93b] font-bold font-mono">100% Geocoded</span>
                      </div>
                    </div>
                    <p className={`text-[10px] mt-2 pt-2 border-t leading-snug ${isDarkMode ? 'border-[#26201a] text-[#736a5e]' : 'border-[#e7e5e4] text-[#a8a29e]'}`}>
                      Loaded from UDISE Plus (Schools), MoHFW Registry (Hospitals), AMTS/BRTS (Transit Hubs), and AMC Civic Infrastructure.
                    </p>
                  </div>

                  <div className={`rounded-lg p-2 border flex items-center gap-1.5 overflow-x-auto ${isDarkMode ? 'bg-[#181512] border-[#2e2720]' : 'bg-[#fafaf9] border-[#e7e5e4]'}`}>
                    <button
                      type="button"
                      onClick={() => setInfraTypeFilter('all')}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                        infraTypeFilter === 'all' ? 'bg-[#e5a93b] text-[#1a1613]' : isDarkMode ? 'bg-[#1c1916] text-[#a89f91]' : 'bg-white text-[#78716c] border border-[#e7e5e4]'
                      }`}
                    >
                      All ({infrastructureAssets.length})
                    </button>
                    {(Object.keys(INFRA_TYPE_LABEL) as InfrastructureAssetType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setInfraTypeFilter(type)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                          infraTypeFilter === type ? 'bg-[#e5a93b] text-[#1a1613]' : isDarkMode ? 'bg-[#1c1916] text-[#a89f91]' : 'bg-white text-[#78716c] border border-[#e7e5e4]'
                        }`}
                      >
                        {INFRA_TYPE_LABEL[type]} ({infraTypeCounts[type] || 0})
                      </button>
                    ))}
                  </div>

                  <div className={`rounded-lg p-3.5 shadow-md border ${isDarkMode ? 'bg-[#1a1714] border-[#2e2720]' : 'bg-[#fafaf9] border-[#e7e5e4]'}`}>
                    <div className={`text-[11px] font-bold tracking-wider uppercase mb-2 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>ASSET LIST</div>
                    <div className="space-y-1.5 max-h-[28rem] overflow-y-auto pr-1 custom-scrollbar">
                      {filteredInfrastructure.map((asset) => {
                        const Icon = INFRA_TYPE_ICON[asset.type];
                        return (
                          <div key={asset.id} className={`p-2 rounded border text-xs flex items-start justify-between gap-2 ${isDarkMode ? 'bg-[#151311] border-[#241e18]' : 'bg-white border-[#e7e5e4]'}`}>
                            <div className="flex items-start gap-2 min-w-0">
                              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isDarkMode ? 'text-[#e5a93b]' : 'text-[#b45309]'}`} />
                              <div className="min-w-0">
                                <div className={`font-bold truncate ${isDarkMode ? 'text-[#f4ede4]' : 'text-[#1c1917]'}`}>{asset.name}</div>
                                <div className={`text-[10px] ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>
                                  {INFRA_TYPE_LABEL[asset.type]}
                                  {asset.category ? ` • ${asset.category}` : ''}
                                  {asset.village ? ` • ${asset.village}` : ''}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                                asset.dataStatus === 'REAL' ? (isDarkMode ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-100 text-emerald-800') : isDarkMode ? 'bg-amber-950 text-amber-300' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {asset.dataStatus}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Site Suitability Tab Controls */}
              {activeTab === 'sites' && (
                <div className="space-y-3">
                  {/* Weight Sliders */}
                  <div className={`p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-[#181512] border-[#2e2720]' : 'bg-[#fafaf9] border-[#e7e5e4]'}`}>
                    <div className={`text-xs font-bold tracking-wider uppercase flex items-center gap-2 mb-3 ${isDarkMode ? 'text-[#f4ede4]' : 'text-[#1c1917]'}`}>
                      <Sliders className="w-4 h-4 text-[#e5a93b]" />
                      <span>SUITABILITY WEIGHTS</span>
                    </div>

                    <div className="space-y-3">
                      {(
                        [
                          { key: 'accessibility', label: 'Accessibility (distance to real facilities)' },
                          { key: 'landSuitability', label: 'Land Suitability (ownership & area)' },
                          { key: 'socioEconomicEquity', label: 'Socio-Economic Equity (district deprivation)' },
                        ] as { key: keyof SuitabilityWeights; label: string }[]
                      ).map((row) => (
                        <div key={row.key}>
                          <div className={`flex justify-between mb-1 text-xs ${isDarkMode ? 'text-[#d4cbbf]' : 'text-[#44403c]'}`}>
                            <span>{row.label}</span>
                            <span className="font-bold text-[#e5a93b]">{localWeights[row.key]}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={localWeights[row.key]}
                            onChange={(e) => setLocalWeights({ ...localWeights, [row.key]: parseInt(e.target.value, 10) })}
                            className="w-full accent-[#e5a93b]"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onRecalculateSuitability(localWeights)}
                      className="w-full mt-3 py-1.5 px-3 bg-[#e5a93b] hover:bg-[#d97706] text-[#141210] font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Recalculate Optimal Sites</span>
                    </button>
                  </div>

                  {/* Toast Feedback */}
                  {createdProjectToast && (
                    <div className="p-3 rounded-lg bg-emerald-950/90 border border-emerald-600/60 text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{createdProjectToast}</span>
                    </div>
                  )}

                  {/* SITE SUMMARY */}
                  <div className={`p-3.5 rounded-xl border transition-all ${isDarkMode ? 'bg-[#181512] border-[#2e2720]' : 'bg-[#fafaf9] border-[#e7e5e4]'}`}>
                    <div className={`text-xs font-bold tracking-wider uppercase mb-2.5 pb-1.5 border-b ${isDarkMode ? 'text-[#e5dfd7] border-[#282119]' : 'text-[#292524] border-[#e7e5e4]'}`}>
                      SITE SUMMARY
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className={`p-2.5 rounded-lg border ${isDarkMode ? 'bg-[#14110e] border-[#241e18]' : 'bg-white border-[#e7e5e4]'}`}>
                        <span className={`block text-[10px] font-semibold ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>Candidates</span>
                        <span className={`text-lg font-bold font-mono ${isDarkMode ? 'text-[#f4ede4]' : 'text-[#1c1917]'}`}>{candidateSites.length}</span>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${isDarkMode ? 'bg-[#14110e] border-[#241e18]' : 'bg-white border-[#e7e5e4]'}`}>
                        <span className={`block text-[10px] font-semibold ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>Shortlisted</span>
                        <span className={`text-lg font-bold font-mono ${isDarkMode ? 'text-[#f4ede4]' : 'text-[#1c1917]'}`}>{shortlistedSiteIds.length}</span>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${isDarkMode ? 'bg-[#14110e] border-[#241e18]' : 'bg-white border-[#e7e5e4]'}`}>
                        <span className={`block text-[10px] font-semibold ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>Best Score</span>
                        <span className="text-lg font-bold font-mono text-emerald-500">{candidateSites[0]?.compositeScore ?? '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* TOP RECOMMENDED SITES */}
                  <div className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${isDarkMode ? 'bg-[#181512] border-[#2e2720]' : 'bg-[#fafaf9] border-[#e7e5e4]'}`}>
                    <div className={`text-xs font-bold tracking-wider uppercase pb-1.5 border-b flex items-center justify-between ${isDarkMode ? 'text-[#e5dfd7] border-[#282119]' : 'text-[#292524] border-[#e7e5e4]'}`}>
                      <span>TOP RECOMMENDED SITES</span>
                      <span className="text-[10px] font-normal text-stone-400">Government land only</span>
                    </div>

                    <div className="space-y-2 text-xs max-h-80 overflow-y-auto custom-scrollbar">
                      {candidateSites.length === 0 && <div className="text-[#8e8577] italic py-2 text-center">No candidate sites computed yet.</div>}
                      {candidateSites.slice(0, 8).map((site) => {
                        const isSelected = selectedSite?.siteId === site.siteId;
                        const isShortlisted = shortlistedSiteIds.includes(site.siteId);
                        return (
                          <div
                            key={site.siteId}
                            className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? isDarkMode
                                  ? 'bg-[#282119] border-[#e5a93b] text-white shadow-sm'
                                  : 'bg-[#fef3c7] border-[#d97706] text-[#1c1917] shadow-sm'
                                : isDarkMode
                                ? 'bg-[#14110e] border-[#241e18] hover:bg-[#1a1714] text-[#d4cbbf]'
                                : 'bg-white border-[#e7e5e4] hover:bg-[#f5f5f4] text-[#44403c]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs">
                                  #{site.rank} {site.plotId}
                                </span>
                                <span className="font-mono text-xs font-semibold">{site.compositeScore}/100</span>
                              </div>
                              <div className="text-[10px] text-stone-400 truncate mt-0.5">
                                {site.landUse} &bull; {site.areaAcres} ac{site.nearestInfrastructure ? ` • ${site.nearestInfrastructure.distanceKm}km to ${site.nearestInfrastructure.name}` : ''}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleShortlistSite(site.siteId)}
                                title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                                className={`p-1.5 rounded border transition-colors ${
                                  isShortlisted ? 'bg-[#e5a93b]/20 border-[#e5a93b] text-[#e5a93b]' : isDarkMode ? 'border-[#382f25] text-[#8e8577] hover:text-white' : 'border-[#e7e5e4] text-[#78716c] hover:text-[#1c1917]'
                                }`}
                              >
                                <Bookmark className="w-3.5 h-3.5" fill={isShortlisted ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectSite(site);
                                  setFlyToLocationTarget({ lat: site.lat, lng: site.lng, zoom: 17, timestamp: Date.now() });
                                }}
                                className={`px-2.5 py-1.5 rounded text-xs font-bold transition-colors border cursor-pointer whitespace-nowrap ${
                                  isSelected
                                    ? 'bg-[#e5a93b] text-[#141210] border-[#e5a93b] shadow-sm'
                                    : isDarkMode
                                    ? 'bg-[#241f1a] hover:bg-[#332b22] text-[#f4ede4] border-[#382f25]'
                                    : 'bg-[#f5f5f4] hover:bg-[#e7e5e4] text-[#1c1917] border-[#d6d3d1]'
                                }`}
                              >
                                Locate
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SITE INTELLIGENCE */}
                  {activeSite && (
                    <div className={`p-3.5 rounded-xl border transition-all space-y-3 ${isDarkMode ? 'bg-[#181512] border-[#2e2720]' : 'bg-[#fafaf9] border-[#e7e5e4]'}`}>
                      <div className={`text-xs font-bold tracking-wider uppercase pb-1.5 border-b flex items-center justify-between ${isDarkMode ? 'text-[#e5dfd7] border-[#282119]' : 'text-[#292524] border-[#e7e5e4]'}`}>
                        <span>SITE INTELLIGENCE</span>
                        <span className="text-[10px] text-[#e5a93b] font-mono font-bold">{activeSite.plotId}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                        <div className={`p-2 rounded-lg border ${isDarkMode ? 'bg-[#14110e] border-[#241e18]' : 'bg-white border-[#e7e5e4]'}`}>
                          <span className={`block text-[10px] font-semibold ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>Accessibility</span>
                          <span className={`font-bold font-mono text-xs ${isDarkMode ? 'text-[#f4ede4]' : 'text-[#1c1917]'}`}>{activeSite.factors.accessibilityScore}/100</span>
                        </div>
                        <div className={`p-2 rounded-lg border ${isDarkMode ? 'bg-[#14110e] border-[#241e18]' : 'bg-white border-[#e7e5e4]'}`}>
                          <span className={`block text-[10px] font-semibold ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>Land Suitability</span>
                          <span className={`font-bold font-mono text-xs ${isDarkMode ? 'text-[#f4ede4]' : 'text-[#1c1917]'}`}>{activeSite.factors.landSuitabilityScore}/100</span>
                        </div>
                        <div className={`p-2 rounded-lg border ${isDarkMode ? 'bg-[#14110e] border-[#241e18]' : 'bg-white border-[#e7e5e4]'}`}>
                          <span className={`block text-[10px] font-semibold ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>Equity</span>
                          <span className={`font-bold font-mono text-xs ${isDarkMode ? 'text-[#f4ede4]' : 'text-[#1c1917]'}`}>{activeSite.factors.socioEconomicEquityScore}/100</span>
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border space-y-1.5 ${isDarkMode ? 'bg-[#14110e] border-[#2e2720]' : 'bg-white border-[#e7e5e4]'}`}>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#e5a93b]">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>WHY THIS SITE?</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#d4cbbf]' : 'text-[#44403c]'}`}>{activeSite.justificationSummary}</p>
                      </div>

                      <div className={`p-2.5 rounded-lg border text-[10px] leading-snug flex items-start gap-1.5 ${isDarkMode ? 'bg-amber-950/40 border-amber-800/50 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{activeSite.dataDisclaimer}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setCompareModalOpen(true)}
                          className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                            isDarkMode ? 'bg-[#14110e] hover:bg-[#241f1a] text-[#f4ede4] border-[#2e2720]' : 'bg-white hover:bg-[#f5f5f4] text-[#1c1917] border-[#e7e5e4]'
                          }`}
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#e5a93b]" />
                          <span>Compare</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenReportModal(activeSite || undefined)}
                          className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                            isDarkMode ? 'bg-[#14110e] hover:bg-[#241f1a] text-[#f4ede4] border-[#2e2720]' : 'bg-white hover:bg-[#f5f5f4] text-[#1c1917] border-[#e7e5e4]'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-[#e5a93b]" />
                          <span>Report</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateProjectModalOpen(true)}
                          className="py-2 px-2 rounded-lg text-xs font-bold bg-[#e5a93b] hover:bg-[#d97706] text-[#141210] transition-colors flex items-center justify-center gap-1.5 shadow cursor-pointer"
                        >
                          <Building className="w-3.5 h-3.5" />
                          <span>Create Project</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </aside>
          )}
        </div>

      {/* Selected Parcel Inspector Side Drawer */}
      {selectedParcel && activeTab !== 'explore' && activeTab !== 'analytics' && (
        <div
          className={`absolute ${activeTab === 'sites' ? 'right-[56%]' : 'right-84'} top-20 bottom-4 w-80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 z-[9999] overflow-y-auto flex flex-col justify-between bg-[#0B1220]/50 text-white`}
        >
          <div>
            <div className={`flex items-center justify-between pb-2 border-b ${isDarkMode ? 'border-[#282119]' : 'border-[#e7e5e4]'}`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#f4ede4]' : 'text-[#1c1917]'}`}>PARCEL INSPECTOR</span>
              <button
                type="button"
                onClick={() => onSelectParcel(null)}
                className={`p-1 rounded transition-colors ${isDarkMode ? 'text-[#a8a195] hover:text-white hover:bg-[#241f1a]' : 'text-[#78716c] hover:text-[#1c1917] hover:bg-[#f5f5f4]'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div>
                <span className={`text-[10px] uppercase block font-semibold ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>Plot ID</span>
                <span className={`font-mono text-sm font-bold ${isDarkMode ? 'text-[#f4ede4]' : 'text-[#1c1917]'}`}>{selectedParcel.plotId}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className={`text-[10px] uppercase block font-semibold ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>Area</span>
                  <span className={`font-bold text-sm ${isDarkMode ? 'text-[#f4ede4]' : 'text-[#1c1917]'}`}>{selectedParcel.areaAcres} Acres</span>
                  <span className={`text-[10px] block ${isDarkMode ? 'text-[#a89f91]' : 'text-[#78716c]'}`}>{selectedParcel.areaSqMeters.toLocaleString()} sq. m</span>
                </div>
                <div>
                  <span className={`text-[10px] uppercase block font-semibold ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>District</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-[#1c1917]'}`}>{selectedParcel.district}</span>
                </div>
              </div>

              <div className="pt-1">
                <span className={`text-[10px] uppercase block font-semibold ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>Land Use & Ownership</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${isDarkMode ? 'bg-[#221c17] text-[#d4cbbf] border-[#382d22]' : 'bg-[#f5f5f4] text-[#44403c] border-[#e7e5e4]'}`}>
                    {selectedParcel.landUse}
                  </span>
                  <span className={isDarkMode ? 'text-[#a89f91]' : 'text-[#78716c]'}>{selectedParcel.ownership}</span>
                </div>
              </div>

              <div className="pt-2">
                <span className={`text-[10px] uppercase block font-semibold mb-1 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>Sample Zone</span>
                <span className={isDarkMode ? 'text-[#d4cbbf]' : 'text-[#44403c]'}>{selectedParcel.sampleZoneLabel}</span>
              </div>

              <div className={`mt-2 p-2 rounded border text-[10px] leading-snug flex items-start gap-1.5 ${isDarkMode ? 'bg-amber-950/40 border-amber-800/50 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{selectedParcel.disclaimer}</span>
              </div>
            </div>
          </div>

          <div className={`pt-3 border-t flex gap-2 ${isDarkMode ? 'border-[#2e2720]' : 'border-[#e7e5e4]'}`}>
            <button
              type="button"
              onClick={() => handleLocateParcelOnMap(selectedParcel)}
              disabled={isLocatingParcel}
              className={`flex-1 py-1.5 px-3 font-bold rounded text-xs transition-all flex items-center justify-center gap-1.5 border shadow-sm ${
                isDarkMode ? 'bg-[#282119] hover:bg-[#382e23] active:bg-[#47392c] text-[#f4ede4] border-[#47392c]' : 'bg-[#1c1917] hover:bg-[#292524] active:bg-[#44403c] text-white border-[#1c1917]'
              } ${isLocatingParcel ? 'opacity-70 animate-pulse' : ''}`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocatingParcel ? 'animate-spin' : ''}`} />
              <span>{isLocatingParcel ? 'Centering Map...' : 'Locate on Map'}</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectParcel(null)}
              className={`px-3 py-1.5 rounded text-xs transition-colors border ${isDarkMode ? 'bg-[#181512] hover:bg-[#241f1a] text-[#a8a195] hover:text-white border-[#2e2720]' : 'bg-[#f5f5f4] hover:bg-[#e7e5e4] text-[#44403c] border-[#e7e5e4]'}`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* AI Assistant (Ask GLIS) Slide-over */}
      {aiOpen && (
        <div className="fixed inset-0 z-[10001] flex justify-end bg-black/50 backdrop-blur-xs" onClick={() => setAiOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`h-full w-full max-w-md border-l shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#181512] border-[#3d3328] text-[#f4ede4]' : 'bg-white border-[#e7e5e4] text-[#1c1917]'}`}
          >
            <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-[#2e2720]' : 'border-[#e7e5e4]'}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-[#e5a93b]" />
                <h3 className="font-bold text-sm">Ask GLIS &mdash; Spatial AI Assistant</h3>
              </div>
              <button type="button" onClick={() => setAiOpen(false)} className="p-1 rounded text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#a89f91]' : 'text-[#78716c]'}`}>
                Ask a question about {selectedDistrict.name} District's real Census/UDISE data, the sample cadastral zone, or infrastructure siting recommendations.
              </p>

              {aiLoading && (
                <div className="flex items-center gap-2 text-xs text-[#8e8577]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing&hellip;</span>
                </div>
              )}

              {aiResult && !aiLoading && (
                <div className={`p-3 rounded-lg border space-y-2 ${isDarkMode ? 'bg-[#14110e] border-[#2e2720]' : 'bg-[#fafaf9] border-[#e7e5e4]'}`}>
                  <p className="text-xs leading-relaxed">{aiResult.answer}</p>
                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-[#2e2720]/60">
                    <span className="flex items-center gap-1 text-[#8e8577]">
                      <Percent className="w-3 h-3" />
                      Confidence: <b className="text-[#e5a93b]">{Math.round((aiResult.confidence || 0) * 100)}%</b>
                    </span>
                  </div>
                  {aiResult.suggestedAction && (
                    <div className={`text-[11px] p-2 rounded ${isDarkMode ? 'bg-[#221c17] text-[#d4cbbf]' : 'bg-[#f5f5f4] text-[#44403c]'}`}>
                      <b>Suggested action:</b> {aiResult.suggestedAction}
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSendAiQuery} className={`p-3 border-t flex items-center gap-2 ${isDarkMode ? 'border-[#2e2720]' : 'border-[#e7e5e4]'}`}>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Where should we prioritize a new school?"
                className={`flex-1 px-3 py-2 rounded-lg border text-xs outline-none ${
                  isDarkMode ? 'bg-[#14110e] border-[#2e2720] text-[#f4ede4] focus:border-[#e5a93b]' : 'bg-white border-[#e7e5e4] text-[#1c1917] focus:border-[#d97706]'
                }`}
              />
              <button type="submit" disabled={aiLoading} className="p-2 rounded-lg bg-[#e5a93b] hover:bg-[#d97706] text-[#141210] disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Citizen Grievance Review Slide-over */}
      {grievanceOpen && (
        <div className="fixed inset-0 z-[10001] flex justify-end bg-black/50 backdrop-blur-xs" onClick={() => setGrievanceOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`h-full w-full max-w-lg border-l shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#181512] border-[#3d3328] text-[#f4ede4]' : 'bg-white border-[#e7e5e4] text-[#1c1917]'}`}
          >
            <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-[#2e2720]' : 'border-[#e7e5e4]'}`}>
              <div className="flex items-center gap-2">
                <Bell className="w-4.5 h-4.5 text-[#e5a93b]" />
                <h3 className="font-bold text-sm">Citizen Grievances ({citizenReports.length})</h3>
              </div>
              <button type="button" onClick={() => setGrievanceOpen(false)} className="p-1 rounded text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`flex items-center gap-1.5 p-3 border-b overflow-x-auto ${isDarkMode ? 'border-[#2e2720]' : 'border-[#e7e5e4]'}`}>
              <button
                type="button"
                onClick={() => setGrievanceStatusFilter('all')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                  grievanceStatusFilter === 'all' ? 'bg-[#e5a93b] text-[#1a1613]' : isDarkMode ? 'bg-[#1c1916] text-[#a89f91]' : 'bg-[#f5f5f4] text-[#78716c]'
                }`}
              >
                All
              </button>
              {REPORT_STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setGrievanceStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                    grievanceStatusFilter === s ? 'bg-[#e5a93b] text-[#1a1613]' : isDarkMode ? 'bg-[#1c1916] text-[#a89f91]' : 'bg-[#f5f5f4] text-[#78716c]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredGrievances.length === 0 ? (
                <div className="text-xs italic text-center py-8 text-[#8e8577]">No grievances match this filter.</div>
              ) : (
                filteredGrievances.map((report) => (
                  <div key={report.id} className={`p-3 rounded-lg border space-y-1.5 ${isDarkMode ? 'bg-[#14110e] border-[#2e2720]' : 'bg-[#fafaf9] border-[#e7e5e4]'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-xs">
                          {report.category as GrievanceCategory} &bull; {report.locationName}
                        </div>
                        <div className="text-[10px] text-[#8e8577]">
                          {report.citizenName} &bull; {report.submittedAt}
                        </div>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                          report.severity === 'Critical' || report.severity === 'High'
                            ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                            : report.severity === 'Medium'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                        }`}
                      >
                        {report.severity}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">{report.description}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <select
                        value={report.status}
                        onChange={(e) => onUpdateReportStatus(report.id, e.target.value as CitizenReport['status'])}
                        className={`text-[11px] px-2 py-1 rounded border font-semibold ${
                          isDarkMode ? 'bg-[#1c1916] border-[#332b22] text-[#f4ede4]' : 'bg-white border-[#e7e5e4] text-[#1c1917]'
                        }`}
                      >
                        {REPORT_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {report.officialNotes && <span className="text-[10px] text-[#8e8577] italic truncate">Notes: {report.officialNotes}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare Sites Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-3xl rounded-xl border p-5 shadow-2xl transition-all ${isDarkMode ? 'bg-[#181512] border-[#382e23] text-[#f4ede4]' : 'bg-white border-[#e7e5e4] text-[#1c1917]'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-[#382e23]/40 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#e5a93b]" />
                <h3 className="font-bold text-sm uppercase tracking-wider">
                  {shortlistedSiteIds.length > 0 ? 'Shortlisted Sites Comparison' : 'Top Candidate Sites Comparison'}
                </h3>
              </div>
              <button type="button" onClick={() => setCompareModalOpen(false)} className="p-1 rounded text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-[#2e2720] text-stone-400' : 'border-stone-200 text-stone-600'}`}>
                    <th className="py-2 px-3 font-semibold">Factor / Metric</th>
                    {compareList.map((s) => (
                      <th key={s.siteId} className="py-2 px-3 font-bold text-center">
                        <div>{s.plotId}</div>
                        <div className="text-[10px] font-mono font-semibold">{s.compositeScore}/100</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2720]/50">
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Land Use</td>
                    {compareList.map((s) => (
                      <td key={s.siteId} className="py-2.5 px-3 text-center">{s.landUse}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Ownership</td>
                    {compareList.map((s) => (
                      <td key={s.siteId} className="py-2.5 px-3 text-center">{s.ownership}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Area</td>
                    {compareList.map((s) => (
                      <td key={s.siteId} className="py-2.5 px-3 text-center font-mono">{s.areaAcres} Acres</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Accessibility</td>
                    {compareList.map((s) => (
                      <td key={s.siteId} className="py-2.5 px-3 text-center font-mono font-bold text-[#e5a93b]">{s.factors.accessibilityScore}/100</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Land Suitability</td>
                    {compareList.map((s) => (
                      <td key={s.siteId} className="py-2.5 px-3 text-center font-mono">{s.factors.landSuitabilityScore}/100</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Equity</td>
                    {compareList.map((s) => (
                      <td key={s.siteId} className="py-2.5 px-3 text-center font-mono text-emerald-400">{s.factors.socioEconomicEquityScore}/100</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Nearest Infrastructure</td>
                    {compareList.map((s) => (
                      <td key={s.siteId} className="py-2.5 px-3 text-center">
                        {s.nearestInfrastructure ? `${s.nearestInfrastructure.name} (${s.nearestInfrastructure.distanceKm}km)` : 'None found'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className={`py-1.5 px-4 rounded text-xs font-semibold border ${isDarkMode ? 'bg-[#241f1a] hover:bg-[#332b22] text-[#f4ede4] border-[#382f25]' : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'}`}
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal (session-local draft note, not persisted server-side) */}
      {createProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateProjectSubmit}
            className={`w-full max-w-md rounded-xl border p-5 shadow-2xl transition-all space-y-4 ${isDarkMode ? 'bg-[#181512] border-[#382e23] text-[#f4ede4]' : 'bg-white border-[#e7e5e4] text-[#1c1917]'}`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#382e23]/40">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-[#e5a93b]" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Draft Infrastructure Project</h3>
              </div>
              <button type="button" onClick={() => setCreateProjectModalOpen(false)} className="p-1 rounded text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-stone-400">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder={activeSite ? `${activeSite.landUse} Development at ${activeSite.plotId}` : 'New Infrastructure Project'}
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                  className={`w-full p-2 rounded border outline-none ${isDarkMode ? 'bg-[#12100e] border-[#2e2720] text-white focus:border-[#e5a93b]' : 'bg-white border-stone-300 text-stone-900 focus:border-amber-600'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-stone-400">Category</label>
                  <select
                    value={projectCategoryInput}
                    onChange={(e) => setProjectCategoryInput(e.target.value)}
                    className={`w-full p-2 rounded border outline-none ${isDarkMode ? 'bg-[#12100e] border-[#2e2720] text-white' : 'bg-white border-stone-300 text-stone-900'}`}
                  >
                    {PROJECT_CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-stone-400">Est. Budget (Cr, optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15"
                    value={projectBudgetInput}
                    onChange={(e) => setProjectBudgetInput(e.target.value)}
                    className={`w-full p-2 rounded border outline-none ${isDarkMode ? 'bg-[#12100e] border-[#2e2720] text-white focus:border-[#e5a93b]' : 'bg-white border-stone-300 text-stone-900 focus:border-amber-600'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-400">Target Parcel</label>
                <input
                  type="text"
                  readOnly
                  value={activeSite ? `${activeSite.plotId} • ${activeSite.landUse} • ${activeSite.areaAcres} ac • ${activeSite.district}` : 'No candidate site selected'}
                  className={`w-full p-2 rounded border opacity-80 cursor-not-allowed ${isDarkMode ? 'bg-[#12100e] border-[#2e2720] text-white' : 'bg-stone-100 border-stone-300 text-stone-900'}`}
                />
              </div>

              <p className={`text-[10px] leading-snug ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>
                This creates a session-local draft note only. There is no live project-intake API in this build - forward the details to your department's official pipeline to sanction it.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateProjectModalOpen(false)}
                className={`py-1.5 px-3 rounded text-xs font-semibold border ${isDarkMode ? 'bg-[#241f1a] hover:bg-[#332b22] text-[#f4ede4] border-[#382f25]' : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'}`}
              >
                Cancel
              </button>
              <button type="submit" className="py-1.5 px-4 rounded text-xs font-bold bg-[#e5a93b] hover:bg-[#d97706] text-[#141210] shadow transition-colors">
                Save Draft Note
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
