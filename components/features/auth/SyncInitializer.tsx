'use client'

import { useEffect } from 'react'
import { syncService } from '@/lib/api/syncService'

export function SyncInitializer() {
  useEffect(() => {
    syncService.init()
  }, [])

  return null
}

