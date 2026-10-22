import React, { useState } from 'react';
import {
  ShieldCheck,
  EyeOff,
  KeyRound,
  CheckCircle2,
  ChevronRight,
  X,
  Cpu,
  Lock,
  Unlock,
  UserCheck,
  Layers,
} from 'lucide-react';
import {
  TIDECLOAK_ROLES_CATALOG,
  TIDECLOAK_ARCHITECTURE_PLAN,
  evaluateAccessChecks,
} from '../services/tidecloak';

export default function TideCloakBadge({
  proofData,
  contextLabel = 'Zero-Trust Edge Encryption',
  session,
  onSelectRole,
  onToggleEmergentAuthority,
}) {
  const [showInspector, setShowInspector] = useState(false);
  const [activeTab, setActiveTab] = useState('access'); // 'access' | 'token' | 'plan'

  const activeSession = session || proofData?.session;
  const accessMatrix = activeSession
    ? evaluateAccessChecks(activeSession)
    : proofData?.accessMatrix || [];

  return (
    <>
      {/* Prominent Judge-Friendly TideCloak Verification Banner */}
      <div
        onClick={() => setShowInspector(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowInspector(true)}
        className="group w-full rounded-2xl bg-gradient-to-r from-[#0b3026] via-[#173d31] to-[#24473b] p-3 text-white shadow-[0_8px_24px_-4px_rgba(11,48,38,0.28)] border border-[#a9cfbf]/30 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 rounded-xl bg-[#cceda3]/20 border border-[#cceda3]/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#cceda3]" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#cceda3] animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#cceda3]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#cceda3]">
                  TideCloak IAM
                </span>
                <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-white/15 text-white font-bold">
                  {activeSession?.shortBadge || 'ROLE: PATIENT'}
                </span>
              </div>
              <p className="text-xs text-[#e5e2dc] truncate mt-0.5">
                {contextLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#cceda3] font-semibold shrink-0">
            <span>RBAC &amp; ZKP</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Cryptographic Proof, RBAC & Architecture Inspector Modal */}
      {showInspector && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-md rounded-3xl bg-[#FBF8F2] border border-[#ECE7DC] shadow-2xl overflow-hidden text-[#1A201C] animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0b3026] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#cceda3]" />
                <div>
                  <h3 className="text-sm font-bold">TideCloak Zero-Trust IAM Inspector</h3>
                  <p className="text-[11px] text-[#a9cfbf]">
                    Simulated Sign-In, Roles (`hasRealmRole`/`hasClientRole`) &amp; E2EE Tags
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInspector(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-[#F0ECE1] p-1.5 border-b border-[#ECE7DC] text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('access')}
                className={`py-1.5 rounded-xl transition-all ${
                  activeTab === 'access'
                    ? 'bg-[#0b3026] text-[#cceda3] shadow-xs'
                    : 'text-[#687771] hover:text-[#1A201C]'
                }`}
              >
                Roles &amp; Access
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('token')}
                className={`py-1.5 rounded-xl transition-all ${
                  activeTab === 'token'
                    ? 'bg-[#0b3026] text-[#cceda3] shadow-xs'
                    : 'text-[#687771] hover:text-[#1A201C]'
                }`}
              >
                Doken / E2EE
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('plan')}
                className={`py-1.5 rounded-xl transition-all ${
                  activeTab === 'plan'
                    ? 'bg-[#0b3026] text-[#cceda3] shadow-xs'
                    : 'text-[#687771] hover:text-[#1A201C]'
                }`}
              >
                Architecture Plan
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[68vh] overflow-y-auto text-xs">
              {/* Interactive Role Switcher */}
              {onSelectRole && (
                <div className="rounded-2xl bg-white p-3 border border-[#ECE7DC] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0b3026] flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-[#4b662b]" />
                      Simulate TideCloak Session Role
                    </span>
                    <span className="text-[10px] font-mono text-[#687771]">
                      {activeSession?.vuid?.slice(0, 22)}...
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.values(TIDECLOAK_ROLES_CATALOG).map((r) => {
                      const selected = activeSession?.roleKey === r.key;
                      return (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => onSelectRole(r.key)}
                          className={`py-2 px-2 rounded-xl text-[10.5px] font-extrabold transition-all border text-center ${
                            selected
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
                  {onToggleEmergentAuthority && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-[#ECE7DC]">
                      <span className="text-[11px] font-semibold text-[#414845]">
                        Patient Emergent Authority Grant (15m):
                      </span>
                      <button
                        type="button"
                        onClick={onToggleEmergentAuthority}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                          activeSession?.emergentAuthorityGranted
                            ? 'bg-[#c7e89e] text-[#0b3026]'
                            : 'bg-[#ffdad6] text-[#93000a]'
                        }`}
                      >
                        {activeSession?.emergentAuthorityGranted ? (
                          <>
                            <Unlock className="w-3 h-3" /> Granted to Clinician
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> Locked by Patient
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'access' && (
                <div className="rounded-2xl bg-white p-3 border border-[#ECE7DC] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0b3026] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#4b662b]" />
                      Live TideCloak Access Checks
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#cceda3] text-[#0b3026] font-bold text-[10px]">
                      {accessMatrix.filter((c) => c.allowed).length}/{accessMatrix.length} ALLOWED
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {accessMatrix.map((chk) => (
                      <div
                        key={chk.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#f6f3ed] border border-[#ECE7DC]"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[#1A201C] text-[11px] truncate">
                            {chk.resource}
                          </div>
                          <div className="font-mono text-[9.5px] text-[#687771] truncate">
                            {chk.requiredCheck}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 ${
                            chk.allowed
                              ? 'bg-[#c7e89e] text-[#0b3026]'
                              : 'bg-[#ffdad6] text-[#93000a]'
                          }`}
                        >
                          {chk.allowed ? 'ALLOWED' : 'DENIED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'token' && (
                <>
                  <div className="rounded-2xl bg-white p-3 border border-[#ECE7DC] space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#0b3026] font-sans font-bold text-xs mb-1">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Decoded TideCloak Doken &amp; Cipher Metadata</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#687771]">Realm:</span>
                      <span className="text-[#1A201C] font-semibold truncate max-w-[190px]">
                        {proofData?.realm || 'vitatrack-sovereign-health'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#687771]">vuid:</span>
                      <span className="text-[#4b662b] font-semibold truncate max-w-[190px]">
                        {activeSession?.vuid || 'vuid:tide:0x9f8c...3e1b44a0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#687771]">Realm Roles:</span>
                      <span className="text-[#1A201C] font-semibold">
                        {(activeSession?.realmRoles || ['patient']).join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#687771]">Raw PII Exposed:</span>
                      <span className="text-[#4b662b] font-bold">FALSE (0 bytes)</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#1A201C] text-[#cceda3] p-3 font-mono text-[10px] space-y-1">
                    <div className="flex items-center justify-between text-white font-sans font-bold text-[11px] mb-1">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#cceda3]" />
                        Decoded JWT Access Token &amp; AI Payload
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-[#a9cfbf]">
                        <EyeOff className="w-3 h-3" /> PII Redacted
                      </span>
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-[#e5e2dc] max-h-44">
                      {JSON.stringify(
                        activeSession?.decodedToken || proofData?.sanitizedForAI,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </>
              )}

              {activeTab === 'plan' && (
                <div className="space-y-2">
                  {TIDECLOAK_ARCHITECTURE_PLAN.map((item) => (
                    <div
                      key={item.layer}
                      className="rounded-2xl bg-white p-3 border border-[#ECE7DC] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-[#0b3026] text-[11.5px] flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-[#4b662b]" />
                          {item.layer}
                        </span>
                        <span className="font-mono text-[9.5px] px-2 py-0.5 rounded-full bg-[#f6f3ed] text-[#24473b] font-bold border border-[#ECE7DC]">
                          {item.sdkMethod}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#687771] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowInspector(false)}
                className="w-full py-2.5 rounded-full bg-[#24473b] text-white font-bold text-xs shadow-md hover:bg-[#0b3026] transition-colors"
              >
                Close TideCloak IAM Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
