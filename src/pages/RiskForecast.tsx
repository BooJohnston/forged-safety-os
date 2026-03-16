import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { callClaude } from '../lib/ai'
import { SAFETY_SYSTEM_PROMPT } from '../data/standards'

export function RiskForecast() {
  const { activeProject } = useProject()
  const { data: hazards } = useData<any>('hazards')
  const { data: incidents } = useData<any>('incidents')
  const { data: nearMisses } = useData<any>('near_misses')
  const { data: logs } = useData<any>('daily_logs')
  const { data: permits } = useData<any>('permits')
  const { data: training } = useData<any>('training')
  const { data: workers } = useData<any>('workers')
  const [forecast, setForecast] = useState('')
  const [generating, setGenerating] = useState(false)
  const [activities, setActivities] = useState('')
  const [weather, setWeather] = useState('Clear / Sunny')
  const [crewSize, setCrew] = useState('25')
  const [newWorkers, setNewWorkers] = useState('3')

  const openHazards = hazards.filter((h: any) => h.status === 'Open' || h.status === 'In Progress')
  const criticalOpen = openHazards.filter((h: any) => h.severity === 'Critical')
  const recentNM = nearMisses.filter((n: any) => Date.now() - new Date(n.created_at).getTime() < 14 * 86400000)
  const recentIncidents = incidents.filter((i: any) => Date.now() - new Date(i.created_at).getTime() < 30 * 86400000)
  const activePermits = permits.filter((p: any) => p.status === 'Active')
  const expiredCerts = training.filter((t: any) => t.expires && new Date(t.expires) < new Date())

  const generate = async () => {
    setGenerating(true); setForecast('')

    // Build rich context from ALL project data
    const context = `PROJECT: ${activeProject?.name || 'General'} — ${activeProject?.location || ''} ${activeProject?.state || ''}
FRAMEWORK: ${activeProject?.framework || 'OSHA'}
SCOPES: ${activeProject?.scopes || 'General construction'}

TODAY'S PLANNED ACTIVITIES: ${activities || 'Not specified'}
WEATHER FORECAST: ${weather}
CREW SIZE: ${crewSize} total, ${newWorkers} new workers

CURRENT SAFETY STATUS:
- Open hazards: ${openHazards.length} (${criticalOpen.length} critical)
- Hazard categories in play: ${[...new Set(openHazards.map((h: any) => h.category))].join(', ') || 'None'}
- Recent near misses (14 days): ${recentNM.length}${recentNM.length > 0 ? ' — Categories: ' + [...new Set(recentNM.map((n: any) => n.category))].join(', ') : ''}
- Recent incidents (30 days): ${recentIncidents.length}${recentIncidents.length > 0 ? ' — ' + recentIncidents.map((i: any) => `${i.severity}: ${i.title}`).join('; ') : ''}
- Active permits: ${activePermits.length}${activePermits.length > 0 ? ' — Types: ' + activePermits.map((p: any) => p.type).join(', ') : ''}
- Expired training certs: ${expiredCerts.length}${expiredCerts.length > 0 ? ' — ' + expiredCerts.map((t: any) => `${t.worker_name}: ${t.cert_type}`).join('; ') : ''}
- Workers on site: ${workers.length} total roster
- Daily logs this week: ${logs.filter((l: any) => Date.now() - new Date(l.created_at).getTime() < 7 * 86400000).length}

HISTORICAL PATTERN DATA:
- Total hazards logged: ${hazards.length}
- Most common hazard categories: ${getTopCategories(hazards)}
- Hazard close rate: ${hazards.length > 0 ? Math.round(hazards.filter((h: any) => h.status === 'Closed').length / hazards.length * 100) : 100}%
- Total near misses: ${nearMisses.length}
- Total incidents: ${incidents.length}`

    const prompt = `${SAFETY_SYSTEM_PROMPT}

SPECIFIC TASK: You are a Predictive Safety Risk Analyst. Using the project's ACTUAL historical data below, generate a 7-day predictive risk forecast.

${context}

Generate:

## TODAY'S RISK ASSESSMENT
- Overall Risk Level: CRITICAL / HIGH / MODERATE / LOW
- Risk Score: X/100
- GO / NO-GO / CONDITIONAL verdict for today's work
- Top 3 immediate risks with probability ratings

## 7-DAY RISK FORECAST
For each day (Day 1 = today through Day 7):
- Risk Level with color: 🔴 CRITICAL / 🟠 HIGH / 🟡 MODERATE / 🟢 LOW
- Key risk drivers for that day
- Recommended preventive actions
- Required toolbox talk topic

## PREDICTIVE ALERTS
- Leading indicators from near miss data suggesting emerging risks
- Pattern analysis: what hazard types are trending upward?
- New worker risk: ${newWorkers} new workers increases incident probability by X%
- Weather impact assessment for ${weather}

## OSHA FOCUS FOUR ANALYSIS
Rate each for today's planned activities:
1. Falls — Risk: X/10 — Key concern: [specific]
2. Struck-By — Risk: X/10 — Key concern: [specific]
3. Electrocution — Risk: X/10 — Key concern: [specific]
4. Caught-Between — Risk: X/10 — Key concern: [specific]

## REQUIRED ACTIONS BEFORE WORK STARTS
Numbered checklist of what must happen this morning.

## RECOMMENDED INSPECTION SCHEDULE
Day-by-day inspection priorities for the week.

Cite all applicable Core 58 standards. Use ✅ ⚠️ 🔍 confidence labels.`

    try {
      const data = await callClaude([{ role: 'user', content: prompt }], 4000)
      setForecast(data.content?.[0]?.text || 'No response')
    } catch (e: any) { setForecast('Error: ' + e.message) }
    setGenerating(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Predictive Risk Forecast</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--t3)' }}>AI analyzes your actual project data — hazards, near misses, incidents, permits, training — to predict tomorrow's risks today.</p>

      {/* Live risk indicators */}
      <div className="grid grid-cols-6 gap-3 mb-4">
        {[
          { l: 'Open Hazards', v: openHazards.length, c: openHazards.length > 5 ? 'var(--red)' : 'var(--yel)' },
          { l: 'Critical', v: criticalOpen.length, c: criticalOpen.length > 0 ? 'var(--red)' : 'var(--grn)' },
          { l: 'Near Misses (14d)', v: recentNM.length, c: recentNM.length > 3 ? 'var(--red)' : 'var(--pur)' },
          { l: 'Incidents (30d)', v: recentIncidents.length, c: recentIncidents.length > 0 ? 'var(--red)' : 'var(--grn)' },
          { l: 'Active Permits', v: activePermits.length, c: 'var(--blu)' },
          { l: 'Expired Certs', v: expiredCerts.length, c: expiredCerts.length > 0 ? 'var(--red)' : 'var(--grn)' }
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <div className="font-mono text-xl font-extrabold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-[10px]" style={{ color: 'var(--t3)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Input context */}
      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
        <h3 className="font-bold text-sm mb-3">Today's Planned Work</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Planned Activities</label>
            <textarea value={activities} onChange={e => setActivities(e.target.value)} rows={2}
              placeholder="Steel erection levels 5-6, crane operations, concrete pour foundation C, excavation south trench..."
              className="w-full px-3 py-2 rounded-lg text-sm resize-y" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Weather</label>
            <select value={weather} onChange={e => setWeather(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }}>
              {['Clear / Sunny','Partly Cloudy','Overcast','Rain','Thunderstorm','Extreme Heat (>95°F)','High Wind (>25mph)','Fog / Low Visibility','Cold / Ice','Snow'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Crew Size</label>
              <input value={crewSize} onChange={e => setCrew(e.target.value)} type="number"
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>New Workers</label>
              <input value={newWorkers} onChange={e => setNewWorkers(e.target.value)} type="number"
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
            </div>
          </div>
        </div>
        <button onClick={generate} disabled={generating}
          className="w-full py-3 rounded-lg font-bold text-sm text-white"
          style={{ background: generating ? 'var(--bg3)' : 'linear-gradient(135deg, #f97316, #fb923c)', opacity: generating ? 0.6 : 1 }}>
          {generating ? 'Analyzing project data and generating forecast...' : '🎯 Generate Predictive Risk Forecast'}
        </button>
      </div>

      {forecast && (
        <div className="rounded-xl p-5" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderLeft: '3px solid var(--acc)' }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">7-Day Risk Forecast</h3>
            <div className="flex gap-2">
              <button onClick={() => printForecast(forecast, activeProject)} className="px-3 py-1 rounded text-xs" style={{ border: '1px solid var(--bdr)', color: 'var(--blu)' }}>Print</button>
              <button onClick={() => navigator.clipboard.writeText(forecast)} className="px-3 py-1 rounded text-xs" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Copy</button>
            </div>
          </div>
          <div className="ai-result text-sm leading-relaxed max-h-[600px] overflow-y-auto" style={{ color: 'var(--t2)' }}
            dangerouslySetInnerHTML={{ __html: fmtMd(forecast) }} />
        </div>
      )}
    </div>
  )
}

function getTopCategories(hazards: any[]): string {
  const cats: Record<string, number> = {}
  hazards.forEach((h: any) => { if (h.category) cats[h.category] = (cats[h.category] || 0) + 1 })
  return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}(${v})`).join(', ') || 'No data yet'
}

function printForecast(text: string, project: any) {
  const w = window.open('', '', 'width=900,height=700')
  if (!w) return
  w.document.write(`<html><head><title>Risk Forecast</title><style>body{font-family:Arial,sans-serif;padding:2rem;font-size:12px}h1{font-size:18px;border-bottom:2px solid #f97316;padding-bottom:8px}h2{font-size:14px;margin-top:16px;color:#f97316}</style></head><body>`)
  w.document.write(`<h1>PREDICTIVE RISK FORECAST</h1><p><strong>Project:</strong> ${project?.name || 'All'} | <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>`)
  w.document.write(`<div style="white-space:pre-line">${text}</div>`)
  w.document.write(`<div style="margin-top:30px;font-size:9px;color:#666">FORGED Safety Intelligence OS — Predictive Risk Engine</div></body></html>`)
  w.document.close(); w.print()
}

function fmtMd(t: string): string {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.+)$/gm,'<h4 style="color:var(--acc);font-size:.9rem;margin:.8rem 0 .2rem">$1</h4>')
    .replace(/^## (.+)$/gm,'<h3 style="color:var(--acc);font-size:1rem;margin:1rem 0 .3rem;border-bottom:1px solid var(--bdr);padding-bottom:.2rem">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/🔴/g,'<span style="color:var(--red)">🔴</span>').replace(/🟠/g,'<span style="color:var(--acc)">🟠</span>')
    .replace(/🟡/g,'<span style="color:var(--yel)">🟡</span>').replace(/🟢/g,'<span style="color:var(--grn)">🟢</span>')
    .replace(/(29 CFR [\d.]+[\w.]*)/g,'<span style="color:var(--blu);font-weight:600">$1</span>')
    .replace(/(NFPA [\d.]+)/g,'<span style="color:var(--blu);font-weight:600">$1</span>')
    .replace(/(EM 385[\-\d.\s\w]*)/g,'<span style="color:var(--pur);font-weight:600">$1</span>')
    .replace(/\n/g,'<br>')
}
