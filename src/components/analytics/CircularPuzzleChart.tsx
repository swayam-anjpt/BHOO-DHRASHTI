import React, { useState } from 'react';
import { LandUseCategory, SampleZoneLandUseComposition } from '../../types';

// Repurposed from the old 5-year-trend "puzzle ring" into a real, single-point
// land-use composition chart for the cadastral sample zone. There is no time
// dimension here - each segment is one real land-use category's share of the
// SAMPLE ZONE parcels (not the whole district), so there is no delta/trend
// text to show, just the current real breakdown.

interface CircularPuzzleChartProps {
  composition: SampleZoneLandUseComposition;
  isDarkMode?: boolean;
}

const CATEGORY_COLORS: Record<LandUseCategory, { color: string; activeColor: string }> = {
  Industrial: { color: '#f97316', activeColor: '#ea580c' },
  Residential: { color: '#0ea5e9', activeColor: '#0284c7' },
  'Forest/Protected': { color: '#10b981', activeColor: '#059669' },
  'Government Revenue Land': { color: '#a855f7', activeColor: '#9333ea' },
  'Water Bodies': { color: '#06b6d4', activeColor: '#0891b2' },
  Commercial: { color: '#f43f5e', activeColor: '#e11d48' },
  Agriculture: { color: '#84cc16', activeColor: '#65a30d' },
};

const FALLBACK_COLOR = { color: '#e5a93b', activeColor: '#d97706' };

export const CircularPuzzleChart: React.FC<CircularPuzzleChartProps> = ({
  composition,
  isDarkMode = true,
}) => {
  const segments = composition.breakdown;
  const [hoveredId, setHoveredId] = useState<LandUseCategory | null>(null);
  const [selectedId, setSelectedId] = useState<LandUseCategory | null>(null);

  const activeCategory = hoveredId ?? selectedId ?? segments[0]?.landUse ?? null;
  const activeSeg = segments.find((s) => s.landUse === activeCategory) ?? segments[0];
  const activeColor = activeSeg
    ? (CATEGORY_COLORS[activeSeg.landUse] ?? FALLBACK_COLOR).color
    : FALLBACK_COLOR.color;

  // Geometry constants for the interlocking puzzle ring
  const cx = 160;
  const cy = 160;
  const rIn = 75;
  const rOut = 125;
  const rMid = (rIn + rOut) / 2;
  const tabR = 12.5;

  const polar = (r: number, deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const createPuzzlePiecePath = (index: number) => {
    const angleStep = 360 / segments.length;
    const a1 = index * angleStep;
    const a2 = (index + 1) * angleStep;

    const p0 = polar(rIn, a1);
    const p1 = polar(rMid - tabR, a1);
    const p2 = polar(rMid + tabR, a1);
    const p3 = polar(rOut, a1);
    const p4 = polar(rOut, a2);
    const p5 = polar(rMid + tabR, a2);
    const p6 = polar(rMid - tabR, a2);
    const p7 = polar(rIn, a2);

    return [
      `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`,
      `L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
      `A ${tabR} ${tabR} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
      `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
      `A ${rOut} ${rOut} 0 0 1 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
      `L ${p5.x.toFixed(2)} ${p5.y.toFixed(2)}`,
      `A ${tabR} ${tabR} 0 0 1 ${p6.x.toFixed(2)} ${p6.y.toFixed(2)}`,
      `L ${p7.x.toFixed(2)} ${p7.y.toFixed(2)}`,
      `A ${rIn} ${rIn} 0 0 0 ${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`,
      'Z',
    ].join(' ');
  };

  if (segments.length === 0) {
    return null;
  }

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isDarkMode ? 'bg-[#181512] border-[#2e2720]' : 'bg-[#fafaf9] border-[#e7e5e4] shadow-sm'
      }`}
    >
      {/* Prominent sample-zone scope disclaimer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-inherit">
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-[#1c1917]'}`}>
            Land-Use Composition &mdash; Sample Zone
          </h3>
          <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'}`}>
            {composition.sampleZoneLabel || 'Cadastral sample zone'} &bull; {composition.totalParcels} parcels &bull;{' '}
            {composition.totalAreaAcres.toLocaleString()} acres
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 font-mono text-[10px] font-bold">
          SAMPLE ZONE &mdash; NOT DISTRICT-WIDE
        </span>
      </div>

      <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
        {/* Interactive Puzzle Ring SVG */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg viewBox="0 0 320 320" className="w-64 h-64 sm:w-72 sm:h-72 drop-shadow-md select-none">
            <circle
              cx={cx}
              cy={cy}
              r={(rIn + rOut) / 2}
              fill="none"
              stroke={isDarkMode ? '#1f1b17' : '#f0ece9'}
              strokeWidth={rOut - rIn}
              className="opacity-40"
            />

            {segments.map((seg, idx) => {
              const palette = CATEGORY_COLORS[seg.landUse] ?? FALLBACK_COLOR;
              const isSelected = selectedId === seg.landUse;
              const isHovered = hoveredId === seg.landUse;
              const pathData = createPuzzlePiecePath(idx);

              return (
                <path
                  key={seg.landUse}
                  d={pathData}
                  fill={palette.color}
                  fillOpacity={isSelected ? 1 : isHovered ? 0.9 : isDarkMode ? 0.72 : 0.8}
                  stroke={isSelected ? palette.activeColor : isDarkMode ? '#181512' : '#ffffff'}
                  strokeWidth={isSelected ? 4.5 : 2.5}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(seg.landUse === selectedId ? null : seg.landUse)}
                  onMouseEnter={() => setHoveredId(seg.landUse)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              );
            })}
          </svg>

          {/* Center Readout */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4"
            style={{ width: `${rIn * 2 - 10}px`, height: `${rIn * 2 - 10}px`, margin: 'auto' }}
          >
            <span
              className={`text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider truncate max-w-[130px] ${
                isDarkMode ? 'text-[#a89f91]' : 'text-[#78716c]'
              }`}
            >
              {activeSeg?.landUse}
            </span>
            <div className="flex items-baseline gap-1 my-0.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: activeColor }}>
                {activeSeg?.percentOfSample}%
              </span>
            </div>
            <div className={`text-[10px] font-semibold ${isDarkMode ? 'text-[#8e8577]' : 'text-[#a8a29e]'}`}>
              {activeSeg?.areaAcres.toLocaleString()} acres &bull; {activeSeg?.parcelCount} parcels
            </div>
          </div>
        </div>

        {/* Category List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5 w-full flex-1">
          {segments.map((seg) => {
            const palette = CATEGORY_COLORS[seg.landUse] ?? FALLBACK_COLOR;
            const isSelected = selectedId === seg.landUse;
            return (
              <button
                key={seg.landUse}
                type="button"
                onClick={() => setSelectedId(seg.landUse === selectedId ? null : seg.landUse)}
                onMouseEnter={() => setHoveredId(seg.landUse)}
                onMouseLeave={() => setHoveredId(null)}
                className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-[#241f1a] border-[#e5a93b]/80 shadow-md ring-1 ring-[#e5a93b]/40'
                      : 'bg-[#fef9ee] border-[#d97706] shadow-sm ring-1 ring-[#d97706]/30'
                    : isDarkMode
                    ? 'bg-[#141210] border-[#2a241e] hover:border-[#3d3328]'
                    : 'bg-white border-[#e7e5e4] hover:bg-[#f5f5f4]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: palette.color }} />
                  <div className="min-w-0">
                    <div
                      className={`text-[10px] uppercase font-bold tracking-wider truncate ${
                        isSelected ? (isDarkMode ? 'text-[#f4ede4]' : 'text-[#1c1917]') : isDarkMode ? 'text-[#8e8577]' : 'text-[#78716c]'
                      }`}
                    >
                      {seg.landUse}
                    </div>
                    <div className={`text-[10px] font-semibold truncate ${isDarkMode ? 'text-[#8e8577]' : 'text-[#a8a29e]'}`}>
                      {seg.parcelCount} parcels
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black" style={{ color: isSelected ? palette.color : isDarkMode ? '#f4ede4' : '#1c1917' }}>
                    {seg.percentOfSample}%
                    <span className={`text-[9px] font-normal ml-0.5 ${isDarkMode ? 'text-[#8e8577]' : 'text-[#a8a29e]'}`}>
                      {seg.areaAcres.toLocaleString()} ac
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
