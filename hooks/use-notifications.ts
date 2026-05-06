import { useState, useEffect, useRef, useCallback } from 'react'
import { fieldSyncSocket } from '@/lib/auth/socketManager'
import { notificationService } from '@/lib/api/notificationService'

let globalUnread = 0
let listeners: Set<(count: number) => void> = new Set()

function broadcast(count: number) {
  globalUnread = count
  listeners.forEach(fn => fn(count))
}

export function useUnreadNotifications() {
  const [count, setCount] = useState(globalUnread)

  useEffect(() => {
    const handler = (c: number) => setCount(c)
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [])

  return count
}

export function useNotificationListener() {
  const initialized = useRef(false)

  const fetchUnread = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount()
      broadcast(count)
    } catch {
      // silent fail
    }
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    fetchUnread()

    const unsubNotif = fieldSyncSocket.on('notification:new', () => {
      broadcast(globalUnread + 1)
    })

    const unsubBroadcast = fieldSyncSocket.on('broadcast:new', () => {
      broadcast(globalUnread + 1)
    })

    return () => {
      unsubNotif()
      unsubBroadcast()
    }
  }, [fetchUnread])

  return { refresh: fetchUnread }
}
