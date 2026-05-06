"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Activity, CheckCircle2, MapPin, FileText, Clock, Users, Loader2, Bell } from 'lucide-react'
import useSWR from 'swr'
import { fetcher } from '@/lib/api/swr-fetcher'

export default function ActivityPage() {
  const { data: notificationsData, error: notificationsError } = useSWR('/notifications', fetcher)
  const { data: teamStats, error: statsError } = useSWR('/team/stats', fetcher)

  const isLoading = !notificationsData && !notificationsError
  const notifications = notificationsData?.notifications || []
  const stats = teamStats || { totalMembers: 0, activeMembers: 0, pendingTasks: 0, completedTasks: 0 }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading activity feed...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Timeline</h1>
          <p className="text-muted-foreground">Real-time team activity log</p>
        </div>
        <Badge variant="secondary" className="self-start px-3 py-1">
          Live • {notifications.length} recent events
        </Badge>
      </div>

      <Card className="border-primary/5 shadow-xl overflow-hidden">
        <CardHeader className="pb-6 border-b border-primary/5 bg-muted/20">
          <CardTitle className="text-2xl flex items-center gap-3">
            <Activity className="h-7 w-7 text-primary" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="divide-y divide-primary/5">
              {notifications.length > 0 ? notifications.map((event: any) => (
                <div key={event.id} className="group hover:bg-primary/5 transition-all duration-200 p-6">
                  <div className="flex items-start gap-4">
                    {/* Time marker */}
                    <div className="flex flex-col items-center flex-shrink-0 w-16 text-[10px] uppercase font-bold text-muted-foreground/60 mt-1">
                      <div className="w-2.5 h-2.5 bg-primary/60 rounded-full mb-2 shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
                      <div className="h-full w-px bg-primary/10 mb-2" />
                      {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                              <Bell className="h-4 w-4 text-primary/60" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-bold text-sm leading-tight text-foreground/90">{event.title}</h4>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">System Notification</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold tracking-wider px-2 py-0 h-5 border-primary/20">
                          {event.type?.toUpperCase() || 'INFO'}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground/80 leading-relaxed mb-3">
                        {event.message}
                      </p>

                      {/* Dynamic Badge based on notification type */}
                      <div className="flex flex-wrap gap-2">
                        {event.type === 'submission' && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Form Submission
                          </Badge>
                        )}
                        {event.type === 'alert' && (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold">
                            <Activity className="h-3 w-3 mr-1" />
                            CRITICAL ALERT
                          </Badge>
                        )}
                        {event.type === 'task' && (
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-bold">
                            <Clock className="h-3 w-3 mr-1" />
                            Task Update
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="p-4 bg-muted/50 rounded-full">
                    <Activity className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-muted-foreground">No recent activity</h3>
                    <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
                      Events will appear here as your team performs tasks and submits forms.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Activity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6">
        <Card className="border-primary/5 hover:border-primary/20 transition-colors shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-500" />
              Forms Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.completedTasks}</div>
            <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase">Across assigned projects</p>
          </CardContent>
        </Card>
        <Card className="border-primary/5 hover:border-primary/20 transition-colors shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.activeMembers}</div>
            <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase">Currently Online</p>
          </CardContent>
        </Card>
        <Card className="border-primary/5 hover:border-primary/20 transition-colors shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-500" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.pendingTasks}</div>
            <p className="text-[10px] font-bold text-amber-600 mt-1 uppercase">Requires attention</p>
          </CardContent>
        </Card>
        <Card className="border-primary/5 hover:border-primary/20 transition-colors shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Team Reliability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">94%</div>
            <p className="text-[10px] font-bold text-primary mt-1 uppercase">Avg. Success rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


