import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'
import { callClaude } from '../lib/ai'
import { getSystemPrompt, isUSACE, getTerm, getPrintHeader, getPrintFooter } from '../data/standards'
import { SC, Card, LD, AIResult, AnalyzeButton, PrintButton, fmtMd } from '../components/SharedUI'

type AuditItem = { category: string; check: string; status: 'PASS' | 'FAIL' | 'WARNING' | 'N/A'; citation: string; detail: string; penalty?: string }

export function OSHAAudit() {
  const { user } = useAuth()
  const { activeProject } = useProject()
  const { data: hazards } = useData<any>('hazards')
  const { data: incidents } = useData<any>('incidents')
  const { data: nearMisses } = useData<any>('near_misses')
  const { data: dailyLogs } = useData<any>('daily_logs')
  const { data: permits } = useData<any>('permits')
  const { data: training } = useData<any>('training')
  const { data: inspections } = useData<any>('inspections')
  const { data: jhas } = useData<any>('jhas')
  const { data: orientations } = useData<any>('orientations')
  const { data: audits } = useData<any>('audits')
  const { data: sds } = useData<any>('sds')
  const [running, setRunning] = useState(false)
  const [auditItems, setAuditItems] = useState<AuditItem[]>([])
  const [aiDeepDive, setAiDeepDive] = useState('')
  const [aiRunning, setAiRunning] = useState(false)
  const [score, setScore] = useState(0)

  const now = new Date()
  const openHazards = hazards.filter((h: any) => h.status === 'Open' || h.status === 'In Progress')
  const criticalHazards = openHazards.filter((h: any) => h.severity === 'Critical')
  const overdueHazards = openHazards.filter((h: any) => h.due_date && new Date(h.due_date) < now)
  const expiredPermits = permits.filter((p: any) => p.expires && new Date(p.expires) < now && p.status !== 'Closed')
  const expiredTraining = training.filter((t: any) => t.expires && new Date(t.expires) < now)
  const recentLogs = dailyLogs.filter((l: any) => now.getTime() - new Date(l.created_at).getTime() < 7 * 86400000)
  const recentInspections = inspections.filter((i: any) => now.getTime() - new Date(i.created_at).getTime() < 7 * 86400000)
  const overdueAudits = audits.filter((a: any) => a.due_date && new Date(a.due_date) < now && a.status !== 'Closed')
  const approvedJHAs = jhas.filter((j: any) => j.status === 'Approved')

  const runAudit = () => {
    setRunning(true)
    const items: AuditItem[] = []

    // ═══ 1. RECORDKEEPING (29 CFR 1904) ═══
    items.push({
      category: 'Recordkeeping', check: 'Daily safety logs current (last 5 business days)',
      status: recentLogs.length >= 3 ? 'PASS' : recentLogs.length >= 1 ? 'WARNING' : 'FAIL',
      citation: '29 CFR 1904.33', detail: `${recentLogs.length} logs in last 7 days.${recentLogs.length < 3 ? ' OSHA expects contemporaneous documentation.' : ''}`,
      penalty: recentLogs.length === 0 ? '$16,131 per instance' : undefined
    })

    items.push({
      category: 'Recordkeeping', check: 'Incident reports documented with root cause',
      status: incidents.length === 0 ? 'PASS' : incidents.every((i: any) => i.root_cause && i.root_cause.trim()) ? 'PASS' : 'FAIL',
      citation: '29 CFR 1904.7', detail: incidents.length === 0 ? 'No incidents to document.' : `${incidents.filter((i: any) => !i.root_cause || !i.root_cause.trim()).length} incidents missing root cause analysis.`,
      penalty: '$16,131 per missing investigation'
    })

    items.push({
      category: 'Recordkeeping', check: 'Near miss reporting system active',
      status: nearMisses.length > 0 ? 'PASS' : 'WARNING',
      citation: 'OSHA VPP / Best Practice', detail: `${nearMisses.length} near misses documented. ${nearMisses.length === 0 ? 'Leading indicator tracking recommended.' : 'Good leading indicator culture.'}`
    })

    // ═══ 2. HAZARD MANAGEMENT ═══
    items.push({
      category: 'Hazard Management', check: 'No critical hazards open past due date',
      status: criticalHazards.length === 0 ? 'PASS' : overdueHazards.filter((h: any) => h.severity === 'Critical').length > 0 ? 'FAIL' : 'WARNING',
      citation: '29 CFR 1903.1 / General Duty 5(a)(1)', detail: `${criticalHazards.length} critical hazards open.${overdueHazards.length > 0 ? ` ${overdueHazards.length} overdue.` : ''}`,
      penalty: criticalHazards.length > 0 ? 'Up to $161,323 per willful violation' : undefined
    })

    items.push({
      category: 'Hazard Management', check: 'Hazard abatement within reasonable timeline',
      status: overdueHazards.length === 0 ? 'PASS' : overdueHazards.length <= 3 ? 'WARNING' : 'FAIL',
      citation: '29 CFR 1903.19', detail: `${overdueHazards.length} hazards past due date. ${openHazards.length} total open.`
    })

    items.push({
      category: 'Hazard Management', check: 'Hazards have corrective actions documented',
      status: openHazards.every((h: any) => h.corrective_action && h.corrective_action.trim()) ? 'PASS' : 'FAIL',
      citation: '29 CFR 1903.19(c)', detail: `${openHazards.filter((h: any) => !h.corrective_action || !h.corrective_action.trim()).length} open hazards missing corrective actions.`
    })

    // ═══ 3. PERMITS ═══
    items.push({
      category: 'Permits', check: 'No expired permits for active work',
      status: expiredPermits.length === 0 ? 'PASS' : 'FAIL',
      citation: '29 CFR 1926.352 / 1910.146', detail: `${expiredPermits.length} expired permits still open.${expiredPermits.length > 0 ? ' Types: ' + expiredPermits.map((p: any) => p.type).join(', ') : ''}`,
      penalty: '$16,131 per expired permit'
    })

    items.push({
      category: 'Permits', check: 'Competent persons designated on permits',
      status: permits.filter((p: any) => p.status === 'Active').every((p: any) => p.competent && p.competent.trim()) ? 'PASS' : permits.filter((p: any) => p.status === 'Active').length === 0 ? 'N/A' : 'FAIL',
      citation: '29 CFR 1926.32(f)', detail: 'Each permit must identify the competent person by name.'
    })

    // ═══ 4. TRAINING ═══
    items.push({
      category: 'Training', check: 'All worker certifications current',
      status: expiredTraining.length === 0 ? 'PASS' : 'FAIL',
      citation: '29 CFR 1926.21(b)(2)', detail: `${expiredTraining.length} expired certifications.${expiredTraining.length > 0 ? ' Workers: ' + expiredTraining.slice(0, 5).map((t: any) => `${t.worker_name} (${t.cert_type})`).join(', ') : ''}`,
      penalty: '$16,131 per untrained worker'
    })

    items.push({
      category: 'Training', check: 'Site orientations documented for all workers',
      status: orientations.length > 0 ? 'PASS' : 'WARNING',
      citation: '29 CFR 1926.21(b)(2)', detail: `${orientations.length} workers oriented. ${orientations.filter((o: any) => !o.osha10).length} missing OSHA 10-Hour.`
    })

    // ═══ 5. JHA / TASK PLANNING ═══
    items.push({
      category: 'Task Planning', check: 'JHAs/JSAs completed for active scopes',
      status: approvedJHAs.length > 0 ? 'PASS' : jhas.length > 0 ? 'WARNING' : 'FAIL',
      citation: '29 CFR 1926.21 / EM 385-1-1', detail: `${jhas.length} total JHAs, ${approvedJHAs.length} approved.${jhas.length === 0 ? ' No JHAs on file — major compliance gap.' : ''}`
    })

    // ═══ 6. INSPECTIONS ═══
    items.push({
      category: 'Inspections', check: 'Weekly safety inspections conducted',
      status: recentInspections.length > 0 ? 'PASS' : 'FAIL',
      citation: '29 CFR 1926.20(b)(2)', detail: `${recentInspections.length} inspections in last 7 days.${recentInspections.length === 0 ? ' Frequent inspections are required by OSHA.' : ''}`,
      penalty: '$16,131'
    })

    items.push({
      category: 'Inspections', check: 'Audit findings tracked to closure',
      status: overdueAudits.length === 0 ? 'PASS' : 'FAIL',
      citation: '29 CFR 1903.19', detail: `${overdueAudits.length} overdue audit findings.`
    })

    // ═══ 7. HAZCOM ═══
    items.push({
      category: 'HazCom', check: 'SDS sheets on file for jobsite chemicals',
      status: sds.length > 0 ? 'PASS' : 'WARNING',
      citation: '29 CFR 1910.1200(g)', detail: `${sds.length} chemicals registered.${sds.length === 0 ? ' SDS binder must be accessible to all workers.' : ''}`,
      penalty: '$16,131 per missing SDS'
    })

    // ═══ 8. PROJECT SETUP ═══
    items.push({
      category: 'Project Admin', check: 'Emergency action plan documented',
      status: 'WARNING',
      citation: isUSACE(activeProject?.framework) ? 'EM 385-1-1 Section 01.A.13' : '29 CFR 1926.35',
      detail: 'Verify EAP is posted and all workers know evacuation routes.'
    })

    items.push({
      category: 'Project Admin', check: isUSACE(activeProject?.framework) ? 'SSHO designated with required qualifications' : 'Competent person(s) designated for all scopes',
      status: activeProject?.ssho ? 'PASS' : 'FAIL',
      citation: isUSACE(activeProject?.framework) ? 'EM 385-1-1 Section 01.A.17' : '29 CFR 1926.32(f)',
      detail: activeProject?.ssho ? `SSHO: ${activeProject.ssho}` : 'No SSHO/Safety Contact designated on project.',
      penalty: isUSACE(activeProject?.framework) ? 'Contract non-compliance — potential stop work order' : undefined
    })

    // ═══ 9. USACE-SPECIFIC CHECKS (only when framework includes USACE) ═══
    if (isUSACE(activeProject?.framework)) {
      items.push({
        category: 'USACE/APP', check: 'Accident Prevention Plan (APP) on file',
        status: 'WARNING',
        citation: 'EM 385-1-1 Section 01.A.13', detail: 'APP must be accepted by Contracting Officer before work begins. Verify APP is current and site-specific.',
        penalty: 'Stop work order until APP accepted'
      })

      items.push({
        category: 'USACE/AHA', check: 'Activity Hazard Analyses (AHAs) for all definable features of work',
        status: approvedJHAs.length > 0 ? 'PASS' : 'FAIL',
        citation: 'EM 385-1-1 Section 01.A.14', detail: `${jhas.length} AHAs on file, ${approvedJHAs.length} approved. Each definable feature of work requires a signed AHA before work begins.`,
        penalty: 'Stop work on activities without approved AHA'
      })

      items.push({
        category: 'USACE/SSHO', check: 'SSHO has OSHA 30-hr + EM 385 8-hr + First Aid/CPR',
        status: 'WARNING',
        citation: 'EM 385-1-1 Section 01.A.17', detail: 'SSHO must have: (1) OSHA 30-hour, (2) 8-hour EM 385-1-1 course, (3) Current First Aid/CPR. Verify documentation on file.'
      })

      items.push({
        category: 'USACE/CQM', check: 'Three-Phase Inspection System active',
        status: recentInspections.length >= 3 ? 'PASS' : recentInspections.length > 0 ? 'WARNING' : 'FAIL',
        citation: 'EM 385-1-1 / CQM Requirements', detail: `Preparatory → Initial → Follow-Up inspections required for each definable feature. ${recentInspections.length} inspections this week.`
      })

      items.push({
        category: 'USACE/Deficiency', check: 'Deficiencies tracked with 15-day closeout',
        status: overdueHazards.length === 0 ? 'PASS' : 'FAIL',
        citation: 'EM 385-1-1 Section 01.A.15', detail: `${overdueHazards.length} overdue deficiencies. EM 385 requires closeout within 15 working days. Imminent danger deficiencies require immediate correction.`,
        penalty: 'Contract non-compliance — potential stop work'
      })

      items.push({
        category: 'USACE/Daily', check: 'QC Daily Reports submitted (not just safety logs)',
        status: recentLogs.length >= 5 ? 'PASS' : recentLogs.length >= 3 ? 'WARNING' : 'FAIL',
        citation: 'EM 385-1-1 / CQM', detail: `${recentLogs.length} daily reports this week. USACE requires daily QC reports that include safety, quality, weather, manpower, equipment, materials, and test data.`
      })

      items.push({
        category: 'USACE/Mishap', check: 'Mishap notification procedures established',
        status: incidents.length === 0 ? 'PASS' : incidents.every((i: any) => i.root_cause && i.corrective_action) ? 'PASS' : 'WARNING',
        citation: 'EM 385-1-1 Section 01.F', detail: 'All mishaps must be reported to Contracting Officer within 24 hours. Class A/B mishaps require immediate notification. Root cause analysis required for all recordable incidents.'
      })

      items.push({
        category: 'USACE/Competent', check: 'Competent Persons designated for all active scopes',
        status: 'WARNING',
        citation: 'EM 385-1-1 Section 01.A.16', detail: 'EM 385 requires designated Competent Persons for 19+ specific activities including excavation, scaffolding, cranes, confined space, fall protection, electrical, and demolition. Verify all are documented in APP.'
      })
    }

    // Calculate score
    const total = items.filter(i => i.status !== 'N/A').length
    const passed = items.filter(i => i.status === 'PASS').length
    const warnings = items.filter(i => i.status === 'WARNING').length
    const pct = total > 0 ? Math.round(((passed + warnings * 0.5) / total) * 100) : 0

    setAuditItems(items)
    setScore(pct)
    setRunning(false)
  }

  const runDeepDive = async () => {
    if (!auditItems.length) return
    setAiRunning(true); setAiDeepDive('')

    const fails = auditItems.filter(i => i.status === 'FAIL')
    const warnings = auditItems.filter(i => i.status === 'WARNING')

    const sysPrompt = getSystemPrompt(activeProject?.framework)
    const auditType = isUSACE(activeProject?.framework) ? 'USACE EM 385-1-1 COMPLIANCE INSPECTION' : 'OSHA MOCK INSPECTION'
    const usaceExtra = isUSACE(activeProject?.framework) ? `\n8. APP COMPLIANCE STATUS — Is the Accident Prevention Plan current and adequate?\n9. AHA COVERAGE — Are all definable features of work covered?\n10. THREE-PHASE INSPECTION GAPS — What preparatory/initial/follow-up inspections are missing?\n11. CONTRACTING OFFICER CONCERNS — What would a COR flag during a site visit?` : ''

    const prompt = `${sysPrompt}\n\n${auditType} DEEP DIVE\n\nProject: ${activeProject?.name || 'General'} — ${activeProject?.city || ''}, ${activeProject?.state || ''}\nFramework: ${activeProject?.framework || 'OSHA'}\nScopes: ${activeProject?.scopes || 'General'}\n\nAUDIT SCORE: ${score}%\n\nFAILURES (${fails.length}):\n${fails.map(f => `- [${f.category}] ${f.check} — ${f.citation} — ${f.detail}${f.penalty ? ' | Penalty: ' + f.penalty : ''}`).join('\n')}\n\nWARNINGS (${warnings.length}):\n${warnings.map(w => `- [${w.category}] ${w.check} — ${w.citation} — ${w.detail}`).join('\n')}\n\nDATA SUMMARY:\n- Open hazards: ${openHazards.length} (${criticalHazards.length} critical, ${overdueHazards.length} overdue)\n- Incidents: ${incidents.length} total\n- Near misses: ${nearMisses.length}\n- Expired training: ${expiredTraining.length}\n- Expired permits: ${expiredPermits.length}\n- ${isUSACE(activeProject?.framework) ? 'AHAs' : 'JHAs'}: ${jhas.length} (${approvedJHAs.length} approved)\n- Weekly inspections: ${recentInspections.length}\n- Daily logs this week: ${recentLogs.length}\n\nProvide a detailed ${isUSACE(activeProject?.framework) ? 'USACE Contracting Officer / COR' : 'OSHA Compliance Officer'} perspective:\n1. OVERALL ASSESSMENT — What would an inspector conclude?\n2. CITATION PREDICTIONS — Which specific citations would be issued?\n3. ESTIMATED PENALTY EXPOSURE\n4. 48-HOUR FIX LIST — What must be corrected immediately?\n5. 30-DAY IMPROVEMENT PLAN — Prioritized action items\n6. DOCUMENTATION TO PREPARE — What should be ready if ${isUSACE(activeProject?.framework) ? 'the COR visits' : 'OSHA walks in'} tomorrow?\n7. POSITIVE FINDINGS — What's working well?${usaceExtra}`

    try {
      const data = await callClaude([{ role: 'user', content: prompt }], 4000)
      setAiDeepDive(data.content?.[0]?.text || '')
    } catch (e: any) { setAiDeepDive('Error: ' + e.message) }
    setAiRunning(false)
  }

  const printAudit = () => {
    const w = window.open('', '', 'width=1000,height=800')
    if (!w) return
    const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#dc2626'

    w.document.write(`<html><head><title>OSHA Mock Audit</title><style>
      body{font-family:Arial,sans-serif;padding:2rem;font-size:11px;color:#333}
      h1{font-size:18px;border-bottom:3px solid ${scoreColor};padding-bottom:6px}
      .score{display:inline-block;font-size:36px;font-weight:900;color:${scoreColor};margin:8px 0}
      table{width:100%;border-collapse:collapse;margin:12px 0}
      th{background:#f5f5f5;text-align:left;padding:6px;border:1px solid #ddd;font-size:10px}
      td{padding:5px 6px;border:1px solid #ddd;font-size:11px;vertical-align:top}
      .pass{color:#22c55e;font-weight:bold} .fail{color:#dc2626;font-weight:bold} .warn{color:#eab308;font-weight:bold}
      .ai{margin-top:16px;line-height:1.6;border-left:3px solid #f97316;padding-left:12px}
      .sig{margin-top:30px;display:flex;gap:40px} .sig div{border-top:1px solid #333;padding-top:4px;min-width:140px;font-size:10px;margin-top:24px}
      .footer{margin-top:24px;font-size:9px;color:#999;border-top:1px solid #ddd;padding-top:8px}
      @media print{body{padding:0}}
    </style></head><body>`)
    w.document.write(`<h1>🏛️ OSHA Mock Inspection Report</h1>`)
    w.document.write(`<p><b>Project:</b> ${activeProject?.name || 'General'} | <b>Location:</b> ${activeProject?.city || ''}, ${activeProject?.state || ''} | <b>Date:</b> ${new Date().toLocaleString()} | <b>Inspector:</b> AI Safety Auditor</p>`)
    w.document.write(`<div class="score">${score}%</div><span style="margin-left:8px;font-size:14px;color:${scoreColor}">${score >= 80 ? 'SATISFACTORY' : score >= 60 ? 'NEEDS IMPROVEMENT' : 'UNSATISFACTORY'}</span>`)

    w.document.write(`<table><tr><th>Category</th><th>Check</th><th>Status</th><th>Citation</th><th>Detail</th><th>Penalty</th></tr>`)
    auditItems.forEach(item => {
      const cls = item.status === 'PASS' ? 'pass' : item.status === 'FAIL' ? 'fail' : 'warn'
      w.document.write(`<tr><td>${item.category}</td><td>${item.check}</td><td class="${cls}">${item.status}</td><td>${item.citation}</td><td>${item.detail}</td><td>${item.penalty || '—'}</td></tr>`)
    })
    w.document.write(`</table>`)

    if (aiDeepDive) w.document.write(`<h2 style="font-size:14px;margin-top:20px">AI Compliance Analysis</h2><div class="ai">${fmtMd(aiDeepDive)}</div>`)
    w.document.write(`<div class="sig"><div>Safety Manager</div><div>Project Manager</div><div>Superintendent</div></div>`)
    w.document.write(`<div class="footer">FORGED Safety Intelligence OS — OSHA Mock Inspection — For internal use only — Not a substitute for actual OSHA compliance review</div></body></html>`)
    w.document.close(); w.print()
  }

  const fails = auditItems.filter(i => i.status === 'FAIL')
  const warnings = auditItems.filter(i => i.status === 'WARNING')
  const passes = auditItems.filter(i => i.status === 'PASS')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">{isUSACE(activeProject?.framework) ? 'USACE EM 385 Compliance Audit' : 'OSHA Audit Simulator'}</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>{isUSACE(activeProject?.framework) ? 'EM 385-1-1 compliance inspection against live project data — APP, AHA, CQM, deficiency tracking' : 'Mock inspection against your live data — identifies gaps before OSHA does'} — {activeProject?.name || 'All Projects'}</p>
        </div>
        <div className="flex gap-2">
          {auditItems.length > 0 && <PrintButton onClick={printAudit} />}
          <button onClick={runAudit} disabled={running}
            className="px-4 py-2 rounded-lg font-bold text-sm text-white"
            style={{ background: running ? 'var(--bg3)' : isUSACE(activeProject?.framework) ? 'linear-gradient(135deg, #065f46, #059669)' : 'linear-gradient(135deg, #dc2626, #ef4444)', opacity: running ? 0.6 : 1 }}>
            {running ? 'Inspecting...' : isUSACE(activeProject?.framework) ? '🏛️ Run EM 385 Compliance Audit' : '🏛️ Run Mock OSHA Inspection'}
          </button>
        </div>
      </div>

      {/* Pre-audit data summary */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <SC label="Open Hazards" value={openHazards.length} color={openHazards.length > 5 ? 'var(--red)' : 'var(--acc)'} />
        <SC label="Expired Certs" value={expiredTraining.length} color={expiredTraining.length > 0 ? 'var(--red)' : 'var(--grn)'} />
        <SC label="Expired Permits" value={expiredPermits.length} color={expiredPermits.length > 0 ? 'var(--red)' : 'var(--grn)'} />
        <SC label="Weekly Inspections" value={recentInspections.length} color={recentInspections.length > 0 ? 'var(--grn)' : 'var(--red)'} />
        <SC label="JHAs Approved" value={approvedJHAs.length} color={approvedJHAs.length > 0 ? 'var(--grn)' : 'var(--yel)'} />
      </div>

      {/* Audit Results */}
      {auditItems.length > 0 && (
        <>
          {/* Score banner */}
          <div className="rounded-xl p-6 mb-4 text-center" style={{
            background: score >= 80 ? 'rgba(34,197,94,.06)' : score >= 60 ? 'rgba(234,179,8,.06)' : 'rgba(239,68,68,.06)',
            border: `2px solid ${score >= 80 ? 'rgba(34,197,94,.3)' : score >= 60 ? 'rgba(234,179,8,.3)' : 'rgba(239,68,68,.3)'}`
          }}>
            <div className="font-mono text-5xl font-extrabold" style={{ color: score >= 80 ? 'var(--grn)' : score >= 60 ? 'var(--yel)' : 'var(--red)' }}>
              {score}%
            </div>
            <div className="text-sm font-bold mt-1" style={{ color: score >= 80 ? 'var(--grn)' : score >= 60 ? 'var(--yel)' : 'var(--red)' }}>
              {score >= 80 ? '✅ SATISFACTORY — Ready for inspection' : score >= 60 ? '⚠️ NEEDS IMPROVEMENT — Address failures before OSHA visit' : '🔴 UNSATISFACTORY — Significant compliance gaps detected'}
            </div>
            <div className="flex justify-center gap-6 mt-3 text-xs">
              <span style={{ color: 'var(--grn)' }}>✅ {passes.length} Pass</span>
              <span style={{ color: 'var(--yel)' }}>⚠️ {warnings.length} Warning</span>
              <span style={{ color: 'var(--red)' }}>❌ {fails.length} Fail</span>
            </div>
          </div>

          {/* Failures first */}
          {fails.length > 0 && (
            <div className="rounded-xl p-5 mb-4" style={{ background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.2)' }}>
              <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--red)' }}>❌ Failures ({fails.length})</h3>
              {fails.map((item, i) => (
                <div key={i} className="rounded-lg p-3 mb-2" style={{ background: 'var(--bg2)', borderLeft: '3px solid var(--red)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(239,68,68,.12)', color: 'var(--red)' }}>{item.category}</span>
                    <span className="font-semibold text-sm">{item.check}</span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--t2)' }}>
                    <span style={{ color: 'var(--blu)' }}>📜 {item.citation}</span> — {item.detail}
                  </div>
                  {item.penalty && <div className="text-xs mt-1 font-semibold" style={{ color: 'var(--red)' }}>💰 Potential penalty: {item.penalty}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="rounded-xl p-5 mb-4" style={{ background: 'rgba(234,179,8,.04)', border: '1px solid rgba(234,179,8,.2)' }}>
              <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--yel)' }}>⚠️ Warnings ({warnings.length})</h3>
              {warnings.map((item, i) => (
                <div key={i} className="rounded-lg p-3 mb-2" style={{ background: 'var(--bg2)', borderLeft: '3px solid var(--yel)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(234,179,8,.12)', color: 'var(--yel)' }}>{item.category}</span>
                    <span className="font-semibold text-sm">{item.check}</span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--t2)' }}><span style={{ color: 'var(--blu)' }}>📜 {item.citation}</span> — {item.detail}</div>
                </div>
              ))}
            </div>
          )}

          {/* Passes */}
          {passes.length > 0 && (
            <div className="rounded-xl p-5 mb-4" style={{ background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.2)' }}>
              <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--grn)' }}>✅ Passing ({passes.length})</h3>
              {passes.map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 text-sm" style={{ borderBottom: '1px solid var(--bg3)' }}>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(34,197,94,.12)', color: 'var(--grn)' }}>{item.category}</span>
                  <span style={{ color: 'var(--t2)' }}>{item.check}</span>
                  <span className="text-xs" style={{ color: 'var(--blu)' }}>{item.citation}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI Deep Dive */}
          <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <AnalyzeButton onClick={runDeepDive} analyzing={aiRunning} label="🧠 AI Deep Dive — Citation Predictions, Penalties & Fix Plan" />
          </div>
          <AIResult text={aiDeepDive} label="OSHA Compliance Intelligence" color="var(--red)" />
        </>
      )}
    </div>
  )
}

function PrintButton({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: '1px solid var(--bdr)', color: 'var(--t2)' }}>🖨️ Print Audit</button>
}
