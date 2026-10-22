import React from 'react';
import {
  Heart,
  Activity,
  Flame,
  Moon,
  Search,
  SlidersHorizontal,
  ScanLine,
  Sparkles,
  MoreHorizontal,
  ShieldCheck,
  Plus,
  TrendingUp,
} from 'lucide-react';
import TideCloakBadge from './TideCloakBadge';
import { SYNTHETIC_PATIENT_VAULT } from '../services/tidecloak';

export default function DashboardTab({
  biometrics = SYNTHETIC_PATIENT_VAULT.biometrics,
  edgeProof,
  onNavigate,
}) {
  return (
    <div className="flex flex-col w-full gap-y-4 pb-6">
      {/* Top Greeting & Profile Bar (From Stitch Dashboard) */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => onNavigate && onNavigate('profile')}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#24473b] to-[#8fb5a5] p-0.5 shadow-sm">
              <div className="w-full h-full rounded-full bg-[#F5EFE4] flex items-center justify-center text-[#0b3026] font-extrabold text-base">
                MN
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#cceda3] ring-2 ring-[#FBF8F2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-[#1A201C] tracking-tight">
                Hey, Michelle
              </span>
              <span className="text-base select-none">👋</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#c7e89e]/70 text-[#0b3026] text-xs font-bold">
                <Plus className="w-3 h-3 stroke-[2.5]" /> {biometrics.asclepiosScore}%
              </span>
              <span className="text-[#687771] text-xs">•</span>
              <span className="text-xs font-medium text-[#4b662b] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Sovereign Vault
              </span>
            </div>
          </div>
        </div>

        <button
          aria-label="Settings options"
          onClick={() => onNavigate && onNavigate('schedule')}
          className="w-11 h-11 rounded-2xl bg-white shadow-[0_4px_16px_-2px_rgba(36,71,59,0.06)] flex items-center justify-center text-[#1A201C] hover:bg-[#f6f3ed] active:scale-95 transition-all"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* TideCloak Sovereign Telemetry Badge */}
      <TideCloakBadge
        proofData={edgeProof}
        contextLabel="Biometric Telemetry Encrypted on Device"
      />

      {/* Search Input Bar (Stitch Design) */}
      <div className="relative w-full">
        <div className="w-full h-12 rounded-full bg-[#F5EFE4] px-4 flex items-center justify-between text-[#687771] shadow-[inset_0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2.5 flex-1">
            <Search className="w-4 h-4 text-[#687771]" />
            <input
              type="text"
              readOnly
              onClick={() => onNavigate && onNavigate('assistant')}
              placeholder="Ask AI Physician about prescriptions, vitals..."
              className="bg-transparent border-0 outline-none w-full text-sm text-[#1A201C] placeholder:text-[#687771] cursor-pointer"
            />
          </div>
          <button
            aria-label="Filter"
            onClick={() => onNavigate && onNavigate('assistant')}
            className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#0b3026] shadow-sm active:scale-95 transition-transform"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Action Interactive Pills (Stitch Design) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onNavigate && onNavigate('scanner')}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#0b3026] text-white shadow-[0_6px_20px_-4px_rgba(11,48,38,0.22)] active:scale-[0.98] transition-all"
        >
          <ScanLine className="w-4 h-4 text-[#cceda3]" />
          <span className="text-sm font-semibold tracking-tight">Scan Prescription</span>
        </button>
        <button
          onClick={() => onNavigate && onNavigate('assistant')}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#cceda3] text-[#0b3026] shadow-[0_6px_20px_-4px_rgba(204,237,163,0.4)] active:scale-[0.98] transition-all"
        >
          <Sparkles className="w-4 h-4 text-[#0b3026]" />
          <span className="text-sm font-semibold tracking-tight">Ask AI Physician</span>
        </button>
      </div>

      {/* Health Score Section (Asclepios Score Card from Stitch) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-base font-bold text-[#1A201C] tracking-tight">
            Health Score
          </span>
          <span className="text-xs font-semibold text-[#4b662b] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +4 pts this week
          </span>
        </div>

        <div className="relative w-full rounded-3xl bg-white p-5 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.06)] border border-[#ECE7DC]/70 overflow-hidden flex items-center justify-between">
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-gradient-to-br from-[#cceda3]/30 to-transparent pointer-events-none blur-2xl" />
          <div className="flex flex-col max-w-[68%] z-10">
            <span className="text-lg font-bold text-[#1A201C] tracking-tight">
              Asclepios Score
            </span>
            <p className="text-xs text-[#687771] mt-1 leading-relaxed">
              Based on your continuous daily biometrics, your cardiovascular stability and sleep recovery are optimal.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-[#f6f3ed] text-[#0b3026]">
              <span className="w-2 h-2 rounded-full bg-[#4b662b]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b662b]">
                Optimal Vitality
              </span>
            </div>
          </div>

          {/* Score Wheel Column Indicator */}
          <div className="flex flex-col items-center justify-center gap-1 z-10 pl-2">
            <span className="text-xs text-[#687771]/50 select-none font-semibold">87</span>
            <div className="w-14 h-12 rounded-2xl bg-[#cceda3] flex items-center justify-center shadow-[0_4px_12px_rgba(177,209,137,0.45)]">
              <span className="text-2xl font-extrabold text-[#0b3026]">
                {biometrics.asclepiosScore}
              </span>
            </div>
            <span className="text-xs text-[#687771]/50 select-none font-semibold">89</span>
          </div>
        </div>
      </div>

      {/* Smart Health Metrics Section (2-Column Bento Grid from Stitch) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-base font-bold text-[#1A201C] tracking-tight">
            Smart Health Metrics
          </span>
          <button
            onClick={() => onNavigate && onNavigate('schedule')}
            className="text-xs text-[#687771] hover:text-[#0b3026] font-semibold transition-colors"
          >
            View History
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Heart Rate Bento Card */}
          <div className="relative rounded-3xl bg-white p-4 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.05)] border border-[#ECE7DC]/70 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between z-10">
              <div className="w-9 h-9 rounded-full bg-[#c4ebda] flex items-center justify-center text-[#0b3026]">
                <Heart className="w-4 h-4 fill-[#0b3026]" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#f6f3ed] text-[#4b662b] text-[10px] font-bold uppercase tracking-wider">
                {biometrics.heartRate.status}
              </span>
            </div>

            <div className="mt-2.5">
              <span className="text-sm font-bold text-[#1A201C]">Heart Rate</span>
              <p className="text-[11px] text-[#687771]">Continuous ECG</p>
            </div>

            {/* ECG Sparkline Overlay */}
            <div className="relative w-full h-16 my-1 flex items-center justify-center bg-[#f6f3ed]/60 rounded-2xl p-2">
              <svg className="w-full h-full" fill="none" viewBox="0 0 140 60">
                <path
                  d="M5 32 L30 32 L38 18 L46 48 L55 10 L64 42 L72 32 L100 32 L108 20 L115 38 L122 32 L135 32"
                  stroke="#24473b"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />
              </svg>
            </div>

            <div className="flex items-baseline gap-1 mt-1 z-10">
              <span className="text-2xl font-extrabold text-[#1A201C]">
                {biometrics.heartRate.value}
              </span>
              <span className="text-xs font-medium text-[#687771]">
                {biometrics.heartRate.unit}
              </span>
            </div>
          </div>

          {/* Blood Pressure Bento Card */}
          <div className="relative rounded-3xl bg-white p-4 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.05)] border border-[#ECE7DC]/70 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between z-10">
              <div className="w-9 h-9 rounded-full bg-[#F3A871]/25 flex items-center justify-center text-[#663304]">
                <Activity className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#F3A871]/20 text-[#663304] text-[10px] font-bold uppercase tracking-wider">
                {biometrics.bloodPressure.status}
              </span>
            </div>

            <div className="mt-2.5">
              <span className="text-sm font-bold text-[#1A201C]">Blood Pressure</span>
              <p className="text-[11px] text-[#687771]">Systolic / Diastolic</p>
            </div>

            {/* Pressure Waveform Sparkline */}
            <div className="relative w-full h-16 my-1 flex items-center justify-center bg-[#f6f3ed]/60 rounded-2xl p-2">
              <svg className="w-full h-full" fill="none" viewBox="0 0 140 60">
                <path
                  d="M5 40 Q25 40 35 20 T65 24 T95 36 T135 30"
                  stroke="#E58B88"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
              </svg>
            </div>

            <div className="flex items-baseline gap-1 mt-1 z-10">
              <span className="text-2xl font-extrabold text-[#1A201C]">
                {biometrics.bloodPressure.systolic}/{biometrics.bloodPressure.diastolic}
              </span>
              <span className="text-xs font-medium text-[#687771]">
                {biometrics.bloodPressure.unit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Calories Burned Card (Stitch Design) */}
      <div className="w-full rounded-3xl bg-white p-4 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.05)] border border-[#ECE7DC]/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F3A871]/20 flex items-center justify-center text-[#F3A871]">
            <Flame className="w-6 h-6 fill-[#F3A871]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#1A201C]">Calories Burned</span>
            <span className="text-xs text-[#687771]">
              Daily Goal: {biometrics.calories.target.toLocaleString()} kcal
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xl font-extrabold text-[#1A201C]">
            {biometrics.calories.burned}{' '}
            <span className="text-xs font-normal text-[#687771]">kcal</span>
          </span>
          <div className="w-24 h-2 rounded-full bg-[#f0eee8] mt-1.5 overflow-hidden">
            <div
              className="h-full bg-[#b1d189] rounded-full transition-all duration-500"
              style={{ width: `${biometrics.calories.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sleep Overview Meadow Highlight Banner (Stitch Design) */}
      <div className="w-full rounded-3xl bg-gradient-to-r from-[#D5EDAF] to-[#E9F6D6] p-4 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.06)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/85 backdrop-blur-sm flex items-center justify-center text-[#0b3026] shadow-sm">
            <Moon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#0b3026]">Sleep Quality</span>
            <span className="text-xs text-[#0b3026]/80 font-medium">
              {biometrics.sleep.totalHours} hrs • REM {biometrics.sleep.remHours} hrs
            </span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#0b3026] text-white text-[11px] font-bold uppercase tracking-wider">
          {biometrics.sleep.status}
        </span>
      </div>
    </div>
  );
}
