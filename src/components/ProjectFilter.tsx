import { useProject } from '../hooks/useProject'

// Project filter dropdown - add to any data module
export function ProjectFilter({ showAll = true }: { showAll?: boolean }) {
  const { activeProject, projects, setActiveProject } = useProject()

  if (projects.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: 'var(--t3)' }}>Project:</span>
      <select
        value={activeProject?.id || ''}
        onChange={e => {
          if (e.target.value === '') setActiveProject(null)
          else {
            const p = projects.find(proj => proj.id === e.target.value)
            if (p) setActiveProject(p)
          }
        }}
        className="px-3 py-1.5 rounded-lg text-xs"
        style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1px solid var(--bdr)', maxWidth: '220px' }}>
        {showAll && <option value="">All Projects</option>}
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  )
}

// Onboarding welcome for new users
export function WelcomeFlow({ onDismiss }: { onDismiss: () => void }) {
  const steps = [
    { num: 1, icon: '🏗️', title: 'Create a Project', desc: 'Go to Projects and create your first project. Enter the name, location, GC, SSHO, and work scopes. Then click "Set Active" — this project becomes the context for everything you do.', link: '/projects' },
    { num: 2, icon: '📸', title: 'Scan Your First Photo', desc: 'Go to Photo Analysis, snap a photo of your job site, and hit "Analyze with Dual AI." Two AI engines will identify hazards with OSHA citations and confidence ratings.', link: '/photos' },
    { num: 3, icon: '📋', title: 'Log Your Day', desc: 'Open Daily Log and record today\'s activities, weather, crew count, and any hazards observed. This feeds into your Weekly Report automatically.', link: '/daily' },
    { num: 4, icon: '✅', title: 'Run Pre-Start Check', desc: 'Before work begins each morning, run the Pre-Start Readiness check. The AI pulls permits, JHAs, training, and hazards to give you a GO / NO-GO verdict.', link: '/prestart' },
    { num: 5, icon: '🔍', title: 'Do a Walkdown Inspection', desc: 'Enter inspection findings line by line — each finding automatically creates a hazard case in the Hazard Manager for tracking and closeout.', link: '/inspections' },
    { num: 6, icon: '🎯', title: 'Generate Your Risk Forecast', desc: 'The Predictive Risk Engine analyzes ALL your project data and generates a 7-day risk forecast with OSHA Focus Four analysis.', link: '/risk' },
  ]

  return (
    <div className="rounded-xl p-6 mb-4" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,.08), rgba(251,146,60,.04))', border: '1px solid rgba(249,115,22,.3)' }}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-extrabold">Welcome to FORGED Safety Intelligence OS</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>Follow these steps to get your safety program running. Each step builds on the last.</p>
        </div>
        <button onClick={onDismiss} className="text-xs px-3 py-1 rounded-lg" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Dismiss</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {steps.map(s => (
          <a key={s.num} href={s.link} className="rounded-xl p-4 transition-all" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', color: 'white' }}>{s.num}</div>
              <span className="text-lg">{s.icon}</span>
            </div>
            <div className="font-semibold text-sm mb-1">{s.title}</div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--t3)' }}>{s.desc}</div>
          </a>
        ))}
      </div>
      <div className="mt-4 text-center">
        <p className="text-xs" style={{ color: 'var(--t3)' }}>After completing these steps, explore Toolbox Talks, Voice Co-Pilot, JHA Builder, and the full Reports Engine.</p>
      </div>
    </div>
  )
}
