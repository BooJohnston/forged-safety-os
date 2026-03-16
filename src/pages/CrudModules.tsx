import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'
import { HAZARD_CATEGORIES } from '../data/standards'
import { SC, FI, FS, FT, Card, LD, Empty, DelBtn, CloseBtn, SeverityBadge, ExportCSVButton, PrintButton, printRecords } from '../components/SharedUI'

// ═══ TRAINING TRACKER ═══
export function TrainingTracker() {
  const { data: training, add, remove, loading } = useData<any>('training')
  const [showForm, setShowForm] = useState(false)
  const expired = training.filter((t: any) => t.expires && new Date(t.expires) < new Date())

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    await add({ worker_name: fd.get('worker'), cert_type: fd.get('cert'), issued: fd.get('issued'), expires: fd.get('expires'), provider: fd.get('provider'), created_at: new Date().toISOString() })
    setShowForm(false)
  }

  const csvCols = [
    { key: 'worker_name', label: 'Worker' }, { key: 'cert_type', label: 'Certification' },
    { key: 'issued', label: 'Issued' }, { key: 'expires', label: 'Expires' }, { key: 'provider', label: 'Provider' }
  ]
  const printCols = [
    { key: 'worker_name', label: 'Worker', width: '20%' }, { key: 'cert_type', label: 'Certification', width: '25%' },
    { key: 'issued', label: 'Issued' }, { key: 'expires', label: 'Expires' }, { key: 'provider', label: 'Provider' }
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div><h1 className="text-2xl font-extrabold">Training Tracker</h1><p className="text-sm" style={{ color: 'var(--t3)' }}>Certifications, expiration alerts, compliance tracking</p></div>
        <div className="flex items-center gap-2">
          <PrintButton onClick={() => printRecords('Training & Certification Log', 'All Workers', training, printCols)} />
          <ExportCSVButton data={training} filename="training" columns={csvCols} />
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>+ Add Training</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <SC label="Total Records" value={training.length} color="var(--acc)" /><SC label="Expired" value={expired.length} color={expired.length > 0 ? 'var(--red)' : 'var(--grn)'} /><SC label="Current" value={training.length - expired.length} color="var(--grn)" />
      </div>
      {showForm && <form onSubmit={handleSave} className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
        <div className="grid grid-cols-2 gap-3">
          <FI name="worker" label="Worker Name" required /><FS name="cert" label="Certification" options={['OSHA 10-Hour','OSHA 30-Hour','First Aid/CPR','Competent Person - Excavation','Competent Person - Scaffolding','Competent Person - Fall Protection','NCCCO Crane Operator','Rigger - Qualified','Signal Person','Confined Space Entry','Hot Work/Fire Watch','Hazmat/HazWoper 40','Forklift/PIT','Aerial Lift','Silica Competent Person','Lead Awareness','Asbestos Awareness','Other']} />
          <FI name="issued" label="Date Issued" type="date" /><FI name="expires" label="Expiration Date" type="date" /><FI name="provider" label="Training Provider" /></div>
        <div className="flex gap-2 mt-3"><button type="submit" className="px-5 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Save</button>
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Cancel</button></div></form>}
      {loading ? <LD /> : training.length === 0 ? <Empty msg="No training records yet." icon="🎓" /> : training.map((t: any) => {
        const isExp = t.expires && new Date(t.expires) < new Date()
        return <Card key={t.id} borderColor={isExp ? 'var(--red)' : 'var(--grn)'}>
          <div className="flex justify-between items-center"><div><span className="font-semibold">{t.worker_name}</span><span className="ml-2 text-xs px-2 py-0.5 rounded font-semibold" style={{ background: isExp ? 'rgba(239,68,68,.12)' : 'rgba(34,197,94,.12)', color: isExp ? 'var(--red)' : 'var(--grn)' }}>{isExp ? 'EXPIRED' : 'CURRENT'}</span></div>
            <DelBtn onClick={() => remove(t.id)} /></div>
          <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{t.cert_type} | Issued: {t.issued || '—'} | Expires: {t.expires || 'N/A'} | Provider: {t.provider || '—'}</div>
        </Card>})}
    </div>)
}

// ═══ SDS CHEMICAL MANAGER ═══
export function SDSChemical() {
  const { data: sds, add, remove, loading } = useData<any>('sds')
  const [showForm, setShowForm] = useState(false)
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    await add({ name: fd.get('name'), cas: fd.get('cas'), manufacturer: fd.get('mfg'), sds_date: fd.get('sds_date'), location: fd.get('location'), ghs_hazard: fd.get('hazard'), ppe: fd.get('ppe'), first_aid: fd.get('first_aid'), spill_response: fd.get('spill'), created_at: new Date().toISOString() })
    setShowForm(false)
  }
  const csvCols = [
    { key: 'name', label: 'Chemical' }, { key: 'cas', label: 'CAS' }, { key: 'ghs_hazard', label: 'Hazard' },
    { key: 'location', label: 'Location' }, { key: 'ppe', label: 'PPE' }, { key: 'manufacturer', label: 'Manufacturer' }
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div><h1 className="text-2xl font-extrabold">SDS Chemical Manager</h1><p className="text-sm" style={{ color: 'var(--t3)' }}>GHS compliant — OSHA 29 CFR 1910.1200 HazCom</p></div>
        <div className="flex items-center gap-2">
          <PrintButton onClick={() => printRecords('SDS Chemical Inventory', 'HazCom Compliance', sds, [{ key: 'name', label: 'Chemical', width: '20%' }, { key: 'cas', label: 'CAS' }, { key: 'ghs_hazard', label: 'Hazard' }, { key: 'location', label: 'Location' }, { key: 'ppe', label: 'PPE' }])} />
          <ExportCSVButton data={sds} filename="sds_chemicals" columns={csvCols} />
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>+ Add Chemical</button>
        </div>
      </div>
      {showForm && <form onSubmit={handleSave} className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
        <div className="grid grid-cols-2 gap-3">
          <FI name="name" label="Chemical Name" required placeholder="Acetylene, E7018..." /><FI name="cas" label="CAS Number" placeholder="74-86-2" />
          <FI name="mfg" label="Manufacturer" /><FI name="sds_date" label="SDS Date" type="date" /><FI name="location" label="Storage Location" />
          <FS name="hazard" label="GHS Hazard Level" options={['Low','Moderate','High','Extreme']} />
          <FI name="ppe" label="Required PPE" placeholder="Gloves, goggles, respirator" /><FI name="first_aid" label="First Aid" placeholder="Skin: wash with soap..." />
          <div className="col-span-2"><FI name="spill" label="Spill Response" placeholder="Contain with absorbent..." /></div></div>
        <div className="flex gap-2 mt-3"><button type="submit" className="px-5 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Save</button>
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Cancel</button></div></form>}
      {loading ? <LD /> : sds.length === 0 ? <Empty msg="No chemicals registered." icon="☣️" /> : sds.map((s: any) => {
        const hc = s.ghs_hazard === 'Extreme' ? 'var(--red)' : s.ghs_hazard === 'High' ? 'var(--acc)' : s.ghs_hazard === 'Moderate' ? 'var(--yel)' : 'var(--grn)'
        return <Card key={s.id} borderColor={hc}>
          <div className="flex justify-between items-center"><div><span className="font-semibold">{s.name}</span><span className="ml-2 text-xs px-2 py-0.5 rounded font-semibold" style={{ color: hc }}>{s.ghs_hazard} HAZARD</span></div>
            <DelBtn onClick={() => remove(s.id)} /></div>
          <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>CAS: {s.cas || '—'} | Location: {s.location || '—'} | Mfg: {s.manufacturer || '—'} | PPE: {s.ppe || '—'}</div>
        </Card>})}
    </div>)
}

// ═══ ORIENTATION ═══
export function Orientation() {
  const { data: orientations, add, remove, loading } = useData<any>('orientations')
  const [showForm, setShowForm] = useState(false)
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    await add({ name: fd.get('name'), company: fd.get('company'), trade: fd.get('trade'), osha10: fd.get('osha10') === 'true', osha30: fd.get('osha30') === 'true', date: fd.get('date') || new Date().toISOString().split('T')[0], badge_issued: false, badge_number: '', created_at: new Date().toISOString() })
    setShowForm(false)
  }
  const csvCols = [
    { key: 'name', label: 'Name' }, { key: 'company', label: 'Company' }, { key: 'trade', label: 'Trade' },
    { key: 'osha10', label: 'OSHA 10' }, { key: 'osha30', label: 'OSHA 30' }, { key: 'date', label: 'Date' }
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div><h1 className="text-2xl font-extrabold">Site Orientation</h1><p className="text-sm" style={{ color: 'var(--t3)' }}>Worker check-in and safety orientation tracking</p></div>
        <div className="flex items-center gap-2">
          <PrintButton onClick={() => printRecords('Site Orientation Log', 'All Workers', orientations, [{ key: 'name', label: 'Name', width: '20%' }, { key: 'company', label: 'Company' }, { key: 'trade', label: 'Trade' }, { key: 'osha10', label: 'OSHA 10' }, { key: 'osha30', label: 'OSHA 30' }, { key: 'date', label: 'Date' }])} />
          <ExportCSVButton data={orientations} filename="orientations" columns={csvCols} />
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>+ Orient Worker</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <SC label="Total Oriented" value={orientations.length} color="var(--acc)" />
        <SC label="OSHA 10" value={orientations.filter((o: any) => o.osha10).length} color="var(--grn)" />
        <SC label="OSHA 30" value={orientations.filter((o: any) => o.osha30).length} color="var(--blu)" />
      </div>
      {showForm && <form onSubmit={handleSave} className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
        <div className="grid grid-cols-3 gap-3">
          <FI name="name" label="Full Name" required /><FI name="company" label="Company" /><FI name="trade" label="Trade" />
          <FI name="date" label="Date" type="date" />
          <FS name="osha10" label="OSHA 10-Hour" options={['false','true']} />
          <FS name="osha30" label="OSHA 30-Hour" options={['false','true']} /></div>
        <div className="flex gap-2 mt-3"><button type="submit" className="px-5 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Save</button>
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Cancel</button></div></form>}
      {loading ? <LD /> : orientations.length === 0 ? <Empty msg="No orientations recorded." icon="🎓" /> : orientations.map((o: any) => (
        <Card key={o.id} borderColor="var(--grn)">
          <div className="flex justify-between items-center"><div><span className="font-semibold">{o.name}</span>
            <span className="ml-1 text-xs" style={{ color: o.osha10 ? 'var(--grn)' : 'var(--red)' }}>{o.osha10 ? '✓' : '✗'} OSHA10</span>
            <span className="ml-1 text-xs" style={{ color: o.osha30 ? 'var(--grn)' : 'var(--red)' }}>{o.osha30 ? '✓' : '✗'} OSHA30</span></div>
            <DelBtn onClick={() => remove(o.id)} /></div>
          <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{o.company || '—'} | {o.trade || '—'} | {o.date}</div>
        </Card>))}
    </div>)
}

// ═══ AUDIT TRACKER ═══
export function AuditTracker() {
  const { data: audits, add, update, remove, loading } = useData<any>('audits')
  const [showForm, setShowForm] = useState(false)
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    await add({ type: fd.get('type'), category: fd.get('category'), severity: fd.get('severity'), finding: fd.get('finding'), osha_citation: fd.get('citation'), corrective_action: fd.get('corrective'), due_date: fd.get('due'), assigned_to: fd.get('assigned'), status: 'Open', created_at: new Date().toISOString() })
    setShowForm(false)
  }
  const overdue = audits.filter((a: any) => a.due_date && new Date(a.due_date) < new Date() && a.status !== 'Closed')
  const csvCols = [
    { key: 'finding', label: 'Finding' }, { key: 'type', label: 'Type' }, { key: 'category', label: 'Category' },
    { key: 'severity', label: 'Severity' }, { key: 'status', label: 'Status' }, { key: 'osha_citation', label: 'Citation' },
    { key: 'due_date', label: 'Due' }, { key: 'assigned_to', label: 'Assigned' }
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div><h1 className="text-2xl font-extrabold">Audit & Compliance</h1><p className="text-sm" style={{ color: 'var(--t3)' }}>Track findings, corrective actions, compliance scores</p></div>
        <div className="flex items-center gap-2">
          <PrintButton onClick={() => printRecords('Audit Findings', 'Compliance Tracker', audits, [{ key: 'finding', label: 'Finding', width: '30%' }, { key: 'severity', label: 'Severity' }, { key: 'status', label: 'Status' }, { key: 'osha_citation', label: 'Citation' }, { key: 'due_date', label: 'Due' }, { key: 'assigned_to', label: 'Assigned' }])} />
          <ExportCSVButton data={audits} filename="audits" columns={csvCols} />
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>+ New Finding</button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <SC label="Total" value={audits.length} color="var(--acc)" /><SC label="Open" value={audits.filter((a: any) => a.status === 'Open').length} color="var(--yel)" />
        <SC label="Overdue" value={overdue.length} color={overdue.length > 0 ? 'var(--red)' : 'var(--grn)'} /><SC label="Closed" value={audits.filter((a: any) => a.status === 'Closed').length} color="var(--grn)" />
      </div>
      {showForm && <form onSubmit={handleSave} className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
        <div className="grid grid-cols-3 gap-3">
          <FS name="type" label="Audit Type" options={['Internal','Corporate','Client','OSHA Inspection','Insurance','Mock OSHA']} />
          <FS name="category" label="Category" options={HAZARD_CATEGORIES} /><FS name="severity" label="Severity" options={['Low','Moderate','High','Critical','Willful','Repeat']} />
          <div className="col-span-2"><FI name="finding" label="Finding" required placeholder="Describe finding..." /></div><FI name="citation" label="OSHA Citation" placeholder="29 CFR 1926.XXX" />
          <div className="col-span-2"><FI name="corrective" label="Corrective Action" placeholder="Required action..." /></div><FI name="due" label="Due Date" type="date" /><FI name="assigned" label="Assigned To" /></div>
        <div className="flex gap-2 mt-3"><button type="submit" className="px-5 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Save</button>
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Cancel</button></div></form>}
      {loading ? <LD /> : audits.length === 0 ? <Empty msg="No findings." icon="✅" /> : audits.map((a: any) => {
        const isOD = a.due_date && new Date(a.due_date) < new Date() && a.status !== 'Closed'
        return <Card key={a.id} borderColor={isOD ? 'var(--red)' : a.status === 'Closed' ? 'var(--grn)' : 'var(--yel)'}>
          <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="font-semibold">{a.finding}</span>
            {isOD && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(239,68,68,.12)', color: 'var(--red)' }}>OVERDUE</span>}</div>
            <div className="flex gap-1">{a.status !== 'Closed' && <CloseBtn onClick={() => update(a.id, { status: 'Closed', closed_at: new Date().toISOString() })} />}
              <DelBtn onClick={() => remove(a.id)} /></div></div>
          <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{a.category} | {a.severity} | Due: {a.due_date || '—'} | {a.assigned_to || '—'}{a.osha_citation && <span style={{ color: 'var(--blu)' }}> | 📜 {a.osha_citation}</span>}</div>
        </Card>})}
    </div>)
}

// ═══ SETTINGS ═══
export function Settings() {
  const { user, signOut } = useAuth()
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-5">Settings</h1>
      <Card borderColor="var(--bdr)">
        <h3 className="font-bold text-sm mb-2">Account</h3>
        <div className="text-sm" style={{ color: 'var(--t2)' }}>
          <div>Email: {user?.email}</div>
          <div>Name: {user?.user_metadata?.name || '—'}</div>
          <div>Company: {user?.user_metadata?.company || '—'}</div>
          <div>Role: {user?.user_metadata?.role || '—'}</div>
        </div>
      </Card>
      <div className="mt-3"><Card borderColor="var(--bdr)">
        <h3 className="font-bold text-sm mb-2">About</h3>
        <div className="text-sm" style={{ color: 'var(--t2)' }}>
          FORGED Safety Intelligence OS<br />Version 4.1 — Weather Risk + OSHA Audit<br />30 Modules | Dual AI | Core 58 Standards | Print/Export<br />Weather-Linked Risk Engine | OSHA Audit Simulator<br />FORGED Educational Systems<br />Richard Johnston
        </div>
      </Card></div>
      <button onClick={signOut} className="mt-4 w-full py-3 rounded-lg text-sm font-bold" style={{ border: '1px solid var(--red)', color: 'var(--red)' }}>Sign Out</button>
    </div>)
}
