import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'
import { callClaude } from '../lib/ai'
import { getSystemPrompt, getTerm, isUSACE, getPrintHeader, getPrintFooter } from '../data/standards'
import { SC, Card, LD, Empty, AIResult, AnalyzeButton, PrintButton, fmtMd, FrameworkBadge } from '../components/SharedUI'
import { ProjectFilter } from '../components/ProjectFilter'

export function WeeklyReport() {
  const { user } = useAuth()
  const { activeProject } = useProject()
  const { data: hazards } = useData<any>('hazards')
  const { data: incidents } = useData<any>('incidents')
  const { data: nearMisses } = useData<any>('near_misses')
  const { data: dailyLogs } = useData<any>('daily_logs')
  const { data: permits } = useData<any>('permits')
  const { data: training } = useData<any>('training')
  const { data: inspections } = useData<any>('inspections')
  const [report, setReport] = useState('')
  const [generating, setGenerating] = useState(false)

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  const thisWeek = (arr: any[]) => arr.filter((r: any) => new Date(r.created_at) > weekAgo)

  const weekHazards = thisWeek(hazards)
  const weekIncidents = thisWeek(incidents)
  const weekNearMisses = thisWeek(nearMisses)
  const weekLogs = thisWeek(dailyLogs)
  const weekInspections = thisWeek(inspections)
  const openHazards = hazards.filter((h: any) => h.status === 'Open' || h.status === 'In Progress')
  const closedThisWeek = hazards.filter((h: any) => h.status === 'Closed' && h.closed_at && new Date(h.closed_at) > weekAgo)
  const expiredTraining = training.filter((t: any) => t.expires && new Date(t.expires) < now)
  const expiredPermits = permits.filter((p: any) => p.expires && new Date(p.expires) < now && p.status !== 'Closed')

  const generate = async () => {
    setGenerating(true); setReport('')
    const summary = `Weekly Safety Report Data (${weekAgo.toLocaleDateString()} — ${now.toLocaleDateString()})
Project: ${activeProject?.name || 'All Projects'}

HAZARDS: ${weekHazards.length} new this week, ${openHazards.length} total open, ${closedThisWeek.length} closed this week
Categories: ${weekHazards.map((h: any) => h.category).filter(Boolean).join(', ') || 'None'}
Critical open: ${openHazards.filter((h: any) => h.severity === 'Critical').length}

INCIDENTS: ${weekIncidents.length} this week
Details: ${weekIncidents.map((i: any) => `${i.title} (${i.severity})`).join('; ') || 'None'}

NEAR MISSES: ${weekNearMisses.length} this week
Categories: ${weekNearMisses.map((n: any) => n.category).filter(Boolean).join(', ') || 'None'}

DAILY LOGS: ${weekLogs.length} entries, Total manpower: ${weekLogs.reduce((s: number, l: any) => s + (l.manpower || 0), 0)}

INSPECTIONS: ${weekInspections.length} completed

COMPLIANCE ALERTS: ${expiredTraining.length} expired certifications, ${expiredPermits.length} expired permits`

    const sysPrompt = getSystemPrompt(activeProject?.framework)
    const reportTitle = getTerm('Weekly Report', activeProject?.framework)
    const usaceNote = isUSACE(activeProject?.framework) ? '\nThis is a USACE project. Format as a Weekly CQM Safety Summary per EM 385-1-1. Include Three-Phase Inspection status, AHA review status, APP compliance, and deficiency tracking with 15-day closeout status.' : ''

    const prompt = `${sysPrompt}\n\nGenerate a professional ${reportTitle} from this data:\n${summary}${usaceNote}\n\nInclude:\n1. Executive Summary (2-3 sentences)\n2. Key Metrics Dashboard\n3. Hazard Status & Trends\n4. Incident/Near Miss Analysis\n5. Compliance Status\n6. Focus Areas for Next Week\n7. Recommendations\n\nUse professional tone suitable for project owner/GC review.`
    try {
      const data = await callClaude([{ role: 'user', content: prompt }], 3000)
      setReport(data.content?.[0]?.text || '')
    } catch (e: any) { setReport('Error: ' + e.message) }
    setGenerating(false)
  }

  const printReport = () => {
    if (!report) return
    const w = window.open('', '', 'width=1000,height=800')
    if (!w) return
    w.document.write(`<html><head><title>Weekly Safety Report</title><style>
      body{font-family:Arial,sans-serif;padding:2rem;font-size:12px;color:#333}
      h1{font-size:18px;border-bottom:2px solid #f97316;padding-bottom:6px}
      .meta{background:#f5f5f5;padding:10px;border-radius:6px;margin:10px 0;font-size:11px}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}
      .stat{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px;text-align:center}
      .stat .num{font-size:20px;font-weight:800}
      .stat .lbl{font-size:9px;color:#666;text-transform:uppercase}
      .content{margin-top:16px;line-height:1.7}
      .footer{margin-top:24px;font-size:9px;color:#999;border-top:1px solid #ddd;padding-top:8px;display:flex;justify-content:space-between}
      .sig{margin-top:30px;display:flex;gap:40px}
      .sig div{border-top:1px solid #333;padding-top:4px;min-width:140px;font-size:10px;margin-top:24px}
      @media print{body{padding:0}}
    </style></head><body>`)
    w.document.write(`<h1>📊 Weekly Safety Report</h1>`)
    w.document.write(`<div class="meta"><strong>Project:</strong> ${activeProject?.name || 'All Projects'} | <strong>Period:</strong> ${weekAgo.toLocaleDateString()} — ${now.toLocaleDateString()} | <strong>Prepared by:</strong> ${user?.user_metadata?.name || user?.email || '—'}</div>`)
    w.document.write(`<div class="stats">
      <div class="stat"><div class="num" style="color:${openHazards.length > 5 ? '#dc2626' : '#f97316'}">${openHazards.length}</div><div class="lbl">Open Hazards</div></div>
      <div class="stat"><div class="num" style="color:${weekIncidents.length > 0 ? '#dc2626' : '#22c55e'}">${weekIncidents.length}</div><div class="lbl">Incidents</div></div>
      <div class="stat"><div class="num" style="color:#8b5cf6">${weekNearMisses.length}</div><div class="lbl">Near Misses</div></div>
      <div class="stat"><div class="num" style="color:#22c55e">${closedThisWeek.length}</div><div class="lbl">Closed This Week</div></div>
    </div>`)
    w.document.write(`<div class="content">${fmtMd(report)}</div>`)
    w.document.write(`<div class="sig"><div>Safety Manager</div><div>Project Manager</div><div>Superintendent</div></div>`)
    w.document.write(`<div class="footer"><span>FORGED Safety Intelligence OS</span><span>29 CFR 1904 — Weekly Safety Summary</span></div></body></html>`)
    w.document.close(); w.print()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Weekly Safety Report</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>AI-generated from your live data — {activeProject?.name || 'All Projects'}</p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectFilter />
          {report && <PrintButton onClick={printReport} label="Print Report" />}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-4">
        <SC label="New Hazards" value={weekHazards.length} color="var(--acc)" />
        <SC label="Open Total" value={openHazards.length} color={openHazards.length > 5 ? 'var(--red)' : 'var(--yel)'} />
        <SC label="Closed (7d)" value={closedThisWeek.length} color="var(--grn)" />
        <SC label="Incidents" value={weekIncidents.length} color={weekIncidents.length > 0 ? 'var(--red)' : 'var(--grn)'} />
        <SC label="Near Misses" value={weekNearMisses.length} color="var(--pur)" />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <SC label="Daily Logs" value={weekLogs.length} color="var(--blu)" />
        <SC label="Inspections" value={weekInspections.length} color="var(--acc)" />
        <SC label="Expired Certs" value={expiredTraining.length} color={expiredTraining.length > 0 ? 'var(--red)' : 'var(--grn)'} />
        <SC label="Expired Permits" value={expiredPermits.length} color={expiredPermits.length > 0 ? 'var(--red)' : 'var(--grn)'} />
      </div>

      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
        <AnalyzeButton onClick={generate} analyzing={generating} label="📊 Generate Weekly Report" />
      </div>

      <AIResult text={report} label="Weekly Safety Report" color="var(--acc)" />
    </div>
  )
}
