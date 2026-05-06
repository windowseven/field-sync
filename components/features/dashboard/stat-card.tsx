'use client'

import * as React from 'react'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  status?: 'success' | 'warning' | 'destructive' | 'default'
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  status = 'default',
  className,
}: StatCardProps) {
  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus
    : null

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            status === 'success' && 'bg-success/10 text-success',
            status === 'warning' && 'bg-warning/10 text-warning',
            status === 'destructive' && 'bg-destructive/10 text-destructive',
            status === 'default' && 'bg-primary/10 text-primary'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {trend && TrendIcon && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                trend.value > 0 && 'text-success',
                trend.value < 0 && 'text-destructive',
                trend.value === 0 && 'text-muted-foreground'
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {(description || trend?.label) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {description || trend?.label}
          </p>
        )}
      </CardContent>
      {/* Decorative gradient */}
      <div
        className={cn(
          'absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 blur-2xl',
          status === 'success' && 'bg-success',
          status === 'warning' && 'bg-warning',
          status === 'destructive' && 'bg-destructive',
          status === 'default' && 'bg-primary'
        )}
      />
    </Card>
  )
}

