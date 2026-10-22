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
} from 'lucide-react';
import TideCloakBadge from './TideCloakBadge';
import {
  parsePrescriptionOcr,
  formatMealRelationLabel,
} from '../services/prescriptionParser';
import { SYNTHETIC_PATIENT_VAULT } from '../services/tidecloak';

export default function ScannerTab({
  activeRxKey = 'standardCardioRx',
  onSelectRx,
  prescription = SYNTHETIC_PATIENT_VAULT.presetPrescriptions.standardCardioRx,
  edgeProof,
  onSaveToSchedule,
  onUpdateCustomRx,
  onNavigate,
}) {
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [customRx, setCustomRx] = useState(null);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [showJsonSchema, setShowJsonSchema] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentRx = customRx || prescription;

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
    if (typeof onUpdateCustomRx === 'function') {
      onUpdateCustomRx(parsed);
    }
  };

  const runOcrPipeline = async (dataUrl, label) => {
    setIsScanning(true);
    setOcrProgress(20);
    try {
      if (window.Tesseract) {
        const res = await window.Tesseract.recognize(dataUrl, 'eng+vie', {
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
      setTimeout(() => setIsScanning(false), 300);
    }
  };

  const handleTestNoisyOcrSample = () => {
    stopCamera();
    setCapturedImage(null);
    const noisyInput =
      'Patient Name: Michelle Nguyen\n1. A m l o r  5 m g (Amlodipine Besylate) - 1 tab Morning after meal\n2. G l u c o p h a g e  5 0 0 m g (Metformin HCl) - 1 viên x 2 lần / ngày with meal\n3. L i p i t o r  1 0 m g (Atorvastatin Calcium) - 1 tab before bedtime (21:30)';
    const parsed = parsePrescriptionOcr(noisyInput, 'Noisy OCR Sample');
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
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
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
        contextLabel="Prescription OCR Sanitized Before AI Analysis"
      />

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
            <div className="relative z-10 bg-[#FBF8F2]/95 rounded-xl p-3 border border-[#ECE7DC] text-[#1A201C] space-y-1.5 shadow-inner my-auto">
              <div className="flex justify-between items-center text-[10px] font-bold border-b border-[#ECE7DC] pb-1">
                <span className="text-[#24473b] truncate max-w-[200px]">{currentRx.title}</span>
                <span className="text-[#687771] font-mono">[PII_REDACTED]</span>
              </div>
              <div className="space-y-1 text-xs">
                {currentRx.medications.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-[#ECE7DC]"
                  >
                    <div className="truncate">
                      <span className="font-extrabold text-[#0b3026]">
                        {i + 1}. {m.brand_name || m.name} {m.dosage}
                      </span>
                      <span className="text-[10px] text-[#687771] ml-1.5">
                        ({m.active_ingredient})
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-[#24473b] shrink-0 ml-1">
                      {(m.scheduled_times || [m.time]).join(', ')}
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
                ? `Extracting Brand & Dosage (${ocrProgress}%)`
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
            Quick Prescription Presets &amp; OCR Noise Test:
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
              Test Noisy OCR
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
          <pre className="p-2.5 rounded-xl bg-[#f6f3ed] text-[11px] font-mono text-[#1A201C] whitespace-pre-wrap max-h-32 overflow-y-auto border border-[#ECE7DC]">
            {currentRx.rawOcrText}
          </pre>
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
            className="rounded-2xl bg-white p-3.5 shadow-sm border border-[#ECE7DC] flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#f6f3ed] flex items-center justify-center text-[#24473b] shrink-0 mt-0.5">
                  <Pill className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  {/* Commercial/Brand Name + Dosage */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-extrabold text-[#0b3026]">
                      {m.brand_name || m.name} {m.dosage}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c7e89e]/70 text-[#0b3026] font-bold">
                      {formatMealRelationLabel(m.meal_relation)}
                    </span>
                  </div>
                  {/* Secondary Active Ingredient Reference */}
                  <div className="text-[11px] font-semibold text-[#4b662b]">
                    Active Ingredient: {m.active_ingredient || m.name}
                  </div>
                  <div className="text-[11px] text-[#687771] mt-0.5">
                    {m.notes || m.instruction}
                  </div>
                </div>
              </div>

              {/* Scheduled Times & Frequency */}
              <div className="text-right shrink-0 pl-1">
                <span className="text-xs font-extrabold text-[#0b3026] bg-[#F5EFE4] px-2.5 py-1 rounded-lg block">
                  {(m.scheduled_times || [m.time]).join(' • ')}
                </span>
                <span className="block text-[9.5px] text-[#687771] uppercase font-bold mt-1">
                  {m.frequency_per_day || 1}x/day • {(m.timing_slots || ['DAILY']).join('/')}
                </span>
              </div>
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
            <span>Sync Automated Daily Reminders (08:00, 19:00, 21:30)</span>
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
