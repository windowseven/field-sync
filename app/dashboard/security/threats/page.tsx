'use client'

import useSWR from 'swr'
import { AlertTriangle, Ban, CheckCircle2, Shield } from 'lucide-react'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { securityService } from '@/lib/api/securityService'
import { SecurityPageState, SecurityRefreshButton, SecurityStatusBadge, formatDateTime } from '../_components'

export default function ThreatsPage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('admin-security-snapshot', () => securityService.getAdminSecuritySnapshot())
  const threats = data?.threats

  return (
    <>
      <DashboardHeader title="Threat Detection" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Threat Detection</h1>
              <p className="text-muted-foreground">Real suspicious activity derived from live rate-limit, API, and audit telemetry.</p>
            </div>
            <SecurityRefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
          </div>

          <SecurityPageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {threats && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Active Threats', value: threats.activeThreats.length, icon: AlertTriangle },
                  { label: 'Critical Active', value: threats.activeThreats.filter((item) => item.severity === 'critical').length, icon: Shield },
                  { label: 'Blocked IPs', value: threats.blockedIps.length, icon: Ban },
                  { label: 'Resolved', value: threats.resolvedThreats.length, icon: CheckCircle2 },
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

              <Tabs defaultValue="active">
                <TabsList>
                  <TabsTrigger value="active">Active ({threats.activeThreats.length})</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved ({threats.resolvedThreats.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Threats</CardTitle>
                      <CardDescription>Current security items from recent backend activity</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>IP / Country</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Events</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Seen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {threats.activeThreats.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                No active threats are currently flagged.
                              </TableCell>
                            </TableRow>
                          )}
                          {threats.activeThreats.map((threat) => (
                            <TableRow key={threat.id}>
                              <TableCell>{threat.type}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-mono text-sm">{threat.ip}</p>
                                  <p className="text-xs text-muted-foreground">{threat.country}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{threat.target}</TableCell>
                              <TableCell>{threat.attempts}</TableCell>
                              <TableCell>{threat.severity}</TableCell>
                              <TableCell><SecurityStatusBadge status={threat.status} /></TableCell>
                              <TableCell>{formatDateTime(threat.lastSeen)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resolved">
                  <Card>
                    <CardHeader>
                      <CardTitle>Resolved Threats</CardTitle>
                      <CardDescription>Older or mitigated security events</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>IP / Country</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Events</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Seen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {threats.resolvedThreats.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                No resolved threats are recorded yet.
                              </TableCell>
                            </TableRow>
                          )}
                          {threats.resolvedThreats.map((threat) => (
                            <TableRow key={threat.id}>
                              <TableCell>{threat.type}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-mono text-sm">{threat.ip}</p>
                                  <p className="text-xs text-muted-foreground">{threat.country}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{threat.target}</TableCell>
                              <TableCell>{threat.attempts}</TableCell>
                              <TableCell>{threat.severity}</TableCell>
                              <TableCell><SecurityStatusBadge status={threat.status} /></TableCell>
                              <TableCell>{formatDateTime(threat.lastSeen)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </>
  )
}
