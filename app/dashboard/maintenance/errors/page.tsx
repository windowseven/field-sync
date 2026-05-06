'use client'

import useSWR from 'swr'
import { AlertTriangle, Bug, ShieldAlert } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { maintenanceService } from '@/lib/api/maintenanceService'
import { PageState, RefreshButton, formatDateTime } from '../_components'

export default function ErrorsPage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('maintenance-snapshot', () => maintenanceService.getSnapshot())
  const errorsData = data?.errors

  return (
    <>
      <DashboardHeader title="Error Tracking" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Error Tracking</h1>
              <p className="text-muted-foreground">Parsed directly from the backend <code>error.log</code> file.</p>
            </div>
            <RefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
          </div>

          <PageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {errorsData && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Error Log', value: errorsData.exists ? 'Available' : 'Missing', icon: Bug },
                  { label: 'Errors (24h)', value: String(errorsData.total24h), icon: AlertTriangle },
                  { label: 'Critical Signals', value: String(errorsData.critical24h), icon: ShieldAlert },
                  { label: 'Categories', value: String(errorsData.categories.length), icon: Bug },
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

              <div className="grid gap-6 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Error Trend</CardTitle>
                    <CardDescription>Hourly backend error volume from the log file</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={errorsData.trend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="errors" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Error Categories</CardTitle>
                    <CardDescription>Keyword-based grouping from log messages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {errorsData.categories.length === 0 && <p className="text-sm text-muted-foreground">No recent backend errors logged.</p>}
                    {errorsData.categories.map((category) => (
                      <div key={category.name} className="flex items-center justify-between rounded-lg border p-3">
                        <span className="capitalize">{category.name}</span>
                        <span className="font-semibold">{category.count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Errors</CardTitle>
                  <CardDescription>Newest parsed log entries from the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errorsData.recent.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                            No backend errors were found in the last 24 hours.
                          </TableCell>
                        </TableRow>
                      )}
                      {errorsData.recent.map((entry) => (
                        <TableRow key={`${entry.timestamp}-${entry.message}`}>
                          <TableCell>{formatDateTime(entry.timestamp)}</TableCell>
                          <TableCell className="uppercase">{entry.level}</TableCell>
                          <TableCell className="capitalize">{entry.category}</TableCell>
                          <TableCell className="max-w-[560px] truncate">{entry.message}</TableCell>
                        </TableRow>
                      ))}
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
