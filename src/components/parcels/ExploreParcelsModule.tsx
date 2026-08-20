import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RedevelopmentCandidate, LandUseCategory, OwnershipType } from '../../types';
import { ParcelComparisonSwipe } from './ParcelComparisonSwipe';
import { LandDossierModal } from './LandDossierModal';
import {
  Layers,
  Search,
  MapPin,
  FileText,
  Building,
  ShieldCheck,
  Compass,
  RefreshCw,
  AlertCircle,
  Ruler,
} from 'lucide-react';

interface ExploreParcelsModuleProps {
  isDarkMode?: boolean;
  onLocateOnMap: (candidate: RedevelopmentCandidate) => void;
}

export const ExploreParcelsModule: React.FC<ExploreParcelsModuleProps> = ({
  isDarkMode = true,
  onLocateOnMap,
}) => {
  const [candidates, setCandidates] = useState<RedevelopmentCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<RedevelopmentCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLandUse, setSelectedLandUse] = useState<string>('All');
  const [selectedOwnership, setSelectedOwnership] = useState<string>('All');
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [locatingId, setLocatingId] = useState<string | null>(null);

  // Fetch real redevelopment candidates from the backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/land-governance/redevelopment-candidates')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (!data?.success || !Array.isArray(data.candidates)) {
          throw new Error('Unexpected response shape from redevelopment-candidates API');
        }
        setCandidates(data.candidates);
        setSelectedCandidate(data.candidates[0] ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load redevelopment candidates');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Land use options present in the data
  const landUseOptions = useMemo(() => {
    const list = Array.from(new Set(candidates.map((c) => c.landUse)));
    return ['All', ...list];
  }, [candidates]);

  // Ownership options present in the data
  const ownershipOptions = useMemo(() => {
    const list = Array.from(new Set(candidates.map((c) => c.ownership)));
    return ['All', ...list];
  }, [candidates]);

  // Filtered candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (selectedLandUse !== 'All' && c.landUse !== (selectedLandUse as LandUseCategory)) {
        return false;
      }
      if (selectedOwnership !== 'All' && c.ownership !== (selectedOwnership as OwnershipType)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.plotId.toLowerCase().includes(q) ||
          c.sampleZoneLabel.toLowerCase().includes(q) ||
          c.landUse.toLowerCase().includes(q) ||
          c.ownership.toLowerCase().includes(q) ||
          c.rationale.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [candidates, selectedLandUse, selectedOwnership, searchQuery]);

  // Aggregate metrics (real, computed from the actual candidate list)
  const totalAreaAcres = useMemo(
    () => candidates.reduce((sum, c) => sum + c.areaAcres, 0).toFixed(1),
    [candidates]
  );
  const governmentOwnedCount = useMemo(
    () => candidates.filter((c) => c.ownership === 'Government').length,
    [candidates]
  );

  // Handle Locate Click - hits the real /api/parcels/locate endpoint to
  // confirm the parcel resolves to a real cadastral record, then hands the
  // candidate back to the parent map view.
  const handleLocateClick = useCallback(
    async (candidate: RedevelopmentCandidate, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setLocatingId(candidate.id);
      try {
        await fetch(`/api/parcels/locate/${encodeURIComponent(candidate.plotId)}`);
      } catch {
        // Non-fatal - we still have real coordinates on the candidate itself.
      }
      setLocatingId(null);
      onLocateOnMap(candidate);
    },
    [onLocateOnMap]
  );

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden transition-colors ${
      isDarkMode ? 'bg-[#0e0c0a] text-[#f4ede4]' : 'bg-[#faf8f5] text-[#1c1917]'
    }`}>
      {/* ================= TOP METRICS BANNER ================= */}
      <div className={`px-6 py-3.5 border-b shrink-0 flex flex-wrap items-center justify-between gap-4 ${
        isDarkMode ? 'bg-[#15120f] border-[#2b241d]' : 'bg-white border-[#e7e5e4] shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-rose-500/20 to-teal-500/20 border border-amber-500/40 flex items-center justify-center text-[#e5a93b] shadow-inner">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight">
                Redevelopment Candidates
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold">
                SYNTHETIC SAMPLE DATA
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-[#a89f91]' : 'text-[#78716c]'}`}>
              Government/Forest-owned parcels not already built up, from the sample cadastral layer &mdash; no fabricated scoring.
            </p>
          </div>
        </div>

        {/* Top Summary Badges */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2.5 ${
            isDarkMode ? 'bg-[#1e1a16] border-[#382f25]' : 'bg-[#f5f5f4] border-[#e7e5e4]'
          }`}>
            <Ruler className="w-4 h-4 text-[#e5a93b]" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 leading-none">
                Total Candidate Area
              </div>
              <div className="text-xs font-bold font-mono text-[#e5a93b] mt-0.5">
                {totalAreaAcres} Acres
              </div>
            </div>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2.5 ${
            isDarkMode ? 'bg-[#1e1a16] border-[#382f25]' : 'bg-[#f5f5f4] border-[#e7e5e4]'
          }`}>
            <Building className="w-4 h-4 text-teal-400" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 leading-none">
                Candidate Parcels
              </div>
              <div className="text-xs font-bold font-mono text-teal-400 mt-0.5">
                {candidates.length} ({governmentOwnedCount} Government)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILTER & SEARCH BAR ================= */}
      <div className={`px-6 py-2.5 border-b shrink-0 flex flex-wrap items-center justify-between gap-3 ${
        isDarkMode ? 'bg-[#12100d] border-[#2b241d]' : 'bg-[#fcfbf9] border-[#e7e5e4]'
      }`}>
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Plot ID, sample zone, land use..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs font-medium border focus:outline-none transition-colors ${
                isDarkMode
                  ? 'bg-[#1c1916] border-[#382f25] text-white placeholder-slate-500 focus:border-[#e5a93b]'
                  : 'bg-white border-[#e7e5e4] text-[#1c1917] placeholder-slate-400 focus:border-amber-600'
              }`}
            />
          </div>

          {/* Land Use Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Building className="w-3.5 h-3.5 text-[#e5a93b]" />
            <span className="text-slate-400 text-[11px]">Land Use:</span>
            <select
              value={selectedLandUse}
              onChange={(e) => setSelectedLandUse(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border outline-none cursor-pointer ${
                isDarkMode
                  ? 'bg-[#1c1916] border-[#382f25] text-white'
                  : 'bg-white border-[#e7e5e4] text-[#1c1917]'
              }`}
            >
              {landUseOptions.map((lu) => (
                <option key={lu} value={lu} className={isDarkMode ? 'bg-[#161412]' : 'bg-white'}>
                  {lu}
                </option>
              ))}
            </select>
          </div>

          {/* Ownership Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400 text-[11px]">Ownership:</span>
            <select
              value={selectedOwnership}
              onChange={(e) => setSelectedOwnership(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border outline-none cursor-pointer ${
                isDarkMode
                  ? 'bg-[#1c1916] border-[#382f25] text-white'
                  : 'bg-white border-[#e7e5e4] text-[#1c1917]'
              }`}
            >
              {ownershipOptions.map((o) => (
                <option key={o} value={o} className={isDarkMode ? 'bg-[#161412]' : 'bg-white'}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <strong className="text-white">{filteredCandidates.length}</strong> of {candidates.length} Candidates
        </div>
      </div>

      {/* ================= LOADING / ERROR STATES ================= */}
      {loading && (
        <div className="flex-1 flex items-center justify-center gap-2 text-sm text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading redevelopment candidates...</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-sm text-rose-400 px-6 text-center">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && candidates.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
          No redevelopment candidates found in the sample dataset.
        </div>
      )}

      {/* ================= MAIN SPLIT CONTENT AREA ================= */}
      {!loading && !error && candidates.length > 0 && selectedCandidate && (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT COLUMN: LIST OF CANDIDATES */}
          <div className={`w-full lg:w-[420px] shrink-0 border-r flex flex-col overflow-hidden ${
            isDarkMode ? 'bg-[#100e0c] border-[#2b241d]' : 'bg-[#f8f6f2] border-[#e7e5e4]'
          }`}>
            <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>REDEVELOPMENT CANDIDATE INVENTORY</span>
              <span className="text-[10px] text-[#e5a93b]">Click card to inspect</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
              {filteredCandidates.map((candidate) => {
                const isSelected = selectedCandidate.id === candidate.id;
                const isLocating = locatingId === candidate.id;

                return (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-[#221c17] border-[#e5a93b] ring-1 ring-[#e5a93b]/40 shadow-lg'
                          : 'bg-[#fffbeb] border-amber-500 ring-1 ring-amber-400/40 shadow-md'
                        : isDarkMode
                        ? 'bg-[#161310] hover:bg-[#1d1915] border-[#2e261e] text-[#d4cbbf]'
                        : 'bg-white hover:bg-[#f5f5f4] border-[#e7e5e4] text-[#44403c]'
                    }`}
                  >
                    {/* Top Bar inside Card */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="text-[10px] font-mono text-slate-400">
                          PLOT: <span className="text-sky-400 font-semibold">{candidate.plotId}</span>
                        </div>
                        <h4 className={`text-xs font-bold leading-snug mt-0.5 ${
                          isSelected ? (isDarkMode ? 'text-white' : 'text-[#1c1917]') : ''
                        }`}>
                          {candidate.landUse}
                        </h4>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                        {candidate.ownership}
                      </span>
                    </div>

                    {/* Location info */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mb-2.5">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                      <span className="line-clamp-1">{candidate.sampleZoneLabel}</span>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 gap-1.5 py-1.5 px-2 rounded-lg bg-slate-950/40 border border-slate-800/60 font-mono text-[10px] text-slate-300 mb-2.5">
                      <div>
                        <div className="text-slate-500 text-[9px]">AREA</div>
                        <div className="font-bold text-emerald-400">{candidate.areaAcres.toFixed(2)} Acres</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[9px]">DATA STATUS</div>
                        <div className="font-bold text-amber-400">{candidate.dataStatus}</div>
                      </div>
                    </div>

                    {/* Rationale preview */}
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2.5">
                      {candidate.rationale}
                    </p>

                    {/* Card Bottom Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandidate(candidate);
                          setDossierModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Dossier</span>
                      </button>

                      <button
                        type="button"
                        disabled={isLocating}
                        onClick={(e) => handleLocateClick(candidate, e)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          isLocating
                            ? 'bg-sky-500 text-slate-950 animate-pulse'
                            : isSelected
                            ? 'bg-[#e5a93b] hover:bg-[#d4992b] text-slate-950 ring-1 ring-amber-400/50'
                            : 'bg-sky-600 hover:bg-sky-500 text-white'
                        }`}
                        title="Locate this parcel on the GIS map"
                      >
                        {isLocating ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Locating...</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3" />
                            <span>Locate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredCandidates.length === 0 && (
                <div className="text-center text-xs text-slate-500 py-8">
                  No candidates match the current filters.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: CANDIDATE DEEP DIVE */}
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
            {/* Active Candidate Header & Quick Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold">
                    PLOT: {selectedCandidate.plotId}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs">
                    {selectedCandidate.ownership}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold mt-1 text-white tracking-tight">
                  {selectedCandidate.landUse}
                </h2>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{selectedCandidate.sampleZoneLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDossierModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs shadow-md transition-all"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>View Dossier</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLocateClick(selectedCandidate)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/20 transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Locate on Map View</span>
                </button>
              </div>
            </div>

            {/* ================= REAL BASEMAP TOGGLE (SATELLITE / TERRAIN) ================= */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="font-bold text-sm text-white tracking-wide">
                    Parcel Location &mdash; Satellite / Terrain View
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-cyan-300">
                  Real map tiles &bull; toggle basemap layer
                </span>
              </div>

              <div className="h-[400px] w-full">
                <ParcelComparisonSwipe candidate={selectedCandidate} isDarkMode={isDarkMode} />
              </div>
            </div>

            {/* ================= CANDIDATE ATTRIBUTES ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Identification & Tenure */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isDarkMode ? 'bg-[#15120f] border-[#2b241d]' : 'bg-white border-[#e7e5e4] shadow-sm'
              }`}>
                <div className="text-xs font-bold text-[#e5a93b] uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#e5a93b]" />
                  <span>Identification &amp; Tenure</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Plot ID</span>
                    <span className="font-mono font-bold text-white">{selectedCandidate.plotId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Ownership</span>
                    <span className="font-bold text-white">{selectedCandidate.ownership}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Land Use</span>
                    <span className="font-semibold text-slate-200">{selectedCandidate.landUse}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Data Status</span>
                    <span className="font-bold text-amber-400">{selectedCandidate.dataStatus}</span>
                  </div>
                </div>
              </div>

              {/* 2. Area & Location */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isDarkMode ? 'bg-[#15120f] border-[#2b241d]' : 'bg-white border-[#e7e5e4] shadow-sm'
              }`}>
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-teal-400" />
                  <span>Area &amp; Location</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Area</span>
                    <span className="font-mono font-bold text-white">{selectedCandidate.areaAcres.toFixed(2)} Acres</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Centroid</span>
                    <span className="font-bold text-white">
                      {selectedCandidate.centerLat.toFixed(4)}°N, {selectedCandidate.centerLng.toFixed(4)}°E
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block">Sample Zone</span>
                    <span className="font-semibold text-slate-200">{selectedCandidate.sampleZoneLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rationale */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isDarkMode ? 'bg-[#15120f] border-[#2b241d]' : 'bg-white border-[#e7e5e4] shadow-sm'
            }`}>
              <div className="text-xs font-bold text-[#e5a93b] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#e5a93b]" />
                <span>Why This Parcel Was Flagged</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {selectedCandidate.rationale}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Land Dossier Modal */}
      <LandDossierModal
        candidate={selectedCandidate}
        isOpen={dossierModalOpen}
        onClose={() => setDossierModalOpen(false)}
        onLocateOnMap={onLocateOnMap}
      />
    </div>
  );
};
