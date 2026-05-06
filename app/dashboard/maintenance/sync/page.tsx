'use client'

import useSWR from 'swr'
import { CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { maintenanceService } from '@/lib/api/maintenanceService'
import { PageState, RefreshButton, StatusBadge, formatDateTime } from '../_components'

export default function SyncMonitorPage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('maintenance-snapshot', () => maintenanceService.getSnapshot())
  const sync = data?.sync

  return (
    <>
      <DashboardHeader title="Sync Monitor" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Sync Monitor</h1>
              <p className="text-muted-foreground">Live sync batch outcomes plus the real submission review backlog.</p>
            </div>
            <RefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
          </div>

          <PageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {sync && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Sync Batches (24h)', value: String(sync.totalBatches24h), icon: RefreshCw, detail: sync.lastBatchAt ? formatDateTime(sync.lastBatchAt) : 'No batches yet' },
                  { label: 'Processed Items', value: String(sync.totalItems24h), icon: CheckCircle2, detail: 'Current process window' },
                  { label: 'Failed Items', value: String(sync.failedItems24h), icon: XCircle, detail: 'Current process window' },
                  { label: 'Pending Submissions', value: String(sync.submissions.pending), icon: Clock, detail: `${sync.submissions.approved} approved / ${sync.submissions.rejected} rejected` },
                ].map((item) => (
                  <Card key={item.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <item.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{item.value}</p>
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sync Batches</CardTitle>
                    <CardDescription>Recorded by the live sync controller</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Batch</TableHead>
                          <TableHead>When</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Success</TableHead>
                          <TableHead>Failed</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sync.batches.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                              No sync batches have been processed since the backend restarted.
                            </TableCell>
                          </TableRow>
                        )}
                        {sync.batches.map((batch) => (
                          <TableRow key={batch.id}>
                            <TableCell className="font-mono text-xs">{batch.id}</TableCell>
                            <TableCell>{formatDateTime(batch.timestamp)}</TableCell>
                            <TableCell>{batch.itemCount}</TableCell>
                            <TableCell>{batch.successCount}</TableCell>
                            <TableCell>{batch.failureCount}</TableCell>
                            <TableCell><StatusBadge status={batch.status === 'warning' ? 'warning' : 'healthy'} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Failed Items</CardTitle>
                    <CardDescription>Failed sync payloads captured by the runtime monitor</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Error</TableHead>
                          <TableHead>When</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sync.failedItems.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                              No failed sync items recorded in the last 24 hours.
                            </TableCell>
                          </TableRow>
                        )}
                        {sync.failedItems.map((item) => (
                          <TableRow key={`${item.timestamp}-${item.id}`}>
                            <TableCell className="font-mono text-xs">{item.id}</TableCell>
                            <TableCell className="max-w-[360px] truncate">{item.message}</TableCell>
                            <TableCell>{formatDateTime(item.timestamp)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
