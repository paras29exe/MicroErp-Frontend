import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  getInventorySummary,
  getInventoryTransactions,
} from '@/features/inventory/inventory.api'
import { getApiMessage } from '@/lib/api-response'
import { formatDateDDMMYYYY } from '@/lib/date-format'
import { PageLoader } from '@/components/common/page-loader'

function SummaryCard({ title, value, tone = 'default' }) {
  const toneClasses = {
    default: 'border-slate-300 bg-white text-slate-900',
    warning: 'border-amber-300 bg-amber-50 text-amber-900',
    danger: 'border-red-300 bg-red-50 text-red-900',
  }

  return (
    <div className={`rounded-sm border p-4 ${toneClasses[tone] || toneClasses.default}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

export function InventorySummaryPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  const [transactionsError, setTransactionsError] = useState('')
  const [summary, setSummary] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
  })
  const [transactionRows, setTransactionRows] = useState([])
  const [transactionMeta, setTransactionMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [transactionType, setTransactionType] = useState('')
  const [transactionSearch, setTransactionSearch] = useState('')
  const [transactionPage, setTransactionPage] = useState(1)

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const data = await getInventorySummary()
      setSummary({
        totalProducts: data?.totalProducts || 0,
        lowStockProducts: data?.lowStockProducts || 0,
        outOfStockProducts: data?.outOfStockProducts || 0,
      })
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load inventory summary'))
    } finally {
      setLoading(false)
    }
  }

  async function loadTransactions() {
    setTransactionsLoading(true)
    setTransactionsError('')

    try {
      const data = await getInventoryTransactions({
        page: transactionPage,
        limit: 10,
        sortBy: 'transactionDate',
        sortOrder: 'desc',
        ...(transactionType ? { transactionType } : {}),
        ...(transactionSearch ? { search: transactionSearch } : {}),
      })
      setTransactionRows(data.items)
      setTransactionMeta(data.meta)
    } catch (apiError) {
      setTransactionsError(getApiMessage(apiError, 'Failed to load inventory transactions'))
    } finally {
      setTransactionsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [transactionPage, transactionType])

  function getQuantityClass(quantity) {
    if (quantity < 0) return 'text-red-700'
    if (quantity > 0) return 'text-green-700'
    return 'text-slate-700'
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Inventory Summary</h2>
          <p className="text-xs text-slate-500">Quick health snapshot of current inventory.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={loadData}>
          Refresh
        </Button>
      </header>

      {loading && <PageLoader text="Loading inventory summary..." />}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <section className="grid gap-3 md:grid-cols-3">
          <SummaryCard title="Products With Inventory" value={summary.totalProducts} />
          <SummaryCard title="Low Stock Products" value={summary.lowStockProducts} tone="warning" />
          <SummaryCard title="Out Of Stock Products" value={summary.outOfStockProducts} tone="danger" />
        </section>
      )}

      <section className="space-y-2 border border-slate-300 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Inventory Transactions</h3>
            <p className="text-xs text-slate-500">Recent stock movements across purchase, sales, production, and adjustments.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={transactionSearch}
              onChange={(event) => setTransactionSearch(event.target.value)}
              placeholder="Search product"
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
            />
            <select
              value={transactionType}
              onChange={(event) => {
                setTransactionType(event.target.value)
                setTransactionPage(1)
              }}
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
            >
              <option value="">Type (Any)</option>
              <option value="PURCHASE">PURCHASE</option>
              <option value="SALE">SALE</option>
              <option value="PRODUCTION">PRODUCTION</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setTransactionPage(1)
                loadTransactions()
              }}
            >
              Apply
            </Button>
          </div>
        </div>

        {transactionsLoading && (
          <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm">Loading transactions...</div>
        )}
        {transactionsError && (
          <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{transactionsError}</div>
        )}

        {!transactionsLoading && !transactionsError && (
          <>
            <div className="overflow-x-auto">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Stock After</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-slate-500">No transactions found</td>
                    </tr>
                  )}
                  {transactionRows.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDateDDMMYYYY(row.transactionDate)}</td>
                      <td>{row.product?.name || '-'}</td>
                      <td>{row.product?.category?.toUpperCase?.() || '-'}</td>
                      <td>{row.transactionType || '-'}</td>
                      <td className={getQuantityClass(row.quantity)}>{row.quantity}</td>
                      <td>{row.stockAfter}</td>
                      <td>{row.referenceId || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-200 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={transactionMeta.page <= 1}
                onClick={() => setTransactionPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-slate-600">Page {transactionMeta.page} of {transactionMeta.totalPages}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={transactionMeta.page >= transactionMeta.totalPages}
                onClick={() => setTransactionPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </section>
    </section>
  )
}
