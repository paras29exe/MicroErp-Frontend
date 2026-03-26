import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  createVendor,
  deleteVendor,
  getVendorsList,
  updateVendor,
} from '@/features/master/vendors.api'
import { getApiMessage } from '@/lib/api-response'
import { useAuthStore } from '@/features/auth/auth.store'
import { hasPermission } from '@/lib/permissions'

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString()
}

function parsePositiveInt(value, fallback = 1) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function VendorsPage() {
  const user = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()

  const canCreate = hasPermission(user?.role, 'master:create')
  const canUpdate = hasPermission(user?.role, 'master:update')
  const canDelete = hasPermission(user?.role, 'master:delete')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })

  const initialSearch = (searchParams.get('search') || '').trim()
  const initialPage = parsePositiveInt(searchParams.get('page'), 1)

  const [draftSearch, setDraftSearch] = useState(initialSearch)

  const [search, setSearch] = useState(initialSearch)
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
    const nextPage = parsePositiveInt(searchParams.get('page'), 1)

    setSearch(nextSearch)
    setPage(nextPage)
    setDraftSearch(nextSearch)
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    if (search) params.set('search', search)
    else params.delete('search')

    params.set('page', String(page))

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true })
    }
  }, [search, page, searchParams, setSearchParams])

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
    setNotice('')

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
        setNotice('Vendor updated successfully')
      } else {
        await createVendor(payload)
        setNotice('Vendor created successfully')
      }

      resetForm()
      setPage(1)
      await loadVendors({
        page: 1,
        pageSize,
        ...(search ? { search } : {}),
      })
    } catch (apiError) {
      setFormError(getApiMessage(apiError, 'Failed to save vendor'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(item) {
    if (!canDelete) return

    const confirmed = window.confirm(`Delete vendor \"${item.name}\"?`)
    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      await deleteVendor(item.id)
      setNotice('Vendor deleted successfully')
      await loadVendors({
        page,
        pageSize,
        ...(search ? { search } : {}),
      })
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to delete vendor'))
    }
  }

  useEffect(() => {
    loadVendors({
      page,
      pageSize,
      ...(search ? { search } : {}),
    })
  }, [page, pageSize, search])

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Vendors Master</h2>
          <p className="text-xs text-slate-500">Table-first vendor listing with single search</p>
        </div>

        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setSearch(draftSearch.trim())
          }}
        >
          <input
            type="text"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Search name, phone, email, address"
            className="min-w-64 rounded-sm border border-slate-300 px-2 py-1 text-xs"
          />
          <button
            type="submit"
            className="rounded-sm bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800"
          >
            Apply
          </button>
        </form>
      </header>

      <section className="border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Search:</span> {search || 'None'}
        <span className="ml-4 font-semibold text-slate-700">Total:</span> {meta.total}
      </section>

      {(canCreate || (canUpdate && editingId)) && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-700">
              {editingId ? 'Edit Vendor' : 'Add Vendor'}
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
              placeholder="Vendor name"
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

      {notice && <div className="border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</div>}

      {loading && <div className="border border-slate-300 bg-white px-3 py-2 text-sm">Loading vendors...</div>}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Updated</th>
                  {(canUpdate || canDelete) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={canUpdate || canDelete ? 6 : 5} className="text-center text-slate-500">
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
                    <td>{formatDate(item.updatedAt)}</td>
                    {(canUpdate || canDelete) && (
                      <td>
                        <div className="flex items-center gap-2">
                          {canUpdate && (
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="rounded-sm border border-red-300 px-2 py-1 text-xs text-red-700"
                            >
                              Delete
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
    </section>
  )
}
