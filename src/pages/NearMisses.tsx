import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'
import { HAZARD_CATEGORIES } from '../data/standards'
import { SC, FI, FS, FT, Card, LD, Empty, DelBtn, SeverityBadge, ExportCSVButton, PrintButton, printRecords } from '../components/SharedUI'
import { ProjectFilter } from '../components/ProjectFilter'

export function NearMisses() {
  const { user } = useAuth()
  const { activeProject } = useProject()
  const { data: nearMisses, add, remove, loading } = useData<any>('near_misses')
  const [showForm, setShowForm] = useState(false)

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    await add({
      description: fd.get('description'), category: fd.get('category'), severity: fd.get('severity'),
      location: fd.get('location'), anonymous: fd.get('anonymous') === 'on',
      project_id: activeProject?.id || '', project_name: activeProject?.name || '',
      created_by: fd.get('anonymous') === 'on' ? 'Anonymous' : (user?.user_metadata?.name || user?.email || ''),
      created_at: new Date().toISOString()
    })
    setShowForm(false)
  }

  const csvCols = [
    { key: 'description', label: 'Description' }, { key: 'category', label: 'Category' }, { key: 'severity', label: 'Severity' },
    { key: 'location', label: 'Location' }, { key: 'created_by', label: 'Reported By' }, { key: 'created_at', label: 'Date' }
  ]
  const printCols = [
    { key: 'description', label: 'Description', width: '35%' }, { key: 'category', label: 'Category' },
    { key: 'severity', label: 'Severity' }, { key: 'location', label: 'Location' }, { key: 'created_at', label: 'Date' }
  ]

  const now = new Date()
  const recent7 = nearMisses.filter((n: any) => new Date(n.created_at) > new Date(now.getTime() - 7 * 86400000)).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Near Miss Reports</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Leading indicator tracking — anonymous reporting supported — {activeProject?.name || 'All Projects'}</p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectFilter />
          <PrintButton onClick={() => printRecords('Near Miss Log', activeProject?.name || 'All Projects', nearMisses, printCols)} />
          <ExportCSVButton data={nearMisses} filename="near_misses" columns={csvCols} />
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>+ Report Near Miss</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <SC label="Total" value={nearMisses.length} color="var(--pur)" />
        <SC label="Last 7 Days" value={recent7} color="var(--acc)" />
        <SC label="Anonymous" value={nearMisses.filter((n: any) => n.anonymous).length} color="var(--blu)" />
        <SC label="High/Critical" value={nearMisses.filter((n: any) => n.severity === 'Critical' || n.severity === 'High').length} color="var(--red)" />
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><FT name="description" label="What happened?" placeholder="Describe the near miss in detail..." rows={3} /></div>
            <FS name="category" label="Category" options={HAZARD_CATEGORIES} />
            <FS name="severity" label="Potential Severity" options={['Critical','High','Moderate','Low']} />
            <FI name="location" label="Location" placeholder={activeProject?.location || 'Building A, Level 2'} />
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" name="anonymous" id="anon" className="w-4 h-4" />
              <label htmlFor="anon" className="text-sm" style={{ color: 'var(--t2)' }}>Report anonymously</label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-5 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Submit</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <LD /> : nearMisses.length === 0 ? <Empty msg="No near misses reported. Encourage reporting — they're the best leading indicator." icon="⚡" /> :
        nearMisses.map((nm: any) => (
          <Card key={nm.id} borderColor={nm.severity === 'Critical' ? 'var(--red)' : nm.severity === 'High' ? 'var(--acc)' : 'var(--pur)'}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{(nm.description || '').substring(0, 80)}{(nm.description || '').length > 80 ? '...' : ''}</span>
                <SeverityBadge severity={nm.severity} />
                {nm.anonymous && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg3)', color: 'var(--t3)' }}>Anonymous</span>}
              </div>
              <DelBtn onClick={() => remove(nm.id)} />
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{nm.category} • {nm.location || '—'} • {new Date(nm.created_at).toLocaleDateString()}</div>
          </Card>
        ))
      }
    </div>
  )
}
