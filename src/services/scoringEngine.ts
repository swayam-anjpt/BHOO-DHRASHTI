import { CandidateSiteScore, DistrictMetrics, InfrastructureAsset, Parcel, SuitabilityWeights } from '../types';
import { haversineDistanceKm } from './geoUtils';

export const DEFAULT_WEIGHTS: SuitabilityWeights = {
  accessibility: 45,
  landSuitability: 35,
  socioEconomicEquity: 20,
};

function nearestInfrastructure(lat: number, lng: number, infra: InfrastructureAsset[]) {
  let nearest: InfrastructureAsset | null = null;
  let minDist = Infinity;
  for (const asset of infra) {
    const d = haversineDistanceKm(lat, lng, asset.lat, asset.lng);
    if (d < minDist) {
      minDist = d;
      nearest = asset;
    }
  }
  return nearest ? { asset: nearest, distanceKm: Number(minDist.toFixed(2)) } : null;
}

/**
 * Site-suitability scoring built only from real fields: land suitability
 * (ownership + area, from the synthetic-sample cadastral parcels),
 * accessibility (actual distance to the nearest real infrastructure point),
 * and a district-level socio-economic equity weight (the dataset's own
 * relative-deprivation proxy). The previous 7-factor model included
 * slope/flood-risk/cost/zoning inputs that never had real backing data -
 * those are dropped rather than estimated.
 */
export function calculateCandidateSiteScores(
  parcels: Parcel[],
  district: DistrictMetrics,
  infrastructure: InfrastructureAsset[],
  weights: SuitabilityWeights = DEFAULT_WEIGHTS
): CandidateSiteScore[] {
  // Only Government-owned, non-ecologically-sensitive land is realistically
  // available for public-infrastructure siting.
  const candidates = parcels.filter(
    (p) => p.ownership === 'Government' && p.landUse !== 'Water Bodies' && p.landUse !== 'Forest/Protected'
  );

  const totalWeight = weights.accessibility + weights.landSuitability + weights.socioEconomicEquity || 100;

  // Invert the real deprivation proxy onto a 0-100 "need" scale (higher = greater need).
  const socioEconomicEquityScore = Math.min(100, Number((district.relativeDeprivationProxy0to100 * 3).toFixed(1)));

  const results: CandidateSiteScore[] = candidates.map((parcel) => {
    const nearest = nearestInfrastructure(parcel.centerLat, parcel.centerLng, infrastructure);

    const accessibilityScore = nearest ? Math.max(10, 100 - nearest.distanceKm * 12) : 40;

    let landSuitabilityScore = 50;
    if (parcel.landUse === 'Government Revenue Land') landSuitabilityScore += 25;
    else if (parcel.landUse === 'Agriculture') landSuitabilityScore += 10;
    if (parcel.areaAcres >= 10) landSuitabilityScore += 15;
    else if (parcel.areaAcres >= 5) landSuitabilityScore += 8;
    landSuitabilityScore = Math.min(100, landSuitabilityScore);

    const wAccessibility = accessibilityScore * (weights.accessibility / totalWeight);
    const wLandSuitability = landSuitabilityScore * (weights.landSuitability / totalWeight);
    const wEquity = socioEconomicEquityScore * (weights.socioEconomicEquity / totalWeight);

    const compositeScore = Number((wAccessibility + wLandSuitability + wEquity).toFixed(1));

    return {
      siteId: `site-${parcel.plotId}`,
      parcelId: parcel.id,
      plotId: parcel.plotId,
      siteName: `${parcel.plotId} (${parcel.landUse}, ${parcel.areaAcres} acres)`,
      district: parcel.district,
      lat: parcel.centerLat,
      lng: parcel.centerLng,
      areaAcres: parcel.areaAcres,
      landUse: parcel.landUse,
      ownership: parcel.ownership,
      compositeScore,
      rank: 1,
      factors: {
        accessibilityScore: Number(accessibilityScore.toFixed(1)),
        landSuitabilityScore: Number(landSuitabilityScore.toFixed(1)),
        socioEconomicEquityScore,
      },
      weightedContributions: {
        accessibility: Number(wAccessibility.toFixed(1)),
        landSuitability: Number(wLandSuitability.toFixed(1)),
        socioEconomicEquity: Number(wEquity.toFixed(1)),
      },
      nearestInfrastructure: nearest
        ? { name: nearest.asset.name, type: nearest.asset.type, distanceKm: nearest.distanceKm }
        : null,
      justificationSummary: nearest
        ? `Government-owned ${parcel.landUse.toLowerCase()} parcel, ${parcel.areaAcres} acres, ${nearest.distanceKm}km from the nearest existing facility (${nearest.asset.name}).`
        : `Government-owned ${parcel.landUse.toLowerCase()} parcel, ${parcel.areaAcres} acres. No infrastructure point found nearby in the loaded dataset.`,
      dataDisclaimer: `Based on the ${parcel.sampleZoneLabel}, a synthetic demo parcel grid - not district-wide real cadastral data. Equity weighting uses ${district.name} district's real Census-derived deprivation proxy (a constructed index - see district data notes).`,
    };
  });

  results.sort((a, b) => b.compositeScore - a.compositeScore);
  results.forEach((s, i) => {
    s.rank = i + 1;
  });
  return results;
}
