'use client'

import { useEffect } from 'react'
import { initializeCsrf } from '@/lib/security/csrf'

/**
 * SecurityInitializer
 * Performs the initial security handshake with the backend,
 * fetching the CSRF token and preparing the environment for mutations.
 */
export function SecurityInitializer() {
  useEffect(() => {
    // Perform CSRF handshake once on mount
    initializeCsrf()
  }, [])

  return null // This component doesn't render anything
}
