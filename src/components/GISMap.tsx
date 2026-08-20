import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { CandidateSiteScore, DistrictMetrics, InfrastructureAsset, LandUseCategory, Parcel, ParcelFilterType } from '../types';
import { Layers, Plus, Minus, Crosshair } from 'lucide-react';

// Fix default leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export type MapLayerMode = 'satellite' | 'terrain';

const DEFAULT_ZOOM = 12;
const DEFAULT_LAT = 23.0225;
const DEFAULT_LNG = 72.5714;

export interface LandCategoryConfig {
  id: LandUseCategory;
  shortLabel: string;
  color: string;
}

export const LAND_CATEGORIES: LandCategoryConfig[] = [
  { id: 'Agriculture', shortLabel: 'Agriculture', color: '#10b981' },
  { id: 'Residential', shortLabel: 'Residential', color: '#0ea5e9' },
  { id: 'Commercial', shortLabel: 'Commercial', color: '#f59e0b' },
  { id: 'Industrial', shortLabel: 'Industrial', color: '#f97316' },
  { id: 'Government Revenue Land', shortLabel: 'Government', color: '#8b5cf6' },
  { id: 'Forest/Protected', shortLabel: 'Forest / Protected', color: '#047857' },
  { id: 'Water Bodies', shortLabel: 'Water Bodies', color: '#06b6d4' },
];

function getLandUseColor(landUse: LandUseCategory): string {
  return LAND_CATEGORIES.find((c) => c.id === landUse)?.color || '#ec4899';
}

interface GISMapProps {
  selectedDistrict: DistrictMetrics | null;
  parcels: Parcel[];
  selectedParcel: Parcel | null;
  onSelectParcel: (parcel: Parcel | null) => void;
  infrastructureAssets: InfrastructureAsset[];
  candidateSites: CandidateSiteScore[];
  selectedSite: CandidateSiteScore | null;
  onSelectSite: (site: CandidateSiteScore | null) => void;
  isDarkMode?: boolean;
  parcelFilter?: ParcelFilterType;
  onFilterChange?: (filter: ParcelFilterType) => void;
  showPillFilters?: boolean;
  flyToParcelTarget?: { parcel: Parcel; timestamp: number } | null;
  flyToLocationTarget?: { lat: number; lng: number; zoom?: number; timestamp: number } | null;
}

export const GISMap: React.FC<GISMapProps> = ({
  selectedDistrict,
  parcels,
  selectedParcel,
  onSelectParcel,
  infrastructureAssets,
  candidateSites,
  selectedSite,
  onSelectSite,
  isDarkMode = true,
  parcelFilter = 'All',
  onFilterChange,
  showPillFilters = true,
  flyToParcelTarget,
  flyToLocationTarget,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const baseTilesRef = useRef<L.TileLayer | null>(null);
  const parcelLayerGroupRef = useRef<L.FeatureGroup | null>(null);
  const infraLayerGroupRef = useRef<L.FeatureGroup | null>(null);
  const sitesLayerGroupRef = useRef<L.FeatureGroup | null>(null);

  const [mapMode, setMapMode] = useState<MapLayerMode>('satellite');
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({
    lat: selectedDistrict?.centerLat ?? DEFAULT_LAT,
    lng: selectedDistrict?.centerLng ?? DEFAULT_LNG,
  });

  useEffect(() => {
    fetch('/api/maps/preference')
      .then((res) => res.json())
      .then((data) => {
        if (data?.mode === 'satellite' || data?.mode === 'terrain') setMapMode(data.mode);
      })
      .catch(() => {});
  }, []);

  const handleSelectMapMode = (mode: MapLayerMode) => {
    setMapMode(mode);
    fetch('/api/maps/preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    }).catch(() => {});
  };

  const [showParcels, setShowParcels] = useState(true);
  const [showInfrastructure, setShowInfrastructure] = useState(true);
  const [showCandidateSites, setShowCandidateSites] = useState(true);
  const [showWards, setShowWards] = useState(false);
  const [showForests, setShowForests] = useState(true);
  const [showWaterBodies, setShowWaterBodies] = useState(true);
  const [showRealHospitals, setShowRealHospitals] = useState(true);
  const [layerControlOpen, setLayerControlOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ParcelFilterType>(parcelFilter);

  const [wardsData, setWardsData] = useState<any>(null);
  const [forestsData, setForestsData] = useState<any>(null);
  const [waterData, setWaterData] = useState<any>(null);

  const wardsLayerGroupRef = useRef<L.FeatureGroup | null>(null);
  const forestsLayerGroupRef = useRef<L.FeatureGroup | null>(null);
  const waterLayerGroupRef = useRef<L.FeatureGroup | null>(null);

  const layerMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layerMenuRef.current && !layerMenuRef.current.contains(event.target as Node)) {
        setLayerControlOpen(false);
      }
    };
    if (layerControlOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [layerControlOpen]);

  useEffect(() => {
    setActiveFilter(parcelFilter);
  }, [parcelFilter]);

  const getTileConfig = (mode: MapLayerMode) => {
    if (mode === 'terrain') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri Topographic Terrain © OpenStreetMap',
      };
    }
    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri World Imagery',
    };
  };

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = selectedDistrict?.centerLat ?? DEFAULT_LAT;
    const initialLng = selectedDistrict?.centerLng ?? DEFAULT_LNG;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
      maxZoom: 19,
      minZoom: 5,
      // Canvas rendering is essential here: the infrastructure layer plots
      // 4,000+ real school points, far beyond what per-marker DOM nodes
      // (Leaflet's default) can handle without severe jank.
      preferCanvas: true,
    });

    const activeTile = getTileConfig(mapMode);
    const baseTiles = L.tileLayer(activeTile.url, { attribution: activeTile.attribution, maxZoom: 19 }).addTo(map);
    baseTilesRef.current = baseTiles;

    parcelLayerGroupRef.current = L.featureGroup().addTo(map);
    infraLayerGroupRef.current = L.featureGroup().addTo(map);
    sitesLayerGroupRef.current = L.featureGroup().addTo(map);
    wardsLayerGroupRef.current = L.featureGroup().addTo(map);
    forestsLayerGroupRef.current = L.featureGroup().addTo(map);
    waterLayerGroupRef.current = L.featureGroup().addTo(map);

    // Fetch rich integrated layers from server
    fetch('/api/wards')
      .then((r) => r.json())
      .then((d) => { if (d?.geojson) setWardsData(d.geojson); })
      .catch(() => {});

    fetch('/api/protected-forests')
      .then((r) => r.json())
      .then((d) => { if (d?.geojson) setForestsData(d.geojson); })
      .catch(() => {});

    fetch('/api/water-bodies')
      .then((r) => r.json())
      .then((d) => { if (d?.geojson) setWaterData(d.geojson); })
      .catch(() => {});

    map.on('mousemove', (e) => {
      setCursorCoords({ lat: Number(e.latlng.lat.toFixed(4)), lng: Number(e.latlng.lng.toFixed(4)) });
    });

    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    if (mapContainerRef.current) resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (baseTilesRef.current) map.removeLayer(baseTilesRef.current);
    const tileConfig = getTileConfig(mapMode);
    const newBase = L.tileLayer(tileConfig.url, { attribution: tileConfig.attribution, maxZoom: 19 }).addTo(map);
    baseTilesRef.current = newBase;
    newBase.bringToBack();
  }, [mapMode]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedDistrict) return;
    map.flyTo([selectedDistrict.centerLat, selectedDistrict.centerLng], DEFAULT_ZOOM, { duration: 1.2, easeLinearity: 0.25 });
  }, [selectedDistrict]);

  useEffect(() => {
    if (!flyToParcelTarget || !mapInstanceRef.current) return;
    const target = flyToParcelTarget.parcel;
    const map = mapInstanceRef.current;
    if (target.coordinates && target.coordinates.length > 0) {
      const bounds = L.latLngBounds(target.coordinates.map((c) => [c[0], c[1]] as [number, number]));
      map.flyToBounds(bounds.pad(0.5), { duration: 1.4, easeLinearity: 0.25, maxZoom: 17 });
    } else {
      map.flyTo([target.centerLat, target.centerLng], 17, { duration: 1.4, easeLinearity: 0.25 });
    }
  }, [flyToParcelTarget]);

  useEffect(() => {
    if (!flyToLocationTarget || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([flyToLocationTarget.lat, flyToLocationTarget.lng], flyToLocationTarget.zoom || 14, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [flyToLocationTarget]);

  const matchesCategory = (parcel: Parcel, catId: ParcelFilterType): boolean => catId === 'All' || parcel.landUse === catId;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: parcels.length };
    LAND_CATEGORIES.forEach((c) => (counts[c.id] = 0));
    parcels.forEach((p) => {
      counts[p.landUse] = (counts[p.landUse] || 0) + 1;
    });
    return counts;
  }, [parcels]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetNorth = () => {
    if (mapInstanceRef.current && selectedDistrict) {
      mapInstanceRef.current.flyTo([selectedDistrict.centerLat, selectedDistrict.centerLng], DEFAULT_ZOOM, { duration: 0.8 });
    }
  };

  const handleSelectFilter = (filter: ParcelFilterType) => {
    setActiveFilter(filter);
    onFilterChange?.(filter);
    if (filter !== 'All' && mapInstanceRef.current) {
      const matching = parcels.filter((p) => matchesCategory(p, filter));
      if (matching.length > 0) {
        const bounds = L.latLngBounds(matching.map((p) => [p.centerLat, p.centerLng] as [number, number]));
        mapInstanceRef.current.flyToBounds(bounds.pad(0.3), { duration: 1.0, maxZoom: 16 });
      }
    }
  };

  // Render Land Parcels (synthetic-sample cadastral grid, honestly labeled)
  useEffect(() => {
    const group = parcelLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (!showParcels) return;

    parcels.forEach((parcel) => {
      const isSelected = selectedParcel?.id === parcel.id;
      const baseColor = getLandUseColor(parcel.landUse);
      const isMatch = matchesCategory(parcel, activeFilter);
      const isHighlightMode = activeFilter !== 'All';

      let strokeColor = baseColor;
      let weight = isSelected ? 4 : isMatch && isHighlightMode ? 3.5 : 1.8;
      let opacity = 0.9;
      let fillOpacity = 0.28;

      if (isSelected) {
        strokeColor = '#fbbf24';
        weight = 4;
        fillOpacity = 0.55;
        opacity = 1;
      } else if (isHighlightMode) {
        if (isMatch) {
          strokeColor = mapMode === 'satellite' ? '#ffffff' : baseColor;
          weight = 3.5;
          fillOpacity = mapMode === 'satellite' ? 0.45 : 0.4;
        } else {
          strokeColor = isDarkMode ? '#403830' : '#d6d3d1';
          weight = 1.0;
          fillOpacity = 0.05;
          opacity = 0.25;
        }
      } else if (mapMode === 'satellite') {
        strokeColor = '#ffffff';
        fillOpacity = 0.32;
      }

      const polygon = L.polygon(parcel.coordinates, { color: strokeColor, weight, opacity, fillColor: baseColor, fillOpacity });

      polygon.bindTooltip(
        `<div style="font-family: ui-sans-serif, system-ui, sans-serif; padding: 7px 9px; background-color: ${
          isDarkMode ? 'rgba(20, 18, 16, 0.96)' : 'rgba(255, 255, 255, 0.98)'
        }; color: ${isDarkMode ? '#f4ede4' : '#1c1917'}; border: 1px solid ${isDarkMode ? '#3d3328' : '#e7e5e4'}; border-radius: 6px; min-width: 150px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-weight: 700; font-size: 13px;">${parcel.plotId}</span>
            <span style="font-size: 9px; padding: 1px 5px; border-radius: 4px; background: #7c2d12; color: #fed7aa; font-weight: 700;">SYNTHETIC SAMPLE</span>
          </div>
          <div style="font-size: 11px; color: ${isDarkMode ? '#a89f91' : '#78716c'}; margin-top: 2px;">${parcel.landUse} &bull; ${parcel.ownership} &bull; <b>${parcel.areaAcres} Acres</b></div>
        </div>`,
        { sticky: true }
      );

      polygon.on('click', () => onSelectParcel(parcel));
      polygon.addTo(group);
    });
  }, [parcels, selectedParcel, showParcels, activeFilter, mapMode, isDarkMode]);

  // Render Infrastructure Points (real schools + provisional hospital/police/bus)
  useEffect(() => {
    const group = infraLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (!showInfrastructure) return;

    // Canvas-rendered circle markers, not per-point DOM icons - the school
    // layer alone is 4,000+ real points, well beyond what Leaflet's default
    // DOM-marker path can handle smoothly.
    infrastructureAssets.forEach((asset) => {
      const iconColor = asset.dataStatus === 'REAL' ? (isDarkMode ? '#10b981' : '#059669') : isDarkMode ? '#f59e0b' : '#d97706';
      const isSchool = asset.type === 'school';

      const marker = L.circleMarker([asset.lat, asset.lng], {
        radius: isSchool ? 4 : 8,
        color: isDarkMode ? '#1a1613' : '#ffffff',
        weight: 1,
        fillColor: iconColor,
        fillOpacity: 0.9,
      });
      marker.bindPopup(
        `<div style="padding: 8px; font-family: ui-sans-serif, system-ui; background-color: ${
          isDarkMode ? '#181512' : '#ffffff'
        }; color: ${isDarkMode ? '#f4ede4' : '#1c1917'}; border-radius: 6px; border: 1px solid ${isDarkMode ? '#3d3328' : '#e7e5e4'};">
          <div style="font-weight: bold; font-size: 13px;">${asset.name}</div>
          <div style="color: ${isDarkMode ? '#a89f91' : '#78716c'}; font-size: 11px; margin-top: 2px;">${asset.type}${asset.village ? ` &bull; ${asset.village}` : ''}</div>
          <span style="display:inline-block;margin-top:4px;padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; ${
            asset.dataStatus === 'REAL' ? 'background:#064e3b;color:#6ee7b7;' : 'background:#78350f;color:#fcd34d;'
          }">${asset.dataStatus === 'REAL' ? 'REAL (UDISE)' : 'PROVISIONAL PLACEHOLDER'}</span>
        </div>`
      );
      marker.addTo(group);
    });
  }, [infrastructureAssets, showInfrastructure, isDarkMode]);

  // Render Municipal Administrative Wards (48 Wards)
  useEffect(() => {
    const group = wardsLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (!showWards || !wardsData?.features) return;

    wardsData.features.forEach((feat: any) => {
      try {
        const polygon = L.geoJSON(feat, {
          style: {
            color: isDarkMode ? '#60a5fa' : '#2563eb',
            weight: 1.5,
            fillColor: isDarkMode ? '#3b82f6' : '#60a5fa',
            fillOpacity: 0.12,
            dashArray: '3, 4',
          },
        });
        const props = feat.properties || {};
        polygon.bindTooltip(
          `<div style="font-family: ui-sans-serif, system-ui; font-size: 11px; font-weight: bold; padding: 4px 8px; background: ${
            isDarkMode ? '#1e1b18' : '#ffffff'
          }; color: ${isDarkMode ? '#93c5fd' : '#1e40af'}; border: 1px solid #3b82f6; border-radius: 4px;">
            ${props.name || props.ward_name || props.WARD_NAME || 'Municipal Ward'} ${props.zone ? `(${props.zone})` : ''}
          </div>`,
          { sticky: true }
        );
        polygon.addTo(group);
      } catch (e) {}
    });
  }, [wardsData, showWards, isDarkMode]);

  // Render Protected Forests & Ecological Reserves
  useEffect(() => {
    const group = forestsLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (!showForests || !forestsData?.features) return;

    forestsData.features.forEach((feat: any) => {
      try {
        const polygon = L.geoJSON(feat, {
          style: {
            color: '#059669',
            weight: 2,
            fillColor: '#10b981',
            fillOpacity: 0.35,
          },
        });
        const props = feat.properties || {};
        polygon.bindTooltip(
          `<div style="font-family: ui-sans-serif, system-ui; font-size: 11px; font-weight: bold; padding: 4px 8px; background: #064e3b; color: #6ee7b7; border: 1px solid #10b981; border-radius: 4px;">
            🌲 ${props.name || props.forest_name || 'Protected Forest Sanctuary'}
          </div>`,
          { sticky: true }
        );
        polygon.addTo(group);
      } catch (e) {}
    });
  }, [forestsData, showForests, isDarkMode]);

  // Render Water Bodies & Canals
  useEffect(() => {
    const group = waterLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (!showWaterBodies || !waterData?.features) return;

    waterData.features.forEach((feat: any) => {
      try {
        const polygon = L.geoJSON(feat, {
          style: {
            color: '#0284c7',
            weight: 1.2,
            fillColor: '#06b6d4',
            fillOpacity: 0.4,
          },
        });
        const props = feat.properties || {};
        polygon.bindTooltip(
          `<div style="font-family: ui-sans-serif, system-ui; font-size: 11px; padding: 3px 6px; background: #082f49; color: #7dd3fc; border-radius: 4px;">
            💧 ${props.name || props.waterbody || 'Water Body / Reservoir'}
          </div>`,
          { sticky: true }
        );
        polygon.addTo(group);
      } catch (e) {}
    });
  }, [waterData, showWaterBodies, isDarkMode]);

  // Render Candidate Suitability Sites
  useEffect(() => {
    const group = sitesLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (!showCandidateSites) return;

    candidateSites.forEach((site) => {
      const isSelected = selectedSite?.siteId === site.siteId;
      const isRank1 = site.rank === 1;

      const siteIcon = L.divIcon({
        className: 'custom-site-icon',
        html: `<div style="background:${isRank1 ? '#e5a93b' : isDarkMode ? '#38bdf8' : '#0284c7'};width:${
          isRank1 ? '32px' : '26px'
        };height:${isRank1 ? '32px' : '26px'};border-radius:6px;display:flex;align-items:center;justify-content:center;border:2px solid ${
          isSelected ? '#ffffff' : isDarkMode ? '#1a1613' : '#ffffff'
        };box-shadow:0 0 ${isRank1 ? '14px rgba(229,169,59,0.85)' : '8px rgba(0,0,0,0.3)'};color:#1a1613;font-weight:800;font-size:12px;">#${site.rank}</div>`,
        iconSize: isRank1 ? [32, 32] : [26, 26],
        iconAnchor: isRank1 ? [16, 16] : [13, 13],
      });

      const marker = L.marker([site.lat, site.lng], { icon: siteIcon, zIndexOffset: isRank1 ? 1000 : 500 });
      marker.bindPopup(
        `<div style="padding: 8px; font-family: ui-sans-serif, system-ui; background-color: ${
          isDarkMode ? '#181512' : '#ffffff'
        }; color: ${isDarkMode ? '#f4ede4' : '#1c1917'}; border-radius: 6px; border: 1px solid ${isDarkMode ? '#3d3328' : '#e7e5e4'};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; ${
              isRank1 ? 'background:#e5a93b;color:#1a1613;' : 'background:#38bdf8;color:#082f49;'
            }">Rank #${site.rank}</span>
            <span style="color: #10b981; font-weight: bold; font-size: 12px;">${site.compositeScore}/100</span>
          </div>
          <div style="font-weight: bold; font-size: 13px; margin-top: 4px;">${site.plotId}</div>
          <div style="font-size: 11px; color: ${isDarkMode ? '#a89f91' : '#78716c'}; margin-top: 2px;">${site.landUse} &bull; ${site.areaAcres} Acres</div>
        </div>`
      );
      marker.on('click', () => onSelectSite(site));
      marker.addTo(group);
    });
  }, [candidateSites, selectedSite, showCandidateSites, isDarkMode]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#121110]" />

      <div className={`absolute top-4 right-4 ${layerControlOpen ? 'z-[5000]' : 'z-[800]'} flex items-start gap-2`}>
        <div className="flex flex-col gap-1 relative" ref={layerMenuRef}>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom in"
            className={`w-8 h-8 rounded border flex items-center justify-center transition-colors shadow-md ${
              isDarkMode ? 'bg-[#1c1916]/95 hover:bg-[#282420] text-[#f4ede4] border-[#3d3328]' : 'bg-white/95 hover:bg-[#f5f5f4] text-[#1c1917] border-[#e7e5e4]'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom out"
            className={`w-8 h-8 rounded border flex items-center justify-center transition-colors shadow-md ${
              isDarkMode ? 'bg-[#1c1916]/95 hover:bg-[#282420] text-[#f4ede4] border-[#3d3328]' : 'bg-white/95 hover:bg-[#f5f5f4] text-[#1c1917] border-[#e7e5e4]'
            }`}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetNorth}
            title="Reset North / Center"
            className={`w-8 h-8 rounded border flex items-center justify-center transition-colors shadow-md ${
              isDarkMode ? 'bg-[#1c1916]/95 hover:bg-[#282420] text-[#f4ede4] border-[#3d3328]' : 'bg-white/95 hover:bg-[#f5f5f4] text-[#1c1917] border-[#e7e5e4]'
            }`}
          >
            <span className={`text-xs font-mono font-bold ${isDarkMode ? 'text-[#e5a93b]' : 'text-[#d97706]'}`}>▲</span>
          </button>

          <button
            type="button"
            onClick={() => setLayerControlOpen(!layerControlOpen)}
            title="Map Type (Satellite / Terrain)"
            className={`w-8 h-8 rounded border flex items-center justify-center transition-all shadow-md ${
              layerControlOpen
                ? isDarkMode
                  ? 'bg-[#e5a93b] text-[#1a1613] border-[#e5a93b] ring-2 ring-[#e5a93b]/40'
                  : 'bg-[#d97706] text-white border-[#d97706] ring-2 ring-[#d97706]/40'
                : isDarkMode
                ? 'bg-[#1c1916]/95 hover:bg-[#282420] text-[#f4ede4] border-[#3d3328]'
                : 'bg-white/95 hover:bg-[#f5f5f4] text-[#1c1917] border-[#e7e5e4]'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          {layerControlOpen && (
            <div
              className={`absolute right-0 top-10 p-4 rounded-2xl border z-[9999] text-xs shadow-[0_20px_50px_rgba(0,0,0,0.7)] ${
                isDarkMode ? 'bg-[#181512]/98 border-[#42372b] text-[#d4cbbf]' : 'bg-white/98 border-[#e7e5e4] text-[#44403c]'
              }`}
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-inherit">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#a89f91]' : 'text-[#78716c]'}`}>Map Type</span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                {(['satellite', 'terrain'] as MapLayerMode[]).map((mode) => (
                  <button key={mode} type="button" onClick={() => handleSelectMapMode(mode)} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div
                      className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all shadow-md ${
                        mapMode === mode
                          ? isDarkMode
                            ? 'ring-2 ring-[#e5a93b] bg-[#2b241d]'
                            : 'ring-2 ring-[#d97706] bg-[#fef3c7]'
                          : 'border border-[#3d3328]/40 opacity-70 group-hover:opacity-100'
                      }`}
                    >
                      <Layers className={`w-6 h-6 ${mapMode === mode ? 'text-[#e5a93b]' : isDarkMode ? 'text-[#d4cbbf]' : 'text-[#78716c]'}`} />
                    </div>
                    <span className={`text-xs font-semibold capitalize ${mapMode === mode ? 'text-[#e5a93b]' : isDarkMode ? 'text-[#d4cbbf]' : 'text-[#44403c]'}`}>{mode}</span>
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-inherit flex flex-col gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#a89f91]' : 'text-[#78716c]'}`}>Integrated GIS Layers</span>
                <label className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                  <input type="checkbox" checked={showWards} onChange={(e) => setShowWards(e.target.checked)} className="rounded text-[#e5a93b] focus:ring-0" />
                  <span>🏛️ 48 Municipal Wards</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                  <input type="checkbox" checked={showForests} onChange={(e) => setShowForests(e.target.checked)} className="rounded text-[#e5a93b] focus:ring-0" />
                  <span>🌲 6 Forest Reserves</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                  <input type="checkbox" checked={showWaterBodies} onChange={(e) => setShowWaterBodies(e.target.checked)} className="rounded text-[#e5a93b] focus:ring-0" />
                  <span>💧 439 Water Bodies & Canals</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                  <input type="checkbox" checked={showInfrastructure} onChange={(e) => setShowInfrastructure(e.target.checked)} className="rounded text-[#e5a93b] focus:ring-0" />
                  <span>🏫 4,111 Schools & Assets</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                  <input type="checkbox" checked={showParcels} onChange={(e) => setShowParcels(e.target.checked)} className="rounded text-[#e5a93b] focus:ring-0" />
                  <span>📐 Cadastral Parcels Grid</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`absolute top-4 left-4 z-[400] backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-xl flex items-center gap-2.5 text-xs ${
          isDarkMode ? 'bg-[#181512]/90 border-[#3d3328] text-[#d4cbbf]' : 'bg-white/95 border-[#e7e5e4] text-[#44403c]'
        }`}
      >
        <Crosshair className={`w-3.5 h-3.5 animate-pulse ${isDarkMode ? 'text-[#e5a93b]' : 'text-[#d97706]'}`} />
        <span className={`font-mono text-[11px] ${isDarkMode ? 'text-[#f4ede4]' : 'text-[#1c1917]'}`}>
          {cursorCoords.lat}° N, {cursorCoords.lng}° E
        </span>
      </div>

      {showPillFilters && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[200] max-w-[98%] pointer-events-auto">
          <div
            className="flex items-center gap-1.5 backdrop-blur-2xl px-2 py-1.5 rounded-full border border-white/10 bg-[#0B1220]/50 shadow-2xl transition-all overflow-x-auto no-scrollbar"
          >
            <button
              type="button"
              onClick={() => handleSelectFilter('All')}
              className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all shrink-0 ${
                activeFilter === 'All'
                  ? 'bg-[#FF6B53]/25 text-[#FF6B53] border border-[#FF6B53]/50'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              All Land
            </button>
            {LAND_CATEGORIES.map((cat) => {
              const isSelected = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectFilter(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all shrink-0 ${
                    isSelected
                      ? 'bg-[#FF6B53]/25 text-[#FF6B53] border border-[#FF6B53]/50'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{cat.shortLabel}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 leading-none ${
                      isSelected ? 'bg-[#FF6B53]/30 text-[#FF6B53]' : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {categoryCounts[cat.id] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        className={`absolute bottom-2 right-3 z-[100] text-[10px] tracking-tight px-2 py-0.5 rounded pointer-events-none border ${
          isDarkMode ? 'bg-[#121110]/70 text-[#736a5e] border-[#241e18]' : 'bg-white/80 text-[#a8a29e] border-[#e7e5e4]'
        }`}
      >
        {mapMode === 'satellite' ? '© Esri Satellite Imagery' : '© Esri Topographic Terrain © OpenStreetMap'}
      </div>
    </div>
  );
};
