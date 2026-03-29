import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/app/sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Topbar } from '@/components/app/topbar'

export function AppShell() {
  return (
    <SidebarProvider defaultOpen className="h-screen overflow-hidden">
      <AppSidebar />
      <SidebarInset className="h-screen w-full max-w-full overflow-hidden bg-slate-100">
        <Topbar />
        <main className="min-h-0 flex-1 max-w-full overflow-x-hidden overflow-y-auto p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
