import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'
import { callClaude } from '../lib/ai'
import { getSystemPrompt, HAZARD_CATEGORIES, getTerm, isUSACE } from '../data/standards'
import { SC, FI, FS, FT, Card, LD, Empty, DelBtn, AIResult, AnalyzeButton, ExportCSVButton, PrintButton, printRecords, fmtMd, FrameworkBadge } from '../components/SharedUI'
import { ProjectFilter } from '../components/ProjectFilter'

export function ToolboxTalks() {
  const { user } = useAuth()
  const { activeProject } = useProject()
  const { data: hazards } = useData<any>('hazards')
  const { data: nearMisses } = useData<any>('near_misses')
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState('General Construction')
  const [generating, setGenerating] = useState(false)
  const [talk, setTalk] = useState('')
  const [history, setHistory] = useState<{ topic: string; content: string; date: string }[]>([])

  const suggestedTopics = (() => {
    const cats: Record<string, number> = {}
    hazards.forEach((h: any) => { if (h.category && (h.status === 'Open' || h.status === 'In Progress')) cats[h.category] = (cats[h.category] || 0) + 1 })
    nearMisses.forEach((n: any) => { if (n.category) cats[n.category] = (cats[n.category] || 0) + 1 })
    return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5)
  })()

  const generate = async () => {
    const t = topic || category
    setGenerating(true); setTalk('')
    const sysPrompt = getSystemPrompt(activeProject?.framework)
    const usaceNote = isUSACE(activeProject?.framework) ? '\nThis is a USACE project. Title this as a "Safety Stand-Down / Tailgate Brief" per EM 385-1-1. Cite EM 385 sections first.' : ''
    const talkLabel = getTerm('Toolbox Talk', activeProject?.framework)
    const prompt = `${sysPrompt}\n\nGenerate a 5-minute ${talkLabel} on: "${t}"${usaceNote}\n\nFormat:\n1. TOPIC & DATE\n2. KEY POINTS (3-5 bullet points with citations)\n3. REAL-WORLD SCENARIO (what can go wrong)\n4. DISCUSSION QUESTIONS (3 questions)\n5. TAKEAWAY (1 sentence)\n\nKeep language at 8th-grade reading level. Include specific citations.`
    try {
      const data = await callClaude([{ role: 'user', content: prompt }], 2000)
      const text = data.content?.[0]?.text || ''
      setTalk(text)
      setHistory(prev => [{ topic: t, content: text, date: new Date().toISOString() }, ...prev])
    } catch (e: any) { setTalk('Error: ' + e.message) }
    setGenerating(false)
  }

  const printTalk = () => {
    if (!talk) return
    const w = window.open('', '', 'width=900,height=700')
    if (!w) return
    w.document.write(`<html><head><title>Toolbox Talk</title><style>
      body{font-family:Arial,sans-serif;padding:2rem;font-size:12px;color:#333}
      h1{font-size:18px;border-bottom:2px solid #f97316;padding-bottom:6px}
      .meta{background:#f5f5f5;padding:10px;border-radius:6px;margin:10px 0;font-size:11px}
      .content{margin-top:12px;line-height:1.7}
      .sig{margin-top:30px;display:flex;gap:20px;flex-wrap:wrap}
      .sig div{border-top:1px solid #333;padding-top:4px;min-width:120px;font-size:10px;margin-top:20px}
      .footer{margin-top:20px;font-size:9px;color:#999;border-top:1px solid #ddd;padding-top:8px}
      @media print{body{padding:0}}
    </style></head><body>`)
    w.document.write(`<h1>🔧 Toolbox Talk</h1>`)
    w.document.write(`<div class="meta"><strong>Topic:</strong> ${topic || category} | <strong>Project:</strong> ${activeProject?.name || 'General'} | <strong>Date:</strong> ${new Date().toLocaleDateString()} | <strong>Presenter:</strong> _______________</div>`)
    w.document.write(`<div class="content">${fmtMd(talk)}</div>`)
    w.document.write(`<div style="margin-top:24px;font-size:11px;font-weight:bold">Attendees (print name & sign):</div>`)
    w.document.write('<table style="width:100%;border-collapse:collapse;margin-top:8px"><tr><th style="border:1px solid #ccc;padding:4px;width:5%">#</th><th style="border:1px solid #ccc;padding:4px;width:30%">Name</th><th style="border:1px solid #ccc;padding:4px;width:20%">Company</th><th style="border:1px solid #ccc;padding:4px;width:20%">Signature</th><th style="border:1px solid #ccc;padding:4px">Badge/ID</th></tr>')
    for (let i = 1; i <= 20; i++) w.document.write(`<tr><td style="border:1px solid #ccc;padding:6px;text-align:center">${i}</td><td style="border:1px solid #ccc;padding:6px"></td><td style="border:1px solid #ccc;padding:6px"></td><td style="border:1px solid #ccc;padding:6px"></td><td style="border:1px solid #ccc;padding:6px"></td></tr>`)
    w.document.write('</table>')
    w.document.write(`<div class="footer">FORGED Safety Intelligence OS — Toolbox Talk Record — 29 CFR 1926.21(b)(2)</div></body></html>`)
    w.document.close(); w.print()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Toolbox Talks</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>AI-generated with OSHA citations — printable sign-in sheets — {activeProject?.name || 'All Projects'}</p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectFilter />
          {talk && <PrintButton onClick={printTalk} label="Print with Sign-In" />}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <SC label="Generated" value={history.length} color="var(--acc)" />
        <SC label="Open Hazards" value={hazards.filter((h: any) => h.status === 'Open' || h.status === 'In Progress').length} color="var(--red)" />
        <SC label="Near Misses" value={nearMisses.length} color="var(--pur)" />
      </div>

      {/* Suggested topics from data */}
      {suggestedTopics.length > 0 && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--t3)' }}>SUGGESTED TOPICS (based on your hazard data)</div>
          <div className="flex gap-2 flex-wrap">
            {suggestedTopics.map(([cat, count]) => (
              <button key={cat} onClick={() => { setTopic(cat); setCategory(cat) }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
                style={{ background: 'rgba(249,115,22,.08)', border: '1px solid rgba(249,115,22,.25)', color: 'var(--acc)' }}>
                {cat} ({count} open)
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <FI name="topic" label="Custom Topic" placeholder="Fall protection for steel erection" value={topic} onChange={(e: any) => setTopic(e.target.value)} />
          <FS name="category" label="Or Select Category" options={HAZARD_CATEGORIES} value={category} onChange={(e: any) => setCategory(e.target.value)} />
        </div>
        <AnalyzeButton onClick={generate} analyzing={generating} label="🔧 Generate Toolbox Talk" />
      </div>

      <AIResult text={talk} label="Toolbox Talk" color="var(--acc)" />

      {/* History */}
      {history.length > 1 && (
        <div className="rounded-xl p-4 mt-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
          <h3 className="font-bold text-sm mb-2">Session History</h3>
          {history.slice(1).map((h, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 text-xs cursor-pointer" style={{ borderBottom: '1px solid var(--bg3)' }}
              onClick={() => setTalk(h.content)}>
              <span style={{ color: 'var(--t2)' }}>🔧 {h.topic}</span>
              <span style={{ color: 'var(--t3)' }}>{new Date(h.date).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
