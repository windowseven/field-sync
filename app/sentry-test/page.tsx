'use client'

import * as Sentry from '@sentry/react'
import { useEffect, useState } from 'react'

export default function SentryTestPage() {
  const [sentryStatus, setSentryStatus] = useState('checking...')

  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    if (dsn) {
      console.log('Sentry DSN found:', dsn.substring(0, 30) + '...')
      setSentryStatus('DSN configured ✅')
    } else {
      console.warn('Sentry DSN not available (NEXT_PUBLIC_SENTRY_DSN is empty)')
      setSentryStatus('DSN not found ❌ — set NEXT_PUBLIC_SENTRY_DSN env var')
    }
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-6 p-8 max-w-md">
        <h1 className="text-2xl font-bold">Sentry Test Page</h1>
        <p className="text-sm font-mono text-muted-foreground">
          Sentry: {sentryStatus}
        </p>
        <p className="text-muted-foreground">
          Click the buttons below to send test events to Sentry.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => {
              Sentry.logger.info('User triggered test error', {
                action: 'test_error_button_click',
              })
              Sentry.metrics.count('test_counter', 1)
              Sentry.captureException(new Error('This is your first error!'))
              alert('Error sent to Sentry! Check your dashboard.')
            }}
            className="w-full px-4 py-3 bg-destructive text-destructive-foreground rounded-md font-medium hover:opacity-90"
          >
            Break the world
          </button>

          <button
            onClick={() => {
              Sentry.captureMessage('Sentry test message', 'info')
              alert('Test message sent to Sentry!')
            }}
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90"
          >
            Send test message
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          After clicking, check your Sentry dashboard at{' '}
          <a
            href="https://windowseven.sentry.io/issues/errors-outages/?project=4511367614824448"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            windowseven.sentry.io
          </a>
        </p>
      </div>
    </div>
  )
}
