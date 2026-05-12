'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/react'

export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
    if (!dsn) return

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      sendDefaultPii: true,
      enableLogs: true,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 1.0,
      tracePropagationTargets: ['localhost', /^https:\/\/.*\.onrender\.com\/api/],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })
  }, [])

  return children
}
