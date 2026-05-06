'use client'

import useSWR from 'swr'
import { KeyRound, Lock, Shield, Timer } from 'lucide-react'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { securityService } from '@/lib/api/securityService'
import { SecurityPageState, SecurityRefreshButton } from '../_components'

export default function PoliciesPage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('admin-security-snapshot', () => securityService.getAdminSecuritySnapshot())
  const policies = data?.policies

  return (
    <>
      <DashboardHeader title="Access Policies" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Access Policies</h1>
              <p className="text-muted-foreground">Effective security controls currently enforced by the backend runtime.</p>
            </div>
            <SecurityRefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
          </div>

          <SecurityPageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {policies && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Password Min Length', value: policies.password.minLength, icon: KeyRound },
                  { label: 'Access Token Expiry', value: `${policies.session.accessTokenExpiryHours}h`, icon: Timer },
                  { label: 'Login Attempt Limit', value: policies.rateLimits.loginAttempts, icon: Shield },
                  { label: 'Global API Limit', value: policies.rateLimits.globalApiLimit, icon: Lock },
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

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Password and Token Controls</CardTitle>
                    <CardDescription>Values used by the backend auth flow</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        <TableRow><TableCell>Minimum Password Length</TableCell><TableCell>{policies.password.minLength}</TableCell></TableRow>
                        <TableRow><TableCell>Require Uppercase</TableCell><TableCell>{policies.password.requireUppercase ? 'Yes' : 'No'}</TableCell></TableRow>
                        <TableRow><TableCell>Require Numbers</TableCell><TableCell>{policies.password.requireNumbers ? 'Yes' : 'No'}</TableCell></TableRow>
                        <TableRow><TableCell>Require Symbols</TableCell><TableCell>{policies.password.requireSymbols ? 'Yes' : 'No'}</TableCell></TableRow>
                        <TableRow><TableCell>Access Token Expiry</TableCell><TableCell>{policies.session.accessTokenExpiryHours} hours</TableCell></TableRow>
                        <TableRow><TableCell>Refresh Token Expiry</TableCell><TableCell>{policies.session.refreshTokenExpiryDays} days</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rate Limit Controls</CardTitle>
                    <CardDescription>Effective runtime thresholds</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        <TableRow><TableCell>Login Attempts</TableCell><TableCell>{policies.rateLimits.loginAttempts}</TableCell></TableRow>
                        <TableRow><TableCell>OTP Attempts</TableCell><TableCell>{policies.rateLimits.otpAttempts}</TableCell></TableRow>
                        <TableRow><TableCell>Lockout Window</TableCell><TableCell>{policies.rateLimits.lockoutDurationMinutes} minutes</TableCell></TableRow>
                        <TableRow><TableCell>Global API Limit</TableCell><TableCell>{policies.rateLimits.globalApiLimit}</TableCell></TableRow>
                        <TableRow><TableCell>Global API Window</TableCell><TableCell>{policies.rateLimits.globalWindowMinutes} minutes</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Currently Enforced Controls</CardTitle>
                  <CardDescription>Controls this backend is actually applying today</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {policies.enforcedControls.map((control) => (
                    <div key={control} className="rounded-lg border p-3 text-sm">
                      {control}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </>
  )
}
