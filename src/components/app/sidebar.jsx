import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, User, UserCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sidebar as SidebarRoot,
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
} from '@/components/ui/sidebar'
import { useAuthStore } from '@/features/auth/auth.store'
import { getSidebarSections } from '@/constants/sidebar-items'
import { logout } from '@/features/auth/auth.api'

function isPathActive(currentPath, path) {
  return currentPath === path || currentPath.startsWith(`${path}/`)
}

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  const sections = useMemo(() => getSidebarSections(user?.role), [user?.role])

  async function handleLogout() {
    try {
      await logout()
    } finally {
      clearSession()
      navigate('/login', { replace: true })
    }
  }

  if (!user) {
    return null
  }

  return (
    <SidebarRoot collapsible="none" className="border-r border-slate-300/80 bg-white">
      <SidebarHeader className="border-b border-slate-300/80 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to="/dashboard/overview" />}
              className="h-auto gap-3 rounded-md px-2 py-2"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                <img src="/favicon.svg" alt="MicroERP Logo" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">MicroERP</p>
                <p className="truncate text-xs text-slate-500">
                  {(user.role || '').replaceAll('_', ' ')} Portal
                </p>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-2 py-2">
        {sections.map((section) => (
          <SidebarGroup key={section.title} className="px-2 py-1">
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  if (item.subItems) {
                    const GroupIcon = item.icon

                    return (
                      <SidebarMenuItem key={`${section.title}-${item.title}`}>
                        <div className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-slate-700">
                          <GroupIcon className="h-4 w-4 text-blue-700" />
                          <span>{item.title}</span>
                        </div>
                        <SidebarMenuSub className="mt-1 mb-2">
                          {item.subItems.map((subItem) => {
                            const SubIcon = subItem.icon
                            const isActive = isPathActive(location.pathname, subItem.href)

                            return (
                              <SidebarMenuItem key={subItem.href}>
                                <SidebarMenuSubButton
                                  render={<Link to={subItem.href} />}
                                  isActive={isActive}
                                  className="text-slate-700 data-active:bg-blue-100 data-active:text-blue-800"
                                >
                                  <SubIcon className="h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </SidebarMenuItem>
                    )
                  }

                  const ItemIcon = item.icon
                  const isActive = isPathActive(location.pathname, item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link to={item.href} />}
                        isActive={isActive}
                        tooltip={item.title}
                        className="font-medium text-slate-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-800"
                      >
                        <ItemIcon className="h-4 w-4 text-blue-700" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-300/70 p-3">
        <div className="mb-2 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-2">
          <UserCircle2 className="h-4 w-4 text-slate-500" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">{user.email}</p>
          </div>
        </div>

        <Button
          render={<Link to="/profile" />}
          variant="outline"
          className="mb-2 w-full justify-center"
        >
          <User className="h-3.5 w-3.5" />
          Profile
        </Button>

        <Button
          type="button"
          onClick={handleLogout}
          className="w-full justify-center bg-green-700 text-white hover:bg-green-800"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </Button>
      </SidebarFooter>
    </SidebarRoot>
  )
}
