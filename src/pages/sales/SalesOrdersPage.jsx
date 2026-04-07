import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { SalesFilterDialog } from '@/components/sales/SalesFilterDialog'
import { PageLoader } from '@/components/common/page-loader'
import { deleteSale, getSalesList } from '@/features/sales/sales.api'
import { getApiMessage } from '@/lib/api-response'
import { formatDateDDMMYYYY } from '@/lib/date-format'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/features/auth/auth.store'
import { toast } from 'sonner'

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

function formatDate(value) {
  return formatDateDDMMYYYY(value)
}

function getFiltersFromSearchParams(searchParams) {
  return {
    saleId: searchParams.get('saleId') || searchParams.get('search') || '',
    customer: searchParams.get('customer') || '',
    productName: searchParams.get('productName') || '',
    productId: searchParams.get('productId') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || '',
    profit: searchParams.get('profit') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  }
}

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
  if (direction === 'asc') return <ArrowUp className="h-3.5 w-3.5 text-slate-700" />
  return <ArrowDown className="h-3.5 w-3.5 text-slate-700" />
}

export function SalesOrdersPage() {
  const user = useAuthStore((state) => state.user)
  const canCreate = hasPermission(user, 'sales:create')
  const canDelete = hasPermission(user, 'sales:delete')

  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [filtersOpen, setFiltersOpen] = useState(false)

  const page = parsePositiveInt(searchParams.get('page'), 1)
  const limit = parsePositiveInt(searchParams.get('limit'), 20)
  const sortBy = searchParams.get('sortBy') || 'saleDate'
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
  const filters = useMemo(() => getFiltersFromSearchParams(searchParams), [searchParams])

  const canGoPrev = page > 1
  const canGoNext = page < meta.totalPages

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const data = await getSalesList({
        page,
        limit,
        ...(filters.saleId ? { search: filters.saleId } : {}),
        ...(filters.customer ? { customerName: filters.customer, customerPhone: filters.customer } : {}),
        ...(filters.productName ? { productName: filters.productName } : {}),
        ...(filters.productId ? { productId: filters.productId } : {}),
        ...(filters.minAmount ? { minAmount: filters.minAmount } : {}),
        ...(filters.maxAmount ? { maxAmount: filters.maxAmount } : {}),
        ...(filters.profit ? { profit: filters.profit } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
        sortBy,
        sortOrder,
      })

      setRows(data.items)
      setMeta(data.meta)
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load sales orders'))
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

  async function handleConfirmDelete() {
    if (!canDelete || !deleteTarget) return

    setDeleting(true)
    setError('')
    try {
      await deleteSale(deleteTarget.id)
      toast.success(`Sale #${deleteTarget.id} deleted and inventory restored`)
      setDeleteTarget(null)
      await loadData()
    } catch (apiError) {
      const message = getApiMessage(apiError, 'Failed to delete sale')
      setError(message)
      toast.error(message)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  function toggleSort(field) {
    const nextOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc'
    updateQuery({ page: 1, sortBy: field, sortOrder: nextOrder })
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Sales Orders</h2>
          <p className="text-xs text-slate-500">View and delete sales orders. No edit flow.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="mr-2 font-semibold text-slate-700">Total: {meta.total}</span>
          <Button type="button" variant="outline" onClick={() => setFiltersOpen(true)}>
            Filters
          </Button>
        </div>
      </header>

      <section className="border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Sale ID:</span> {filters.saleId || 'Any'}
        <span className="ml-4 font-semibold text-slate-700">Total:</span> {meta.total}
      </section>

      {canCreate && (
        <section className="flex justify-end">
          <Button render={<Link to="/sales/new" />} className="bg-green-700 text-white hover:bg-green-800">
            Record New Sale
          </Button>
        </section>
      )}

      {loading && <PageLoader text="Loading sales orders..." />}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Customer</th>
                  <th>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort('saleDate')}
                    >
                      <span>Sale Date</span>
                      <SortIcon active={sortBy === 'saleDate'} direction={sortOrder} />
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort('grossSales')}
                    >
                      <span>Total Amount</span>
                      <SortIcon active={sortBy === 'grossSales'} direction={sortOrder} />
                    </button>
                  </th>
                  <th>COGS</th>
                  <th>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort('grossProfit')}
                    >
                      <span>Profit</span>
                      <SortIcon active={sortBy === 'grossProfit'} direction={sortOrder} />
                    </button>
                  </th>
                  <th>Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-slate-500">No sales found</td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td>{row.customer?.name || '-'}</td>
                    <td>{formatDate(row.saleDate)}</td>
                    <td>{formatAmount(row.grossSales)}</td>
                    <td>{formatAmount(row.totalCogs)}</td>
                    <td className={Number(row.grossProfit) < 0 ? 'text-red-700' : 'text-green-700'}>
                      {formatAmount(row.grossProfit)}
                    </td>
                    <td>{row.items?.length || 0}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button render={<Link to={`/sales/${row.id}`} />} variant="outline" size="sm">
                          View
                        </Button>
                        {canDelete && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700"
                            onClick={() => setDeleteTarget(row)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
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

      <SalesFilterDialog
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
              saleId: '',
              customer: '',
              productName: '',
              productId: '',
              minAmount: '',
              maxAmount: '',
              profit: '',
              startDate: '',
              endDate: '',
            },
          })
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete Sale"
        description={
          deleteTarget
            ? `Delete sale #${deleteTarget.id}? Stock will be restored automatically.`
            : 'Delete this sale?'
        }
        confirmText="Delete"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </section>
  )
}
