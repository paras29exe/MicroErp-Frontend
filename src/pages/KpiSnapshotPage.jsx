import { useEffect, useMemo, useState } from 'react'
import { getDashboardKpis } from '@/features/dashboard/dashboard.api'
import { getApiMessage } from '@/lib/api-response'
import { KpiWidgets } from '@/components/dashboard/kpi-widgets'
import { PageLoader } from '@/components/common/page-loader'

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10)
}

function formatKey(key) {
  return String(key || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function KpiSnapshotPage() {
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
      const data = await getDashboardKpis({ from: nextFrom, to: nextTo })
      setPayload(data)
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load KPI snapshot'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(from, to)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const kpis = payload?.kpis
  const definitions = kpis?.definitions || {}

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">KPI Snapshot</h2>
          <p className="text-xs text-slate-500">Focused metrics view with clear field definitions</p>
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

      {loading && <PageLoader text="Loading KPI snapshot..." />}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && payload && (
        <>
          <KpiWidgets kpis={kpis} />

          <section className="border border-slate-300 bg-white p-0">
            <div className="border-b border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-blue-700">
              KPI Field Definitions
            </div>
            <div className="overflow-x-auto">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Metric</th>
                    <th>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(definitions).length === 0 && (
                    <tr>
                      <td colSpan={3}>No KPI definitions available.</td>
                    </tr>
                  )}
                  {Object.entries(definitions).flatMap(([groupKey, groupDefs]) =>
                    Object.entries(groupDefs || {}).map(([metricKey, label]) => (
                      <tr key={`${groupKey}-${metricKey}`}>
                        <td>{formatKey(groupKey)}</td>
                        <td>{formatKey(metricKey)}</td>
                        <td>{label}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  )
}
