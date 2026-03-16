// ═══ OFFLINE QUEUE — IndexedDB backed ═══
// Stores form submissions when offline, syncs when connection returns

const DB_NAME = 'forged-safety-offline'
const DB_VERSION = 1
const STORE_NAME = 'queue'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'queueId', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export type QueuedAction = {
  queueId?: number
  table: string
  action: 'insert' | 'update' | 'delete'
  data: any
  timestamp: string
}

// Add an action to the offline queue
export async function enqueue(action: QueuedAction): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).add({ ...action, timestamp: new Date().toISOString() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Get all queued actions
export async function getQueue(): Promise<QueuedAction[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Remove a processed action from the queue
export async function dequeue(queueId: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(queueId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Clear the entire queue
export async function clearQueue(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Get queue count
export async function getQueueCount(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Process the queue — called when back online
export async function processQueue(
  supabaseInsert: (table: string, data: any) => Promise<boolean>,
  supabaseUpdate: (table: string, id: string, data: any) => Promise<boolean>,
  supabaseDelete: (table: string, id: string) => Promise<boolean>
): Promise<{ processed: number; failed: number }> {
  const items = await getQueue()
  let processed = 0
  let failed = 0

  for (const item of items) {
    try {
      let success = false
      if (item.action === 'insert') success = await supabaseInsert(item.table, item.data)
      else if (item.action === 'update') success = await supabaseUpdate(item.table, item.data.id, item.data)
      else if (item.action === 'delete') success = await supabaseDelete(item.table, item.data.id)

      if (success && item.queueId) {
        await dequeue(item.queueId)
        processed++
      } else { failed++ }
    } catch { failed++ }
  }
  return { processed, failed }
}
