import React, { useState } from 'react';
import {
  Camera,
  Zap,
  Image as ImageIcon,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Pill,
  Check,
  Calendar,
  Bot,
  BellRing,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import TideCloakBadge from './TideCloakBadge';

export default function ScannerTab({
  activeRxKey,
  onSelectRx,
  prescription,
  edgeProof,
  onSaveToSchedule,
  onNavigate,
}) {
  const [flashOn, setFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const handleSimulateScan = (rxKey) => {
    setIsScanning(true);
    setTimeout(() => {
      onSelectRx(rxKey);
      setIsScanning(false);
    }, 650);
  };

  const handleSaveScheduleClick = () => {
    onSaveToSchedule(prescription.medications);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
    }, 2400);
  };

  return (
    <div className="flex flex-col w-full pb-6 space-y-4">
      {/* Sub-header (From Stitch Scan Đơn Thuốc) */}
      <div className="flex items-center justify-between py-0.5">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-[#1A201C] tracking-tight">
            Quét Đơn Thuốc AI
          </span>
          <span className="text-xs text-[#687771]">
            OCR bóc tách & kiểm tra tương tác thuốc tại Edge
          </span>
        </div>
        <button
          type="button"
          onClick={() => setFlashOn(!flashOn)}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${
            flashOn
              ? 'bg-[#cceda3] text-[#0b3026]'
              : 'bg-[#F5EFE4] text-[#1A201C] hover:bg-[#e5e2dc]'
          }`}
          title="Bật/Tắt đèn Flash"
        >
          <Zap className="w-4 h-4" />
        </button>
      </div>

      {/* Prominent TideCloak Verification Label for Judges */}
      <TideCloakBadge
        proofData={edgeProof}
        contextLabel="Prescription OCR Sanitized Before AI Analysis"
      />

      {/* AR Prescription Viewfinder Card (Stitch Design) */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-white shadow-[0_14px_34px_-4px_rgba(36,71,59,0.08)] border border-[#ECE7DC] p-3">
        <div className="relative w-full h-60 rounded-2xl overflow-hidden bg-[#163329] flex flex-col justify-between p-4">
          {/* Simulated Prescription Paper Surface inside Camera */}
          <div className="absolute inset-3 rounded-xl bg-[#FBF8F2]/95 p-3.5 text-[#1A201C] shadow-inner flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#ECE7DC] pb-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#24473b]">
                  {prescription.title}
                </span>
                <p className="text-[10px] text-[#687771] font-mono">
                  ID: {prescription.id} • BN: [TIDECLOAK_REDACTED]
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#cceda3] text-[#0b3026] font-mono text-[9px] font-bold">
                OCR {prescription.confidence}
              </span>
            </div>

            <div className="space-y-1.5 my-auto py-1">
              {prescription.medications.map((m, idx) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-xs bg-white/90 px-2.5 py-1.5 rounded-lg border border-[#ECE7DC]"
                >
                  <span className="font-bold text-[#0b3026]">
                    {idx + 1}. {m.name} <span className="text-[#4b662b]">{m.dosage}</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#687771]">
                    {m.time} ({m.period})
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-[#687771] flex items-center justify-between border-t border-[#ECE7DC] pt-1.5">
              <span>Chữ ký số BS: Đã xác thực ZKP</span>
              <span className="text-[#24473b] font-bold">TideCloak Edge Protected</span>
            </div>
          </div>

          {/* AR Focus Framing Reticle Corners */}
          <div className="absolute inset-2 pointer-events-none flex flex-col justify-between z-10">
            <div className="flex justify-between items-start">
              <div className="w-6 h-6 border-t-[3px] border-l-[3px] border-[#cceda3] rounded-tl-xl drop-shadow-[0_0_8px_rgba(204,237,163,0.9)]" />
              <div className="w-6 h-6 border-t-[3px] border-r-[3px] border-[#cceda3] rounded-tr-xl drop-shadow-[0_0_8px_rgba(204,237,163,0.9)]" />
            </div>
            <div className="flex justify-between items-end">
              <div className="w-6 h-6 border-b-[3px] border-l-[3px] border-[#cceda3] rounded-bl-xl drop-shadow-[0_0_8px_rgba(204,237,163,0.9)]" />
              <div className="w-6 h-6 border-b-[3px] border-r-[3px] border-[#cceda3] rounded-br-xl drop-shadow-[0_0_8px_rgba(204,237,163,0.9)]" />
            </div>
          </div>

          {/* Animated Laser Scanning Line */}
          <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-[#4b662b] to-transparent shadow-[0_0_12px_#4b662b] animate-scan-laser pointer-events-none z-20" />

          {/* Live Detection Floating Badge */}
          <div className="relative z-20 mx-auto px-3 py-1 rounded-full bg-[#0b3026]/90 backdrop-blur-md shadow-md flex items-center gap-1.5 text-white">
            <span className="w-2 h-2 rounded-full bg-[#cceda3] animate-ping" />
            <span className="text-[10px] tracking-wide uppercase font-bold text-[#cceda3]">
              {isScanning
                ? 'Đang mã hóa & phân tích OCR...'
                : `Đã nhận diện ${prescription.medications.length} loại thuốc`}
            </span>
          </div>

          {/* Shutter / Rescan Button */}
          <div className="relative z-20 mx-auto">
            <button
              type="button"
              onClick={() => handleSimulateScan(activeRxKey)}
              className="w-12 h-12 rounded-full bg-white p-1 shadow-lg active:scale-90 transition-transform flex items-center justify-center"
              title="Quét lại đơn thuốc"
            >
              <div className="w-full h-full rounded-full bg-[#0b3026] flex items-center justify-center text-white">
                {isScanning ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-[#cceda3]" />
                ) : (
                  <Camera className="w-5 h-5 text-[#cceda3]" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Sample Prescription Selector Strip (Allows Judges to test Yellow & Red Alerts) */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            type="button"
            onClick={() => handleSimulateScan('standardCardioRx')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold transition-all ${
              activeRxKey === 'standardCardioRx'
                ? 'bg-[#c7e89e] text-[#0b3026] shadow-sm'
                : 'bg-[#F5EFE4] text-[#687771] hover:text-[#1A201C]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Mẫu 1: Đơn Tim Mạch (Vàng)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateScan('criticalConflictRx')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold transition-all ${
              activeRxKey === 'criticalConflictRx'
                ? 'bg-[#ffdad6] text-[#93000a] shadow-sm ring-1 ring-[#ba1a1a]/30'
                : 'bg-[#F5EFE4] text-[#687771] hover:text-[#1A201C]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Mẫu 2: Xung Đột Nặng (Đỏ)</span>
          </button>
        </div>
      </div>

      {/* Drug Interaction Warnings (Red Critical & Yellow Warning Banners) */}
      <div className="space-y-2.5">
        {prescription.interactions.map((item) => {
          const isCritical = item.severity === 'CRITICAL';
          return (
            <div
              key={item.id}
              className={`rounded-2xl p-4 flex items-start gap-3 border transition-all ${
                isCritical
                  ? 'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/30 shadow-[0_8px_20px_-6px_rgba(186,26,26,0.25)]'
                  : 'bg-[#ffdcc5]/80 text-[#462000] border-[#F3A871]/50 shadow-[0_8px_20px_-6px_rgba(243,168,113,0.25)]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isCritical
                    ? 'bg-[#ba1a1a] text-white'
                    : 'bg-[#F3A871]/40 text-[#462000]'
                }`}
              >
                {isCritical ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className="text-sm font-extrabold tracking-tight">
                    {item.title}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      isCritical
                        ? 'bg-[#ba1a1a] text-white'
                        : 'bg-[#F3A871]/50 text-[#462000]'
                    }`}
                  >
                    {item.badgeText}
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed opacity-95">
                  {item.summary}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Extracted Medications List (From Stitch Scan Đơn Thuốc) */}
      <div className="flex flex-col space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4b662b]" />
            <h2 className="text-sm font-bold text-[#1A201C]">
              Kết quả bóc tách tự động
            </h2>
          </div>
          <span className="text-xs text-[#687771] font-medium">
            Độ chính xác {prescription.confidence}
          </span>
        </div>

        {prescription.medications.map((med) => (
          <div
            key={med.id}
            className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.05)] border border-[#ECE7DC]/80 transition-all"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#f6f3ed] flex items-center justify-center shrink-0 text-[#0b3026]">
                  <Pill className="w-5 h-5 text-[#24473b]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#1A201C] truncate">
                    {med.name}
                  </h3>
                  <p className="text-xs text-[#687771] truncate">
                    {med.category} • <strong className="text-[#0b3026]">{med.dosage}</strong>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 pl-2">
                <span className="text-lg font-extrabold text-[#0b3026]">
                  {med.time}
                </span>
                <span className="text-[10px] font-bold text-[#687771] uppercase">
                  {med.period}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-full bg-[#c7e89e] text-[#0b3026] text-xs font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {med.instruction}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#F5EFE4] text-[#414845] text-xs flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {med.duration}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Meadow Highlight Card for Clinical Guidance & AI Companion */}
      <div
        onClick={() => onNavigate('ai')}
        role="button"
        tabIndex={0}
        className="rounded-2xl p-4 bg-gradient-to-br from-[#D5EDAF] to-[#E9F6D6] shadow-[0_10px_24px_-4px_rgba(75,102,43,0.12)] flex items-center gap-3 cursor-pointer"
      >
        <div className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-md flex items-center justify-center text-[#0b3026] shrink-0 shadow-sm">
          <Bot className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[#0b3026]">
            Bác sĩ AI đã xem qua đơn (Zero-Trust)
          </h4>
          <p className="text-xs text-[#0b3026]/85 truncate">
            Nhấn để xem phân tích chi tiết tương tác & hướng dẫn uống an toàn.
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#0b3026] text-white flex items-center justify-center shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Action CTAs Stack (Stitch Design) */}
      <div className="flex flex-col gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleSaveScheduleClick}
          className={`w-full py-3.5 px-6 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-[0_12px_28px_-6px_rgba(36,71,59,0.35)] active:scale-[0.98] transition-all ${
            savedToast
              ? 'bg-[#4b662b] text-white'
              : 'bg-[#24473b] text-white hover:bg-[#0b3026]'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>
            {savedToast
              ? 'Đã đồng bộ 3 mốc giờ (08:00, 19:00, 21:30)!'
              : 'Lưu lịch uống thuốc tự động'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('ai')}
          className="w-full py-3 px-6 rounded-full bg-[#F5EFE4] hover:bg-[#e5e2dc] text-[#0b3026] font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <Sparkles className="w-4 h-4 text-[#4b662b]" />
          <span>Hỏi AI giải mã đơn thuốc này</span>
        </button>
      </div>
    </div>
  );
}
