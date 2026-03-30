import { useEffect, useMemo, useState } from 'react'
import { getDashboardAlerts } from '@/features/dashboard/dashboard.api'
import { getApiMessage } from '@/lib/api-response'
import { formatDateTimeDDMMYYYY } from '@/lib/date-format'
import { LowStockWidget } from '@/components/dashboard/low-stock-widget'
import { LowStockTable } from '@/components/dashboard/low-stock-table'
import { AlertsInsightBoard } from '@/components/dashboard/alerts-insight-board'
import { PageLoader } from '@/components/common/page-loader'

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10)
}

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

function formatDateTime(value) {
  return formatDateTimeDDMMYYYY(value)
}

export function OperationalAlertsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)

  const today = useMemo(() => new Date(), [])
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d
  }, [])

  const [from, setFrom] = useState(toDateInputValue(thirtyDaysAgo))
  const [to, setTo] = useState(toDateInputValue(today))

  async function loadData(nextFrom = from, nextTo = to) {
    setLoading(true)
    setError('')

    try {
      const data = await getDashboardAlerts({ from: nextFrom, to: nextTo })
      setPayload(data)
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load operational alerts'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(from, to)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const alerts = payload?.alerts
  const lowStock = alerts?.lowStock || []
  const recentSales = alerts?.recentSales || []
  const recentPurchases = alerts?.recentPurchases || []
  const recentProductions = alerts?.recentProductions || []

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Operational Alerts</h2>
          <p className="text-xs text-slate-500">Inventory risk and latest operational activity</p>
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            loadData(from, to)
          }}
        >
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
          />
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
          />
          <button
            type="submit"
            className="rounded-sm bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800"
          >
            Apply
          </button>
        </form>
      </header>

      {loading && <PageLoader text="Loading operational alerts..." />}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && alerts && (
        <>
          <AlertsInsightBoard alerts={alerts} />
          <LowStockWidget summary={alerts.summary} />
          <LowStockTable lowStock={lowStock} />

          <section className="grid gap-3 xl:grid-cols-3">
            <article className="border border-slate-300 bg-white p-0">
              <div className="border-b border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-blue-700">
                Recent Sales
              </div>
              <div className="overflow-x-auto">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.length === 0 && (
                      <tr>
                        <td colSpan={5}>No sales activity for selected period.</td>
                      </tr>
                    )}
                    {recentSales.map((row) => (
                      <tr key={row.id}>
                        <td>#{row.id}</td>
                        <td>{row.customer?.name || '-'}</td>
                        <td>{formatDateTime(row.saleDate)}</td>
                        <td>{formatAmount(row.totalAmount)}</td>
                        <td className={Number(row.grossProfit) < 0 ? 'text-red-700' : 'text-green-700'}>
                          {formatAmount(row.grossProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="border border-slate-300 bg-white p-0">
              <div className="border-b border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-green-700">
                Recent Purchases
              </div>
              <div className="overflow-x-auto">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Vendor</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPurchases.length === 0 && (
                      <tr>
                        <td colSpan={5}>No purchase activity for selected period.</td>
                      </tr>
                    )}
                    {recentPurchases.map((row) => (
                      <tr key={row.id}>
                        <td>#{row.id}</td>
                        <td>{row.vendor?.name || '-'}</td>
                        <td>{formatDateTime(row.purchaseDate)}</td>
                        <td>{formatAmount(row.totalAmount)}</td>
                        <td className={row.paymentStatus === 'pending' ? 'text-amber-700' : 'text-slate-700'}>
                          {row.paymentStatus || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="border border-slate-300 bg-white p-0">
              <div className="border-b border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-blue-700">
                Recent Production
              </div>
              <div className="overflow-x-auto">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>Date</th>
                      <th>Qty</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProductions.length === 0 && (
                      <tr>
                        <td colSpan={5}>No production activity for selected period.</td>
                      </tr>
                    )}
                    {recentProductions.map((row) => (
                      <tr key={row.id}>
                        <td>#{row.id}</td>
                        <td>{row.product?.name || '-'}</td>
                        <td>{formatDateTime(row.productionDate)}</td>
                        <td>{row.quantity}</td>
                        <td>{formatAmount(row.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        </>
      )}
    </section>
  )
}
