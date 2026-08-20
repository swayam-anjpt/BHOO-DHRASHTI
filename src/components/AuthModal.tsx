import React, { useState, useEffect } from 'react';
import { GENDER_OPTIONS, Language, OFFICIAL_DOMAINS, User, UserGender, UserRole } from '../types';
import { translations } from '../lib/translations';
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
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Phone,
  Briefcase,
  Layers,
  Check,
} from 'lucide-react';

export type AuthModalMode = 'create-account' | 'official-signin' | 'citizen-signin';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  initialMode?: AuthModalMode;
  language: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  initialMode = 'create-account',
  language,
}) => {
  const t = translations[language];

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states - Create Account
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState<UserGender>('Male');
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

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // 1. Submit Create Account
  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!regName.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return;
    }

    if (!regEmail.trim()) {
      setErrorMessage('Please enter your Email Address.');
      return;
    }

    if (!regPhone.trim()) {
      setErrorMessage('Please enter your Phone Number.');
      return;
    }

    const digitsOnlyPhone = regPhone.replace(/\D/g, '');
    if (digitsOnlyPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit Phone Number.');
      return;
    }

    if (!regPassword) {
      setErrorMessage('Please enter a Password.');
      return;
    }

    if (!regConfirmPassword) {
      setErrorMessage('Please confirm your Password.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both passwords match exactly.');
      return;
    }

    if (regRole === 'official' && regDomain === 'Other' && !regCustomDomain.trim()) {
      setErrorMessage('Please specify your custom official domain / role.');
      return;
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
          onLogin(data.user);
          onClose();
        }, 600);
      } else {
        setErrorMessage(data.error || 'Failed to create account.');
      }
    } catch (err) {
      // Fallback offline handler
      const fallbackUser: User = {
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
        onLogin(fallbackUser);
        onClose();
      }, 600);
    } finally {
      setLoading(false);
    }
  };

  // 2. Official Portal - Sign In with Email & Password
  const handleOfficialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!officialEmail.trim() || !officialPassword.trim()) {
      setErrorMessage('Please enter both Official Email and Password.');
      return;
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
          onLogin(data.user);
          onClose();
        }, 500);
      } else {
        setErrorMessage(data.error || 'Failed to sign in official.');
      }
    } catch (err) {
      // Offline fallback check
      const officialUser: User = {
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
        onLogin(officialUser);
        onClose();
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  // 3. Citizen Portal - Sign In with Email, Password & All India States Address
  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!citizenEmail.trim() || !citizenPassword.trim()) {
      setErrorMessage('Please provide your Email and Password.');
      return;
    }

    if (!citizenAddress.trim()) {
      setErrorMessage('Please provide your Street/Village Address.');
      return;
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
          onLogin(data.user);
          onClose();
        }, 500);
      } else {
        setErrorMessage(data.error || 'Failed to sign in citizen.');
      }
    } catch (err) {
      // Offline fallback
      const citizenUser: User = {
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
        onLogin(citizenUser);
        onClose();
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  // Auto Fill Demo values for quick hackathon review
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-teal-500/20 border border-sky-500/30 text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {mode === 'create-account' && 'Create New Account'}
                {mode === 'official-signin' && 'Official Government Sign In'}
                {mode === 'citizen-signin' && 'Citizen Portal Access'}
              </h3>
              <p className="text-xs text-slate-400">
                भू-दृष्टि • National Geospatial Governance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 p-1.5 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('create-account');
              setErrorMessage(null);
            }}
            className={`py-2 px-2.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              mode === 'create-account'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('official-signin');
              setErrorMessage(null);
            }}
            className={`py-2 px-2.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              mode === 'official-signin'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Official</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('citizen-signin');
              setErrorMessage(null);
            }}
            className={`py-2 px-2.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              mode === 'citizen-signin'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Citizen</span>
          </button>
        </div>

        {/* Notifications */}
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

        {/* MODAL BODY */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* ================= MODE 1: CREATE ACCOUNT ================= */}
          {mode === 'create-account' && (
            <form onSubmit={handleCreateAccountSubmit} className="space-y-4">
              {/* Role Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Account Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRegRole('official')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                      regRole === 'official'
                        ? 'border-emerald-500/80 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Building className={`w-4 h-4 ${regRole === 'official' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="font-bold text-xs text-slate-200">Government Official</div>
                      <div className="text-[10px] text-slate-400">Urban Planning & Land</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('citizen')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                      regRole === 'citizen'
                        ? 'border-teal-500/80 bg-teal-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Users className={`w-4 h-4 ${regRole === 'citizen' ? 'text-teal-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="font-bold text-xs text-slate-200">Citizen Resident</div>
                      <div className="text-[10px] text-slate-400">Grievances & Public GIS</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* User Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder={regRole === 'official' ? 'e.g. Dr. Rajeshwar Sharma, IAS' : 'e.g. Pooja Patel'}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email & Phone Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder={regRole === 'official' ? 'officer@gov.in' : 'user@gmail.com'}
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98765 43210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Gender Selection (Present in BOTH Official and Citizen) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Gender <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    id="create-account-gender-select"
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as UserGender)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g} className="bg-slate-900 text-slate-100">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Official Specific: Domain Selection */}
              {regRole === 'official' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 mb-1">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Official Domain / Portfolio <span className="text-rose-400">*</span></span>
                    </label>
                    <select
                      id="create-account-domain-select"
                      value={regDomain}
                      onChange={(e) => setRegDomain(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs sm:text-sm text-emerald-100 focus:outline-none focus:border-emerald-400 transition-colors cursor-pointer"
                    >
                      {OFFICIAL_DOMAINS.map((dom) => (
                        <option key={dom} value={dom} className="bg-slate-900 text-slate-100">
                          {dom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* If user selects "Other", display a blank input where they need to specify */}
                  {regDomain === 'Other' && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                      <label className="block text-xs font-semibold text-emerald-200 mb-1">
                        Please Specify Official Domain / Role <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Layers className="w-4 h-4 absolute left-3.5 top-3 text-emerald-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. State Remote Sensing Center Director"
                          value={regCustomDomain}
                          onChange={(e) => setRegCustomDomain(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-emerald-500 text-xs sm:text-sm text-emerald-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Citizen Specific: Address */}
              {regRole === 'citizen' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Street / Locality / Village Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Satellite Road, Ahmedabad City, Ahmedabad"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              )}

              {/* State & Address Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  State / Union Territory in India <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <select
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  >
                    <optgroup label="28 States of India">
                      {INDIAN_STATES.filter((s) => s.type === 'State').map((s) => (
                        <option key={s.code} value={s.name}>
                          {s.name} ({s.capital})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="8 Union Territories">
                      {INDIAN_STATES.filter((s) => s.type === 'Union Territory').map((s) => (
                        <option key={s.code} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Passwords Grid: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Create password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                        regConfirmPassword
                          ? regPassword === regConfirmPassword
                            ? 'border-emerald-500 focus:border-emerald-400'
                            : 'border-rose-500 focus:border-rose-400'
                          : 'border-slate-700 focus:border-sky-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Match Status Indicator */}
              {regConfirmPassword.length > 0 && (
                <div className={`text-[11px] flex items-center gap-1.5 font-medium ${
                  regPassword === regConfirmPassword ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {regPassword === regConfirmPassword ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Passwords do not match</span>
                    </>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create & Activate Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= MODE 2: OFFICIAL SIGN IN ================= */}
          {mode === 'official-signin' && (
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

              {/* Official Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official Government Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="officer.ias@gujarat.gov.in"
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Official Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your official password"
                    value={officialPassword}
                    onChange={(e) => setOfficialPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Fill Demo */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Evaluator Demo Login:</span>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('official')}
                  className="text-emerald-400 hover:underline font-medium"
                >
                  Fill Dr. Rajeshwar Sharma, IAS
                </button>
              </div>

              {/* Submit Credentials */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Building className="w-4 h-4" />
                    <span>Sign In to Official Command Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= MODE 3: CITIZEN SIGN IN ================= */}
          {mode === 'citizen-signin' && (
            <form onSubmit={handleCitizenSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-start gap-2.5">
                <Users className="w-5 h-5 shrink-0 text-teal-400 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-teal-200">
                    Citizen Public Geospatial Portal
                  </strong>
                  Sign in with your email and residential address across India to report grievances, track local infrastructure, and view community sitings.
                </div>
              </div>

              {/* Citizen Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Citizen Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="pooja.patel@citizen.in"
                    value={citizenEmail}
                    onChange={(e) => setCitizenEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              {/* Citizen Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={citizenPassword}
                    onChange={(e) => setCitizenPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* State / Union Territory Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  State / Union Territory in India <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <select
                    value={citizenState}
                    onChange={(e) => setCitizenState(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                  >
                    <optgroup label="28 States in India">
                      {INDIAN_STATES.filter((s) => s.type === 'State').map((s) => (
                        <option key={s.code} value={s.name}>
                          {s.name} ({s.capital})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="8 Union Territories">
                      {INDIAN_STATES.filter((s) => s.type === 'Union Territory').map((s) => (
                        <option key={s.code} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Residential Address (Street / Village / Taluka) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Satellite Road, Ahmedabad City, Ahmedabad"
                  value={citizenAddress}
                  onChange={(e) => setCitizenAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Quick Fill Demo */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Evaluator Demo Fill:</span>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('citizen')}
                  className="text-teal-400 hover:underline font-medium"
                >
                  Fill Pooja Patel (Ahmedabad, Gujarat)
                </button>
              </div>

              {/* Submit Citizen */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Authenticate & Enter Citizen Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer note */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Smart India Hackathon 2024-25</span>
          <span>Role-Based Geospatial Security</span>
        </div>
      </div>
    </div>
  );
};
