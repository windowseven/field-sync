'use client'

import { useState } from 'react'
import {
  Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle,
  Clock, FileText, MapPin, ClipboardList, RotateCcw,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { db } from '@/lib/db/syncDatabase'
import { syncService } from '@/lib/api/syncService'
import { useLiveQuery } from 'dexie-react-hooks'

export type SyncStatus = 'synced' | 'pending' | 'failed'

const statusConfig: Record<SyncStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  synced: { label: 'Synced', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  failed: { label: 'Failed', icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
}

const typeIcon: Record<string, React.ElementType> = {
  form_submission: FileText,
  location_update: MapPin,
  task_update: ClipboardList,
}

export default function UserSyncPage() {
  const [syncing, setSyncing] = useState(false)

  const items = useLiveQuery(() => db.syncQueue.orderBy('timestamp').reverse().toArray()) || []

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncService.processQueue()
    } finally {
      setTimeout(() => setSyncing(false), 800)
    }
  }

  const handleRetry = async (id: string) => {
    await db.syncQueue.update(id, { status: 'pending' })
    handleSync()
  }

  const currentSummary = {
    synced: items.filter((i) => i.status === 'synced').length,
    pending: items.filter((i) => i.status === 'pending').length,
    failed: items.filter((i) => i.status === 'failed').length,
  }

  const allSynced = currentSummary.pending === 0 && currentSummary.failed === 0
  const hasFailed = currentSummary.failed > 0

  return (
    <>
      <DashboardHeader
        title="Sync Status"
        rootCrumb={{ label: 'Field', href: '/user/home' }}
        breadcrumbs={[{ label: 'Sync Status' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Offline Sync</h1>
            <p className="text-sm text-muted-foreground">Your local data and sync status</p>
          </div>

          {/* Status banner */}
          <Card className={cn(
            'border-2',
            allSynced ? 'border-emerald-500/25 bg-emerald-500/5'
            : hasFailed ? 'border-destructive/25 bg-destructive/5'
            : 'border-amber-500/25 bg-amber-500/5'
          )}>
            <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {allSynced
                  ? <Wifi className="h-6 w-6 text-emerald-500 shrink-0" />
                  : hasFailed
                  ? <WifiOff className="h-6 w-6 text-destructive shrink-0" />
                  : <RefreshCw className={cn('h-6 w-6 text-amber-500 shrink-0', syncing && 'animate-spin')} />}
                <div>
                  <p className={cn(
                    'font-semibold text-sm',
                    allSynced ? 'text-emerald-700 dark:text-emerald-400'
                    : hasFailed ? 'text-destructive'
                    : 'text-amber-700 dark:text-amber-400'
                  )}>
                    {allSynced ? 'All data synced' : hasFailed ? 'Sync errors detected' : 'Pending sync'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentSummary.synced} synced &middot; {currentSummary.pending} pending &middot; {currentSummary.failed} failed
                  </p>
                </div>
              </div>
              {!allSynced && (
                <Button
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                  className="gap-2 shrink-0 w-full sm:w-auto"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-500">{currentSummary.synced}</p>
                  <p className="text-xs text-muted-foreground">Synced</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-500">{currentSummary.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{currentSummary.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sync history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Sync History
              </CardTitle>
              <CardDescription>Recent sync operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.length > 0 ? items.map((item) => {
                  const sc = statusConfig[item.status]
                  const StatusIcon = sc.icon
                  const TypeIcon = typeIcon[item.type] || FileText
                  return (
                    <div key={item.id} className="rounded-lg border p-4 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 shrink-0">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          <div className="flex flex-wrap items-center gap-x-2 mt-1 text-xs text-muted-foreground">
                            <span>{item.timestamp}</span>
                            <span>&middot;</span>
                            <span>{item.size}</span>
                            {item.retries > 0 && (
                              <><span>&middot;</span><span className="text-destructive">{item.retries} retries</span></>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge className={cn('text-xs px-2 border-0 gap-1 flex-1 justify-center', sc.bg, sc.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {sc.label}
                        </Badge>
                        {item.status === 'failed' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleRetry(item.id!)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                }) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No sync history</p>
                    <p className="text-xs mt-1">Synced items will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Data is stored locally and synced when a connection is available. You can always work offline.
          </p>

        </div>
      </main>
    </>
  )
}
