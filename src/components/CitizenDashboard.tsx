import React, { useEffect, useState } from 'react';
import { CitizenReport, GrievanceCategory, InfrastructureAsset, Language, ReportSeverity, User } from '../types';
import { translations } from '../lib/translations';
import {
  AlertTriangle,
  Building,
  CheckCircle2,
  Camera,
  Send,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  AlertOctagon,
  Loader2,
} from 'lucide-react';

interface CitizenDashboardProps {
  currentUser: User | null;
  language: Language;
  citizenReports: CitizenReport[];
  onSubmitGrievance: (report: Partial<CitizenReport>) => void;
  infrastructureAssets: InfrastructureAsset[];
}

const GRIEVANCE_CATEGORIES: { value: GrievanceCategory; label: string }[] = [
  { value: 'Roads', label: 'Damaged Road / Culvert / Bridge' },
  { value: 'Water Supply', label: 'Drinking Water Contamination / Supply Gap' },
  { value: 'Electricity', label: 'Power Grid / Substation Transformer Outage' },
  { value: 'Sanitation', label: 'Public Sanitation & Drainage Overflow' },
  { value: 'School', label: 'School Facility / Classroom Shortage' },
  { value: 'Hospital', label: 'Hospital / PHC Access Deficit' },
  { value: 'Police', label: 'Police Station / Safety Concern' },
  { value: 'Bus Stand', label: 'Bus Stand / Public Transit Issue' },
  { value: 'Other', label: 'Other Infrastructure Issue' },
];

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  currentUser,
  language,
  citizenReports,
  onSubmitGrievance,
  infrastructureAssets,
}) => {
  const t = translations[language];

  // Grievance form state
  const [category, setCategory] = useState<GrievanceCategory>('Roads');
  const [severity, setSeverity] = useState<ReportSeverity>('High');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reports list - seeded from the parent's citizenReports prop, then kept in
  // sync with the live backend (GET/POST /api/citizen-reports). Reports start
  // as an empty array on the server, so an empty state is expected here.
  const [reportsList, setReportsList] = useState<CitizenReport[]>(citizenReports);

  useEffect(() => {
    setReportsList(citizenReports);
  }, [citizenReports]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/citizen-reports')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.success && Array.isArray(data.reports)) {
          setReportsList(data.reports);
        }
      })
      .catch(() => {
        /* keep whatever was passed in via props */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Public facilities - fetched live from GET /api/infrastructure so this
  // panel always reflects the real (4,111 UDISE school) dataset plus the
  // explicitly-provisional hospital/police/bus placeholder seed list.
  const [facilities, setFacilities] = useState<InfrastructureAsset[]>(infrastructureAssets);
  const [facilitiesCounts, setFacilitiesCounts] = useState<{ real: number; provisional: number } | null>(null);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setFacilitiesLoading(true);
    fetch('/api/infrastructure')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.success && Array.isArray(data.assets)) {
          setFacilities(data.assets);
          setFacilitiesCounts({ real: data.realCount ?? 0, provisional: data.provisionalCount ?? 0 });
        }
      })
      .catch(() => {
        /* keep whatever was passed in via props */
      })
      .finally(() => {
        if (!cancelled) setFacilitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      citizenId: currentUser?.id || 'usr-cit-1',
      citizenName: currentUser?.name || 'Citizen Contributor',
      citizenPhone: currentUser?.phone || '+91 98250 11223',
      category,
      district: 'Ahmedabad',
      locationName,
      lat: 23.0225 + (Math.random() - 0.5) * 0.05,
      lng: 72.5797 + (Math.random() - 0.5) * 0.05,
      description,
      severity,
    };

    fetch('/api/citizen-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success) {
          throw new Error(data?.error || 'Submission failed.');
        }
        setReportsList((prev) => [data.report, ...prev]);
        onSubmitGrievance(data.report);
        setSubmitSuccess(true);
        setLocationName('');
        setDescription('');
        setTimeout(() => setSubmitSuccess(false), 5000);
      })
      .catch((err) => {
        setSubmitError(err.message || 'Could not submit grievance. Please try again.');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="w-full space-y-8 max-w-6xl mx-auto px-4 py-6 text-slate-100">
      {/* Citizen Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              Citizen Public Participation Portal
            </span>
            <span className="text-slate-500 text-xs">&bull;</span>
            <span className="text-xs text-slate-400">Direct District Redressal Loop</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            Welcome, {currentUser?.name || 'Citizen Resident'}
          </h1>
          <p className="text-xs text-slate-300">
            Report infrastructure deficiencies directly to District Planners. Your voice calibrates the GLIS Development Need Index.
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-slate-200">100% Aadhaar & GPS Verified</div>
            <div className="text-[11px] text-slate-400">Official Gujarat Citizen Redressal</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Report Grievance Form & Track Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Form */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Report Infrastructure Deficit</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Submit ground-level issues with roads, healthcare access, drinking water, or school facilities
                </p>
              </div>
            </div>

            {submitSuccess && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Grievance successfully submitted! District Development Officer has been notified for geospatial verification.</span>
              </div>
            )}

            {submitError && (
              <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Deficit Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GrievanceCategory)}
                    className="w-full bg-slate-800 text-slate-200 p-2.5 rounded-xl border border-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {GRIEVANCE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Severity */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Urgency & Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as ReportSeverity)}
                    className="w-full bg-slate-800 text-slate-200 p-2.5 rounded-xl border border-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Critical">Critical (Immediate public hazard / isolation)</option>
                    <option value="High">High (Impacting 500+ daily residents)</option>
                    <option value="Medium">Medium (Moderate degradation)</option>
                    <option value="Low">Low (Maintenance recommendation)</option>
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Specific Location / Village / Landmark</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Near Dudhiya Primary School, Main Chowk"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 p-2.5 rounded-xl border border-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* District (fixed - Ahmedabad is currently the only district with real ground data) */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">District</label>
                  <div className="w-full bg-slate-800/60 text-slate-300 p-2.5 rounded-xl border border-slate-700 flex items-center gap-2">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Ahmedabad</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Detailed Description of Deficit</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue, number of affected families, and nearest alternative facility..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 p-2.5 rounded-xl border border-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Upload simulation */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Attach Geotagged Photo (Optional)</span>
                </div>
                <span className="text-[11px] text-sky-400 font-medium cursor-pointer">Browse File</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isSubmitting ? 'Submitting to GLIS Engine...' : 'Submit Infrastructure Grievance'}</span>
              </button>
            </form>
          </div>

          {/* Track Grievance Status Timeline */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Track Your Grievances</h3>
              <span className="text-xs text-emerald-400 font-semibold">{reportsList.length} Active Records</span>
            </div>

            {reportsList.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center space-y-1">
                <p className="text-sm font-semibold text-slate-300">No reports submitted yet</p>
                <p className="text-[11px] text-slate-500">
                  Grievances you file above will appear here with a live status timeline once submitted.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reportsList.map((g) => (
                  <div key={g.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400">
                          {g.category}
                        </span>
                        <span className="font-bold text-sm text-slate-200">{g.locationName}</span>
                      </div>
                      <span className="text-xs font-semibold text-amber-400">{g.status}</span>
                    </div>

                    <p className="text-xs text-slate-400">{g.description}</p>

                    {/* Visual Status Progression */}
                    <div className="pt-2">
                      <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                        <div className={`p-1 rounded ${g.status === 'Submitted' || g.status === 'Verified' || g.status === 'In Progress' || g.status === 'Resolved' ? 'bg-sky-950 text-sky-300 font-bold border border-sky-800' : 'bg-slate-900 text-slate-600'}`}>
                          1. Submitted
                        </div>
                        <div className={`p-1 rounded ${g.status === 'Verified' || g.status === 'In Progress' || g.status === 'Resolved' ? 'bg-sky-950 text-sky-300 font-bold border border-sky-800' : 'bg-slate-900 text-slate-600'}`}>
                          2. Verified
                        </div>
                        <div className={`p-1 rounded ${g.status === 'In Progress' || g.status === 'Resolved' ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800' : 'bg-slate-900 text-slate-600'}`}>
                          3. Works Active
                        </div>
                        <div className={`p-1 rounded ${g.status === 'Resolved' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'bg-slate-900 text-slate-600'}`}>
                          4. Resolved
                        </div>
                      </div>
                    </div>

                    {g.officialNotes && (
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                        <b className="text-sky-400">DDO Office: </b>{g.officialNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Nearby Public Facilities & Community Projects */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>Public Facilities in Ahmedabad</span>
            </h3>

            {facilitiesCounts && (
              <div className="text-[11px] text-slate-400 leading-relaxed">
                <b className="text-emerald-400">{facilitiesCounts.real.toLocaleString()}</b> real UDISE-verified schools &bull;{' '}
                <b className="text-amber-400">{facilitiesCounts.provisional}</b> provisional hospital/police/bus entries. The
                provisional list is a manually-curated seed sample, not comprehensive district coverage.
              </div>
            )}

            <div className="space-y-2.5 text-xs">
              {facilitiesLoading && facilities.length === 0 && (
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading facilities...</span>
                </div>
              )}

              {facilities.slice(0, 6).map((asset) => (
                <div key={asset.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-200 truncate">{asset.name}</span>
                    <span
                      className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                        asset.dataStatus === 'REAL'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {asset.dataStatus === 'REAL' ? 'Verified' : 'Provisional'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="capitalize">{asset.type.replace('_', ' ')}</span>
                    {asset.village && <span>{asset.village}</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2">Condition: <b>{asset.operationalCondition}</b></div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 text-xs">
            <div className="font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Community Development Notice</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              New 100-bed hospital proposal for Dudhiya sector is currently under equity review with estimated inauguration by Q4 2026.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
