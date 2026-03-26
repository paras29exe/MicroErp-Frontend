import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  createProduct,
  deleteProduct,
  getProductsList,
  updateProduct,
} from '@/features/master/products.api'
import { getApiMessage } from '@/lib/api-response'
import { formatDateDDMMYYYY } from '@/lib/date-format'
import { useAuthStore } from '@/features/auth/auth.store'
import { hasPermission } from '@/lib/permissions'

const CATEGORY_OPTIONS = [
  { label: 'All Categories', value: '' },
  { label: 'Raw', value: 'raw' },
  { label: 'WIP', value: 'wip' },
  { label: 'Finished', value: 'finished' },
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
  const [notice, setNotice] = useState('')
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
  const initialPage = parsePositiveInt(searchParams.get('page'), 1)

  const [draftCategory, setDraftCategory] = useState(initialCategory)
  const [draftSearch, setDraftSearch] = useState(initialSearch)

  const [category, setCategory] = useState(initialCategory)
  const [search, setSearch] = useState(initialSearch)
  const [page, setPage] = useState(initialPage)
  const pageSize = 20

  const canGoPrev = page > 1
  const canGoNext = page < meta.totalPages

  const activeFilterSummary = useMemo(() => {
    const parts = []
    if (category) parts.push(`category: ${category}`)
    if (search) parts.push(`name: ${search}`)
    return parts.length ? parts.join(' | ') : 'No filters'
  }, [category, search])

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
    const nextPage = parsePositiveInt(searchParams.get('page'), 1)

    setCategory(nextCategory)
    setSearch(nextSearch)
    setPage(nextPage)
    setDraftCategory(nextCategory)
    setDraftSearch(nextSearch)
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    if (category) params.set('category', category)
    else params.delete('category')

    if (search) params.set('search', search)
    else params.delete('search')

    params.set('page', String(page))

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true })
    }
  }, [category, search, page, searchParams, setSearchParams])

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
    setNotice('')

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
        setNotice('Product updated successfully')
      } else {
        await createProduct(payload)
        setNotice('Product created successfully')
      }

      resetForm()
      setPage(1)
      await loadProducts({
        page: 1,
        pageSize,
        ...(category ? { category } : {}),
        ...(search ? { search } : {}),
      })
    } catch (apiError) {
      setFormError(getApiMessage(apiError, 'Failed to save product'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(item) {
    if (!canDelete) return

    const confirmed = window.confirm(`Delete product \"${item.name}\"?`)
    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      await deleteProduct(item.id)
      setNotice('Product deleted successfully')
      await loadProducts({
        page,
        pageSize,
        ...(category ? { category } : {}),
        ...(search ? { search } : {}),
      })
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to delete product'))
    }
  }

  useEffect(() => {
    loadProducts({
      page,
      pageSize,
      ...(category ? { category } : {}),
      ...(search ? { search } : {}),
    })
  }, [page, pageSize, category, search])

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Products Master</h2>
          <p className="text-xs text-slate-500">Table-first product listing with category and name search</p>
        </div>

        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            const nextCategory = CATEGORY_OPTIONS.some((option) => option.value === draftCategory)
              ? draftCategory
              : ''
            setPage(1)
            setCategory(nextCategory)
            setSearch(draftSearch.trim())
          }}
        >
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
            type="text"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Search by product name"
            className="min-w-52 rounded-sm border border-slate-300 px-2 py-1 text-xs"
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
        <span className="font-semibold text-slate-700">Filters:</span> {activeFilterSummary}
        <span className="ml-4 font-semibold text-slate-700">Total:</span> {meta.total}
      </section>

      {(canCreate || (canUpdate && editingId)) && (
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

      {notice && <div className="border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</div>}

      {loading && <div className="border border-slate-300 bg-white px-3 py-2 text-sm">Loading products...</div>}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Restock Level</th>
                  <th>Description</th>
                  <th>Updated</th>
                  {(canUpdate || canDelete) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={canUpdate || canDelete ? 6 : 5} className="text-center text-slate-500">
                      No products found
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className="capitalize">{item.category}</td>
                    <td>{item.restockLevel}</td>
                    <td>{item.description || '-'}</td>
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
