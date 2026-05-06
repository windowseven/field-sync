'use client'

import useSWR from 'swr'
import { ShieldAlert, Timer, Zap } from 'lucide-react'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { maintenanceService } from '@/lib/api/maintenanceService'
import { PageState, RefreshButton, formatDateTime } from '../_components'

export default function RateLimitsPage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('maintenance-snapshot', () => maintenanceService.getSnapshot())
  const rateLimits = data?.rateLimits

  return (
    <>
      <DashboardHeader title="Rate Limiting" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Rate Limiting</h1>
              <p className="text-muted-foreground">Real limiter rules and block events recorded by the running backend.</p>
            </div>
            <RefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
          </div>

          <PageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {rateLimits && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Rules', value: String(rateLimits.rules.length), icon: Zap },
                  { label: 'Blocked (24h)', value: String(rateLimits.totalBlocked24h), icon: ShieldAlert },
                  { label: 'Blocked IPs', value: String(rateLimits.blockedIps.length), icon: ShieldAlert },
                  { label: 'Last Blocked', value: rateLimits.lastBlockedAt ? formatDateTime(rateLimits.lastBlockedAt) : 'Never', icon: Timer },
                ].map((item) => (
                  <Card key={item.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <item.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xl font-bold">{item.value}</p>
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Configured Rules</CardTitle>
                    <CardDescription>Real limits currently enforced in Express</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Path</TableHead>
                          <TableHead>Window</TableHead>
                          <TableHead>Max</TableHead>
                          <TableHead>Blocked (24h)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rateLimits.rules.map((rule) => (
                          <TableRow key={rule.name}>
                            <TableCell>{rule.name}</TableCell>
                            <TableCell className="font-mono text-xs">{rule.path}</TableCell>
                            <TableCell>{Math.round(rule.windowMs / 60000)} min</TableCell>
                            <TableCell>{rule.max}</TableCell>
                            <TableCell>{rule.blockedRequests24h}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Blocked Clients</CardTitle>
                    <CardDescription>Top IPs blocked in the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP</TableHead>
                          <TableHead>Blocks</TableHead>
                          <TableHead>Last Seen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rateLimits.blockedIps.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                              No rate-limit blocks have been recorded since the current backend process started.
                            </TableCell>
                          </TableRow>
                        )}
                        {rateLimits.blockedIps.map((item) => (
                          <TableRow key={item.ip}>
                            <TableCell className="font-mono text-xs">{item.ip}</TableCell>
                            <TableCell>{item.count}</TableCell>
                            <TableCell>{formatDateTime(item.lastSeen)}</TableCell>
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
