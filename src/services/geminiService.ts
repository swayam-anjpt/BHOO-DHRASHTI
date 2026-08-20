import { GoogleGenAI } from '@google/genai';
import { AskGlisQuery, AskGlisResponse, CandidateSiteScore, DistrictMetrics } from '../types';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Explains why a specific candidate site was recommended, using only the
 * real fields the scoring engine actually computed (no invented catchment
 * population or CapEx figures).
 */
export async function explainSiteRecommendation(
  site: CandidateSiteScore,
  district: DistrictMetrics,
  alternativeSite?: CandidateSiteScore
): Promise<{ explanation: string; tradeOffAnalysis: string; executiveSummary: string }> {
  const fallback = {
    executiveSummary: `Site rank #${site.rank} (${site.plotId}) achieves a composite suitability score of ${site.compositeScore}/100, combining real accessibility to the nearest infrastructure point and ${district.name} district's socio-economic equity weighting.`,
    explanation: `The site was prioritized because it is Government-owned ${site.landUse} land, ${site.areaAcres} acres, ${site.nearestInfrastructure ? `${site.nearestInfrastructure.distanceKm}km from the nearest existing facility (${site.nearestInfrastructure.name})` : 'with no nearby infrastructure point found in the loaded dataset'}. ${district.name} district carries a relative deprivation proxy of ${district.relativeDeprivationProxy0to100}/100 (Census-derived), which weights the equity component of the score.`,
    tradeOffAnalysis: alternativeSite
      ? `Compared to ${alternativeSite.plotId} (score ${alternativeSite.compositeScore}), ${site.plotId} scores ${(site.compositeScore - alternativeSite.compositeScore).toFixed(1)} points higher, driven mainly by ${site.factors.accessibilityScore > alternativeSite.factors.accessibilityScore ? 'better accessibility' : 'stronger land suitability'}.`
      : site.dataDisclaimer,
  };

  const ai = getAiClient();
  if (!ai) return fallback;

  try {
    const prompt = `You are the Chief Geospatial Policy Advisor for GLIS (Government Land Information System).
Explain why candidate site ${site.plotId} was recommended in ${district.name} district.

Structured facts (do NOT contradict or invent numbers beyond these):
- District: ${district.name}, State: ${district.state}
- District relative deprivation proxy (Census-derived, constructed index): ${district.relativeDeprivationProxy0to100}/100
- Candidate parcel: ${site.plotId}, land use: ${site.landUse}, ownership: ${site.ownership}, area: ${site.areaAcres} acres
- Composite suitability score: ${site.compositeScore}/100 (rank ${site.rank})
- Accessibility score: ${site.factors.accessibilityScore}/100
- Land suitability score: ${site.factors.landSuitabilityScore}/100
- Socio-economic equity score: ${site.factors.socioEconomicEquityScore}/100
${site.nearestInfrastructure ? `- Nearest existing facility: ${site.nearestInfrastructure.name} (${site.nearestInfrastructure.type}), ${site.nearestInfrastructure.distanceKm}km away` : '- No nearby infrastructure point in the loaded dataset'}
- Data disclaimer: ${site.dataDisclaimer}

Provide a professional, clear 3-part response:
1. Executive Summary (1 concise sentence)
2. Explainable Siting Justification (2-3 sentences)
3. Trade-off Analysis (1-2 sentences)
Do not invent catchment population, cost, or any figure not listed above.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    const text = response.text || '';
    if (text) {
      return {
        executiveSummary: fallback.executiveSummary,
        explanation: text,
        tradeOffAnalysis: fallback.tradeOffAnalysis,
      };
    }
  } catch (err) {
    console.error('Gemini explanation fallback triggered:', err);
  }

  return fallback;
}

/**
 * Natural language "Ask GLIS" assistant query handler, scoped to the single
 * real district (Ahmedabad) the platform currently has data for.
 */
export async function queryAskGlis(query: AskGlisQuery, district: DistrictMetrics): Promise<AskGlisResponse> {
  const q = query.question.toLowerCase();

  let fallbackAnswer = `${district.name} district (Census 2011) has a population of ${district.totalPopulation.toLocaleString()}, a literacy rate of ${district.literacyRatePercent}%, and a relative deprivation proxy of ${district.relativeDeprivationProxy0to100}/100 (a constructed index, not an official government statistic). It has ${district.totalSchools.toLocaleString()} schools (real UDISE data) and ${district.totalHospitals} hospitals (provisional placeholder data only).`;

  if (q.includes('school') || q.includes('education')) {
    fallbackAnswer = `${district.name} district has ${district.totalSchools.toLocaleString()} schools per the real UDISE dataset (${district.ruralSchools.toLocaleString()} rural, ${district.urbanSchools.toLocaleString()} urban) - roughly 1 school per ${district.populationPerSchool.toLocaleString()} people.`;
  } else if (q.includes('hospital') || q.includes('health')) {
    fallbackAnswer = `${district.name} district's healthcare data is explicitly marked provisional in the source dataset: only ${district.totalHospitals} hospitals are recorded (a placeholder seed list, not comprehensive), giving a nominal ${district.populationPerHospital.toLocaleString()} people per hospital. This should not be read as the true hospital count for the district.`;
  } else if (q.includes('deprivation') || q.includes('equity') || q.includes('need')) {
    fallbackAnswer = `${district.name} district's relative deprivation proxy is ${district.relativeDeprivationProxy0to100}/100 - a constructed index from the dataset (see generate_socio_economic.py for its formula), not an officially published government statistic. It factors into the Infrastructure Siting engine's equity weighting.`;
  }

  const ai = getAiClient();
  if (!ai) {
    return { answer: fallbackAnswer, confidence: 0.9, suggestedAction: `View ${district.name} on the Intelligence Map.` };
  }

  try {
    const prompt = `You are Ask GLIS, the AI Geospatial Decision Assistant for the GLIS Platform.
The user asked: "${query.question}"

Use only these real facts about ${district.name} district (Gujarat) - do not invent any other district or numbers:
- Population (Census 2011): ${district.totalPopulation.toLocaleString()}
- Literacy rate: ${district.literacyRatePercent}%
- Relative deprivation proxy (constructed index): ${district.relativeDeprivationProxy0to100}/100
- Schools (real, UDISE): ${district.totalSchools.toLocaleString()}
- Hospitals (provisional placeholder only): ${district.totalHospitals}
- Population per school: ${district.populationPerSchool.toLocaleString()}

Rules:
- Be concise (2-4 paragraphs).
- Clearly distinguish REAL data from PROVISIONAL/placeholder data when relevant.
- Do not invent fictitious districts, numbers, or facilities.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    const text = response.text || '';
    if (text) {
      return { answer: text, confidence: 0.95, suggestedAction: `Open ${district.name} in the Site Suitability engine.` };
    }
  } catch (err) {
    console.error('Ask GLIS Gemini query error:', err);
  }

  return { answer: fallbackAnswer, confidence: 0.9, suggestedAction: `Inspect ${district.name} layer details.` };
}
