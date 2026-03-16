import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { callClaude } from '../lib/ai'
import { SAFETY_SYSTEM_PROMPT } from '../data/standards'

export function PreStart() {
  const { activeProject } = useProject()
  const { data: hazards } = useData<any>('hazards')
  const { data: permits } = useData<any>('permits')
  const { data: training } = useData<any>('training')
  const { data: jhas } = useData<any>('jhas')
  const { data: workers } = useData<any>('workers')
  const [activity, setActivity] = useState('')
  const [crew, setCrew] = useState('15')
  const [weather, setWeather] = useState('Clear / Sunny')
  const [conditions, setConditions] = useState('')
  const [result, setResult] = useState('')
  const [generating, setGenerating] = useState(false)

  const openHazards = hazards.filter((h: any) => h.status === 'Open' || h.status === 'In Progress')
  const criticalHazards = openHazards.filter((h: any) => h.severity === 'Critical')
  const activePermits = permits.filter((p: any) => p.status === 'Active')
  const expiredPermits = permits.filter((p: any) => p.expires && new Date(p.expires) < new Date() && p.status !== 'Closed')
  const approvedJHAs = jhas.filter((j: any) => j.status === 'Approved')
  const expiredTraining = training.filter((t: any) => t.expires && new Date(t.expires) < new Date())

  // Auto-determine readiness flags
  const flags: string[] = []
  if (criticalHazards.length > 0) flags.push('🔴 CRITICAL HAZARDS OPEN: ' + criticalHazards.map((h: any) => h.title).join(', '))
  if (expiredPermits.length > 0) flags.push('🔴 EXPIRED PERMITS: ' + expiredPermits.map((p: any) => p.type).join(', '))
  if (expiredTraining.length > 0) flags.push('🟠 EXPIRED TRAINING: ' + expiredTraining.map((t: any) => `${t.worker_name}:${t.cert_type}`).join(', '))
  if (!activeProject) flags.push('🟡 NO ACTIVE PROJECT SET')

  const generate = async () => {
    if (!activity) { alert('Enter today\'s work activity.'); return }
    setGenerating(true); setResult('')

    const context = `PROJECT: ${activeProject?.name || 'Not set'} — ${activeProject?.location || ''} ${activeProject?.state || ''}
FRAMEWORK: ${activeProject?.framework || 'OSHA'}
ACTIVITY: ${activity}
CREW SIZE: ${crew}
WEATHER: ${weather}
CONDITIONS: ${conditions || 'None reported'}

REAL-TIME STATUS CHECK:
- Open hazards: ${openHazards.length} (${criticalHazards.length} CRITICAL)${criticalHazards.length > 0 ? '\n  CRITICAL: ' + criticalHazards.map((h: any) => h.title).join('; ') : ''}
- Active permits: ${activePermits.length}${activePermits.length > 0 ? ' — ' + activePermits.map((p: any) => p.type).join(', ') : ''}
- Expired permits: ${expiredPermits.length}${expiredPermits.length > 0 ? ' — ' + expiredPermits.map((p: any) => p.type).join(', ') : ''}
- Approved JHAs: ${approvedJHAs.length}${approvedJHAs.length > 0 ? ' — ' + approvedJHAs.map((j: any) => j.activity).join(', ') : ''}
- Workers on roster: ${workers.length}
- Expired training certs: ${expiredTraining.length}
- System flags: ${flags.length > 0 ? flags.join('; ') : 'None — all clear'}`

    const prompt = `${SAFETY_SYSTEM_PROMPT}

SPECIFIC TASK: You are a Pre-Start Readiness Engine. Based on the ACTUAL real-time project data below, determine if work can proceed.

${context}

Provide:

## READINESS VERDICT: [🟢 READY / 🔴 NOT READY / 🟡 CONDITIONAL]

[Bold, clear determination with specific rationale based on the data above]

## AUTOMATED STATUS CHECKS
For each item, mark ✅ PASS or ❌ FAIL:
- [ ] Critical hazards resolved
- [ ] All required permits active and current
- [ ] JHA approved for today's activity
- [ ] Training certifications current
- [ ] Weather conditions acceptable
- [ ] Required PPE identified
- [ ] Emergency action plan reviewed
- [ ] Competent person(s) identified

## WHAT — Required Before Starting
Checklist of every requirement for "${activity}" with OSHA citations.

## WHY — Regulatory Basis
For each requirement, cite specific Core 58 standards.

## HOW — Steps to Achieve Readiness
If NOT READY or CONDITIONAL, numbered steps to get to READY.

## DO NOT START WORK CONDITIONS
List any conditions that trigger immediate work stoppage.

## TODAY'S TOOLBOX TALK TOPICS
3-5 specific topics based on today's activity and conditions.`

    try {
      const data = await callClaude([{ role: 'user', content: prompt }], 3500)
      setResult(data.content?.[0]?.text || 'No response')
    } catch (e: any) { setResult('Error: ' + e.message) }
    setGenerating(false)
  }

  const printResult = () => {
    if (!result) return
    const w = window.open('', '', 'width=900,height=700')
    if (!w) return
    w.document.write(`<html><head><title>Pre-Start Readiness</title><style>body{font-family:Arial,sans-serif;padding:2rem;font-size:12px}h1{font-size:18px;border-bottom:2px solid #f97316;padding-bottom:8px}h2{font-size:14px;margin-top:16px;color:#f97316}.sig{margin-top:30px;display:flex;gap:60px}.sig div{border-top:1px solid #333;padding-top:4px;min-width:200px;font-size:11px}</style></head><body>`)
    w.document.write(`<h1>PRE-START READINESS CHECK</h1><p><strong>Project:</strong> ${activeProject?.name || '—'} | <strong>Activity:</strong> ${activity} | <strong>Date:</strong> ${new Date().toLocaleDateString()} | <strong>Crew:</strong> ${crew}</p>`)
    w.document.write(`<div style="white-space:pre-line">${result}</div>`)
    w.document.write(`<div class="sig"><div>SSHO / Safety Manager</div><div>Superintendent</div><div>Date / Time</div></div>`)
    w.document.write(`<div style="margin-top:20px;font-size:9px;color:#666">FORGED Safety Intelligence OS — Pre-Start Readiness — ${new Date().toLocaleString()}</div></body></html>`)
    w.document.close(); w.print()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Pre-Start Readiness</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--t3)' }}>AI pulls permits, JHAs, training, hazards, and weather to deliver a GO / NO-GO / CONDITIONAL verdict.</p>

      {/* Auto-detected flags */}
      {flags.length > 0 && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)' }}>
          <div className="font-bold text-sm mb-2" style={{ color: 'var(--red)' }}>⚠️ Auto-Detected Issues</div>
          {flags.map((f, i) => <div key={i} className="text-sm" style={{ color: 'var(--t2)' }}>{f}</div>)}
        </div>
      )}

      <div className="grid grid-cols-5 gap-3 mb-4">
        {[{ l: 'Open Hazards', v: openHazards.length, c: openHazards.length > 0 ? 'var(--yel)' : 'var(--grn)' },
          { l: 'Critical', v: criticalHazards.length, c: criticalHazards.length > 0 ? 'var(--red)' : 'var(--grn)' },
          { l: 'Active Permits', v: activePermits.length, c: 'var(--blu)' },
          { l: 'Approved JHAs', v: approvedJHAs.length, c: approvedJHAs.length > 0 ? 'var(--grn)' : 'var(--yel)' },
          { l: 'Expired Certs', v: expiredTraining.length, c: expiredTraining.length > 0 ? 'var(--red)' : 'var(--grn)' }
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <div className="font-mono text-xl font-extrabold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-[10px]" style={{ color: 'var(--t3)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Today's Work Activity</label>
            <input value={activity} onChange={e => setActivity(e.target.value)}
              placeholder="Steel erection levels 5-6 with 150-ton crane, concrete pour foundation C"
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Weather</label>
            <select value={weather} onChange={e => setWeather(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }}>
              {['Clear / Sunny','Partly Cloudy','Overcast','Rain','Thunderstorm','Extreme Heat','High Wind','Fog','Cold / Ice'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Crew Size</label>
              <input value={crew} onChange={e => setCrew(e.target.value)} type="number"
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Conditions</label>
              <input value={conditions} onChange={e => setConditions(e.target.value)} placeholder="Wet ground, new crew..."
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
            </div>
          </div>
        </div>
        <button onClick={generate} disabled={generating}
          className="w-full py-3 rounded-lg font-bold text-sm text-white"
          style={{ background: generating ? 'var(--bg3)' : 'linear-gradient(135deg, #f97316, #fb923c)', opacity: generating ? 0.6 : 1 }}>
          {generating ? 'Checking all systems...' : '✅ Run Pre-Start Readiness Check'}
        </button>
      </div>

      {result && (
        <div className="rounded-xl p-5" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderLeft: '3px solid var(--acc)' }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">Pre-Start Verdict</h3>
            <div className="flex gap-2">
              <button onClick={printResult} className="px-3 py-1 rounded text-xs" style={{ border: '1px solid var(--bdr)', color: 'var(--blu)' }}>Print</button>
              <button onClick={() => navigator.clipboard.writeText(result)} className="px-3 py-1 rounded text-xs" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Copy</button>
            </div>
          </div>
          <div className="ai-result text-sm leading-relaxed max-h-[600px] overflow-y-auto" style={{ color: 'var(--t2)' }}
            dangerouslySetInnerHTML={{ __html: fmtMd(result) }} />
        </div>
      )}
    </div>
  )
}

function fmtMd(t: string): string {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.+)$/gm,'<h4 style="color:var(--acc);font-size:.9rem;margin:.8rem 0 .2rem">$1</h4>')
    .replace(/^## (.+)$/gm,'<h3 style="color:var(--acc);font-size:1rem;margin:1rem 0 .3rem;border-bottom:1px solid var(--bdr);padding-bottom:.2rem">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/🟢/g,'<span style="color:var(--grn);font-size:1.2em">🟢</span>')
    .replace(/🔴/g,'<span style="color:var(--red);font-size:1.2em">🔴</span>')
    .replace(/🟡/g,'<span style="color:var(--yel);font-size:1.2em">🟡</span>')
    .replace(/(29 CFR [\d.]+[\w.]*)/g,'<span style="color:var(--blu);font-weight:600">$1</span>')
    .replace(/(NFPA [\d.]+)/g,'<span style="color:var(--blu);font-weight:600">$1</span>')
    .replace(/(EM 385[\-\d.\s\w]*)/g,'<span style="color:var(--pur);font-weight:600">$1</span>')
    .replace(/\n/g,'<br>')
}
