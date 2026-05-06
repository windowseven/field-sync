'use client'

import * as React from 'react'
import { MapPin, MoreHorizontal, MessageSquare, Eye, Navigation } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface LiveUser {
  id: string
  name: string
  avatar?: string
  team: string
  zone: string
  status: 'active' | 'idle' | 'moving'
  activity: string
  lastUpdate: string
  speed?: number
  location: {
    lat: number
    lng: number
  }
}

const liveUsers: LiveUser[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    team: 'Team Alpha',
    zone: 'Zone A',
    status: 'active',
    activity: 'Filling form',
    lastUpdate: '10s ago',
    location: { lat: 40.7128, lng: -74.006 },
  },
  {
    id: '2',
    name: 'Mike Chen',
    team: 'Team Alpha',
    zone: 'Zone A',
    status: 'moving',
    activity: 'En route',
    lastUpdate: '5s ago',
    speed: 4.2,
    location: { lat: 40.7138, lng: -74.008 },
  },
  {
    id: '3',
    name: 'James Miller',
    team: 'Team Beta',
    zone: 'Zone B',
    status: 'active',
    activity: 'Survey complete',
    lastUpdate: '30s ago',
    location: { lat: 40.7148, lng: -74.01 },
  },
  {
    id: '4',
    name: 'Lisa Park',
    team: 'Team Alpha',
    zone: 'Zone A',
    status: 'idle',
    activity: 'Stationary',
    lastUpdate: '2m ago',
    location: { lat: 40.7118, lng: -74.004 },
  },
  {
    id: '5',
    name: 'Alex Turner',
    team: 'Team Gamma',
    zone: 'Zone C',
    status: 'moving',
    activity: 'Traveling',
    lastUpdate: '8s ago',
    speed: 5.8,
    location: { lat: 40.7158, lng: -74.012 },
  },
  {
    id: '6',
    name: 'Emma Davis',
    team: 'Team Beta',
    zone: 'Zone B',
    status: 'active',
    activity: 'Filling form',
    lastUpdate: '15s ago',
    location: { lat: 40.7168, lng: -74.014 },
  },
  {
    id: '7',
    name: 'Maria Garcia',
    team: 'Team Gamma',
    zone: 'Zone C',
    status: 'idle',
    activity: 'On break',
    lastUpdate: '5m ago',
    location: { lat: 40.7178, lng: -74.016 },
  },
  {
    id: '8',
    name: 'David Kim',
    team: 'Team Gamma',
    zone: 'Zone C',
    status: 'active',
    activity: 'Census entry',
    lastUpdate: '20s ago',
    location: { lat: 40.7188, lng: -74.018 },
  },
]

function getStatusBadge(status: LiveUser['status']) {
  switch (status) {
    case 'active':
      return (
        <Badge className="h-5 bg-success/10 text-success hover:bg-success/20 gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Active
        </Badge>
      )
    case 'idle':
      return (
        <Badge className="h-5 bg-warning/10 text-warning hover:bg-warning/20 gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          Idle
        </Badge>
      )
    case 'moving':
      return (
        <Badge className="h-5 bg-info/10 text-info hover:bg-info/20 gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-info animate-pulse" />
          Moving
        </Badge>
      )
  }
}

export function LiveUsers() {
  const activeCount = liveUsers.filter((u) => u.status === 'active').length
  const movingCount = liveUsers.filter((u) => u.status === 'moving').length

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Live Users
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
          </CardTitle>
          <CardDescription>
            {activeCount} active, {movingCount} moving
          </CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View Map
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[350px]">
          <div className="space-y-1 px-6 pb-4">
            {liveUsers.map((user) => (
              <div
                key={user.id}
                className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50"
              >
                {/* Avatar with status */}
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-secondary text-xs">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                      user.status === 'active' && 'status-online',
                      user.status === 'idle' && 'status-idle',
                      user.status === 'moving' && 'bg-info'
                    )}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{user.name}</span>
                    {getStatusBadge(user.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{user.team}</span>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {user.zone}
                    </span>
                    {user.speed && (
                      <>
                        <span className="text-border">|</span>
                        <span className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {user.speed} km/h
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user.activity} &middot; {user.lastUpdate}
                  </p>
                </div>

                {/* Actions */}
                <TooltipProvider>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Track on map</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Send message</TooltipContent>
                    </Tooltip>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>View Activity Log</DropdownMenuItem>
                        <DropdownMenuItem>Reassign Zone</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TooltipProvider>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

