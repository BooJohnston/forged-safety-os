import { useState } from 'react'
import { useProject } from '../hooks/useProject'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function Projects() {
  const { user } = useAuth()
  const { projects, activeProject, setActiveProject, refreshProjects } = useProject()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
    const { error } = await supabase.from('safety_projects').insert({
      id, user_id: user.id,
      name: fd.get('name') as string,
      type: fd.get('type') as string,
      location: fd.get('location') as string,
      city: fd.get('city') as string,
      zip: fd.get('zip') as string,
      state: fd.get('state') as string,
      framework: fd.get('framework') as string,
      status: fd.get('status') as string,
      scopes: fd.get('scopes') as string,
      gc: fd.get('gc') as string,
      ssho: fd.get('ssho') as string,
      created_by: user.user_metadata?.name || user.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    if (error) alert(error.message)
    else { await refreshProjects(); setShowForm(false) }
    setSaving(false)
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project? Associated data will remain.')) return
    await supabase.from('safety_projects').delete().eq('id', id)
    if (activeProject?.id === id) setActiveProject(null)
    refreshProjects()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Projects</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            Set an active project — all modules auto-populate with project context.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg font-bold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>
          + New Project
        </button>
      </div>

      {/* Active project callout */}
      {activeProject && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.3)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--grn)' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--grn)' }}>Active Project</span>
          </div>
          <div className="text-lg font-bold">{activeProject.name}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
            {activeProject.location}{activeProject.city ? `, ${activeProject.city}` : ''}{activeProject.state ? `, ${activeProject.state}` : ''}{activeProject.zip ? ` ${activeProject.zip}` : ''} • {activeProject.framework} • {activeProject.type} • SSHO: {activeProject.ssho || 'TBD'}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
            Scopes: {activeProject.scopes || 'Not specified'}
          </div>
        </div>
      )}

      {/* New Project Form */}
      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--acc)' }}>
          <h3 className="font-bold text-sm mb-3">New Project</h3>
          <div className="grid grid-cols-2 gap-3">
            <FormInput name="name" label="Project Name" placeholder="Highway 290 Bridge Rehabilitation" required />
            <FormSelect name="type" label="Project Type" options={['Commercial','Infrastructure','Industrial','Residential','Government / Federal','Marine / Coastal','Pipeline / Utility','Demolition','Renovation']} />
            <FormInput name="location" label="Street Address" placeholder="1234 Main St" />
            <FormInput name="city" label="City" placeholder="Houston" required />
            <FormInput name="zip" label="ZIP Code" placeholder="77001" required />
            <FormSelect name="state" label="State" options={['Texas','Louisiana','Oklahoma','California','Florida','New York','Other']} />
            <FormSelect name="framework" label="Compliance Framework" options={['OSHA Only','OSHA + USACE EM 385-1-1','OSHA + State Plan','OSHA + Owner Standards','Federal Agency (FAR)']} />
            <FormSelect name="status" label="Status" options={['Active','Pre-Construction','On Hold','Complete']} />
            <div className="col-span-2">
              <FormInput name="scopes" label="Work Scopes" placeholder="Structural steel erection, concrete, excavation, crane ops..." />
            </div>
            <FormInput name="gc" label="GC / Prime Contractor" placeholder="ABC Contractors" />
            <FormInput name="ssho" label="SSHO / Safety Contact" placeholder="Name + Phone" />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-lg font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Saving...' : 'Create Project'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
          <div className="text-4xl mb-3">🏗️</div>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>No projects yet. Create your first project to get started — it becomes the context for all safety modules.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map(p => {
            const isActive = activeProject?.id === p.id
            return (
              <div key={p.id} className="rounded-xl p-4 transition-all"
                style={{
                  background: 'var(--bg2)',
                  border: isActive ? '1px solid var(--grn)' : '1px solid var(--bdr)',
                  borderLeft: isActive ? '3px solid var(--grn)' : '3px solid var(--bdr)'
                }}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">{p.name}</span>
                    {isActive && <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(34,197,94,.12)', color: 'var(--grn)' }}>ACTIVE</span>}
                    <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg3)', color: 'var(--t3)' }}>{p.status}</span>
                  </div>
                  <div className="flex gap-1">
                    {!isActive && (
                      <button onClick={() => setActiveProject(p)}
                        className="px-3 py-1 rounded text-xs font-semibold"
                        style={{ border: '1px solid var(--grn)', color: 'var(--grn)' }}>
                        Set Active
                      </button>
                    )}
                    {isActive && (
                      <button onClick={() => setActiveProject(null)}
                        className="px-3 py-1 rounded text-xs"
                        style={{ border: '1px solid var(--bdr)', color: 'var(--t3)' }}>
                        Deactivate
                      </button>
                    )}
                    <button onClick={() => deleteProject(p.id)}
                      className="px-2 py-1 rounded text-xs"
                      style={{ border: '1px solid var(--bdr)', color: 'var(--red)' }}>
                      Del
                    </button>
                  </div>
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
                  {p.type} • {p.location}{p.city ? `, ${p.city}` : ''}{p.state ? `, ${p.state}` : ''}{p.zip ? ` ${p.zip}` : ''} • {p.framework}
                  {p.gc && ` • GC: ${p.gc}`}{p.ssho && ` • SSHO: ${p.ssho}`}
                </div>
                {p.scopes && <div className="text-xs mt-0.5" style={{ color: 'var(--t2)' }}>Scopes: {p.scopes}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FormInput({ name, label, placeholder, required }: { name: string; label: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>{label}</label>
      <input name={name} placeholder={placeholder} required={required}
        className="w-full px-3 py-2 rounded-lg text-sm"
        style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }} />
    </div>
  )
}

function FormSelect({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>{label}</label>
      <select name={name} className="w-full px-3 py-2 rounded-lg text-sm"
        style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1.5px solid var(--bdr)' }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}
