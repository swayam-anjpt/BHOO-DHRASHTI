import { Language } from '../types';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  tagline: string;
  nav: {
    home: string;
    dashboard: string;
    map: string;
    infrastructure: string;
    socioEconomic: string;
    siteRecommendations: string;
    gaps: string;
    citizenPortal: string;
    dataQuality: string;
    satelliteMonitoring: string;
    reports: string;
    auditTrail: string;
    askGlis: string;
    admin: string;
    login: string;
    register: string;
    logout: string;
  };
  roles: {
    citizen: string;
    official: string;
    admin: string;
  };
  metrics: {
    totalDistricts: string;
    trackedAssets: string;
    criticalCondition: string;
    citizenGrievances: string;
    highPriorityDistricts: string;
    dniIndex: string;
    equityScore: string;
    servedPopulation: string;
  };
  actions: {
    explorePlatform: string;
    citizenLogin: string;
    officialLogin: string;
    reportIssue: string;
    calculateSuitability: string;
    generateReport: string;
    exportPdf: string;
    exportCsv: string;
    exportJson: string;
    filter: string;
    reset: string;
    applyWeights: string;
    viewDetails: string;
    close: string;
    submit: string;
  };
  weights: {
    title: string;
    accessibility: string;
    populationDemand: string;
    landSuitability: string;
    existingInfrastructure: string;
    estimatedCost: string;
    environmentalRisk: string;
    socioEconomicNeed: string;
    equityNotice: string;
  };
  disclaimer: {
    demoBadge: string;
    demoNote: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'GLIS Geospatial Intelligence Platform',
    appSubtitle: 'Turning Land Data into Smarter, Fairer Infrastructure Decisions',
    tagline: 'An intelligent geospatial decision-support platform connecting land records, socio-economic deprivation, and equity-weighted infrastructure siting.',
    nav: {
      home: 'Home',
      dashboard: 'Executive Dashboard',
      map: 'Intelligence Map',
      infrastructure: 'Infrastructure Assets',
      socioEconomic: 'Socio-Economic Engine',
      siteRecommendations: 'Site Suitability & Recommendations',
      gaps: 'Infrastructure Gaps',
      citizenPortal: 'Citizen Grievances',
      dataQuality: 'Data Quality Center',
      satelliteMonitoring: 'Satellite Progress',
      reports: 'Official Dossiers & Reports',
      auditTrail: 'Audit Trail & Governance',
      askGlis: 'Ask GLIS AI Assistant',
      admin: 'Admin & Datasets',
      login: 'Sign In',
      register: 'Citizen Registration',
      logout: 'Sign Out',
    },
    roles: {
      citizen: 'Citizen Portal',
      official: 'Government Official',
      admin: 'System Administrator',
    },
    metrics: {
      totalDistricts: 'Analyzed Districts',
      trackedAssets: 'Tracked Assets',
      criticalCondition: 'Critical Condition Assets',
      citizenGrievances: 'Citizen Grievances',
      highPriorityDistricts: 'High Priority Need Zones',
      dniIndex: 'Development Need Index (DNI)',
      equityScore: 'Equity Alignment Score',
      servedPopulation: 'Underserved Population Served',
    },
    actions: {
      explorePlatform: 'Explore Geospatial Platform',
      citizenLogin: 'Citizen Portal',
      officialLogin: 'Official Sign In',
      reportIssue: 'Report Infrastructure Grievance',
      calculateSuitability: 'Recalculate Suitability',
      generateReport: 'Generate Official Dossier',
      exportPdf: 'Export Official PDF',
      exportCsv: 'Export Raw CSV',
      exportJson: 'Export JSON',
      filter: 'Filter Layers',
      reset: 'Reset Defaults',
      applyWeights: 'Apply Policy Weights',
      viewDetails: 'View In-depth Breakdown',
      close: 'Close',
      submit: 'Submit Report',
    },
    weights: {
      title: 'Multi-Criteria Policy Weights Configuration',
      accessibility: 'Road & Transit Accessibility',
      populationDemand: 'Population & Catchment Demand',
      landSuitability: 'Land Topography & Vacancy',
      existingInfrastructure: 'Complementary Infrastructure',
      estimatedCost: 'CapEx & Acquisition Cost',
      environmentalRisk: 'Environmental & Hazard Safety',
      socioEconomicNeed: 'Socio-Economic Equity Need (Core Differentiator)',
      equityNotice: 'Equity weighting boosts underserved areas so decisions are not biased purely by lowest cost or highest urban density.',
    },
    disclaimer: {
      demoBadge: 'Smart India Hackathon Prototype Dataset',
      demoNote: 'Demonstration Dataset active. Replace with official State/GLIS spatial database in production.',
    },
  },
  hi: {
    appTitle: 'जीएलआईएस भू-स्थानिक खुफिया मंच',
    appSubtitle: 'भूमि डेटा को अधिक सटीक और न्यायसंगत बुनियादी ढांचा निर्णयों में बदलना',
    tagline: 'भूमि रिकॉर्ड, सामाजिक-आर्थिक स्थिति और समता-आधारित बुनियादी ढांचा योजना के लिए एक बुद्धिमान भू-स्थानिक मंच।',
    nav: {
      home: 'मुख्य पृष्ठ',
      dashboard: 'कार्यकारी डैशबोर्ड',
      map: 'खुफिया मानचित्र',
      infrastructure: 'बुनियादी ढांचा संपत्ति',
      socioEconomic: 'सामाजिक-आर्थिक विश्लेषण',
      siteRecommendations: 'स्थल उपयुक्तता और सिफारिशें',
      gaps: 'बुनियादी ढांचा अंतराल',
      citizenPortal: 'नागरिक शिकायत पोर्टल',
      dataQuality: 'डेटा गुणवत्ता केंद्र',
      satelliteMonitoring: 'उपग्रह प्रगति निगरानी',
      reports: 'आधिकारिक रिपोर्ट',
      auditTrail: 'ऑडिट ट्रेल और शासन',
      askGlis: 'जीएलआईएस एआई सहायक',
      admin: 'प्रशासनिक सेटिंग्स',
      login: 'लॉग इन करें',
      register: 'नागरिक पंजीकरण',
      logout: 'लॉग आउट',
    },
    roles: {
      citizen: 'नागरिक',
      official: 'सरकारी अधिकारी',
      admin: 'प्रशासक',
    },
    metrics: {
      totalDistricts: 'विश्लेषित जिले',
      trackedAssets: 'ट्रैक की गई संपत्तियां',
      criticalCondition: 'गंभीर स्थिति वाली संपत्तियां',
      citizenGrievances: 'नागरिक शिकायतें',
      highPriorityDistricts: 'उच्च प्राथमिकता क्षेत्र',
      dniIndex: 'विकास आवश्यकता सूचकांक (DNI)',
      equityScore: 'सामाजिक समता स्कोर',
      servedPopulation: 'वंचित आबादी लाभांवित',
    },
    actions: {
      explorePlatform: 'प्लेटफ़ॉर्म देखें',
      citizenLogin: 'नागरिक पोर्टल',
      officialLogin: 'अधिकारी लॉगिन',
      reportIssue: 'समस्या दर्ज करें',
      calculateSuitability: 'उपयुक्तता पुनर्गणना',
      generateReport: 'रिपोर्ट बनाएं',
      exportPdf: 'पीडीएफ निर्यात',
      exportCsv: 'सीएसवी निर्यात',
      exportJson: 'जेएसओएन निर्यात',
      filter: 'फ़िल्टर',
      reset: 'रीसेट',
      applyWeights: 'नीति भार लागू करें',
      viewDetails: 'विवरण देखें',
      close: 'बंद करें',
      submit: 'जमा करें',
    },
    weights: {
      title: 'बहु-मानदंड नीति भार विन्यास',
      accessibility: 'सड़क एवं परिवहन सुगमता',
      populationDemand: 'जनसंख्या मांग',
      landSuitability: 'भूमि उपयुक्तता',
      existingInfrastructure: 'मौजूदा बुनियादी ढांचा',
      estimatedCost: 'अनुमानित लागत',
      environmentalRisk: 'पर्यावरणीय सुरक्षा',
      socioEconomicNeed: 'सामाजिक-आर्थिक समता (मुख्य विशेषता)',
      equityNotice: 'समता भार वंचित क्षेत्रों को प्राथमिकता देता है ताकि निर्णय केवल न्यूनतम लागत से प्रभावित न हों।',
    },
    disclaimer: {
      demoBadge: 'स्मार्ट इंडिया हैकथॉन प्रोटोटाइप डेटासेट',
      demoNote: 'प्रदर्शन डेटासेट सक्रिय है। उत्पादन में आधिकारिक जीएलआईएस डेटा से बदलें।',
    },
  },
  gu: {
    appTitle: 'GLIS ભૌગોલિક ઇન્ટેલિજન્સ પ્લેટફોર્મ',
    appSubtitle: 'જમીન ડેટાને સ્માર્ટર, ન્યાયી ઇન્ફ્રાસ્ટ્રક્ચર નિર્ણયોમાં રૂપાંતરિત કરવું',
    tagline: 'જમીન રેકોર્ડ્સ, સામાજિક-આર્થિક જરૂરિયાતો અને ઇક્વિટી-વેઇટેડ ઇન્ફ્રાસ્ટ્રક્ચર આયોજન માટે એક બુદ્ધિશાળી જીઓસ્પેશિયલ પ્લેટફોર્મ.',
    nav: {
      home: 'મુખ્ય પૃષ્ઠ',
      dashboard: 'એક્ઝિક્યુટિવ ડેશબોર્ડ',
      map: 'ઇન્ટેલિજન્સ મેપ',
      infrastructure: 'ઇન્ફ્રાસ્ટ્રક્ચર અસ્કયામતો',
      socioEconomic: 'સામાજિક-આર્થિક એન્જિન',
      siteRecommendations: 'સાઇટ યોગ્યતા અને ભલામણો',
      gaps: 'ઇન્ફ્રાસ્ટ્રક્ચર ગેપ્સ',
      citizenPortal: 'નાગરિક ફરિયાદો',
      dataQuality: 'ડેટા ગુણવત્તા કેન્દ્ર',
      satelliteMonitoring: 'સેટેલાઇટ પ્રગતિ',
      reports: 'સત્તાવાર અહેવાલો',
      auditTrail: 'ઓડિટ ટ્રેઇલ',
      askGlis: 'Ask GLIS AI સહાયક',
      admin: 'એડમિન',
      login: 'સાઇન ઇન',
      register: 'નાગરિક નોંધણી',
      logout: 'સાઇન આઉટ',
    },
    roles: {
      citizen: 'નાગરિક',
      official: 'સરકારી અધિકારી',
      admin: 'એડમિનિસ્ટ્રેટર',
    },
    metrics: {
      totalDistricts: 'વિશ્લેષિત જિલ્લાઓ',
      trackedAssets: 'ટ્રેક કરેલ અસ્કયામતો',
      criticalCondition: 'ગંભીર સ્થિતિ અસ્કયામતો',
      citizenGrievances: 'નાગરિક ફરિયાદો',
      highPriorityDistricts: 'ઉચ્ચ પ્રાથમિકતા વિસ્તારો',
      dniIndex: 'વિકાસ જરૂરિયાત સૂચકાંક (DNI)',
      equityScore: 'ન્યાયિક સ્કોર',
      servedPopulation: 'લાભાન્વિત વસ્તી',
    },
    actions: {
      explorePlatform: 'પ્લેટફોર્મ એક્સપ્લોર કરો',
      citizenLogin: 'નાગરિક પોર્ટલ',
      officialLogin: 'અધિકારી લૉગિન',
      reportIssue: 'ફરિયાદ નોંધાવો',
      calculateSuitability: 'યોગ્યતા ગણતરી',
      generateReport: 'અહેવાલ બનાવો',
      exportPdf: 'PDF એક્સપોર્ટ',
      exportCsv: 'CSV એક્સપોર્ટ',
      exportJson: 'JSON એક્સપોર્ટ',
      filter: 'ફિલ્ટર',
      reset: 'રીસેટ',
      applyWeights: 'વેઇટ્સ લાગુ કરો',
      viewDetails: 'વિગતો જુઓ',
      close: 'બંધ કરો',
      submit: 'સબમિટ કરો',
    },
    weights: {
      title: 'મલ્ટિ-ક્રાઇટેરિયા પોલિસી વેઇટ્સ કન્ફિગરેશન',
      accessibility: 'રોડ અને ટ્રાન્સપોર્ટ કનેક્ટિવિટી',
      populationDemand: 'વસ્તી માંગ',
      landSuitability: 'જમીન યોગ્યતા',
      existingInfrastructure: 'હાલનું ઇન્ફ્રાસ્ટ્રક્ચર',
      estimatedCost: 'અંદાજિત ખર્ચ',
      environmentalRisk: 'પર્યાવરણીય જોખમ',
      socioEconomicNeed: 'સામાજિક-આર્થિક ઇક્વિટી જરૂરિયાત',
      equityNotice: 'ઇક્વિટી વેઇટિંગ વંચિત વિસ્તારોને પ્રાથમિકતા આપે છે જેથી નિર્ણયો માત્ર સૌથી ઓછી કિંમત પર આધારિત ન રહે.',
    },
    disclaimer: {
      demoBadge: 'સ્માર્ટ ઇન્ડિયા હેકાથોન પ્રોટોટાઇપ ડેટાસેટ',
      demoNote: 'ડેમોન્સ્ટ્રેશન ડેટાસેટ સક્રિય છે. પ્રોડક્શનમાં સત્તાવાર GLIS ડેટા સાથે બદલો.',
    },
  },
};
