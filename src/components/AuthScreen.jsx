import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { TIDECLOAK_ROLES_CATALOG } from '../services/tidecloak';

export default function AuthScreen({
  onLoginSuccess,
  onBackToWelcome,
  initialMode = 'signin',
  selectedRoleKey = 'patient',
}) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [roleKey, setRoleKey] = useState(selectedRoleKey);
  const activePersona = TIDECLOAK_ROLES_CATALOG[roleKey] || TIDECLOAK_ROLES_CATALOG.patient;

  const [phone, setPhone] = useState(activePersona.phone);
  const [password, setPassword] = useState('••••••••••••');
  const [fullName, setFullName] = useState(activePersona.displayName);
  const [email, setEmail] = useState(activePersona.email);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSelectRolePreset = (newRoleKey) => {
    const persona = TIDECLOAK_ROLES_CATALOG[newRoleKey] || TIDECLOAK_ROLES_CATALOG.patient;
    setRoleKey(newRoleKey);
    setFullName(persona.displayName);
    setPhone(persona.phone);
    setEmail(persona.email);
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      onLoginSuccess({
        roleKey,
        name: mode === 'signup' ? fullName : activePersona.displayName,
        phone,
        email,
        vitalId: activePersona.vitalId,
        vuid: activePersona.vuid,
        did: activePersona.did,
        streakDays: 75,
        badgesCount: 81,
        isPro: true,
      });
    }, 450);
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#FCF9F3] text-[#1B2F27] px-6 pt-2 pb-4 overflow-y-auto no-scrollbar select-none relative">
      {/* Top Back to Welcome link */}
      {onBackToWelcome && (
        <div className="flex items-center justify-between mb-1">
          <button
            type="button"
            onClick={onBackToWelcome}
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#5F736B] hover:text-[#1B2F27] transition-colors py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Welcome</span>
          </button>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#24473B] bg-[#E9F7DA] px-2.5 py-0.5 rounded-full">
            TideCloak OIDC • Doken v2
          </span>
        </div>
      )}

      {/* Header & Branding Section matching Stitch Sign In */}
      <section className="text-center mt-0.5 mb-1.5">
        <div className="inline-flex items-center justify-center mb-2">
          <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#2D5A4A] to-[#19332A] shadow-md flex items-center justify-center p-1.5 relative border border-white/20">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                opacity="0.6"
                r="44"
                stroke="#437763"
                strokeDasharray="3 3"
                strokeWidth="2"
              />
              <path
                d="M60 88 C60 88 32 70 32 50 C32 38 41 31 51 31 C57 31 60 35 60 35 C60 35 63 31 69 31 C79 31 88 38 88 50 C88 70 60 88 60 88 Z"
                fill="none"
                stroke="#C6E79D"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="6"
              />
              <path
                d="M40 52 L52 52 L57 41 L63 63 L68 47 L72 52 L80 52"
                fill="none"
                stroke="#FFFFFF"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-[24px] font-extrabold text-[#1B2F27] tracking-tight">
          {mode === 'signin' ? 'TideCloak Sign In' : 'Create Sovereign ID'}
        </h1>
        <p className="text-[11.5px] text-[#687C74] font-medium">
          {mode === 'signin'
            ? 'Simulate TideCloak IAM Role & Threshold Key Sign-In'
            : 'Initialize Sovereign TideCloak Health Passport'}
        </p>
      </section>

      {/* TideCloak Simulated Role Preset Selector */}
      <section className="rounded-2xl bg-white p-2.5 border border-[#E5E0D4] shadow-xs mb-2 space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#24473B] flex items-center gap-1">
            <KeyRound className="w-3 h-3 text-[#4b662b]" />
            Select TideCloak Role to Simulate:
          </span>
          <span className="text-[9.5px] font-mono text-[#687771]">
            {activePersona.vuid.slice(0, 18)}...
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.values(TIDECLOAK_ROLES_CATALOG).map((r) => {
            const isSelected = roleKey === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => handleSelectRolePreset(r.key)}
                className={`py-2 px-1.5 rounded-xl text-[10.5px] font-extrabold transition-all border text-center ${
                  isSelected
                    ? 'bg-[#0b3026] text-[#cceda3] border-[#0b3026] shadow-xs'
                    : 'bg-[#FCF9F3] text-[#1B2F27] border-[#E5E0D4] hover:bg-[#f0eee8]'
                }`}
              >
                {r.key === 'patient'
                  ? '👤 Patient'
                  : r.key === 'clinician'
                  ? '🩺 Clinician'
                  : '🛡️ SysAdmin'}
              </button>
            );
          })}
        </div>
        <div className="px-1.5 py-1 rounded-xl bg-[#f6f3ed] text-[10px] text-[#52635D] leading-snug">
          <span className="font-bold text-[#0b3026]">{activePersona.label}:</span>{' '}
          {activePersona.description}
        </div>
      </section>

      {/* Form Section */}
      <section className="w-full space-y-2.5 my-0.5">
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {mode === 'signup' && (
            <div className="relative bg-white border-[1.5px] border-[#E5E0D4] focus-within:border-[#24473B] rounded-[18px] px-4 py-2.5 flex items-center justify-between transition-all shadow-xs">
              <span className="absolute -top-[8px] left-[16px] px-1.5 bg-white text-[10px] font-semibold text-[#7A8983] rounded">
                Full Name
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Michelle Nguyen"
                className="w-full bg-transparent p-0 border-0 focus:ring-0 text-[#1B2F27] font-semibold text-[14px] outline-none"
                required
              />
              <CheckCircle2 className="w-4 h-4 text-[#24473B]/50 shrink-0" />
            </div>
          )}

          {/* Field 1: Phone / Identity */}
          <div className="relative bg-white border-[1.5px] border-[#E5E0D4] focus-within:border-[#24473B] rounded-[18px] px-4 py-2.5 flex items-center justify-between transition-all shadow-xs">
            <span className="absolute -top-[8px] left-[16px] px-1.5 bg-white text-[10px] font-semibold text-[#7A8983] rounded">
              TideCloak Identity / Phone
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 929 391 82 81"
              className="w-full bg-transparent p-0 border-0 focus:ring-0 text-[#1B2F27] font-semibold text-[14px] tracking-wide outline-none"
              required
            />
            <span className="text-[10px] font-mono font-bold text-[#24473B] bg-[#E9F7DA] px-2 py-0.5 rounded-full shrink-0">
              {activePersona.vitalId}
            </span>
          </div>

          {mode === 'signup' && (
            <div className="relative bg-white border-[1.5px] border-[#E5E0D4] focus-within:border-[#24473B] rounded-[18px] px-4 py-2.5 flex items-center justify-between transition-all shadow-xs">
              <span className="absolute -top-[8px] left-[16px] px-1.5 bg-white text-[10px] font-semibold text-[#7A8983] rounded">
                Clinical Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="michelle@vitatrack.health"
                className="w-full bg-transparent p-0 border-0 focus:ring-0 text-[#1B2F27] font-semibold text-[13.5px] outline-none"
                required
              />
            </div>
          )}

          {/* Field 2: Password / Passkey */}
          <div className="relative bg-white border-[1.5px] border-[#E5E0D4] focus-within:border-[#24473B] rounded-[18px] px-4 py-2.5 flex items-center justify-between transition-all shadow-xs">
            <span className="absolute -top-[8px] left-[16px] px-1.5 bg-white text-[10px] font-semibold text-[#7A8983] rounded">
              Zero-Knowledge Passphrase
            </span>
            <div className="flex-1 mr-2 flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent p-0 border-0 focus:ring-0 text-[#1B2F27] font-extrabold text-sm tracking-widest outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#667E74] hover:text-[#24473B] p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'signin' && (
              <span className="text-[10px] font-mono text-[#4b662b] font-bold whitespace-nowrap pl-1">
                5/7 ORK QUORUM
              </span>
            )}
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center justify-between px-1.5 pt-0.5">
            <label className="flex items-center cursor-pointer space-x-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-[#24473B] border-[#D2CBBF]"
              />
              <span className="text-xs font-medium text-[#5F736B]">
                Issue TideCloak Doken with `{activePersona.realmRoles[0]}` role
              </span>
            </label>
          </div>

          {/* Main CTA Button */}
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#24473B] to-[#1A362C] text-white font-bold text-xs tracking-wider uppercase shadow-[0_10px_25px_-5px_rgba(36,71,59,0.35)] hover:brightness-105 active:scale-[0.985] transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isAuthenticating ? (
              <span className="animate-pulse">
                ATTESTING 5-OF-7 TIDE ORK NODES ({activePersona.shortBadge})...
              </span>
            ) : (
              <>
                <span>
                  {mode === 'signin'
                    ? `SIGN IN AS ${activePersona.key.toUpperCase().replace('_', ' ')}`
                    : 'CREATE TIDECLOAK PASSPORT'}
                </span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </form>

        {/* Don't have an account link */}
        <div className="text-center pt-1">
          <p className="text-xs text-[#52635D]">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="font-bold text-[#E28919] hover:text-[#C7720E] transition-colors ml-1"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </section>

      {/* Medical Trust Badge Footer */}
      <footer className="mt-1 text-center">
        <div className="inline-flex items-center space-x-1.5 text-[10px] font-semibold text-[#5A6F66] bg-[#ECE6D9]/60 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-[#24473B]" />
          <span>Protected by TideCloak IAM • BLS12-381 Threshold Doken</span>
        </div>
      </footer>
    </div>
  );
}
