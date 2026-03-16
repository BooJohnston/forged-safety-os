import { supabase } from './supabase'

export type DataStore =
  | 'hazards' | 'daily_logs' | 'incidents' | 'near_misses' | 'projects'
  | 'permits' | 'training' | 'workers' | 'jhas' | 'sds' | 'lift_plans'
  | 'audits' | 'orientations' | 'inspections' | 'documents' | 'photo_analyses'

const TABLE_MAP: Record<DataStore, string> = {
  hazards: 'safety_hazards',
  daily_logs: 'safety_daily_logs',
  incidents: 'safety_incidents',
  near_misses: 'safety_near_misses',
  projects: 'safety_projects',
  permits: 'safety_permits',
  training: 'safety_training',
  workers: 'safety_workers',
  jhas: 'safety_jhas',
  sds: 'safety_sds',
  lift_plans: 'safety_lift_plans',
  audits: 'safety_audits',
  orientations: 'safety_orientations',
  inspections: 'safety_inspections',
  documents: 'safety_documents',
  photo_analyses: 'safety_photo_analyses'
}

// Get current user ID
async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id || null
}

// Generic CRUD for any data store
export async function getData<T = any>(store: DataStore): Promise<T[]> {
  const userId = await getUserId()
  if (!userId) return []
  const { data, error } = await supabase
    .from(TABLE_MAP[store])
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.warn(`getData(${store}):`, error.message); return [] }
  return (data || []) as T[]
}

export async function upsertRecord<T extends { id: string }>(store: DataStore, record: T): Promise<T | null> {
  const userId = await getUserId()
  if (!userId) return null
  const { data, error } = await supabase
    .from(TABLE_MAP[store])
    .upsert({ ...record, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select()
    .single()
  if (error) { console.warn(`upsert(${store}):`, error.message); return null }
  return data as T
}

// Get current company_id from localStorage (set by CompanyProvider)
function getCompanyId(): string | null {
  try {
    const stored = localStorage.getItem('forged-company-id')
    return stored || null
  } catch { return null }
}

export async function insertRecord<T>(store: DataStore, record: Omit<T, 'id'>): Promise<T | null> {
  const userId = await getUserId()
  if (!userId) return null
  const id = genId()
  const companyId = getCompanyId()
  const enriched = { ...record, id, user_id: userId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any
  if (companyId && !enriched.company_id) enriched.company_id = companyId
  const { data, error } = await supabase
    .from(TABLE_MAP[store])
    .insert(enriched)
    .select()
    .single()
  if (error) { console.warn(`insert(${store}):`, error.message); return null }
  return data as T
}

export async function deleteRecord(store: DataStore, id: string): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE_MAP[store])
    .delete()
    .eq('id', id)
  if (error) { console.warn(`delete(${store}):`, error.message); return false }
  return true
}

export async function updateRecord<T>(store: DataStore, id: string, updates: Partial<T>): Promise<T | null> {
  const { data, error } = await supabase
    .from(TABLE_MAP[store])
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) { console.warn(`update(${store}):`, error.message); return null }
  return data as T
}

// Batch upsert for import
export async function batchUpsert<T extends { id: string }>(store: DataStore, records: T[]): Promise<number> {
  const userId = await getUserId()
  if (!userId || !records.length) return 0
  const withUser = records.map(r => ({ ...r, user_id: userId, updated_at: new Date().toISOString() }))
  const { error } = await supabase.from(TABLE_MAP[store]).upsert(withUser, { onConflict: 'id' })
  if (error) { console.warn(`batchUpsert(${store}):`, error.message); return 0 }
  return records.length
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}
