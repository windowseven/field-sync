'use client';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { TeamLeaderSidebar } from '@/components/features/teamleader/teamleader-sidebar'
import { QuickTopbar } from '@/components/shared/layout/quick-topbar'
import { useAuth } from '@/lib/auth/AuthContext'
import { Loader2 } from 'lucide-react'

export default function TeamLeaderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?reason=unauthenticated')
    } else if (!isLoading && isAuthenticated && user?.role !== 'team_leader' && user?.role !== 'admin') {
      router.replace('/unauthorized')
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading || !mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <TeamLeaderSidebar />
      <SidebarInset className="flex flex-col">
        <QuickTopbar />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}


