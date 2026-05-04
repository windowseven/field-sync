"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { teamService } from '@/lib/api/teamService'
import { haversineDistance, formatDistance } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Users2, Send, MapPin, MessageSquare, Loader2, Radio } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  status: string
  lat?: number
  lng?: number
  is_team_leader?: boolean
  location_updated_at?: string
}

interface ChatMessage {
  id: string
  sender_id: string
  sender_name: string
  message: string
  created_at: string
  is_system?: boolean
}

const PROXIMITY_THRESHOLD = 500 // meters

export default function InteractionPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [noTeam, setNoTeam] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [nearbyMembers, setNearbyMembers] = useState<{ member: TeamMember; distance: number }[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchTeam()
  }, [])

  useEffect(() => {
    pollMessages()
    pollRef.current = setInterval(pollMessages, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [members])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchTeam = async () => {
    try {
      setLoading(true)
      setNoTeam(false)
      const data = await teamService.getMyTeamMembers()
      if (!data) {
        setNoTeam(true)
        return
      }
      const processed = data.members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        status: m.status,
        lat: m.lat ?? undefined,
        lng: m.lng ?? undefined,
        is_team_leader: m.is_team_leader,
        location_updated_at: m.location_updated_at ?? undefined,
      }))
      setMembers(processed)
      calculateNearby(processed)
    } catch (error: any) {
      const isNoTeam = error?.status === 404 || error?.message?.includes('No team assigned')
      if (isNoTeam) {
        setNoTeam(true)
      } else {
        console.error('Failed to fetch team:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateNearby = (teamMembers: TeamMember[]) => {
    const leader = teamMembers.find(m => m.is_team_leader)
    if (!leader?.lat || !leader?.lng) {
      setNearbyMembers([])
      return
    }

    const nearby = teamMembers
      .filter(m => !m.is_team_leader && m.lat && m.lng)
      .map(m => ({
        member: m,
        distance: haversineDistance(leader.lat!, leader.lng!, m.lat!, m.lng!),
      }))
      .filter(({ distance }) => distance < PROXIMITY_THRESHOLD)
      .sort((a, b) => a.distance - b.distance)

    setNearbyMembers(nearby)
  }

  const pollMessages = async () => {
    try {
      const res = await fetch('/api/team/messages', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch {
      // Silently fail on poll
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    setSending(true)
    try {
      await fetch('/api/team/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message: newMessage.trim() }),
      })
      setNewMessage('')
      await pollMessages()
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (noTeam) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="h-5 w-5 text-orange-500" />
              No Team Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Please contact your supervisor to be assigned to a team.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeCount = members.filter(m => m.status === 'online' || m.status === 'active').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Interaction</h1>
          <p className="text-muted-foreground">Chat and proximity monitoring</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users2 className="h-3 w-3" />
            {members.length} Total
          </Badge>
          <Badge className="flex items-center gap-1">
            {activeCount} Active
          </Badge>
          {nearbyMembers.length > 0 && (
            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30 flex items-center gap-1">
              <Radio className="h-3 w-3" />
              {nearbyMembers.length} Nearby
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList>
          <TabsTrigger value="chat" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            Team Chat
          </TabsTrigger>
          <TabsTrigger value="proximity" className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            Nearby Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Team Chat</CardTitle>
              <CardDescription>Real-time communication with your team</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === 'me'
                    const member = members.find(m => m.id === msg.sender_id)
                    return (
                      <div key={msg.id} className={cn('flex items-start gap-2', isOwn && 'flex-row-reverse')}>
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {(msg.sender_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn('max-w-[70%] space-y-1', isOwn ? 'items-end' : 'items-start')}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{msg.sender_name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className={cn(
                            'rounded-lg px-3 py-2 text-sm',
                            msg.is_system
                              ? 'bg-muted/50 text-muted-foreground italic'
                              : isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                          )}>
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
              <div className="p-3 border-t flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  disabled={sending}
                />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proximity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-blue-500" />
                Nearby Team Members
                <Badge variant="secondary" className="ml-auto">{nearbyMembers.length} within {formatDistance(PROXIMITY_THRESHOLD)}</Badge>
              </CardTitle>
              <CardDescription>Team members within {formatDistance(PROXIMITY_THRESHOLD)} radius</CardDescription>
            </CardHeader>
            <CardContent>
              {nearbyMembers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No team members detected nearby</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nearbyMembers.map(({ member, distance }) => (
                    <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border bg-blue-500/5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="text-sm">{formatDistance(distance)}</Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">away</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Team Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full', {
                        'bg-emerald-500': m.status === 'online' || m.status === 'active',
                        'bg-amber-500': m.status === 'idle',
                        'bg-slate-400': !m.status || m.status === 'offline',
                      })} />
                      <span className="text-sm font-medium">{m.name}</span>
                      {m.is_team_leader && <Badge variant="outline" className="text-[10px]">Leader</Badge>}
                    </div>
                    {m.lat && m.lng ? (
                      <span className="text-xs text-muted-foreground font-mono">{m.lat.toFixed(4)}, {m.lng.toFixed(4)}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No location</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
