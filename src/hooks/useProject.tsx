import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { setGlobalProjectFilter } from './useData'

export type Project = {
  id: string
  name: string
  type: string
  location: string
  city: string
  zip: string
  state: string
  framework: string
  status: string
  scopes: string
  gc: string
  ssho: string
  created_by: string
  created_at: string
}

type ProjectContextType = {
  activeProject: Project | null
  projects: Project[]
  setActiveProject: (p: Project | null) => void
  refreshProjects: () => Promise<void>
  loading: boolean
}

const ProjectContext = createContext<ProjectContextType>({
  activeProject: null,
  projects: [],
  setActiveProject: () => {},
  refreshProjects: async () => {},
  loading: true
})

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProjectState] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProjects = async () => {
    if (!user) return
    const { data } = await supabase
      .from('safety_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setProjects(data)
    setLoading(false)
  }

  useEffect(() => {
    if (user) {
      refreshProjects()
      // Restore last active project from localStorage
      const saved = localStorage.getItem('safety-active-project')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setActiveProjectState(parsed)
          setGlobalProjectFilter(parsed?.id || null)
        } catch {}
      }
    }
  }, [user])

  const setActiveProject = (p: Project | null) => {
    setActiveProjectState(p)
    setGlobalProjectFilter(p?.id || null)
    if (p) localStorage.setItem('safety-active-project', JSON.stringify(p))
    else localStorage.removeItem('safety-active-project')
  }

  return (
    <ProjectContext.Provider value={{ activeProject, projects, setActiveProject, refreshProjects, loading }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  return useContext(ProjectContext)
}
