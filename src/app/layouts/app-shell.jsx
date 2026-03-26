import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/app/sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Topbar } from '@/components/app/topbar'

export function AppShell() {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100">
        <Topbar />
        <main className="flex-1 max-w-full overflow-x-hidden p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
