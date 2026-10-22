# VitaTrack: Secure AI Prescription & Health Passport

> **What would you build if trust stopped being the bottleneck?** VitaTrack is a patient-controlled health passport and smart prescription assistant powered by **TideCloak** and *Emergent Authority*.

---

## Project Overview

### 1. Vision & Originality
VitaTrack bridges daily biometric tracking (heart rate, blood pressure, sleep) with intelligent prescription management (AI OCR Rx Scanner and Asclepios Health AI). It translates complex medical jargon into a warm, accessible organic UI, eliminating medical anxiety.

### 2. Trust Constraint Insight
Today, medical records and prescriptions are siloed in third-party hospital servers or centralized databases. Patients lose granular control, and trusting a single administrator or server with sensitive health data carries severe privacy risks. Removing this unilateral control enables secure, patient-owned health data exchange.

### 3. Value & Impact
Outpatient patients, elderly individuals, and family caregivers can seamlessly manage medication adherence and avoid dangerous drug-to-drug interactions (e.g., conflicting prescriptions or dietary restrictions) without compromising their private medical history to central servers.

### 4. Why TideCloak Matters
VitaTrack integrates **TideCloak** to enforce *Emergent Authority*. No single administrator, server vendor, or third-party app runner holds a reusable master key. Access to specific health record categories (such as allergies or sensitive diagnoses) only emerges when validated clinical identity aligns with explicit, real-time patient approval.

### 5. Prototype & Storytelling
The prototype demonstrates:
1. **Dashboard Bento Grid:** Live biometric tracking and overall health scores.
2. **Smart Rx Scanner:** AI-powered OCR extracting medication dosage and checking drug interactions.
3. **Patient-Controlled Access:** The core demo moment where data fields remain locked until the patient explicitly authorizes temporary, scoped clinician access via TideCloak.

---

## Setup & Quickstart

1. Clone the repository:
```bash
git clone https://github.com/Harrynguyen190807/RMIT_SGS_Co-Ro-Chuong-Bich_C2.git
cd RMIT_SGS_Co-Ro-Chuong-Bich_C2
```

2. Run the application:
- **Option 1 (Direct in Browser):** Open `index.html` in your browser or run a local server:
```bash
python -m http.server 8000
```
Then visit: `http://localhost:8000`

- **Option 2 (Vite / React Dev Server):**
```bash
npm install
npm run dev
```
