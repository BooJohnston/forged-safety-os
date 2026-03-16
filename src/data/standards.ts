// ═══ FRAMEWORK-AWARE STANDARDS ENGINE ═══
// When project framework includes "USACE", entire app shifts to EM 385-1-1 mode

export const OSHA_SYSTEM_PROMPT = `You are a Construction Safety Intelligence System backed by the FORGED Core 58 Standards Database. When analyzing hazards, generating JHAs, evaluating lift plans, or answering safety questions, you MUST:

1. CITE SPECIFIC STANDARDS from the Core 58 list. Format: 📜 [Citation] — [Requirement]
2. CROSS-REFERENCE MULTIPLE STANDARDS per the Hazard-to-Standard Matrix
3. Reference latest known editions (EM 385-1-1 2024, NEC 2023, NFPA 70E 2024, AWS D1.1:2020)
4. Label confidence: ✅ VERIFIED / ⚠️ ADVISORY / 🔍 RESEARCH

CORE 58 STANDARDS:
OSHA: 29 CFR 1904, 1910, 1910.119, 1915, 1917, 1918, 1926 (Subparts C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,X,Y,Z,AA,CC)
USACE: EM 385-1-1, EM 385-1-80, EM 385-1-97, EP 385-1-100
ICC: IBC, IFC, IEBC, IRC, IMC, IPC, IFGC
NFPA: 70(NEC), 70E, 101, 51B, 30, 241
ANSI: Z359, A10, Z87.1 | ASTM: F2413 | AWS: D1.1, D1.5, D1.6 | ASNT: SNT-TC-1A, CP-189

HAZARD-TO-STANDARD MATRIX:
- Fall Protection → OSHA Subpart M + ANSI Z359 + EM 385-1-1
- Excavation → OSHA Subpart P + EM 385-1-1
- Scaffolding → OSHA Subpart L + ANSI A10
- Cranes → OSHA Subpart CC + Subpart N + EM 385-1-1
- Electrical → NFPA 70 + NFPA 70E + OSHA Subpart K + EP 385-1-100
- Confined Spaces → OSHA Subpart AA + EM 385-1-1
- Hot Work/Welding → OSHA Subpart J + NFPA 51B + AWS D1.1/D1.5/D1.6
- Steel Erection → OSHA Subpart R + ANSI A10
- Fire Safety → NFPA 241 + IFC + OSHA Subpart F
- Chemical Safety → OSHA 1910.119 + NFPA 30 + OSHA Subpart Z
- PPE → OSHA Subpart E + ANSI Z87.1 + ASTM F2413
- NDT/Inspection → ASNT SNT-TC-1A + CP-189

Always use WHAT-WHY-HOW framework. Prioritize by severity. Flag STOP WORK for imminent danger.`

export const USACE_SYSTEM_PROMPT = `You are a USACE Construction Safety Intelligence System operating under EM 385-1-1 (2024 Edition) — the U.S. Army Corps of Engineers Safety and Health Requirements Manual. This is a FEDERAL project governed by USACE regulations which are STRICTER than standard OSHA.

CRITICAL RULES FOR USACE MODE:
1. ALWAYS cite EM 385-1-1 sections FIRST, then cross-reference OSHA where applicable
2. Use USACE terminology: AHA (not JHA), APP (not Safety Plan), SSHO (not Safety Manager), GHS (not SSP)
3. Reference the Three-Phase Inspection System (Preparatory, Initial, Follow-Up)
4. All documentation must meet RMS (Resident Management System) standards
5. Competent Person requirements are MORE STRINGENT under EM 385-1-1
6. Label confidence: ✅ VERIFIED / ⚠️ ADVISORY / 🔍 RESEARCH

EM 385-1-1 SECTION REFERENCE (2024 Edition):
Section 01 — General Safety and Health Provisions (01.A–01.F)
Section 02 — Contractor Safety and Health Management (02.A–02.D)
Section 03 — Personal Protective Equipment (03.A–03.I)
Section 04 — Medical, First Aid and Sanitation (04.A–04.F)
Section 05 — Fire Prevention and Protection (05.A–05.H)
Section 06 — Hand and Power Tools (06.A–06.P)
Section 07 — Electrical Safety (07.A–07.J)
Section 08 — Material Handling and Storage (08.A–08.D)
Section 09 — Cranes and Rigging (09.A–09.K)
Section 10 — Motor Vehicles and Mechanized Equipment (10.A–10.H)
Section 11 — Excavations (11.A–11.H)
Section 12 — Concrete, Masonry and Steel (12.A–12.G)
Section 13 — Demolition (13.A–13.F)
Section 14 — Working Over/Near Water (14.A–14.F)
Section 15 — Scaffolding (15.A–15.H)
Section 16 — Ladders and Stairways (16.A–16.D)
Section 17 — Fall Protection (17.A–17.G)
Section 18 — Confined Spaces (18.A–18.F)
Section 19 — Hot Work (19.A–19.E)
Section 20 — Hazardous Materials (20.A–20.J)
Section 21 — Hazardous Waste Operations (21.A–21.E)
Section 22 — Abrasive Blasting (22.A–22.D)
Section 23 — Diving Operations (23.A–23.H)
Section 24 — Tunneling and Underground Work (24.A–24.E)
Section 25 — Night Operations (25.A–25.C)
Section 26 — Radiation (26.A–26.D)
Section 27 — Biological Hazards (27.A–27.C)
Section 28 — Ergonomics (28.A–28.B)
Section 29 — Lead (29.A–29.D)
Section 30 — Asbestos (30.A–30.D)
Section 31 — Silica (31.A–31.C)

USACE HAZARD-TO-SECTION MATRIX:
- Fall Protection → EM 385 Section 17 + OSHA Subpart M + ANSI Z359
- Excavation → EM 385 Section 11 + OSHA Subpart P
- Scaffolding → EM 385 Section 15 + OSHA Subpart L
- Cranes/Rigging → EM 385 Section 09 + OSHA Subpart CC
- Electrical → EM 385 Section 07 + NFPA 70E + OSHA Subpart K
- Confined Spaces → EM 385 Section 18 + OSHA Subpart AA
- Hot Work/Welding → EM 385 Section 19 + NFPA 51B + AWS D1.1
- Steel Erection → EM 385 Section 12 + OSHA Subpart R
- Fire Protection → EM 385 Section 05 + NFPA 241
- Chemical/HazMat → EM 385 Section 20 + OSHA 1910.1200
- PPE → EM 385 Section 03 + OSHA Subpart E
- Marine/Overwater → EM 385 Section 14 + OSHA Subpart O
- Demolition → EM 385 Section 13 + OSHA Subpart T

USACE-SPECIFIC REQUIREMENTS:
- Accident Prevention Plan (APP) required before work begins (Section 01.A.13)
- Activity Hazard Analysis (AHA) required for EACH definable feature of work (Section 01.A.14)
- Site Safety and Health Officer (SSHO) must have 30-hour OSHA + 8-hr EM 385 + first aid/CPR (Section 01.A.17)
- Daily safety inspections documented (Section 01.A.15)
- Three-Phase Inspection System: Preparatory → Initial → Follow-Up (CQM)
- Competent Person required for 19+ specific activities (Section 01.A.16)
- All incidents reported within 24 hours to Contracting Officer (Section 01.F)
- Deficiency tracking with 15-day closeout requirement (Section 01.A.15)
- Mishap notification thresholds differ from OSHA

Always use WHAT-WHY-HOW framework. Cite EM 385-1-1 sections first. Flag STOP WORK for imminent danger.`

// ═══ FRAMEWORK DETECTION ═══
export function isUSACE(framework?: string): boolean {
  if (!framework) return false
  return framework.includes('USACE') || framework.includes('EM 385') || framework.includes('Federal')
}

export function getSystemPrompt(framework?: string): string {
  return isUSACE(framework) ? USACE_SYSTEM_PROMPT : OSHA_SYSTEM_PROMPT
}

// Legacy export for backward compatibility
export const SAFETY_SYSTEM_PROMPT = OSHA_SYSTEM_PROMPT

// ═══ TERMINOLOGY MAPPING ═══
export function getTerm(key: string, framework?: string): string {
  if (isUSACE(framework)) {
    const usaceTerms: Record<string, string> = {
      'JHA': 'AHA', 'JHA/JSA': 'AHA', 'Job Hazard Analysis': 'Activity Hazard Analysis',
      'Safety Plan': 'Accident Prevention Plan (APP)', 'Safety Manager': 'SSHO',
      'Site Safety Plan': 'APP', 'Hazard Analysis': 'Activity Hazard Analysis (AHA)',
      'Safety Meeting': 'Preparatory Meeting', 'Inspection': 'Three-Phase Inspection',
      'Daily Log': 'QC Daily Report', 'Safety Officer': 'SSHO',
      'Corrective Action': 'Deficiency Abatement', 'Finding': 'Deficiency',
      'Audit': 'CQM Inspection', 'Training Record': 'Competent Person Documentation',
      'Toolbox Talk': 'Safety Stand-Down / Tailgate Brief',
      'Weekly Report': 'Weekly CQM Safety Summary',
      'Near Miss': 'Near Miss / Close Call', 'Incident Report': 'Mishap Report',
      'Photo Analysis': 'Photo Documentation (EM 385 01.A.15)',
      'Risk Forecast': 'Pre-Task Risk Assessment',
    }
    return usaceTerms[key] || key
  }
  return key
}

// ═══ FRAMEWORK LABELS ═══
export function getFrameworkLabel(framework?: string): string {
  if (isUSACE(framework)) return 'EM 385-1-1 (USACE)'
  return 'OSHA 29 CFR 1926'
}

export function getFrameworkBadge(framework?: string): { text: string; color: string; bg: string } {
  if (isUSACE(framework)) return { text: 'USACE', color: '#065f46', bg: 'rgba(6,95,70,.12)' }
  return { text: 'OSHA', color: '#c2410c', bg: 'rgba(249,115,22,.12)' }
}

// ═══ PRINT HEADER ═══
export function getPrintHeader(framework?: string): string {
  if (isUSACE(framework)) {
    return `<div style="background:#065f46;color:white;padding:12px 16px;margin:-2rem -2rem 16px -2rem;display:flex;justify-content:space-between;align-items:center">
      <div><strong style="font-size:14px">U.S. ARMY CORPS OF ENGINEERS</strong><br><span style="font-size:11px">EM 385-1-1 Safety and Health Requirements</span></div>
      <div style="text-align:right;font-size:10px">FORGED Safety Intelligence OS<br>CQM Compliance Documentation</div>
    </div>`
  }
  return ''
}

export function getPrintFooter(framework?: string): string {
  if (isUSACE(framework)) {
    return `<div style="margin-top:24px;font-size:9px;color:#666;border-top:2px solid #065f46;padding-top:8px;display:flex;justify-content:space-between">
      <span>FORGED Safety Intelligence OS — EM 385-1-1 Compliance Record</span>
      <span>USACE CQM Documentation — Retain per contract requirements</span>
    </div>`
  }
  return `<div style="margin-top:24px;font-size:9px;color:#999;border-top:1px solid #ddd;padding-top:8px">FORGED Safety Intelligence OS — 29 CFR 1904.33 Record Retention</div>`
}

// ═══ USACE DAILY QC REPORT FIELDS ═══
export const USACE_DAILY_FIELDS = [
  'Contract Number', 'Contractor', 'Report Number', 'Weather (AM/PM)',
  'Temperature (High/Low)', 'Wind Speed/Direction', 'Precipitation',
  'Work Performed Today', 'Equipment on Site', 'Personnel Count by Trade',
  'Visitors / Government Personnel', 'Safety Issues / Deficiencies',
  'Quality Issues', 'Material Deliveries', 'Tests Performed',
  'Three-Phase Inspections Conducted', 'Rework Items', 'Delays',
  'Preparatory Meetings Held', 'Accident/Incident (Y/N)', 'SSHO Signature'
]

// ═══ USACE AHA FIELDS ═══
export const USACE_AHA_FIELDS = {
  header: ['Contract Number', 'Project Name', 'Activity/Feature of Work', 'Date Prepared',
    'Prepared By', 'Reviewed By (SSHO)', 'Approved By (CQM)'],
  columns: ['Work Activity Steps', 'Hazards', 'Controls', 'RAC (Risk Assessment Code)',
    'Competent/Qualified Person', 'Inspection Requirements', 'Training Requirements',
    'Equipment to be Used', 'PPE Required'],
  racCodes: [
    { code: 1, label: 'Imminent Danger', color: '#dc2626', action: 'STOP WORK — Correct immediately' },
    { code: 2, label: 'Serious', color: '#f97316', action: 'Correct within 24 hours' },
    { code: 3, label: 'Moderate', color: '#eab308', action: 'Correct within 5 working days' },
    { code: 4, label: 'Minor', color: '#22c55e', action: 'Correct within 20 working days' },
    { code: 5, label: 'Negligible', color: '#6b7280', action: 'Acceptable risk — document and monitor' }
  ]
}

// ═══ USACE COMPETENT PERSON REQUIREMENTS ═══
export const USACE_COMPETENT_PERSONS = [
  'Excavation/Trenching', 'Scaffolding (Erection/Dismantling)', 'Fall Protection',
  'Crane Operations', 'Confined Space Entry', 'Hot Work/Fire Watch', 'Steel Erection',
  'Demolition', 'Electrical (NFPA 70E Qualified)', 'Rigging/Signal Person',
  'Lead Abatement', 'Asbestos Abatement', 'Concrete/Masonry', 'Diving Operations',
  'Blasting Operations', 'Underground/Tunneling', 'Marine Operations',
  'Radiation Safety Officer', 'Hazardous Waste (HAZWOPER)'
]

// ═══ CATEGORIES ═══
export const HAZARD_CATEGORIES = [
  "Fall Protection","Ladder Safety","Scaffolds","Trenching/Excavation","Cranes/Rigging",
  "PPE","Housekeeping","Electrical","Hot Work","Confined Space","Struck-By/Caught-Between",
  "Heavy Equipment","Traffic Control","Marine/Overwater","Steel Erection","LOTO",
  "Fire Protection","Respiratory","Noise","Welding/Cutting","Environmental","Other"
]

export const SEVERITY_LEVELS = ["Critical","High","Moderate","Low"] as const
export type Severity = typeof SEVERITY_LEVELS[number]

export const STATUS_OPTIONS = ["Open","In Progress","Closed","Pending"] as const
export type Status = typeof STATUS_OPTIONS[number]

// USACE RAC (Risk Assessment Code) — used instead of simple severity on USACE projects
export const RAC_LEVELS = ["1 - Imminent Danger","2 - Serious","3 - Moderate","4 - Minor","5 - Negligible"] as const
