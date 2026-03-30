import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  createUser,
  deactivateUser,
  deleteUser,
  getUserAuditLogs,
  getUserById,
  getUsersList,
  updateUser,
} from '@/features/users/users.api'
import { useAuthStore } from '@/features/auth/auth.store'
import { getApiMessage } from '@/lib/api-response'
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '@/lib/date-format'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { PageLoader } from '@/components/common/page-loader'

const ROLE_OPTIONS = [
  { label: 'All Roles', value: '' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Sales Manager', value: 'SALES_MANAGER' },
  { label: 'Purchase Manager', value: 'PURCHASE_MANAGER' },
  { label: 'Inventory Manager', value: 'INVENTORY_MANAGER' },
  { label: 'Production Manager', value: 'PRODUCTION_MANAGER' },
  { label: 'Accountant', value: 'ACCOUNTANT' },
]

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

const SORTABLE_COLUMNS = ['employeeId', 'name', 'email', 'role', 'isActive', 'createdAt']

function parsePositiveInt(value, fallback = 1) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function getRoleLabel(role) {
  return String(role || '')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isStrongPassword(value) {
  if (!value || value.length < 8) return false
  if (!/[A-Z]/.test(value)) return false
  if (!/[a-z]/.test(value)) return false
  if (!/\d/.test(value)) return false
  if (!/[^A-Za-z0-9]/.test(value)) return false
  return true
}

function getInitialForm() {
  return {
    employeeId: '',
    name: '',
    email: '',
    role: 'SALES_MANAGER',
    password: '',
    isActive: true,
  }
}

function formatAuditAction(action) {
  return String(action || '')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

export function UsersPage() {
  const currentUser = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [form, setForm] = useState(getInitialForm())

  const [confirmState, setConfirmState] = useState({ type: '', user: null })
  const [actionLoading, setActionLoading] = useState(false)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerError, setDrawerError] = useState('')
  const [detailUser, setDetailUser] = useState(null)
  const [auditItems, setAuditItems] = useState([])
  const [auditMeta, setAuditMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 })
  const [auditPage, setAuditPage] = useState(1)

  const initialSearch = (searchParams.get('search') || '').trim()
  const initialRole = searchParams.get('role') || ''
  const initialStatusRaw = searchParams.get('status') || 'all'
  const initialStatus = STATUS_OPTIONS.some((option) => option.value === initialStatusRaw)
    ? initialStatusRaw
    : 'all'
  const initialSortBy = SORTABLE_COLUMNS.includes(searchParams.get('sortBy'))
    ? searchParams.get('sortBy')
    : 'createdAt'
  const initialSortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
  const initialPage = parsePositiveInt(searchParams.get('page'), 1)

  const [draftSearch, setDraftSearch] = useState(initialSearch)
  const [draftRole, setDraftRole] = useState(initialRole)
  const [draftStatus, setDraftStatus] = useState(initialStatus)

  const [search, setSearch] = useState(initialSearch)
  const [role, setRole] = useState(initialRole)
  const [status, setStatus] = useState(initialStatus)
  const [sortBy, setSortBy] = useState(initialSortBy)
  const [sortOrder, setSortOrder] = useState(initialSortOrder)
  const [page, setPage] = useState(initialPage)
  const pageSize = 20

  async function loadUsers(next = {}) {
    const nextPage = next.page ?? page
    const nextPageSize = next.pageSize ?? pageSize
    const nextSearch = next.search ?? search
    const nextRole = next.role ?? role
    const nextStatus = next.status ?? status
    const nextSortBy = next.sortBy ?? sortBy
    const nextSortOrder = next.sortOrder ?? sortOrder

    setLoading(true)
    setError('')

    try {
      const data = await getUsersList({
        page: nextPage,
        pageSize: nextPageSize,
        ...(nextSearch ? { search: nextSearch } : {}),
        ...(nextRole ? { role: nextRole } : {}),
        status: nextStatus,
        sortBy: nextSortBy,
        sortOrder: nextSortOrder,
      })

      setItems(data.items)
      setMeta(data.meta)

      if (data.meta.totalPages > 0 && nextPage > data.meta.totalPages) {
        setPage(data.meta.totalPages)
      }
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load users'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const nextSearch = (searchParams.get('search') || '').trim()
    const nextRole = searchParams.get('role') || ''
    const nextStatusRaw = searchParams.get('status') || 'all'
    const nextStatus = STATUS_OPTIONS.some((option) => option.value === nextStatusRaw)
      ? nextStatusRaw
      : 'all'
    const nextSortBy = SORTABLE_COLUMNS.includes(searchParams.get('sortBy'))
      ? searchParams.get('sortBy')
      : 'createdAt'
    const nextSortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    const nextPage = parsePositiveInt(searchParams.get('page'), 1)

    setSearch(nextSearch)
    setRole(nextRole)
    setStatus(nextStatus)
    setSortBy(nextSortBy)
    setSortOrder(nextSortOrder)
    setPage(nextPage)

    setDraftSearch(nextSearch)
    setDraftRole(nextRole)
    setDraftStatus(nextStatus)
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    if (search) params.set('search', search)
    else params.delete('search')

    if (role) params.set('role', role)
    else params.delete('role')

    if (status !== 'all') params.set('status', status)
    else params.delete('status')

    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    else params.delete('sortBy')

    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder)
    else params.delete('sortOrder')

    params.set('page', String(page))

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true })
    }
  }, [page, role, search, searchParams, setSearchParams, sortBy, sortOrder, status])

  useEffect(() => {
    loadUsers({
      page,
      pageSize,
      search,
      role,
      status,
      sortBy,
      sortOrder,
    })
  }, [page, pageSize, role, search, sortBy, sortOrder, status])

  async function loadUserDetails(userId, targetAuditPage = 1) {
    setDrawerLoading(true)
    setDrawerError('')

    try {
      const [userData, auditData] = await Promise.all([
        getUserById(userId),
        getUserAuditLogs(userId, { page: targetAuditPage, pageSize: 10 }),
      ])

      setDetailUser(userData)
      setAuditItems(auditData.items)
      setAuditMeta(auditData.meta)
    } catch (apiError) {
      setDrawerError(getApiMessage(apiError, 'Failed to load user details'))
    } finally {
      setDrawerLoading(false)
    }
  }

  function openDetails(item) {
    setDrawerOpen(true)
    setDetailUser(item)
    setAuditPage(1)
    loadUserDetails(item.id, 1)
  }

  useEffect(() => {
    if (!drawerOpen || !detailUser?.id) return
    loadUserDetails(detailUser.id, auditPage)
  }, [auditPage])

  function resetForm() {
    setEditingId(null)
    setFormError('')
    setForm(getInitialForm())
  }

  function openCreateDialog() {
    resetForm()
    setFormDialogOpen(true)
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setFormError('')
    setForm({
      employeeId: item.employeeId || '',
      name: item.name || '',
      email: item.email || '',
      role: item.role || 'SALES_MANAGER',
      password: '',
      isActive: Boolean(item.isActive),
    })
    setFormDialogOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const employeeId = form.employeeId.trim()
    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()

    if (!employeeId) {
      setFormError('Employee ID is required')
      return
    }

    if (!name) {
      setFormError('Name is required')
      return
    }

    if (!email || !isValidEmail(email)) {
      setFormError('Please enter a valid email address')
      return
    }

    if (!ROLE_OPTIONS.some((option) => option.value === form.role && option.value)) {
      setFormError('Please select a valid role')
      return
    }

    if (!editingId && !isStrongPassword(form.password)) {
      setFormError('Password must be 8+ chars with uppercase, lowercase, number and special character')
      return
    }

    if (editingId && form.password && !isStrongPassword(form.password)) {
      setFormError('Password must be 8+ chars with uppercase, lowercase, number and special character')
      return
    }

    const payload = {
      employeeId,
      name,
      email,
      role: form.role,
      ...(editingId ? { isActive: Boolean(form.isActive) } : {}),
      ...((!editingId || form.password) ? { password: form.password } : {}),
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        await updateUser(editingId, payload)
        toast.success('User updated successfully')
      } else {
        await createUser(payload)
        toast.success('User created successfully')
      }

      setFormDialogOpen(false)
      resetForm()
      setPage(1)
      await loadUsers({
        page: 1,
        pageSize,
        search,
        role,
        status,
        sortBy,
        sortOrder,
      })
    } catch (apiError) {
      setFormError(getApiMessage(apiError, 'Failed to save user'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSort(column) {
    if (!SORTABLE_COLUMNS.includes(column)) return

    setPage(1)
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortBy(column)
    setSortOrder('asc')
  }

  function getSortIndicator(column) {
    if (sortBy !== column) {
      return '↕'
    }

    return sortOrder === 'asc' ? '↑' : '↓'
  }

  function askDeactivate(item) {
    setConfirmState({ type: 'deactivate', user: item })
  }

  function askActivate(item) {
    setConfirmState({ type: 'activate', user: item })
  }

  function askDelete(item) {
    setConfirmState({ type: 'delete', user: item })
  }

  async function handleConfirmAction() {
    if (!confirmState.user?.id || !confirmState.type) return

    const target = confirmState.user
    const isSelf = currentUser?.id === target.id

    if (isSelf && (confirmState.type === 'deactivate' || confirmState.type === 'delete')) {
      toast.error('You cannot deactivate or delete your own account')
      setConfirmState({ type: '', user: null })
      return
    }

    setActionLoading(true)
    setError('')

    try {
      if (confirmState.type === 'deactivate') {
        await deactivateUser(target.id)
        toast.success('User deactivated successfully')
      }

      if (confirmState.type === 'activate') {
        await updateUser(target.id, { isActive: true })
        toast.success('User activated successfully')
      }

      if (confirmState.type === 'delete') {
        await deleteUser(target.id)
        toast.success('User deleted successfully')
      }

      setConfirmState({ type: '', user: null })
      await loadUsers({
        page,
        pageSize,
        search,
        role,
        status,
        sortBy,
        sortOrder,
      })
    } catch (apiError) {
      const message = getApiMessage(apiError, 'Action failed')
      setError(message)
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  const canGoPrev = page > 1
  const canGoNext = page < meta.totalPages

  const filterSummary = useMemo(() => {
    return `Total: ${meta.total} | Status: ${status}${role ? ` | Role: ${getRoleLabel(role)}` : ''}${
      search ? ` | Search: ${search}` : ''
    }`
  }, [meta.total, role, search, status])

  const confirmTitleByType = {
    activate: 'Activate User',
    deactivate: 'Deactivate User',
    delete: 'Delete User',
  }

  const confirmDescriptionByType = {
    activate: confirmState.user ? `Activate ${confirmState.user.name}?` : 'Activate this user?',
    deactivate: confirmState.user ? `Deactivate ${confirmState.user.name}?` : 'Deactivate this user?',
    delete: confirmState.user ? `Delete ${confirmState.user.name}?` : 'Delete this user?',
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">User Management</h2>
          <p className="text-xs text-slate-500">Admin panel for user access and account lifecycle</p>
          <p className="text-xs text-slate-400">{filterSummary}</p>
        </div>

        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setSearch(draftSearch.trim())
            setRole(draftRole)
            setStatus(draftStatus)
          }}
        >
          <select
            value={draftStatus}
            onChange={(event) => setDraftStatus(event.target.value)}
            className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={draftRole}
            onChange={(event) => setDraftRole(event.target.value)}
            className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Search by employee ID, name or email"
            className="min-w-56 rounded-sm border border-slate-300 px-2 py-1 text-xs"
          />

          <button type="submit" className="rounded-sm border border-slate-300 px-2 py-1 text-xs">
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setDraftSearch('')
              setDraftRole('')
              setDraftStatus('all')
              setSearch('')
              setRole('')
              setStatus('all')
              setSortBy('createdAt')
              setSortOrder('desc')
              setPage(1)
            }}
            className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
          >
            Clear
          </button>
        </form>
      </header>

      <section className="flex justify-end">
        <button
          type="button"
          onClick={openCreateDialog}
          className="rounded-sm bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
        >
          Add User
        </button>
      </section>

      <Dialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onOpenChangeComplete={(open) => {
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription>Configure user identity, role, and account access settings.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Employee ID</label>
                  <input
                    type="text"
                    value={form.employeeId}
                    onChange={(event) => setForm((prev) => ({ ...prev, employeeId: event.target.value }))}
                    placeholder="Enter employee ID"
                    className="w-full rounded-sm border border-slate-300 px-2 py-1.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Enter full name"
                    className="w-full rounded-sm border border-slate-300 px-2 py-1.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="name@company.com"
                    className="w-full rounded-sm border border-slate-300 px-2 py-1.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Role</label>
                  <select
                    value={form.role}
                    onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                    className="w-full rounded-sm border border-slate-300 px-2 py-1.5 text-xs"
                  >
                    {ROLE_OPTIONS.filter((option) => option.value).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {editingId ? 'New Password (Optional)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder={editingId ? 'Leave blank to keep existing password' : 'Create strong password'}
                    className="w-full rounded-sm border border-slate-300 px-2 py-1.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</label>
                  {editingId ? (
                    <select
                      value={form.isActive ? 'true' : 'false'}
                      onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.value === 'true' }))}
                      className="w-full rounded-sm border border-slate-300 px-2 py-1.5 text-xs"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <div className="rounded-sm border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-500">
                      Default status: Active
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-sm border border-blue-100 bg-blue-50 px-2.5 py-2 text-xs text-blue-700">
                Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setFormDialogOpen(false)}
                  className="rounded-sm border border-slate-300 px-3 py-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-sm bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>

            {formError && <p className="mt-2 text-xs text-red-700">{formError}</p>}
          </DialogBody>
        </DialogContent>
      </Dialog>

      {loading && <PageLoader text="Loading user accounts..." />}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort('employeeId')}>
                      Employee ID <span>{getSortIndicator('employeeId')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort('name')}>
                      Name <span>{getSortIndicator('name')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort('email')}>
                      Email <span>{getSortIndicator('email')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort('role')}>
                      Role <span>{getSortIndicator('role')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort('isActive')}>
                      Status <span>{getSortIndicator('isActive')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort('createdAt')}>
                      Created <span>{getSortIndicator('createdAt')}</span>
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-500">
                      No users found
                    </td>
                  </tr>
                )}
                {items.map((item) => {
                  const isSelf = currentUser?.id === item.id
                  return (
                    <tr key={item.id}>
                      <td>{item.employeeId}</td>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>{getRoleLabel(item.role)}</td>
                      <td>
                        {item.isActive ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td>{formatDateDDMMYYYY(item.createdAt)}</td>
                      <td>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDetails(item)}
                            className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
                          >
                            Edit
                          </button>

                          {item.isActive ? (
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => askDeactivate(item)}
                              className="rounded-sm border border-amber-300 px-2 py-1 text-xs text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => askActivate(item)}
                              className="rounded-sm border border-emerald-300 px-2 py-1 text-xs text-emerald-700"
                            >
                              Activate
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => askDelete(item)}
                            className="rounded-sm border border-red-300 px-2 py-1 text-xs text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <footer className="mt-3 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => canGoPrev && setPage((prev) => prev - 1)}
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-slate-600">
              Page {meta.page} of {Math.max(meta.totalPages, 1)}
            </span>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => canGoNext && setPage((prev) => prev + 1)}
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </footer>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(confirmState.type && confirmState.user)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmState({ type: '', user: null })
          }
        }}
        title={confirmTitleByType[confirmState.type] || 'Confirm Action'}
        description={confirmDescriptionByType[confirmState.type] || 'Proceed with this action?'}
        helperText={
          confirmState.type === 'delete'
            ? 'This user will be soft deleted and removed from active listings.'
            : confirmState.type === 'deactivate'
              ? 'The user will lose access until reactivated.'
              : 'The user will be able to sign in again.'
        }
        confirmText={
          confirmState.type === 'delete'
            ? 'Delete'
            : confirmState.type === 'deactivate'
              ? 'Deactivate'
              : 'Activate'
        }
        destructive={confirmState.type === 'delete'}
        loading={actionLoading}
        onConfirm={handleConfirmAction}
      />

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>
              Account profile and activity metadata from audit trail.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
            {drawerLoading && <div className="text-sm text-slate-600">Loading details...</div>}
            {drawerError && (
              <div className="rounded-sm border border-red-300 bg-red-50 px-2 py-2 text-xs text-red-700">
                {drawerError}
              </div>
            )}

            {detailUser && !drawerLoading && (
              <>
                <section className="grid wrap-anywhere gap-2 rounded-sm border border-slate-200 bg-white p-3 text-xs md:grid-cols-2">
                  <div>
                    <p className="text-slate-500">Employee ID</p>
                    <p className="font-semibold text-slate-800">{detailUser.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Role</p>
                    <p className="font-semibold text-slate-800">{getRoleLabel(detailUser.role)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="font-semibold text-slate-800">{detailUser.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Status</p>
                    <p className="font-semibold text-slate-800">{detailUser.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Created</p>
                    <p className="font-semibold text-slate-800">{formatDateTimeDDMMYYYY(detailUser.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Last Updated</p>
                    <p className="font-semibold text-slate-800">{formatDateTimeDDMMYYYY(detailUser.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Deactivated At</p>
                    <p className="font-semibold text-slate-800">
                      {detailUser.deactivatedAt ? formatDateTimeDDMMYYYY(detailUser.deactivatedAt) : '-'}
                    </p>
                  </div>
                </section>

                <section className="rounded-sm border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-700">Audit History</h4>
                    <span className="text-[11px] text-slate-500">{auditMeta.total} events</span>
                  </div>

                  <div className="space-y-2">
                    {auditItems.length === 0 && (
                      <p className="text-xs text-slate-500">No audit events found for this user.</p>
                    )}
                    {auditItems.map((audit) => (
                      <div key={audit.id} className="rounded-sm border border-slate-200 bg-slate-50 px-2 py-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-800">{formatAuditAction(audit.action)}</p>
                          <p className="text-slate-500">{formatDateTimeDDMMYYYY(audit.createdAt)}</p>
                        </div>
                        <p className="mt-1 text-slate-600">
                          By: {audit.actor?.name || 'System'}
                          {audit.actor?.employeeId ? ` (${audit.actor.employeeId})` : ''}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                    <button
                      type="button"
                      disabled={auditPage <= 1}
                      onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                      className="rounded-sm border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-slate-600">
                      Page {auditMeta.page} of {Math.max(auditMeta.totalPages, 1)}
                    </span>
                    <button
                      type="button"
                      disabled={auditPage >= auditMeta.totalPages}
                      onClick={() =>
                        setAuditPage((prev) => (prev < auditMeta.totalPages ? prev + 1 : prev))
                      }
                      className="rounded-sm border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </section>

              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}
