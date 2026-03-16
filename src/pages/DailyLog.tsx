import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'
import { SC, FI, FT, Card, LD, Empty, DelBtn, ExportCSVButton, PrintButton, printRecords } from '../components/SharedUI'
import { ProjectFilter } from '../components/ProjectFilter'

export function DailyLog() {
  const { user } = useAuth()
  const { activeProject } = useProject()
  const { data: logs, add, remove, loading } = useData<any>('daily_logs')
  const [showForm, setShowForm] = useState(false)

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    await add({
      date: fd.get('date') || new Date().toISOString().split('T')[0],
      weather: fd.get('weather'), manpower: parseInt(fd.get('manpower') as string) || 0,
      activities: fd.get('activities'), hazards_noted: fd.get('hazards'), permits_active: fd.get('permits'),
      incidents: fd.get('incidents'), notes: fd.get('notes'),
      project_id: activeProject?.id || '', project_name: activeProject?.name || '',
      created_by: user?.user_metadata?.name || user?.email || '', created_at: new Date().toISOString()
    })
    setShowForm(false)
  }

  const csvCols = [
    { key: 'date', label: 'Date' }, { key: 'weather', label: 'Weather' }, { key: 'manpower', label: 'Manpower' },
    { key: 'activities', label: 'Activities' }, { key: 'hazards_noted', label: 'Hazards' }, { key: 'incidents', label: 'Incidents' }, { key: 'notes', label: 'Notes' }
  ]
  const printCols = [
    { key: 'date', label: 'Date' }, { key: 'weather', label: 'Weather' }, { key: 'manpower', label: 'Crew' },
    { key: 'activities', label: 'Activities', width: '30%' }, { key: 'hazards_noted', label: 'Hazards' }, { key: 'incidents', label: 'Incidents' }
  ]

  const today = new Date().toISOString().split('T')[0]
  const hasToday = logs.some((l: any) => l.date === today)
  const totalManpower = logs.reduce((s: number, l: any) => s + (l.manpower || 0), 0)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Daily Safety Log</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>29 CFR 1904.33 daily documentation — {activeProject?.name || 'All Projects'}</p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectFilter />
          <PrintButton onClick={() => printRecords('Daily Safety Log', activeProject?.name || 'All Projects', logs, printCols)} />
          <ExportCSVButton data={logs} filename="daily_logs" columns={csvCols} />
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>+ New Entry</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <SC label="Total Entries" value={logs.length} color="var(--acc)" />
        <SC label="Today" value={hasToday ? '✓' : '—'} color={hasToday ? 'var(--grn)' : 'var(--yel)'} />
        <SC label="Total Manpower" value={totalManpower} color="var(--blu)" />
        <SC label="With Hazards" value={logs.filter((l: any) => l.hazards_noted && l.hazards_noted.trim()).length} color="var(--red)" />
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
          <div className="grid grid-cols-3 gap-3">
            <FI name="date" label="Date" type="date" />
            <FI name="weather" label="Weather" placeholder="Clear, 85°F, Winds 10mph" />
            <FI name="manpower" label="Manpower (headcount)" type="number" placeholder="45" />
            <div className="col-span-3"><FT name="activities" label="Activities" placeholder="Steel erection Level 4, concrete forming..." rows={2} /></div>
            <div className="col-span-2"><FT name="hazards" label="Hazards Noted" placeholder="Open floor edges, missing guardrails..." /></div>
            <FI name="permits" label="Active Permits" placeholder="Hot Work #3, Confined Space #1" />
            <div className="col-span-2"><FT name="incidents" label="Incidents / Near Misses" placeholder="None, or describe..." /></div>
            <FI name="notes" label="Notes" placeholder="OSHA visit scheduled tomorrow..." />
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" className="px-5 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <LD /> : logs.length === 0 ? <Empty msg="No daily logs yet. Start documenting today." icon="📋" /> :
        logs.map((log: any) => (
          <Card key={log.id} borderColor={log.hazards_noted && log.hazards_noted.trim() ? 'var(--yel)' : 'var(--grn)'}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{log.date || new Date(log.created_at).toLocaleDateString()}</span>
                <span className="text-xs" style={{ color: 'var(--t3)' }}>{log.weather}</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg3)', color: 'var(--blu)' }}>👷 {log.manpower || 0}</span>
              </div>
              <DelBtn onClick={() => remove(log.id)} />
            </div>
            {log.activities && <div className="text-sm mt-1" style={{ color: 'var(--t2)' }}>{log.activities}</div>}
            {log.hazards_noted && <div className="text-xs mt-1" style={{ color: 'var(--yel)' }}>⚠️ {log.hazards_noted}</div>}
            {log.incidents && log.incidents.trim() && <div className="text-xs mt-1" style={{ color: 'var(--red)' }}>🚨 {log.incidents}</div>}
          </Card>
        ))
      }
    </div>
  )
}
