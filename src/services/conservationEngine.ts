import { EcologicalParcelEntry, Parcel, ProtectedAreaEntry } from '../types';

/**
 * Lists ecologically-relevant parcels (Forest/Protected or Water Bodies
 * land use) with a concern level derived only from real ownership data -
 * privately-held sensitive land is flagged higher than Forest-Department-
 * or Government-held land. The earlier version fabricated an
 * environmentalSensitivity/floodRisk score that never had real backing.
 */
export function getEcologicalParcels(parcels: Parcel[]): EcologicalParcelEntry[] {
  return parcels
    .filter((p) => p.landUse === 'Forest/Protected' || p.landUse === 'Water Bodies')
    .map((p) => {
      const concernLevel: EcologicalParcelEntry['concernLevel'] =
        p.ownership === 'Private' ? 'High' : p.ownership === 'Government' ? 'Moderate' : 'Low';

      const narrative =
        concernLevel === 'High'
          ? `${p.landUse} parcel under private ownership - highest-priority for conservation review; recommend excluding from any development pipeline.`
          : concernLevel === 'Moderate'
          ? `${p.landUse} parcel under government ownership - recommend formal protected-area designation.`
          : `${p.landUse} parcel already under Forest Department custody - standard monitoring sufficient.`;

      return {
        parcelId: p.id,
        plotId: p.plotId,
        district: p.district,
        landUse: p.landUse,
        ownership: p.ownership,
        areaAcres: p.areaAcres,
        concernLevel,
        narrative,
      };
    })
    .sort((a, b) => (a.concernLevel === b.concernLevel ? b.areaAcres - a.areaAcres : a.concernLevel === 'High' ? -1 : 1));
}

/** Real protected/forest-custody parcel registry. */
export function getProtectedAreaRegistry(parcels: Parcel[]): ProtectedAreaEntry[] {
  return parcels
    .filter((p) => p.ownership === 'Forest' || p.landUse === 'Forest/Protected')
    .map((p) => {
      const basisParts: string[] = [];
      if (p.ownership === 'Forest') basisParts.push('Forest Department custody');
      if (p.landUse === 'Forest/Protected') basisParts.push('Forest/Protected land-use classification');

      return {
        parcelId: p.id,
        plotId: p.plotId,
        district: p.district,
        landUse: p.landUse,
        ownership: p.ownership,
        areaAcres: p.areaAcres,
        protectionBasis: basisParts.join('; '),
      };
    });
}
