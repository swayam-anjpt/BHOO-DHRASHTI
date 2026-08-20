import { DistrictEquityStatement, DistrictMetrics, GovernmentLandRegistryEntry, Parcel, RedevelopmentCandidate } from '../types';

/** Plain, unscored registry of Government/Forest-owned parcels - no fabricated dispute/encroachment risk. */
export function getGovernmentLandRegistry(parcels: Parcel[]): GovernmentLandRegistryEntry[] {
  return parcels
    .filter((p) => p.ownership === 'Government' || p.ownership === 'Forest')
    .map((p) => ({
      parcelId: p.id,
      plotId: p.plotId,
      district: p.district,
      landUse: p.landUse,
      ownership: p.ownership,
      areaAcres: p.areaAcres,
      centerLat: p.centerLat,
      centerLng: p.centerLng,
    }));
}

/**
 * A single, honestly-scoped equity statement for the one district with real
 * data: what share of the sample-zone cadastral parcels is government-owned,
 * compared against the district's real deprivation proxy. Earlier versions
 * implied a multi-district ranking that the dataset cannot support.
 */
export function calculateDistrictEquityStatement(district: DistrictMetrics, parcels: Parcel[]): DistrictEquityStatement {
  const totalArea = parcels.reduce((sum, p) => sum + p.areaAcres, 0);
  const govArea = parcels.filter((p) => p.ownership === 'Government').reduce((sum, p) => sum + p.areaAcres, 0);
  const sampleZoneGovernmentLandPercent = totalArea > 0 ? Number(((govArea / totalArea) * 100).toFixed(1)) : 0;

  let classification: DistrictEquityStatement['classification'];
  let narrative: string;
  if (district.relativeDeprivationProxy0to100 >= 15 && sampleZoneGovernmentLandPercent < 20) {
    classification = 'High Need, Limited Sample-Zone Government Land';
    narrative = `${district.name} carries a relative deprivation proxy of ${district.relativeDeprivationProxy0to100}/100, while only ${sampleZoneGovernmentLandPercent}% of the digitized sample zone is government-owned land available for public investment.`;
  } else if (district.relativeDeprivationProxy0to100 >= 15) {
    classification = 'High Need, Notable Sample-Zone Government Land';
    narrative = `${district.name} carries a relative deprivation proxy of ${district.relativeDeprivationProxy0to100}/100, and ${sampleZoneGovernmentLandPercent}% of the digitized sample zone is government-owned - a meaningful base for targeted public investment.`;
  } else {
    classification = 'Lower Need';
    narrative = `${district.name}'s relative deprivation proxy (${district.relativeDeprivationProxy0to100}/100) is comparatively low against the ${sampleZoneGovernmentLandPercent}% government-owned share of the digitized sample zone.`;
  }

  return {
    district: district.name,
    sampleZoneGovernmentLandPercent,
    relativeDeprivationProxy0to100: district.relativeDeprivationProxy0to100,
    classification,
    narrative,
    scopeCaveat:
      'Government-land percentage is computed from the digitized sample-zone cadastral parcels only, not the full district; the deprivation proxy is a real district-wide Census-derived figure. The two are not on the same spatial scope.',
  };
}

/**
 * Replaces the old fictional "dead capital" drift/NDVI/dormancy explorer
 * (zero real backing) with a plain filter over real parcels: government-owned
 * land classified Agriculture or Government Revenue Land - i.e. not already
 * built up - ranked by area. No fabricated encroachment or valuation metrics.
 */
export function getRedevelopmentCandidates(parcels: Parcel[]): RedevelopmentCandidate[] {
  return parcels
    .filter((p) => p.ownership === 'Government' && (p.landUse === 'Agriculture' || p.landUse === 'Government Revenue Land'))
    .map((p) => ({
      id: p.id,
      plotId: p.plotId,
      landUse: p.landUse,
      ownership: p.ownership,
      areaAcres: p.areaAcres,
      centerLat: p.centerLat,
      centerLng: p.centerLng,
      sampleZoneLabel: p.sampleZoneLabel,
      rationale: `Government-owned, ${p.areaAcres} acres, classified ${p.landUse} - not currently built up; a candidate for redevelopment or public-infrastructure use.`,
      dataStatus: p.dataStatus,
    }))
    .sort((a, b) => b.areaAcres - a.areaAcres);
}
