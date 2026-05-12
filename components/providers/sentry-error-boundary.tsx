'use client'

import * as Sentry from '@sentry/react'

export function SentryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
            <p className="text-muted-foreground">
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              Reload Page
            </button>
          </div>
        </div>
      }
      showDialog
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
