import React, { useState } from 'react';
import { Language, User, UserRole } from '../types';
import { translations } from '../lib/translations';
import {
  Globe,
  Sun,
  Moon,
  ShieldCheck,
  UserCheck,
  Building2,
  Bell,
  LogOut,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenAuth: (role?: UserRole) => void;
  onLogout: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  onRoleChange,
  language,
  onLanguageChange,
  isDarkMode,
  onToggleTheme,
  onOpenAuth,
  onLogout,
  activeView,
  onNavigate,
}) => {
  const t = translations[language];
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'Critical Grievance Verified', desc: 'Limkheda PHC ambulance road gap confirmed by DDO.', time: '10m ago', unread: true },
    { id: 2, title: 'Site Suitability Recalculated', desc: 'Equity weighting updated for Tribal Belt Talukas.', time: '1h ago', unread: true },
    { id: 3, title: 'Satellite Pass Ingested', desc: 'Cartosat-3 high-res imagery processed for Vav project.', time: '4h ago', unread: false },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      {/* Top Government Strip */}
      <div className="bg-slate-950 px-4 py-1 text-[11px] flex items-center justify-between border-b border-slate-800/80 text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">GOVERNMENT OF INDIA &bull; GEOSPATIAL INTELLIGENCE PLATFORM</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-amber-400 font-medium">Smart India Hackathon Prototype</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-sky-400" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              aria-label="Select interface language"
              className="bg-transparent text-slate-300 hover:text-white cursor-pointer outline-none text-[11px] font-medium"
            >
              <option value="en" className="bg-slate-900 text-slate-200">English (EN)</option>
              <option value="hi" className="bg-slate-900 text-slate-200">हिन्दी (HI)</option>
              <option value="gu" className="bg-slate-900 text-slate-200">ગુજરાતી (GU)</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="text-slate-400 hover:text-slate-200 p-0.5"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-sky-400" />}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 via-teal-600 to-emerald-700 flex items-center justify-center shadow-lg border border-sky-400/30 group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                GLIS
              </span>
              <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                Geospatial Platform
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[280px] sm:max-w-md">
              {t.appSubtitle}
            </div>
          </div>
        </div>

        {/* Center / Right Controls: Role Switcher & User Status */}
        <div className="flex items-center gap-3">
          {/* Fast Role Simulator for Evaluators */}
          <div className="hidden md:flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                onRoleChange('official');
                onNavigate('dashboard');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentRole === 'official'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Official</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onRoleChange('citizen');
                onNavigate('citizen');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentRole === 'citizen'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Citizen</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onRoleChange('admin');
                onNavigate('admin');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentRole === 'admin'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-900" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl p-3 text-xs space-y-2 z-50">
                <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                  <span>Official Alerts & Feeds</span>
                  <span className="text-[10px] text-sky-400">Mark all read</span>
                </div>
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 space-y-0.5 border border-slate-700/50">
                    <div className="font-semibold text-slate-200 flex items-center justify-between">
                      <span>{n.title}</span>
                      <span className="text-[9px] text-slate-400">{n.time}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">{n.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Profile / Auth Actions */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-800/80 pl-2.5 pr-1.5 py-1 rounded-xl border border-slate-700">
              <div className="text-right hidden sm:block">
                <div className="font-semibold text-xs text-slate-200 leading-tight truncate max-w-[140px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-sky-400 font-medium uppercase tracking-wider">
                  {currentUser.role} &bull; {currentUser.district || 'HQ'}
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700/50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth()}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
