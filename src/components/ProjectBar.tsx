import { useProject } from '../hooks/useProject'
import { useNavigate } from 'react-router-dom'

export function ProjectBar() {
  const { activeProject, projects, setActiveProject } = useProject()
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between px-5 py-2 shrink-0"
      style={{ background: 'var(--bg4)', borderBottom: '1px solid var(--bdr)' }}>
      {activeProject ? (
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--grn)' }} />
          <div>
            <span className="text-sm font-semibold">{activeProject.name}</span>
            <span className="text-xs ml-2" style={{ color: 'var(--t3)' }}>
              {activeProject.location}{activeProject.state ? `, ${activeProject.state}` : ''} • {activeProject.framework}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--yel)' }} />
          <span className="text-xs" style={{ color: 'var(--yel)' }}>No active project — select or create one</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        {projects.length > 0 && (
          <select
            value={activeProject?.id || ''}
            onChange={e => {
              if (e.target.value === '') setActiveProject(null)
              else {
                const p = projects.find(proj => proj.id === e.target.value)
                if (p) setActiveProject(p)
              }
            }}
            className="px-3 py-1 rounded-lg text-xs"
            style={{ background: 'var(--bg3)', color: 'var(--t1)', border: '1px solid var(--bdr)', maxWidth: '200px' }}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <button onClick={() => navigate('/projects')}
          className="text-xs px-3 py-1 rounded-lg transition-all"
          style={{ border: '1px solid var(--bdr)', color: 'var(--t2)' }}>
          {projects.length === 0 ? '+ New Project' : 'Manage'}
        </button>
      </div>
    </div>
  )
}
