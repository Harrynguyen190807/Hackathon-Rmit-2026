import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  AlertTriangle,
  ShieldCheck,
  Pill,
  Check,
  Code2,
  X,
  RefreshCw,
} from 'lucide-react';
import TideCloakBadge from './TideCloakBadge';
import {
  parsePrescriptionOcr,
  preprocessPrescriptionImage,
  formatMealRelationLabel,
  formatCompactTimingLabel,
} from '../services/prescriptionParser';
import {
  SYNTHETIC_PATIENT_VAULT,
  hasClientRole,
} from '../services/tidecloak';

export default function ScannerTab({
  activeRxKey = 'standardCardioRx',
  onSelectRx,
  prescription = SYNTHETIC_PATIENT_VAULT.presetPrescriptions.standardCardioRx,
  edgeProof,
  tideSession,
  onSelectRole,
  onToggleEmergentAuthority,
  onSaveToSchedule,
  onUpdateCustomRx,
  onNavigate,
}) {
  const canDecryptPrescriptions =
    !tideSession ||
    hasClientRole(tideSession, '_tide_prescriptions.decrypt') ||
    hasClientRole(tideSession, '_tide_prescriptions.selfencrypt');
  const canScanRx = !tideSession || hasClientRole(tideSession, 'rx:scan');
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [customRx, setCustomRx] = useState(null);
  const [editableOcrText, setEditableOcrText] = useState('');
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [showJsonSchema, setShowJsonSchema] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentRx = customRx || prescription;

  useEffect(() => {
    setEditableOcrText(currentRx.rawOcrText || '');
  }, [currentRx.rawOcrText]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startRealCamera = async (mode = facingMode) => {
    setCameraError('');
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setCapturedImage(null);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err) {
      setCameraError(
        'Unable to access camera directly (' +
          (err.message || 'Please grant camera permission or open via localhost') +
          '). You can click "Upload Prescription" to scan an image file!'
      );
    }
  };

  const toggleCameraFacing = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (cameraActive) startRealCamera(next);
  };

  const applyParsedRx = (parsed) => {
    setCustomRx(parsed);
    setEditableOcrText(parsed.rawOcrText || '');
    if (typeof onUpdateCustomRx === 'function') {
      onUpdateCustomRx(parsed);
    }
  };

  const runOcrPipeline = async (dataUrl, label) => {
    setIsScanning(true);
    setOcrProgress(15);
    setOcrStatusText('Pre-processing & enhancing contrast at Edge...');
    try {
      const enhancedDataUrl = await preprocessPrescriptionImage(dataUrl);
      if (window.Tesseract) {
        setOcrStatusText('Running bilingual OCR (VIE+ENG) & Brand Parser...');
        const res = await window.Tesseract.recognize(enhancedDataUrl, 'vie+eng', {
          logger: (m) => {
            if (m.status === 'recognizing text' && typeof m.progress === 'number') {
              setOcrProgress(Math.max(25, Math.round(m.progress * 100)));
            }
          },
        });
        const parsed = parsePrescriptionOcr(res?.data?.text || '', label);
        applyParsedRx(parsed);
        setShowRawOcr(true);
      } else {
        const parsed = parsePrescriptionOcr('', label);
        applyParsedRx(parsed);
      }
    } catch {
      const parsed = parsePrescriptionOcr('', label);
      applyParsedRx(parsed);
    } finally {
      setOcrProgress(100);
      setTimeout(() => {
        setIsScanning(false);
        setOcrStatusText('');
      }, 300);
    }
  };

  const handleReparseManualOcr = () => {
    const parsed = parsePrescriptionOcr(editableOcrText, 'Edited OCR Prescription');
    applyParsedRx(parsed);
  };

  const handleTestNoisyOcrSample = () => {
    stopCamera();
    setCapturedImage(null);
    const noisyInput =
      'Patient Name: Nguyễn Văn Hùng\n1/ Klamentin 625mg (Amoxicillin + Clavulanic Acid)   14 Viên\nUống sáng 1 viên, chiều 1 viên sau ăn\n2/ Nexium 20mg (Esomeprazole)   07 Viên\nNgày uống 1 lần sáng trước ăn 30 phút\n3/ Alpha Choay 4.2mg (Chymotrypsin)   20 Viên\n1 viên x 2 lần / ngày sau ăn\n4/ Panadol Extra 500mg (Paracetamol)   10 Viên\nS-T-C sau ăn';
    const parsed = parsePrescriptionOcr(noisyInput, 'Hospital Rx Sample');
    applyParsedRx(parsed);
    setShowRawOcr(true);
    setShowJsonSchema(true);
  };

  const captureFromWebcam = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();
    setCapturedImage(dataUrl);
    runOcrPipeline(dataUrl, 'Camera Snapshot');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl === 'string') {
        setCapturedImage(dataUrl);
        runOcrPipeline(dataUrl, file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectPreset = (rxKey) => {
    stopCamera();
    setCapturedImage(null);
    setCustomRx(null);
    if (typeof onSelectRx === 'function') {
      onSelectRx(rxKey);
    }
  };

  const handleSaveScheduleClick = () => {
    if (typeof onSaveToSchedule === 'function') {
      onSaveToSchedule(currentRx.medications);
    }
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2400);
  };

  const structuredJson =
    currentRx.structuredJsonSchema ||
    currentRx.medications.map((m) => ({
      brand_name: m.brand_name || m.name,
      active_ingredient: m.active_ingredient || m.name,
      dosage: m.dosage,
      frequency_per_day: m.frequency_per_day || 1,
      timing_slots: m.timing_slots || ['MORNING'],
      scheduled_times: m.scheduled_times || [m.time || '08:00'],
      meal_relation: m.meal_relation || 'AFTER_MEAL',
      notes: m.notes || m.instruction,
    }));

  return (
    <div className="flex flex-col w-full pb-6 space-y-4">
      <div className="flex items-center justify-between py-0.5">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-[#1A201C] tracking-tight">
            AI Prescription Scanner
          </span>
          <span className="text-xs text-[#687771]">
            Brand-First Edge OCR &amp; Schedule Parser
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#cceda3] text-[#0b3026] text-[10px] font-bold">
          {currentRx.confidence}
        </span>
      </div>

      <TideCloakBadge
        proofData={edgeProof}
        session={tideSession}
        onSelectRole={onSelectRole}
        onToggleEmergentAuthority={onToggleEmergentAuthority}
        contextLabel="Prescription OCR Protected by _tide_prescriptions"
      />

      {!canDecryptPrescriptions && (
        <div className="rounded-2xl bg-[#ffdad6] text-[#93000a] p-3.5 border border-[#ba1a1a]/30 text-xs space-y-1.5">
          <div className="flex items-center justify-between font-extrabold">
            <span>🔒 TideCloak Access Denied (`_tide_prescriptions.decrypt`)</span>
            <span className="text-[9.5px] px-2 py-0.5 rounded bg-white/80 uppercase">
              HTTP 403 • IGNORANT ADMIN
            </span>
          </div>
          <p className="leading-relaxed">
            Your active Doken (<strong>{tideSession?.roleLabel}</strong>) lacks{' '}
            <code>_tide_prescriptions.decrypt</code> and <code>rx:scan</code>. Prescription payloads below are masked as ciphertext.
          </p>
          {onSelectRole && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => onSelectRole('patient')}
                className="px-3 py-1 rounded-full bg-[#0b3026] text-[#cceda3] text-[10.5px] font-bold"
              >
                Switch to Patient
              </button>
              <button
                type="button"
                onClick={() => onSelectRole('clinician')}
                className="px-3 py-1 rounded-full bg-[#24473b] text-white text-[10.5px] font-bold"
              >
                Switch to Clinician
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Real Camera & File Upload Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {!cameraActive ? (
          <button
            type="button"
            onClick={() => startRealCamera()}
            className="py-2.5 px-3 rounded-2xl text-xs font-bold bg-[#0b3026] text-white shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <Camera className="w-4 h-4 text-[#cceda3]" />
            <span>Enable Camera</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            className="py-2.5 px-3 rounded-2xl text-xs font-bold bg-[#ba1a1a] text-white shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <X className="w-4 h-4" />
            <span>Close Camera</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="py-2.5 px-3 rounded-2xl text-xs font-bold bg-[#24473b] text-white shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          <Upload className="w-4 h-4 text-[#cceda3]" />
          <span>Upload Prescription</span>
        </button>
      </div>

      {cameraError && (
        <div className="rounded-2xl bg-[#ffdcc5] text-[#462000] p-3 text-xs font-medium border border-[#F3A871]/50">
          {cameraError}
        </div>
      )}

      {/* Camera Viewfinder */}
      <div className="bg-white rounded-3xl p-3 border border-[#ECE7DC] shadow-sm">
        <div className="relative h-60 rounded-2xl bg-[#1A201C] overflow-hidden flex flex-col justify-between p-3">
          {cameraActive && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover z-10"
            />
          )}

          {!cameraActive && capturedImage && (
            <img
              src={capturedImage}
              alt="Scanned Prescription"
              className="absolute inset-0 w-full h-full object-contain bg-black/90 z-10"
            />
          )}

          {!cameraActive && !capturedImage && (
            <div className="relative z-10 bg-[#FBF8F2]/95 rounded-xl p-3 border border-[#ECE7DC] text-[#1A201C] space-y-1.5 shadow-inner my-auto max-h-40 overflow-y-auto">
              <div className="flex justify-between items-center text-[10px] font-bold border-b border-[#ECE7DC] pb-1">
                <span className="text-[#24473b] truncate max-w-[200px]">{currentRx.title}</span>
                <span className="text-[#687771] font-mono">[PII_REDACTED]</span>
              </div>
              <div className="space-y-1 text-xs">
                {currentRx.medications.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-[#ECE7DC] gap-2"
                  >
                    <div className="truncate min-w-0">
                      <span className="font-extrabold text-[#0b3026]">
                        {i + 1}. {m.brand_name || m.name} {m.dosage}
                      </span>
                      <span className="text-[10px] text-[#687771] ml-1.5">
                        ({m.active_ingredient})
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-[#0b3026] bg-[#F5EFE4] px-2 py-0.5 rounded-md border border-[#E5E0D4] shrink-0">
                      {(m.scheduled_times || [m.time]).join(' • ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative z-20 flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-[#0b3026]/85 backdrop-blur-md text-[#cceda3] text-[10px] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#cceda3] animate-ping" />
              {isScanning
                ? `${ocrStatusText || 'Extracting Brand & Dosage'} (${ocrProgress}%)`
                : cameraActive
                ? 'Live Camera Active • Align prescription in frame'
                : `Detected ${currentRx.medications.length} medications`}
            </span>

            {cameraActive && (
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="px-2.5 py-1 rounded-full bg-white/90 text-[#0b3026] text-[10px] font-bold shadow"
              >
                Switch Camera
              </button>
            )}

            {!cameraActive && capturedImage && (
              <button
                type="button"
                onClick={() => setCapturedImage(null)}
                className="px-2.5 py-1 rounded-full bg-white/90 text-[#93000a] text-[10px] font-bold shadow"
              >
                Clear Image
              </button>
            )}
          </div>

          <div className="absolute inset-2.5 border-2 border-[#cceda3]/40 rounded-2xl pointer-events-none z-10" />

          <div className="relative z-20 flex items-center justify-center gap-3">
            {cameraActive ? (
              <button
                type="button"
                onClick={captureFromWebcam}
                className="px-5 py-2 rounded-full bg-[#cceda3] text-[#0b3026] font-extrabold text-xs shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform ring-4 ring-white/40"
              >
                <Camera className="w-4 h-4" />
                <span>Capture &amp; Run Edge OCR</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-1.5 rounded-full bg-white/95 text-[#0b3026] font-bold text-[11px] shadow-md flex items-center gap-1.5 hover:bg-[#cceda3] transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Select Prescription Image</span>
              </button>
            )}
          </div>
        </div>

        {/* Preset & OCR Normalization Test Controls */}
        <div className="mt-2.5 pt-2 border-t border-[#ECE7DC] space-y-1.5">
          <div className="text-[10px] font-bold text-[#687771] uppercase px-1">
            Quick Prescription Presets &amp; Hospital OCR Test:
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectPreset('standardCardioRx')}
              className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-colors ${
                activeRxKey === 'standardCardioRx' && !customRx
                  ? 'bg-[#0b3026] text-[#cceda3]'
                  : 'bg-[#c7e89e]/70 hover:bg-[#c7e89e] text-[#0b3026]'
              }`}
            >
              Rx 1: Cardio (Mild)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('criticalConflictRx')}
              className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-colors ${
                activeRxKey === 'criticalConflictRx' && !customRx
                  ? 'bg-[#93000a] text-white'
                  : 'bg-[#ffdad6]/80 hover:bg-[#ffdad6] text-[#93000a]'
              }`}
            >
              Rx 2: Conflict (Critical)
            </button>
            <button
              type="button"
              onClick={handleTestNoisyOcrSample}
              className="py-2 px-2 rounded-xl text-[11px] font-bold bg-[#f6f3ed] hover:bg-[#e5e2dc] text-[#0b3026] border border-[#ECE7DC] transition-colors"
            >
              Rx 3: Hospital OCR
            </button>
          </div>
        </div>
      </div>

      {/* Extracted OCR Text & Structured JSON Schema Inspector */}
      <div className="rounded-2xl bg-white p-3.5 border border-[#ECE7DC] shadow-sm space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-[#0b3026] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#4b662b]" />
            Extracted OCR Text (PII Redacted at Edge)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRawOcr(!showRawOcr)}
              className="text-[11px] font-bold text-[#24473b] underline"
            >
              {showRawOcr ? 'Hide Details' : 'View Details'}
            </button>
            <button
              type="button"
              onClick={() => setShowJsonSchema(!showJsonSchema)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f6f3ed] text-[#0b3026] text-[10px] font-bold border border-[#ECE7DC]"
            >
              <Code2 className="w-3 h-3" />
              {showJsonSchema ? 'Hide JSON' : 'JSON Schema'}
            </button>
          </div>
        </div>

        {showRawOcr && (
          <div className="space-y-2">
            <textarea
              value={editableOcrText}
              onChange={(e) => setEditableOcrText(e.target.value)}
              rows={4}
              placeholder="Paste or edit extracted OCR prescription lines here..."
              className="w-full p-2.5 rounded-xl bg-[#f6f3ed] text-[11px] font-mono text-[#1A201C] border border-[#ECE7DC] focus:outline-none focus:border-[#24473b]"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#687771]">
                Tip: Edit any noisy OCR line above and click Re-Parse to update medications.
              </span>
              <button
                type="button"
                onClick={handleReparseManualOcr}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0b3026] text-[#cceda3] text-[10px] font-bold shadow-xs hover:bg-[#24473b] transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-Parse OCR Text</span>
              </button>
            </div>
          </div>
        )}

        {showJsonSchema && (
          <pre className="p-2.5 rounded-xl bg-[#1A201C] text-[#cceda3] text-[10.5px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-[#0b3026]">
            {JSON.stringify(structuredJson, null, 2)}
          </pre>
        )}
      </div>

      {/* Drug–Food / Drug–Drug Interaction Alerts */}
      {(currentRx.interactions || []).map((inter) => {
        const isCritical = inter.severity === 'CRITICAL';
        return (
          <div
            key={inter.id}
            className={`rounded-2xl p-4 border flex items-start gap-3 ${
              isCritical
                ? 'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/30'
                : 'bg-[#ffdcc5] text-[#462000] border-[#F3A871]/50'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isCritical ? 'bg-[#ba1a1a] text-white' : 'bg-[#F3A871] text-white'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="font-extrabold">{inter.title}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase bg-white/80">
                  {inter.badgeText}
                </span>
              </div>
              <p className="leading-relaxed opacity-95">{inter.summary}</p>
            </div>
          </div>
        );
      })}

      {/* Extracted Brand-Prioritized Medications List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[#1A201C]">
            Detected {currentRx.medications.length} medications (Brand-Prioritized)
          </h3>
          <span className="text-[10px] font-semibold text-[#4b662b]">
            Normalized &amp; Scheduled
          </span>
        </div>

        {currentRx.medications.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl bg-white p-3.5 shadow-sm border border-[#ECE7DC] flex items-center justify-between gap-3"
          >
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-[#f6f3ed] flex items-center justify-center text-[#24473b] shrink-0 mt-0.5">
                <Pill className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                {/* Commercial/Brand Name + Dosage */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-extrabold text-[#0b3026]">
                    {canDecryptPrescriptions
                      ? `${m.brand_name || m.name} ${m.dosage}`
                      : `🔒 TIDE_CIPHER[prescriptions]`}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c7e89e]/70 text-[#0b3026] font-bold">
                    {canDecryptPrescriptions
                      ? formatMealRelationLabel(m.meal_relation)
                      : 'E2EE LOCKED'}
                  </span>
                </div>
                {/* Secondary Active Ingredient Reference */}
                <div className="text-[11px] font-semibold text-[#4b662b] truncate">
                  {canDecryptPrescriptions
                    ? `Active Ingredient: ${m.active_ingredient || m.name}`
                    : 'Missing _tide_prescriptions.decrypt in Doken'}
                </div>
                <div className="text-[11px] text-[#687771] mt-0.5 leading-snug">
                  {canDecryptPrescriptions
                    ? m.notes || m.instruction
                    : '0x8f92e1c4b07a... Encrypted by Tide Threshold Prism'}
                </div>
              </div>
            </div>

            {/* Unified Fixed-Width Symmetrical Time-Slot Frame */}
            <div className="w-[118px] shrink-0 rounded-2xl bg-[#F5EFE4] border border-[#E5E0D4] p-1.5 flex flex-col items-center justify-center text-center gap-1 self-center">
              <div className="w-full rounded-xl bg-white px-2 py-1 text-[11px] font-extrabold text-[#0b3026] shadow-xs tracking-tight text-center truncate">
                {(m.scheduled_times || [m.time || '08:00']).join(' • ')}
              </div>
              <span className="text-[9px] font-extrabold text-[#4b662b] uppercase tracking-wider leading-tight text-center">
                {formatCompactTimingLabel(m.timing_slots, m.frequency_per_day)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Save Schedule & Ask AI Physician CTA */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={handleSaveScheduleClick}
          className={`w-full py-3.5 rounded-full text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5 ${
            savedToast ? 'bg-[#4b662b]' : 'bg-[#24473b] hover:bg-[#0b3026]'
          }`}
        >
          {savedToast ? (
            <>
              <Check className="w-4 h-4" />
              <span>Synced to Daily Medication Reminders!</span>
            </>
          ) : (
            <span>
              Sync Automated Daily Reminders (
              {Array.from(
                new Set(
                  currentRx.medications.flatMap((m) => m.scheduled_times || [m.time || '08:00'])
                )
              ).join(', ')}
              )
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('assistant')}
          className="w-full py-3 rounded-full text-xs font-bold text-[#0b3026] bg-[#F5EFE4] hover:bg-[#e5e2dc] transition-colors"
        >
          Ask AI Physician About This Prescription &rarr;
        </button>
      </div>
    </div>
  );
}
