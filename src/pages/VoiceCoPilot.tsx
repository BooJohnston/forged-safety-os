import { useState, useRef } from 'react'
import { callClaude } from '../lib/ai'
import { SAFETY_SYSTEM_PROMPT } from '../data/standards'
import { useProject } from '../hooks/useProject'

type QA = { q: string; a: string; ts: string }

export function VoiceCoPilot() {
  const { activeProject } = useProject()
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<QA[]>([])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const recRef = useRef<any>(null)

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Speech recognition not supported in this browser. Use Chrome.'); return }
    const rec = new SR()
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      setQuestion(text)
      setListening(false)
      // Auto-submit after 1 second
      setTimeout(() => askQuestion(text), 500)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
    recRef.current = rec
    setListening(true)
  }

  const stopListening = () => {
    if (recRef.current) recRef.current.stop()
    setListening(false)
  }

  const askQuestion = async (q?: string) => {
    const query = q || question
    if (!query.trim()) return
    setLoading(true)

    const prompt = `${SAFETY_SYSTEM_PROMPT}\n\nSPECIFIC TASK: You are a Construction Safety Expert AI Co-Pilot. Answer this question using WHAT-WHY-HOW.\n\nProject context: ${activeProject?.name || 'General construction'} — ${activeProject?.framework || 'OSHA'}\n\nQUESTION: ${query}\n\nProvide:\n**WHAT** — Direct answer with specific requirements\n**WHY** — OSHA citations, NFPA, ANSI, USACE references from Core 58\n**HOW** — Step-by-step actions, responsible parties, documentation\n\nBe specific. Cite exact standards. Keep answer concise and field-ready.`

    try {
      const data = await callClaude([{ role: 'user', content: prompt }], 2000)
      const answer = data.content?.[0]?.text || 'No response'
      setHistory(prev => [{ q: query, a: answer, ts: new Date().toISOString() }, ...prev])

      // Speak the first sentence
      if ('speechSynthesis' in window) {
        const firstSentence = answer.split(/[.!?]\s/)[0] + '.'
        const clean = firstSentence.replace(/\*\*/g, '').replace(/📜/g, '').replace(/[✅⚠️🔍]/g, '')
        const utter = new SpeechSynthesisUtterance(clean)
        utter.rate = 0.95
        speechSynthesis.speak(utter)
      }
    } catch (e: any) {
      setHistory(prev => [{ q: query, a: 'Error: ' + e.message, ts: new Date().toISOString() }, ...prev])
    }
    setQuestion('')
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Voice Safety Co-Pilot</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--t3)' }}>Ask safety questions by voice or text. AI responds with OSHA-referenced answers and speaks the response.</p>

      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
        <div className="flex gap-3">
          <button onClick={listening ? stopListening : startListening}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl shrink-0 transition-all"
            style={{
              background: listening ? 'var(--red)' : 'linear-gradient(135deg, #f97316, #fb923c)',
              animation: listening ? 'pulse 1s infinite' : 'none',
              boxShadow: listening ? '0 0 20px rgba(239,68,68,.5)' : 'none'
            }}>
            {listening ? '⏹' : '🎤'}
          </button>
          <div className="flex-1">
            <input value={question} onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askQuestion()}
              placeholder={listening ? 'Listening...' : 'Ask a safety question — "Do I need a fire watch for hot work?" "What PPE is required for confined space entry?"'}
              className="w-full px-4 py-3 rounded-lg text-sm"
              style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
            <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
              {listening ? '🔴 Listening — speak your question...' : 'Press the mic button or type and hit Enter'}
            </div>
          </div>
          <button onClick={() => askQuestion()} disabled={loading || !question.trim()}
            className="px-5 rounded-lg font-bold text-sm text-white self-start"
            style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', opacity: loading ? 0.5 : 1, height: '48px' }}>
            {loading ? '...' : 'Ask'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4 text-sm" style={{ color: 'var(--acc)' }}>
          Analyzing with Core 58 Standards Database...
        </div>
      )}

      {history.map((qa, i) => (
        <div key={i} className="rounded-xl p-5 mb-3" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
          <div className="flex items-start gap-3 mb-3">
            <div className="text-lg">💬</div>
            <div>
              <div className="font-semibold text-sm">{qa.q}</div>
              <div className="text-xs" style={{ color: 'var(--t3)' }}>{new Date(qa.ts).toLocaleTimeString()}</div>
            </div>
          </div>
          <div className="ai-result text-sm leading-relaxed" style={{ color: 'var(--t2)', borderTop: '1px solid var(--bdr)', paddingTop: '.75rem' }}
            dangerouslySetInnerHTML={{ __html: formatMd(qa.a) }} />
        </div>
      ))}

      {history.length === 0 && !loading && (
        <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
          <div className="text-4xl mb-3">🎤</div>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Ask any construction safety question. The AI will cite OSHA, NFPA, ANSI, and USACE standards from the Core 58 database.</p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {['Fall protection requirements','Trench safety 5 feet','Hot work fire watch','Confined space entry','Crane critical lift','Arc flash PPE','Scaffold competent person'].map(q => (
              <button key={q} onClick={() => { setQuestion(q); askQuestion(q) }}
                className="px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{ border: '1px solid var(--bdr)', color: 'var(--t2)' }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatMd(t: string): string {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.+)$/gm,'<h4 style="color:var(--acc);font-size:.9rem;margin:.8rem 0 .2rem">$1</h4>')
    .replace(/^## (.+)$/gm,'<h3 style="color:var(--acc);font-size:1rem;margin:1rem 0 .3rem">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/(29 CFR [\d.]+[\w.]*)/g,'<span style="color:var(--blu);font-weight:600">$1</span>')
    .replace(/(NFPA [\d.]+[\w.]*)/g,'<span style="color:var(--blu);font-weight:600">$1</span>')
    .replace(/(EM 385[\-\d.\s\w]*)/g,'<span style="color:var(--pur);font-weight:600">$1</span>')
    .replace(/(AWS D[\d.]+[\w.]*)/g,'<span style="color:var(--acc);font-weight:600">$1</span>')
    .replace(/\n/g,'<br>')
}
