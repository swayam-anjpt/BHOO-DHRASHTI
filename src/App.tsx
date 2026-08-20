import React, { useState, useEffect, useCallback } from 'react';
import {
  AuditLog,
  CandidateSiteScore,
  CitizenReport,
  DataQualityAudit,
  DistrictMetrics,
  InfrastructureAsset,
  Language,
  Parcel,
  SuitabilityWeights,
  User,
  UserRole,
} from './types';
import { DEFAULT_WEIGHTS } from './services/scoringEngine';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { OfficialDashboard } from './components/OfficialDashboard';
import { CitizenDashboard } from './components/CitizenDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal, AuthModalMode } from './components/AuthModal';
import { ReportModal } from './components/ReportModal';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('official');
  const [activeView, setActiveView] = useState<string>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('create-account');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [dossierSite, setDossierSite] = useState<CandidateSiteScore | null>(null);

  // Real data, loaded from the backend on mount
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [districts, setDistricts] = useState<DistrictMetrics[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictMetrics | null>(null);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [infrastructureAssets, setInfrastructureAssets] = useState<InfrastructureAsset[]>([]);
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>([]);
  const [dataQualityAudit, setDataQualityAudit] = useState<DataQualityAudit | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [weights, setWeights] = useState<SuitabilityWeights>(DEFAULT_WEIGHTS);
  const [candidateSites, setCandidateSites] = useState<CandidateSiteScore[]>([]);
  const [selectedSite, setSelectedSite] = useState<CandidateSiteScore | null>(null);

  const refreshAuditLogs = useCallback(() => {
    fetch('/api/audit-logs')
      .then((r) => r.json())
      .then((d) => d.success && setAuditLogs(d.logs))
      .catch(() => {});
  }, []);

  const recalculateSuitability = useCallback((newWeights: SuitabilityWeights) => {
    fetch('/api/suitability/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weights: newWeights }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCandidateSites(d.candidateSites);
          setSelectedSite(d.candidateSites[0] || null);
        }
      })
      .catch(() => {});
  }, []);

  // Initial data load from the real backend
  useEffect(() => {
    fetch('/api/users').then((r) => r.json()).then((d) => d.success && setRegisteredUsers(d.users)).catch(() => {});
    fetch('/api/parcels').then((r) => r.json()).then((d) => d.success && setParcels(d.parcels)).catch(() => {});
    fetch('/api/infrastructure').then((r) => r.json()).then((d) => d.success && setInfrastructureAssets(d.assets)).catch(() => {});
    fetch('/api/citizen-reports').then((r) => r.json()).then((d) => d.success && setCitizenReports(d.reports)).catch(() => {});
    fetch('/api/data-quality').then((r) => r.json()).then((d) => d.success && setDataQualityAudit(d.audit)).catch(() => {});
    refreshAuditLogs();
    fetch('/api/districts')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.districts.length > 0) {
          setDistricts(d.districts);
          setSelectedDistrict(d.districts[0]);
        }
      })
      .catch(() => {});
    recalculateSuitability(DEFAULT_WEIGHTS);
  }, [recalculateSuitability, refreshAuditLogs]);

  const handleRecalculateSuitability = (newWeights: SuitabilityWeights) => {
    setWeights(newWeights);
    recalculateSuitability(newWeights);
  };

  const handleSubmitGrievance = (reportData: Partial<CitizenReport>) => {
    fetch('/api/citizen-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizenId: currentUser?.id,
        citizenName: reportData.citizenName || currentUser?.name,
        citizenPhone: reportData.citizenPhone,
        category: reportData.category || 'Other',
        district: reportData.district || 'Ahmedabad',
        locationName: reportData.locationName,
        lat: reportData.lat,
        lng: reportData.lng,
        description: reportData.description,
        severity: reportData.severity || 'Medium',
        photoUrl: reportData.photoUrl,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCitizenReports((prev) => [d.report, ...prev]);
          refreshAuditLogs();
        }
      })
      .catch(() => {});
  };

  const handleUpdateReportStatus = (id: string, status: CitizenReport['status'], notes?: string) => {
    fetch(`/api/citizen-reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, officialNotes: notes, officialName: currentUser?.name }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCitizenReports((prev) => prev.map((r) => (r.id === id ? d.report : r)));
          refreshAuditLogs();
        }
      })
      .catch(() => {});
  };

  const handleAskGlisQuery = async (queryText: string) => {
    try {
      const response = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText }),
      });
      if (response.ok) return await response.json();
    } catch (e) {
      console.warn('Ask GLIS request failed:', e);
    }
    return { answer: 'Unable to reach the GLIS analytics service right now. Please try again shortly.', confidence: 0 };
  };

  const handleOpenReportModal = (site?: CandidateSiteScore) => {
    setDossierSite(site || candidateSites[0] || null);
    setReportModalOpen(true);
  };

  const handleOpenAuthModalWithMode = (mode: AuthModalMode) => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    const matched = registeredUsers.find((u) => u.role === newRole);
    if (matched) setCurrentUser(matched);
    if (newRole === 'official') setActiveView('dashboard');
    else if (newRole === 'citizen') setActiveView('citizen');
    else setActiveView('admin');
  };

  const handleOpenAuth = (role?: UserRole) => {
    if (role === 'official') setAuthModalMode('official-signin');
    else if (role === 'citizen') setAuthModalMode('citizen-signin');
    else setAuthModalMode('create-account');
    setAuthModalOpen(true);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    if (user.role === 'official') setActiveView('dashboard');
    else if (user.role === 'citizen') setActiveView('citizen');
    else setActiveView('admin');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('home');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? 'dark bg-[#100e0c] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {activeView !== 'home' && activeView !== 'dashboard' && (
        <Header
          currentUser={currentUser}
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
          language={language}
          onLanguageChange={setLanguage}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
          activeView={activeView}
          onNavigate={setActiveView}
        />
      )}

      <main className="flex-1 flex flex-col">
        {activeView === 'home' && (
          <LandingPage
            language={language}
            onExplore={() => {
              setCurrentRole('official');
              setActiveView('dashboard');
            }}
            onSelectRole={(r) => handleRoleChange(r)}
            onOpenAuthModal={handleOpenAuthModalWithMode}
            onLogin={handleLogin}
          />
        )}

        {activeView === 'dashboard' && selectedDistrict && (
          <OfficialDashboard
            currentUser={currentUser}
            language={language}
            districts={districts}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
            parcels={parcels}
            selectedParcel={selectedParcel}
            onSelectParcel={setSelectedParcel}
            infrastructureAssets={infrastructureAssets}
            candidateSites={candidateSites}
            selectedSite={selectedSite}
            onSelectSite={setSelectedSite}
            citizenReports={citizenReports}
            onUpdateReportStatus={handleUpdateReportStatus}
            dataQualityAudit={dataQualityAudit}
            auditLogs={auditLogs}
            weights={weights}
            onRecalculateSuitability={handleRecalculateSuitability}
            onOpenReportModal={handleOpenReportModal}
            onAskGlisQuery={handleAskGlisQuery}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            onLogout={handleLogout}
            onNavigate={setActiveView}
          />
        )}

        {activeView === 'citizen' && (
          <CitizenDashboard currentUser={currentUser} language={language} citizenReports={citizenReports} onSubmitGrievance={handleSubmitGrievance} infrastructureAssets={infrastructureAssets} />
        )}

        {activeView === 'admin' && <AdminDashboard currentUser={currentUser} language={language} dataQualityAudit={dataQualityAudit} />}
      </main>

      {activeView !== 'home' && activeView !== 'dashboard' && <Footer language={language} />}

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onLogin={handleLogin} initialMode={authModalMode} language={language} />

      {reportModalOpen && dossierSite && selectedDistrict && (
        <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} site={dossierSite} district={selectedDistrict} weights={weights} candidateSites={candidateSites} language={language} />
      )}
    </div>
  );
};

export default App;
