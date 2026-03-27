import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductionFilterDialog } from '@/components/production/ProductionFilterDialog'
import {
  getProductionById,
  getProductionList,
} from '@/features/production/production.api'
import { getApiMessage } from '@/lib/api-response'
import { formatDateDDMMYYYY } from '@/lib/date-format'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

function getFiltersFromSearchParams(searchParams) {
  return {
    search: searchParams.get('search') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    minQty: searchParams.get('minQty') || '',
    maxQty: searchParams.get('maxQty') || '',
  }
}

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
  if (direction === 'asc') return <ArrowUp className="h-3.5 w-3.5 text-slate-700" />
  return <ArrowDown className="h-3.5 w-3.5 text-slate-700" />
}

export function ProductionRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [details, setDetails] = useState(null)

  const page = parsePositiveInt(searchParams.get('page'), 1)
  const limit = parsePositiveInt(searchParams.get('limit'), 20)
  const sortBy = searchParams.get('sortBy') || 'productionDate'
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
  const filters = useMemo(() => getFiltersFromSearchParams(searchParams), [searchParams])

  const canGoPrev = page > 1
  const canGoNext = page < meta.totalPages

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const data = await getProductionList({
        page,
        limit,
        sortBy,
        sortOrder,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
        ...(filters.minQty ? { minQty: filters.minQty } : {}),
        ...(filters.maxQty ? { maxQty: filters.maxQty } : {}),
      })

      setRows(data.items)
      setMeta(data.meta)
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load production register'))
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

  async function handleViewDetails(id) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsError('')
    setDetails(null)

    try {
      const data = await getProductionById(id)
      setDetails(data)
    } catch (apiError) {
      setDetailsError(getApiMessage(apiError, 'Failed to load production details'))
    } finally {
      setDetailsLoading(false)
    }
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Production Register</h2>
          <p className="text-xs text-slate-500">Track production runs, quantities, and cost snapshots.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="mr-2 font-semibold text-slate-700">Total: {meta.total}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
            Filters
          </Button>
          {/* <Button render={<Link to="/production/new" />} type="button" size="sm" className="bg-green-700 text-white hover:bg-green-800">
            Record New Production
          </Button> */}
        </div>
      </header>

      <section className="border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Search:</span> {filters.search || 'None'}
        <span className="ml-4 font-semibold text-slate-700">Quantity:</span> {filters.minQty || 'Any'} - {filters.maxQty || 'Any'}
      </section>

      {loading && <div className="border border-slate-300 bg-white px-3 py-2 text-sm">Loading production runs...</div>}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('productName')}>
                      <span>Finished Product</span>
                      <SortIcon active={sortBy === 'productName'} direction={sortOrder} />
                    </button>
                  </th>
                  <th>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('quantity')}>
                      <span>Quantity</span>
                      <SortIcon active={sortBy === 'quantity'} direction={sortOrder} />
                    </button>
                  </th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                  <th>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('productionDate')}>
                      <span>Production Date</span>
                      <SortIcon active={sortBy === 'productionDate'} direction={sortOrder} />
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-500">No production runs found</td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td>{row.product?.name || '-'}</td>
                    <td>{row.quantity}</td>
                    <td>{formatAmount(row.unitCost)}</td>
                    <td>{formatAmount(row.totalCost)}</td>
                    <td>{formatDateDDMMYYYY(row.productionDate)}</td>
                    <td>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleViewDetails(row.id)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="mt-3 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
            <Button type="button" variant="outline" size="sm" disabled={!canGoPrev} onClick={() => updateQuery({ page: page - 1 })}>
              Previous
            </Button>
            <span className="text-xs text-slate-600">Page {page} of {meta.totalPages}</span>
            <Button type="button" variant="outline" size="sm" disabled={!canGoNext} onClick={() => updateQuery({ page: page + 1 })}>
              Next
            </Button>
          </footer>
        </section>
      )}

      <ProductionFilterDialog
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
              startDate: '',
              endDate: '',
              minQty: '',
              maxQty: '',
            },
          })
        }}
      />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Production Details</DialogTitle>
            <DialogDescription>Snapshot of selected production run.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            {detailsLoading && <p className="text-sm text-slate-600">Loading details...</p>}
            {!detailsLoading && detailsError && <p className="text-sm text-red-700">{detailsError}</p>}
            {!detailsLoading && !detailsError && details && (
              <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Run ID:</span> #{details.id}</p>
                <p><span className="font-semibold">Product:</span> {details.product?.name || '-'}</p>
                <p><span className="font-semibold">Quantity:</span> {details.quantity}</p>
                <p><span className="font-semibold">Unit Cost:</span> {formatAmount(details.unitCost)}</p>
                <p><span className="font-semibold">Total Cost:</span> {formatAmount(details.totalCost)}</p>
                <p><span className="font-semibold">Date:</span> {formatDateDDMMYYYY(details.productionDate)}</p>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
