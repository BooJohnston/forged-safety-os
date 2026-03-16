import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'
import { SC, FI, FS, Card, LD, Empty, DelBtn, CloseBtn, ExportCSVButton, PrintButton, printRecords } from '../components/SharedUI'
import { ProjectFilter } from '../components/ProjectFilter'

export function Permits() {
  const { user } = useAuth()
  const { activeProject } = useProject()
  const { data: permits, add, update, remove, loading } = useData<any>('permits')
  const [showForm, setShowForm] = useState(false)

  const now = new Date()
  const active = permits.filter((p: any) => p.status === 'Active')
  const expired = permits.filter((p: any) => p.expires && new Date(p.expires) < now && p.status !== 'Closed')
  const expiring = permits.filter((p: any) => p.expires && new Date(p.expires) > now && new Date(p.expires) < new Date(now.getTime() + 24 * 3600000) && p.status !== 'Closed')

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    await add({
      type: fd.get('type'), location: fd.get('location'), issued: new Date().toISOString(),
      expires: fd.get('expires') ? new Date(fd.get('expires') as string).toISOString() : null,
      issued_by: fd.get('issued_by'), competent: fd.get('competent'), status: 'Active', notes: fd.get('notes'),
      project_id: activeProject?.id || '',
      created_at: new Date().toISOString()
    })
    setShowForm(false)
  }

  const csvCols = [
    { key: 'type', label: 'Permit Type' }, { key: 'location', label: 'Location' }, { key: 'status', label: 'Status' },
    { key: 'issued', label: 'Issued' }, { key: 'expires', label: 'Expires' }, { key: 'competent', label: 'Competent Person' }
  ]
  const printCols = [
    { key: 'type', label: 'Type', width: '20%' }, { key: 'location', label: 'Location' }, { key: 'status', label: 'Status' },
    { key: 'issued', label: 'Issued' }, { key: 'expires', label: 'Expires' }, { key: 'competent', label: 'Competent Person' }
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Permits</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Hot work, confined space, excavation permits — {activeProject?.name || 'All Projects'}</p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectFilter />
          <PrintButton onClick={() => printRecords('Permit Log', activeProject?.name || 'All Projects', permits, printCols)} />
          <ExportCSVButton data={permits} filename="permits" columns={csvCols} />
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>+ New Permit</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <SC label="Active" value={active.length} color="var(--acc)" />
        <SC label="Expired" value={expired.length} color={expired.length > 0 ? 'var(--red)' : 'var(--grn)'} />
        <SC label="Expiring <24h" value={expiring.length} color={expiring.length > 0 ? 'var(--yel)' : 'var(--grn)'} />
        <SC label="Total" value={permits.length} color="var(--blu)" />
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
          <div className="grid grid-cols-3 gap-3">
            <FS name="type" label="Permit Type" options={['Hot Work','Confined Space','Excavation','Electrical','LOTO','Crane/Lift','Demolition','Roof Access','Night Work','Other']} />
            <FI name="location" label="Location" placeholder="Building A, Level 2" />
            <FI name="expires" label="Expires" type="datetime-local" />
            <FI name="issued_by" label="Issued By" placeholder={user?.user_metadata?.name || ''} />
            <FI name="competent" label="Competent Person" placeholder="Name of competent person" />
            <FI name="notes" label="Notes" placeholder="Special conditions..." />
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" className="px-5 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Issue Permit</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <LD /> : permits.length === 0 ? <Empty msg="No permits issued." icon="📜" /> :
        permits.map((p: any) => {
          const isExp = p.expires && new Date(p.expires) < now && p.status !== 'Closed'
          const isExpiring = p.expires && new Date(p.expires) > now && new Date(p.expires) < new Date(now.getTime() + 24 * 3600000) && p.status !== 'Closed'
          return (
            <Card key={p.id} borderColor={isExp ? 'var(--red)' : isExpiring ? 'var(--yel)' : p.status === 'Closed' ? 'var(--t3)' : 'var(--grn)'}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.type}</span>
                  {isExp && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(239,68,68,.12)', color: 'var(--red)' }}>EXPIRED</span>}
                  {isExpiring && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(234,179,8,.12)', color: 'var(--yel)' }}>EXPIRING</span>}
                  {p.status === 'Closed' && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg3)', color: 'var(--t3)' }}>CLOSED</span>}
                </div>
                <div className="flex gap-1">
                  {p.status !== 'Closed' && <CloseBtn onClick={() => update(p.id, { status: 'Closed' })} />}
                  <DelBtn onClick={() => remove(p.id)} />
                </div>
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
                {p.location || '—'} • Competent: {p.competent || '—'} • Expires: {p.expires ? new Date(p.expires).toLocaleString() : 'N/A'}
              </div>
            </Card>
          )
        })
      }
    </div>
  )
}
