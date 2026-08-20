import React, { useEffect, useState } from 'react';
import { Parcel, RedevelopmentCandidate } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Printer,
  X,
  Building,
  MapPin,
  Layers,
  RefreshCw,
} from 'lucide-react';

interface LandDossierModalProps {
  candidate: RedevelopmentCandidate | null;
  isOpen: boolean;
  onClose: () => void;
  onLocateOnMap?: (candidate: RedevelopmentCandidate) => void;
}

export const LandDossierModal: React.FC<LandDossierModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onLocateOnMap,
}) => {
  const [fullParcel, setFullParcel] = useState<Parcel | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!isOpen || !candidate) {
      setFullParcel(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    fetch(`/api/parcels/locate/${encodeURIComponent(candidate.plotId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.success && data.parcel) {
          setFullParcel(data.parcel as Parcel);
        }
      })
      .catch(() => {
        // Non-fatal - dossier still renders with candidate-level fields only.
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, candidate]);

  if (!isOpen || !candidate) return null;

  const handlePrint = () => {
    window.print();
  };

  const disclaimer =
    fullParcel?.disclaimer ||
    'Synthetic sample cadastral parcel, part of a demo dataset covering a small sample zone - not a real cadastral record and not issued by any government authority.';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#031317] border-2 border-emerald-500/60 text-emerald-100 shadow-[0_0_50px_rgba(16,185,129,0.25)] font-mono flex flex-col p-5 sm:p-7 relative custom-scrollbar">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3 mb-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm sm:text-base">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Redevelopment Candidate Dossier</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-xs text-emerald-300 font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub Header & Plot ID Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="text-[11px] text-emerald-400/80 tracking-wider">
              BHOO DRISHTI &bull; SAMPLE CADASTRAL LAYER
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white uppercase mt-0.5">
              Land Parcel Reference Summary
            </h2>
            <div className="text-xs text-emerald-400/70 mt-0.5">
              Generated from the sample cadastral dataset &bull; not a legal or title document
            </div>
          </div>

          <div className="text-right sm:text-right border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 rounded-lg shrink-0">
            <div className="text-xs font-extrabold text-emerald-300">
              PLOT ID: {candidate.plotId}
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">
              GENERATED: {new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
            </div>
          </div>
        </div>

        {/* ================= PROMINENT SYNTHETIC-DATA DISCLAIMER ================= */}
        <div className="mb-4 p-3.5 rounded-xl border-2 border-amber-500/60 bg-amber-950/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-extrabold text-amber-300 uppercase tracking-wider mb-1">
              Synthetic Sample Data &mdash; Not a Real Government Record
            </div>
            <p className="text-[11px] leading-relaxed text-amber-100/90">{disclaimer}</p>
          </div>
        </div>

        {/* ================= SECTION 1: IDENTIFICATION & TENURE ================= */}
        <div className="mb-4">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="text-emerald-500">1.</span>
            <span>IDENTIFICATION &amp; TENURE</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#021d1d]/70 p-3 rounded-xl border border-emerald-500/20">
            <div>
              <div className="text-[10px] text-emerald-400/70">Plot ID</div>
              <div className="font-bold text-xs sm:text-sm text-white mt-0.5">{candidate.plotId}</div>
            </div>

            <div>
              <div className="text-[10px] text-emerald-400/70">Land Use</div>
              <div className="font-bold text-xs sm:text-sm text-white mt-0.5">{candidate.landUse}</div>
            </div>

            <div>
              <div className="text-[10px] text-emerald-400/70">Ownership</div>
              <div className="font-bold text-xs sm:text-sm text-white mt-0.5">{candidate.ownership}</div>
            </div>

            <div>
              <div className="text-[10px] text-emerald-400/70">District</div>
              <div className="font-bold text-xs sm:text-sm text-white mt-0.5">
                {fullParcel?.district || (loadingDetail ? '...' : '—')}
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: AREA & LOCATION ================= */}
        <div className="mb-4">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="text-emerald-500">2.</span>
            <span>AREA &amp; LOCATION</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#021d1d]/70 p-3 rounded-xl border border-emerald-500/20">
            <div>
              <div className="text-[10px] text-emerald-400/70">Area</div>
              <div className="font-bold text-xs sm:text-sm text-white mt-0.5">
                {candidate.areaAcres.toFixed(2)} Acres
                {fullParcel?.areaSqMeters ? ` (${fullParcel.areaSqMeters.toLocaleString()} m²)` : ''}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-emerald-400/70">Centroid Lat/Lng</div>
              <div className="font-bold text-xs sm:text-sm text-white mt-0.5">
                {candidate.centerLat.toFixed(5)}°N, {candidate.centerLng.toFixed(5)}°E
              </div>
            </div>

            <div className="col-span-2">
              <div className="text-[10px] text-emerald-400/70">Sample Zone</div>
              <div className="font-bold text-xs sm:text-sm text-white mt-0.5">{candidate.sampleZoneLabel}</div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 3: RATIONALE ================= */}
        <div className="mb-4">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="text-emerald-500">3.</span>
            <span>WHY THIS PARCEL WAS FLAGGED</span>
          </div>
          <div className="bg-[#021d1d]/70 p-3.5 rounded-xl border border-emerald-500/20 text-xs sm:text-sm text-emerald-100 leading-relaxed">
            {candidate.rationale}
          </div>
        </div>

        {loadingDetail && (
          <div className="mb-4 flex items-center gap-2 text-[11px] text-emerald-400/70">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Fetching full cadastral record for additional detail...</span>
          </div>
        )}

        {/* Footer verification note & data status stamp */}
        <div className="pt-3 border-t border-dashed border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-400/90 text-[11px]">
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Data status: {candidate.dataStatus}</span>
          </div>

          <div className="flex items-center gap-3">
            {onLocateOnMap && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLocateOnMap(candidate);
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Locate on Map</span>
              </button>
            )}

            <div className="px-2.5 py-1 rounded bg-emerald-950/90 border border-emerald-500/70 text-emerald-300 text-[10px] font-bold tracking-wider flex items-center gap-1.5">
              <Building className="w-3 h-3" />
              <span>SAMPLE DATASET &bull; NOT OFFICIAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
