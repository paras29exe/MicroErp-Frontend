import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  createProduct,
  deleteProduct,
  getProductsList,
  restoreProduct,
  updateProduct,
} from '@/features/master/products.api'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { getApiMessage } from '@/lib/api-response'
import { formatDateDDMMYYYY } from '@/lib/date-format'
import { useAuthStore } from '@/features/auth/auth.store'
import { hasPermission } from '@/lib/permissions'
import { toast } from 'sonner'

const CATEGORY_OPTIONS = [
  { label: 'All Categories', value: '' },
  { label: 'Raw', value: 'raw' },
  { label: 'WIP', value: 'wip' },
  { label: 'Finished', value: 'finished' },
]

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
  { label: 'All', value: 'all' },
]

function formatDate(value) {
  return formatDateDDMMYYYY(value)
}

function parsePositiveInt(value, fallback = 1) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function ProductsPage() {
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
  const [form, setForm] = useState({
    name: '',
    category: 'raw',
    restockLevel: '',
    description: '',
  })

  const initialCategory = searchParams.get('category') || ''
  const initialSearch = (searchParams.get('search') || '').trim()
  const initialStatusRaw = searchParams.get('status') || 'active'
  const initialStatus = STATUS_OPTIONS.some((option) => option.value === initialStatusRaw)
    ? initialStatusRaw
    : 'active'
  const initialPage = parsePositiveInt(searchParams.get('page'), 1)

  const [draftCategory, setDraftCategory] = useState(initialCategory)
  const [draftSearch, setDraftSearch] = useState(initialSearch)
  const [draftStatus, setDraftStatus] = useState(initialStatus)

  const [category, setCategory] = useState(initialCategory)
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [page, setPage] = useState(initialPage)
  const pageSize = 20

  const canGoPrev = page > 1
  const canGoNext = page < meta.totalPages

  const activeFilterSummary = useMemo(() => {
    const parts = []
    parts.push(`status: ${status}`)
    if (category) parts.push(`category: ${category}`)
    if (search) parts.push(`name: ${search}`)
    return parts.length ? parts.join(' | ') : 'No filters'
  }, [status, category, search])

  async function loadProducts(nextParams = {}) {
    setLoading(true)
    setError('')

    try {
      const data = await getProductsList(nextParams)
      setItems(data.items)
      setMeta(data.meta)

      if (data.meta.totalPages > 0 && page > data.meta.totalPages) {
        setPage(data.meta.totalPages)
      }
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load products'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const nextCategoryRaw = searchParams.get('category') || ''
    const nextCategory = CATEGORY_OPTIONS.some((option) => option.value === nextCategoryRaw)
      ? nextCategoryRaw
      : ''
    const nextSearch = (searchParams.get('search') || '').trim()
    const nextStatusRaw = searchParams.get('status') || 'active'
    const nextStatus = STATUS_OPTIONS.some((option) => option.value === nextStatusRaw)
      ? nextStatusRaw
      : 'active'
    const nextPage = parsePositiveInt(searchParams.get('page'), 1)

    setCategory(nextCategory)
    setSearch(nextSearch)
    setStatus(nextStatus)
    setPage(nextPage)
    setDraftCategory(nextCategory)
    setDraftSearch(nextSearch)
    setDraftStatus(nextStatus)
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    if (category) params.set('category', category)
    else params.delete('category')

    if (search) params.set('search', search)
    else params.delete('search')

    if (status !== 'active') params.set('status', status)
    else params.delete('status')

    params.set('page', String(page))

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true })
    }
  }, [category, search, status, page, searchParams, setSearchParams])

  useEffect(() => {
    loadProducts({
      page,
      pageSize,
      status,
      ...(category ? { category } : {}),
      ...(search ? { search } : {}),
    })
  }, [page, pageSize, status, category, search])

  function resetForm() {
    setEditingId(null)
    setFormError('')
    setForm({
      name: '',
      category: 'raw',
      restockLevel: '',
      description: '',
    })
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setFormError('')
    setForm({
      name: item.name || '',
      category: item.category || 'raw',
      restockLevel: String(item.restockLevel ?? ''),
      description: item.description || '',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!form.name.trim()) {
      setFormError('Product name is required')
      return
    }

    if (!CATEGORY_OPTIONS.some((option) => option.value === form.category && option.value)) {
      setFormError('Please select a valid category')
      return
    }

    const parsedRestockLevel = Number(form.restockLevel)
    if (!Number.isFinite(parsedRestockLevel) || parsedRestockLevel < 0) {
      setFormError('Restock level must be a non-negative number')
      return
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      restockLevel: parsedRestockLevel,
      description: form.description.trim() || null,
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        await updateProduct(editingId, payload)
        toast.success('Product updated successfully')
      } else {
        await createProduct(payload)
        toast.success('Product created successfully')
      }

      resetForm()
      setPage(1)
      await loadProducts({
        page: 1,
        pageSize,
        status,
        ...(category ? { category } : {}),
        ...(search ? { search } : {}),
      })
    } catch (apiError) {
      setFormError(getApiMessage(apiError, 'Failed to save product'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConfirmDelete() {
    if (!canDelete || !deleteTarget) return

    setDeleting(true)
    setError('')

    try {
      await deleteProduct(deleteTarget.id)
      toast.success('Product archived successfully')
      setDeleteTarget(null)
      await loadProducts({
        page,
        pageSize,
        status,
        ...(category ? { category } : {}),
        ...(search ? { search } : {}),
      })
    } catch (apiError) {
      const message = getApiMessage(apiError, 'Failed to archive product')
      toast.error(message)
      setDeleteTarget(null)
      setError(message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleRestoreProduct(item) {
    if (!canUpdate || !item?.id) return

    setError('')

    try {
      await restoreProduct(item.id)
      toast.success('Product restored successfully')
      await loadProducts({
        page,
        pageSize,
        status,
        ...(category ? { category } : {}),
        ...(search ? { search } : {}),
      })
    } catch (apiError) {
      const message = getApiMessage(apiError, 'Failed to restore product')
      toast.error(message)
      setError(message)
    }
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Products Master</h2>
          <p className="text-xs text-slate-500">Table-first product listing with filters</p>
          <p className="text-xs text-slate-400">{activeFilterSummary}</p>
        </div>

        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setCategory(draftCategory)
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
          <select
            value={draftCategory}
            onChange={(event) => setDraftCategory(event.target.value)}
            className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Search by product name"
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
              setDraftCategory('')
              setDraftSearch('')
              setDraftStatus('active')
              setCategory('')
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
              {editingId ? 'Edit Product' : 'Add Product'}
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
              placeholder="Product name"
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
            />
            <select
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
            >
              {CATEGORY_OPTIONS.filter((option) => option.value).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="1"
              value={form.restockLevel}
              onChange={(event) => setForm((prev) => ({ ...prev, restockLevel: event.target.value }))}
              placeholder="Restock level"
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
            />
            <input
              type="text"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Description (optional)"
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

      {loading && <div className="border border-slate-300 bg-white px-3 py-2 text-sm">Loading products...</div>}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Restock Level</th>
                  <th>Description</th>
                  <th>Updated</th>
                  {(canUpdate || canDelete) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={canUpdate || canDelete ? 7 : 6} className="text-center text-slate-500">
                      No products found
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className="capitalize">{item.category}</td>
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
                    <td>{item.restockLevel}</td>
                    <td>{item.description || '-'}</td>
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
                              onClick={() => handleRestoreProduct(item)}
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
        title="Archive Product"
        description={
          deleteTarget
            ? `Archive product \"${deleteTarget.name}\"?`
            : 'Archive this product?'
        }
        helperText="This can be reverted later by restoring the archived product."
        confirmText="Archive"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </section>
  )
}
