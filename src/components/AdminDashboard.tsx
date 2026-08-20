import React, { useEffect, useState } from 'react';
import { DataQualityAudit, DataStatus, Language, User } from '../types';
import { translations } from '../lib/translations';
import {
  ShieldCheck,
  Upload,
  Database,
  Users,
  CheckCircle2,
  AlertCircle,
  FileCode,
  HardDrive,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User | null;
  language: Language;
  dataQualityAudit?: DataQualityAudit | null;
}

interface HealthResponse {
  status: string;
  platform: string;
  version: string;
  dataSources: {
    ahmedabadParcels: string;
    ahmedabadInfrastructure: string;
    indiaStatesLoaded: number;
  };
}

interface IngestResult {
  success: boolean;
  message?: string;
  error?: string;
  recordsIngested?: number;
  validGeometryCount?: number;
  validGeometryPercent?: number;
  issues?: string[];
}

const DATA_STATUS_STYLES: Record<DataStatus, string> = {
  REAL: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40',
  PROVISIONAL: 'bg-amber-500/10 text-amber-400 border border-amber-500/40',
  SYNTHETIC_SAMPLE: 'bg-sky-500/10 text-sky-400 border border-sky-500/40',
};

const DATA_STATUS_LABELS: Record<DataStatus, string> = {
  REAL: 'REAL',
  PROVISIONAL: 'PROVISIONAL',
  SYNTHETIC_SAMPLE: 'SYNTHETIC SAMPLE',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  language,
  dataQualityAudit,
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'ingestion' | 'users' | 'quality' | 'health'>('ingestion');

  // ---- Upload / ingestion state (wired to the real /api/data-ingest endpoint) ----
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);

  // ---- Users state (real accounts from /api/users) ----
  const [usersList, setUsersList] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // ---- Data quality state (real audit from /api/data-quality) ----
  const [audit, setAudit] = useState<DataQualityAudit | null>(dataQualityAudit ?? null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // ---- Health / data sources state (real from /api/health) ----
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success) {
        setUsersList(data.users);
      } else {
        setUsersError('Failed to load registered users.');
      }
    } catch (err) {
      setUsersError('Could not reach the server to load registered users.');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadAudit = async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const response = await fetch('/api/data-quality');
      const data = await response.json();
      if (data.success) {
        setAudit(data.audit);
      } else {
        setAuditError('Failed to load the data quality audit.');
      }
    } catch (err) {
      setAuditError('Could not reach the server to load the data quality audit.');
    } finally {
      setAuditLoading(false);
    }
  };

  const loadHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data);
    } catch (err) {
      setHealthError('Could not reach the server to check system health.');
    } finally {
      setHealthLoading(false);
    }
  };

  // Fetch real data quality on mount regardless of active tab (App.tsx may also
  // pass a dataQualityAudit prop from a parallel refactor - fetching directly
  // here keeps this component correct either way).
  useEffect(() => {
    loadAudit();
    loadUsers();
    loadHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dataQualityAudit) setAudit(dataQualityAudit);
  }, [dataQualityAudit]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIngestResult(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      let geojson: any;
      try {
        geojson = JSON.parse(String(reader.result));
      } catch (err) {
        setIsUploading(false);
        setIngestResult({ success: false, error: `"${file.name}" is not valid JSON and could not be parsed.` });
        return;
      }

      try {
        const response = await fetch('/api/data-ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, geojson }),
        });
        const data: IngestResult = await response.json();
        setIngestResult(data);
      } catch (err) {
        setIngestResult({ success: false, error: 'Could not reach the server to validate this file.' });
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      setIngestResult({ success: false, error: `Could not read "${file.name}" from disk.` });
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full space-y-6 max-w-6xl mx-auto px-4 py-6 text-slate-100">
      {/* Admin Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              GLIS Master Administration & Security Center
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">System Administrator Console</h1>
          <p className="text-xs text-slate-400">Manage spatial pipeline, cadastral ingestion, and role-based access control</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-slate-200">ISO 27001 / NSDI Node</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('ingestion')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'ingestion' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Spatial Data Ingestion & Pipeline
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'users' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          User & Role Management
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('quality')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'quality' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Data Quality & Provenance
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'health' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          System & Data Sources Health
        </button>
      </div>

      {/* TAB: DATA INGESTION */}
      {activeTab === 'ingestion' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <span>Cadastral & Infrastructure Layer Upload Pipeline</span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload a GeoJSON FeatureCollection - it is parsed and validated on the server against real geometry
                checks (feature count, geometry type/coordinates presence). No result is simulated.
              </p>
            </div>

            {ingestResult && ingestResult.success && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>
                    <b>{uploadedFileName}</b>: {ingestResult.message}
                  </div>
                  <div className="text-emerald-300/80">
                    {ingestResult.recordsIngested ?? 0} feature(s) parsed - {ingestResult.validGeometryCount ?? 0} with
                    valid geometry ({ingestResult.validGeometryPercent ?? 0}%).
                  </div>
                  {ingestResult.issues && ingestResult.issues.length > 0 && (
                    <ul className="list-disc list-inside text-amber-300/90 pt-1">
                      {ingestResult.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {ingestResult && !ingestResult.success && (
              <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <b>{uploadedFileName}</b>: {ingestResult.error || ingestResult.message || 'Validation failed.'}
                </div>
              </div>
            )}

            {/* Drag & Drop Upload Zone */}
            <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-8 text-center space-y-3 bg-slate-950/50 transition-colors">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-200">
                  Select a GeoJSON (.json / .geojson) FeatureCollection
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  The file is read in-browser and posted to the server for real geometry validation
                </div>
              </div>

              <label className="inline-block px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all">
                <span>{isUploading ? 'Validating Geometry...' : 'Browse & Ingest Layer'}</span>
                <input
                  type="file"
                  accept=".json,.geojson"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB: USERS */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>Registered Users & Role Permissions</span>
            </h2>
            <button
              type="button"
              onClick={loadUsers}
              disabled={usersLoading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {usersError && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {usersError}
            </div>
          )}

          {usersLoading && usersList.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading registered accounts...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">District / State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-200">{u.name}</td>
                      <td className="p-3 text-slate-400 font-mono">{u.email}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-amber-400 uppercase">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">
                        {[u.district, u.state].filter(Boolean).join(', ') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[10px] text-slate-500 pt-3">
                {usersList.length} account(s) currently registered in-memory on the server.
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: DATA QUALITY & PROVENANCE */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          {auditError && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {auditError}
            </div>
          )}

          {auditLoading && !audit ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading data quality audit...
            </div>
          ) : audit ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Overall Quality Score</div>
                  <div className="text-2xl font-black text-amber-400">{audit.overallQualityScore}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Total Records Loaded</div>
                  <div className="text-2xl font-black text-white">{audit.totalRecordsLoaded.toLocaleString()}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Real Records</div>
                  <div className="text-2xl font-black text-emerald-400">{audit.realRecordsCount.toLocaleString()}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Provisional Records</div>
                  <div className="text-2xl font-black text-amber-400">{audit.provisionalRecordsCount.toLocaleString()}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Synthetic Sample Records</div>
                  <div className="text-2xl font-black text-sky-400">{audit.syntheticSampleRecordsCount.toLocaleString()}</div>
                </div>
              </div>

              {audit.schoolCoordinatesFlaggedForReview > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {audit.schoolCoordinatesFlaggedForReview} school coordinate(s) flagged for manual review.
                </div>
              )}

              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white">Source Breakdown</h2>
                  <span className="text-[10px] text-slate-500">Last computed: {audit.lastComputedAt}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Source</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Records</th>
                        <th className="p-3">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {audit.sourceBreakdown.map((s, i) => (
                        <tr key={i} className="hover:bg-slate-800/40 align-top">
                          <td className="p-3 font-bold text-slate-200 whitespace-nowrap">{s.source}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${DATA_STATUS_STYLES[s.dataStatus]}`}>
                              {DATA_STATUS_LABELS[s.dataStatus]}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 whitespace-nowrap">{s.recordCount.toLocaleString()}</td>
                          <td className="p-3 text-slate-400">{s.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 p-4">No data quality audit available.</div>
          )}
        </div>
      )}

      {/* TAB: HEALTH / DATA SOURCES */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          {healthError && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {healthError}
            </div>
          )}

          {healthLoading && !health ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking server health...
            </div>
          ) : health ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Ahmedabad Cadastral Parcels
                </div>
                <div className="text-xl font-bold text-sky-400">{health.dataSources.ahmedabadParcels}</div>
                <div className="text-[10px] text-slate-500">Synthetic-sample cadastral grid, disclosed as such</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  Infrastructure Points Loaded
                </div>
                <div className="text-xl font-bold text-emerald-400">{health.dataSources.ahmedabadInfrastructure}</div>
                <div className="text-[10px] text-slate-500">UDISE schools (real) + curated seed points (provisional)</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  India States Loaded
                </div>
                <div className="text-xl font-bold text-amber-400">{health.dataSources.indiaStatesLoaded}</div>
                <div className="text-[10px] text-slate-500">
                  Platform {health.platform} v{health.version} - status: {health.status}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 p-4">No health data available.</div>
          )}

          <button
            type="button"
            onClick={loadHealth}
            disabled={healthLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
            Re-check Data Sources
          </button>
        </div>
      )}
    </div>
  );
};
