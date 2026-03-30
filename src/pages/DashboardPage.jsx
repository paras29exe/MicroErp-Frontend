import { useEffect, useMemo, useState } from 'react'
import { getDashboardOverview } from '@/features/dashboard/dashboard.api'
import { getApiMessage } from '@/lib/api-response'
import { KpiWidgets } from '@/components/dashboard/kpi-widgets'
import { LowStockWidget } from '@/components/dashboard/low-stock-widget'
import { LowStockTable } from '@/components/dashboard/low-stock-table'
import { TrendCharts } from '@/components/dashboard/trend-charts'
import { PageLoader } from '@/components/common/page-loader'

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10)
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState(null)

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
      const data = await getDashboardOverview({ from: nextFrom, to: nextTo })
      setOverview(data)
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load dashboard'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(from, to)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const kpis = overview?.kpis
  const alertsSummary = overview?.alerts?.summary
  const lowStock = overview?.alerts?.lowStock || []

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between border border-slate-300 bg-white px-3 py-2">
        <h2 className="text-sm font-semibold text-blue-700">Dashboard Overview</h2>
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

      {loading && <PageLoader text="Loading dashboard data..." />}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && overview && (
        <>
          <KpiWidgets kpis={kpis} />
          <TrendCharts trends={overview?.trends} />
          <LowStockWidget summary={alertsSummary} />
          <LowStockTable lowStock={lowStock} />
        </>
      )}
    </section>
  )
}
