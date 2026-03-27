import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPurchaseList } from '@/features/purchases/purchases.api'
import { getApiMessage } from '@/lib/api-response'
import { formatDateDDMMYYYY } from '@/lib/date-format'

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

function formatDate(value) {
  return formatDateDDMMYYYY(value)
}

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
  if (direction === 'asc') return <ArrowUp className="h-3.5 w-3.5 text-slate-700" />
  return <ArrowDown className="h-3.5 w-3.5 text-slate-700" />
}

export function PurchaseOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState({ field: 'purchaseDate', direction: 'desc' })

  const vendor = (searchParams.get('vendor') || '').trim()
  const search = (searchParams.get('search') || '').trim()

  useEffect(() => {
    const parsed = Number.parseInt(searchParams.get('page') || '', 10)
    if (Number.isInteger(parsed) && parsed > 0) {
      setPage(parsed)
    } else {
      setPage(1)
    }
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true })
    }
  }, [page, searchParams, setSearchParams])

  const canGoPrev = page > 1
  const canGoNext = page < meta.totalPages

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const data = await getPurchaseList({
          page,
          limit: 20,
          sortBy: sort.field,
          sortOrder: sort.direction,
          ...(vendor ? { vendorName: vendor } : {}),
          ...(search ? { search } : {}),
        })

        if (cancelled) return

        setRows(data.items)
        setMeta(data.meta)
      } catch (apiError) {
        if (cancelled) return
        setError(getApiMessage(apiError, 'Failed to load purchase orders'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [page, sort, vendor, search])

  function toggleSort(field) {
    setPage(1)
    setSort((current) => {
      if (current.field === field) {
        return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      }

      return { field, direction: 'desc' }
    })
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Purchase Orders</h2>
          <p className="text-xs text-slate-500">Click Total Amount or Purchase Date to toggle sorting</p>
        </div>
        <div className="text-xs text-slate-600">
          {vendor && (
            <span className="mr-4">
              <span className="font-semibold text-slate-700">Vendor:</span> {vendor}
            </span>
          )}
          <span className="font-semibold text-slate-700">Total:</span> {meta.total}
        </div>
      </header>

      {loading && <div className="border border-slate-300 bg-white px-3 py-2 text-sm">Loading purchases...</div>}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Purchase ID</th>
                  <th>Vendor</th>
                  <th>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort('purchaseDate')}
                    >
                      <span>Purchase Date</span>
                      <SortIcon active={sort.field === 'purchaseDate'} direction={sort.direction} />
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort('totalAmount')}
                    >
                      <span>Total Amount</span>
                      <SortIcon active={sort.field === 'totalAmount'} direction={sort.direction} />
                    </button>
                  </th>
                  <th>Payment Status</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-500">No purchases found</td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td>{row.vendor?.name || '-'}</td>
                    <td>{formatDate(row.purchaseDate)}</td>
                    <td>{formatAmount(row.totalAmount)}</td>
                    <td className={row.paymentStatus === 'pending' ? 'text-amber-700' : 'text-green-700'}>
                      {row.paymentStatus || '-'}
                    </td>
                    <td>{row.items?.length || 0}</td>
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
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-600">Page {page} of {meta.totalPages}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGoNext}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </footer>
        </section>
      )}
    </section>
  )
}
