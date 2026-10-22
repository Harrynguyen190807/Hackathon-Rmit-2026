import React from 'react';
import { ArrowRight, ShieldCheck, Lock } from 'lucide-react';

export default function WelcomeScreen({ onStartJourney, onSignIn }) {
  return (
    <div className="flex-1 flex flex-col justify-between bg-[#FCF9F3] text-[#1C1C18] px-6 pt-6 pb-6 overflow-y-auto no-scrollbar select-none relative">
      {/* Top Ambient Glow */}
      <div className="relative flex flex-col items-center justify-center pt-6 pb-3">
        <div className="absolute w-48 h-48 rounded-full bg-[#CCEDA3]/45 blur-2xl pointer-events-none -top-1"></div>
        <div className="absolute w-36 h-36 rounded-full bg-[#C4EBDA]/55 blur-xl pointer-events-none top-4 animate-pulse"></div>

        {/* Official VitaTrack Logo Squircle Container */}
        <div className="relative z-10 p-3 bg-white rounded-[28px] shadow-[0_12px_32px_-6px_rgba(11,48,38,0.14)] flex items-center justify-center border border-[#ECE7DC]/60">
          <div className="relative w-20 h-20 rounded-[22px] bg-gradient-to-br from-[#24473B] to-[#0B3026] flex items-center justify-center overflow-hidden p-2 shadow-inner">
            {/* Heart + ECG Leaf Icon matching Stitch screenshot */}
            <svg className="w-14 h-14" fill="none" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                opacity="0.45"
                r="46"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10 pointer-events-none"></div>
          </div>
        </div>

        {/* Brand Name Lockup */}
        <div className="mt-4 text-center relative z-10">
          <div className="flex items-center justify-center gap-1">
            <span className="text-[24px] leading-tight tracking-tight font-bold text-[#0B3026]">
              VitaTrack
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-[#C7E89E]/65">
            <span className="w-2 h-2 rounded-full bg-[#4B662B] animate-pulse"></span>
            <span className="text-[10.5px] font-bold text-[#344E15] tracking-widest uppercase">
              HEALTH &amp; AI PRESCRIPTION
            </span>
          </div>
        </div>
      </div>

      {/* Warm & Poetic Welcoming Messaging */}
      <div className="text-center mt-2 px-1">
        <h1 className="text-[28px] leading-tight font-extrabold text-[#1A201C] tracking-tight">
          Welcome to <span className="text-[#0B3026]">VitaTrack</span>
        </h1>
        <div className="mt-4 p-4 rounded-2xl bg-[#F6F3ED] border border-[#ECE7DC]/80 shadow-sm">
          <p className="text-[14px] text-[#1C1C18] leading-relaxed italic font-medium">
            “Where every heartbeat matters, and smart health meets mindful care.”
          </p>
        </div>
      </div>

      {/* Interactive Call to Action Area */}
      <div className="flex flex-col items-center mt-6 w-full gap-3">
        {/* Primary CTA Button */}
        <button
          type="button"
          onClick={onStartJourney}
          className="group relative w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-[#0B3026] hover:bg-[#164235] text-white shadow-[0_10px_24px_-4px_rgba(11,48,38,0.35)] transition-all active:scale-[0.98] overflow-hidden"
        >
          <span className="text-[15.5px] font-bold tracking-wide">
            Start Your Journey
          </span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Secondary CTA: Sign in link */}
        <button
          type="button"
          onClick={onSignIn}
          className="flex items-center justify-center py-2 px-4 text-[#1A201C] text-[14px] font-semibold hover:text-[#0B3026] transition-colors"
        >
          <span>Already have an account?</span>
          <span className="mx-2 text-[#C1C8C3]">•</span>
          <span className="text-[#0B3026] underline underline-offset-4 font-bold">
            Sign In
          </span>
        </button>
      </div>

      {/* Trust, Compliance & Security Badge */}
      <div className="flex flex-col items-center gap-2 mt-4 pb-1">
        <div className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-full bg-[#F6F3ED] border border-[#ECE7DC] shadow-sm">
          <ShieldCheck className="w-4 h-4 text-[#4B662B]" />
          <span className="text-[11px] text-[#687771] font-semibold tracking-wide">
            HIPAA Encrypted • VitalID Security
          </span>
        </div>
        <div className="inline-flex items-center gap-1 text-[10px] text-[#4B662B] font-semibold">
          <Lock className="w-3 h-3" />
          <span>TideCloak Emergent Authority Ready</span>
        </div>
      </div>
    </div>
  );
}
