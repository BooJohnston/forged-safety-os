// ═══ SHARED UI COMPONENTS ═══
// Eliminates duplicate FI, FS, FT, SC, Card, LD, Empty, fmtMd across all modules
import { useRef } from 'react'
import { getFrameworkBadge, isUSACE, getTerm } from '../data/standards'

// ─── Framework Badge ───
export function FrameworkBadge({ framework }: { framework?: string }) {
  const badge = getFrameworkBadge(framework)
  return (
    <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: badge.bg, color: badge.color }}>
      {badge.text}
    </span>
  )
}

// ─── Stat Card ───
export function SC({ label, value, color, sub }: { label: string; value: any; color: string; sub?: string }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
      <div className="font-mono text-xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>{label}</div>
      {sub && <div className="text-[9px]" style={{ color: 'var(--t3)' }}>{sub}</div>}
    </div>
  )
}

// ─── Form Input ───
export function FI({ name, label, placeholder, required, type, value, onChange, className }: {
  name: string; label: string; placeholder?: string; required?: boolean; type?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>{label}</label>
      <input name={name} type={type || 'text'} placeholder={placeholder} required={required} value={value} onChange={onChange}
        className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
    </div>
  )
}

// ─── Form Select ───
export function FS({ name, label, options, value, onChange }: {
  name: string; label: string; options: string[]; value?: string; onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>{label}</label>
      <select name={name} value={value} onChange={onChange}
        className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ─── Form Textarea ───
export function FT({ name, label, placeholder, rows, value, onChange }: {
  name: string; label: string; placeholder?: string; rows?: number; value?: string; onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>{label}</label>
      <textarea name={name} rows={rows || 2} placeholder={placeholder} value={value} onChange={onChange}
        className="w-full px-3 py-2 rounded-lg text-sm resize-y" style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
    </div>
  )
}

// ─── Card ───
export function Card({ children, borderColor, onClick }: { children: React.ReactNode; borderColor: string; onClick?: () => void }) {
  return (
    <div className={`rounded-xl p-4 mb-2 ${onClick ? 'cursor-pointer hover:brightness-105 transition-all' : ''}`}
      style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderLeft: `3px solid ${borderColor}` }}
      onClick={onClick}>
      {children}
    </div>
  )
}

// ─── Loading ───
export function LD() {
  return <p className="text-center py-4 text-sm" style={{ color: 'var(--t3)' }}>Loading...</p>
}

// ─── Empty State ───
export function Empty({ msg, icon }: { msg: string; icon?: string }) {
  return (
    <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <p className="text-sm" style={{ color: 'var(--t3)' }}>{msg}</p>
    </div>
  )
}

// ─── Page Header ───
export function PageHeader({ title, subtitle, action, actionLabel, onAction }: {
  title: string; subtitle: string; action?: boolean; actionLabel?: string; onAction?: () => void
}) {
  return (
    <div className="flex justify-between items-center mb-5">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="text-sm" style={{ color: 'var(--t3)' }}>{subtitle}</p>
      </div>
      {action && (
        <button onClick={onAction} className="px-4 py-2 rounded-lg font-bold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>
          {actionLabel || '+ New'}
        </button>
      )}
    </div>
  )
}

// ─── AI Result Display ───
export function AIResult({ text, label, color }: { text: string; label?: string; color?: string }) {
  if (!text) return null
  return (
    <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderLeft: `3px solid ${color || 'var(--acc)'}` }}>
      {label && <div className="text-xs font-semibold mb-2" style={{ color: color || 'var(--acc)' }}>{label}</div>}
      <div className="ai-result text-sm leading-relaxed max-h-96 overflow-y-auto" style={{ color: 'var(--t2)' }}
        dangerouslySetInnerHTML={{ __html: fmtMd(text) }} />
    </div>
  )
}

// ─── Analyze Button ───
export function AnalyzeButton({ onClick, analyzing, label }: { onClick: () => void; analyzing: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={analyzing}
      className="w-full py-3 rounded-lg font-bold text-sm text-white transition-all"
      style={{ background: analyzing ? 'var(--bg3)' : 'linear-gradient(135deg, #f97316, #fb923c)', opacity: analyzing ? 0.6 : 1 }}>
      {analyzing ? 'Analyzing...' : label || '🧠 Analyze with AI'}
    </button>
  )
}

// ─── Severity Badge ───
export function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    Critical: 'var(--red)', High: 'var(--acc)', Moderate: 'var(--yel)', Low: 'var(--grn)'
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ color: colors[severity] || 'var(--t3)' }}>
      {severity}
    </span>
  )
}

// ─── Status Badge ───
export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Open: 'var(--yel)', 'In Progress': 'var(--blu)', Closed: 'var(--grn)', Pending: 'var(--t3)'
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded font-semibold"
      style={{ background: `${colors[status] || 'var(--t3)'}15`, color: colors[status] || 'var(--t3)' }}>
      {status}
    </span>
  )
}

// ─── Delete Button ───
export function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick() }}
      className="px-2 py-1 rounded text-xs transition-all hover:bg-red-500/10"
      style={{ border: '1px solid var(--bdr)', color: 'var(--red)' }}>
      Del
    </button>
  )
}

// ─── Close Button (for hazards/audits) ───
export function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick() }}
      className="px-2 py-1 rounded text-xs transition-all hover:bg-green-500/10"
      style={{ border: '1px solid var(--grn)', color: 'var(--grn)' }}>
      Close
    </button>
  )
}

// ─── Print Module ───
export function PrintButton({ onClick, label }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
      style={{ border: '1px solid var(--bdr)', color: 'var(--t2)' }}>
      🖨️ {label || 'Print'}
    </button>
  )
}

// ─── Export CSV ───
export function ExportCSVButton({ data, filename, columns }: {
  data: any[]; filename: string; columns: { key: string; label: string }[]
}) {
  const handleExport = () => {
    if (!data.length) return
    const header = columns.map(c => c.label).join(',')
    const rows = data.map(row =>
      columns.map(c => {
        const val = row[c.key]
        if (val === null || val === undefined) return ''
        const str = String(val).replace(/"/g, '""')
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str
      }).join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <button onClick={handleExport}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
      style={{ border: '1px solid var(--bdr)', color: 'var(--t2)' }}>
      📥 Export CSV
    </button>
  )
}

// ─── Print All Records (generic print function) ───
export function printRecords(title: string, subtitle: string, records: any[], columns: { key: string; label: string; width?: string }[]) {
  const w = window.open('', '', 'width=1000,height=800')
  if (!w) return
  w.document.write(`<html><head><title>${title}</title><style>
    body { font-family: Arial, sans-serif; padding: 1.5rem; font-size: 11px; color: #333; }
    h1 { font-size: 18px; color: #1a1a2e; border-bottom: 2px solid #f97316; padding-bottom: 6px; margin-bottom: 4px; }
    h2 { font-size: 12px; color: #666; font-weight: normal; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f5f5f5; text-align: left; padding: 6px 8px; border: 1px solid #ddd; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 5px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: top; }
    tr:nth-child(even) { background: #fafafa; }
    .footer { margin-top: 20px; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; display: flex; justify-content: space-between; }
    .sev-Critical { color: #dc2626; font-weight: bold; } .sev-High { color: #f97316; font-weight: bold; }
    .sev-Moderate { color: #eab308; } .sev-Low { color: #22c55e; }
    .status-Open { color: #eab308; } .status-Closed { color: #22c55e; } .status-In-Progress { color: #3b82f6; }
    @media print { body { padding: 0; } }
  </style></head><body>`)
  w.document.write(`<h1>${title}</h1><h2>${subtitle} — Generated ${new Date().toLocaleString()}</h2>`)
  w.document.write('<table><tr>')
  columns.forEach(c => w.document.write(`<th${c.width ? ` style="width:${c.width}"` : ''}>${c.label}</th>`))
  w.document.write('</tr>')
  records.forEach(r => {
    w.document.write('<tr>')
    columns.forEach(c => {
      let val = r[c.key] ?? '—'
      if (c.key === 'severity') val = `<span class="sev-${val}">${val}</span>`
      if (c.key === 'status') val = `<span class="status-${String(val).replace(/\s/g, '-')}">${val}</span>`
      if (c.key === 'created_at' && val !== '—') val = new Date(val).toLocaleDateString()
      w.document.write(`<td>${val}</td>`)
    })
    w.document.write('</tr>')
  })
  w.document.write('</table>')
  w.document.write(`<div class="footer"><span>FORGED Safety Intelligence OS — ${records.length} records</span><span>29 CFR 1904.33 — Record Retention</span></div>`)
  w.document.write('</body></html>')
  w.document.close(); w.print()
}

// ─── Markdown Formatter (with OSHA citation highlighting) ───
export function fmtMd(t: string): string {
  return t
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h4 style="color:var(--acc);font-size:.9rem;margin:.8rem 0 .2rem">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="color:var(--acc);font-size:1rem;margin:1rem 0 .3rem">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="color:var(--acc);font-size:1.1rem;margin:1.2rem 0 .4rem">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:1rem">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:1rem">$1</li>')
    .replace(/(29 CFR [\d.]+[\w.(--)]*)/g, '<span style="color:var(--blu);font-weight:600">$1</span>')
    .replace(/(NFPA [\d.]+[\w.]*)/g, '<span style="color:var(--blu);font-weight:600">$1</span>')
    .replace(/(EM 385[\-\d.\s\w]*)/g, '<span style="color:var(--pur);font-weight:600">$1</span>')
    .replace(/(ANSI [A-Z]\d+[\w.]*)/g, '<span style="color:var(--pur);font-weight:600">$1</span>')
    .replace(/\n/g, '<br>')
}
