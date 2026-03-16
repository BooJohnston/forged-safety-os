import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'

type AbatementPacket = {
  id: string; hazard_title: string; category: string; severity: string;
  osha_citation: string; before_photo: string; after_photo: string;
  corrective_action: string; verified_by: string; verified_date: string;
  status: string; project_id: string; project_name: string;
  created_by: string; created_at: string;
}

export function AbatementEvidence() {
  const { user } = useAuth()
  const { activeProject } = useProject()
  const { data: hazards } = useData<any>('hazards')
  const { data: packets, add, update, remove, loading } = useData<AbatementPacket>('inspections') // reusing inspections table for abatement
  const [showForm, setShowForm] = useState(false)
  const [beforePhoto, setBeforePhoto] = useState('')
  const [afterPhoto, setAfterPhoto] = useState('')
  const [selectedHazard, setSelectedHazard] = useState('')

  const openHazards = hazards.filter((h: any) => h.status === 'Open' || h.status === 'In Progress')

  const handlePhoto = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setter(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const hazard = openHazards.find((h: any) => h.id === selectedHazard)
    await add({
      type: 'Abatement Evidence',
      inspector: fd.get('verified_by') as string || user?.user_metadata?.name || '',
      area: hazard?.title || fd.get('hazard_title') as string,
      findings: JSON.stringify({
        hazard_title: hazard?.title || fd.get('hazard_title'),
        category: hazard?.category || fd.get('category'),
        severity: hazard?.severity || 'Moderate',
        osha_citation: hazard?.osha_ref || fd.get('osha_citation'),
        before_photo: beforePhoto,
        after_photo: afterPhoto,
        corrective_action: fd.get('corrective_action'),
        verified_by: fd.get('verified_by'),
        verified_date: fd.get('verified_date') || new Date().toISOString().split('T')[0],
        status: afterPhoto ? 'Verified' : 'Pending Verification',
        hazard_id: selectedHazard
      }),
      project_id: activeProject?.id || '',
      project_name: activeProject?.name || '',
      created_by: user?.user_metadata?.name || user?.email || '',
      created_at: new Date().toISOString()
    } as any)
    setShowForm(false); setBeforePhoto(''); setAfterPhoto(''); setSelectedHazard('')
  }

  const getPacketData = (p: any) => {
    try { return JSON.parse(p.findings) } catch { return null }
  }

  const printPacket = (p: any) => {
    const d = getPacketData(p)
    if (!d) return
    const w = window.open('', '', 'width=900,height=700')
    if (!w) return
    w.document.write(`<html><head><title>Abatement Evidence Packet</title><style>
body{font-family:Arial,sans-serif;padding:2rem;font-size:12px}
h1{font-size:18px;border-bottom:3px solid #f97316;padding-bottom:8px}
h2{font-size:14px;margin-top:16px;color:#c00}
table{width:100%;border-collapse:collapse;margin:8px 0}
th,td{border:1px solid #ccc;padding:8px;text-align:left}
th{background:#f5f5f5}
.photos{display:flex;gap:20px;margin:16px 0}
.photos div{flex:1;text-align:center}
.photos img{max-width:100%;max-height:300px;border:2px solid #333}
.sig{margin-top:40px;display:flex;gap:60px}
.sig div{border-top:1px solid #333;padding-top:6px;min-width:200px;font-size:11px}
.legal{margin-top:20px;padding:12px;border:2px solid #333;font-size:10px;background:#f9f9f9}
</style></head><body>`)
    w.document.write(`<h1>⛑️ ABATEMENT EVIDENCE PACKET</h1>`)
    w.document.write(`<table>
<tr><td><strong>Project:</strong> ${activeProject?.name || p.project_name || '—'}</td><td><strong>Date:</strong> ${new Date(p.created_at).toLocaleDateString()}</td></tr>
<tr><td><strong>Hazard:</strong> ${d.hazard_title || '—'}</td><td><strong>Category:</strong> ${d.category || '—'}</td></tr>
<tr><td><strong>Severity:</strong> ${d.severity || '—'}</td><td><strong>OSHA Citation:</strong> ${d.osha_citation || '—'}</td></tr>
<tr><td><strong>Corrective Action:</strong> ${d.corrective_action || '—'}</td><td><strong>Status:</strong> ${d.status || '—'}</td></tr>
<tr><td><strong>Verified By:</strong> ${d.verified_by || '—'}</td><td><strong>Verification Date:</strong> ${d.verified_date || '—'}</td></tr>
</table>`)
    w.document.write(`<h2>PHOTOGRAPHIC EVIDENCE</h2><div class="photos">`)
    if (d.before_photo) w.document.write(`<div><strong>BEFORE (Violation)</strong><br><img src="${d.before_photo}"><br><em>Timestamp: ${new Date(p.created_at).toLocaleString()}</em></div>`)
    if (d.after_photo) w.document.write(`<div><strong>AFTER (Corrected)</strong><br><img src="${d.after_photo}"><br><em>Timestamp: ${d.verified_date || new Date().toLocaleDateString()}</em></div>`)
    w.document.write(`</div>`)
    w.document.write(`<div class="legal"><strong>CERTIFICATION:</strong> I certify that the above corrective action has been completed and verified through direct observation. The hazardous condition identified has been abated and the work area restored to compliance with applicable OSHA standards and project safety requirements.</div>`)
    w.document.write(`<div class="sig"><div>Competent Person / Verifier<br><br><br>${d.verified_by || '________________'}</div><div>SSHO / Safety Manager<br><br><br>________________</div><div>Date<br><br><br>${d.verified_date || '________________'}</div></div>`)
    w.document.write(`<div style="margin-top:30px;font-size:9px;color:#666">FORGED Safety Intelligence OS — Abatement Evidence Packet — ${new Date().toLocaleDateString()}<br>This document constitutes a legal record of hazard abatement and should be retained per OSHA recordkeeping requirements (29 CFR 1904).</div>`)
    w.document.write(`</body></html>`)
    w.document.close(); w.print()
  }

  const abatementPackets = packets.filter((p: any) => p.type === 'Abatement Evidence')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Abatement Evidence</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Before/after photo pairs with legal chain of custody — your OSHA good faith defense.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>+ New Evidence Packet</button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[{ l: 'Total Packets', v: abatementPackets.length, c: 'var(--acc)' },
          { l: 'Verified', v: abatementPackets.filter((p: any) => { const d = getPacketData(p); return d?.status === 'Verified' }).length, c: 'var(--grn)' },
          { l: 'Pending', v: abatementPackets.filter((p: any) => { const d = getPacketData(p); return d?.status !== 'Verified' }).length, c: 'var(--yel)' }
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <div className="font-mono text-xl font-extrabold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-xs" style={{ color: 'var(--t3)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
          <h3 className="font-bold text-sm mb-3">New Abatement Evidence Packet</h3>

          {openHazards.length > 0 && (
            <div className="mb-3">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Link to Open Hazard (auto-populates fields)</label>
              <select value={selectedHazard} onChange={e => setSelectedHazard(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }}>
                <option value="">— Select hazard or enter manually below —</option>
                {openHazards.map((h: any) => <option key={h.id} value={h.id}>{h.severity}: {h.title} ({h.category})</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Hazard Title</label>
              <input name="hazard_title" defaultValue={openHazards.find((h: any) => h.id === selectedHazard)?.title || ''}
                placeholder="Missing guardrail south side level 3"
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>OSHA Citation</label>
              <input name="osha_citation" defaultValue={openHazards.find((h: any) => h.id === selectedHazard)?.osha_ref || ''}
                placeholder="29 CFR 1926.502(d)"
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
            </div>
          </div>

          {/* Photo upload */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--red)' }}>📸 BEFORE Photo (Violation)</label>
              <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer" style={{ borderColor: beforePhoto ? 'var(--red)' : 'var(--bdr)' }}
                onClick={() => document.getElementById('before-photo')?.click()}>
                {beforePhoto ? <img src={beforePhoto} className="max-h-40 mx-auto rounded" alt="Before" /> :
                  <div><div className="text-2xl">📸</div><div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>Click to capture/upload</div></div>}
                <input id="before-photo" type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto(setBeforePhoto)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--grn)' }}>📸 AFTER Photo (Corrected)</label>
              <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer" style={{ borderColor: afterPhoto ? 'var(--grn)' : 'var(--bdr)' }}
                onClick={() => document.getElementById('after-photo')?.click()}>
                {afterPhoto ? <img src={afterPhoto} className="max-h-40 mx-auto rounded" alt="After" /> :
                  <div><div className="text-2xl">📸</div><div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>Click to capture/upload</div></div>}
                <input id="after-photo" type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto(setAfterPhoto)} />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Corrective Action Taken</label>
            <textarea name="corrective_action" rows={3} required
              placeholder="Installed 42-inch guardrail system with mid-rail and toe board on south side level 3. Used steel pipe railing secured to concrete deck with base plates..."
              className="w-full px-3 py-2 rounded-lg text-sm resize-y" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Verified By (Competent Person)</label>
              <input name="verified_by" defaultValue={user?.user_metadata?.name || ''} required
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Verification Date</label>
              <input name="verified_date" type="date" defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-5 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>Save Evidence Packet</button>
            <button type="button" onClick={() => { setShowForm(false); setBeforePhoto(''); setAfterPhoto('') }} className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-center py-4 text-sm" style={{ color: 'var(--t3)' }}>Loading...</p> :
        abatementPackets.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <div className="text-4xl mb-3">📦</div>
            <p className="text-sm" style={{ color: 'var(--t3)' }}>No abatement evidence packets yet. This is your OSHA good faith defense — document the complete chain from violation to correction.</p>
          </div>
        ) : abatementPackets.map((p: any) => {
          const d = getPacketData(p)
          if (!d) return null
          return (
            <div key={p.id} className="rounded-xl p-4 mb-2" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderLeft: `3px solid ${d.status === 'Verified' ? 'var(--grn)' : 'var(--yel)'}` }}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold">{d.hazard_title}</span>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded font-semibold" style={{ background: d.status === 'Verified' ? 'rgba(34,197,94,.12)' : 'rgba(251,191,36,.12)', color: d.status === 'Verified' ? 'var(--grn)' : 'var(--yel)' }}>{d.status}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => printPacket(p)} className="px-3 py-1 rounded text-xs font-semibold" style={{ border: '1px solid var(--blu)', color: 'var(--blu)' }}>🖨️ Print Packet</button>
                  <button onClick={() => remove(p.id)} className="px-2 py-1 rounded text-xs" style={{ border: '1px solid var(--bdr)', color: 'var(--red)' }}>Del</button>
                </div>
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
                {d.category} | {d.osha_citation} | Verified: {d.verified_by} on {d.verified_date}
              </div>
              {d.corrective_action && <div className="text-xs mt-1" style={{ color: 'var(--t2)' }}>Action: {d.corrective_action}</div>}
              {(d.before_photo || d.after_photo) && (
                <div className="flex gap-3 mt-2">
                  {d.before_photo && <div className="text-center"><div className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--red)' }}>BEFORE</div><img src={d.before_photo} className="h-20 rounded" style={{ border: '2px solid var(--red)' }} alt="" /></div>}
                  {d.after_photo && <div className="text-center"><div className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--grn)' }}>AFTER</div><img src={d.after_photo} className="h-20 rounded" style={{ border: '2px solid var(--grn)' }} alt="" /></div>}
                </div>
              )}
            </div>
          )
        })
      }
    </div>
  )
}
