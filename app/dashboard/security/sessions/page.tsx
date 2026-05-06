'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Globe, Monitor, Smartphone, Users } from 'lucide-react'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { securityService } from '@/lib/api/securityService'
import { SecurityPageState, SecurityRefreshButton, SecurityStatusBadge, formatDateTime } from '../_components'

function deviceIcon(os: string) {
  return os === 'Android' || os === 'iOS' ? Smartphone : Monitor
}

export default function SessionsPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading, error, mutate, isValidating } = useSWR('admin-security-snapshot', () => securityService.getAdminSecuritySnapshot())

  const sessions = data?.sessions.items || []
  const metrics = data?.sessions.metrics

  const filtered = sessions.filter((session) =>
    [session.user, session.email, session.ip, session.role].some((value) =>
      value.toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <>
      <DashboardHeader title="Session Manager" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Session Manager</h1>
              <p className="text-muted-foreground">Real session-like activity derived from user presence and recent login audits.</p>
            </div>
            <SecurityRefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
          </div>

          <SecurityPageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {metrics && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Total Sessions', value: metrics.total, icon: Users },
                  { label: 'Active', value: metrics.active, icon: Users },
                  { label: 'Idle', value: metrics.idle, icon: Monitor },
                  { label: 'Suspicious', value: metrics.suspicious, icon: Globe },
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Search by user, email, role, or IP..."
                />
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>IP / Country</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                            No matching sessions found.
                          </TableCell>
                        </TableRow>
                      )}
                      {filtered.map((session, index) => {
                        const DeviceIcon = deviceIcon(session.os)
                        return (
                          <TableRow key={`${session.userId}-${session.ip}-${session.startedAt || 'none'}-${index}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{session.user}</p>
                                <p className="text-xs text-muted-foreground">{session.email} · {session.role}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{session.device}</p>
                                  <p className="text-xs text-muted-foreground">{session.os}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-mono text-sm">{session.ip}</p>
                              <p className="text-xs text-muted-foreground">{session.country}</p>
                            </TableCell>
                            <TableCell>{formatDateTime(session.startedAt)}</TableCell>
                            <TableCell>{formatDateTime(session.lastActivityAt)}</TableCell>
                            <TableCell><SecurityStatusBadge status={session.status} /></TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </>
  )
}
