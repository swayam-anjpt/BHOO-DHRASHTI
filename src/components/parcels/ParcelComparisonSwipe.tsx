import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RedevelopmentCandidate } from '../../types';
import {
  ZoomIn,
  ZoomOut,
  Compass,
  Layers,
  Satellite,
  Mountain,
  MapPin,
} from 'lucide-react';

// Fix default leaflet marker icons (same fix used in GISMap.tsx; safe to
// repeat here since this component can render before/without GISMap mounting).
if ((L.Icon.Default.prototype as any)._getIconUrl) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type BasemapMode = 'satellite' | 'terrain';

// Same real, public Esri tile services used by the main GIS map - this
// component swaps between two REAL visual layers of the SAME real
// coordinates. There is no before/after time-drift comparison here because
// no such imagery exists in the underlying dataset.
const BASEMAPS: Record<BasemapMode, { url: string; attribution: string; label: string }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri World Imagery © Mappls Satellite',
    label: 'Esri World Imagery (Satellite)',
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri Topographic Terrain © OpenStreetMap',
    label: 'Esri Topographic Terrain',
  },
};

interface ParcelComparisonSwipeProps {
  candidate: RedevelopmentCandidate;
  isDarkMode?: boolean;
}

/**
 * Honest replacement for the old fabricated "before/after satellite drift"
 * swipe comparison. That feature had nothing real to compare (no NDVI/NDBI
 * time-series imagery exists in the real datasets), so instead this renders
 * an actual Leaflet map at the candidate's real coordinates and lets the
 * user toggle between two real basemap tile layers - satellite imagery and
 * topographic terrain - for the same current location.
 */
export const ParcelComparisonSwipe: React.FC<ParcelComparisonSwipeProps> = ({
  candidate,
  isDarkMode = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [basemap, setBasemap] = useState<BasemapMode>('satellite');

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [candidate.centerLat, candidate.centerLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: true,
    });

    const config = BASEMAPS[basemap];
    const tiles = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 19,
    });
    tiles.addTo(map);
    tileLayerRef.current = tiles;

    const marker = L.marker([candidate.centerLat, candidate.centerLng]).addTo(map);
    marker.bindPopup(
      `<strong>${candidate.plotId}</strong><br/>${candidate.landUse} &bull; ${candidate.ownership}<br/>${candidate.areaAcres.toFixed(2)} acres`
    );
    markerRef.current = marker;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center map + marker when the selected candidate changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([candidate.centerLat, candidate.centerLng], 16);
    if (markerRef.current) {
      markerRef.current.setLatLng([candidate.centerLat, candidate.centerLng]);
      markerRef.current.setPopupContent(
        `<strong>${candidate.plotId}</strong><br/>${candidate.landUse} &bull; ${candidate.ownership}<br/>${candidate.areaAcres.toFixed(2)} acres`
      );
    }
  }, [candidate.id, candidate.centerLat, candidate.centerLng, candidate.plotId, candidate.landUse, candidate.ownership, candidate.areaAcres]);

  // Swap basemap layer
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const config = BASEMAPS[basemap];
    const tiles = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 19,
    });
    tiles.addTo(mapRef.current);
    tileLayerRef.current = tiles;
  }, [basemap]);

  return (
    <div className="flex flex-col h-full w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#070d14] text-slate-100 shadow-2xl relative select-none">
      {/* Top Status Bar */}
      <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono z-[500] relative">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {BASEMAPS[basemap].label.toUpperCase()}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-sky-400 font-semibold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            REAL MAP TILES &bull; SAME LOCATION
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>LAT: {candidate.centerLat.toFixed(4)}°N</span>
          <span>LNG: {candidate.centerLng.toFixed(4)}°E</span>
        </div>
      </div>

      {/* Basemap toggle */}
      <div className="absolute top-14 left-4 z-[500] flex bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setBasemap('satellite')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors ${
            basemap === 'satellite'
              ? 'bg-emerald-500 text-slate-950'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Satellite className="w-3.5 h-3.5" />
          Satellite
        </button>
        <button
          type="button"
          onClick={() => setBasemap('terrain')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors ${
            basemap === 'terrain'
              ? 'bg-emerald-500 text-slate-950'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          Terrain
        </button>
      </div>

      {/* Map View Controls Overlay */}
      <div className="absolute right-4 top-16 z-[500] flex flex-col gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 backdrop-blur-md shadow-xl">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.setView([candidate.centerLat, candidate.centerLng], 16)}
          className="p-2 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          title="Recenter on parcel"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={containerRef} className="relative flex-1 w-full" style={{ minHeight: '380px' }} />

      {/* Bottom Summary Bar */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-[500] relative">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-400 text-[11px]">Plot: </span>
            <span className="font-mono font-bold text-emerald-400">{candidate.plotId}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">Area: </span>
            <span className="font-mono font-bold text-sky-400">{candidate.areaAcres.toFixed(2)} Acres</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-slate-400 text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>{candidate.sampleZoneLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300">
            {candidate.landUse}
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/40 text-[10px] font-mono text-emerald-300">
            {candidate.ownership}
          </span>
        </div>
      </div>
    </div>
  );
};
