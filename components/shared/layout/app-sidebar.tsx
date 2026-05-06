'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  BarChart3,
  Shield,
  Bell,
  Settings,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  Activity,
  FileSearch,
  Wrench,
  Server,
  Database,
  HardDrive,
  Zap,
  RefreshCw,
  Bug,
  Globe,
  AlertTriangle,
  History,
  ToggleLeft,
  TestTube,
  Power,
  UserCog,
  Megaphone,
  Gauge,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/lib/auth/AuthContext'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BrandLogo } from '@/components/shared/branding/brand-logo'

const overviewNavItems = [
  { title: 'System Overview', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'Real-Time Activity', icon: Activity, href: '/dashboard/tracking', badge: 'Live', badgeVariant: 'default' as const },
]

const globalManagementItems = [
  {
    title: 'Global Users', icon: Users, href: '/dashboard/users',
    subItems: [
      { title: 'All Users', href: '/dashboard/users' },
      { title: 'Supervisors', href: '/dashboard/users?tab=supervisors' },
      { title: 'Team Leaders', href: '/dashboard/users?tab=leaders' },
      { title: 'Field Workers', href: '/dashboard/users?tab=workers' },
    ],
  },
  {
    title: 'Supervisors', icon: UserCog, href: '/dashboard/supervisors',
    subItems: [
      { title: 'All Supervisors', href: '/dashboard/supervisors' },
      { title: 'Activity Logs', href: '/dashboard/audit' },
    ],
  },
  {
    title: 'View as Team Leader', icon: Users, href: '/teamleader',
    subItems: [
      { title: 'Mission Control', href: '/teamleader/overview' },
    ],
  },
  {
    title: 'Projects Overview', icon: FolderKanban, href: '/dashboard/projects',
    subItems: [
      { title: 'All Projects', href: '/dashboard/projects' },
      { title: 'Active Projects', href: '/dashboard/projects?status=active' },
      { title: 'Frozen / Disabled', href: '/dashboard/projects?status=frozen' },
    ],
  },
  {
    title: 'Global Form Templates', icon: FileSearch, href: '/dashboard/forms',
    subItems: [
      { title: 'Template Library', href: '/dashboard/forms' },
      { title: 'Create Template', href: '/dashboard/forms?create=1' },
    ],
  },
]

const analyticsNavItems = [
  { title: 'System Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { title: 'Audit & Logs', icon: History, href: '/dashboard/audit' },
]

const securityNavItems = [
  {
    title: 'Security Center', icon: Shield, href: '/dashboard/security',
    subItems: [
      { title: 'Overview', href: '/dashboard/security' },
      { title: 'Threat Detection', href: '/dashboard/security/threats' },
      { title: 'Session Manager', href: '/dashboard/security/sessions' },
      { title: 'Access Policies', href: '/dashboard/security/policies' },
    ],
  },
  { title: 'System Alerts', icon: AlertTriangle, href: '/dashboard/alerts', badge: '5', badgeVariant: 'destructive' as const },
]

const maintenanceNavItems = [
  { title: 'System Health', icon: Gauge, href: '/dashboard/maintenance' },
  { title: 'Server Status', icon: Server, href: '/dashboard/maintenance/server' },
  { title: 'Database', icon: Database, href: '/dashboard/maintenance/database' },
  { title: 'Backup & Restore', icon: HardDrive, href: '/dashboard/maintenance/backup' },
  { title: 'Error Tracking', icon: Bug, href: '/dashboard/maintenance/errors' },
  { title: 'Rate Limiting', icon: Zap, href: '/dashboard/maintenance/rate-limits' },
  { title: 'Sync Monitor', icon: RefreshCw, href: '/dashboard/maintenance/sync' },
  { title: 'Storage', icon: HardDrive, href: '/dashboard/maintenance/storage' },
  { title: 'API Monitor', icon: Globe, href: '/dashboard/maintenance/api' },
  { title: 'Feature Flags', icon: ToggleLeft, href: '/dashboard/maintenance/features' },
  { title: 'Test Environment', icon: TestTube, href: '/dashboard/maintenance/sandbox' },
]

const configNavItems = [
  { title: 'Notifications', icon: Bell, href: '/dashboard/alerts', badge: '3', badgeVariant: 'secondary' as const },
  { title: 'Broadcast', icon: Megaphone, href: '/dashboard/broadcast' },
  { title: 'System Settings', icon: Settings, href: '/dashboard/settings' },
  { title: 'Emergency Control', icon: Power, href: '/dashboard/emergency', badge: 'GOD', badgeVariant: 'destructive' as const },
]

type NavItem = {
  title: string
  icon: React.ElementType
  href: string
  badge?: string | null
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

type CollapsibleItem = NavItem & {
  subItems: { title: string; href: string }[]
}

function stripQuery(href: string) {
  return href.split('?')[0]
}

function SimpleNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={pathname === stripQuery(item.href)} tooltip={item.title}>
        <Link href={item.href}>
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
          {item.badge && (
            <Badge variant={item.badgeVariant ?? 'secondary'} className="ml-auto h-5 px-1.5 text-[10px]">
              {item.badge}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function CollapsibleNavItem({ item, pathname, currentUrl }: { item: CollapsibleItem; pathname: string; currentUrl: string }) {
  const itemHref = stripQuery(item.href)
  const isActive = pathname === itemHref || pathname.startsWith(itemHref + '/')
  return (
    <Collapsible asChild defaultOpen={isActive}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.subItems.map((sub) => (
              <SidebarMenuSubItem key={sub.href}>
                <SidebarMenuSubButton asChild isActive={sub.href.includes('?') ? currentUrl === sub.href : pathname === sub.href}>
                  <Link href={sub.href}>{sub.title}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { state: sidebarState } = useSidebar()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const isCollapsed = sidebarState === 'collapsed'
  const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <BrandLogo href="/dashboard" subtitle={isCollapsed ? undefined : 'Mission Control'} compact={isCollapsed} />
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">

        <SidebarGroup>
          <SidebarGroupLabel>System Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewNavItems.map((item) => <SimpleNavItem key={item.href} item={item} pathname={pathname} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Platform Control</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {globalManagementItems.map((item) => <CollapsibleNavItem key={item.href} item={item} pathname={pathname} currentUrl={currentUrl} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Analytics & Audit</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsNavItems.map((item) => <SimpleNavItem key={item.href} item={item} pathname={pathname} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Security</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {securityNavItems.map((item) =>
                'subItems' in item
                  ? <CollapsibleNavItem key={item.href} item={item as CollapsibleItem} pathname={pathname} currentUrl={currentUrl} />
                  : <SimpleNavItem key={item.href} item={item} pathname={pathname} />
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <Collapsible defaultOpen={pathname.startsWith('/dashboard/maintenance')}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:text-foreground flex items-center gap-2 w-full">
                <Wrench className="h-3.5 w-3.5 shrink-0" />
                {!isCollapsed && (
                  <>
                    <span>System Maintenance</span>
                    <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </>
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {maintenanceNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configNavItems.map((item) => <SimpleNavItem key={item.href} item={item} pathname={pathname} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={user?.avatar || "/placeholder-user.jpg"} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || 'System Admin'}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email || 'lespikiusjunior@gmail.com'}</span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56" side="top" align="start" sideOffset={4}>
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    System Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

