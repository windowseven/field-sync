'use client'

import { AlertTriangle, CheckCircle2, Clock, RefreshCw, ShieldAlert, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function formatDateTime(value: string | number | null) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleString()
}

export function SecurityStatusBadge({
  status,
}: {
  status: 'healthy' | 'warning' | 'critical' | 'active' | 'blocked' | 'resolved' | 'online' | 'idle' | 'offline' | 'suspicious'
}) {
  const palette =
    status === 'healthy' || status === 'resolved' || status === 'online'
      ? 'bg-emerald-500/10 text-emerald-500'
      : status === 'warning' || status === 'blocked' || status === 'idle'
        ? 'bg-amber-500/10 text-amber-500'
        : 'bg-red-500/10 text-red-500'

  const Icon =
    status === 'healthy' || status === 'resolved' || status === 'online'
      ? CheckCircle2
      : status === 'warning' || status === 'blocked' || status === 'idle'
        ? Clock
        : status === 'suspicious' || status === 'active'
          ? ShieldAlert
          : XCircle

  return (
    <Badge variant="secondary" className={cn('font-medium', palette)}>
      <Icon className="mr-1 h-3 w-3" />
      {status}
    </Badge>
  )
}

export function SecurityPageState({
  isLoading,
  error,
}: {
  isLoading: boolean
  error?: string
}) {
  if (!isLoading && !error) return null

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
        {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
        <span>{isLoading ? 'Loading real security metrics...' : error}</span>
      </CardContent>
    </Card>
  )
}

export function SecurityRefreshButton({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean
  onRefresh: () => void
}) {
  return (
    <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
      <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
      Refresh
    </Button>
  )
}
