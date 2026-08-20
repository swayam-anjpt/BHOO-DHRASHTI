import React from 'react';
import { Language } from '../types';
import { translations } from '../lib/translations';
import { ShieldCheck, Database, Compass, Award } from 'lucide-react';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const t = translations[language];

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-8 px-4 no-print">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-800/80">
        {/* Brand & Purpose */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-slate-200 text-sm">GLIS Geospatial Intelligence Platform</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
            A Smart India Hackathon initiative empowering administrators, urban planners, and infrastructure authorities with equity-weighted spatial intelligence, socio-economic gap detection, and explainable site recommendations.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-amber-400 font-medium pt-1">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Smart India Hackathon Software Edition &bull; National Prototype</span>
          </div>
        </div>

        {/* Framework & Standards */}
        <div className="space-y-1.5">
          <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>GIS & Standards</span>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-400">
            <li>&bull; OGC GeoJSON / Spatial Indexing</li>
            <li>&bull; Multi-Criteria Decision Analysis (MCDA)</li>
            <li>&bull; Development Need Index (DNI Engine)</li>
            <li>&bull; Google Gemini Explainable AI</li>
          </ul>
        </div>

        {/* Governance & Disclaimer */}
        <div className="space-y-1.5">
          <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Security & Governance</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {t.disclaimer.demoNote}
          </p>
          <div className="text-[10px] text-slate-500 pt-1">
            Build v1.0.4-sih &bull; ISO/IEC 27001 & NSDI Standards Aligned
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div>
          &copy; {new Date().getFullYear()} Government of India &bull; Geospatial Land & Infrastructure Analytics (GLIS).
        </div>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
          <span className="hover:text-slate-300 cursor-pointer">Data Audit Logs</span>
          <span className="hover:text-slate-300 cursor-pointer">API Docs</span>
        </div>
      </div>
    </footer>
  );
};
