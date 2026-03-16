import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'
import { SC, FI, FS, FT, Card, LD, Empty, DelBtn, ExportCSVButton, PrintButton, printRecords } from '../components/SharedUI'
import { ProjectFilter } from '../components/ProjectFilter'

export function Inspections() {
  const { user } = useAuth()
  const { activeProject } = useProject()
  const { data: inspections, add, remove, loading } = useData<any>('inspections')
  const [showForm, setShowForm] = useState(false)

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    await add({
      type: fd.get('type'), inspector: fd.get('inspector'), area: fd.get('area'), findings: fd.get('findings'),
      project_id: activeProject?.id || '', project_name: activeProject?.name || '',
      created_by: user?.user_metadata?.name || user?.email || '', created_at: new Date().toISOString()
    })
    setShowForm(false)
  }

  const csvCols = [
    { key: 'type', label: 'Type' }, { key: 'inspector', label: 'Inspector' }, { key: 'area', label: 'Area' },
    { key: 'findings', label: 'Findings' }, { key: 'created_at', label: 'Date' }
  ]
  const printCols = [
    { key: 'type', label: 'Type' }, { key: 'inspector', label: 'Inspector' }, { key: 'area', label: 'Area' },
    { key: 'findings', label: 'Findings', width: '40%' }, { key: 'created_at', label: 'Date' }
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Inspections</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Site inspections and safety walk-throughs — {activeProject?.name || 'All Projects'}</p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectFilter />
          <PrintButton onClick={() => printRecords('Inspection Log', activeProject?.name || 'All Projects', inspections, printCols)} />
          <ExportCSVButton data={inspections} filename="inspections" columns={csvCols} />
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>+ New Inspection</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <SC label="Total" value={inspections.length} color="var(--acc)" />
        <SC label="This Week" value={inspections.filter((i: any) => new Date(i.created_at) > new Date(Date.now() - 7 * 86400000)).length} color="var(--blu)" />
        <SC label="With Findings" value={inspections.filter((i: any) => i.findings && i.findings.trim()).length} color="var(--yel)" />
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
          <div className="grid grid-cols-3 gap-3">
            <FS name="type" label="Inspection Type" options={['Daily Walk-Through','Weekly Safety','Monthly Audit','Pre-Task','Equipment','Scaffold','Fall Protection','Crane','Excavation','Electrical','Fire Protection','OSHA Consultation','Other']} />
            <FI name="inspector" label="Inspector" placeholder={user?.user_metadata?.name || ''} />
            <FI name="area" label="Area / Location" placeholder="Building A, Level 3" />
            <div className="col-span-3"><FT name="findings" label="Findings" placeholder="Describe any findings, deficiencies, or positive observations..." rows={3} /></div>
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" className="px-5 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <LD /> : inspections.length === 0 ? <Empty msg="No inspections recorded." icon="🔍" /> :
        inspections.map((ins: any) => (
          <Card key={ins.id} borderColor={ins.findings && ins.findings.trim() ? 'var(--yel)' : 'var(--grn)'}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{ins.type}</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg3)', color: 'var(--t3)' }}>{ins.area}</span>
              </div>
              <DelBtn onClick={() => remove(ins.id)} />
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>Inspector: {ins.inspector || '—'} • {new Date(ins.created_at).toLocaleDateString()}</div>
            {ins.findings && <div className="text-sm mt-1" style={{ color: 'var(--t2)' }}>{ins.findings}</div>}
          </Card>
        ))
      }
    </div>
  )
}
