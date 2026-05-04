'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, ClipboardList, FileText, MapPin, Users,
  Bell, HelpCircle, RefreshCw, Settings, LogOut,
  Wifi, WifiOff, Clock, UserCircle2, MoreHorizontal,
  Zap, Moon, Sun,
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

export function UserSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const unreadNotifications = useUnreadNotifications()
  useNotificationListener()

  const isLinkActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const syncData = { pending: 0, failed: 0 }
  const pendingSync = syncData.pending + syncData.failed
  const syncFailed = syncData.failed

  const fieldNavItems = [
    { title: 'Home', icon: Home, href: '/user/home', badge: null },
    { title: 'My Tasks', icon: ClipboardList, href: '/user/tasks', badge: null },
    { title: 'Forms', icon: FileText, href: '/user/forms', badge: null },
    { title: 'My Map', icon: MapPin, href: '/user/map', badge: null },
    { title: 'Nearby Team', icon: Users, href: '/user/team', badge: null },
  ]

  const supportNavItems = [
    { title: 'Notifications', icon: Bell, href: '/user/notifications', badge: unreadNotifications > 0 ? unreadNotifications : null },
    { title: 'Request Help', icon: HelpCircle, href: '/user/help', badge: null },
    {
      title: 'Sync Status',
      icon: pendingSync > 0 ? WifiOff : Wifi,
      href: '/user/sync',
      badge: pendingSync > 0 ? pendingSync : null,
      badgeVariant: syncFailed > 0 ? 'destructive' : 'secondary',
    },
    { title: 'Settings', icon: Settings, href: '/user/settings', badge: null },
  ]
  type SupportItem = (typeof supportNavItems)[number]

  const sessionStatus = { status: 'idle', duration: '0:00' }
  const isActive = sessionStatus.status === 'active'

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      {/* Header */}
      <SidebarHeader className="h-16 flex items-center justify-between px-4 border-b border-border/50">
        <BrandLogo href="/user/home" subtitle="Field App" className="group-data-[collapsible=icon]:hidden" />
        <BrandLogo href="/user/home" compact className="hidden group-data-[collapsible=icon]:flex" />
      </SidebarHeader>

      <SidebarContent>
        {/* Session Status Pill */}
        <SidebarGroup className="py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className={cn(
                  'h-11 border transition-colors',
                  isActive
                    ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400'
                    : 'border-muted-foreground/20 bg-muted/50 text-muted-foreground'
                )}
              >
                <Clock className={cn('h-4 w-4 shrink-0', isActive ? 'text-emerald-500' : '')} />
                <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {isActive ? 'Session Active' : 'Not Started'}
                  </span>
                  {isActive && (
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {sessionStatus.duration || '0:00'}
                    </span>
                  )}
                </div>
                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 animate-pulse group-data-[collapsible=icon]:hidden" />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="opacity-40" />

        {/* Field Operations */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Field Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fieldNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isLinkActive(item.href)}
                    tooltip={item.title}
                    className={cn(
                      'transition-all duration-200',
                      isLinkActive(item.href) &&
                        'bg-primary/10 text-primary font-semibold ring-1 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon
                        className={cn('h-4 w-4', isLinkActive(item.href) && 'text-primary')}
                      />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="default" className="ml-auto h-5 px-1.5 text-[10px] group-data-[collapsible=icon]:hidden">
                          {item.badge}
                        </Badge>
                      )}
                      {isLinkActive(item.href) && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary group-data-[collapsible=icon]:hidden" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="opacity-40" />

        {/* Support */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isLinkActive(item.href)}
                    tooltip={item.title}
                    className={cn(
                      'transition-all duration-200',
                      isLinkActive(item.href) &&
                        'bg-primary/10 text-primary font-semibold ring-1 ring-primary/20'
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon
                        className={cn(
                          'h-4 w-4',
                          isLinkActive(item.href) && 'text-primary',
                          item.href === '/user/sync' && syncFailed > 0 && !isLinkActive(item.href)
                            ? 'text-destructive'
                            : ''
                        )}
                      />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant={(item as SupportItem).badgeVariant === 'destructive' ? 'destructive' : 'default'}
                          className="ml-auto h-5 px-1.5 text-[10px] group-data-[collapsible=icon]:hidden"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="opacity-50" />

      {/* Footer – User Profile */}
      <SidebarFooter className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-12 hover:bg-muted/50 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                    <span className="text-[10px] font-bold text-primary">
                      {user?.name?.slice(0, 1)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex flex-col items-start min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="text-xs font-bold truncate">{user?.name || 'User'}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{user?.email || 'field@fieldsync.io'}</span>
                  </div>
                  <MoreHorizontal className="ml-auto h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" side="right">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/user/settings">
                    <UserCircle2 className="mr-2 h-4 w-4" /> Profile & Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
                  {resolvedTheme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" /> End Session & Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}


