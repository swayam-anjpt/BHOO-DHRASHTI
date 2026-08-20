import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Gauge,
  GraduationCap,
  Hospital,
  Info,
  MapPin,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CircularPuzzleChart } from './CircularPuzzleChart';
import {
  DataStatus,
  DistrictMetrics,
  Language,
  LandUtilizationRecord,
  SampleZoneLandUseComposition,
  UrbanExpansionIndex,
} from '../../types';

// ============================================================================
// District Snapshot (formerly "Development Trends")
//
// The old module rendered 5 years (2022-2026) of Environmental Quality,
// Urbanization, Accessibility, and Population "trend" charts sourced from
// src/data/temporalData.ts - entirely fabricated, with zero backing in any
// real dataset. That file (and src/types/temporal.ts) has been deleted.
//
// The backend now serves exactly one real measurement in time per metric
// (Census 2011 socio-economic data + UDISE 2024 school data for Ahmedabad,
// plus a provisional healthcare/public-safety seed list and a real
// sample-zone land-use breakdown). There is nothing to chart as a
// year-over-year trend from a single data point, so this module renders a
// "current state" snapshot instead - clearly labeled REAL vs PROVISIONAL
// per section - with one legitimate bonus trend chart built from the only
// real multi-year series available (national land-utilization statistics,
// which are India-wide, not Ahmedabad-specific).
// ============================================================================

interface DevelopmentTrendsModuleProps {
  isDarkMode?: boolean;
  /** Reserved for future i18n wiring; this module does not yet localize its copy. */
  language?: Language;
}

// ---------------------------------------------------------------------------
// Shared presentational helpers
// ---------------------------------------------------------------------------

const cardClass = (isDarkMode: boolean) =>
  `p-4 rounded-xl border transition-all ${
    isDarkMode ? 'bg-[#181512] border-[#2e2720]' : 'bg-[#fafaf9] border-[#e7e5e4]'
  }`;

const innerCardClass = (isDarkMode: boolean) =>
  `p-3 rounded-lg border ${isDarkMode ? 'bg-[#141210] border-[#2a241e]' : 'bg-white border-[#e7e5e4]'}`;

const DataStatusBadge: React.FC<{ status: DataStatus; label?: string }> = ({ status, label }) => {
  const styles =
    status === 'REAL'
      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
      : status === 'PROVISIONAL'
      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
      : 'bg-sky-500/10 border-sky-500/40 text-sky-400';
  return (
    <span className={`px-2.5 py-0.5 rounded-full border font-mono text-[10px] font-bold whitespace-nowrap ${styles}`}>
      {label || status}
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
  isDarkMode: boolean;
}> = ({ label, value, sub, accent = '#e5a93b', isDarkMode }) => (
  <div className={innerCardClass(isDarkMode)}>
    <span className={`text-[10px] uppercase font-bold block ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>
      {label}
    </span>
    <div className="text-xl font-bold mt-1" style={{ color: accent }}>
      {value}
    </div>
    {sub && (
      <div className={`text-[11px] mt-1 leading-snug ${isDarkMode ? 'text-[#a89f91]' : 'text-[#78716c]'}`}>{sub}</div>
    )}
  </div>
);

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  status: DataStatus;
  statusLabel?: string;
  isDarkMode: boolean;
}> = ({ icon, title, subtitle, status, statusLabel, isDarkMode }) => (
  <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-inherit">
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-[#1c1917]'}`}>
          {title}
        </h3>
      </div>
      {subtitle && (
        <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>{subtitle}</p>
      )}
    </div>
    <DataStatusBadge status={status} label={statusLabel} />
  </div>
);

const PRESSURE_COLORS: Record<UrbanExpansionIndex['pressureLevel'], string> = {
  Low: '#10b981',
  Moderate: '#0ea5e9',
  High: '#f59e0b',
  Critical: '#f43f5e',
};

export const DevelopmentTrendsModule: React.FC<DevelopmentTrendsModuleProps> = ({ isDarkMode = true }) => {
  const [district, setDistrict] = useState<DistrictMetrics | null>(null);
  const [composition, setComposition] = useState<SampleZoneLandUseComposition | null>(null);
  const [expansionIndex, setExpansionIndex] = useState<UrbanExpansionIndex | null>(null);
  const [nationalLandUse, setNationalLandUse] = useState<LandUtilizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      setLoading(true);
      setError(null);
      try {
        const [districtsRes, compositionRes, expansionRes, nationalRes] = await Promise.all([
          fetch('/api/districts'),
          fetch('/api/urban-planning/land-use-composition'),
          fetch('/api/urban-planning/expansion-index'),
          fetch('/api/national/land-utilization'),
        ]);

        const [districtsJson, compositionJson, expansionJson, nationalJson] = await Promise.all([
          districtsRes.json(),
          compositionRes.json(),
          expansionRes.json(),
          nationalRes.json(),
        ]);

        if (cancelled) return;

        if (districtsJson.success && Array.isArray(districtsJson.districts) && districtsJson.districts.length > 0) {
          setDistrict(districtsJson.districts[0]);
        } else {
          throw new Error('District snapshot data is unavailable.');
        }

        if (compositionJson.success) setComposition(compositionJson.composition);
        if (expansionJson.success) setExpansionIndex(expansionJson.index);
        if (nationalJson.success && Array.isArray(nationalJson.records)) setNationalLandUse(nationalJson.records);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load district snapshot data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, []);

  const nationalChartData = useMemo(
    () =>
      nationalLandUse.map((r) => ({
        year: r.year,
        netAreaSown: r.netAreaSownThousandHa,
        forests: r.forestsThousandHa,
        totalCropped: r.totalCroppedAreaThousandHa,
      })),
    [nationalLandUse]
  );

  const schoolSplitData = useMemo(() => {
    if (!district) return [];
    return [
      { name: 'Rural Schools', value: district.ruralSchools, fill: '#10b981' },
      { name: 'Urban Schools', value: district.urbanSchools, fill: '#0ea5e9' },
    ];
  }, [district]);

  if (loading) {
    return (
      <div className={cardClass(isDarkMode)}>
        <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-[#a89f91]' : 'text-[#78716c]'}`}>
          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#e5a93b] border-t-transparent animate-spin" />
          <span>Loading real district snapshot (Census 2011 &amp; UDISE 2024)&hellip;</span>
        </div>
      </div>
    );
  }

  if (error || !district) {
    return (
      <div className={cardClass(isDarkMode)}>
        <div className="flex items-center gap-2 text-xs text-rose-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error || 'District snapshot data is unavailable.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. HEADER */}
      <div className={cardClass(isDarkMode)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#e5a93b]" />
              <h2 className={`text-sm font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-[#1c1917]'}`}>
                District Snapshot &mdash; {district.name}, {district.state}
              </h2>
            </div>
            <p className={`text-[11px] mt-1 max-w-2xl leading-relaxed ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>
              A single real-data point in time, not a fabricated multi-year trend. Every figure below traces back to
              a real dataset (Census 2011 or UDISE 2024) for {district.name}; sections that are only
              provisional/placeholder data are labeled explicitly.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold shrink-0">
            REAL DATA SNAPSHOT
          </span>
        </div>
      </div>

      {/* 2. HEADLINE SOCIO-ECONOMIC STAT CARDS (REAL, Census 2011) */}
      <div className={cardClass(isDarkMode)}>
        <SectionHeader
          icon={<Users className="w-4 h-4 text-[#e5a93b]" />}
          title="Population &amp; Socio-Economic Profile"
          subtitle="Census 2011 figures for Ahmedabad district."
          status={district.dataStatus.socioEconomic}
          isDarkMode={isDarkMode}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-3">
          <StatCard
            label="Total Population"
            value={district.totalPopulation.toLocaleString()}
            sub={`${district.areaSqKm.toLocaleString()} sq km`}
            accent="#e5a93b"
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Urban / Rural Split"
            value={`${(100 - district.ruralPopulationPercent).toFixed(1)}% / ${district.ruralPopulationPercent}%`}
            sub={`${district.urbanPopulation.toLocaleString()} urban · ${district.ruralPopulation.toLocaleString()} rural`}
            accent="#0ea5e9"
            isDarkMode={isDarkMode}
          />
          <StatCard label="Literacy Rate" value={`${district.literacyRatePercent}%`} accent="#10b981" isDarkMode={isDarkMode} />
          <StatCard
            label="Sex Ratio"
            value={district.sexRatio}
            sub="females per 1,000 males"
            accent="#a855f7"
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Marginalized Population"
            value={`${district.marginalizedPopulationPercent}%`}
            sub={`SC ${district.scPopulationPercent}% + ST ${district.stPopulationPercent}%`}
            accent="#f97316"
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Population Density"
            value={district.populationDensityPerSqKm.toLocaleString()}
            sub="people / sq km"
            accent="#f43f5e"
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Avg Household Size"
            value={district.avgHouseholdSize}
            sub="persons per household"
            accent="#06b6d4"
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Relative Deprivation Proxy"
            value={`${district.relativeDeprivationProxy0to100} / 100`}
            sub="Dataset-constructed index &mdash; not an official government statistic"
            accent="#e5a93b"
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* 3. EDUCATION (REAL, UDISE 2024) */}
      <div className={cardClass(isDarkMode)}>
        <SectionHeader
          icon={<GraduationCap className="w-4 h-4 text-[#e5a93b]" />}
          title="Education Infrastructure"
          subtitle="UDISE 2024 school records for Ahmedabad district."
          status={district.dataStatus.education}
          isDarkMode={isDarkMode}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Schools" value={district.totalSchools.toLocaleString()} accent="#e5a93b" isDarkMode={isDarkMode} />
            <StatCard
              label="Population per School"
              value={district.populationPerSchool.toLocaleString()}
              accent="#0ea5e9"
              isDarkMode={isDarkMode}
            />
            <StatCard label="Rural Schools" value={district.ruralSchools.toLocaleString()} accent="#10b981" isDarkMode={isDarkMode} />
            <StatCard label="Urban Schools" value={district.urbanSchools.toLocaleString()} accent="#a855f7" isDarkMode={isDarkMode} />
          </div>
          <div className={innerCardClass(isDarkMode)}>
            <div className={`text-[10px] uppercase font-bold mb-2 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>
              Rural vs Urban School Split
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={schoolSplitData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke={isDarkMode ? '#241f1a' : '#f5f5f4'} vertical={false} />
                  <XAxis dataKey="name" stroke={isDarkMode ? '#8e8577' : '#a8a29e'} fontSize={10} tickLine={false} />
                  <YAxis stroke={isDarkMode ? '#8e8577' : '#a8a29e'} fontSize={10} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as { name: string; value: number; fill: string };
                        return (
                          <div
                            className={`p-2 rounded border text-xs shadow-lg ${
                              isDarkMode ? 'bg-[#1c1916] border-[#3d3328] text-white' : 'bg-white border-[#e7e5e4]'
                            }`}
                          >
                            <span className="font-bold">{d.name}: </span>
                            <span className="font-mono font-bold" style={{ color: d.fill }}>
                              {d.value.toLocaleString()}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {schoolSplitData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 4. HEALTHCARE & PUBLIC SAFETY / TRANSIT (PROVISIONAL) */}
      <div className={cardClass(isDarkMode)}>
        <SectionHeader
          icon={<Hospital className="w-4 h-4 text-[#e5a93b]" />}
          title="Healthcare &amp; Public Safety / Transit"
          subtitle="Manually-curated placeholder seed points &mdash; not a comprehensive facility census."
          status={district.dataStatus.healthcare}
          statusLabel="PROVISIONAL"
          isDarkMode={isDarkMode}
        />

        <div
          className={`mt-3 p-2.5 rounded-lg border text-xs leading-relaxed flex items-start gap-2 ${
            isDarkMode ? 'bg-amber-500/5 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            {district.dataNotes.slice(1).map((note, i) => (
              <p key={i}>{note}</p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3">
          <StatCard
            label="Hospitals Recorded"
            value={district.totalHospitals}
            sub="placeholder seed list"
            accent="#f43f5e"
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Population / Hospital"
            value={district.populationPerHospital.toLocaleString()}
            accent="#f97316"
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Police Stations Recorded"
            value={district.totalPoliceStations}
            sub="placeholder seed list"
            accent="#0ea5e9"
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Population / Police Station"
            value={district.populationPerPoliceStation.toLocaleString()}
            accent="#a855f7"
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Bus Stations Recorded"
            value={district.totalBusStations}
            sub="placeholder seed list"
            accent="#10b981"
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* 5. LAND-USE COMPOSITION (REAL, SAMPLE ZONE ONLY) */}
      {composition && <CircularPuzzleChart composition={composition} isDarkMode={isDarkMode} />}

      {/* 6. URBAN EXPANSION PRESSURE INDEX (REAL, single point) */}
      {expansionIndex && (
        <div className={cardClass(isDarkMode)}>
          <SectionHeader
            icon={<Gauge className="w-4 h-4 text-[#e5a93b]" />}
            title="Urban Expansion Pressure Index"
            subtitle="Computed from real Census 2011 density &amp; urban share &mdash; a single index value, not a trend."
            status="REAL"
            isDarkMode={isDarkMode}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-3">
            <div className="lg:col-span-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className={isDarkMode ? 'text-[#a89f91]' : 'text-[#78716c]'}>Expansion Pressure Score</span>
                <span className="font-mono font-bold" style={{ color: PRESSURE_COLORS[expansionIndex.pressureLevel] }}>
                  {expansionIndex.expansionPressureScore} / 100 &bull; {expansionIndex.pressureLevel}
                </span>
              </div>
              <div className={`w-full h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#241f1a]' : 'bg-[#e7e5e4]'}`}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${expansionIndex.expansionPressureScore}%`,
                    backgroundColor: PRESSURE_COLORS[expansionIndex.pressureLevel],
                  }}
                />
              </div>
              <p className={`text-xs leading-relaxed pt-2 ${isDarkMode ? 'text-[#d4cbbf]' : 'text-[#44403c]'}`}>
                {expansionIndex.narrative}
              </p>
              <div
                className={`mt-2 p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                  isDarkMode ? 'bg-[#141210] border-[#2a241e] text-[#d4cbbf]' : 'bg-white border-[#e7e5e4] text-[#44403c]'
                }`}
              >
                <Info className="w-4 h-4 text-[#e5a93b] shrink-0 mt-0.5" />
                <span>
                  <b className={isDarkMode ? 'text-white' : 'text-[#1c1917]'}>Recommended action:</b>{' '}
                  {expansionIndex.recommendedAction}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <StatCard
                label="Population Density"
                value={expansionIndex.populationDensityPerSqKm.toLocaleString()}
                sub="people / sq km"
                accent="#f43f5e"
                isDarkMode={isDarkMode}
              />
              <StatCard
                label="Urban Population Share"
                value={`${expansionIndex.urbanPopulationPercent}%`}
                accent="#0ea5e9"
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. BONUS: NATIONAL LAND UTILIZATION TREND (REAL, national scope, only legitimate multi-year series) */}
      {nationalChartData.length > 0 && (
        <div className={cardClass(isDarkMode)}>
          <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-inherit">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#e5a93b]" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-[#1c1917]'}`}>
                  National Land Utilization Trend (India, 2000&ndash;01 to 2009&ndash;10)
                </h3>
              </div>
              <p className={`text-[11px] mt-0.5 max-w-xl ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>
                The only verified real multi-year series available in this dataset. Shown for national context only
                &mdash; it is India-wide, not Ahmedabad or Gujarat-specific.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/40 text-sky-400 font-mono text-[10px] font-bold whitespace-nowrap">
              NATIONAL SCOPE
            </span>
          </div>

          <div className="h-56 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={nationalChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#282119' : '#e7e5e4'} vertical={false} />
                <XAxis dataKey="year" stroke={isDarkMode ? '#8e8577' : '#a8a29e'} fontSize={10} tickLine={false} />
                <YAxis stroke={isDarkMode ? '#8e8577' : '#a8a29e'} fontSize={10} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div
                          className={`p-2.5 rounded-lg border shadow-xl text-xs space-y-1 ${
                            isDarkMode ? 'bg-[#141210] border-[#3d3328] text-[#f4ede4]' : 'bg-white border-[#e7e5e4] text-[#1c1917]'
                          }`}
                        >
                          <div className="font-bold border-b pb-1 border-inherit">{label}</div>
                          {payload.map((p) => (
                            <div key={String(p.dataKey)} className="flex justify-between gap-3" style={{ color: p.color }}>
                              <span>{p.name}:</span>
                              <span className="font-mono font-bold">{Number(p.value).toLocaleString()} &apos;000 ha</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="netAreaSown" name="Net Area Sown" stroke="#10b981" strokeWidth={2} dot={{ r: 2.5 }} />
                <Line type="monotone" dataKey="forests" name="Forests" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2.5 }} />
                <Line type="monotone" dataKey="totalCropped" name="Total Cropped Area" stroke="#e5a93b" strokeWidth={2} dot={{ r: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 8. DATA PROVENANCE & CAVEATS (consolidated) */}
      <div className={cardClass(isDarkMode)}>
        <div className="flex items-center gap-2 pb-3 border-b border-inherit">
          <Info className="w-4 h-4 text-[#e5a93b]" />
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-[#1c1917]'}`}>
            Data Provenance &amp; Caveats
          </h3>
        </div>
        <ul
          className={`pt-3 space-y-2 text-xs leading-relaxed list-disc pl-4 ${
            isDarkMode ? 'text-[#d4cbbf]' : 'text-[#44403c]'
          }`}
        >
          {district.dataNotes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
          {composition && (
            <li>
              Land-use composition is drawn from the {composition.sampleZoneLabel} only ({composition.totalParcels}{' '}
              parcels, {composition.totalAreaAcres.toLocaleString()} acres) &mdash; it does not represent the full
              district.
            </li>
          )}
          <li>
            This snapshot intentionally replaces the previous 2022&ndash;2026 &quot;Development Trends&quot; charts,
            which had no real data backing. Only one real measurement in time exists per district metric, so there is
            nothing to plot as a year-over-year trend here except the national land-utilization series above, which
            is a real but India-wide (not Ahmedabad-specific) series.
          </li>
        </ul>
      </div>
    </div>
  );
};
