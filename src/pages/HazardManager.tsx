import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'
import { HAZARD_CATEGORIES, SEVERITY_LEVELS } from '../data/standards'
import { SC, FI, FS, FT, Card, LD, Empty, DelBtn, CloseBtn, SeverityBadge, StatusBadge, ExportCSVButton, PrintButton, printRecords } from '../components/SharedUI'
import { ProjectFilter } from '../components/ProjectFilter'

export function HazardManager() {
  const { user } = useAuth()
  const { activeProject } = useProject()
  const { data: hazards, add, update, remove, loading } = useData<any>('hazards')
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('All')

  const open = hazards.filter((h: any) => h.status === 'Open' || h.status === 'In Progress')
  const critical = open.filter((h: any) => h.severity === 'Critical')
  const overdue = open.filter((h: any) => h.due_date && new Date(h.due_date) < new Date())
  const closed = hazards.filter((h: any) => h.status === 'Closed')

  const filtered = filter === 'All' ? hazards : filter === 'Open' ? open : filter === 'Critical' ? critical : filter === 'Overdue' ? overdue : closed

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    await add({
      title: fd.get('title'), category: fd.get('category'), severity: fd.get('severity'),
      description: fd.get('description'), osha_ref: fd.get('osha_ref'), corrective_action: fd.get('corrective'),
      due_date: fd.get('due_date') || null, status: 'Open', source: 'Manual Entry',
      project: activeProject?.name || '', project_id: activeProject?.id || '',
      created_by: user?.user_metadata?.name || user?.email || '', created_at: new Date().toISOString()
    })
    setShowForm(false)
  }

  const csvColumns = [
    { key: 'title', label: 'Hazard' }, { key: 'category', label: 'Category' }, { key: 'severity', label: 'Severity' },
    { key: 'status', label: 'Status' }, { key: 'osha_ref', label: 'OSHA Ref' }, { key: 'due_date', label: 'Due Date' },
    { key: 'corrective_action', label: 'Corrective Action' }, { key: 'created_at', label: 'Date' }
  ]
  const printCols = [
    { key: 'title', label: 'Hazard', width: '25%' }, { key: 'category', label: 'Category' }, { key: 'severity', label: 'Severity' },
    { key: 'status', label: 'Status' }, { key: 'osha_ref', label: 'OSHA Ref' }, { key: 'due_date', label: 'Due' }, { key: 'created_at', label: 'Date' }
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Hazard Manager</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Track, prioritize, and close hazards — {activeProject?.name || 'All Projects'}</p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectFilter />
          <PrintButton onClick={() => printRecords('Hazard Log', activeProject?.name || 'All Projects', filtered, printCols)} />
          <ExportCSVButton data={filtered} filename="hazards" columns={csvColumns} />
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>+ New Hazard</button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-4">
        <SC label="Open" value={open.length} color={open.length > 5 ? 'var(--red)' : 'var(--acc)'} />
        <SC label="Critical" value={critical.length} color={critical.length > 0 ? 'var(--red)' : 'var(--grn)'} />
        <SC label="Overdue" value={overdue.length} color={overdue.length > 0 ? 'var(--red)' : 'var(--grn)'} />
        <SC label="Closed" value={closed.length} color="var(--grn)" />
        <SC label="Total" value={hazards.length} color="var(--blu)" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {['All', 'Open', 'Critical', 'Overdue', 'Closed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{ background: filter === f ? 'rgba(249,115,22,.15)' : 'transparent', color: filter === f ? 'var(--acc)' : 'var(--t3)', border: `1px solid ${filter === f ? 'var(--acc)' : 'var(--bdr)'}` }}>
            {f} {f === 'All' ? `(${hazards.length})` : f === 'Open' ? `(${open.length})` : f === 'Critical' ? `(${critical.length})` : f === 'Overdue' ? `(${overdue.length})` : `(${closed.length})`}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
          <h3 className="font-bold text-sm mb-3">New Hazard</h3>
          <div className="grid grid-cols-3 gap-3">
            <FI name="title" label="Hazard Title" required placeholder="Missing guardrail on Level 3" />
            <FS name="category" label="Category" options={HAZARD_CATEGORIES} />
            <FS name="severity" label="Severity" options={[...SEVERITY_LEVELS]} />
            <div className="col-span-2"><FT name="description" label="Description" placeholder="Detailed description of the hazard..." /></div>
            <FI name="osha_ref" label="OSHA Reference" placeholder="29 CFR 1926.501(b)(1)" />
            <div className="col-span-2"><FT name="corrective" label="Corrective Action" placeholder="Install guardrails, barricade area..." /></div>
            <FI name="due_date" label="Due Date" type="date" />
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" className="px-5 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <LD /> : filtered.length === 0 ? <Empty msg="No hazards found." icon="✅" /> :
        filtered.map((h: any) => {
          const isOverdue = h.due_date && new Date(h.due_date) < new Date() && h.status !== 'Closed'
          const borderColor = h.severity === 'Critical' ? 'var(--red)' : h.severity === 'High' ? 'var(--acc)' : h.status === 'Closed' ? 'var(--grn)' : 'var(--yel)'
          return (
            <Card key={h.id} borderColor={borderColor}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{h.title}</span>
                  <SeverityBadge severity={h.severity} />
                  <StatusBadge status={h.status} />
                  {isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(239,68,68,.12)', color: 'var(--red)' }}>OVERDUE</span>}
                  {h.source === 'Photo Analysis AI' && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(168,85,247,.12)', color: 'var(--pur)' }}>📸 AI</span>}
                </div>
                <div className="flex gap-1">
                  {h.status !== 'Closed' && <CloseBtn onClick={() => update(h.id, { status: 'Closed', closed_at: new Date().toISOString() })} />}
                  <DelBtn onClick={() => remove(h.id)} />
                </div>
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
                {h.category} {h.osha_ref && <span style={{ color: 'var(--blu)' }}>• 📜 {h.osha_ref}</span>} • Due: {h.due_date || '—'} • {new Date(h.created_at).toLocaleDateString()}
              </div>
              {h.description && <div className="text-sm mt-1" style={{ color: 'var(--t2)' }}>{h.description}</div>}
              {h.corrective_action && <div className="text-xs mt-1" style={{ color: 'var(--grn)' }}>Fix: {h.corrective_action}</div>}
            </Card>
          )
        })
      }
    </div>
  )
}
