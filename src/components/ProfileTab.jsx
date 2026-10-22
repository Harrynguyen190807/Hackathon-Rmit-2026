import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Flame,
  Mail,
  Star,
  Award,
  Gift,
  Stethoscope,
  Target,
  Watch,
  Share2,
  AlertOctagon,
  Pill,
  FileText,
  LogOut,
  ChevronRight,
  Lock,
  Unlock,
  ShieldCheck,
  Edit3,
} from 'lucide-react';

export default function ProfileTab({ user, onNavigate, onLogout }) {
  const [copied, setCopied] = useState(false);
  const [clinicianAccessGranted, setClinicianAccessGranted] = useState(false);

  const handleCopyId = () => {
    const idText = user?.vitalId || user?.vitaId || 'VT-3311045090';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(idText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col w-full gap-4 pb-6">
      {/* USER PROFILE HEADER CARD */}
      <section className="bg-white rounded-3xl p-5 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.05)] border border-[#ECE7DC] flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xl font-extrabold text-[#0b3026] truncate">
                {user?.name || 'Michelle Nguyen'}
              </h2>
              <CheckCircle2 className="w-5 h-5 text-[#4b662b] fill-[#cceda3] shrink-0" />
            </div>

            <div className="flex items-center gap-1.5 text-[#687771]">
              <span className="text-xs font-mono font-semibold tracking-wide">
                ID: {user?.vitalId || user?.vitaId || 'VT-3311045090'}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1 rounded-full hover:bg-[#f0eee8] active:scale-90 transition-transform text-[#0b3026]"
                title="Copy VitalID"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {copied && (
                <span className="text-[10px] font-bold text-[#4b662b]">Copied!</span>
              )}
            </div>

            {/* Goal Pill Badge & Clinical Mail */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#c7e89e] text-[#0b3026] text-[10px] font-extrabold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-[#F3A871] fill-[#F3A871]" />
                STREAK GOAL: 75 DAYS
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f0eee8] text-[#1A201C]">
                <Mail className="w-3.5 h-3.5 text-[#0b3026]" />
                <span className="text-xs truncate max-w-[165px]">
                  {user?.email || 'michelle.ng@vitatrack.health'}
                </span>
              </div>
            </div>
          </div>

          {/* Avatar with micro edit trigger */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#24473b] to-[#8fb5a5] p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-[#F5EFE4] flex items-center justify-center text-[#0b3026] font-extrabold text-xl">
                {(user?.name || 'Michelle Nguyen')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)}
              </div>
            </div>
            <button
              type="button"
              aria-label="Edit avatar"
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#0b3026] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Quick Action Badges (VITATRACK PRO MEMBER / BADGES / REWARDS) */}
        <div className="grid grid-cols-12 gap-2 pt-1">
          <button
            type="button"
            className="col-span-5 flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-[#0b3026] text-white shadow-sm hover:opacity-95 transition-all text-center"
          >
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-[#E9C46A] fill-[#E9C46A]" />
              <span className="text-[10px] font-bold tracking-wider">VITATRACK</span>
            </div>
            <span className="text-[10px] font-extrabold text-[#cceda3]">PRO MEMBER</span>
          </button>

          <button
            type="button"
            className="col-span-5 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-[#f6f3ed] text-[#0b3026] hover:bg-[#f0eee8] transition-all"
          >
            <Award className="w-5 h-5 text-[#4b662b]" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-extrabold tracking-wide">BADGES</span>
              <span className="text-[11px] font-semibold text-[#687771] mt-0.5">
                81 EARNED
              </span>
            </div>
          </button>

          <button
            type="button"
            aria-label="Member rewards"
            className="col-span-2 flex items-center justify-center rounded-2xl bg-[#f6f3ed] text-[#F3A871] hover:bg-[#f0eee8] transition-transform"
          >
            <Gift className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* CORE DEMO MOMENT: PATIENT-CONTROLLED ACCESS (TIDECLOAK EMERGENT AUTHORITY) */}
      <section className="rounded-3xl p-4 bg-gradient-to-br from-[#0b3026] to-[#24473b] text-white shadow-md border border-[#a9cfbf]/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#cceda3]" />
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#cceda3]">
                TideCloak Emergent Authority
              </h3>
              <p className="text-[11px] text-[#e5e2dc]">
                Patient-Controlled Scoped Clinician Access
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setClinicianAccessGranted(!clinicianAccessGranted)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 transition-all shadow ${
              clinicianAccessGranted
                ? 'bg-[#cceda3] text-[#0b3026]'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            {clinicianAccessGranted ? (
              <>
                <Unlock className="w-3.5 h-3.5" /> Unlocked (15m)
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> Patient-Locked
              </>
            )}
          </button>
        </div>

        <div className="rounded-2xl bg-black/25 p-3 text-xs space-y-1.5 border border-white/10">
          <div className="flex justify-between">
            <span className="text-[#a9cfbf]">Allergies &amp; CYP3A4:</span>
            <span className="font-mono font-bold text-white">
              {clinicianAccessGranted
                ? 'Penicillin, Grapefruit (CYP3A4)'
                : '🔒 [LOCKED_BY_PATIENT_KEY]'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#a9cfbf]">Protected Diagnoses:</span>
            <span className="font-mono font-bold text-white">
              {clinicianAccessGranted
                ? 'Stage 1 Hypertension (I10) • Prediabetes'
                : '🔒 [LOCKED_BY_PATIENT_KEY]'}
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 1: PERSONALIZED HEALTH MANAGEMENT */}
      <section className="flex flex-col gap-1.5">
        <div className="bg-white rounded-3xl p-3.5 shadow-sm border border-[#ECE7DC] flex flex-col">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('assistant')}
            className="flex items-center justify-between py-2.5 px-2 rounded-2xl hover:bg-[#f6f3ed] transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#f6f3ed] text-[#0b3026] flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#1A201C] truncate">
                  AI Coach &amp; Physician Consultation
                </span>
                <span className="text-xs text-[#687771] truncate">
                  Personalized medication &amp; nutrition plan
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#687771] shrink-0" />
          </button>

          <div className="h-[1px] bg-[#f0eee8] mx-2" />

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="flex items-center justify-between py-2.5 px-2 rounded-2xl hover:bg-[#f6f3ed] transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#f6f3ed] text-[#0b3026] flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#1A201C] truncate">
                  My Health Goals
                </span>
                <span className="text-xs text-[#687771] truncate">
                  Optimal Blood Pressure &amp; 8h Deep Sleep
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#687771] shrink-0" />
          </button>

          <div className="h-[1px] bg-[#f0eee8] mx-2" />

          <div className="flex items-center justify-between py-2.5 px-2 rounded-2xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#f6f3ed] text-[#0b3026] flex items-center justify-center shrink-0">
                <Watch className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#1A201C] truncate">
                  Connected Health Devices (My Gear)
                </span>
                <span className="text-xs text-[#687771] truncate">
                  Apple Watch Series 9 • Omron Blood Pressure
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#c7e89e] text-[#0b3026]">
              Online
            </span>
          </div>

          <div className="h-[1px] bg-[#f0eee8] mx-2" />

          {/* Linked Sports Platforms */}
          <div className="py-2.5 px-2">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#f6f3ed] text-[#0b3026] flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-[#1A201C] block">
                    Linked Sports &amp; Health Platforms
                  </span>
                  <span className="text-xs text-[#4b662b] font-semibold">
                    4 platforms actively synced
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-around pt-1">
              {[
                { name: 'Adidas', bg: 'bg-[#1A1A1A] text-white' },
                { name: 'Apple', bg: 'bg-[#FF2D55]/15 text-[#FF2D55]' },
                { name: 'Garmin', bg: 'bg-[#c7e89e] text-[#0b3026]' },
                { name: 'Strava', bg: 'bg-[#FC4C02] text-white' },
              ].map((app) => (
                <div key={app.name} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 rounded-full ${app.bg} flex items-center justify-center text-xs font-extrabold shadow-sm`}
                  >
                    {app.name[0]}
                  </div>
                  <span className="text-[10px] font-bold text-[#687771] uppercase">
                    {app.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: MEDICAL RECORDS & SIGN OUT */}
      <section className="flex flex-col gap-1.5">
        <div className="bg-white rounded-3xl p-3.5 shadow-sm border border-[#ECE7DC] flex flex-col">
          <div className="flex items-center justify-between py-2.5 px-2 rounded-2xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#ffdad6]/60 text-[#ba1a1a] flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#ba1a1a] truncate">
                  Allergy History &amp; Clinical Alerts
                </span>
                <span className="text-xs text-[#687771] truncate">
                  Penicillin Allergy • Avoid Grapefruit (CYP3A4)
                </span>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-[#f0eee8] mx-2" />

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('scanner')}
            className="flex items-center justify-between py-2.5 px-2 rounded-2xl hover:bg-[#f6f3ed] transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#f6f3ed] text-[#0b3026] flex items-center justify-center shrink-0">
                <Pill className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#1A201C] truncate">
                  Scanned Prescription History
                </span>
                <span className="text-xs text-[#687771] truncate">
                  12 encrypted records • 3 active daily medications
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#687771] shrink-0" />
          </button>

          <div className="h-[1px] bg-[#f0eee8] mx-2" />

          <button
            type="button"
            onClick={() =>
              alert('Zero-Knowledge Encrypted Clinical Summary (PDF) exported successfully!')
            }
            className="flex items-center justify-between py-2.5 px-2 rounded-2xl hover:bg-[#f6f3ed] transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#f6f3ed] text-[#0b3026] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#1A201C] truncate">
                  Export Clinical Health Report (PDF)
                </span>
                <span className="text-xs text-[#687771] truncate">
                  Signed with TideCloak ZKP Attestation
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#687771] shrink-0" />
          </button>

          <div className="h-[1px] bg-[#f0eee8] mx-2 my-1" />

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center justify-between py-3 px-3 rounded-2xl bg-[#ffdad6]/50 hover:bg-[#ffdad6] text-[#93000a] font-bold text-xs transition-colors"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              <span>Sign Out / Switch Account</span>
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
