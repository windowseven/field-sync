import * as Sentry from '@sentry/react'

export default function SentryTestPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-6 p-8 max-w-md">
        <h1 className="text-2xl font-bold">Sentry Test Page</h1>
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
              throw new Error('This is your first error!')
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
