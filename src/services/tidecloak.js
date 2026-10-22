/**
 * TideCloak Zero-Trust IAM, Tag-Based Encryption & Access Control Engine
 * ----------------------------------------------------------------------
 * Models @tidecloak/js (IAMService) & @tidecloak/react (useTideCloak):
 *  - Simulated TideCloak OIDC / Doken Sign-In (patient, clinician, ignorant_admin)
 *  - Role checks: hasRealmRole(role), hasClientRole(role, clientId)
 *  - Tag-based client-side E2EE: doEncrypt([{ data, tags }]), doDecrypt([{ encrypted, tags }])
 *  - Emergent Authority: Patient-controlled quorum delegation to Clinicians
 *  - Ignorant Admin enforcement: Cloud/DB admins hold 0 decryption capabilities
 */

export const TIDECLOAK_REALM = 'vitatrack-sovereign-health';
export const TIDECLOAK_CLIENT_ID = 'vitatrack-client';
const ENCRYPTION_ALGO = 'AES-256-GCM + Tide-MPC-BLS12-381';
const ZKP_PROTOCOL = 'Groth16 / TideCloak-Doken-v2';

/**
 * Architectural Plan: Where TideCloak Fits Across VitaTrack Health
 */
export const TIDECLOAK_ARCHITECTURE_PLAN = [
  {
    layer: '1. Authentication & Neon Enclave Sign-In',
    sdkMethod: 'IAMService.login() / useTideCloak()',
    description:
      'Authenticates users via Tide Cybersecurity Fabric (Prism/Ork threshold nodes) without storing password hashes on any central server. Issues a signed JWT + Doken containing a privacy-preserving vuid.',
  },
  {
    layer: '2. Realm & Client Role Guards (RBAC)',
    sdkMethod: 'hasRealmRole() & hasClientRole()',
    description:
      'Inspects realm_access.roles (patient, clinician, tide-realm-admin) and resource_access["vitatrack-client"].roles to gate UI tabs, prescription scanning, and clinical report exports.',
  },
  {
    layer: '3. Tag-Based End-to-End Encryption (E2EE)',
    sdkMethod: 'doEncrypt() & doDecrypt()',
    description:
      'Encrypts sensitive medical tags ("prescriptions", "allergies", "diagnoses", "biometrics") at the browser edge. Decryption requires matching _tide_<tag>.selfencrypt or _tide_<tag>.decrypt roles in the user Doken.',
  },
  {
    layer: '4. Emergent Authority & Ignorant Admin',
    sdkMethod: 'Grant Clinician Quorum / Zero-Key Admin',
    description:
      'Clinicians cannot read locked allergies/diagnoses until the Patient explicitly co-signs a temporary 15-minute Emergent Authority grant. System admins ("Ignorant Admins") never receive decryption roles.',
  },
];

/**
 * Simulated TideCloak Roles & Personas for Interactive Testing
 */
export const TIDECLOAK_ROLES_CATALOG = {
  patient: {
    key: 'patient',
    label: 'Patient (Sovereign Owner)',
    shortBadge: 'ROLE: PATIENT',
    displayName: 'Michelle Nguyen',
    email: 'michelle.nguyen@vitatrack.health',
    phone: '+1 929 391 82 81',
    vitalId: 'VT-3311045090',
    vuid: 'vuid:tide:0x9f8c74a1e204b8d03e1b44a0',
    did: 'did:tide:zk:0x9f8c...3e1b44a0',
    realmRoles: ['patient', 'sovereign_data_owner', 'offline_access'],
    baseClientRoles: [
      '_tide_prescriptions.selfencrypt',
      '_tide_prescriptions.decrypt',
      '_tide_allergies.selfencrypt',
      '_tide_allergies.decrypt',
      '_tide_diagnoses.selfencrypt',
      '_tide_diagnoses.decrypt',
      '_tide_biometrics.selfencrypt',
      '_tide_biometrics.decrypt',
      'rx:scan',
      'rx:write',
      'ai:consult',
      'schedule:manage',
      'authority:grant',
      'audit:export',
    ],
    description:
      'Full sovereign owner of personal health tags. Can encrypt/decrypt all medical records and grant temporary Emergent Authority to clinicians.',
  },
  clinician: {
    key: 'clinician',
    label: 'Clinician (Attending MD)',
    shortBadge: 'ROLE: CLINICIAN',
    displayName: 'Dr. Marcus Vance, MD',
    email: 'dr.vance@cardio-clinic.org',
    phone: '+1 212 555 0194',
    vitalId: 'MD-NPI-4491028',
    vuid: 'vuid:tide:0x4b12e98c77a10d22f09c11b8',
    did: 'did:tide:zk:0x4b12...f09c11b8',
    realmRoles: ['clinician', 'verified_physician'],
    baseClientRoles: [
      '_tide_prescriptions.decrypt',
      '_tide_biometrics.decrypt',
      'rx:scan',
      'rx:verify',
      'ai:consult',
    ],
    emergentClientRoles: [
      '_tide_allergies.decrypt',
      '_tide_diagnoses.decrypt',
      'audit:export',
    ],
    description:
      'Can review prescriptions and consult AI, but CANNOT decrypt [_tide_allergies] or [_tide_diagnoses] unless the Patient grants Emergent Authority.',
  },
  ignorant_admin: {
    key: 'ignorant_admin',
    label: 'Ignorant Admin (SysAdmin)',
    shortBadge: 'ROLE: IGNORANT ADMIN',
    displayName: 'Alex Mercer (Cloud Ops)',
    email: 'sysadmin@vitatrack-cloud.io',
    phone: '+1 415 890 4410',
    vitalId: 'ADM-OPS-0001',
    vuid: 'vuid:tide:0x00a1f773c91044e8b11099d2',
    did: 'did:tide:zk:0x00a1...b11099d2',
    realmRoles: ['tide-realm-admin', 'infra_operator'],
    baseClientRoles: ['system:health', 'audit:logs_metadata'],
    description:
      'TideCloak "Ignorant Admin": Manages servers and uptime, but holds ZERO _tide_<tag>.decrypt roles. All patient health data remains opaque ciphertext.',
  },
};

/**
 * Official System Prompt for the Upgraded AI Health Assistant
 */
export const AI_HEALTH_ASSISTANT_SYSTEM_PROMPT = `You are Asclepios AI, a Zero-Trust Clinical Pharmacist & Personal Health Physician inside VitaTrack Health.
All patient queries and prescription contexts arrive via TideCloak Zero-Knowledge Proofs (PII stripped at the client edge).

CORE RESPONSIBILITIES:
1. PERSISTENT STATE & CONTEXTUAL MEMORY:
   - Always ground every response in the user's actively confirmed prescription list (brand_name, active_ingredient, dosage, frequency_per_day, timing_slots, scheduled_times, meal_relation, notes) and their active medication reminder schedule.
   - When asked "What should I take tonight?", filter the active medication list for EVENING (19:00) and BEDTIME (21:30) slots and provide exact administration steps.
   - When asked "How do I take my blood pressure pills?", identify antihypertensive medications (e.g., Amlor 5mg / Amlodipine Besylate), specify the scheduled time (08:00), meal relation (AFTER_MEAL), water volume (200-250ml), and dietary cautions (avoid grapefruit juice due to CYP3A4 inhibition).
2. ACTIONABLE REMINDER & ADMINISTRATION GUIDANCE:
   - When asked to set or sync reminders (e.g., "Set reminders for my 3 daily doses"), confirm the exact alarm slots (08:00, 19:00, 21:30) and trigger schedule synchronization.
   - Explicitly state how to take each medication: water volume (full 200-250ml glass of water), food timing (BEFORE_MEAL, WITH_MEAL, AFTER_MEAL, BEFORE_BEDTIME), and food/beverage interactions to avoid.
3. CLINICAL TONE & LANGUAGE:
   - Always respond in 100% natural, professional English with empathetic clinical clarity.`;

/**
 * Generates a deterministic cryptographic hex digest for inspection
 */
export function generateHexHash(seedString, length = 32) {
  let h1 = 0xdeadbeef ^ seedString.length;
  let h2 = 0x41c6ce57 ^ seedString.length;
  for (let i = 0; i < seedString.length; i++) {
    const ch = seedString.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined =
    (h1 >>> 0).toString(16).padStart(8, '0') +
    (h2 >>> 0).toString(16).padStart(8, '0') +
    ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0') +
    ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
  return '0x' + combined.slice(0, length);
}

/**
 * Creates a simulated TideCloak authenticated session & decoded JWT / Doken
 */
export function createTideCloakSession(roleKey = 'patient', emergentAuthorityGranted = false) {
  const persona = TIDECLOAK_ROLES_CATALOG[roleKey] || TIDECLOAK_ROLES_CATALOG.patient;
  const activeClientRoles = [
    ...persona.baseClientRoles,
    ...(roleKey === 'clinician' && emergentAuthorityGranted
      ? persona.emergentClientRoles || []
      : []),
  ];

  const nowSec = Math.floor(Date.now() / 1000);
  const decodedToken = {
    iss: `https://auth.vitatrack.tidecloak.org/realms/${TIDECLOAK_REALM}`,
    sub: persona.vuid,
    vuid: persona.vuid,
    azp: TIDECLOAK_CLIENT_ID,
    iat: nowSec,
    exp: nowSec + 900,
    tide_ork_quorum: '5-of-7 Threshold Nodes Verified',
    emergent_authority_active: roleKey === 'patient' ? true : emergentAuthorityGranted,
    realm_access: {
      roles: persona.realmRoles,
    },
    resource_access: {
      [TIDECLOAK_CLIENT_ID]: {
        roles: activeClientRoles,
      },
    },
  };

  return {
    authenticated: true,
    roleKey: persona.key,
    roleLabel: persona.label,
    shortBadge: persona.shortBadge,
    displayName: persona.displayName,
    email: persona.email,
    phone: persona.phone,
    vitalId: persona.vitalId,
    vuid: persona.vuid,
    did: persona.did,
    emergentAuthorityGranted,
    realmRoles: persona.realmRoles,
    clientRoles: activeClientRoles,
    decodedToken,
    dokenSignature: generateHexHash(JSON.stringify(decodedToken), 32),
  };
}

/**
 * Official @tidecloak/js & @tidecloak/react helper: hasRealmRole(roleName)
 * Inspects realm_access.roles in the TideCloak Access Token
 */
export function hasRealmRole(session, roleName) {
  if (!session?.authenticated) return false;
  const roles = session?.decodedToken?.realm_access?.roles || session?.realmRoles || [];
  return roles.includes(roleName);
}

/**
 * Official @tidecloak/js & @tidecloak/react helper: hasClientRole(roleName, clientId)
 * Inspects resource_access[clientId].roles in the TideCloak Access Token
 */
export function hasClientRole(session, roleName, clientId = TIDECLOAK_CLIENT_ID) {
  if (!session?.authenticated) return false;
  const roles =
    session?.decodedToken?.resource_access?.[clientId]?.roles || session?.clientRoles || [];
  return roles.includes(roleName);
}

/**
 * Simulates TideCloak's tag-based client-side encryption:
 * doEncrypt([{ data, tags: ['prescriptions'] }])
 */
export function doEncrypt(session, items = []) {
  return items.map((item) => {
    const tags = item.tags || ['prescriptions'];
    const canEncrypt = tags.every(
      (tag) =>
        hasClientRole(session, `_tide_${tag}.selfencrypt`) ||
        hasClientRole(session, 'rx:scan')
    );
    const serialized = typeof item.data === 'string' ? item.data : JSON.stringify(item.data);
    const cipherHash = generateHexHash(`TIDE_E2EE_${tags.join('_')}_${serialized}`, 32);
    return {
      tags,
      authorized: canEncrypt,
      encrypted: `TIDE_CIPHER[${tags.join(',')}]:${cipherHash}`,
      algorithm: ENCRYPTION_ALGO,
    };
  });
}

/**
 * Simulates TideCloak's tag-based client-side decryption:
 * doDecrypt([{ encrypted, plaintextFallback, tags: ['allergies'] }])
 * Enforces _tide_<tag>.decrypt or _tide_<tag>.selfencrypt in the user's Doken!
 */
export function doDecrypt(session, items = []) {
  return items.map((item) => {
    const tags = item.tags || ['prescriptions'];
    const canDecrypt = tags.every(
      (tag) =>
        hasClientRole(session, `_tide_${tag}.decrypt`) ||
        hasClientRole(session, `_tide_${tag}.selfencrypt`)
    );
    if (!canDecrypt) {
      return {
        tags,
        authorized: false,
        decrypted: `🔒 [TIDECLOAK_ENCRYPTED • Missing _tide_${tags[0]}.decrypt in Doken]`,
        error: `ACCESS_DENIED: Role "${session?.roleKey}" lacks _tide_${tags[0]}.decrypt permission.`,
      };
    }
    return {
      tags,
      authorized: true,
      decrypted: item.plaintextFallback ?? item.encrypted,
      error: null,
    };
  });
}

/**
 * Evaluates a comprehensive Access Check Matrix for the current TideCloak session
 */
export function evaluateAccessChecks(session) {
  return [
    {
      id: 'chk-biometrics',
      resource: 'Biometric Telemetry (Tag: biometrics)',
      requiredCheck: 'hasClientRole("_tide_biometrics.decrypt")',
      allowed:
        hasClientRole(session, '_tide_biometrics.decrypt') ||
        hasClientRole(session, '_tide_biometrics.selfencrypt'),
    },
    {
      id: 'chk-rx-decrypt',
      resource: 'Prescription Vault (Tag: prescriptions)',
      requiredCheck: 'hasClientRole("_tide_prescriptions.decrypt")',
      allowed:
        hasClientRole(session, '_tide_prescriptions.decrypt') ||
        hasClientRole(session, '_tide_prescriptions.selfencrypt'),
    },
    {
      id: 'chk-rx-scan',
      resource: 'Edge OCR Scanner & Parser',
      requiredCheck: 'hasClientRole("rx:scan")',
      allowed: hasClientRole(session, 'rx:scan'),
    },
    {
      id: 'chk-allergies',
      resource: 'Sensitive Allergies & CYP3A4 (Tag: allergies)',
      requiredCheck: 'hasClientRole("_tide_allergies.decrypt")',
      allowed:
        hasClientRole(session, '_tide_allergies.decrypt') ||
        hasClientRole(session, '_tide_allergies.selfencrypt'),
    },
    {
      id: 'chk-diagnoses',
      resource: 'Protected ICD-10 Diagnoses (Tag: diagnoses)',
      requiredCheck: 'hasClientRole("_tide_diagnoses.decrypt")',
      allowed:
        hasClientRole(session, '_tide_diagnoses.decrypt') ||
        hasClientRole(session, '_tide_diagnoses.selfencrypt'),
    },
    {
      id: 'chk-ai-consult',
      resource: 'Zero-Knowledge AI Physician',
      requiredCheck: 'hasClientRole("ai:consult")',
      allowed: hasClientRole(session, 'ai:consult'),
    },
    {
      id: 'chk-authority-grant',
      resource: 'Delegate Emergent Authority Quorum',
      requiredCheck: 'hasRealmRole("patient") && hasClientRole("authority:grant")',
      allowed: hasRealmRole(session, 'patient') && hasClientRole(session, 'authority:grant'),
    },
  ];
}

/**
 * Returns TideCloak Realm & DID Status
 */
export function getTideCloakStatus(session) {
  return {
    status: 'ZERO_KNOWLEDGE_PROOF_VERIFIED',
    realm: TIDECLOAK_REALM,
    clientId: TIDECLOAK_CLIENT_ID,
    vuid: session?.vuid || 'vuid:tide:0x9f8c74a1e204b8d03e1b44a0',
    did: session?.did || 'did:tide:zk:0x9f8c...3e1b44a0',
    algorithm: ENCRYPTION_ALGO,
    zkProtocol: ZKP_PROTOCOL,
  };
}

/**
 * Synthetic Medical & Biometric Dataset (Client-Side Sovereign Vault - 100% English)
 */
export const SYNTHETIC_PATIENT_VAULT = {
  patientProfile: {
    rawIdentity: 'Michelle Nguyen (PT-894021-US)',
    zkSubjectDid: 'did:tide:zk:0x9f8c...3e1b44a0',
    ageGroupClaim: 'AGE_BRACKET_25_35_VERIFIED',
    chronicConditions: [
      'Stage 1 Hypertension (ICD-10: I10)',
      'Prediabetes / Glycemic Regulation (R73.03)',
      'Hyperlipidemia (E78.5)',
    ],
    allergies: ['Penicillin', 'Grapefruit Juice (CYP3A4 Inhibitor)'],
  },
  biometrics: {
    asclepiosScore: 88,
    heartRate: {
      value: 70,
      unit: 'bpm',
      status: 'Normal',
      sparkline: [68, 71, 69, 74, 70, 68, 70],
    },
    bloodPressure: {
      systolic: 120,
      diastolic: 78,
      unit: 'mmHg',
      status: 'Optimal',
      sparkline: [122, 119, 121, 118, 120, 120],
    },
    calories: {
      burned: 2000,
      target: 2200,
      unit: 'kcal',
      progress: 90,
    },
    sleep: {
      totalHours: 8.2,
      remHours: 2.4,
      deepHours: 3.1,
      irregularities: 126,
      status: 'Deep Rest',
    },
  },
  presetPrescriptions: {
    standardCardioRx: {
      id: 'RX-2026-CARDIO-01',
      title: 'Prescription Record • Cardiology & Metabolic Clinic',
      confidence: '99.2% Confidence',
      rawOcrText:
        'Patient Name: [REDACTED_BY_TIDECLOAK_EDGE]\n1. Amlor 5mg (Amlodipine Besylate) — 1 tab x 1 time/day Morning after breakfast\n2. Glucophage 500mg (Metformin HCl) — 1 tab x 1 time/day Evening with dinner\n3. Lipitor 10mg (Atorvastatin Calcium) — 1 tab x 1 time/day Before bedtime (21:30)',
      medications: [
        {
          id: 'med-1',
          brand_name: 'Amlor',
          display_name: 'Amlor 5mg',
          active_ingredient: 'Amlodipine Besylate',
          name: 'Amlor (Amlodipine Besylate)',
          dosage: '5mg',
          category: 'Antihypertensive (Calcium Channel Blocker)',
          frequency_per_day: 1,
          timing_slots: ['MORNING'],
          scheduled_times: ['08:00'],
          time: '08:00',
          period: '1X/DAY • MORNING',
          meal_relation: 'AFTER_MEAL',
          instruction: 'Take 1 tablet after breakfast with 250ml of water',
          notes: 'Take 1 tablet after breakfast with 250ml of water. Avoid grapefruit juice.',
          duration: '30 days',
        },
        {
          id: 'med-2',
          brand_name: 'Glucophage',
          display_name: 'Glucophage 500mg',
          active_ingredient: 'Metformin HCl',
          name: 'Glucophage (Metformin HCl)',
          dosage: '500mg',
          category: 'Glycemic Control (Biguanide)',
          frequency_per_day: 1,
          timing_slots: ['EVENING'],
          scheduled_times: ['19:00'],
          time: '19:00',
          period: '1X/DAY • EVENING',
          meal_relation: 'WITH_MEAL',
          instruction: 'Take 1 tablet with dinner to reduce stomach upset',
          notes: 'Take 1 tablet with dinner and a full glass of water.',
          duration: '60 days',
        },
        {
          id: 'med-3',
          brand_name: 'Lipitor',
          display_name: 'Lipitor 10mg',
          active_ingredient: 'Atorvastatin Calcium',
          name: 'Lipitor (Atorvastatin Calcium)',
          dosage: '10mg',
          category: 'Lipid-Lowering (Statin)',
          frequency_per_day: 1,
          timing_slots: ['BEDTIME'],
          scheduled_times: ['21:30'],
          time: '21:30',
          period: '1X/DAY • BEDTIME',
          meal_relation: 'BEFORE_BEDTIME',
          instruction: 'Take before going to sleep',
          notes: 'Take before going to sleep; hepatic cholesterol synthesis peaks overnight.',
          duration: '30 days',
        },
      ],
      interactions: [
        {
          id: 'warn-1',
          severity: 'WARNING',
          badgeText: 'MILD RISK • CYP3A4 FOOD',
          title: 'Drug–Food Interaction Warning',
          summary:
            'Avoid grapefruit and grapefruit juice while taking Amlor (Amlodipine) and Lipitor (Atorvastatin). Grapefruit inhibits intestinal CYP3A4 enzymes, elevating plasma drug concentrations.',
        },
      ],
    },
    criticalConflictRx: {
      id: 'RX-2026-CONFLICT-02',
      title: 'Prescription Record • Multi-Specialty Conflict Alert',
      confidence: '99.5% Confidence',
      rawOcrText:
        'Patient Name: [REDACTED_BY_TIDECLOAK_EDGE]\n1. Coumadin 5mg (Warfarin Sodium) — 1 tab Evening (19:00) after meal\n2. Advil 400mg (Ibuprofen) — 1 tab x 2 times/day (08:00 & 19:00) after meals\n3. Lipitor 20mg (Atorvastatin Calcium) — 1 tab Before bedtime (21:30)',
      medications: [
        {
          id: 'med-c1',
          brand_name: 'Coumadin',
          display_name: 'Coumadin 5mg',
          active_ingredient: 'Warfarin Sodium',
          name: 'Coumadin (Warfarin Sodium)',
          dosage: '5mg',
          category: 'Oral Anticoagulant',
          frequency_per_day: 1,
          timing_slots: ['EVENING'],
          scheduled_times: ['19:00'],
          time: '19:00',
          period: '1X/DAY • EVENING',
          meal_relation: 'AFTER_MEAL',
          instruction: 'Take 1 tablet at 19:00 after dinner',
          notes: 'Take consistently at 19:00 each evening. Monitor INR and bleeding signs.',
          duration: '30 days',
        },
        {
          id: 'med-c2',
          brand_name: 'Advil',
          display_name: 'Advil 400mg',
          active_ingredient: 'Ibuprofen',
          name: 'Advil (Ibuprofen)',
          dosage: '400mg',
          category: 'NSAID Analgesic / Anti-Inflammatory',
          frequency_per_day: 2,
          timing_slots: ['MORNING', 'EVENING'],
          scheduled_times: ['08:00', '19:00'],
          time: '08:00 • 19:00',
          period: '2X/DAY • MORN/EVE',
          meal_relation: 'AFTER_MEAL',
          instruction: 'Take 1 tablet twice daily immediately after meals',
          notes: 'Take after food with 250ml water. Contraindicated with Warfarin.',
          duration: '7 days',
        },
        {
          id: 'med-c3',
          brand_name: 'Lipitor',
          display_name: 'Lipitor 20mg',
          active_ingredient: 'Atorvastatin Calcium',
          name: 'Lipitor (Atorvastatin Calcium)',
          dosage: '20mg',
          category: 'Lipid-Lowering (Statin)',
          frequency_per_day: 1,
          timing_slots: ['BEDTIME'],
          scheduled_times: ['21:30'],
          time: '21:30',
          period: '1X/DAY • BEDTIME',
          meal_relation: 'BEFORE_BEDTIME',
          instruction: 'Take 1 tablet before going to sleep',
          notes: 'Take before going to sleep with water.',
          duration: '30 days',
        },
      ],
      interactions: [
        {
          id: 'crit-1',
          severity: 'CRITICAL',
          badgeText: 'CRITICAL RISK • HEMORRHAGE',
          title: 'Critical Drug–Drug Interaction: Coumadin (Warfarin) + Advil (Ibuprofen)',
          summary:
            'Combining Warfarin (Coumadin) with an NSAID (Advil/Ibuprofen) inhibits platelet aggregation and erodes gastric mucosa, severely increasing the risk of major gastrointestinal bleeding. Do not take Advil without physician approval.',
        },
        {
          id: 'warn-2',
          severity: 'WARNING',
          badgeText: 'MILD RISK • CYP3A4 FOOD',
          title: 'Drug–Food Interaction Warning',
          summary:
            'Maintain consistent Vitamin K intake (leafy greens) while on Coumadin and avoid grapefruit juice with Lipitor.',
        },
      ],
    },
  },
};

/**
 * Encrypts sensitive patient payload at the client edge and produces a Zero-Knowledge Proof
 * so that the AI model can verify pharmacological rules without seeing raw PII.
 */
export function encryptHealthPayloadAtEdge(payloadType, rawData, session = null) {
  const activeSession = session || createTideCloakSession('patient', false);
  const serialized = JSON.stringify(rawData);
  const timestamp = new Date().toISOString();
  const ciphertextHash = generateHexHash(serialized + timestamp, 32);
  const zkProofHash = generateHexHash('ZKP_' + payloadType + '_' + serialized, 28);
  const keyShareId = generateHexHash(TIDECLOAK_REALM + payloadType, 16);

  const sanitizedForAI = {
    vuid: activeSession.vuid,
    zkSessionDid: activeSession.did,
    activeRealmRoles: activeSession.realmRoles,
    activeClientRoles: activeSession.clientRoles,
    patientIdentity: '[REDACTED_BY_TIDECLOAK_EDGE]',
    hospitalIdentifier: '[ZERO_KNOWLEDGE_ATTESTED]',
    clinicalTokens: Array.isArray(rawData?.medications)
      ? rawData.medications.map((m) => ({
          brand_name: m.brand_name || m.name,
          active_ingredient: m.active_ingredient || m.name,
          dosage: m.dosage,
          frequency_per_day: m.frequency_per_day || 1,
          timing_slots: m.timing_slots || ['MORNING'],
          scheduled_times: m.scheduled_times || [m.time || '08:00'],
          meal_relation: m.meal_relation || 'AFTER_MEAL',
        }))
      : rawData,
  };

  return {
    status: 'ZERO_KNOWLEDGE_PROOF_VERIFIED',
    realm: TIDECLOAK_REALM,
    clientId: TIDECLOAK_CLIENT_ID,
    algorithm: ENCRYPTION_ALGO,
    zkProtocol: ZKP_PROTOCOL,
    timestamp,
    payloadType,
    keyShareId,
    ciphertextPreview: `${ciphertextHash.slice(0, 18)}...${ciphertextHash.slice(-8)}`,
    zkProofSignature: zkProofHash,
    rawPiiExposed: false,
    session: activeSession,
    accessMatrix: evaluateAccessChecks(activeSession),
    sanitizedForAI,
  };
}

/**
 * Context-Aware Zero-Trust AI Health Assistant Pipeline
 * Cross-references active prescriptions, meal relations, water volume, dietary cautions, and reminders.
 */
export function processZeroTrustAiQuery(userQuery, activePrescription, onSyncReminders, session = null) {
  const activeSession = session || createTideCloakSession('patient', false);
  const meds = activePrescription?.medications || [];
  const edgeProof = encryptHealthPayloadAtEdge(
    'AI_CLINICAL_QUERY',
    {
      query: userQuery,
      medications: meds,
    },
    activeSession
  );

  // Enforce TideCloak Access Check: hasClientRole('ai:consult')
  if (!hasClientRole(activeSession, 'ai:consult')) {
    return {
      reply: `🔒 TideCloak Access Control Blocked: Your active role (${activeSession.roleLabel}) lacks the "ai:consult" and "_tide_prescriptions.decrypt" client roles in resource_access["${TIDECLOAK_CLIENT_ID}"].`,
      highlights: [
        {
          title: 'Zero-Knowledge Enclave Rejection (HTTP 403)',
          detail:
            'Under TideCloak’s Ignorant Admin model, infrastructure administrators cannot query the AI Physician against patient prescriptions or decrypt medical tags.',
          type: 'critical',
        },
      ],
      edgeProof,
      triggeredReminderSync: false,
    };
  }

  const q = userQuery.toLowerCase();
  const medSummaryList = meds
    .map((m) => `${m.brand_name || m.name} ${m.dosage} (${m.active_ingredient || 'Active Rx'})`)
    .join(', ');

  let reply = '';
  let highlights = [];
  let triggeredReminderSync = false;

  // 1. "What should I take tonight?" / Evening & Bedtime queries
  if (q.includes('tonight') || q.includes('night') || q.includes('evening') || q.includes('bedtime')) {
    const eveningMeds = meds.filter((m) => {
      const slots = m.timing_slots || [];
      const times = m.scheduled_times || [m.time || ''];
      return (
        slots.includes('EVENING') ||
        slots.includes('BEDTIME') ||
        times.some((t) => t.startsWith('19:') || t.startsWith('20:') || t.startsWith('21:') || t.startsWith('22:'))
      );
    });

    reply = `Based on your active prescription (${activePrescription?.title}), you have ${eveningMeds.length} scheduled medication(s) for tonight:`;
    highlights = eveningMeds.map((m) => ({
      title: `${(m.scheduled_times || [m.time]).join(', ')} • ${m.brand_name || m.name} ${m.dosage} (${m.active_ingredient || ''})`,
      detail: `Meal Rule: ${m.meal_relation || 'AFTER_MEAL'}. ${m.notes || m.instruction}. Swallow with a full 200–250ml glass of plain water.`,
      type: m.meal_relation === 'BEFORE_BEDTIME' ? 'normal' : 'warning',
    }));
  }
  // 2. "How do I take my blood pressure pills?"
  else if (q.includes('blood pressure') || q.includes('hypertension') || q.includes('amlor') || q.includes('amlodipine')) {
    const bpMed =
      meds.find(
        (m) =>
          (m.brand_name || '').toLowerCase().includes('amlor') ||
          (m.active_ingredient || '').toLowerCase().includes('amlodipine') ||
          (m.category || '').toLowerCase().includes('antihypertensive')
      ) || meds[0];

    reply = `Here is the clinical administration protocol for your blood pressure medication (${bpMed?.brand_name || 'Amlor'} ${bpMed?.dosage || '5mg'} — ${bpMed?.active_ingredient || 'Amlodipine Besylate'}):`;
    highlights = [
      {
        title: `Scheduled Time: ${(bpMed?.scheduled_times || ['08:00'])[0]} (${bpMed?.meal_relation || 'AFTER_MEAL'})`,
        detail:
          'Take 1 tablet 15–20 minutes after breakfast with a full 250ml glass of water. Taking it at the same morning hour maintains steady 24-hour arterial vasodilation.',
        type: 'normal',
      },
      {
        title: 'Strict Dietary Interaction: Avoid Grapefruit',
        detail:
          'Do NOT consume grapefruit or grapefruit juice within 24 hours. Furanocoumarins inhibit CYP3A4 metabolism, which can spike Amlodipine blood levels and cause symptomatic hypotension or dizziness.',
        type: 'critical',
      },
    ];
  }
  // 3. "Set reminders for my 3 daily doses" / Reminder queries
  else if (q.includes('reminder') || q.includes('alarm') || q.includes('set ') || q.includes('schedule')) {
    if (typeof onSyncReminders === 'function') {
      onSyncReminders(meds);
      triggeredReminderSync = true;
    }
    reply = `I have synchronized and activated daily smart reminders for all ${meds.length} prescribed medications in your Trends & Schedule tab:`;
    highlights = meds.map((m) => ({
      title: `🔔 ${(m.scheduled_times || [m.time]).join(' & ')} — ${m.brand_name || m.name} ${m.dosage}`,
      detail: `Active Ingredient: ${m.active_ingredient || m.name} • Timing: ${(m.timing_slots || ['DAILY']).join(', ')} (${m.meal_relation || 'AFTER_MEAL'}).`,
      type: 'normal',
    }));
  }
  // 4. "Before or after meals?" / Food timing & water instructions
  else if (q.includes('meal') || q.includes('food') || q.includes('before or after') || q.includes('water') || q.includes('how to take')) {
    reply = `Here is your exact meal-relation and hydration schedule for ${medSummaryList}:`;
    highlights = meds.map((m) => ({
      title: `${m.brand_name || m.name} ${m.dosage} • ${(m.scheduled_times || [m.time]).join(', ')} [${m.meal_relation || 'AFTER_MEAL'}]`,
      detail: `${m.notes || m.instruction}. Always take with 200–250ml of plain water (never with citrus/grapefruit juice or alcohol).`,
      type: 'normal',
    }));
  }
  // 5. "Side effects?" / Missed dose protocol
  else if (q.includes('side effect') || q.includes('adverse') || q.includes('miss')) {
    reply = `Based on your Zero-Knowledge attested regimen (${medSummaryList}), here are the primary side effects to monitor and missed-dose guidelines:`;
    highlights = [
      {
        title: 'Expected Mild Adaptation Effects (Weeks 1–2)',
        detail:
          'Amlor (Amlodipine) may cause mild facial flushing or evening ankle swelling. Glucophage (Metformin) can cause transient mild nausea if not taken with food. Lipitor (Atorvastatin) rarely causes mild muscle ache.',
        type: 'warning',
      },
      {
        title: 'Missed Dose Safety Protocol',
        detail:
          'If you remember within 12 hours of your next scheduled dose, take it with water. If it is less than 12 hours until your next dose, skip the missed dose—NEVER double your dose.',
        type: 'critical',
      },
    ];
  }
  // 6. "Dietary restrictions?" / Drug-Food & Drug-Drug interactions
  else if (q.includes('diet') || q.includes('restrict') || q.includes('avoid') || q.includes('grapefruit') || q.includes('interaction')) {
    reply = `Pharmacological & dietary interaction analysis verified for your active regimen (${medSummaryList}):`;
    highlights = [
      ...(activePrescription?.interactions || []).map((inter) => ({
        title: `${inter.badgeText}: ${inter.title}`,
        detail: inter.summary,
        type: inter.severity === 'CRITICAL' ? 'critical' : 'warning',
      })),
      {
        title: 'Hydration & Sodium Balance',
        detail:
          'Maintain 2.0–2.5L of water intake daily, limit dietary sodium to <2,000mg/day (DASH diet), and avoid alcohol while taking Glucophage (Metformin) and Lipitor (Atorvastatin).',
        type: 'normal',
      },
    ];
  }
  // 7. General fallback grounded in active prescription memory
  else {
    reply = `Your query "${userQuery}" has been analyzed inside the TideCloak Zero-Trust Enclave against your active prescription (${medSummaryList}):`;
    highlights = meds.map((m) => ({
      title: `${m.brand_name || m.name} ${m.dosage} (${m.active_ingredient || ''})`,
      detail: `Schedule: ${(m.scheduled_times || [m.time]).join(', ')} (${(m.timing_slots || []).join(', ')}) • Relation: ${m.meal_relation || 'AFTER_MEAL'}. ${m.notes || m.instruction}`,
      type: 'normal',
    }));
  }

  return {
    reply,
    highlights,
    edgeProof,
    triggeredReminderSync,
  };
}
