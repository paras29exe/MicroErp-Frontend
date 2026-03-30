import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InventoryFilterDialog } from '@/components/inventory/InventoryFilterDialog'
import { getInventoryList } from '@/features/inventory/inventory.api'
import { useAuthStore } from '@/features/auth/auth.store'
import { getApiMessage } from '@/lib/api-response'
import { formatDateDDMMYYYY } from '@/lib/date-format'
import { hasPermission } from '@/lib/permissions'
import { PageLoader } from '@/components/common/page-loader'

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function getFiltersFromSearchParams(searchParams) {
  return {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    stockStatus: searchParams.get('stockStatus') || '',
    lowStock: searchParams.get('lowStock') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  }
}

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
  if (direction === 'asc') return <ArrowUp className="h-3.5 w-3.5 text-slate-700" />
  return <ArrowDown className="h-3.5 w-3.5 text-slate-700" />
}

function formatCategory(category) {
  if (!category) return '-'
  return category.toUpperCase()
}

function getStockClass(row) {
  if (row.stockQuantity === 0) return 'text-red-700'
  if (row.stockQuantity <= row.reorderLevel) return 'text-amber-700'
  return 'text-green-700'
}

export function InventoryStockPage() {
  const user = useAuthStore((state) => state.user)
  const canUpdate = hasPermission(user?.role, 'inventory:update')

  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [filtersOpen, setFiltersOpen] = useState(false)

  const page = parsePositiveInt(searchParams.get('page'), 1)
  const limit = parsePositiveInt(searchParams.get('limit'), 20)
  const sortBy = searchParams.get('sortBy') || 'productName'
  const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc'
  const filters = useMemo(() => getFiltersFromSearchParams(searchParams), [searchParams])

  const canGoPrev = page > 1
  const canGoNext = page < meta.totalPages

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const data = await getInventoryList({
        page,
        limit,
        sortBy,
        sortOrder,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.stockStatus ? { stockStatus: filters.stockStatus } : {}),
        ...(filters.lowStock ? { lowStock: filters.lowStock } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
      })

      setRows(data.items)
      setMeta(data.meta)
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load inventory stock'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [searchParams])

  function updateQuery(nextState) {
    const params = new URLSearchParams(searchParams)

    const nextPage = nextState.page ?? page
    const nextLimit = nextState.limit ?? limit
    const nextSortBy = nextState.sortBy ?? sortBy
    const nextSortOrder = nextState.sortOrder ?? sortOrder

    params.set('page', String(nextPage))
    params.set('limit', String(nextLimit))
    params.set('sortBy', nextSortBy)
    params.set('sortOrder', nextSortOrder)

    const nextFilters = nextState.filters || filters
    Object.entries(nextFilters).forEach(([key, value]) => {
      const normalized = String(value || '').trim()
      if (normalized) params.set(key, normalized)
      else params.delete(key)
    })

    setSearchParams(params)
  }

  function toggleSort(field) {
    const nextOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc'
    updateQuery({ page: 1, sortBy: field, sortOrder: nextOrder })
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Stock Ledger</h2>
          <p className="text-xs text-slate-500">Monitor stock levels and reorder thresholds.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="mr-2 font-semibold text-slate-700">Total: {meta.total}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
            Filters
          </Button>
          {canUpdate && (
            <Button render={<Link to="/inventory/adjustments" />} type="button" size="sm" className="bg-green-700 text-white hover:bg-green-800">
              Adjust Stock
            </Button>
          )}
        </div>
      </header>

      <section className="border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Search:</span> {filters.search || 'None'}
        <span className="ml-4 font-semibold text-slate-700">Category:</span> {filters.category || 'Any'}
        <span className="ml-4 font-semibold text-slate-700">Status:</span> {filters.stockStatus || 'Any'}
      </section>

      {loading && <PageLoader text="Loading inventory stock..." />}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort('productName')}
                    >
                      <span>Product</span>
                      <SortIcon active={sortBy === 'productName'} direction={sortOrder} />
                    </button>
                  </th>
                  <th>Category</th>
                  <th>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort('stockQuantity')}
                    >
                      <span>Stock</span>
                      <SortIcon active={sortBy === 'stockQuantity'} direction={sortOrder} />
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort('reorderLevel')}
                    >
                      <span>Reorder</span>
                      <SortIcon active={sortBy === 'reorderLevel'} direction={sortOrder} />
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort('updatedAt')}
                    >
                      <span>Updated</span>
                      <SortIcon active={sortBy === 'updatedAt'} direction={sortOrder} />
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-500">No inventory records found</td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.productId}>
                    <td>{row.productName || '-'}</td>
                    <td>{formatCategory(row.category)}</td>
                    <td className={getStockClass(row)}>{row.stockQuantity}</td>
                    <td>{row.reorderLevel}</td>
                    <td>{formatDateDDMMYYYY(row.updatedAt)}</td>
                    <td>
                      {canUpdate ? (
                        <Button
                          render={<Link to={`/inventory/adjustments?productId=${row.productId}`} />}
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          Adjust
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">Read only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="mt-3 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGoPrev}
              onClick={() => updateQuery({ page: page - 1 })}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-600">Page {page} of {meta.totalPages}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGoNext}
              onClick={() => updateQuery({ page: page + 1 })}
            >
              Next
            </Button>
          </footer>
        </section>
      )}

      <InventoryFilterDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        onApply={(nextFilters) => {
          updateQuery({ page: 1, filters: nextFilters })
        }}
        onReset={() => {
          updateQuery({
            page: 1,
            filters: {
              search: '',
              category: '',
              stockStatus: '',
              lowStock: '',
              startDate: '',
              endDate: '',
            },
          })
        }}
      />
    </section>
  )
}
