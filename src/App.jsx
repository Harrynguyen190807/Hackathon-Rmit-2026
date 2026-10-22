import React, { useState, useMemo } from 'react';
import {
  Activity,
  ScanLine,
  Sparkles,
  CalendarClock,
  Bell,
  User,
  ShieldCheck,
  HeartPulse,
  LogIn,
} from 'lucide-react';
import {
  SYNTHETIC_PATIENT_VAULT,
  encryptHealthPayloadAtEdge,
} from './services/tidecloak';
import DashboardTab from './components/DashboardTab';
import ScannerTab from './components/ScannerTab';
import AiAssistantTab from './components/AiAssistantTab';
import ScheduleTab from './components/ScheduleTab';
import ProfileTab from './components/ProfileTab';
import AuthScreen from './components/AuthScreen';

const TABS = [
  { id: 'dashboard', label: 'Home', icon: Activity },
  { id: 'scanner', label: 'Scan Rx', icon: ScanLine, badge: true },
  { id: 'ai', label: 'AI Health', icon: Sparkles },
  { id: 'schedule', label: 'Trends', icon: CalendarClock },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userProfile, setUserProfile] = useState({
    name: 'Michelle Nguyen',
    phone: '+1 929 391 82 81',
    email: 'michelle.ng@vitatrack.health',
    vitaId: 'VT-3311045090',
    emergentAuthorityEnabled: true,
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeRxKey, setActiveRxKey] = useState('standardCardioRx');

  const activePrescription = SYNTHETIC_PATIENT_VAULT.presetPrescriptions[activeRxKey];

  const [scheduleItems, setScheduleItems] = useState([
    {
      id: 'sched-0800',
      time: '08:00',
      period: 'Buổi sáng',
      name: 'Amlodipine Besylate',
      dosage: '5mg',
      category: 'Hạ huyết áp & mạch vành',
      instruction: '1 viên sau ăn sáng',
      taken: true,
    },
    {
      id: 'sched-1900',
      time: '19:00',
      period: 'Buổi tối',
      name: 'Metformin Hydrochloride',
      dosage: '500mg',
      category: 'Kiểm soát đường huyết',
      instruction: '1 viên cùng bữa tối',
      taken: true,
    },
    {
      id: 'sched-2130',
      time: '21:30',
      period: 'Trước ngủ',
      name: 'Atorvastatin Calcium',
      dosage: '10mg',
      category: 'Hạ mỡ máu (Statin)',
      instruction: '1 viên trước khi ngủ',
      taken: false,
    },
  ]);

  const edgeProof = useMemo(() => {
    return encryptHealthPayloadAtEdge(
      activeTab.toUpperCase() + '_TELEMETRY',
      activePrescription
    );
  }, [activeTab, activePrescription]);

  const handleToggleDose = (id) => {
    setScheduleItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, taken: !item.taken } : item))
    );
  };

  const handleSaveToSchedule = (medications) => {
    const updated = medications.map((m, idx) => ({
      id: `sched-${idx}-${Date.now()}`,
      time: m.time || (idx === 0 ? '08:00' : idx === 1 ? '19:00' : '21:30'),
      period: m.period || 'Hàng ngày',
      name: m.name,
      dosage: m.dosage,
      category: m.category,
      instruction: m.instruction,
      taken: idx === 0,
    }));
    setScheduleItems(updated);
  };

  const handleAuthenticated = (profileData) => {
    setUserProfile((prev) => ({ ...prev, ...profileData }));
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const currentTabTitle = {
    dashboard: 'VitaTrack Dashboard',
    scanner: 'Quét Đơn Thuốc',
    ai: 'AI Health Assistant',
    schedule: 'Lịch & Xu Hướng',
    profile: 'Hồ Sơ Cá Nhân',
  }[activeTab];

  return (
    <div className="min-h-screen w-full py-0 sm:py-6 px-0 sm:px-4 flex flex-col items-center justify-center">
      {/* Judge Context Top Bar on Desktop */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md mb-3 px-3.5 py-1.5 rounded-full bg-[#0b3026] text-white text-xs shadow-md">
        <span className="flex items-center gap-1.5 font-bold text-[#cceda3]">
          <ShieldCheck className="w-4 h-4" />
          VitaTrack Health × TideCloak
        </span>
        <button
          type="button"
          onClick={() => setIsAuthenticated(!isAuthenticated)}
          className="px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-[11px] font-bold text-[#cceda3] flex items-center gap-1 transition-colors"
        >
          <LogIn className="w-3 h-3" />
          {isAuthenticated ? 'Xem trang Đăng nhập' : 'Vào thẳng Dashboard'}
        </button>
      </div>

      {/* Mobile Phone Frame Container */}
      <div className="w-full max-w-md mx-auto min-h-screen sm:min-h-[820px] sm:max-h-[880px] bg-[#FBF8F2] sm:rounded-[42px] sm:border-[8px] sm:border-[#1A201C] shadow-[0_25px_70px_-15px_rgba(11,48,38,0.35)] flex flex-col relative overflow-hidden">
        {/* Top Mobile Notch / Status Bar */}
        <div className="hidden sm:flex items-center justify-between px-7 pt-2.5 pb-1 bg-[#FBF8F2] text-[#1A201C] text-[11px] font-bold select-none">
          <span>09:41</span>
          <div className="w-24 h-4 rounded-full bg-[#1A201C] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#24473b] mr-2" />
          </div>
          <span className="text-[10px] text-[#4b662b] flex items-center gap-1">
            5G • 100%
          </span>
        </div>

        {!isAuthenticated ? (
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <AuthScreen onAuthenticated={handleAuthenticated} />
          </div>
        ) : (
          <>
            {/* Sticky App Header */}
            <header className="sticky top-0 z-30 bg-[#FBF8F2]/90 backdrop-blur-xl border-b border-[#ECE7DC]/80 px-5 h-14 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#c4ebda] flex items-center justify-center text-[#0b3026] shadow-sm">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-extrabold text-[#1A201C] tracking-tight leading-none">
                    {currentTabTitle}
                  </h1>
                  <span className="text-[10px] font-semibold text-[#4b662b] flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3" /> Secured by TideCloak
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('schedule')}
                  aria-label="Notifications"
                  className="relative w-9 h-9 rounded-full bg-[#F5EFE4] flex items-center justify-center text-[#414845] hover:text-[#1A201C] transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#F3A871]" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  title="Hồ sơ cá nhân"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    activeTab === 'profile'
                      ? 'bg-[#cceda3] text-[#0b3026] ring-2 ring-[#0b3026]'
                      : 'bg-[#0b3026] text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Scrollable Screen Content Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-24">
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
                  onSelectRx={setActiveRxKey}
                  prescription={activePrescription}
                  edgeProof={edgeProof}
                  onSaveToSchedule={handleSaveToSchedule}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'ai' && (
                <AiAssistantTab
                  prescription={activePrescription}
                  initialEdgeProof={edgeProof}
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
                  onNavigate={setActiveTab}
                  onLogout={() => setIsAuthenticated(false)}
                />
              )}
            </main>

            {/* Floating Bottom Navigation Bar (5 Tabs: Home, Scan Rx, AI Health, Trends, Profile) */}
            <div className="absolute bottom-3 left-0 right-0 z-40 px-3 pointer-events-none">
              <nav className="pointer-events-auto mx-auto w-full bg-white/95 backdrop-blur-xl rounded-full p-1.5 shadow-[0_12px_32px_-4px_rgba(11,48,38,0.16)] border border-[#ECE7DC]">
                <div className="grid grid-cols-5 gap-0.5">
                  {TABS.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-200 relative ${
                          isActive
                            ? 'bg-[#c7e89e] text-[#0b3026] font-extrabold shadow-sm'
                            : 'text-[#687771] hover:text-[#1A201C] font-medium'
                        }`}
                      >
                        <div className="relative flex items-center justify-center">
                          <IconComponent className="w-4 h-4" />
                          {tab.badge && (
                            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#4b662b] ring-2 ring-white" />
                          )}
                        </div>
                        <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-full">
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
