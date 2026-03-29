import { useEffect, useMemo, useState } from 'react'
import { getSalesList } from '@/features/sales/sales.api'
import { getApiMessage } from '@/lib/api-response'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

function formatShortDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function SalesReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const data = await getSalesList({
        page: 1,
        limit: 100,
        ...(from ? { startDate: from } : {}),
        ...(to ? { endDate: to } : {}),
      })
      setRows(data.items)
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load sales reports'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const widgets = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.totalSales += Number(row.grossSales || 0)
        acc.totalCogs += Number(row.totalCogs || 0)
        acc.totalProfit += Number(row.grossProfit || 0)
        acc.orders += 1
        return acc
      },
      { totalSales: 0, totalCogs: 0, totalProfit: 0, orders: 0 },
    )
  }, [rows])

  const trendRows = useMemo(() => {
    const map = new Map()

    rows.forEach((row) => {
      const dateKey = row.saleDate ? new Date(row.saleDate).toISOString().split('T')[0] : 'Unknown'
      const current = map.get(dateKey) || { date: dateKey, orders: 0, sales: 0, profit: 0 }
      current.orders += 1
      current.sales += Number(row.grossSales || row.totalAmount || 0)
      current.profit += Number(row.grossProfit || 0)
      map.set(dateKey, current)
    })

    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
  }, [rows])

  const topCustomers = useMemo(() => {
    const map = new Map()

    rows.forEach((row) => {
      const key = row.customer?.name || 'Unknown Customer'
      const current = map.get(key) || { customer: key, orders: 0, amount: 0 }
      current.orders += 1
      current.amount += Number(row.grossSales || row.totalAmount || 0)
      map.set(key, current)
    })

    return [...map.values()]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)
  }, [rows])

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Sales Reports</h2>
          <p className="text-xs text-slate-500">Widgets-only summary for sales performance</p>
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            loadData()
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

      {loading && <div className="border border-slate-300 bg-white px-3 py-2 text-sm">Loading report widgets...</div>}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <article className="border border-slate-300 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Orders</p>
              <p className="text-lg font-semibold text-blue-700">{widgets.orders}</p>
            </article>
            <article className="border border-slate-300 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Gross Sales</p>
              <p className="text-lg font-semibold text-blue-700">{formatAmount(widgets.totalSales)}</p>
            </article>
            <article className="border border-slate-300 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">COGS</p>
              <p className="text-lg font-semibold text-amber-700">{formatAmount(widgets.totalCogs)}</p>
            </article>
            <article className="border border-slate-300 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Profit</p>
              <p className={['text-lg font-semibold', widgets.totalProfit < 0 ? 'text-red-700' : 'text-green-700'].join(' ')}>
                {formatAmount(widgets.totalProfit)}
              </p>
            </article>
          </section>

          <section className="grid gap-3 xl:grid-cols-2">
            <article className="border border-slate-300 bg-white p-3">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-blue-700">Sales Trend</h3>
                <p className="text-xs text-slate-500">Orders, billed amount, and profit by day</p>
              </div>
              {trendRows.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-xs text-slate-500">No trend data for selected filters.</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendRows}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ee" />
                      <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                      <Tooltip labelFormatter={formatShortDate} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area yAxisId="left" type="monotone" dataKey="orders" stroke="#1d4ed8" fill="#bfdbfe" name="Orders" />
                      <Area yAxisId="right" type="monotone" dataKey="sales" stroke="#0f766e" fill="#99f6e4" name="Sales" />
                      <Area yAxisId="right" type="monotone" dataKey="profit" stroke="#16a34a" fill="#bbf7d0" name="Profit" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article className="border border-slate-300 bg-white p-3">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-blue-700">Top Customers</h3>
                <p className="text-xs text-slate-500">Highest contribution by billed amount</p>
              </div>
              {topCustomers.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-xs text-slate-500">No customer contribution data.</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCustomers} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ee" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="customer" type="category" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="amount" fill="#2563eb" name="Amount" radius={[0, 6, 6, 0]} />
                      <Bar dataKey="orders" fill="#16a34a" name="Orders" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </section>
  )
}
