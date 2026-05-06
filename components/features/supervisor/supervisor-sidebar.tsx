'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Map, Users, Layers, FileText,
  Shield, Settings, Bell, LogOut, ChevronLeft,
  ChevronRight, Search, Plus, Filter, Globe,
  FolderOpen, ArrowLeftRight, CheckCircle2,
  MoreHorizontal, UserCircle, Moon, Sun,
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
import { projectService } from '@/lib/api/projectService'
import { useAuth } from '@/lib/auth/AuthContext'
import { BrandLogo } from '@/components/shared/branding/brand-logo'
import { useTheme } from 'next-themes'
import { useUnreadNotifications, useNotificationListener } from '@/hooks/use-notifications'

export function SupervisorSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const unreadNotifications = useUnreadNotifications()
  useNotificationListener()

  // Helper function to get project by ID (mock fallback for now)
  const getProjectById = (id: string): { id: string; name: string; location: string } | null => {
    // This is a simplified version - in production, use projectService.getById(id)
    // For now, return placeholder data to avoid type errors
    return { id, name: 'Loading...', location: '' }
  }

  // Determine if we are in a project-scoped route
  // Pattern: /supervisor/projects/[projectId]/...
  const pathSegments = pathname.split('/')
  const isProjectMode = pathSegments[2] === 'projects' && pathSegments[3] && pathSegments[3] !== 'new'
  const projectId = isProjectMode ? pathSegments[3] : null
  const project = projectId ? getProjectById(projectId) : null

  const isLinkActive = (href: string) => {
    if (href === '/supervisor/projects' && pathname === '/supervisor/projects') return true
    if (href !== '/supervisor/projects' && pathname.startsWith(href)) return true
    return false
  }

  // Workspace Navigation Items
  const workspaceItems = [
    { title: 'My Projects', icon: FolderOpen, href: '/supervisor/projects' },
    { title: 'Notifications', icon: Bell, href: '/supervisor/notifications', badge: unreadNotifications > 0 ? unreadNotifications : null },
    { title: 'Settings', icon: Settings, href: '/supervisor/settings' },
  ]

  // Project Navigation Items
  const projectItems = [
    { title: 'Overview', icon: LayoutDashboard, href: `/supervisor/projects/${projectId}` },
    { title: 'Live Map', icon: Map, href: `/supervisor/projects/${projectId}/map` },
    { title: 'Teams', icon: Users, href: `/supervisor/projects/${projectId}/teams` },
    { title: 'Zones', icon: Layers, href: `/supervisor/projects/${projectId}/zones` },
    { title: 'Forms & Tasks', icon: FileText, href: `/supervisor/projects/${projectId}/forms` },
    { title: 'Project Users', icon: Shield, href: `/supervisor/projects/${projectId}/users` },
    { title: 'Invitations', icon: UserCircle, href: `/supervisor/projects/${projectId}/invitations` },
    { title: 'Analytics', icon: Globe, href: `/supervisor/projects/${projectId}/analytics` },
    { title: 'Audit Logs', icon: CheckCircle2, href: `/supervisor/projects/${projectId}/audit` },
    { title: 'Project Settings', icon: Settings, href: `/supervisor/projects/${projectId}/settings` },
  ]

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="h-16 flex items-center justify-between px-4 border-b border-border/50">
        <BrandLogo href="/supervisor/projects" subtitle="Supervisor" className="group-data-[collapsible=icon]:hidden" />
        <BrandLogo href="/supervisor/projects" compact className="hidden group-data-[collapsible=icon]:flex" />
      </SidebarHeader>

      <SidebarContent className="py-2">
        {isProjectMode && project ? (
          <>
            {/* Project Switcher */}
            <SidebarGroup className="py-2">
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Active Project</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton className="h-12 border border-primary/10 bg-primary/5 hover:bg-primary/10 transition-colors">
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <FolderOpen className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col items-start min-w-0 group-data-[collapsible=icon]:hidden">
                            <span className="text-xs font-bold truncate w-full">{project.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate w-full">{project.location}</span>
                          </div>
                          <ArrowLeftRight className="ml-auto h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                        </div>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64" align="start" side="right">
                      <DropdownMenuLabel className="text-[10px] font-bold uppercase text-muted-foreground">Switch Project</DropdownMenuLabel>
                      {([] as { id: string; name: string; location: string }[]).filter(p => p.id !== projectId).map(p => (
                        <DropdownMenuItem key={p.id} asChild className="p-2">
                          <Link href={`/supervisor/projects/${p.id}`} className="flex items-center gap-3 cursor-pointer">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                              <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold">{p.name}</span>
                              <span className="text-[10px] text-muted-foreground">{p.location}</span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="p-2">
                        <Link href="/supervisor/projects" className="flex items-center gap-3 cursor-pointer text-primary">
                          <FolderOpen className="h-4 w-4" />
                          <span className="text-xs font-semibold">Back to Workspace</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-2">
                        <Link href="/supervisor/projects/new" className="flex items-center gap-3 cursor-pointer">
                          <Plus className="h-4 w-4" />
                          <span className="text-xs font-semibold">Create New Project</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {/* Project Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Project Control</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projectItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
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
                          <span className="text-sm">{item.title}</span>
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
          </>
        ) : (
          /* Workspace Navigation */
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Supervisor Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {workspaceItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isLinkActive(item.href)}
                      tooltip={item.title}
                      className={cn(
                        "transition-all duration-200",
                        isLinkActive(item.href) && "bg-primary/10 text-primary font-semibold ring-1 ring-primary/20"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn("h-4 w-4", isLinkActive(item.href) && "text-primary")} />
                        <span className="text-sm">{item.title}</span>
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
        )}
      </SidebarContent>

      <SidebarSeparator className="opacity-50" />

      <SidebarFooter className="py-4">
        {/* User Profile MiniSection */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-12 hover:bg-muted/50 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                    <span className="text-[10px] font-bold text-primary italic">{user?.name?.slice(0, 2)?.toUpperCase() || 'SU'}</span>
                  </div>
                  <div className="flex flex-col items-start min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="text-xs font-bold truncate">{user?.name || 'Field Supervisor'}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{user?.email || 'supervisor@fieldsync.io'}</span>
                  </div>
                  <MoreHorizontal className="ml-auto h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" side="right">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/supervisor/settings">
                    <Settings className="mr-2 h-4 w-4" /> Personal Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
                  {resolvedTheme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

