import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { WelcomeFlow } from '../components/ProjectFilter'

export function Dashboard() {
  const { activeProject, projects } = useProject()
  const { data: hazards } = useData<any>('hazards')
  const { data: incidents } = useData<any>('incidents')
  const { data: nearMisses } = useData<any>('near_misses')
  const { data: dailyLogs } = useData<any>('daily_logs')
  const { data: permits } = useData<any>('permits')
  const { data: training } = useData<any>('training')
  const { data: audits } = useData<any>('audits')
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('safety-welcome-dismissed'))

  const open = hazards.filter((h: any) => h.status === 'Open' || h.status === 'In Progress')
  const critical = open.filter((h: any) => h.severity === 'Critical')
  const closedCount = hazards.filter((h: any) => h.status === 'Closed').length
  const safetyScore = hazards.length > 0 ? Math.round((closedCount / hazards.length) * 100) : 100
  const now = new Date()
  const recentIncidents = incidents.filter((i: any) => new Date(i.created_at) > new Date(now.getTime() - 30 * 86400000)).length
  const closedWeek = hazards.filter((h: any) => h.status === 'Closed' && h.closed_at && new Date(h.closed_at) > new Date(now.getTime() - 7 * 86400000)).length

  const expiredPermits = permits.filter((p: any) => p.expires && new Date(p.expires) < now && p.status !== 'Closed')
  const expiringPermits = permits.filter((p: any) => p.expires && new Date(p.expires) > now && new Date(p.expires) < new Date(now.getTime() + 24 * 3600000) && p.status !== 'Closed')
  const expiredTraining = training.filter((t: any) => t.expires && new Date(t.expires) < now)
  const overdueAudits = audits.filter((a: any) => a.due_date && new Date(a.due_date) < now && a.status !== 'Closed')
  const overdueHazards = open.filter((h: any) => h.due_date && new Date(h.due_date) < now)

  const allAlerts = [
    ...expiredPermits.map((p: any) => ({ type: 'EXPIRED PERMIT', msg: p.type, icon: '📜', color: 'var(--red)', link: '/permits' })),
    ...expiringPermits.map((p: any) => ({ type: 'EXPIRING <24HR', msg: p.type, icon: '⏰', color: 'var(--yel)', link: '/permits' })),
    ...expiredTraining.map((t: any) => ({ type: 'EXPIRED CERT', msg: `${t.worker_name}: ${t.cert_type}`, icon: '🎓', color: 'var(--red)', link: '/training' })),
    ...overdueAudits.map((a: any) => ({ type: 'OVERDUE FINDING', msg: (a.finding || '').substring(0, 50), icon: '✅', color: 'var(--red)', link: '/audit' })),
    ...overdueHazards.map((h: any) => ({ type: 'OVERDUE HAZARD', msg: (h.title || '').substring(0, 50), icon: '⚠️', color: 'var(--red)', link: '/hazards' })),
    ...critical.map((h: any) => ({ type: 'CRITICAL HAZARD', msg: (h.title || '').substring(0, 50), icon: '🔴', color: 'var(--red)', link: '/hazards' })),
  ]

  // OSHA 2024 penalty rates
  const penaltyEstimate = open.reduce((sum: number, h: any) => {
    if (h.severity === 'Critical') return sum + 161323
    if (h.severity === 'High') return sum + 16131
    if (h.severity === 'Moderate') return sum + 8066
    return sum
  }, 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div><h1 className="text-2xl font-extrabold">Safety Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Real-time safety intelligence — {activeProject?.name || 'All Projects'}</p></div>
        <div className="text-xs text-right" style={{ color: 'var(--t3)' }}>{new Date().toLocaleString()}</div></div>

      {showWelcome && hazards.length === 0 && incidents.length === 0 && (
        <WelcomeFlow onDismiss={() => { setShowWelcome(false); localStorage.setItem('safety-welcome-dismissed', '1') }} />
      )}

      {allAlerts.length > 0 && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.25)' }}>
          <div className="flex items-center gap-2 mb-2"><span className="text-lg">🚨</span><span className="font-bold text-sm" style={{ color: 'var(--red)' }}>{allAlerts.length} Active Alert{allAlerts.length > 1 ? 's' : ''}</span></div>
          <div className="grid grid-cols-2 gap-1.5">
            {allAlerts.slice(0, 8).map((a, i) => (
              <a key={i} href={a.link} className="flex items-center gap-2 px-3 py-1.5 rounded text-xs" style={{ background: 'rgba(239,68,68,.08)', color: a.color }}>
                <span>{a.icon}</span><strong>{a.type}:</strong><span style={{ color: 'var(--t2)' }}>{a.msg}</span></a>))}
          </div></div>)}

      <div className="grid grid-cols-5 gap-3 mb-3">
        <SC label="Open Hazards" value={open.length} color={open.length > 5 ? 'var(--red)' : 'var(--acc)'} />
        <SC label="Critical" value={critical.length} color={critical.length > 0 ? 'var(--red)' : 'var(--grn)'} />
        <SC label="Overdue" value={overdueHazards.length + overdueAudits.length} color={overdueHazards.length + overdueAudits.length > 0 ? 'var(--red)' : 'var(--grn)'} />
        <SC label="Incidents (30d)" value={recentIncidents} color={recentIncidents > 0 ? 'var(--red)' : 'var(--grn)'} />
        <SC label="Near Misses" value={nearMisses.length} color="var(--pur)" /></div>
      <div className="grid grid-cols-5 gap-3 mb-4">
        <SC label="Daily Logs" value={dailyLogs.length} color="var(--acc)" />
        <SC label="Closed (7d)" value={closedWeek} color="var(--grn)" />
        <SC label="Total Hazards" value={hazards.length} color="var(--blu)" />
        <SC label="Safety Score" value={`${safetyScore}%`} color={safetyScore >= 80 ? 'var(--grn)' : safetyScore >= 60 ? 'var(--yel)' : 'var(--red)'} />
        <SC label="Penalty Exposure" value={`$${penaltyEstimate.toLocaleString()}`} color={penaltyEstimate > 0 ? 'var(--red)' : 'var(--grn)'} sub="OSHA 2024 Estimate" /></div>

      {projects.length > 1 && (
        <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
          <h3 className="font-bold text-sm mb-3">Multi-Project Overview</h3>
          <div className="grid grid-cols-3 gap-2">
            {projects.slice(0, 6).map((p: any) => {
              const ph = hazards.filter((h: any) => h.project_id === p.id || h.project === p.name)
              const po = ph.filter((h: any) => h.status === 'Open' || h.status === 'In Progress').length
              const pc = ph.filter((h: any) => h.status === 'Closed').length
              const ps = ph.length > 0 ? Math.round(pc / ph.length * 100) : 100
              const sc = ps >= 80 ? 'var(--grn)' : ps >= 60 ? 'var(--yel)' : 'var(--red)'
              return (<div key={p.id} className="rounded-lg p-3" style={{ background: 'var(--bg3)', border: activeProject?.id === p.id ? '1px solid var(--grn)' : '1px solid var(--bdr)' }}>
                <div className="flex justify-between items-center"><span className="text-xs font-semibold">{p.name}</span><span className="font-mono text-sm font-extrabold" style={{ color: sc }}>{ps}%</span></div>
                <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}><div className="h-full rounded-full" style={{ width: `${ps}%`, background: sc }} /></div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--t3)' }}>{po} open | {pc} closed</div></div>)})}</div></div>)}

      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
        <h3 className="font-bold text-sm mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2">
          {[{ i: '📸', l: 'Photo Hazard Scan', h: '/photos' }, { i: '⚠️', l: 'Log New Hazard', h: '/hazards' }, { i: '📋', l: 'Daily Log', h: '/daily' }, { i: '✅', l: 'Pre-Start Check', h: '/prestart' },
            { i: '🚨', l: 'Report Incident', h: '/incidents' }, { i: '🔧', l: 'Toolbox Talk', h: '/toolbox' }, { i: '🎤', l: 'Voice Co-Pilot', h: '/voice' }, { i: '📊', l: 'Generate Report', h: '/reports' }
          ].map((a, idx) => (<a key={idx} href={a.h} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', color: 'var(--t2)' }}><span>{a.i}</span><span>{a.l}</span></a>))}</div></div>

      <div className="rounded-xl p-5" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
        <h3 className="font-bold text-sm mb-3">Recent Activity</h3>
        {hazards.length === 0 && incidents.length === 0 ? <p className="text-sm text-center py-4" style={{ color: 'var(--t3)' }}>No activity yet.</p> :
          <div className="space-y-1">
            {[...hazards.map((h: any) => ({ ...h, _t: '⚠️' })), ...incidents.map((i: any) => ({ ...i, _t: '🚨' })), ...nearMisses.map((n: any) => ({ ...n, _t: '⚡' }))]
              .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
              .slice(0, 10).map((it: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-1.5 text-sm" style={{ borderBottom: '1px solid var(--bg3)' }}>
                  <div className="flex items-center gap-2"><span>{it._t}</span><span style={{ color: 'var(--t2)' }}>{(it.title || it.description || 'Entry').substring(0, 55)}</span>
                    {it.severity && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ color: it.severity === 'Critical' ? 'var(--red)' : it.severity === 'High' ? 'var(--acc)' : 'var(--t3)' }}>{it.severity}</span>}</div>
                  <span className="text-xs" style={{ color: 'var(--t3)' }}>{new Date(it.created_at).toLocaleDateString()}</span></div>))}</div>}</div>
    </div>)
}

function SC({ label, value, color, sub }: { label: string; value: any; color: string; sub?: string }) {
  return <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
    <div className="font-mono text-xl font-extrabold" style={{ color }}>{value}</div>
    <div className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>{label}</div>
    {sub && <div className="text-[9px]" style={{ color: 'var(--t3)' }}>{sub}</div>}</div>
}
