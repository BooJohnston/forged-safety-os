import { useState } from 'react'
import { useData } from '../hooks/useData'
import { useProject } from '../hooks/useProject'

export function Reports() {
  const { activeProject } = useProject()
  const { data: hazards } = useData<any>('hazards')
  const { data: incidents } = useData<any>('incidents')
  const { data: nearMisses } = useData<any>('near_misses')
  const { data: logs } = useData<any>('daily_logs')
  const { data: permits } = useData<any>('permits')
  const { data: training } = useData<any>('training')
  const { data: inspections } = useData<any>('inspections')
  const { data: orientations } = useData<any>('orientations')

  const reports = [
    { id: 'hazard', title: 'Hazard Register', icon: '⚠️', desc: 'All hazards with severity, status, OSHA citations', count: hazards.length },
    { id: 'incident', title: 'Incident Summary', icon: '🚨', desc: 'All incidents with root cause and corrective actions', count: incidents.length },
    { id: 'nearmiss', title: 'Near Miss Log', icon: '⚡', desc: 'Near miss reports with categories and trends', count: nearMisses.length },
    { id: 'daily', title: 'Daily Log Summary', icon: '📋', desc: 'All daily log entries with activities and conditions', count: logs.length },
    { id: 'permit', title: 'Permit Register', icon: '📜', desc: 'Active, expired, and closed permits', count: permits.length },
    { id: 'training', title: 'Training Matrix', icon: '🎓', desc: 'Worker certifications and expiration status', count: training.length },
    { id: 'inspection', title: 'Inspection Log', icon: '🔍', desc: 'All inspections with findings', count: inspections.length },
    { id: 'orientation', title: 'Orientation Log', icon: '🎓', desc: 'Worker orientation records with OSHA 10/30', count: orientations.length },
    { id: 'executive', title: 'Executive Dashboard', icon: '📊', desc: 'KPI summary — safety score, incident rate, compliance', count: null },
  ]

  const printReport = (id: string) => {
    const w = window.open('', '', 'width=900,height=700'); if (!w) return
    const proj = activeProject?.name || 'All Projects'
    const date = new Date().toLocaleDateString()
    const css = `<style>body{font-family:Arial,sans-serif;padding:2rem;font-size:11px}h1{font-size:18px;border-bottom:2px solid #f97316;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #ccc;padding:5px;text-align:left}th{background:#f5f5f5;font-weight:bold;font-size:10px}.footer{margin-top:30px;font-size:8px;color:#666}</style>`

    w.document.write(`<html><head><title>Report</title>${css}</head><body>`)

    if (id === 'hazard') {
      w.document.write(`<h1>HAZARD REGISTER</h1><p><b>Project:</b> ${proj} | <b>Date:</b> ${date} | <b>Total:</b> ${hazards.length}</p>`)
      w.document.write(`<table><tr><th>#</th><th>Hazard</th><th>Category</th><th>Severity</th><th>Status</th><th>OSHA Ref</th><th>Date</th></tr>`)
      hazards.forEach((h: any, i: number) => w.document.write(`<tr><td>${i+1}</td><td>${h.title||''}</td><td>${h.category||''}</td><td>${h.severity||''}</td><td>${h.status||''}</td><td>${h.osha_ref||''}</td><td>${h.created_at?new Date(h.created_at).toLocaleDateString():''}</td></tr>`))
      w.document.write(`</table>`)
    } else if (id === 'incident') {
      w.document.write(`<h1>INCIDENT SUMMARY</h1><p><b>Project:</b> ${proj} | <b>Date:</b> ${date} | <b>Total:</b> ${incidents.length}</p>`)
      w.document.write(`<table><tr><th>#</th><th>Title</th><th>Type</th><th>Severity</th><th>Root Cause</th><th>Date</th></tr>`)
      incidents.forEach((inc: any, i: number) => w.document.write(`<tr><td>${i+1}</td><td>${inc.title||''}</td><td>${inc.type||''}</td><td>${inc.severity||''}</td><td>${(inc.root_cause||'').substring(0,60)}</td><td>${inc.created_at?new Date(inc.created_at).toLocaleDateString():''}</td></tr>`))
      w.document.write(`</table>`)
    } else if (id === 'nearmiss') {
      w.document.write(`<h1>NEAR MISS LOG</h1><p><b>Project:</b> ${proj} | <b>Date:</b> ${date} | <b>Total:</b> ${nearMisses.length}</p>`)
      w.document.write(`<table><tr><th>#</th><th>Description</th><th>Category</th><th>Severity</th><th>Date</th></tr>`)
      nearMisses.forEach((n: any, i: number) => w.document.write(`<tr><td>${i+1}</td><td>${(n.description||'').substring(0,80)}</td><td>${n.category||''}</td><td>${n.severity||''}</td><td>${n.created_at?new Date(n.created_at).toLocaleDateString():''}</td></tr>`))
      w.document.write(`</table>`)
    } else if (id === 'daily') {
      w.document.write(`<h1>DAILY LOG SUMMARY</h1><p><b>Project:</b> ${proj} | <b>Date:</b> ${date} | <b>Entries:</b> ${logs.length}</p>`)
      w.document.write(`<table><tr><th>Date</th><th>Weather</th><th>Crew</th><th>Activities</th><th>Hazards</th></tr>`)
      logs.forEach((l: any) => w.document.write(`<tr><td>${l.date||''}</td><td>${l.weather||''}</td><td>${l.manpower||0}</td><td>${(l.activities||'').substring(0,80)}</td><td>${(l.hazards_noted||'None').substring(0,60)}</td></tr>`))
      w.document.write(`</table>`)
    } else if (id === 'permit') {
      w.document.write(`<h1>PERMIT REGISTER</h1><p><b>Project:</b> ${proj} | <b>Date:</b> ${date} | <b>Total:</b> ${permits.length}</p>`)
      w.document.write(`<table><tr><th>#</th><th>Type</th><th>Location</th><th>Status</th><th>Issued</th><th>Expires</th><th>Competent Person</th></tr>`)
      permits.forEach((p: any, i: number) => w.document.write(`<tr><td>${i+1}</td><td>${p.type||''}</td><td>${p.location||''}</td><td>${p.status||''}</td><td>${p.issued?new Date(p.issued).toLocaleDateString():''}</td><td>${p.expires?new Date(p.expires).toLocaleDateString():''}</td><td>${p.competent||''}</td></tr>`))
      w.document.write(`</table>`)
    } else if (id === 'training') {
      w.document.write(`<h1>TRAINING MATRIX</h1><p><b>Project:</b> ${proj} | <b>Date:</b> ${date} | <b>Records:</b> ${training.length}</p>`)
      w.document.write(`<table><tr><th>#</th><th>Worker</th><th>Certification</th><th>Issued</th><th>Expires</th><th>Status</th><th>Provider</th></tr>`)
      training.forEach((t: any, i: number) => { const exp = t.expires && new Date(t.expires) < new Date(); w.document.write(`<tr><td>${i+1}</td><td>${t.worker_name||''}</td><td>${t.cert_type||''}</td><td>${t.issued||''}</td><td>${t.expires||'N/A'}</td><td style="color:${exp?'red':'green'}">${exp?'EXPIRED':'CURRENT'}</td><td>${t.provider||''}</td></tr>`) })
      w.document.write(`</table>`)
    } else if (id === 'inspection') {
      w.document.write(`<h1>INSPECTION LOG</h1><p><b>Project:</b> ${proj} | <b>Date:</b> ${date} | <b>Total:</b> ${inspections.length}</p>`)
      w.document.write(`<table><tr><th>#</th><th>Type</th><th>Inspector</th><th>Area</th><th>Findings</th><th>Date</th></tr>`)
      inspections.forEach((insp: any, i: number) => w.document.write(`<tr><td>${i+1}</td><td>${insp.type||''}</td><td>${insp.inspector||''}</td><td>${insp.area||''}</td><td>${(insp.findings||'').substring(0,80)}</td><td>${insp.created_at?new Date(insp.created_at).toLocaleDateString():''}</td></tr>`))
      w.document.write(`</table>`)
    } else if (id === 'orientation') {
      w.document.write(`<h1>ORIENTATION LOG</h1><p><b>Project:</b> ${proj} | <b>Date:</b> ${date} | <b>Total:</b> ${orientations.length}</p>`)
      w.document.write(`<table><tr><th>#</th><th>Name</th><th>Company</th><th>Trade</th><th>OSHA 10</th><th>OSHA 30</th><th>Badge</th><th>Date</th><th>Signature</th></tr>`)
      orientations.forEach((o: any, i: number) => w.document.write(`<tr><td>${i+1}</td><td>${o.name||''}</td><td>${o.company||''}</td><td>${o.trade||''}</td><td>${o.osha10?'✓':'✗'}</td><td>${o.osha30?'✓':'✗'}</td><td>${o.badge_number||'—'}</td><td>${o.date||''}</td><td style="min-width:120px"></td></tr>`))
      w.document.write(`</table>`)
    } else if (id === 'executive') {
      const open = hazards.filter((h: any) => h.status === 'Open' || h.status === 'In Progress').length
      const closed = hazards.filter((h: any) => h.status === 'Closed').length
      const score = hazards.length > 0 ? Math.round(closed / hazards.length * 100) : 100
      const expiredPerms = permits.filter((p: any) => p.expires && new Date(p.expires) < new Date() && p.status !== 'Closed').length
      const expiredCerts = training.filter((t: any) => t.expires && new Date(t.expires) < new Date()).length
      w.document.write(`<h1>EXECUTIVE SAFETY DASHBOARD</h1><p><b>Project:</b> ${proj} | <b>Date:</b> ${date}</p>`)
      w.document.write(`<h2 style="font-size:14px;margin-top:16px;color:#f97316">KEY METRICS</h2>`)
      w.document.write(`<table><tr><th>Metric</th><th>Value</th><th>Status</th></tr>`)
      w.document.write(`<tr><td>Safety Score</td><td>${score}%</td><td style="color:${score>=80?'green':'red'}">${score>=80?'GOOD':'NEEDS ATTENTION'}</td></tr>`)
      w.document.write(`<tr><td>Open Hazards</td><td>${open}</td><td style="color:${open>5?'red':'green'}">${open>5?'HIGH':'OK'}</td></tr>`)
      w.document.write(`<tr><td>Total Incidents (30d)</td><td>${incidents.length}</td><td style="color:${incidents.length>0?'red':'green'}">${incidents.length>0?'REVIEW':'CLEAN'}</td></tr>`)
      w.document.write(`<tr><td>Near Misses</td><td>${nearMisses.length}</td><td>LEADING INDICATOR</td></tr>`)
      w.document.write(`<tr><td>Expired Permits</td><td>${expiredPerms}</td><td style="color:${expiredPerms>0?'red':'green'}">${expiredPerms>0?'ACTION REQUIRED':'OK'}</td></tr>`)
      w.document.write(`<tr><td>Expired Training</td><td>${expiredCerts}</td><td style="color:${expiredCerts>0?'red':'green'}">${expiredCerts>0?'ACTION REQUIRED':'OK'}</td></tr>`)
      w.document.write(`<tr><td>Workers Oriented</td><td>${orientations.length}</td><td>ON RECORD</td></tr>`)
      w.document.write(`<tr><td>Daily Logs</td><td>${logs.length}</td><td>DOCUMENTED</td></tr></table>`)
    }

    w.document.write(`<div class="footer">FORGED Safety Intelligence OS — Report Generated ${new Date().toLocaleString()}</div></body></html>`)
    w.document.close(); w.print()
  }

  const exportCSV = (id: string) => {
    let csv = ''; let filename = ''
    if (id === 'hazard') {
      csv = 'Title,Category,Severity,Status,OSHA Ref,Date\n'
      hazards.forEach((h: any) => csv += `"${h.title||''}","${h.category||''}","${h.severity||''}","${h.status||''}","${h.osha_ref||''}","${h.created_at?new Date(h.created_at).toLocaleDateString():''}"\n`)
      filename = 'hazard-register'
    } else if (id === 'incident') {
      csv = 'Title,Type,Severity,Root Cause,Date\n'
      incidents.forEach((i: any) => csv += `"${i.title||''}","${i.type||''}","${i.severity||''}","${(i.root_cause||'').replace(/"/g,"'")}","${i.created_at?new Date(i.created_at).toLocaleDateString():''}"\n`)
      filename = 'incident-summary'
    } else if (id === 'training') {
      csv = 'Worker,Certification,Issued,Expires,Status,Provider\n'
      training.forEach((t: any) => { const exp = t.expires && new Date(t.expires) < new Date(); csv += `"${t.worker_name||''}","${t.cert_type||''}","${t.issued||''}","${t.expires||'N/A'}","${exp?'EXPIRED':'CURRENT'}","${t.provider||''}"\n` })
      filename = 'training-matrix'
    } else if (id === 'orientation') {
      csv = 'Name,Company,Trade,OSHA10,OSHA30,Badge,Date\n'
      orientations.forEach((o: any) => csv += `"${o.name||''}","${o.company||''}","${o.trade||''}","${o.osha10?'Yes':'No'}","${o.osha30?'Yes':'No'}","${o.badge_number||''}","${o.date||''}"\n`)
      filename = 'orientation-log'
    } else return

    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Reports Engine</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--t3)' }}>Print-ready reports and CSV exports from all safety data — {activeProject?.name || 'All Projects'}</p>

      <div className="grid grid-cols-3 gap-3">
        {reports.map(r => (
          <div key={r.id} className="rounded-xl p-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{r.icon}</span>
              <div>
                <div className="font-semibold text-sm">{r.title}</div>
                {r.count !== null && <div className="text-xs font-mono" style={{ color: 'var(--acc)' }}>{r.count} records</div>}
              </div>
            </div>
            <div className="text-xs mb-3" style={{ color: 'var(--t3)' }}>{r.desc}</div>
            <div className="flex gap-2">
              <button onClick={() => printReport(r.id)} className="flex-1 py-1.5 rounded text-xs font-semibold" style={{ border: '1px solid var(--blu)', color: 'var(--blu)' }}>🖨️ Print</button>
              {['hazard','incident','training','orientation'].includes(r.id) && (
                <button onClick={() => exportCSV(r.id)} className="flex-1 py-1.5 rounded text-xs font-semibold" style={{ border: '1px solid var(--grn)', color: 'var(--grn)' }}>📥 CSV</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
