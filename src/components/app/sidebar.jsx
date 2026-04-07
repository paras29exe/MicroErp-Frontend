import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, User, UserCircle2 } from 'lucide-react'
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
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { useAuthStore } from '@/features/auth/auth.store'
import { getSidebarSections } from '@/constants/sidebar-items'
import { logout } from '@/features/auth/auth.api'

function isPathActive(currentPath, path) {
  return currentPath === path || currentPath.startsWith(`${path}/`)
}

function hasActiveSubItem(currentPath, subItems = []) {
  return subItems.some((subItem) => isPathActive(currentPath, subItem.href))
}

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const sections = useMemo(() => getSidebarSections(user), [user])
  const activeGroups = useMemo(() => {
    return sections.reduce((acc, section) => {
      section.items.forEach((item) => {
        if (item.subItems?.length) {
          const groupKey = `${section.title}-${item.title}`
          acc[groupKey] = hasActiveSubItem(location.pathname, item.subItems)
        }
      })
      return acc
    }, {})
  }, [location.pathname, sections])
  const [openGroups, setOpenGroups] = useState(activeGroups)

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev }
      Object.entries(activeGroups).forEach(([groupKey, isActive]) => {
        if (isActive) {
          next[groupKey] = true
        }
      })
      return next
    })
  }, [activeGroups])

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
    <SidebarRoot collapsible="none" className="h-screen overflow-hidden border-r border-slate-300/80 bg-white">
      <SidebarHeader className="sticky top-0 z-10 shrink-0 border-b border-slate-300/80 bg-white p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-auto gap-3 rounded-md px-2 py-2">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                <img src="/logo.png" alt="MicroERP Logo" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">MicroERP</p>
                <p className="truncate text-xs text-slate-500">
                  {(user.role || '').replaceAll('_', ' ')} Portal
                </p>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="min-h-0 flex-1 gap-2 overflow-y-auto py-2">
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
                    const groupKey = `${section.title}-${item.title}`
                    const isOpen = openGroups[groupKey] ?? activeGroups[groupKey]
                    const isGroupActive = activeGroups[groupKey]

                    return (
                      <SidebarMenuItem key={`${section.title}-${item.title}`}>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenGroups((prev) => ({
                              ...prev,
                              [groupKey]: !isOpen,
                            }))
                          }
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium transition-colors ${
                            isGroupActive
                              ? 'bg-blue-100 text-blue-800'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <GroupIcon className={`h-4 w-4 ${isGroupActive ? 'text-blue-800' : 'text-blue-700'}`} />
                          <span className="flex-1">{item.title}</span>
                          <ChevronDown
                            className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        <SidebarMenuSub className={`mt-1 mb-2 ${isOpen ? '' : 'hidden'}`}>
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

      <SidebarFooter className="sticky bottom-0 z-10 shrink-0 border-t border-slate-300/70 bg-white p-3">
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
          onClick={() => setConfirmLogoutOpen(true)}
          className="w-full justify-center bg-blue-700 text-white hover:bg-blue-800"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </Button>
      </SidebarFooter>

      <ConfirmDialog
        open={confirmLogoutOpen}
        onOpenChange={(open) => {
          if (isLoggingOut) return
          setConfirmLogoutOpen(open)
        }}
        title="Confirm Logout"
        description="Are you sure you want to log out of MicroERP?"
        helperText="You will be redirected to the login page."
        confirmText="Logout"
        destructive
        loading={isLoggingOut}
        onConfirm={async () => {
          setIsLoggingOut(true)
          try {
            await handleLogout()
            setConfirmLogoutOpen(false)
          } finally {
            setIsLoggingOut(false)
          }
        }}
      />
    </SidebarRoot>
  )
}
