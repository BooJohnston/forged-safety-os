import { useState, useEffect, useCallback } from 'react'
import { getData, insertRecord, updateRecord, deleteRecord, type DataStore } from '../lib/dataService'

// Stores that should be filtered by project_id when a project is active
const PROJECT_SCOPED_STORES: DataStore[] = [
  'hazards', 'daily_logs', 'incidents', 'near_misses', 'permits',
  'inspections', 'jhas', 'lift_plans', 'audits', 'orientations', 'documents'
]

// Global project filter — set by useProject, read by useData
let _activeProjectId: string | null = null
let _listeners: (() => void)[] = []

export function setGlobalProjectFilter(projectId: string | null) {
  _activeProjectId = projectId
  _listeners.forEach(fn => fn())
}

export function getGlobalProjectId(): string | null {
  return _activeProjectId
}

export function useData<T extends { id: string }>(store: DataStore) {
  const [allData, setAllData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [, setTick] = useState(0)

  // Subscribe to project filter changes so filtered view re-renders
  useEffect(() => {
    const listener = () => setTick(t => t + 1)
    _listeners.push(listener)
    return () => { _listeners = _listeners.filter(l => l !== listener) }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    const result = await getData<T>(store)
    setAllData(result)
    setLoading(false)
  }, [store])

  useEffect(() => { refresh() }, [refresh])

  // Apply project filter client-side for project-scoped stores
  const data = (() => {
    if (!_activeProjectId || !PROJECT_SCOPED_STORES.includes(store)) {
      return allData
    }
    return allData.filter((r: any) =>
      r.project_id === _activeProjectId ||
      r.project === _activeProjectId
    )
  })()

  const add = async (record: Omit<T, 'id'>) => {
    // Auto-attach project_id if a project is active and store is project-scoped
    const enriched = { ...record } as any
    if (_activeProjectId && PROJECT_SCOPED_STORES.includes(store) && !enriched.project_id) {
      enriched.project_id = _activeProjectId
    }
    const result = await insertRecord<T>(store, enriched)
    if (result) setAllData(prev => [result, ...prev])
    return result
  }

  const update = async (id: string, updates: Partial<T>) => {
    const result = await updateRecord<T>(store, id, updates)
    if (result) setAllData(prev => prev.map(r => r.id === id ? { ...r, ...result } : r))
    return result
  }

  const remove = async (id: string) => {
    const ok = await deleteRecord(store, id)
    if (ok) setAllData(prev => prev.filter(r => r.id !== id))
    return ok
  }

  // Expose unfiltered count for dashboard-level stats
  const totalCount = allData.length

  return { data, allData, loading, refresh, add, update, remove, totalCount }
}
