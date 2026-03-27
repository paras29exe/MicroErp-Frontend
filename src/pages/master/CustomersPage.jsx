import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  createCustomer,
  deleteCustomer,
  getCustomersList,
  restoreCustomer,
  updateCustomer,
} from '@/features/master/customers.api'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { getApiMessage } from '@/lib/api-response'
import { formatDateDDMMYYYY } from '@/lib/date-format'
import { useAuthStore } from '@/features/auth/auth.store'
import { hasPermission } from '@/lib/permissions'
import { toast } from 'sonner'

function formatDate(value) {
  return formatDateDDMMYYYY(value)
}

function parsePositiveInt(value, fallback = 1) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
  { label: 'All', value: 'all' },
]

export function CustomersPage() {
  const user = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()

  const canCreate = hasPermission(user?.role, 'master:create')
  const canUpdate = hasPermission(user?.role, 'master:update')
  const canDelete = hasPermission(user?.role, 'master:delete')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })

  const initialSearch = (searchParams.get('search') || '').trim()
  const initialStatusRaw = searchParams.get('status') || 'active'
  const initialStatus = STATUS_OPTIONS.some((option) => option.value === initialStatusRaw)
    ? initialStatusRaw
    : 'active'
  const initialPage = parsePositiveInt(searchParams.get('page'), 1)

  const [draftSearch, setDraftSearch] = useState(initialSearch)
  const [draftStatus, setDraftStatus] = useState(initialStatus)
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [page, setPage] = useState(initialPage)
  const pageSize = 20

  const canGoPrev = page > 1
  const canGoNext = page < meta.totalPages

  async function loadCustomers(nextParams = {}) {
    setLoading(true)
    setError('')

    try {
      const data = await getCustomersList(nextParams)
      setItems(data.items)
      setMeta(data.meta)

      if (data.meta.totalPages > 0 && page > data.meta.totalPages) {
        setPage(data.meta.totalPages)
      }
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load customers'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const nextSearch = (searchParams.get('search') || '').trim()
    const nextStatusRaw = searchParams.get('status') || 'active'
    const nextStatus = STATUS_OPTIONS.some((option) => option.value === nextStatusRaw)
      ? nextStatusRaw
      : 'active'
    const nextPage = parsePositiveInt(searchParams.get('page'), 1)

    setSearch(nextSearch)
    setStatus(nextStatus)
    setPage(nextPage)
    setDraftSearch(nextSearch)
    setDraftStatus(nextStatus)
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    if (search) params.set('search', search)
    else params.delete('search')

    if (status !== 'active') params.set('status', status)
    else params.delete('status')

    params.set('page', String(page))

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true })
    }
  }, [search, status, page, searchParams, setSearchParams])

  useEffect(() => {
    loadCustomers({
      page,
      pageSize,
      status,
      ...(search ? { search } : {}),
    })
  }, [page, pageSize, status, search])

  function resetForm() {
    setEditingId(null)
    setFormError('')
    setForm({ name: '', phone: '', email: '', address: '' })
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setFormError('')
    setForm({
      name: item.name || '',
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || '',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!form.name.trim()) {
      setFormError('Customer name is required')
      return
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        await updateCustomer(editingId, payload)
        toast.success('Customer updated successfully')
      } else {
        await createCustomer(payload)
        toast.success('Customer created successfully')
      }

      resetForm()
      setPage(1)
      await loadCustomers({ page: 1, pageSize, status, ...(search ? { search } : {}) })
    } catch (apiError) {
      setFormError(getApiMessage(apiError, 'Failed to save customer'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConfirmDelete() {
    if (!canDelete || !deleteTarget) return

    setDeleting(true)
    setError('')

    try {
      await deleteCustomer(deleteTarget.id)
      toast.success('Customer archived successfully')
      setDeleteTarget(null)
      await loadCustomers({ page, pageSize, status, ...(search ? { search } : {}) })
    } catch (apiError) {
      const message = getApiMessage(apiError, 'Failed to archive customer')
      toast.error(message)
      setDeleteTarget(null)
      setError(message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleRestoreCustomer(item) {
    if (!canUpdate || !item?.id) return

    setError('')

    try {
      await restoreCustomer(item.id)
      toast.success('Customer restored successfully')
      await loadCustomers({ page, pageSize, status, ...(search ? { search } : {}) })
    } catch (apiError) {
      const message = getApiMessage(apiError, 'Failed to restore customer')
      toast.error(message)
      setError(message)
    }
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Customers Master</h2>
          <p className="text-xs text-slate-500">Table-first customer listing with single search</p>
        </div>

        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setSearch(draftSearch.trim())
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
          <input
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Search name, phone, email, address"
            className="min-w-56 rounded-sm border border-slate-300 px-2 py-1 text-xs"
          />
          <button
            type="submit"
            className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setDraftSearch('')
              setDraftStatus('active')
              setSearch('')
              setStatus('active')
              setPage(1)
            }}
            className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
          >
            Clear
          </button>
        </form>
      </header>

      {canCreate && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-700">
              {editingId ? 'Edit Customer' : 'Add Customer'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form className="grid gap-2 md:grid-cols-5" onSubmit={handleSubmit}>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Customer name"
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
            />
            <input
              type="text"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Phone"
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
            />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email"
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
            />
            <input
              type="text"
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              placeholder="Address"
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-sm bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </form>

          {formError && <p className="mt-2 text-xs text-red-700">{formError}</p>}
        </section>
      )}

      {loading && <div className="border border-slate-300 bg-white px-3 py-2 text-sm">Loading customers...</div>}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Updated</th>
                  {(canUpdate || canDelete) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={canUpdate || canDelete ? 7 : 6} className="text-center text-slate-500">
                      No customers found
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.phone || '-'}</td>
                    <td>{item.email || '-'}</td>
                    <td>{item.address || '-'}</td>
                    <td>
                      {item.isDeleted ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          Archived
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td>{formatDate(item.updatedAt)}</td>
                    {(canUpdate || canDelete) && (
                      <td>
                        <div className="flex items-center gap-2">
                          {canUpdate && !item.isDeleted && (
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && !item.isDeleted && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="rounded-sm border border-red-300 px-2 py-1 text-xs text-red-700"
                            >
                              Archive
                            </button>
                          )}
                          {canUpdate && item.isDeleted && (
                            <button
                              type="button"
                              onClick={() => handleRestoreCustomer(item)}
                              className="rounded-sm border border-emerald-300 px-2 py-1 text-xs text-emerald-700"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
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
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Archive Customer"
        description={
          deleteTarget
            ? `Archive customer \"${deleteTarget.name}\"?`
            : 'Archive this customer?'
        }
        helperText="This can be reverted later by restoring the archived customer."
        confirmText="Archive"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </section>
  )
}
