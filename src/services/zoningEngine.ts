import {
  DistrictMetrics,
  LandUseOwnershipAnomaly,
  Parcel,
  SampleZoneLandUseComposition,
  UrbanExpansionIndex,
} from '../types';

/**
 * Flags real, defensible land_use x ownership anomalies in the cadastral
 * sample - e.g. ecologically-sensitive land recorded as privately owned, or
 * a parcel labeled "Government Revenue Land" with non-Government ownership.
 * The earlier "zoning violation" concept (planned zone vs. actual use) is
 * dropped: real cadastral data only carries one land-use field, not two.
 */
export function detectLandUseOwnershipAnomalies(parcels: Parcel[]): LandUseOwnershipAnomaly[] {
  const anomalies: LandUseOwnershipAnomaly[] = [];

  parcels.forEach((p) => {
    if ((p.landUse === 'Forest/Protected' || p.landUse === 'Water Bodies') && p.ownership === 'Private') {
      anomalies.push({
        parcelId: p.id,
        plotId: p.plotId,
        district: p.district,
        landUse: p.landUse,
        ownership: p.ownership,
        areaAcres: p.areaAcres,
        anomalyType: 'Privately-Owned Ecologically Sensitive Land',
        severity: 'High',
        description: `Parcel classified as ${p.landUse} but recorded under private ownership.`,
        recommendedAction: 'Verify title and consider acquisition or conservation easement review.',
      });
    }

    if (p.landUse === 'Government Revenue Land' && p.ownership !== 'Government') {
      anomalies.push({
        parcelId: p.id,
        plotId: p.plotId,
        district: p.district,
        landUse: p.landUse,
        ownership: p.ownership,
        areaAcres: p.areaAcres,
        anomalyType: 'Ownership Mismatch on Government-Labeled Land',
        severity: 'Moderate',
        description: `Parcel labeled 'Government Revenue Land' but recorded ownership is '${p.ownership}'.`,
        recommendedAction: 'Cross-check with the revenue record; flag for land-registry reconciliation.',
      });
    }
  });

  return anomalies;
}

/** Real land-use composition of the sample-zone cadastral parcels - explicitly not district-wide. */
export function calculateLandUseComposition(parcels: Parcel[]): SampleZoneLandUseComposition {
  const totalAreaAcres = Number(parcels.reduce((sum, p) => sum + p.areaAcres, 0).toFixed(1));
  const byLandUse = new Map<string, { count: number; area: number }>();

  parcels.forEach((p) => {
    const entry = byLandUse.get(p.landUse) || { count: 0, area: 0 };
    entry.count += 1;
    entry.area += p.areaAcres;
    byLandUse.set(p.landUse, entry);
  });

  const breakdown = Array.from(byLandUse.entries()).map(([landUse, v]) => ({
    landUse: landUse as any,
    parcelCount: v.count,
    areaAcres: Number(v.area.toFixed(1)),
    percentOfSample: Number(((v.area / totalAreaAcres) * 100).toFixed(1)),
  }));
  breakdown.sort((a, b) => b.areaAcres - a.areaAcres);

  return {
    district: parcels[0]?.district || 'Ahmedabad',
    sampleZoneLabel: parcels[0]?.sampleZoneLabel || '',
    totalParcels: parcels.length,
    totalAreaAcres,
    breakdown,
  };
}

/**
 * Urban-expansion pressure index using only real district-level fields:
 * population density and urban population share (from Census 2011).
 */
export function calculateUrbanExpansionIndex(district: DistrictMetrics): UrbanExpansionIndex {
  const densityPressure = Math.min(100, (district.populationDensityPerSqKm / 1000) * 100);
  const urbanPopulationPercent = Number((100 - district.ruralPopulationPercent).toFixed(1));
  const expansionPressureScore = Number(
    Math.min(100, densityPressure * 0.5 + urbanPopulationPercent * 0.5).toFixed(1)
  );

  let pressureLevel: UrbanExpansionIndex['pressureLevel'];
  let recommendedAction: string;
  if (expansionPressureScore >= 75) {
    pressureLevel = 'Critical';
    recommendedAction = 'Revise master plan zoning boundaries; prioritize vertical densification and infrastructure capacity expansion.';
  } else if (expansionPressureScore >= 55) {
    pressureLevel = 'High';
    recommendedAction = 'Pre-emptively designate growth corridors ahead of demand.';
  } else if (expansionPressureScore >= 35) {
    pressureLevel = 'Moderate';
    recommendedAction = 'Monitor land-use conversion trends periodically.';
  } else {
    pressureLevel = 'Low';
    recommendedAction = 'Current capacity is adequate for projected near-term growth.';
  }

  return {
    district: district.name,
    populationDensityPerSqKm: district.populationDensityPerSqKm,
    urbanPopulationPercent,
    expansionPressureScore,
    pressureLevel,
    recommendedAction,
    narrative: `${district.name} has a population density of ${district.populationDensityPerSqKm}/sq km and is ${urbanPopulationPercent}% urban (Census 2011), yielding ${pressureLevel.toLowerCase()} urban expansion pressure.`,
  };
}
