'use client'

import { AlertTriangle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { MaintenanceStatus } from '@/lib/api/maintenanceService'

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatDateTime(value: string | number | null) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleString()
}

export function StatusBadge({ status }: { status: MaintenanceStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'font-medium',
        status === 'healthy' && 'bg-emerald-500/10 text-emerald-500',
        status === 'warning' && 'bg-amber-500/10 text-amber-500',
        status === 'critical' && 'bg-red-500/10 text-red-500'
      )}
    >
      {status === 'healthy' && <CheckCircle2 className="mr-1 h-3 w-3" />}
      {status === 'warning' && <AlertTriangle className="mr-1 h-3 w-3" />}
      {status === 'critical' && <XCircle className="mr-1 h-3 w-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export function PageState({
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
        <span>{isLoading ? 'Loading real maintenance metrics...' : error}</span>
      </CardContent>
    </Card>
  )
}

export function RefreshButton({
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
