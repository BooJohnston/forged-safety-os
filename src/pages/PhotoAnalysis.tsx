import { useState, useRef } from 'react'
import { dualAnalyze, callClaude } from '../lib/ai'
import { getSystemPrompt, HAZARD_CATEGORIES, getTerm, isUSACE } from '../data/standards'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'
import { SC, LD, fmtMd, FrameworkBadge } from '../components/SharedUI'

type ConsensusItem = { finding: string; claude: boolean; gpt: boolean; confidence: 'HIGH' | 'REVIEW' | 'LOW'; severity: string }

export function PhotoAnalysis() {
  const { user } = useAuth()
  const { activeProject } = useProject()
  const { data: analyses, add: saveAnalysis, remove: removeAnalysis, loading: histLoading } = useData<any>('photo_analyses')
  const { add: addHazard } = useData<any>('hazards')

  const [photos, setPhotos] = useState<string[]>([])
  const [videoFrames, setVideoFrames] = useState<string[]>([])
  const [project, setProject] = useState(activeProject?.name || '')
  const [activity, setActivity] = useState('General Construction')
  const [analyzing, setAnalyzing] = useState(false)
  const [claudeResult, setClaudeResult] = useState('')
  const [gptResult, setGptResult] = useState('')
  const [vidStatus, setVidStatus] = useState('')
  const [extractingHazards, setExtractingHazards] = useState(false)
  const [hazardsCreated, setHazardsCreated] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const vidRef = useRef<HTMLInputElement>(null)

  // ─── NEW: Compliance Check Mode ───
  const [mode, setMode] = useState<'hazard' | 'compliance'>('hazard')
  const [complianceQuestion, setComplianceQuestion] = useState('')
  const [verdict, setVerdict] = useState<{ status: string; confidence: number; summary: string } | null>(null)

  // ─── NEW: Consensus Engine ───
  const [consensus, setConsensus] = useState<ConsensusItem[]>([])
  const [buildingConsensus, setBuildingConsensus] = useState(false)

  const effectiveProject = project || activeProject?.name || 'Construction Site'
  const sysPrompt = getSystemPrompt(activeProject?.framework)
  const usaceNote = isUSACE(activeProject?.framework) ? '\nThis is a USACE/EM 385-1-1 project. Cite EM 385 sections FIRST.' : ''

  // ─── Photo/Video Handlers ───
  const handlePhotos = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = e => setPhotos(prev => [...prev, e.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  const handleVideo = (file: File | undefined) => {
    if (!file) return
    setVidStatus('Loading video...')
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      if (video.duration > 60) { setVidStatus('Video too long (max 60s)'); return }
      video.onloadeddata = () => extractFrames(video)
      video.currentTime = 0
    }
    video.src = URL.createObjectURL(file)
  }

  const extractFrames = (video: HTMLVideoElement) => {
    const dur = video.duration
    const n = Math.min(8, Math.max(3, Math.floor(dur / 5)))
    const interval = dur / n
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(1280, video.videoWidth)
    canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth))
    const ctx = canvas.getContext('2d')!
    const frames: string[] = []; let idx = 0
    const capture = () => {
      if (idx >= n) { setVideoFrames(frames); setVidStatus(`✓ ${frames.length} frames from ${Math.round(dur)}s`); return }
      video.currentTime = Math.min(idx * interval + 0.5, dur - 0.1)
      video.onseeked = () => { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); frames.push(canvas.toDataURL('image/jpeg', 0.85)); idx++; setVidStatus(`Frame ${idx}/${n}...`); setTimeout(capture, 100) }
    }
    capture()
  }

  // ═══ MODE 1: HAZARD SCAN (original + consensus) ═══
  const analyzeHazards = async () => {
    const allImages = [...photos, ...videoFrames]
    if (!allImages.length) { alert('Upload photos or video first.'); return }
    setAnalyzing(true); setClaudeResult(''); setGptResult(''); setHazardsCreated(0); setSelectedAnalysis(null); setVerdict(null); setConsensus([])

    const prompt = `${sysPrompt}\n\nAnalyze these ${allImages.length} construction site images using the 12-Category Hazard Detection Matrix.${usaceNote}\n\nPROJECT: ${effectiveProject}\nACTIVITY: ${activity}\n\nFor each hazard found, provide:\nWHAT: Description, severity (Critical/High/Moderate/Low), confidence percentage\nWHY: Specific citations\nHOW: Corrective action, responsible party, timeline\n\nInclude: READY/NOT READY verdict, Safety Score (0-100), top 3 priorities. Flag STOP WORK for imminent danger.`

    try {
      const { claudeText, gptText } = await dualAnalyze(prompt, allImages)
      setClaudeResult(claudeText)
      setGptResult(gptText)
      await saveAnalysis({
        project: effectiveProject, project_id: activeProject?.id || '', activity, mode: 'hazard',
        photo_count: photos.length, video_frame_count: videoFrames.length,
        claude_result: claudeText, gpt_result: gptText, status: 'Completed',
        created_by: user?.user_metadata?.name || user?.email || '', created_at: new Date().toISOString()
      })
    } catch (e: any) { setClaudeResult('Error: ' + e.message) }
    setAnalyzing(false)
  }

  // ═══ MODE 2: COMPLIANCE CHECK ═══
  const analyzeCompliance = async () => {
    const allImages = [...photos, ...videoFrames]
    if (!allImages.length) { alert('Upload a photo first.'); return }
    if (!complianceQuestion.trim()) { alert('Enter your compliance question.'); return }
    setAnalyzing(true); setClaudeResult(''); setGptResult(''); setVerdict(null); setConsensus([])

    const prompt = `${sysPrompt}\n\nCOMPLIANCE VERIFICATION REQUEST${usaceNote}\n\nA safety professional has uploaded a photo and asks:\n"${complianceQuestion}"\n\nProject: ${effectiveProject}\nActivity: ${activity}\n\nYou must provide:\n1. VERDICT: COMPLIANT / NON-COMPLIANT / INDETERMINATE (with confidence 0-100%)\n2. SPECIFIC FINDINGS: What you observe in the image related to the question\n3. APPLICABLE STANDARDS: Every citation that applies to this specific question\n4. IF NON-COMPLIANT: Exactly what is wrong, which standard is violated, and the required corrective action\n5. IF COMPLIANT: What evidence in the photo demonstrates compliance\n6. IF INDETERMINATE: What additional information or angles would be needed\n\nBe direct. Start with the verdict. Cite exact standard sections.`

    try {
      const { claudeText, gptText } = await dualAnalyze(prompt, allImages)
      setClaudeResult(claudeText)
      setGptResult(gptText)

      // Build consensus verdict
      const claudeCompliant = /\bCOMPLIANT\b/i.test(claudeText) && !/\bNON-COMPLIANT\b/i.test(claudeText)
      const claudeNonCompliant = /\bNON-COMPLIANT\b/i.test(claudeText)
      const gptCompliant = /\bCOMPLIANT\b/i.test(gptText) && !/\bNON-COMPLIANT\b/i.test(gptText)
      const gptNonCompliant = /\bNON-COMPLIANT\b/i.test(gptText)

      let status = 'INDETERMINATE'
      let confidence = 50
      let summary = ''

      if (claudeNonCompliant && gptNonCompliant) { status = 'NON-COMPLIANT'; confidence = 95; summary = 'Both AI models agree: non-compliant. High confidence finding.' }
      else if (claudeCompliant && gptCompliant) { status = 'COMPLIANT'; confidence = 90; summary = 'Both AI models agree: compliant. High confidence finding.' }
      else if (claudeNonCompliant && gptCompliant) { status = 'REVIEW NEEDED'; confidence = 55; summary = 'Models disagree — Claude found non-compliance, GPT-4o found compliance. Human review required.' }
      else if (claudeCompliant && gptNonCompliant) { status = 'REVIEW NEEDED'; confidence = 55; summary = 'Models disagree — GPT-4o found non-compliance, Claude found compliance. Human review required.' }
      else { status = 'INDETERMINATE'; confidence = 40; summary = 'Neither model provided a clear determination. Additional photos or information may be needed.' }

      setVerdict({ status, confidence, summary })

      await saveAnalysis({
        project: effectiveProject, project_id: activeProject?.id || '', activity, mode: 'compliance',
        compliance_question: complianceQuestion, verdict: status, confidence,
        photo_count: photos.length, video_frame_count: videoFrames.length,
        claude_result: claudeText, gpt_result: gptText, status: 'Completed',
        created_by: user?.user_metadata?.name || user?.email || '', created_at: new Date().toISOString()
      })
    } catch (e: any) { setClaudeResult('Error: ' + e.message) }
    setAnalyzing(false)
  }

  // ═══ CONSENSUS ENGINE ═══
  const buildConsensus = async () => {
    if (!claudeResult || !gptResult) return
    setBuildingConsensus(true)

    const prompt = `You are a consensus analysis engine. Two AI safety models analyzed the same construction site photo(s). Compare their findings and produce a JSON array of hazard items.

CLAUDE'S FINDINGS:
${claudeResult.substring(0, 4000)}

GPT-4O'S FINDINGS:
${gptResult.substring(0, 4000)}

For EACH distinct hazard or finding mentioned by either model, create a JSON object:
{
  "finding": "Short description of the hazard/finding (max 80 chars)",
  "claude": true/false (did Claude identify this?),
  "gpt": true/false (did GPT-4o identify this?),
  "confidence": "HIGH" if both agree, "REVIEW" if they disagree, "LOW" if only one mentions it vaguely,
  "severity": "Critical" or "High" or "Moderate" or "Low"
}

Return ONLY a valid JSON array. No markdown, no explanation.`

    try {
      const data = await callClaude([{ role: 'user', content: prompt }], 2000)
      const text = data.content?.[0]?.text || ''
      const match = text.match(/\[[\s\S]*\]/)
      if (match) setConsensus(JSON.parse(match[0]))
    } catch (e) { console.error('Consensus build failed:', e) }
    setBuildingConsensus(false)
  }

  // ═══ AUTO-GENERATE HAZARDS ═══
  const extractHazards = async () => {
    if (!claudeResult) return
    setExtractingHazards(true)
    const extractPrompt = `Extract each distinct hazard as a JSON array. Each object: { "title": "max 60 chars", "category": "one of [${HAZARD_CATEGORIES.join(',')}]", "severity": "Critical|High|Moderate|Low", "description": "1-2 sentences", "osha_ref": "primary citation", "corrective_action": "fix" }. Return ONLY JSON array.\n\nAnalysis:\n${claudeResult.substring(0, 6000)}`
    try {
      const data = await callClaude([{ role: 'user', content: extractPrompt }], 3000)
      const text = data.content?.[0]?.text || ''
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        const hazards = JSON.parse(match[0]); let created = 0
        for (const h of hazards) {
          await addHazard({ title: h.title || 'Photo-detected hazard', category: h.category || 'Other', severity: h.severity || 'Moderate', description: h.description || '', osha_ref: h.osha_ref || '', corrective_action: h.corrective_action || '', status: 'Open', source: 'Photo Analysis AI', project: effectiveProject, project_id: activeProject?.id || '', created_by: user?.user_metadata?.name || user?.email || '', created_at: new Date().toISOString() })
          created++
        }
        setHazardsCreated(created)
      }
    } catch (e: any) { console.error('Hazard extraction failed:', e) }
    setExtractingHazards(false)
  }

  const viewSavedAnalysis = (a: any) => {
    setSelectedAnalysis(a); setClaudeResult(a.claude_result || ''); setGptResult(a.gpt_result || ''); setShowHistory(false)
    if (a.verdict) setVerdict({ status: a.verdict, confidence: a.confidence || 50, summary: '' })
  }

  const printAnalysis = () => {
    if (!claudeResult) return
    const w = window.open('', '', 'width=1000,height=800'); if (!w) return
    const usace = isUSACE(activeProject?.framework)
    w.document.write(`<html><head><title>Photo Analysis</title><style>body{font-family:Arial,sans-serif;padding:2rem;font-size:12px;color:#333}h1{font-size:18px;border-bottom:2px solid ${usace ? '#065f46' : '#f97316'};padding-bottom:6px}h2{font-size:14px;color:#666;margin-top:16px}.meta{background:#f5f5f5;padding:10px;border-radius:6px;margin:10px 0;font-size:11px}.result{margin-top:12px;line-height:1.6}.verdict{text-align:center;padding:16px;margin:12px 0;border-radius:8px;font-size:18px;font-weight:800}.consensus{margin:12px 0}.consensus table{width:100%;border-collapse:collapse}.consensus th,.consensus td{border:1px solid #ddd;padding:5px;font-size:11px}.footer{margin-top:24px;font-size:9px;color:#999;border-top:1px solid #ddd;padding-top:8px}@media print{body{padding:0}}</style></head><body>`)
    w.document.write(`<h1>📸 ${mode === 'compliance' ? 'Compliance Verification Report' : 'Photo Hazard Analysis Report'}</h1>`)
    w.document.write(`<div class="meta"><strong>Project:</strong> ${effectiveProject} | <strong>Activity:</strong> ${activity} | <strong>Framework:</strong> ${activeProject?.framework || 'OSHA'} | <strong>Date:</strong> ${new Date().toLocaleString()}</div>`)
    if (mode === 'compliance' && complianceQuestion) w.document.write(`<div class="meta"><strong>Compliance Question:</strong> ${complianceQuestion}</div>`)
    if (verdict) {
      const vc = verdict.status.includes('NON') ? '#dc2626' : verdict.status === 'COMPLIANT' ? '#22c55e' : '#eab308'
      w.document.write(`<div class="verdict" style="background:${vc}15;border:2px solid ${vc};color:${vc}">${verdict.status} — ${verdict.confidence}% Confidence</div>`)
      if (verdict.summary) w.document.write(`<p style="text-align:center;font-size:11px">${verdict.summary}</p>`)
    }
    if (consensus.length > 0) {
      w.document.write(`<div class="consensus"><h2>Dual AI Consensus</h2><table><tr><th>Finding</th><th>Claude</th><th>GPT-4o</th><th>Confidence</th><th>Severity</th></tr>`)
      consensus.forEach(c => w.document.write(`<tr><td>${c.finding}</td><td>${c.claude ? '✅' : '—'}</td><td>${c.gpt ? '✅' : '—'}</td><td style="color:${c.confidence === 'HIGH' ? '#22c55e' : c.confidence === 'REVIEW' ? '#eab308' : '#dc2626'};font-weight:bold">${c.confidence}</td><td>${c.severity}</td></tr>`))
      w.document.write(`</table></div>`)
    }
    w.document.write(`<h2>Claude Analysis</h2><div class="result">${fmtMd(claudeResult)}</div>`)
    if (gptResult) w.document.write(`<h2>GPT-4o Analysis</h2><div class="result">${fmtMd(gptResult)}</div>`)
    w.document.write(`<div class="footer">FORGED Safety Intelligence OS — Dual AI ${mode === 'compliance' ? 'Compliance Verification' : 'Photo Analysis'}</div></body></html>`)
    w.document.close(); w.print()
  }

  const allMedia = [...photos, ...videoFrames]
  const verdictColors: Record<string, string> = { 'NON-COMPLIANT': 'var(--red)', 'COMPLIANT': 'var(--grn)', 'REVIEW NEEDED': 'var(--yel)', 'INDETERMINATE': 'var(--t3)' }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Photo & Video Analysis</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Dual AI Consensus Engine • Hazard Scan • Compliance Check — {activeProject?.name || 'All Projects'}</p>
        </div>
        <div className="flex gap-2">
          <FrameworkBadge framework={activeProject?.framework} />
          <button onClick={() => setShowHistory(!showHistory)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: '1px solid var(--bdr)', color: 'var(--t2)' }}>📜 History ({analyses.length})</button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode('hazard')} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
          style={{ background: mode === 'hazard' ? 'rgba(249,115,22,.12)' : 'var(--bg2)', border: `2px solid ${mode === 'hazard' ? 'var(--acc)' : 'var(--bdr)'}`, color: mode === 'hazard' ? 'var(--acc)' : 'var(--t3)' }}>
          ⚠️ Hazard Scan — Find all hazards in photos
        </button>
        <button onClick={() => setMode('compliance')} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
          style={{ background: mode === 'compliance' ? 'rgba(59,130,246,.12)' : 'var(--bg2)', border: `2px solid ${mode === 'compliance' ? 'var(--blu)' : 'var(--bdr)'}`, color: mode === 'compliance' ? 'var(--blu)' : 'var(--t3)' }}>
          ✅ Compliance Check — "Is this compliant?"
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <SC label="Total Analyses" value={analyses.length} color="var(--acc)" />
        <SC label="Compliance Checks" value={analyses.filter((a: any) => a.mode === 'compliance').length} color="var(--blu)" />
        <SC label="Photos Analyzed" value={analyses.reduce((s: number, a: any) => s + (a.photo_count || 0), 0)} color="var(--pur)" />
        <SC label="Hazards Found" value={hazardsCreated || '—'} color={hazardsCreated > 0 ? 'var(--red)' : 'var(--grn)'} />
      </div>

      {showHistory && (
        <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
          <h3 className="font-bold text-sm mb-3">Analysis History</h3>
          {histLoading ? <LD /> : analyses.length === 0 ? <p className="text-sm" style={{ color: 'var(--t3)' }}>No saved analyses.</p> :
            analyses.slice(0, 20).map((a: any) => (
              <div key={a.id} className="flex justify-between items-center py-2 text-sm" style={{ borderBottom: '1px solid var(--bg3)' }}>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => viewSavedAnalysis(a)}>
                  <span>{a.mode === 'compliance' ? '✅' : '📸'}</span>
                  <span style={{ color: 'var(--t2)' }}>{a.project || 'Site'} — {a.activity}</span>
                  {a.verdict && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ color: verdictColors[a.verdict] || 'var(--t3)' }}>{a.verdict}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--t3)' }}>{new Date(a.created_at).toLocaleString()}</span>
                  <button onClick={() => removeAnalysis(a.id)} className="text-xs px-1.5 py-0.5 rounded" style={{ color: 'var(--red)', border: '1px solid var(--bdr)' }}>✕</button>
                </div>
              </div>))}
        </div>
      )}

      {/* Upload Section */}
      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Project</label>
            <input value={project} onChange={e => setProject(e.target.value)} placeholder={activeProject?.name || 'Project name'}
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Activity</label>
            <select value={activity} onChange={e => setActivity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }}>
              {['General Construction','Excavation / Trenching','Steel Erection','Concrete Pour','Roofing','Scaffold Work','Crane Operations','Electrical','Hot Work / Welding','Confined Space','Demolition','Highway / Roadwork','Marine / Overwater'].map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Compliance Question (only in compliance mode) */}
        {mode === 'compliance' && (
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--blu)' }}>Compliance Question</label>
            <input value={complianceQuestion} onChange={e => setComplianceQuestion(e.target.value)}
              placeholder="Is this scaffold properly erected? Is the trench shored correctly? Are workers tied off properly?"
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--blu)' }} />
            <div className="flex gap-2 mt-2 flex-wrap">
              {['Is this scaffold OSHA compliant?','Is fall protection adequate?','Is the excavation properly shored?','Are workers wearing required PPE?','Is this crane setup safe?','Is the electrical panel compliant?'].map(q => (
                <button key={q} onClick={() => setComplianceQuestion(q)} className="text-[10px] px-2 py-1 rounded-lg transition-all hover:brightness-110"
                  style={{ background: 'var(--bg3)', color: 'var(--blu)', border: '1px solid var(--bdr)' }}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {/* Upload areas */}
        <div className="grid grid-cols-2 gap-3">
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-orange-500/50" style={{ borderColor: 'var(--bdr)' }}>
            <div className="text-3xl mb-2">📸</div><div className="text-sm font-semibold">Site Photos</div><div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>JPG, PNG — Multiple</div>
            <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={e => handlePhotos(e.target.files)} />
          </div>
          <div onClick={() => vidRef.current?.click()} className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-blue-500/50" style={{ borderColor: 'var(--bdr)' }}>
            <div className="text-3xl mb-2">🎥</div><div className="text-sm font-semibold">Video Walkthrough</div><div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>MP4, MOV — Max 60s</div>
            <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={e => handleVideo(e.target.files?.[0])} />
          </div>
        </div>

        {vidStatus && <div className="text-xs mt-2" style={{ color: vidStatus.startsWith('✓') ? 'var(--grn)' : 'var(--acc)' }}>{vidStatus}</div>}

        {allMedia.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-3">
            {allMedia.map((src, i) => (
              <div key={i} className="relative w-28 h-20 rounded-lg overflow-hidden" style={{ border: `1px solid ${i >= photos.length ? 'var(--blu)' : 'var(--bdr)'}` }}>
                <img src={src} className="w-full h-full object-cover" alt="" />
                {i >= photos.length && <div className="absolute bottom-0.5 left-0.5 text-[10px] px-1 rounded" style={{ background: 'var(--blu)', color: '#fff' }}>F{i - photos.length + 1}</div>}
                <button onClick={() => i < photos.length ? setPhotos(p => p.filter((_, j) => j !== i)) : setVideoFrames(f => f.filter((_, j) => j !== i - photos.length))}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center" style={{ background: 'var(--red)', color: '#fff' }}>✕</button>
              </div>))}
            <div className="text-xs self-end" style={{ color: 'var(--t3)' }}>{photos.length} photo(s){videoFrames.length ? ` + ${videoFrames.length} frames` : ''}</div>
          </div>
        )}

        <button onClick={mode === 'compliance' ? analyzeCompliance : analyzeHazards} disabled={analyzing || !allMedia.length}
          className="w-full mt-4 py-3 rounded-lg font-bold text-white text-sm transition-all"
          style={{ background: analyzing ? 'var(--bg3)' : mode === 'compliance' ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'linear-gradient(135deg, #f97316, #fb923c)', opacity: analyzing ? 0.6 : 1 }}>
          {analyzing ? 'Analyzing with Dual AI...' : mode === 'compliance' ? '✅ Check Compliance with Dual AI' : '⚠️ Scan for Hazards with Dual AI'}
        </button>
      </div>

      {/* ═══ VERDICT (Compliance Mode) ═══ */}
      {verdict && (
        <div className="rounded-xl p-6 mb-4 text-center" style={{
          background: verdict.status.includes('NON') ? 'rgba(239,68,68,.06)' : verdict.status === 'COMPLIANT' ? 'rgba(34,197,94,.06)' : 'rgba(234,179,8,.06)',
          border: `2px solid ${verdictColors[verdict.status] || 'var(--bdr)'}40`
        }}>
          <div className="font-mono text-3xl font-extrabold" style={{ color: verdictColors[verdict.status] }}>{verdict.status}</div>
          <div className="text-sm mt-1" style={{ color: 'var(--t2)' }}>Dual AI Confidence: <strong style={{ color: verdictColors[verdict.status] }}>{verdict.confidence}%</strong></div>
          <div className="text-xs mt-2" style={{ color: 'var(--t3)' }}>{verdict.summary}</div>
        </div>
      )}

      {/* ═══ CONSENSUS ENGINE ═══ */}
      {(claudeResult && gptResult) && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
          <button onClick={buildConsensus} disabled={buildingConsensus}
            className="w-full py-2.5 rounded-lg font-bold text-sm text-white transition-all"
            style={{ background: buildingConsensus ? 'var(--bg3)' : 'linear-gradient(135deg, #8b5cf6, #a78bfa)', opacity: buildingConsensus ? 0.6 : 1 }}>
            {buildingConsensus ? 'Building Consensus...' : consensus.length > 0 ? '🔄 Rebuild Consensus' : '🤝 Build Dual AI Consensus Report'}
          </button>
        </div>
      )}

      {consensus.length > 0 && (
        <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--pur)', borderLeft: '3px solid var(--pur)' }}>
          <h3 className="font-bold text-sm mb-3">🤝 Dual AI Consensus ({consensus.length} findings)</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <SC label="Both Agree" value={consensus.filter(c => c.confidence === 'HIGH').length} color="var(--grn)" />
            <SC label="Disagree (Review)" value={consensus.filter(c => c.confidence === 'REVIEW').length} color="var(--yel)" />
            <SC label="Single Model Only" value={consensus.filter(c => c.confidence === 'LOW').length} color="var(--red)" />
          </div>
          {consensus.map((c, i) => (
            <div key={i} className="flex items-center gap-3 py-2 text-sm" style={{ borderBottom: '1px solid var(--bg3)' }}>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{
                background: c.confidence === 'HIGH' ? 'rgba(34,197,94,.12)' : c.confidence === 'REVIEW' ? 'rgba(234,179,8,.12)' : 'rgba(239,68,68,.12)',
                color: c.confidence === 'HIGH' ? 'var(--grn)' : c.confidence === 'REVIEW' ? 'var(--yel)' : 'var(--red)'
              }}>{c.confidence}</span>
              <span style={{ color: 'var(--t2)' }}>{c.finding}</span>
              <span className="ml-auto flex gap-2 text-xs">
                <span style={{ color: c.claude ? 'var(--pur)' : 'var(--t3)' }}>{c.claude ? '✅ Claude' : '— Claude'}</span>
                <span style={{ color: c.gpt ? 'var(--blu)' : 'var(--t3)' }}>{c.gpt ? '✅ GPT-4o' : '— GPT-4o'}</span>
              </span>
              <span className="text-xs font-semibold" style={{ color: c.severity === 'Critical' ? 'var(--red)' : c.severity === 'High' ? 'var(--acc)' : 'var(--t3)' }}>{c.severity}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ AI RESULTS ═══ */}
      {(claudeResult || gptResult) && (
        <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderLeft: '3px solid var(--acc)' }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">Analysis Results</h3>
            <div className="flex gap-2">
              {mode === 'hazard' && (
                <button onClick={extractHazards} disabled={extractingHazards}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                  style={{ background: extractingHazards ? 'var(--bg3)' : 'linear-gradient(135deg, #ef4444, #f87171)', opacity: extractingHazards ? 0.6 : 1 }}>
                  {extractingHazards ? 'Extracting...' : hazardsCreated > 0 ? `✓ ${hazardsCreated} Hazards Created` : '⚠️ Auto-Generate Hazards'}
                </button>
              )}
              <button onClick={printAnalysis} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: '1px solid var(--bdr)', color: 'var(--t2)' }}>🖨️ Print</button>
            </div>
          </div>
          {hazardsCreated > 0 && <div className="rounded-lg p-3 mb-3 text-xs" style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)', color: 'var(--grn)' }}>✅ {hazardsCreated} hazard(s) auto-created in Hazard Manager.</div>}
          {claudeResult && (<div className="mb-4"><div className="text-xs font-semibold mb-1" style={{ color: 'var(--pur)' }}>Claude Analysis</div><div className="ai-result text-sm leading-relaxed max-h-96 overflow-y-auto" style={{ color: 'var(--t2)' }} dangerouslySetInnerHTML={{ __html: fmtMd(claudeResult) }} /></div>)}
          {gptResult && (<div><div className="text-xs font-semibold mb-1" style={{ color: 'var(--blu)' }}>GPT-4o Analysis</div><div className="ai-result text-sm leading-relaxed max-h-96 overflow-y-auto" style={{ color: 'var(--t2)' }} dangerouslySetInnerHTML={{ __html: fmtMd(gptResult) }} /></div>)}
        </div>
      )}

      {selectedAnalysis && !analyzing && (
        <div className="text-center text-xs py-2" style={{ color: 'var(--t3)' }}>
          Viewing saved analysis from {new Date(selectedAnalysis.created_at).toLocaleString()} •
          <button onClick={() => { setSelectedAnalysis(null); setClaudeResult(''); setGptResult(''); setVerdict(null); setConsensus([]) }} className="ml-1 underline" style={{ color: 'var(--acc)' }}>Clear</button>
        </div>
      )}
    </div>
  )
}
