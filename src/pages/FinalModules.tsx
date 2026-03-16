import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'
import { callClaude } from '../lib/ai'
import { SAFETY_SYSTEM_PROMPT, HAZARD_CATEGORIES } from '../data/standards'
import { SC as SC_, FI as FI_, FS as FS_, Card as Card_, LD as LD_, Empty as Empty_, fmtMd, DelBtn, PrintButton, ExportCSVButton, printRecords } from '../components/SharedUI'

// Alias to match existing usage (l/v/c props vs label/value/color)
function SC({ l, v, c }: { l: string; v: any; c: string }) { return <SC_ label={l} value={v} color={c} /> }
function FI(props: any) { return <FI_ {...props} /> }
function FS(props: any) { return <FS_ {...props} /> }
function Card(props: any) { return <Card_ {...props} /> }
function LD() { return <LD_ /> }
function Empty({ msg }: { msg: string }) { return <Empty_ msg={msg} /> }

// ═══ CRANE & LIFT PLANS ═══
export function CraneLiftPlans() {
  const { activeProject } = useProject()
  const { data: lifts, add, update, remove, loading } = useData<any>('lift_plans')
  const [showForm, setShowForm] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    const loadW = parseFloat(fd.get('weight') as string) || 0
    const riggingW = parseFloat(fd.get('rigging') as string) || 0
    const rated = parseFloat(fd.get('rated') as string) || 0
    const total = loadW + riggingW
    const util = rated > 0 ? Math.round((total / rated) * 100) : 0
    await add({
      description: fd.get('desc'), crane_type: fd.get('crane'), capacity: fd.get('cap'),
      load_weight: loadW, rigging_weight: riggingW, total_load: total, radius: fd.get('radius'),
      boom: fd.get('boom'), rated_capacity: rated, utilization: util, critical: util >= 75,
      operator: fd.get('operator'), signal_person: fd.get('signal'), rigger: fd.get('rigger'),
      lift_director: fd.get('director'), rigging_config: fd.get('config'), notes: fd.get('notes'),
      status: 'Pending', project_id: activeProject?.id || '',
      created_by: '', created_at: new Date().toISOString()
    })
    setShowForm(false)
  }

  const analyzeAI = async (l: any) => {
    setAnalyzing(true); setAiResult('')
    const prompt = `${SAFETY_SYSTEM_PROMPT}\n\nAnalyze this lift plan:\nLift: ${l.description}\nCrane: ${l.crane_type} — ${l.capacity}\nLoad: ${l.load_weight} lbs | Rigging: ${l.rigging_weight} lbs | Total: ${l.total_load} lbs\nRated Cap: ${l.rated_capacity} lbs | Radius: ${l.radius} ft | Utilization: ${l.utilization}%\nNotes: ${l.notes || 'None'}\n\nProvide: Critical lift determination, risk assessment, pre-lift checklist, ground conditions, weather restrictions, power line proximity (29 CFR 1926.1408), STOP WORK triggers. Use WHAT-WHY-HOW.`
    try { const data = await callClaude([{ role: 'user', content: prompt }], 3000); setAiResult(data.content?.[0]?.text || '') } catch (e: any) { setAiResult('Error: ' + e.message) }
    setAnalyzing(false)
  }

  const printLift = (l: any) => {
    const w = window.open('', '', 'width=900,height=700'); if (!w) return
    w.document.write(`<html><head><title>Lift Plan</title><style>body{font-family:Arial,sans-serif;padding:2rem;font-size:12px}h1{font-size:18px;border-bottom:2px solid ${l.critical?'#ef4444':'#f97316'};padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f5f5f5}.crit{background:#fee;border:2px solid #f00;padding:10px;margin:10px 0;font-weight:bold;color:#c00}.sig{margin-top:25px;display:flex;gap:30px}.sig div{border-top:1px solid #333;padding-top:4px;min-width:130px;font-size:10px}</style></head><body>`)
    if (l.critical) w.document.write(`<div class="crit">⛔ CRITICAL LIFT — PRE-LIFT MEETING & LIFT DIRECTOR REQUIRED</div>`)
    w.document.write(`<h1>LIFT PLAN${l.critical?' — CRITICAL':''}</h1>`)
    w.document.write(`<table><tr><td><b>Description:</b> ${l.description}</td><td><b>Date:</b> ${new Date(l.created_at).toLocaleDateString()}</td></tr><tr><td><b>Crane:</b> ${l.crane_type} — ${l.capacity||''}</td><td><b>Radius:</b> ${l.radius||'—'} ft</td></tr><tr><td><b>Load:</b> ${(l.load_weight||0).toLocaleString()} lbs</td><td><b>Rigging:</b> ${(l.rigging_weight||0).toLocaleString()} lbs</td></tr><tr><td><b>Total:</b> ${(l.total_load||0).toLocaleString()} lbs</td><td><b>Rated Cap:</b> ${(l.rated_capacity||0).toLocaleString()} lbs</td></tr><tr><td><b>Utilization:</b> ${l.utilization}%</td><td><b>Operator:</b> ${l.operator||'—'}</td></tr></table>`)
    w.document.write(`<h2 style="font-size:14px;margin-top:16px">Pre-Lift Checklist</h2><table><tr><td>☐ Ground verified</td><td>☐ Outriggers extended</td></tr><tr><td>☐ Load confirmed</td><td>☐ Rigging inspected</td></tr><tr><td>☐ Swing path clear</td><td>☐ Power lines (20ft min)</td></tr><tr><td>☐ Wind acceptable</td><td>☐ Personnel briefed</td></tr></table>`)
    w.document.write(`<div class="sig"><div>Operator</div><div>Rigger</div><div>Signal Person</div><div>Lift Director</div><div>Safety</div></div>`)
    w.document.write(`<div style="margin-top:20px;font-size:9px;color:#666">FORGED Safety OS — 29 CFR 1926 Subpart CC</div></body></html>`)
    w.document.close(); w.print()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div><h1 className="text-2xl font-extrabold">Crane & Lift Plans</h1><p className="text-sm" style={{ color: 'var(--t3)' }}>29 CFR 1926 Subpart CC — Auto-detects critical lifts at &gt;75% capacity</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>+ New Lift Plan</button></div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <SC l="Total Lifts" v={lifts.length} c="var(--acc)" /><SC l="Critical" v={lifts.filter((l:any) => l.critical).length} c="var(--red)" />
        <SC l="Completed" v={lifts.filter((l:any) => l.status==='Completed').length} c="var(--grn)" /><SC l="Pending" v={lifts.filter((l:any) => l.status==='Pending').length} c="var(--yel)" /></div>

      {showForm && <form onSubmit={handleSave} className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
        <h3 className="font-bold text-sm mb-3">New Lift Plan</h3>
        <div className="grid grid-cols-3 gap-3">
          <FI name="desc" label="Description" required placeholder="Steel beam Level 4" />
          <FS name="crane" label="Crane Type" options={['Crawler Crane','Hydraulic Truck','Tower Crane','Rough Terrain','All-Terrain','Telehandler']} />
          <FI name="cap" label="Model / Capacity" placeholder="LTM 1300 / 300 ton" />
          <FI name="weight" label="Load Weight (lbs)" type="number" /><FI name="rigging" label="Rigging Weight (lbs)" type="number" /><FI name="radius" label="Radius (ft)" type="number" />
          <FI name="boom" label="Boom Length (ft)" type="number" /><FI name="rated" label="Rated Capacity at Radius (lbs)" type="number" /><FI name="operator" label="Operator (NCCCO)" />
          <FI name="signal" label="Signal Person" /><FI name="rigger" label="Rigger" /><FI name="director" label="Lift Director" />
          <div className="col-span-2"><FI name="config" label="Rigging Config" placeholder="4-leg chain, spreader bar, tag lines..." /></div>
          <FI name="notes" label="Conditions" placeholder="Wind, power lines..." /></div>
        <div className="flex gap-2 mt-3"><button type="submit" className="px-5 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Save</button>
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Cancel</button></div></form>}

      {aiResult && <div className="rounded-xl p-5 mb-4 ai-result text-sm leading-relaxed max-h-80 overflow-y-auto" style={{ background: 'var(--bg2)', border: '1px solid var(--blu)', color: 'var(--t2)' }} dangerouslySetInnerHTML={{ __html: fmtMd(aiResult) }} />}

      {loading ? <LD /> : lifts.length === 0 ? <Empty msg="No lift plans." /> : lifts.map((l: any) => (
        <Card key={l.id} borderColor={l.critical ? 'var(--red)' : 'var(--grn)'}>
          <div className="flex justify-between items-center"><div><span className="font-semibold">{l.description}</span>
            {l.critical && <span className="ml-2 sev-crit">CRITICAL LIFT</span>}
            <span className="ml-1 text-xs px-2 py-0.5 rounded" style={{ background: l.status==='Completed'?'rgba(34,197,94,.12)':'rgba(251,191,36,.12)', color: l.status==='Completed'?'var(--grn)':'var(--yel)' }}>{l.status}</span></div>
            <div className="flex gap-1">
              <button onClick={() => analyzeAI(l)} disabled={analyzing} className="px-2 py-1 rounded text-xs" style={{ border: '1px solid var(--blu)', color: 'var(--blu)' }}>{analyzing?'...':'🤖 AI'}</button>
              <button onClick={() => update(l.id, { status: 'Completed' })} className="px-2 py-1 rounded text-xs" style={{ border: '1px solid var(--grn)', color: 'var(--grn)' }}>Complete</button>
              <button onClick={() => printLift(l)} className="px-2 py-1 rounded text-xs" style={{ border: '1px solid var(--blu)', color: 'var(--blu)' }}>Print</button>
              <button onClick={() => remove(l.id)} className="px-2 py-1 rounded text-xs" style={{ border: '1px solid var(--bdr)', color: 'var(--red)' }}>Del</button></div></div>
          <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{l.crane_type} | Load: {(l.load_weight||0).toLocaleString()} lbs | Rated: {(l.rated_capacity||0).toLocaleString()} lbs | Util: <span style={{ color: l.utilization >= 75 ? 'var(--red)' : 'var(--grn)', fontWeight: 700 }}>{l.utilization}%</span></div>
          {l.critical && <div className="text-xs mt-1 p-2 rounded" style={{ background: 'rgba(239,68,68,.1)', color: 'var(--red)', fontWeight: 600 }}>⛔ CRITICAL — Lift director, pre-lift meeting, written plan per 29 CFR 1926.1417</div>}
        </Card>))}
    </div>)
}

// ═══ EMERGENCY ACTION PLAN ═══
export function EmergencyPlan() {
  const { activeProject } = useProject()
  const [eap, setEap] = useState('')
  const [generating, setGenerating] = useState(false)

  const generate = async () => {
    setGenerating(true); setEap('')
    const info = activeProject ? `Project: ${activeProject.name}, Location: ${activeProject.location || ''} ${activeProject.state || ''}, Scopes: ${activeProject.scopes || ''}, Framework: ${activeProject.framework}` : 'Generic construction EAP'
    const prompt = `${SAFETY_SYSTEM_PROMPT}\n\nGenerate a comprehensive Emergency Action Plan per OSHA 29 CFR 1926.35.\n\n${info}\n\nInclude: emergency response by type (medical, fire, collapse, chemical, weather, trench), evacuation, communication plan, rescue equipment, first aid, fire extinguishers, shutdown procedures, after-hours, visitor orientation, drill schedule. Use WHAT-WHY-HOW.`
    try { const data = await callClaude([{ role: 'user', content: prompt }], 4000); setEap(data.content?.[0]?.text || '') } catch (e: any) { setEap('Error: ' + e.message) }
    setGenerating(false)
  }

  const contacts = [
    { icon: '🚑', title: 'Medical', number: '911', color: 'var(--red)' },
    { icon: '🔥', title: 'Fire', number: '911', color: 'var(--red)' },
    { icon: '☠️', title: 'Poison Control', number: '1-800-222-1222', color: 'var(--pur)' },
    { icon: '🏗️', title: 'SSHO', number: activeProject?.ssho || 'Configure', color: 'var(--acc)' },
    { icon: '⚡', title: 'Utility / 811', number: '811', color: 'var(--yel)' },
    { icon: '🌊', title: 'NRC Spills', number: '1-800-424-8802', color: 'var(--blu)' }
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Emergency Action Plan</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--t3)' }}>OSHA 29 CFR 1926.35 — Emergency contacts, evacuation, and AI site-specific EAP</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {contacts.map((c, i) => (
          <div key={i} className="rounded-xl p-4 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <div className="text-2xl">{c.icon}</div>
            <div className="font-semibold text-sm mt-1">{c.title}</div>
            <div className="font-mono text-lg font-bold mt-0.5" style={{ color: c.color }}>{c.number}</div>
          </div>))}
      </div>
      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderLeft: '3px solid var(--red)' }}>
        <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--yel)' }}>🚪 Evacuation Steps</h3>
        <div className="text-sm space-y-1" style={{ color: 'var(--t2)' }}>
          {['Stop all work upon alarm','Secure equipment — shut off machines, cranes','Account for all personnel','Exit nearest safe route — NO elevators','Report to muster point','Foremen conduct headcount','Do NOT re-enter until ALL CLEAR'].map((s, i) => (
            <div key={i} className="flex gap-2"><span className="font-mono font-bold" style={{ color: 'var(--acc)' }}>{i+1}</span><span>{s}</span></div>))}
        </div></div>
      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
        <button onClick={generate} disabled={generating} className="w-full py-3 rounded-lg font-bold text-sm text-white" style={{ background: generating ? 'var(--bg3)' : 'linear-gradient(135deg, #f97316, #fb923c)', opacity: generating ? 0.6 : 1 }}>
          {generating ? 'Generating...' : '🤖 Generate Site-Specific EAP'}</button></div>
      {eap && <div className="rounded-xl p-5 ai-result text-sm leading-relaxed max-h-[600px] overflow-y-auto" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderLeft: '3px solid var(--acc)', color: 'var(--t2)' }} dangerouslySetInnerHTML={{ __html: fmtMd(eap) }} />}
    </div>)
}

// ═══ SUB SCORECARDS ═══
export function SubScorecards() {
  const { data: hazards } = useData<any>('hazards')
  const { data: workers } = useData<any>('workers')
  const companies = [...new Set(workers.map((w: any) => w.company).filter(Boolean))]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Subcontractor Scorecards</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--t3)' }}>Safety scores calculated from hazard data — competitive pressure drives improvement</p>
      {companies.length === 0 ? <Empty msg="Add workers with company names to see scorecards." /> :
        companies.map((co: string) => {
          const coHazards = hazards.filter((h: any) => (h.source || '').includes(co) || (h.project || '').includes(co))
          const closed = coHazards.filter((h: any) => h.status === 'Closed').length
          const score = coHazards.length > 0 ? Math.round((closed / coHazards.length) * 100) : 100
          const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
          const color = score >= 80 ? 'var(--grn)' : score >= 60 ? 'var(--yel)' : 'var(--red)'
          return (
            <Card key={co} borderColor={color}>
              <div className="flex justify-between items-center">
                <div><span className="font-semibold">{co}</span>
                  <span className="ml-2 font-mono text-lg font-extrabold" style={{ color }}>{grade}</span></div>
                <div className="text-right">
                  <div className="font-mono text-xl font-extrabold" style={{ color }}>{score}%</div>
                  <div className="text-xs" style={{ color: 'var(--t3)' }}>{coHazards.length} hazards, {closed} closed</div></div></div>
              <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
                <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} /></div>
            </Card>)})}
    </div>)
}

// ═══ REGULATORY ENGINE ═══
export function RegulatoryEngine() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [aiDetail, setAiDetail] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)

  const standards = [
    { cite: '29 CFR 1926.500-503', org: 'OSHA', title: 'Fall Protection', color: 'var(--blu)', desc: 'Requires fall protection at 6 feet in construction. Covers guardrails, safety nets, personal fall arrest systems, positioning devices, and controlled access zones.', key: ['Protection required at 6 ft (1926.501(b)(1))','Guardrail: 42" top rail, 21" mid-rail (1926.502(b))','Personal fall arrest: 5,000 lb anchorage (1926.502(d))','Safety nets within 30 ft (1926.502(c))','Training required for all exposed workers (1926.503)','Written fall protection plan for leading edge work'] },
    { cite: '29 CFR 1926.550-556', org: 'OSHA', title: 'Cranes & Derricks (Subpart CC)', color: 'var(--blu)', desc: 'Covers crane operations, assembly/disassembly, inspections, operator qualification (NCCCO), signal persons, power line proximity, and critical lift procedures.', key: ['Operator certification required (1926.1427)','Annual crane inspection (1926.1412)','Power line: 20 ft clearance default (1926.1408)','Signal person qualification (1926.1428)','Ground conditions assessment (1926.1402)','Critical lift plan at >75% capacity'] },
    { cite: '29 CFR 1926.650-652', org: 'OSHA', title: 'Excavations (Subpart P)', color: 'var(--blu)', desc: 'Excavation safety — cave-in protection, access/egress, hazardous atmospheres, water accumulation, protective systems (sloping, shoring, shielding).', key: ['Cave-in protection at 5 ft depth (1926.652(a))','Competent person daily inspection (1926.651(k))','Egress within 25 ft of travel (1926.651(c))','Utilities located before digging — call 811','Spoil pile 2 ft from edge minimum','Trench rescue plan required'] },
    { cite: '29 CFR 1926.451-454', org: 'OSHA', title: 'Scaffolding (Subpart L)', color: 'var(--blu)', desc: 'Scaffold construction, capacity, access, fall protection, and competent person inspections. Covers supported scaffolds, suspended scaffolds, and aerial lifts.', key: ['4:1 height-to-base ratio (1926.451(c))','10 ft platform must have guardrails','Competent person inspection before each shift','Planking: scaffold-grade, max 1" gap','Fully decked, no openings >9.5"','Training for erectors and users (1926.454)'] },
    { cite: '29 CFR 1926.1200-1213', org: 'OSHA', title: 'Confined Spaces (Subpart AA)', color: 'var(--blu)', desc: 'Permit-required confined space entry in construction — atmospheric testing, ventilation, entry permits, attendant, rescue, and entrant training.', key: ['Atmospheric testing before entry (O2, LEL, H2S, CO)','Written permit with conditions','Attendant required at all times','Rescue plan — self-rescue, non-entry, entry','Continuous air monitoring during entry','Annual training for all roles'] },
    { cite: '29 CFR 1926.350-354', org: 'OSHA', title: 'Welding & Cutting (Subpart J)', color: 'var(--blu)', desc: 'Gas welding/cutting, arc welding, fire prevention, ventilation requirements, and PPE for welding operations on construction sites.', key: ['Fire watch 30 min after hot work (1926.352(e))','Cylinders stored upright, capped, 20 ft from fuel','Ventilation in confined/enclosed spaces','Eye protection: shade 10+ for arc welding','Flashback arrestors on torch equipment','Hot work permit when leaving designated area'] },
    { cite: '29 CFR 1926.400-449', org: 'OSHA', title: 'Electrical Safety (Subpart K)', color: 'var(--blu)', desc: 'Electrical installations, GFCI, assured grounding, lockout/tagout, clearance distances, and electrical PPE requirements.', key: ['GFCI or assured grounding program (1926.404(b))','Lockout/tagout for energized work','Qualified person for electrical work','Arc flash PPE per NFPA 70E','10 ft clearance from power lines (default)','Temporary wiring inspection monthly'] },
    { cite: '29 CFR 1926.62', org: 'OSHA', title: 'Lead Exposure', color: 'var(--blu)', desc: 'Lead exposure in construction — PEL 50 µg/m³, action level 30 µg/m³, medical surveillance, respiratory protection, hygiene facilities.', key: ['PEL: 50 µg/m³ 8-hr TWA','Action level: 30 µg/m³ — triggers monitoring','Respiratory protection above PEL','Medical surveillance: blood lead levels','Change rooms and showers when above PEL','Written compliance program required'] },
    { cite: '29 CFR 1926.1153', org: 'OSHA', title: 'Respirable Crystalline Silica', color: 'var(--blu)', desc: 'Silica rule for construction — Table 1 controls, PEL 50 µg/m³, exposure assessment, medical surveillance, competent person.', key: ['PEL: 50 µg/m³ 8-hr TWA','Table 1: specified controls by task','Competent person required','Medical exam within 30 days of assignment','Written exposure control plan','Housekeeping: no dry sweeping/compressed air'] },
    { cite: 'EM 385-1-1', org: 'USACE', title: 'Safety & Health Requirements (2024)', color: 'var(--yel)', desc: 'US Army Corps of Engineers safety manual — applies to all USACE contracts. Exceeds OSHA in many areas: AHAs, SSHO requirements, training, and activity-level planning.', key: ['Activity Hazard Analysis (AHA) for each activity','SSHO — 30-hr OSHA + 40-hr EM 385 training','Daily safety meetings documented','Competent person for each hazardous activity','3-phase inspection: prep/initial/follow-up','Crane critical lift plan at 75% capacity'] },
    { cite: 'NFPA 70', org: 'NFPA', title: 'National Electrical Code (2023)', color: 'var(--red)', desc: 'Foundation standard for electrical installations — wiring, grounding, overcurrent protection, hazardous locations. Referenced by OSHA.', key: ['Article 590: Temporary installations','GFCI for all 15A/20A 125V outlets','Grounding electrode system','Arc-fault protection requirements','Hazardous location classifications','Equipment listing and labeling'] },
    { cite: 'NFPA 70E', org: 'NFPA', title: 'Electrical Safety in Workplace (2024)', color: 'var(--red)', desc: 'Arc flash and shock protection — establishes approach boundaries, PPE categories, energized electrical work permits, and risk assessment procedures.', key: ['Arc flash risk assessment before work','PPE Category 1-4 based on incident energy','Limited, restricted, prohibited approach boundaries','Energized electrical work permit required','De-energize as default — verify zero energy','Annual qualified person training'] },
    { cite: 'NFPA 51B', org: 'NFPA', title: 'Fire Prevention During Welding, Cutting & Hot Work', color: 'var(--red)', desc: 'Hot work permits, fire watch requirements, designated areas, and fire prevention measures during welding and cutting operations.', key: ['Written hot work permit system','Fire watch during and 60 min after','35 ft combustible clearance','Fire extinguisher within 20 ft','Designated hot work areas','Fire watch training required'] },
    { cite: 'NFPA 241', org: 'NFPA', title: 'Safeguarding Construction, Alteration & Demolition', color: 'var(--red)', desc: 'Fire protection during construction — temporary fire protection, housekeeping, smoking controls, flammable storage, and site security.', key: ['Fire protection plan for construction phase','Temporary standpipe if >40 ft','Flammable storage per NFPA 30','Daily housekeeping of combustibles','No smoking in hazardous areas','Access for fire department maintained'] },
    { cite: 'NFPA 101', org: 'NFPA', title: 'Life Safety Code', color: 'var(--red)', desc: 'Means of egress, emergency lighting, exit signage, and occupant load calculations for buildings under construction and renovation.', key: ['Two means of egress from every floor','Exit signage illuminated','Emergency lighting on egress paths','Maximum travel distance to exits','Door swing in direction of travel','Assembly occupant load calculations'] },
    { cite: 'NFPA 30', org: 'NFPA', title: 'Flammable & Combustible Liquids Code', color: 'var(--red)', desc: 'Storage, handling, and use of flammable liquids — container limits, cabinet storage, ventilation, and bonding/grounding.', key: ['Class I liquids: max 25 gal outside cabinet','Flammable storage cabinet: 60 gal max','Bonding and grounding for dispensing','Ventilation in storage areas','No ignition sources within 50 ft','Spill containment required'] },
    { cite: 'ANSI Z359', org: 'ANSI', title: 'Fall Protection Code (2020)', color: 'var(--pur)', desc: 'Comprehensive fall protection — system requirements, SRL (self-retracting lifelines), body harnesses, anchorages, rescue, and managed fall protection programs.', key: ['Z359.1: Full body harness requirements','Z359.3: SRL specifications','Z359.4: Safety net systems','Z359.6: Managed fall protection program','Z359.11: Anchor connector requirements','Z359.14: Self-retracting devices'] },
    { cite: 'ANSI A10', org: 'ANSI', title: 'Construction Safety Series', color: 'var(--pur)', desc: 'Series of construction-specific safety standards covering demolition (A10.6), steel erection (A10.13), confined spaces (A10.21), and more.', key: ['A10.6: Demolition operations','A10.8: Scaffolding safety','A10.13: Steel erection safety','A10.21: Confined space safety','A10.32: Personal fall protection','A10.34: Public protection'] },
    { cite: 'ANSI Z87.1', org: 'ANSI', title: 'Eye & Face Protection (2020)', color: 'var(--pur)', desc: 'Performance requirements for safety glasses, goggles, face shields, and welding helmets — impact resistance, optical clarity, and marking.', key: ['Impact rating: Z87+ (high impact)','Side protection required for construction','Welding shade numbers by process','Anti-fog coating recommended','Prescription safety eyewear: Z87-2','Face shield + safety glasses together'] },
    { cite: 'ASTM F2413', org: 'ASTM', title: 'Protective Footwear (2018)', color: 'var(--acc)', desc: 'Safety shoe/boot performance — impact (I/75), compression (C/75), metatarsal guards, electrical hazard (EH), puncture resistance.', key: ['I/75: Impact resistance 75 ft-lbs','C/75: Compression resistance 2500 lbs','Mt: Metatarsal protection','EH: Electrical hazard rated','PR: Puncture resistant sole','SD: Static dissipative'] },
    { cite: 'AWS D1.1', org: 'AWS', title: 'Structural Welding — Steel (2020)', color: 'var(--acc)', desc: 'Structural steel welding code — WPS/PQR, welder qualification, visual inspection, NDT acceptance criteria, and prequalified joints.', key: ['WPS required for all structural welds','Welder qualification per Section 4','Visual inspection: all welds','NDT: UT/RT for complete joint penetration','Preheat per Table 3.3','Acceptance criteria per Section 6'] },
    { cite: 'AWS D1.5', org: 'AWS', title: 'Bridge Welding Code', color: 'var(--acc)', desc: 'Bridge-specific welding requirements — fracture critical members, CVN toughness, enhanced NDE, and fatigue considerations.', key: ['Fracture critical member (FCM) requirements','CVN toughness testing','100% UT/RT on FCM welds','Enhanced WPS qualification','Fatigue category considerations','Inspector certification CWI minimum'] },
    { cite: 'AWS D1.8', org: 'AWS', title: 'Structural Welding — Seismic Supplement', color: 'var(--acc)', desc: 'Seismic welding supplement — demand critical welds, filler metal toughness, protected zones, and special inspection requirements.', key: ['Demand critical welds defined','Filler metal CVN toughness required','Protected zone restrictions','Special inspection required','WPS supplemental testing','Backing bar requirements'] },
    { cite: 'ASNT SNT-TC-1A', org: 'ASNT', title: 'NDT Personnel Qualification (2020)', color: 'var(--blu)', desc: 'NDT technician qualification — Level I, II, III certification, training hours, experience, examination, and written practice requirements.', key: ['Level I: Perform under Level II supervision','Level II: Set up, interpret, report','Level III: Develop procedures, train others','Training hours per method and level','Written practice required by employer','Vision exam: Jaeger J2 near, annual'] },
    { cite: 'ASNT CP-189', org: 'ASNT', title: 'NDT Personnel Qualification (Standard)', color: 'var(--blu)', desc: 'ASNT consensus standard for NDT qualification — more prescriptive than SNT-TC-1A with mandatory training hours and exam requirements.', key: ['Mandatory training hours (vs recommended)','Written, practical, and specific exams','Recertification every 5 years','Method-specific training','Employer written practice still required','Education credit toward experience'] },
    { cite: 'IBC', org: 'ICC', title: 'International Building Code (2024)', color: 'var(--grn)', desc: 'Building construction requirements — structural, fire protection, means of egress, accessibility, and material standards.', key: ['Occupancy classifications','Type I-V construction','Structural design loads','Fire-resistance ratings','Means of egress requirements','Special inspections required'] },
    { cite: 'IFC', org: 'ICC', title: 'International Fire Code (2024)', color: 'var(--grn)', desc: 'Fire prevention, emergency planning, hazmat storage, fire protection systems, and construction site fire safety requirements.', key: ['Chapter 33: Fire safety during construction','Hot work operations','Flammable material storage','Fire protection system maintenance','Emergency evacuation plans','Fire department access'] },
    { cite: 'IMC', org: 'ICC', title: 'International Mechanical Code (2024)', color: 'var(--grn)', desc: 'Mechanical systems — HVAC, exhaust, ventilation, and combustion air requirements in buildings.', key: ['Ventilation requirements','Exhaust system design','Combustion air provisions','Duct construction','Equipment installation','Refrigeration safety'] },
  ]

  const getAIDetail = async (cite: string) => {
    if (aiDetail[cite]) return
    setLoading(cite)
    const prompt = `${SAFETY_SYSTEM_PROMPT}\n\nProvide a detailed reference guide for ${cite}. Include:\n1. Scope and applicability\n2. Key requirements (numbered)\n3. Common violations and penalties\n4. Inspection checklist (10 items)\n5. Related/cross-referenced standards\n6. Recent updates or amendments\n\nBe specific with section numbers. Construction context.`
    try { const data = await callClaude([{ role: 'user', content: prompt }], 3000); setAiDetail(prev => ({ ...prev, [cite]: data.content?.[0]?.text || '' })) } catch (e: any) { setAiDetail(prev => ({ ...prev, [cite]: 'Error: ' + e.message })) }
    setLoading(null)
  }

  const filtered = standards.filter(s => !search || s.cite.toLowerCase().includes(search.toLowerCase()) || s.title.toLowerCase().includes(search.toLowerCase()) || s.org.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Regulatory Engine — Core 58</h1>
      <p className="text-sm mb-2" style={{ color: 'var(--t3)' }}>All 58 US construction safety standards — click any standard to expand details</p>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[{ l: 'OSHA', v: standards.filter(s => s.org === 'OSHA').length, c: 'var(--blu)' },
          { l: 'NFPA', v: standards.filter(s => s.org === 'NFPA').length, c: 'var(--red)' },
          { l: 'ANSI/ASTM', v: standards.filter(s => s.org === 'ANSI' || s.org === 'ASTM').length, c: 'var(--pur)' },
          { l: 'AWS/ASNT/ICC', v: standards.filter(s => ['AWS','ASNT','ICC'].includes(s.org)).length, c: 'var(--acc)' }
        ].map((s, i) => <SC key={i} l={s.l} v={s.v} c={s.c} />)}
      </div>
      <div className="mb-4"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search standards, codes, topics..."
        className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} /></div>
      <div className="text-xs mb-3" style={{ color: 'var(--t3)' }}>Showing {filtered.length} of {standards.length} standards</div>
      {filtered.map((s, i) => {
        const isExpanded = expanded === s.cite
        return (
          <div key={i} className="rounded-xl mb-2 overflow-hidden" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderLeft: `3px solid ${s.color}` }}>
            <div className="p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : s.cite)}>
              <div className="flex justify-between items-center">
                <div><span className="font-semibold" style={{ color: s.color }}>{s.cite}</span><span className="ml-2 font-semibold">{s.title}</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg3)', color: 'var(--t3)' }}>{s.org}</span>
                  <span style={{ color: 'var(--t3)' }}>{isExpanded ? '▼' : '▶'}</span></div></div>
              <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{s.desc}</div>
            </div>
            {isExpanded && (
              <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--bdr)' }}>
                <div className="mt-3 mb-2"><span className="font-bold text-xs uppercase tracking-wider" style={{ color: s.color }}>Key Requirements</span></div>
                <div className="space-y-1">
                  {s.key.map((k, j) => (
                    <div key={j} className="flex gap-2 text-xs" style={{ color: 'var(--t2)' }}>
                      <span style={{ color: s.color }}>•</span><span>{k}</span></div>))}
                </div>
                <button onClick={() => getAIDetail(s.cite)} disabled={loading === s.cite}
                  className="mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ border: `1px solid ${s.color}`, color: s.color, opacity: loading === s.cite ? 0.5 : 1 }}>
                  {loading === s.cite ? 'Loading...' : aiDetail[s.cite] ? 'Refresh AI Detail' : '🤖 Get AI Deep-Dive'}</button>
                {aiDetail[s.cite] && (
                  <div className="mt-3 p-3 rounded-lg ai-result text-xs leading-relaxed max-h-64 overflow-y-auto" style={{ background: 'var(--bg3)', color: 'var(--t2)' }}
                    dangerouslySetInnerHTML={{ __html: fmtMd(aiDetail[s.cite]) }} />)}
              </div>)}
          </div>)})}
    </div>)
}

// ═══ DOCUMENT INTEL ═══
export function DocumentIntel() {
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const analyze = async () => {
    if (!text.trim()) { alert('Paste document text.'); return }
    setAnalyzing(true); setResult('')
    const prompt = `${SAFETY_SYSTEM_PROMPT}\n\nExtract all safety requirements, obligations, standards references, and compliance provisions from this document.\n\nFor each: requirement, regulatory reference, obligation type, responsible party, deadline. Also: OSHA citations, owner requirements above OSHA, training requirements, recordkeeping, inspection requirements.\n\nDOCUMENT:\n${text.substring(0, 8000)}`
    try { const data = await callClaude([{ role: 'user', content: prompt }], 4000); setResult(data.content?.[0]?.text || '') } catch (e: any) { setResult('Error: ' + e.message) }
    setAnalyzing(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Document Intelligence</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--t3)' }}>Paste safety documents — AI extracts requirements, citations, and compliance obligations</p>
      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={8} placeholder="Paste safety plan, spec section, contract language, or any document text here..."
          className="w-full px-3 py-2 rounded-lg text-sm resize-y mb-3" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
        <button onClick={analyze} disabled={analyzing} className="w-full py-3 rounded-lg font-bold text-sm text-white"
          style={{ background: analyzing ? 'var(--bg3)' : 'linear-gradient(135deg, #f97316, #fb923c)', opacity: analyzing ? 0.6 : 1 }}>
          {analyzing ? 'Analyzing document...' : '📁 Analyze Document'}</button></div>
      {result && <div className="rounded-xl p-5 ai-result text-sm leading-relaxed max-h-[600px] overflow-y-auto" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderLeft: '3px solid var(--acc)', color: 'var(--t2)' }} dangerouslySetInnerHTML={{ __html: fmtMd(result) }} />}
    </div>)
}

// ═══ INTELLIGENCE ═══
export function Intelligence() {
  const { data: hazards } = useData<any>('hazards')
  const { data: incidents } = useData<any>('incidents')
  const { data: nearMisses } = useData<any>('near_misses')
  const [analysis, setAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const openH = hazards.filter((h: any) => h.status === 'Open' || h.status === 'In Progress')
  const closedH = hazards.filter((h: any) => h.status === 'Closed')
  const closeRate = hazards.length > 0 ? Math.round(closedH.length / hazards.length * 100) : 100

  const catCounts: Record<string, number> = {}
  hazards.forEach((h: any) => { if (h.category) catCounts[h.category] = (catCounts[h.category] || 0) + 1 })
  const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const sevCounts = { Critical: 0, High: 0, Moderate: 0, Low: 0 } as Record<string, number>
  hazards.forEach((h: any) => { if (h.severity && sevCounts[h.severity] !== undefined) sevCounts[h.severity]++ })

  const runAnalysis = async () => {
    setAnalyzing(true); setAnalysis('')
    const summary = `Hazards: ${hazards.length} total, ${openH.length} open, ${closedH.length} closed (${closeRate}% close rate). Categories: ${topCats.map(([k,v]) => `${k}(${v})`).join(', ')}. Severity: Critical(${sevCounts.Critical}), High(${sevCounts.High}), Moderate(${sevCounts.Moderate}), Low(${sevCounts.Low}). Incidents: ${incidents.length}. Near misses: ${nearMisses.length}.`
    const prompt = `${SAFETY_SYSTEM_PROMPT}\n\nAnalyze this safety data:\n${summary}\n\nIdentify: 1) Top risk patterns 2) Leading indicators from near misses 3) Compliance gaps 4) Focus areas for next 30 days 5) Toolbox talk topics 6) OSHA Focus Four analysis`
    try { const data = await callClaude([{ role: 'user', content: prompt }], 3000); setAnalysis(data.content?.[0]?.text || '') } catch (e: any) { setAnalysis('Error: ' + e.message) }
    setAnalyzing(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Safety Intelligence</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--t3)' }}>Patterns, trends, and AI-driven insights</p>
      <div className="grid grid-cols-5 gap-3 mb-4">
        <SC l="Total Hazards" v={hazards.length} c="var(--acc)" /><SC l="Critical Open" v={openH.filter((h:any)=>h.severity==='Critical').length} c="var(--red)" />
        <SC l="Close Rate" v={`${closeRate}%`} c={closeRate>=80?'var(--grn)':'var(--yel)'} /><SC l="Incidents" v={incidents.length} c="var(--red)" /><SC l="Near Misses" v={nearMisses.length} c="var(--pur)" /></div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl p-5" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
          <h3 className="font-bold text-sm mb-3">Hazard Categories</h3>
          {topCats.length === 0 ? <p className="text-sm" style={{ color: 'var(--t3)' }}>No data yet.</p> :
            topCats.map(([cat, count], i) => (
              <div key={i} className="flex justify-between items-center mb-1.5">
                <span className="text-xs" style={{ color: 'var(--t2)' }}>{cat}</span>
                <div className="flex items-center gap-2"><div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.round(count / hazards.length * 100)}%`, background: 'var(--acc)' }} /></div>
                  <span className="text-xs font-mono" style={{ color: 'var(--t3)' }}>{count}</span></div></div>))}
        </div>
        <div className="rounded-xl p-5" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
          <h3 className="font-bold text-sm mb-3">Severity Distribution</h3>
          {Object.entries(sevCounts).map(([sev, count], i) => {
            const colors: Record<string, string> = { Critical: 'var(--red)', High: 'var(--acc)', Moderate: 'var(--yel)', Low: 'var(--grn)' }
            return (<div key={i} className="flex justify-between items-center mb-2">
              <span className="text-xs" style={{ color: 'var(--t2)' }}>{sev}</span>
              <div className="flex items-center gap-2"><div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
                <div className="h-full rounded-full" style={{ width: `${hazards.length > 0 ? Math.round(count / hazards.length * 100) : 0}%`, background: colors[sev] }} /></div>
                <span className="text-xs font-mono" style={{ color: 'var(--t3)' }}>{count} ({hazards.length > 0 ? Math.round(count / hazards.length * 100) : 0}%)</span></div></div>)})}
        </div>
      </div>

      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
        <button onClick={runAnalysis} disabled={analyzing} className="w-full py-3 rounded-lg font-bold text-sm text-white"
          style={{ background: analyzing ? 'var(--bg3)' : 'linear-gradient(135deg, #f97316, #fb923c)', opacity: analyzing ? 0.6 : 1 }}>
          {analyzing ? 'Analyzing...' : '🧠 Analyze Patterns'}</button></div>
      {analysis && <div className="rounded-xl p-5 ai-result text-sm leading-relaxed max-h-[500px] overflow-y-auto" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderLeft: '3px solid var(--acc)', color: 'var(--t2)' }} dangerouslySetInnerHTML={{ __html: fmtMd(analysis) }} />}
    </div>)
}

// Shared components now imported from SharedUI.tsx
