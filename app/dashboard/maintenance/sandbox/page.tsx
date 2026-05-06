'use client'

import useSWR from 'swr'
import { Code2, Database, TestTube, Users } from 'lucide-react'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { maintenanceService } from '@/lib/api/maintenanceService'
import { PageState, RefreshButton, formatDateTime } from '../_components'

export default function SandboxPage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('maintenance-snapshot', () => maintenanceService.getSnapshot())
  const sandbox = data?.sandbox

  return (
    <>
      <DashboardHeader title="Test Environment" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Test Environment</h1>
              <p className="text-muted-foreground">Real development-environment diagnostics, scripts, and sandbox-style user records.</p>
            </div>
            <RefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
          </div>

          <PageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {sandbox && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Environment', value: sandbox.nodeEnv, icon: TestTube, detail: sandbox.active ? 'Development mode active' : 'Non-development mode' },
                  { label: 'Database', value: sandbox.databaseName, icon: Database, detail: 'Configured DB target' },
                  { label: 'Test Files', value: String(sandbox.backendTestFileCount + sandbox.frontendTestFileCount), icon: Code2, detail: `${sandbox.backendTestFileCount} backend / ${sandbox.frontendTestFileCount} frontend` },
                  { label: 'Sandbox Users', value: String(sandbox.sandboxUsers.length), icon: Users, detail: 'Email contains test or sandbox' },
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
                    <CardTitle>Available Commands</CardTitle>
                    <CardDescription>Actual scripts detected in package.json files</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Command</TableHead>
                          <TableHead>Script</TableHead>
                          <TableHead>Available</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sandbox.availableCommands.map((command) => (
                          <TableRow key={command.name}>
                            <TableCell>{command.name}</TableCell>
                            <TableCell className="font-mono text-xs">{command.command || 'Not configured'}</TableCell>
                            <TableCell>{command.available ? 'Yes' : 'No'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sandbox-style Users</CardTitle>
                    <CardDescription>Actual user records matching test/sandbox naming</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sandbox.sandboxUsers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                              No sandbox/test users were found in the current database.
                            </TableCell>
                          </TableRow>
                        )}
                        {sandbox.sandboxUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell className="font-mono text-xs">{user.email}</TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>{user.status}</TableCell>
                            <TableCell>{formatDateTime(user.createdAt)}</TableCell>
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
