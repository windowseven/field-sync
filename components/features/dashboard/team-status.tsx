'use client'

import * as React from 'react'
import { MoreHorizontal, MapPin, Users, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TeamMember {
  id: string
  name: string
  avatar?: string
  status: 'online' | 'idle' | 'offline'
}

interface Team {
  id: string
  name: string
  zone: string
  leader: string
  members: TeamMember[]
  progress: number
  tasksCompleted: number
  totalTasks: number
  status: 'active' | 'paused' | 'completed'
}

const teams: Team[] = [
  {
    id: '1',
    name: 'Team Alpha',
    zone: 'Zone A - Downtown',
    leader: 'Sarah Johnson',
    members: [
      { id: '1', name: 'Sarah Johnson', status: 'online' },
      { id: '2', name: 'Mike Chen', status: 'online' },
      { id: '3', name: 'Lisa Park', status: 'idle' },
      { id: '4', name: 'Tom Wilson', status: 'online' },
    ],
    progress: 72,
    tasksCompleted: 18,
    totalTasks: 25,
    status: 'active',
  },
  {
    id: '2',
    name: 'Team Beta',
    zone: 'Zone B - North District',
    leader: 'James Miller',
    members: [
      { id: '5', name: 'James Miller', status: 'online' },
      { id: '6', name: 'Emma Davis', status: 'online' },
      { id: '7', name: 'Chris Lee', status: 'offline' },
    ],
    progress: 45,
    tasksCompleted: 9,
    totalTasks: 20,
    status: 'active',
  },
  {
    id: '3',
    name: 'Team Gamma',
    zone: 'Zone C - Industrial',
    leader: 'Alex Turner',
    members: [
      { id: '8', name: 'Alex Turner', status: 'online' },
      { id: '9', name: 'Maria Garcia', status: 'idle' },
      { id: '10', name: 'David Kim', status: 'online' },
      { id: '11', name: 'Rachel Brown', status: 'online' },
      { id: '12', name: 'Kevin Wu', status: 'offline' },
    ],
    progress: 88,
    tasksCompleted: 22,
    totalTasks: 25,
    status: 'active',
  },
  {
    id: '4',
    name: 'Team Delta',
    zone: 'Zone D - Suburbs',
    leader: 'Nina Patel',
    members: [
      { id: '13', name: 'Nina Patel', status: 'online' },
      { id: '14', name: 'Sam Roberts', status: 'online' },
    ],
    progress: 100,
    tasksCompleted: 15,
    totalTasks: 15,
    status: 'completed',
  },
]

function getStatusColor(status: TeamMember['status']) {
  switch (status) {
    case 'online':
      return 'status-online'
    case 'idle':
      return 'status-idle'
    case 'offline':
      return 'status-offline'
  }
}

function getTeamStatusBadge(status: Team['status']) {
  switch (status) {
    case 'active':
      return <Badge className="bg-success/10 text-success hover:bg-success/20">Active</Badge>
    case 'paused':
      return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Paused</Badge>
    case 'completed':
      return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Completed</Badge>
  }
}

export function TeamStatus() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Status</CardTitle>
          <CardDescription>Real-time team progress and activity</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="group rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{team.name}</h4>
                    {getTeamStatusBadge(team.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {team.zone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {team.members.length} members
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Track on Map</DropdownMenuItem>
                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                    <DropdownMenuItem>Reassign Zone</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Progress */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="flex items-center gap-1 font-medium">
                    {team.progress}%
                    {team.progress > 50 && (
                      <TrendingUp className="h-3 w-3 text-success" />
                    )}
                  </span>
                </div>
                <Progress
                  value={team.progress}
                  className={cn(
                    'h-2',
                    team.progress === 100 && '[&>div]:bg-primary',
                    team.progress >= 70 && team.progress < 100 && '[&>div]:bg-success',
                    team.progress >= 40 && team.progress < 70 && '[&>div]:bg-warning',
                    team.progress < 40 && '[&>div]:bg-destructive'
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {team.tasksCompleted} of {team.totalTasks} tasks completed
                </p>
              </div>

              {/* Team Members */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {team.members.slice(0, 4).map((member) => (
                    <div key={member.id} className="relative">
                      <Avatar className="h-8 w-8 border-2 border-card">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-secondary text-xs">
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                          getStatusColor(member.status)
                        )}
                      />
                    </div>
                  ))}
                  {team.members.length > 4 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-xs font-medium">
                      +{team.members.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Lead: {team.leader}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

