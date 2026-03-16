import { useState, useEffect } from 'react'
import { getQueueCount } from '../lib/offlineQueue'

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => {
      setIsOffline(false)
      refreshCount()
    }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)

    // Listen for SW sync message
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'SYNC_OFFLINE_QUEUE') refreshCount()
      })
    }

    refreshCount()
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  const refreshCount = async () => {
    try { setPendingCount(await getQueueCount()) } catch { setPendingCount(0) }
  }

  return { isOffline, pendingCount, syncing, setSyncing, refreshCount }
}
