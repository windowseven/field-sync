'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, MapPin, Users, ListTodo, FileText, BarChart3,
  Activity, Settings, Bell, LogOut, ChevronLeft,
  ChevronRight, Search, Plus, Filter, Users2,
  HelpCircle, MessageCircle, Clock, Moon, Sun, ShieldAlert,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/AuthContext'
import { BrandLogo } from '@/components/shared/branding/brand-logo'
import { useTheme } from 'next-themes'
import { useUnreadNotifications, useNotificationListener } from '@/hooks/use-notifications'

export function TeamLeaderSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const unreadNotifications = useUnreadNotifications()
  useNotificationListener()

  const isLinkActive = (href: string) => {
    if (href !== pathname && !pathname.startsWith(href)) return false
    return true
  }

  const teamNavItems = [
    { title: 'Overview', icon: LayoutDashboard, href: '/teamleader/overview' },
    { title: 'Members', icon: Users, href: '/teamleader/members' },
    { title: 'Map', icon: MapPin, href: '/teamleader/map' },
    { title: 'Tasks', icon: ListTodo, href: '/teamleader/tasks' },
    { title: 'Forms', icon: FileText, href: '/teamleader/forms' },
    { title: 'Interaction', icon: MessageCircle, href: '/teamleader/interaction' },
    { title: 'Zones', icon: Users2, href: '/teamleader/zones' },
    { title: 'Emergency', icon: ShieldAlert, href: '/teamleader/emergency' },
    { title: 'Performance', icon: BarChart3, href: '/teamleader/performance' },
    { title: 'Notifications', icon: Bell, href: '/teamleader/notifications', badge: unreadNotifications > 0 ? unreadNotifications : null },
    { title: 'Activity', icon: Activity, href: '/teamleader/activity' },
    { title: 'Settings', icon: Settings, href: '/teamleader/settings' },
  ]

  const teamMembers: { id: string; status: string }[] = []
  const activeMembersCount = teamMembers.filter(m => m.status === 'online' || m.status === 'active').length
  const sessionBadge = <Badge variant="default" className="ml-auto h-5 px-1 text-xs">{activeMembersCount} Active</Badge>

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="h-16 flex items-center justify-between px-4 border-b border-border/50">
        <BrandLogo href="/teamleader/overview" subtitle="Team Leader" className="group-data-[collapsible=icon]:hidden" />
        <BrandLogo href="/teamleader/overview" compact className="hidden group-data-[collapsible=icon]:flex" />
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Mission Control</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teamNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isLinkActive(item.href)}
                    tooltip={item.title}
                    className={cn(
                      "transition-all duration-200",
                      isLinkActive(item.href) && "bg-primary/10 text-primary font-semibold ring-1 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-4 w-4", isLinkActive(item.href) && "text-primary")} />
                      <span>{item.title}</span>
                      {(item as any).badge && (
                        <Badge variant="default" className="ml-auto h-5 px-1.5 text-[10px] group-data-[collapsible=icon]:hidden">
                          {(item as any).badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Session Status Badge in a group */}
        <SidebarSeparator className="my-4" />
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Field Session</SidebarGroupLabel>
          <SidebarGroupContent className="pb-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Live Session</span>
                  </span>
                  {sessionBadge}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-12 hover:bg-muted/50 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                    <span className="text-[10px] font-bold text-primary italic">{user?.name?.slice(0, 2)?.toUpperCase() || 'TL'}</span>
                  </div>
                  <div className="flex flex-col items-start min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="text-xs font-bold truncate">{user?.name || 'Team Leader'}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{user?.email || 'tl@fieldsync.io'}</span>
                  </div>
                  <HelpCircle className="ml-auto h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" side="right">
                <DropdownMenuLabel>Team Leader Control</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/teamleader/settings">
                    <Settings className="mr-2 h-4 w-4" /> Session Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
                  {resolvedTheme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" /> End Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}


