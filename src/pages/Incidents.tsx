import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'
import { SC, FI, FS, FT, Card, LD, Empty, DelBtn, SeverityBadge, ExportCSVButton, PrintButton, printRecords } from '../components/SharedUI'
import { ProjectFilter } from '../components/ProjectFilter'

export function Incidents() {
  const { user } = useAuth()
  const { activeProject } = useProject()
  const { data: incidents, add, remove, loading } = useData<any>('incidents')
  const [showForm, setShowForm] = useState(false)

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    await add({
      title: fd.get('title'), description: fd.get('description'), severity: fd.get('severity'),
      type: fd.get('type'), location: fd.get('location'), injuries: fd.get('injuries'),
      root_cause: fd.get('root_cause'), corrective_action: fd.get('corrective'),
      project_id: activeProject?.id || '', project_name: activeProject?.name || '',
      created_by: user?.user_metadata?.name || user?.email || '', created_at: new Date().toISOString()
    })
    setShowForm(false)
  }

  const csvCols = [
    { key: 'title', label: 'Incident' }, { key: 'type', label: 'Type' }, { key: 'severity', label: 'Severity' },
    { key: 'location', label: 'Location' }, { key: 'injuries', label: 'Injuries' }, { key: 'root_cause', label: 'Root Cause' },
    { key: 'corrective_action', label: 'Corrective Action' }, { key: 'created_at', label: 'Date' }
  ]
  const printCols = [
    { key: 'title', label: 'Incident', width: '20%' }, { key: 'type', label: 'Type' }, { key: 'severity', label: 'Severity' },
    { key: 'location', label: 'Location' }, { key: 'root_cause', label: 'Root Cause' }, { key: 'created_at', label: 'Date' }
  ]

  const now = new Date()
  const recent7 = incidents.filter((i: any) => new Date(i.created_at) > new Date(now.getTime() - 7 * 86400000)).length
  const recent30 = incidents.filter((i: any) => new Date(i.created_at) > new Date(now.getTime() - 30 * 86400000)).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Incident Reports</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Document incidents with root cause analysis — {activeProject?.name || 'All Projects'}</p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectFilter />
          <PrintButton onClick={() => printRecords('Incident Log', activeProject?.name || 'All Projects', incidents, printCols)} />
          <ExportCSVButton data={incidents} filename="incidents" columns={csvCols} />
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>+ Report Incident</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <SC label="Total" value={incidents.length} color="var(--acc)" />
        <SC label="Last 7 Days" value={recent7} color={recent7 > 0 ? 'var(--red)' : 'var(--grn)'} />
        <SC label="Last 30 Days" value={recent30} color={recent30 > 2 ? 'var(--red)' : 'var(--yel)'} />
        <SC label="Critical" value={incidents.filter((i: any) => i.severity === 'Critical').length} color="var(--red)" />
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
          <div className="grid grid-cols-2 gap-3">
            <FI name="title" label="Incident Title" placeholder="Worker struck by falling debris" required />
            <FS name="type" label="Type" options={['Injury','Property Damage','Near Miss Escalated','Environmental','Vehicle','Equipment Failure','Fire','Other']} />
            <FS name="severity" label="Severity" options={['Critical','High','Moderate','Low']} />
            <FI name="location" label="Location" placeholder={activeProject?.location || 'Building A, Level 2'} />
            <div className="col-span-2"><FT name="description" label="Description" placeholder="Detailed account of what happened..." /></div>
            <FT name="injuries" label="Injuries" placeholder="None, or describe injuries and treatment..." />
            <FT name="root_cause" label="Root Cause" placeholder="Contributing factors..." />
            <div className="col-span-2"><FT name="corrective" label="Corrective Actions" placeholder="Required corrective actions..." /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-5 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Save Incident</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <LD /> : incidents.length === 0 ? <Empty msg="No incidents reported." icon="✅" /> :
        incidents.map((inc: any) => (
          <Card key={inc.id} borderColor={inc.severity === 'Critical' ? 'var(--red)' : inc.severity === 'High' ? 'var(--acc)' : 'var(--yel)'}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{inc.title}</span>
                <SeverityBadge severity={inc.severity} />
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg3)', color: 'var(--t3)' }}>{inc.type}</span>
              </div>
              <DelBtn onClick={() => remove(inc.id)} />
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{inc.location} • {new Date(inc.created_at).toLocaleDateString()}</div>
            {inc.description && <div className="text-sm mt-1" style={{ color: 'var(--t2)' }}>{inc.description}</div>}
            {inc.root_cause && <div className="text-xs mt-1" style={{ color: 'var(--yel)' }}>Root Cause: {inc.root_cause}</div>}
          </Card>
        ))
      }
    </div>
  )
}
