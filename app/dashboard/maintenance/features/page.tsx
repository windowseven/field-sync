'use client'

import useSWR from 'swr'
import { Settings, ToggleLeft, ToggleRight } from 'lucide-react'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { maintenanceService } from '@/lib/api/maintenanceService'
import { PageState, RefreshButton } from '../_components'

export default function FeatureFlagsPage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('maintenance-snapshot', () => maintenanceService.getSnapshot())
  const features = data?.features

  return (
    <>
      <DashboardHeader title="Feature Flags" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Feature Flags</h1>
              <p className="text-muted-foreground">Real environment-driven flags detected by the backend at runtime.</p>
            </div>
            <RefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
          </div>

          <PageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {features && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Configured Flags', value: String(features.total), icon: Settings },
                  { label: 'Enabled Flags', value: String(features.enabled), icon: ToggleRight },
                  { label: 'Disabled Flags', value: String(Math.max(0, features.total - features.enabled)), icon: ToggleLeft },
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

              <Card>
                <CardHeader>
                  <CardTitle>Runtime Flags</CardTitle>
                  <CardDescription>Values loaded from environment variables such as <code>FEATURE_*</code></CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Enabled</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {features.flags.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                            No server-side feature flag environment variables are currently configured.
                          </TableCell>
                        </TableRow>
                      )}
                      {features.flags.map((flag) => (
                        <TableRow key={flag.name}>
                          <TableCell className="font-mono text-xs">{flag.name}</TableCell>
                          <TableCell className="font-mono text-xs">{flag.value}</TableCell>
                          <TableCell>{flag.enabled ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{flag.source}</TableCell>
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
