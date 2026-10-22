import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  ScanLine,
  Bot,
  CalendarClock,
  ShieldCheck,
  Lock,
  Sparkles,
  Wifi,
  BatteryCharging,
  User,
} from 'lucide-react';
import DashboardTab from './components/DashboardTab';
import ScannerTab from './components/ScannerTab';
import AiAssistantTab from './components/AiAssistantTab';
import ScheduleTab from './components/ScheduleTab';
import ProfileTab from './components/ProfileTab';
import AuthScreen from './components/AuthScreen';
import WelcomeScreen from './components/WelcomeScreen';
import {
  getTideCloakStatus,
  SYNTHETIC_PATIENT_VAULT,
  encryptHealthPayloadAtEdge,
} from './services/tidecloak';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  // 'welcome' | 'auth' | 'app'
  const [screenStage, setScreenStage] = useState('welcome');
  const [authInitialMode, setAuthInitialMode] = useState('signin');
  const [userProfile, setUserProfile] = useState({
    name: 'Michelle Nguyen',
    phone: '+1 929 391 82 81',
    email: 'michelle.nguyen@vitatrack.health',
    vitalId: 'VT-3311045090',
    streakDays: 75,
    badgesCount: 81,
    isPro: true,
  });

  // Persistent Prescription & Schedule Memory across Scanner, AI Health Assistant, and Trends
  const [activeRxKey, setActiveRxKey] = useState('standardCardioRx');
  const [customRx, setCustomRx] = useState(null);
  const activePrescription =
    customRx || SYNTHETIC_PATIENT_VAULT.presetPrescriptions[activeRxKey];

  const [scheduleItems, setScheduleItems] = useState([
    {
      id: 'sched-1',
      time: '08:00',
      period: 'MORNING',
      brand_name: 'Amlor',
      name: 'Amlor',
      active_ingredient: 'Amlodipine Besylate',
      dosage: '5mg',
      meal_relation: 'AFTER_MEAL',
      instruction: 'Take 1 tablet after breakfast with 250ml water',
      category: 'Antihypertensive',
      taken: true,
    },
    {
      id: 'sched-2',
      time: '19:00',
      period: 'EVENING',
      brand_name: 'Glucophage',
      name: 'Glucophage',
      active_ingredient: 'Metformin HCl',
      dosage: '500mg',
      meal_relation: 'WITH_MEAL',
      instruction: 'Take 1 tablet with dinner',
      category: 'Glycemic Control',
      taken: true,
    },
    {
      id: 'sched-3',
      time: '21:30',
      period: 'BEDTIME',
      brand_name: 'Lipitor',
      name: 'Lipitor',
      active_ingredient: 'Atorvastatin Calcium',
      dosage: '10mg',
      meal_relation: 'BEFORE_BEDTIME',
      instruction: 'Take 1 tablet before going to sleep',
      category: 'Lipid-Lowering (Statin)',
      taken: false,
    },
  ]);

  const [tideStatus] = useState(() => getTideCloakStatus());
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveToSchedule = (medications = []) => {
    const expandedSlots = [];
    medications.forEach((med, idx) => {
      const times = med.scheduled_times || [med.time || '08:00'];
      const slots = med.timing_slots || ['MORNING'];
      times.forEach((timeStr, tIdx) => {
        expandedSlots.push({
          id: `sched-${idx}-${tIdx}-${Date.now()}`,
          time: timeStr,
          period: slots[tIdx] || slots[0] || 'DAILY',
          brand_name: med.brand_name || med.name,
          name: med.brand_name || med.name,
          active_ingredient: med.active_ingredient || '',
          dosage: med.dosage,
          meal_relation: med.meal_relation || 'AFTER_MEAL',
          instruction: med.notes || med.instruction,
          category: med.category || 'Prescribed Regimen',
          taken: idx === 0 && tIdx === 0,
        });
      });
    });
    if (expandedSlots.length > 0) {
      setScheduleItems(expandedSlots);
    }
  };

  const handleToggleDose = (id) => {
    setScheduleItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, taken: !item.taken } : item))
    );
  };

  const edgeProof = encryptHealthPayloadAtEdge('PRESCRIPTION_SESSION', activePrescription);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutGrid },
    { id: 'scanner', label: 'Scan Rx', icon: ScanLine },
    { id: 'assistant', label: 'AI Health', icon: Bot },
    { id: 'schedule', label: 'Trends', icon: CalendarClock },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const isLightScreen = screenStage === 'welcome' || screenStage === 'auth';

  return (
    <div className="min-h-screen bg-[#070C0A] text-[#F1F5F3] flex flex-col items-center justify-center p-2 sm:p-6 relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none fixed -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-[120px]" />

      {/* Top Desktop Hackathon Banner + Stage Switcher (100% English) */}
      <div className="hidden sm:flex items-center gap-2 mb-3 px-3.5 py-1.5 rounded-full bg-[#111C18]/90 border border-emerald-500/25 text-xs text-emerald-300 shadow-lg backdrop-blur-md">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-semibold tracking-wide">VitaTrack Health</span>
        <span className="text-emerald-500/40">|</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setScreenStage('welcome')}
            className={`px-2.5 py-0.5 rounded-full font-semibold transition-all text-[11px] ${
              screenStage === 'welcome'
                ? 'bg-emerald-500 text-[#062E22]'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
            }`}
          >
            🌱 1. Welcome
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthInitialMode('signin');
              setScreenStage('auth');
            }}
            className={`px-2.5 py-0.5 rounded-full font-semibold transition-all text-[11px] ${
              screenStage === 'auth'
                ? 'bg-emerald-500 text-[#062E22]'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
            }`}
          >
            🔑 2. Sign In
          </button>
          <button
            type="button"
            onClick={() => setScreenStage('app')}
            className={`px-2.5 py-0.5 rounded-full font-semibold transition-all text-[11px] ${
              screenStage === 'app'
                ? 'bg-emerald-500 text-[#062E22]'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
            }`}
          >
            📱 3. Main App
          </button>
        </div>
      </div>

      {/* Mobile Frame Container */}
      <div
        className={`w-full max-w-md mx-auto rounded-[42px] border-[6px] shadow-[0_25px_70px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col h-[840px] max-h-[92vh] relative ring-1 transition-colors duration-300 ${
          isLightScreen
            ? 'bg-[#FCF9F3] border-[#E5E0D4] ring-[#24473B]/15'
            : 'bg-[#FBF8F2] border-[#1F332B] ring-emerald-500/20 text-[#1A201C]'
        }`}
      >
        {/* iOS / Mobile Status Bar */}
        <div className="px-7 pt-3 pb-2 flex items-center justify-between text-xs font-semibold select-none shrink-0 bg-[#FCF9F3] text-[#16231E]">
          <span className="tracking-wider font-bold text-[14px]">{currentTime}</span>
          <div className="w-24 h-4 rounded-full bg-black/90 border border-white/10 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-300 font-mono uppercase tracking-tighter">
              ZKP-ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" />
            <BatteryCharging className="w-4 h-4 text-[#24473B]" />
          </div>
        </div>

        {screenStage === 'welcome' && (
          <WelcomeScreen
            onStartJourney={() => {
              setAuthInitialMode('signup');
              setScreenStage('auth');
            }}
            onSignIn={() => {
              setAuthInitialMode('signin');
              setScreenStage('auth');
            }}
          />
        )}

        {screenStage === 'auth' && (
          <AuthScreen
            key={authInitialMode}
            initialMode={authInitialMode}
            onBackToWelcome={() => setScreenStage('welcome')}
            onLoginSuccess={(userData) => {
              setUserProfile((prev) => ({ ...prev, ...userData }));
              setScreenStage('app');
            }}
          />
        )}

        {screenStage === 'app' && (
          <>
            {/* App Top Header with TideCloak Security Pill & Quick Profile Avatar */}
            <header className="px-5 pt-2 pb-3 border-b border-[#ECE7DC] bg-[#FBF8F2]/95 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#24473b] to-[#0b3026] flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-[#cceda3]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-base font-bold tracking-tight text-[#1A201C]">
                      VitaTrack
                    </h1>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#c7e89e] text-[#0b3026]">
                      AI + ZKP
                    </span>
                  </div>
                  <p className="text-[11px] text-[#687771]">Smart Health &amp; Rx Safety</p>
                </div>
              </div>

              {/* Right Controls: TideCloak Status Pill + Avatar */}
              <div className="flex items-center gap-2">
                <div
                  title={`DID: ${tideStatus.did}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#0b3026] text-[10px] font-bold text-[#cceda3] shadow-sm"
                >
                  <Lock className="w-3 h-3 text-[#cceda3] shrink-0" />
                  <span>TideCloak</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  title="Account Profile"
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all border ${
                    activeTab === 'profile'
                      ? 'bg-[#cceda3] text-[#0b3026] border-[#0b3026]'
                      : 'bg-[#F5EFE4] text-[#0b3026] border-[#ECE7DC] hover:border-[#0b3026]'
                  }`}
                >
                  {userProfile.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </button>
              </div>
            </header>

            {/* Main Scrollable Viewport */}
            <main className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4 bg-[#FBF8F2]">
              {activeTab === 'dashboard' && (
                <DashboardTab
                  biometrics={SYNTHETIC_PATIENT_VAULT.biometrics}
                  edgeProof={edgeProof}
                  onNavigate={setActiveTab}
                />
              )}
              {activeTab === 'scanner' && (
                <ScannerTab
                  activeRxKey={activeRxKey}
                  onSelectRx={(key) => {
                    setCustomRx(null);
                    setActiveRxKey(key);
                  }}
                  prescription={activePrescription}
                  edgeProof={edgeProof}
                  onSaveToSchedule={handleSaveToSchedule}
                  onUpdateCustomRx={(parsed) => setCustomRx(parsed)}
                  onNavigate={setActiveTab}
                />
              )}
              {activeTab === 'assistant' && (
                <AiAssistantTab
                  prescription={activePrescription}
                  initialEdgeProof={edgeProof}
                  onSyncReminders={handleSaveToSchedule}
                />
              )}
              {activeTab === 'schedule' && (
                <ScheduleTab
                  scheduleItems={scheduleItems}
                  onToggleDose={handleToggleDose}
                />
              )}
              {activeTab === 'profile' && (
                <ProfileTab
                  user={userProfile}
                  onLogout={() => {
                    setAuthInitialMode('signin');
                    setScreenStage('auth');
                  }}
                  onNavigate={setActiveTab}
                />
              )}
            </main>

            {/* Bottom Navigation Bar (5 Tabs - 100% English) */}
            <nav className="px-3 py-2 bg-white/95 backdrop-blur-xl border-t border-[#ECE7DC] flex items-center justify-around shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                      isActive
                        ? 'bg-[#c7e89e] text-[#0b3026] font-extrabold scale-105 shadow-sm'
                        : 'text-[#687771] hover:text-[#1A201C]'
                    }`}
                  >
                    <div className="relative">
                      <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
                      {item.id === 'scanner' && (
                        <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold mt-1 tracking-tight">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
