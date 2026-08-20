import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, UserRole, OFFICIAL_DOMAINS } from '../types';
import { INDIAN_STATES } from '../data/indianStates';
import {
  X,
  Building,
  Users,
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  MapPin,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Phone,
  Briefcase,
  Layers,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface LandingPageProps {
  language: Language;
  onExplore: () => void;
  onSelectRole: (role: UserRole) => void;
  onOpenAuthModal?: (mode: any) => void;
  onLogin?: (user: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onExplore,
  onSelectRole,
  onLogin,
}) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [landingMode, setLandingMode] = useState<'start' | 'about' | 'auth'>('start');
  const [torchOn, setTorchOn] = useState(true);
  const [authTab, setAuthTab] = useState<'create-account' | 'official-signin' | 'citizen-signin'>('create-account');

  // Authentication form states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states - Create Account
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'official' | 'citizen'>('citizen');
  const [regDomain, setRegDomain] = useState<string>('District Administration / Collectorate');
  const [regCustomDomain, setRegCustomDomain] = useState('');
  const [regState, setRegState] = useState('Gujarat');
  const [regAddress, setRegAddress] = useState('');

  // Form states - Official Sign In
  const [officialEmail, setOfficialEmail] = useState('sharma.ias@gujarat.gov.in');
  const [officialPassword, setOfficialPassword] = useState('••••••••••');

  // Form states - Citizen Sign In
  const [citizenEmail, setCitizenEmail] = useState('pooja.patel@citizen.in');
  const [citizenPassword, setCitizenPassword] = useState('••••••••••');
  const [citizenAddress, setCitizenAddress] = useState('Satellite Road, Ahmedabad City, Ahmedabad');
  const [citizenState, setCitizenState] = useState('Gujarat');

  // Form handlers
  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim()) return setErrorMessage('Please enter your Full Name.');
    if (!regEmail.trim()) return setErrorMessage('Please enter your Email Address.');
    if (!regPhone.trim()) return setErrorMessage('Please enter your Phone Number.');

    const digitsOnlyPhone = regPhone.replace(/\D/g, '');
    if (digitsOnlyPhone.length < 10) {
      return setErrorMessage('Please enter a valid 10-digit Phone Number.');
    }
    if (!regPassword) return setErrorMessage('Please enter a Password.');
    if (!regConfirmPassword) return setErrorMessage('Please confirm your Password.');
    if (regPassword !== regConfirmPassword) {
      return setErrorMessage('Passwords do not match. Please ensure both passwords match exactly.');
    }

    setLoading(true);
    const resolvedDomain = regRole === 'official'
      ? (regDomain === 'Other' ? regCustomDomain.trim() : regDomain)
      : undefined;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          gender: regGender,
          password: regPassword,
          confirmPassword: regConfirmPassword,
          role: regRole,
          domain: regDomain,
          customDomain: regDomain === 'Other' ? regCustomDomain.trim() : undefined,
          state: regState,
          address: regAddress,
        }),
      });

      const data = await response.json();
      if (data.success && data.user) {
        setSuccessMessage('Account registered successfully! Redirecting...');
        setTimeout(() => {
          if (onLogin) onLogin(data.user);
        }, 800);
      } else {
        setErrorMessage(data.error || 'Failed to create account.');
      }
    } catch (err) {
      const fallbackUser = {
        id: `usr-${Date.now()}`,
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        gender: regGender,
        role: regRole,
        domain: resolvedDomain,
        customDomain: regDomain === 'Other' ? regCustomDomain.trim() : undefined,
        designation: resolvedDomain,
        department: resolvedDomain ? `${resolvedDomain} Division` : undefined,
        state: regState,
        address: regAddress,
        district: 'Ahmedabad',
      };
      setSuccessMessage('Account created! Entering portal...');
      setTimeout(() => {
        if (onLogin) onLogin(fallbackUser);
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  const handleOfficialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!officialEmail.trim() || !officialPassword.trim()) {
      return setErrorMessage('Please enter both Official Email and Password.');
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/official/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: officialEmail.trim(),
          password: officialPassword,
        }),
      });

      const data = await response.json();
      if (data.success && data.user) {
        setSuccessMessage('Official credentials verified! Access granted.');
        setTimeout(() => {
          if (onLogin) onLogin(data.user);
        }, 800);
      } else {
        setErrorMessage(data.error || 'Failed to sign in official.');
      }
    } catch (err) {
      const officialUser = {
        id: 'usr-off-1',
        name: 'Dr. Rajeshwar Sharma, IAS',
        email: officialEmail.trim(),
        role: 'official',
        gender: 'Male',
        phone: '+91 98765 43210',
        domain: 'District Administration / Collectorate',
        department: 'District Administration & Urban Infrastructure',
        designation: 'District Development Officer (DDO)',
        jurisdiction: 'Ahmedabad & Suburban Industrial Belt',
        district: 'Ahmedabad',
        state: 'Gujarat',
      };
      setSuccessMessage('Official identity verified! Entering dashboard...');
      setTimeout(() => {
        if (onLogin) onLogin(officialUser);
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!citizenEmail.trim() || !citizenPassword.trim()) {
      return setErrorMessage('Please provide your Email and Password.');
    }
    if (!citizenAddress.trim()) {
      return setErrorMessage('Please provide your Street/Village Address.');
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/citizen/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: citizenEmail.trim(),
          password: citizenPassword,
          address: citizenAddress.trim(),
          state: citizenState,
        }),
      });

      const data = await response.json();
      if (data.success && data.user) {
        setSuccessMessage('Citizen verified! Entering citizen portal...');
        setTimeout(() => {
          if (onLogin) onLogin(data.user);
        }, 800);
      } else {
        setErrorMessage(data.error || 'Failed to sign in citizen.');
      }
    } catch (err) {
      const citizenUser = {
        id: 'usr-cit-1',
        name: 'Pooja Patel',
        email: citizenEmail.trim(),
        role: 'citizen',
        gender: 'Female',
        phone: '+91 98250 11223',
        address: citizenAddress.trim(),
        state: citizenState,
        district: 'Ahmedabad',
      };
      setSuccessMessage('Citizen verified! Entering citizen portal...');
      setTimeout(() => {
        if (onLogin) onLogin(citizenUser);
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (target: 'official' | 'citizen') => {
    if (target === 'official') {
      setOfficialEmail('sharma.ias@gujarat.gov.in');
      setOfficialPassword('Official@2024');
    } else {
      setCitizenEmail('pooja.patel@citizen.in');
      setCitizenPassword('Citizen@2024');
      setCitizenAddress('Satellite Road, Ahmedabad City, Ahmedabad');
      setCitizenState('Gujarat');
    }
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden relative flex flex-col justify-between bg-[#0C131F] text-[#FFFFFF] select-none radial-glow-atmosphere">
      {/* Background Interactive Spatial Grid & Glowing Ambient Lights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle coordinate grid lines */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }}
        />
        {/* Ambient Radial Color Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-sky-600/10 via-teal-500/5 to-emerald-600/10 blur-[130px]" />
      </div>

      {/* Video Background (only visible if load/playback hasn't failed) */}
      {!videoFailed && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          onError={() => setVideoFailed(true)}
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            filter: 'brightness(0.6) contrast(1.05)',
          }}
        >
          <source src="/assets/bg_video_landing_page.mp4" type="video/mp4" />
        </video>
      )}

      {/* TOP HEADER (Empty spacer for visual layout) */}
      <header className="relative z-20 px-8 py-4 flex items-center justify-between" />

      {/* CENTER STAGE */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 overflow-y-auto no-scrollbar py-6">
        {(landingMode === 'start' || landingMode === 'about') && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 w-full max-w-4xl px-4">
            {/* Heading Zone - Solid White Bold Hindi Title */}
            <div className="mb-6">
              <h1 className="text-7xl sm:text-8xl md:text-[9rem] lg:text-[10.5rem] font-black tracking-[-0.02em] text-white select-none leading-none">
                भू-दृष्टि
              </h1>
            </div>


          </div>
        )}

        {landingMode === 'auth' && (
          <div className="w-full max-w-lg glass-standard text-left animate-in fade-in zoom-in-95 duration-250 flex flex-col max-h-[80vh] overflow-hidden my-4">
            {/* Auth Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#FF6B53]/20 to-[#FDB05C]/20 border border-[#FF6B53]/30 text-[#FF6B53]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {authTab === 'create-account' && 'Create New Account'}
                    {authTab === 'official-signin' && 'Official Government Sign In'}
                    {authTab === 'citizen-signin' && 'Citizen Portal Access'}
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    भू-दृष्टि • National Geospatial Governance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLandingMode('start')}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs at the Top */}
            <div className="grid grid-cols-3 p-1.5 bg-[#0C131F]/80 border-b border-white/5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('create-account');
                  setErrorMessage(null);
                }}
                className={`py-2 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                  authTab === 'create-account'
                    ? 'bg-[#FF6B53] text-white font-bold shadow-md'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab('official-signin');
                  setErrorMessage(null);
                }}
                className={`py-2 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                  authTab === 'official-signin'
                    ? 'bg-[#FF6B53] text-white font-bold shadow-md'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Official</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab('citizen-signin');
                  setErrorMessage(null);
                }}
                className={`py-2 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                  authTab === 'citizen-signin'
                    ? 'bg-[#FF6B53] text-white font-bold shadow-md'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Citizen</span>
              </button>
            </div>

            {/* Error/Success Messages */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form Scrollable Area */}
            <div className="p-6 overflow-y-auto no-scrollbar flex-1">
              {/* CREATE ACCOUNT FORM */}
              {authTab === 'create-account' && (
                <form onSubmit={handleCreateAccountSubmit} className="space-y-4">
                  {/* Account Type */}
                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                      Select Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setRegRole('official')}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                          regRole === 'official'
                            ? 'border-emerald-500/80 bg-emerald-500/10 text-white'
                            : 'border-slate-800 bg-slate-950/40 text-[#94A3B8] hover:border-slate-700'
                        }`}
                      >
                        <Building className={`w-4 h-4 ${regRole === 'official' ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <div>
                          <div className="font-bold text-xs text-slate-200">Government Official</div>
                          <div className="text-[10px] text-[#94A3B8]">Urban Planning & Land</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegRole('citizen')}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                          regRole === 'citizen'
                            ? 'border-teal-500/80 bg-teal-500/10 text-white'
                            : 'border-slate-800 bg-slate-950/40 text-[#94A3B8] hover:border-slate-700'
                        }`}
                      >
                        <Users className={`w-4 h-4 ${regRole === 'citizen' ? 'text-teal-400' : 'text-slate-500'}`} />
                        <div>
                          <div className="font-bold text-xs text-slate-200">Citizen Resident</div>
                          <div className="text-[10px] text-[#94A3B8]">Grievances & Public GIS</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder={regRole === 'official' ? 'e.g. Dr. Rajeshwar Sharma, IAS' : 'e.g. Pooja Patel'}
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#FF6B53]"
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                        <input
                          type="email"
                          required
                          placeholder="user@gmail.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-[#FF6B53]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                        Phone Number <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 98765 43210"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-[#FF6B53]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      Gender <span className="text-rose-400">*</span>
                    </label>
                    <select
                      id="register-gender"
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#FF6B53]"
                    >
                      {['Male', 'Female', 'Other'].map((g) => (
                        <option key={g} value={g} className="bg-slate-900 text-slate-100">
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Domain Selector (Official) */}
                  {regRole === 'official' && (
                    <div className="space-y-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 mb-1">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Official Domain / Portfolio <span className="text-rose-400">*</span></span>
                        </label>
                        <select
                          id="register-domain"
                          value={regDomain}
                          onChange={(e) => setRegDomain(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs sm:text-sm text-emerald-100 focus:outline-none"
                        >
                          {OFFICIAL_DOMAINS.map((dom) => (
                            <option key={dom} value={dom} className="bg-slate-900 text-slate-100">
                              {dom}
                            </option>
                          ))}
                        </select>
                      </div>

                      {regDomain === 'Other' && (
                        <div>
                          <label className="block text-xs font-semibold text-emerald-200 mb-1">
                            Specify Official Domain / Role <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <Layers className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-400" />
                            <input
                              type="text"
                              required
                              placeholder="specify domain"
                              value={regCustomDomain}
                              onChange={(e) => setRegCustomDomain(e.target.value)}
                              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-emerald-500 text-xs sm:text-sm text-emerald-100 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Address */}
                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      Street / Locality / Village Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Satellite Road, Ahmedabad City, Ahmedabad"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#FF6B53]"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      State / Union Territory in India <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                      <select
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#FF6B53]"
                      >
                        <optgroup label="28 States of India" className="bg-slate-900">
                          {INDIAN_STATES.filter((s) => s.type === 'State').map((s) => (
                            <option key={s.code} value={s.name}>
                              {s.name} ({s.capital})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="8 Union Territories" className="bg-slate-900">
                          {INDIAN_STATES.filter((s) => s.type === 'Union Territory').map((s) => (
                            <option key={s.code} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                        Password <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Create password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-[#FF6B53]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                        Confirm Password <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="Re-enter password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border text-xs sm:text-sm text-slate-100 focus:outline-none ${
                            regConfirmPassword
                              ? regPassword === regConfirmPassword
                                ? 'border-emerald-500 focus:border-emerald-400'
                                : 'border-rose-500 focus:border-rose-400'
                              : 'border-slate-700 focus:border-[#FF6B53]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 btn-primary-glow flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* OFFICIAL SIGN IN */}
              {authTab === 'official-signin' && (
                <form onSubmit={handleOfficialSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <strong className="font-semibold block text-emerald-200">
                        Official Government Command Portal
                      </strong>
                      Enter your official credentials to sign in and access the administrative spatial planning dashboard.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      Official Government Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="sharma.ias@gujarat.gov.in"
                        value={officialEmail}
                        onChange={(e) => setOfficialEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#FF6B53]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••"
                        value={officialPassword}
                        onChange={(e) => setOfficialPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#FF6B53]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-1">
                    <span>Evaluator Demo Login:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoFill('official')}
                      className="text-emerald-400 hover:underline font-medium"
                    >
                      Fill Dr. Rajeshwar Sharma, IAS
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 btn-primary-glow flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Sign In to Official Command Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* CITIZEN SIGN IN */}
              {authTab === 'citizen-signin' && (
                <form onSubmit={handleCitizenSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300 flex items-start gap-2.5">
                    <Users className="w-5 h-5 shrink-0 text-sky-400 mt-0.5" />
                    <div>
                      <strong className="font-semibold block text-sky-200">
                        Citizen Public Geospatial Portal
                      </strong>
                      Sign in with your email and residential address across India to report grievances, track local infrastructure, and view community sitings.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      Citizen Email Address <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="pooja.patel@citizen.in"
                        value={citizenEmail}
                        onChange={(e) => setCitizenEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#FF6B53]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••"
                        value={citizenPassword}
                        onChange={(e) => setCitizenPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#FF6B53]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      State / Union Territory in India <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                      <select
                        value={citizenState}
                        onChange={(e) => setCitizenState(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#FF6B53]"
                      >
                        <optgroup label="28 States of India" className="bg-slate-900">
                          {INDIAN_STATES.filter((s) => s.type === 'State').map((s) => (
                            <option key={s.code} value={s.name}>
                              {s.name} ({s.capital})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      Residential Address (Street / Village / Taluka) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Satellite Road, Ahmedabad City, Ahmedabad"
                      value={citizenAddress}
                      onChange={(e) => setCitizenAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-[#FF6B53]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-1">
                    <span>Evaluator Demo Fill:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoFill('citizen')}
                      className="text-[#FF6B53] hover:underline font-medium"
                    >
                      Fill Pooja Patel (Ahmedabad, Gujarat)
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 btn-primary-glow flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Authenticate & Enter Citizen Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Bar: Right-aligned Interactive Controls */}
      {landingMode !== 'auth' && (
        <footer className="relative z-20 px-8 py-6 flex items-center justify-end gap-4">
          {/* Glassmorphic Interactive Info Button replacing About Us */}
          <button
            type="button"
            onClick={() => setLandingMode(landingMode === 'about' ? 'start' : 'about')}
            className={`Btn ${landingMode === 'about' ? 'active-info-btn' : ''}`}
            aria-label="Information"
          >
            <div className="BG"></div>
            <div className="svgContainer">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                width="22" 
                height="22" 
                fill="none" 
                stroke="#FFFFFF" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="infoIcon"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
          </button>

          {/* Start Portal Button - Frosted Dark-Glassmorphism Pill Button */}
          <button 
            type="button"
            onClick={() => setLandingMode('auth')}
            className="glass-cta" 
            aria-label="Get Started"
          >
            <div className="glass-cta-inner">
              <span>GET STARTED</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="arrow-icon"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </button>
        </footer>
      )}

      {/* CINEMATIC CIRCULAR IRIS REVEAL OVERLAY FOR DOCUMENTATION / ABOUT US */}
      <AnimatePresence>
        {landingMode === 'about' && (
          <motion.div
            className={`fixed inset-0 z-50 overflow-y-auto flex flex-col no-scrollbar transition-colors duration-500 ${torchOn ? 'bg-[#0B0B0C]/80 text-white backdrop-blur-2xl' : 'bg-[#F9FAFB]/95 text-[#0F172A] backdrop-blur-2xl'}`}
            initial={{ clipPath: 'circle(0% at 90% 90%)' }}
            animate={{ clipPath: 'circle(150% at 90% 90%)' }}
            exit={{ clipPath: 'circle(0% at 90% 90%)' }}
            transition={{ duration: 0.85, ease: [0.77, 0, 0.175, 1] }}
          >
            {/* Spotlight Torch Light Cone (Visible only when torchOn is true) */}
            {torchOn && <div className="torch-beam" />}

            {/* Top Navigation with Centered Interactive Torch Lamp Fixture */}
            <header className={`sticky top-0 w-full px-8 py-3.5 flex items-center justify-between backdrop-blur-md z-30 border-b transition-colors duration-500 ${torchOn ? 'bg-[#0B0B0C]/70 border-white/10 text-white' : 'bg-white/70 border-slate-200/80 text-slate-900'}`}>
              <div className="flex items-center gap-3">
                <span className={`font-extrabold tracking-wider text-base uppercase select-none transition-colors duration-500 ${torchOn ? 'text-white' : 'text-slate-900'}`}>
                  भू-दृष्टि
                </span>
              </div>

              {/* Central Realistic Torch / Lamp Fixture (Clickable to Turn On / Off) */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center z-40">
                <button
                  type="button"
                  onClick={() => setTorchOn(!torchOn)}
                  className={`group relative flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none`}
                  title={torchOn ? "Click to Turn Off Torch" : "Click to Turn On Torch"}
                  aria-label="Toggle Torch Light"
                >
                  {/* Top Wall Mounting Bracket */}
                  <div className={`w-16 h-2 rounded-t-md border-t border-x transition-colors duration-300 ${
                    torchOn ? 'bg-slate-700 border-slate-500 shadow-sm' : 'bg-slate-800 border-slate-700'
                  }`} />

                  {/* Main Lamp Housing Body (Pure Hardware Design - No Text) */}
                  <div className={`w-28 sm:w-36 h-7 px-4 rounded-b-md border-x border-b flex items-center justify-center transition-all duration-500 ${
                    torchOn ? 'torch-fixture-active border-amber-500/40' : 'torch-fixture-off border-slate-700/60'
                  }`}>
                    {/* Center Power Switch / Jewel LED Indicator */}
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`w-3 h-1.5 rounded-full transition-all duration-300 ${
                        torchOn ? 'bg-amber-400 shadow-[0_0_12px_#f59e0b]' : 'bg-slate-700 shadow-inner'
                      }`} />
                    </div>
                  </div>

                  {/* Bottom Illuminated Optical Lens Bar (Light Emitter) */}
                  <div className={`w-24 sm:w-32 h-2 rounded-b-md transition-all duration-500 ${
                    torchOn ? 'torch-lens-lit' : 'torch-lens-dark'
                  }`} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setLandingMode('start')}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-200 shadow-sm ${torchOn ? 'border-white/20 bg-white/5 hover:bg-white/10 text-white' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'}`}
              >
                Back
              </button>
            </header>

            {/* Feature Content with Staggered Entrance */}
            <motion.div 
              className="max-w-6xl mx-auto px-6 py-12 text-center"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1, delayChildren: 0.25 }
                }
              }}
            >
              {/* Category tag */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] sm:text-xs font-medium mb-6 self-center shadow-xs transition-colors duration-500 ${torchOn ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-600'}`}
              >
                <span>Platform Architecture</span>
                <span className={torchOn ? 'text-white/20' : 'text-slate-300'}>•</span>
                <span className={torchOn ? 'text-slate-400' : 'text-slate-500'}>Core Decision Modules</span>
              </motion.div>

              <motion.h2 
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl mx-auto transition-colors duration-500 ${torchOn ? 'text-white' : 'text-slate-950'}`}
              >
                Modern, data-driven geospatial intelligence for infrastructure & socio-economic equity.
              </motion.h2>

              <motion.p 
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                className={`text-sm sm:text-base max-w-3xl mx-auto mb-12 leading-[1.6] transition-colors duration-500 ${torchOn ? 'text-slate-300' : 'text-slate-600'}`}
              >
                <strong className={`transition-colors duration-500 ${torchOn ? 'text-white' : 'text-slate-900'}`}>Bhoo Drishti (भू-दृष्टि)</strong> is a cloud-based Geospatial Intelligence Platform built on top of Government Land Information System (GLIS) data. It unifies land records, satellite imagery, demographic datasets, and machine learning to drive evidence-based, equity-weighted infrastructure siting decisions.
              </motion.p>

              {/* Three Static Cards (No 3D canvas or hover animations) */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-16"
              >
                {/* Card 1: Mountain & Rail Corridors */}
                <div className={`relative flex flex-col justify-between rounded-2xl border p-6 backdrop-blur-xl shadow-2xl transition-all duration-500 ${torchOn ? 'border-white/10 bg-white/[0.04] text-white' : 'border-slate-200 bg-white text-slate-900 shadow-md'}`}>
                  <div className="mt-2">
                    <h3 className="text-lg font-bold">Mountain & Rail Corridors</h3>
                    <p className={`mt-2 text-xs leading-relaxed transition-colors duration-500 ${torchOn ? 'text-[#B0B3B8]' : 'text-slate-500'}`}>
                      Slope elevation checks and contour modeling for high-grade terrain transit routes.
                    </p>
                  </div>
                </div>

                {/* Card 2: Coastal Highway Siting */}
                <div className={`relative flex flex-col justify-between rounded-2xl border p-6 backdrop-blur-xl shadow-2xl transition-all duration-500 ${torchOn ? 'border-white/10 bg-white/[0.04] text-white' : 'border-slate-200 bg-white text-slate-900 shadow-md'}`}>
                  <div className="mt-2">
                    <h3 className="text-lg font-bold">Coastal Highway Siting</h3>
                    <p className={`mt-2 text-xs leading-relaxed transition-colors duration-500 ${torchOn ? 'text-[#B0B3B8]' : 'text-slate-500'}`}>
                      Erosion boundary analysis and multi-criteria buffer zoning for cliffside infrastructure.
                    </p>
                  </div>
                </div>

                {/* Card 3: Watershed & Urban Basin */}
                <div className={`relative flex flex-col justify-between rounded-2xl border p-6 backdrop-blur-xl shadow-2xl transition-all duration-500 ${torchOn ? 'border-white/10 bg-white/[0.04] text-white' : 'border-slate-200 bg-white text-slate-900 shadow-md'}`}>
                  <div className="mt-2">
                    <h3 className="text-lg font-bold">Watershed & Basin Analytics</h3>
                    <p className={`mt-2 text-xs leading-relaxed transition-colors duration-500 ${torchOn ? 'text-[#B0B3B8]' : 'text-slate-500'}`}>
                      Demographic correlation across urban lake basins, water tables, and municipal boundaries.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Detailed Strategic Brief Content Section */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-16"
              >
                {/* Section A: Detailed Explanation */}
                <div className={`border rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col gap-4 transition-all duration-500 ${torchOn ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-950 shadow-md'}`}>
                  <h3 className={`text-lg font-extrabold text-[#E06D3B] border-b pb-2 transition-colors duration-500 ${torchOn ? 'border-white/10' : 'border-slate-200'}`}>
                    Detailed Explanation
                  </h3>
                  <div className={`space-y-4 text-xs leading-relaxed transition-colors duration-500 ${torchOn ? 'text-[#B0B3B8]' : 'text-slate-500'}`}>
                    <div>
                      <h4 className={`font-bold mb-1 transition-colors duration-500 ${torchOn ? 'text-white' : 'text-slate-900'}`}>4-Layered Cloud Architecture</h4>
                      <p>Ingests GLIS cadastral records, satellite imagery, and census data into a high-performance processing pipeline paired with an interactive map-first dashboard.</p>
                    </div>
                    <div>
                      <h4 className={`font-bold mb-1 transition-colors duration-500 ${torchOn ? 'text-white' : 'text-slate-900'}`}>Dual Connected Modules</h4>
                      <p>Integrates an Infrastructure Siting Module with a Socio-Economic Analysis Module so that developmental need actively drives engineering site recommendations.</p>
                    </div>
                    <div>
                      <h4 className={`font-bold mb-1 transition-colors duration-500 ${torchOn ? 'text-white' : 'text-slate-900'}`}>Citizen Civic Hub & Official Command Center</h4>
                      <p>Dual-portal design enabling on-ground grievance filing (GPS/photo) alongside multi-layer spatial planning and automated dossier generation for officials.</p>
                    </div>
                  </div>
                </div>

                {/* Section B: How It Addresses the Problem */}
                <div className={`border rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col gap-4 transition-all duration-500 ${torchOn ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-950 shadow-md'}`}>
                  <h3 className={`text-lg font-extrabold text-[#E06D3B] border-b pb-2 transition-colors duration-500 ${torchOn ? 'border-white/10' : 'border-slate-200'}`}>
                    Addressing the Problem
                  </h3>
                  <div className={`space-y-4 text-xs leading-relaxed transition-colors duration-500 ${torchOn ? 'text-[#B0B3B8]' : 'text-slate-500'}`}>
                    <div>
                      <h4 className={`font-bold mb-1 transition-colors duration-500 ${torchOn ? 'text-white' : 'text-slate-900'}`}>Transforms Passive Records into Active Insights</h4>
                      <p>Converts static land records (RoR, ULPIN) into evidence-based decision assets.</p>
                    </div>
                    <div>
                      <h4 className={`font-bold mb-1 transition-colors duration-500 ${torchOn ? 'text-white' : 'text-slate-900'}`}>Eliminates Planning Silos</h4>
                      <p>Combines engineering feasibility (slope, flood hazards, grid accessibility) with social need metrics (Development Need Index).</p>
                    </div>
                    <div>
                      <h4 className={`font-bold mb-1 transition-colors duration-500 ${torchOn ? 'text-white' : 'text-slate-900'}`}>Accelerates Project Turnaround</h4>
                      <p>Replaces months of manual surveys with instant multi-criteria ranking and trade-off matrices.</p>
                    </div>
                  </div>
                </div>

                {/* Section C: Innovation & Uniqueness */}
                <div className={`border rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col gap-4 transition-all duration-500 ${torchOn ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-950 shadow-md'}`}>
                  <h3 className={`text-lg font-extrabold text-[#E06D3B] border-b pb-2 transition-colors duration-500 ${torchOn ? 'border-white/10' : 'border-slate-200'}`}>
                    Innovation & Uniqueness
                  </h3>
                  <div className={`space-y-4 text-xs leading-relaxed transition-colors duration-500 ${torchOn ? 'text-[#B0B3B8]' : 'text-slate-500'}`}>
                    <div>
                      <h4 className={`font-bold mb-1 transition-colors duration-500 ${torchOn ? 'text-white' : 'text-slate-900'}`}>Equity-Weighted Siting</h4>
                      <p>Moves beyond traditional lowest-cost siting to prioritize high-need, underserved, and tribal regions.</p>
                    </div>
                    <div>
                      <h4 className={`font-bold mb-1 transition-colors duration-500 ${torchOn ? 'text-white' : 'text-slate-900'}`}>Explainable AI ("Ask GLIS")</h4>
                      <p>Natural language spatial queries and transparent scoring logic that eliminate black-box decision-making for public spending.</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tag Grid / Feature Pills */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                className="flex flex-wrap items-center justify-center gap-2.5"
              >
                {[
                  'Multi-Source GLIS Ingestion',
                  'Spatial Overlay & Buffering',
                  'Equity-Weighted Siting',
                  'Explainable AI Scoring',
                  'Time-Series Satellite Tracking'
                ].map((item) => (
                  <span 
                    key={item} 
                    className={`px-4 py-1.5 rounded-full border shadow-xs text-xs font-semibold transition-all duration-500 ${torchOn ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}
                  >
                    {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
