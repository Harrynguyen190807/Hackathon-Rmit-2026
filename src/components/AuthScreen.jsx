import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function AuthScreen({ onLoginSuccess, onBackToWelcome, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [phone, setPhone] = useState('+1 929 391 82 81');
  const [password, setPassword] = useState('••••••••');
  const [fullName, setFullName] = useState('Michelle Nguyen');
  const [email, setEmail] = useState('michelle.nguyen@vitatrack.health');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      onLoginSuccess({
        name: mode === 'signup' ? fullName : 'Michelle Nguyen',
        phone,
        email,
        vitalId: 'VT-3311045090',
        streakDays: 75,
        badgesCount: 81,
        isPro: true,
      });
    }, 450);
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#FCF9F3] text-[#1B2F27] px-7 pt-3 pb-4 overflow-y-auto no-scrollbar select-none relative">
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
            VitaID Zero-Knowledge
          </span>
        </div>
      )}

      {/* Header & Branding Section matching Stitch Sign In */}
      <section className="text-center mt-1 mb-2">
        <div className="inline-flex items-center justify-center mb-3">
          <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#2D5A4A] to-[#19332A] shadow-md flex items-center justify-center p-1.5 relative border border-white/20">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 120 120">
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

        <h1 className="text-[28px] font-extrabold text-[#1B2F27] tracking-tight mb-1">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h1>
        <p className="text-xs text-[#687C74] font-medium tracking-wide">
          {mode === 'signin'
            ? 'Personal Health Records & Prescriptions'
            : 'Initialize Sovereign TideCloak Health Passport'}
        </p>
      </section>

      {/* Form Section */}
      <section className="w-full space-y-3.5 my-1">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div className="relative bg-white border-[1.5px] border-[#E5E0D4] focus-within:border-[#24473B] rounded-[20px] px-4 py-3 flex items-center justify-between transition-all shadow-sm">
              <span className="absolute -top-[9px] left-[18px] px-1.5 bg-white text-[11px] font-semibold text-[#7A8983] rounded">
                Full Name
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Michelle Nguyen"
                className="w-full bg-transparent p-0 border-0 focus:ring-0 text-[#1B2F27] font-semibold text-[15px] outline-none"
                required
              />
              <CheckCircle2 className="w-5 h-5 text-[#24473B]/50 shrink-0" />
            </div>
          )}

          {/* Field 1: Phone */}
          <div className="relative bg-white border-[1.5px] border-[#E5E0D4] focus-within:border-[#24473B] rounded-[20px] px-4 py-3.5 flex items-center justify-between transition-all shadow-sm">
            <span className="absolute -top-[9px] left-[18px] px-1.5 bg-white text-[11px] font-semibold text-[#7A8983] rounded">
              Phone
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 929 391 82 81"
              className="w-full bg-transparent p-0 border-0 focus:ring-0 text-[#1B2F27] font-semibold text-[15px] tracking-wide outline-none"
              required
            />
            <div className="text-[#24473B]/50 pr-0.5" title="VitaID Synced">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  clipRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  fillRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {mode === 'signup' && (
            <div className="relative bg-white border-[1.5px] border-[#E5E0D4] focus-within:border-[#24473B] rounded-[20px] px-4 py-3 flex items-center justify-between transition-all shadow-sm">
              <span className="absolute -top-[9px] left-[18px] px-1.5 bg-white text-[11px] font-semibold text-[#7A8983] rounded">
                Clinical Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="michelle@vitatrack.health"
                className="w-full bg-transparent p-0 border-0 focus:ring-0 text-[#1B2F27] font-semibold text-[14px] outline-none"
                required
              />
            </div>
          )}

          {/* Field 2: Password */}
          <div className="relative bg-white border-[1.5px] border-[#E5E0D4] focus-within:border-[#24473B] rounded-[20px] px-4 py-3.5 flex items-center justify-between transition-all shadow-sm">
            <span className="absolute -top-[9px] left-[18px] px-1.5 bg-white text-[11px] font-semibold text-[#7A8983] rounded">
              Password
            </span>
            <div className="flex-1 mr-2 flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent p-0 border-0 focus:ring-0 text-[#1B2F27] font-extrabold text-base tracking-widest outline-none"
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
              <button
                type="button"
                onClick={() => alert('Zero-Knowledge recovery key sent to your verified device.')}
                className="text-xs font-semibold text-[#667E74] hover:text-[#24473B] transition-colors whitespace-nowrap pl-1"
              >
                Forgot password?
              </button>
            )}
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center justify-between px-1.5 pt-0.5 pb-1">
            <label className="flex items-center cursor-pointer space-x-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-[#24473B] border-[#D2CBBF]"
              />
              <span className="text-xs font-medium text-[#5F736B]">
                {mode === 'signin'
                  ? 'Remember me on this device'
                  : 'Activate TideCloak Emergent Authority Key'}
              </span>
            </label>
          </div>

          {/* Main CTA Button */}
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#24473B] to-[#1A362C] text-white font-bold text-sm tracking-wider uppercase shadow-[0_10px_25px_-5px_rgba(36,71,59,0.35)] hover:brightness-105 active:scale-[0.985] transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isAuthenticating ? (
              <span className="animate-pulse">VERIFYING VITA-ID...</span>
            ) : (
              <>
                <span>{mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </form>

        {/* Don't have an account link */}
        <div className="text-center pt-1.5">
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

      {/* Social Logins Section */}
      <section className="w-full mt-2 mb-1">
        <div className="relative flex items-center justify-center mb-3.5">
          <div className="w-full border-t border-[#E3DDD1]"></div>
          <span className="absolute px-3 bg-[#FCF9F3] text-[11.5px] font-medium text-[#7C8F87]">
            Or sign in with:
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Facebook Button */}
          <button
            type="button"
            onClick={handleSubmit}
            aria-label="Sign in with Facebook"
            className="h-12 flex items-center justify-center rounded-full bg-white border border-[#DDD6C8] hover:border-[#24473B]/40 hover:bg-[#FAF7F1] shadow-sm active:scale-95 transition-all duration-150"
          >
            <svg className="w-5 h-5 text-[#1877F2] fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleSubmit}
            aria-label="Sign in with Google"
            className="h-12 flex items-center justify-center rounded-full bg-white border border-[#DDD6C8] hover:border-[#24473B]/40 hover:bg-[#FAF7F1] shadow-sm active:scale-95 transition-all duration-150"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.16z"
                fill="#4285F4"
              />
              <path
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                fill="#34A853"
              />
              <path
                d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.24C.45 8.2 0 10.04 0 12s.45 3.8 1.24 5.41l4.04-3.15z"
                fill="#FBBC05"
              />
              <path
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.59l4.04 3.15c.95-2.84 3.6-4.99 6.72-4.99z"
                fill="#EA4335"
              />
            </svg>
          </button>
        </div>
      </section>

      {/* Medical Trust Badge Footer */}
      <footer className="mt-2 text-center">
        <div className="inline-flex items-center space-x-1.5 text-[10.5px] font-semibold text-[#5A6F66] bg-[#ECE6D9]/60 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-[#24473B]" />
          <span>HIPAA Encrypted Medical Security • VitaID</span>
        </div>
      </footer>
    </div>
  );
}
