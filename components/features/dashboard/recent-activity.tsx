'use client'

import * as React from 'react'
import {
  FileText,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Radio,
  UserPlus,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Activity {
  id: string
  type: 'form' | 'zone' | 'team' | 'alert' | 'success' | 'tracking' | 'user'
  title: string
  description: string
  time: string
  user?: string
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Help Request',
    description: 'Team Alpha member requesting assistance in Zone A',
    time: '2 min ago',
    user: 'Sarah Johnson',
  },
  {
    id: '2',
    type: 'form',
    title: 'Form Submitted',
    description: 'Census form completed for 15 households',
    time: '8 min ago',
    user: 'Mike Chen',
  },
  {
    id: '3',
    type: 'success',
    title: 'Zone Completed',
    description: 'Team Delta finished Zone D coverage',
    time: '15 min ago',
  },
  {
    id: '4',
    type: 'tracking',
    title: 'User Offline',
    description: 'Chris Lee went offline in Zone B',
    time: '22 min ago',
  },
  {
    id: '5',
    type: 'zone',
    title: 'Zone Reassigned',
    description: 'Zone C reassigned from Team Beta to Team Gamma',
    time: '35 min ago',
  },
  {
    id: '6',
    type: 'user',
    title: 'New User Added',
    description: 'Kevin Wu joined Team Gamma',
    time: '1 hour ago',
  },
  {
    id: '7',
    type: 'form',
    title: 'Form Created',
    description: 'New survey form "Community Feedback" created',
    time: '1.5 hours ago',
  },
  {
    id: '8',
    type: 'team',
    title: 'Team Created',
    description: 'Team Echo created with 4 members',
    time: '2 hours ago',
  },
  {
    id: '9',
    type: 'tracking',
    title: 'Session Started',
    description: 'Team Alpha started tracking session',
    time: '3 hours ago',
  },
  {
    id: '10',
    type: 'success',
    title: 'Daily Target Met',
    description: 'Team Beta completed daily form quota',
    time: '4 hours ago',
  },
]

function getActivityIcon(type: Activity['type']) {
  switch (type) {
    case 'form':
      return FileText
    case 'zone':
      return MapPin
    case 'team':
      return Users
    case 'alert':
      return AlertTriangle
    case 'success':
      return CheckCircle
    case 'tracking':
      return Radio
    case 'user':
      return UserPlus
    default:
      return Clock
  }
}

function getActivityColor(type: Activity['type']) {
  switch (type) {
    case 'alert':
      return 'bg-destructive/10 text-destructive'
    case 'success':
      return 'bg-success/10 text-success'
    case 'form':
      return 'bg-info/10 text-info'
    case 'zone':
      return 'bg-warning/10 text-warning'
    case 'team':
      return 'bg-primary/10 text-primary'
    case 'tracking':
      return 'bg-chart-4/10 text-chart-4'
    case 'user':
      return 'bg-chart-5/10 text-chart-5'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function RecentActivity() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions across all teams</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px] px-6">
          <div className="space-y-1 pb-4">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <div
                  key={activity.id}
                  className={cn(
                    'group relative flex gap-4 py-3 transition-colors hover:bg-accent/50 rounded-lg px-2 -mx-2',
                    index !== activities.length - 1 && 'border-b border-border/50'
                  )}
                >
                  {/* Timeline line */}
                  {index !== activities.length - 1 && (
                    <div className="absolute left-[23px] top-[48px] h-[calc(100%-24px)] w-px bg-border" />
                  )}
                  
                  {/* Icon */}
                  <div
                    className={cn(
                      'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      getActivityColor(activity.type)
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-none">{activity.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    {activity.user && (
                      <p className="text-xs text-muted-foreground/70">by {activity.user}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

