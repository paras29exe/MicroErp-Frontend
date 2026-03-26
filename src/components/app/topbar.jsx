import { useAuthStore } from '@/features/auth/auth.store'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function Topbar() {
  const user = useAuthStore((state) => state.user)

  return (
    <header className="flex h-12 items-center justify-between border-b border-slate-300 bg-slate-50 px-4">
      <div className="flex items-center gap-2">
        {/* <SidebarTrigger className="text-slate-700 hover:bg-slate-200" /> */}
        <span className="text-sm font-semibold text-slate-700">MicroERP Workspace</span>
      </div>
      <div className="text-xs text-slate-600">
        {user?.name} ({user?.role})
      </div>
    </header>
  )
}
