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
  KeyRound,
} from 'lucide-react';
import {
  TIDECLOAK_ROLES_CATALOG,
  hasRealmRole,
  hasClientRole,
  doDecrypt,
  evaluateAccessChecks,
} from '../services/tidecloak';

export default function ProfileTab({
  user,
  tideSession,
  onSelectRole,
  onToggleEmergentAuthority,
  onNavigate,
  onLogout,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    const idText = tideSession?.vuid || user?.vitalId || 'VT-3311045090';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(idText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Run simulated TideCloak doDecrypt() on protected medical tags
  const decryptedAllergies = doDecrypt(tideSession, [
    {
      encrypted: 'TIDE_CIPHER[allergies]:0x7e41c92a...88b0',
      plaintextFallback: 'Penicillin, Grapefruit (CYP3A4)',
      tags: ['allergies'],
    },
  ])[0];

  const decryptedDiagnoses = doDecrypt(tideSession, [
    {
      encrypted: 'TIDE_CIPHER[diagnoses]:0x3a90f114...21e9',
      plaintextFallback: 'Stage 1 Hypertension (I10) • Prediabetes',
      tags: ['diagnoses'],
    },
  ])[0];

  const canGrantAuthority =
    hasRealmRole(tideSession, 'patient') && hasClientRole(tideSession, 'authority:grant');
  const canExportAudit = hasClientRole(tideSession, 'audit:export');
  const accessChecks = evaluateAccessChecks(tideSession);

  return (
    <div className="flex flex-col w-full gap-4 pb-6">
      {/* USER PROFILE HEADER CARD */}
      <section className="bg-white rounded-3xl p-5 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.05)] border border-[#ECE7DC] flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xl font-extrabold text-[#0b3026] truncate">
                {tideSession?.displayName || user?.name || 'Michelle Nguyen'}
              </h2>
              <CheckCircle2 className="w-5 h-5 text-[#4b662b] fill-[#cceda3] shrink-0" />
              <span className="px-2 py-0.5 rounded-full bg-[#0b3026] text-[#cceda3] text-[9.5px] font-extrabold uppercase">
                {tideSession?.shortBadge || 'ROLE: PATIENT'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[#687771]">
              <span className="text-[11px] font-mono font-semibold tracking-wide truncate max-w-[230px]">
                {tideSession?.vuid || `ID: ${user?.vitalId || 'VT-3311045090'}`}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1 rounded-full hover:bg-[#f0eee8] active:scale-90 transition-transform text-[#0b3026]"
                title="Copy TideCloak vuid"
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
                  {tideSession?.email || user?.email || 'michelle.ng@vitatrack.health'}
                </span>
              </div>
            </div>
          </div>

          {/* Avatar with micro edit trigger */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#24473b] to-[#8fb5a5] p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-[#F5EFE4] flex items-center justify-center text-[#0b3026] font-extrabold text-xl">
                {(tideSession?.displayName || user?.name || 'Michelle Nguyen')
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

      {/* TIDECLOAK ROLE SIMULATOR & LIVE ACCESS CHECKS */}
      <section className="bg-white rounded-3xl p-4 shadow-sm border border-[#ECE7DC] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#0b3026]" />
            <div>
              <h3 className="text-xs font-extrabold text-[#0b3026] uppercase tracking-wider">
                TideCloak Role &amp; Access Simulator
              </h3>
              <p className="text-[10.5px] text-[#687771]">
                Switch active JWT Doken persona to test `hasRealmRole` &amp; `doDecrypt`
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#c7e89e] text-[#0b3026]">
            {accessChecks.filter((c) => c.allowed).length}/{accessChecks.length} Allowed
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {Object.values(TIDECLOAK_ROLES_CATALOG).map((r) => {
            const active = tideSession?.roleKey === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => onSelectRole && onSelectRole(r.key)}
                className={`py-2 px-2 rounded-xl text-[10.5px] font-extrabold transition-all border text-center ${
                  active
                    ? 'bg-[#0b3026] text-[#cceda3] border-[#0b3026] shadow-xs'
                    : 'bg-[#f6f3ed] text-[#1A201C] border-[#ECE7DC] hover:bg-[#e5e2dc]'
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

        <div className="p-2.5 rounded-2xl bg-[#f6f3ed] border border-[#ECE7DC] space-y-1.5">
          <div className="text-[10.5px] text-[#414845] leading-snug">
            <span className="font-extrabold text-[#0b3026]">{tideSession?.roleLabel}:</span>{' '}
            {TIDECLOAK_ROLES_CATALOG[tideSession?.roleKey || 'patient']?.description}
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {(tideSession?.clientRoles || []).slice(0, 6).map((role) => (
              <span
                key={role}
                className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white text-[#24473b] border border-[#ECE7DC] font-semibold"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CORE DEMO MOMENT: PATIENT-CONTROLLED ACCESS (TIDECLOAK EMERGENT AUTHORITY & doDecrypt) */}
      <section className="rounded-3xl p-4 bg-gradient-to-br from-[#0b3026] to-[#24473b] text-white shadow-md border border-[#a9cfbf]/30 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#cceda3] shrink-0" />
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#cceda3]">
                TideCloak Emergent Authority (`doDecrypt`)
              </h3>
              <p className="text-[11px] text-[#e5e2dc]">
                {canGrantAuthority
                  ? 'Patient Co-Signs Temporary 15m Clinician Decryption Key'
                  : 'Requires Patient Emergent Authority Grant + _tide_<tag>.decrypt'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleEmergentAuthority && onToggleEmergentAuthority()}
            className={`px-3 py-1.5 rounded-full text-[10.5px] font-extrabold flex items-center gap-1.5 transition-all shadow shrink-0 ${
              tideSession?.emergentAuthorityGranted
                ? 'bg-[#cceda3] text-[#0b3026]'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            {tideSession?.emergentAuthorityGranted ? (
              <>
                <Unlock className="w-3.5 h-3.5" /> Granted (15m)
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> Patient-Locked
              </>
            )}
          </button>
        </div>

        <div className="rounded-2xl bg-black/25 p-3 text-xs space-y-2 border border-white/10">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[#a9cfbf] text-[11px]">
                Tag: `_tide_allergies.decrypt`
              </span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                  decryptedAllergies.authorized
                    ? 'bg-[#cceda3] text-[#0b3026]'
                    : 'bg-[#ffdad6] text-[#93000a]'
                }`}
              >
                {decryptedAllergies.authorized ? 'DECRYPTED' : 'BLOCKED'}
              </span>
            </div>
            <span className="font-mono font-bold text-white text-[11px]">
              {decryptedAllergies.decrypted}
            </span>
          </div>

          <div className="h-[1px] bg-white/10" />

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[#a9cfbf] text-[11px]">
                Tag: `_tide_diagnoses.decrypt`
              </span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                  decryptedDiagnoses.authorized
                    ? 'bg-[#cceda3] text-[#0b3026]'
                    : 'bg-[#ffdad6] text-[#93000a]'
                }`}
              >
                {decryptedDiagnoses.authorized ? 'DECRYPTED' : 'BLOCKED'}
              </span>
            </div>
            <span className="font-mono font-bold text-white text-[11px]">
              {decryptedDiagnoses.decrypted}
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
                  Protected by `hasClientRole(&quot;ai:consult&quot;)`
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
                <span className="text-xs text-[#687771] truncate font-mono">
                  {decryptedAllergies.decrypted}
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
                  Protected by `_tide_prescriptions.decrypt`
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#687771] shrink-0" />
          </button>

          <div className="h-[1px] bg-[#f0eee8] mx-2" />

          <button
            type="button"
            onClick={() => {
              if (!canExportAudit) {
                alert(
                  `TideCloak Access Denied: Role "${tideSession?.roleLabel}" lacks "audit:export". (Clinicians require Patient Emergent Authority grant to export clinical reports).`
                );
                return;
              }
              alert(
                `Zero-Knowledge Encrypted Clinical Summary (PDF) exported & signed by ${tideSession?.vuid}!`
              );
            }}
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
                  {canExportAudit
                    ? 'Authorized (`hasClientRole("audit:export") === true`)'
                    : '🔒 Locked (`hasClientRole("audit:export") === false`)'}
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
              <span>Sign Out / Switch TideCloak Role</span>
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
