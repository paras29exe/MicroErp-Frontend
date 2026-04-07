import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  createVendor,
  deleteVendor,
  getVendorsList,
  restoreVendor,
  updateVendor,
} from '@/features/master/vendors.api'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getApiMessage } from '@/lib/api-response'
import { formatDateDDMMYYYY } from '@/lib/date-format'
import { useAuthStore } from '@/features/auth/auth.store'
import { hasPermission } from '@/lib/permissions'
import { toast } from 'sonner'
import { PageLoader } from '@/components/common/page-loader'

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

export function VendorsPage() {
  const user = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()

  const canCreate = hasPermission(user, 'master:create')
  const canUpdate = hasPermission(user, 'master:update')
  const canDelete = hasPermission(user, 'master:delete')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
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

  async function loadVendors(nextParams = {}) {
    setLoading(true)
    setError('')

    try {
      const data = await getVendorsList(nextParams)
      setItems(data.items)
      setMeta(data.meta)

      if (data.meta.totalPages > 0 && page > data.meta.totalPages) {
        setPage(data.meta.totalPages)
      }
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load vendors'))
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
    loadVendors({
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

  function openCreateDialog() {
    resetForm()
    setFormDialogOpen(true)
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
    setFormDialogOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!form.name.trim()) {
      setFormError('Vendor name is required')
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
        await updateVendor(editingId, payload)
        toast.success('Vendor updated successfully')
      } else {
        await createVendor(payload)
        toast.success('Vendor created successfully')
      }

      setFormDialogOpen(false)
      resetForm()
      setPage(1)
      await loadVendors({
        page: 1,
        pageSize,
        status,
        ...(search ? { search } : {}),
      })
    } catch (apiError) {
      setFormError(getApiMessage(apiError, 'Failed to save vendor'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConfirmDelete() {
    if (!canDelete || !deleteTarget) return

    setDeleting(true)
    setError('')

    try {
      await deleteVendor(deleteTarget.id)
      toast.success('Vendor archived successfully')
      setDeleteTarget(null)
      await loadVendors({
        page,
        pageSize,
        status,
        ...(search ? { search } : {}),
      })
    } catch (apiError) {
      const message = getApiMessage(apiError, 'Failed to archive vendor')
      toast.error(message)
      setDeleteTarget(null)
      setError(message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleRestoreVendor(item) {
    if (!canUpdate || !item?.id) return

    setError('')

    try {
      await restoreVendor(item.id)
      toast.success('Vendor restored successfully')
      await loadVendors({
        page,
        pageSize,
        status,
        ...(search ? { search } : {}),
      })
    } catch (apiError) {
      const message = getApiMessage(apiError, 'Failed to restore vendor')
      toast.error(message)
      setError(message)
    }
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Vendors Data</h2>
          <p className="text-xs text-slate-500">Vendor listing with single search</p>
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

      {(canCreate || canUpdate) && (
        <Dialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          onOpenChangeComplete={(open) => {
            if (!open) resetForm()
          }}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
              <DialogDescription>Maintain supplier information in a clear, professional form.</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vendor Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Enter vendor or company name"
                      className="w-full rounded-sm border border-slate-300 px-2 py-1.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Phone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                      placeholder="Enter phone number"
                      className="w-full rounded-sm border border-slate-300 px-2 py-1.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="name@vendor.com"
                      className="w-full rounded-sm border border-slate-300 px-2 py-1.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Address</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                      placeholder="Street, city, state, postal code"
                      className="w-full rounded-sm border border-slate-300 px-2 py-1.5 text-xs"
                    />
                  </div>
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
                    {isSubmitting ? 'Saving...' : editingId ? 'Update Vendor' : 'Create Vendor'}
                  </button>
                </div>
              </form>

              {formError && <p className="mt-2 text-xs text-red-700">{formError}</p>}
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}

      {canCreate && (
        <section className="flex justify-end">
          <button
            type="button"
            onClick={openCreateDialog}
            className="rounded-sm bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
          >
            Add Vendor
          </button>
        </section>
      )}

      {loading && <PageLoader text="Loading vendors..." />}
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
                      No vendors found
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
                              onClick={() => handleRestoreVendor(item)}
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
        title="Archive Vendor"
        description={
          deleteTarget
            ? `Archive vendor \"${deleteTarget.name}\"?`
            : 'Archive this vendor?'
        }
        helperText="This can be reverted later by restoring the archived vendor."
        confirmText="Archive"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </section>
  )
}
