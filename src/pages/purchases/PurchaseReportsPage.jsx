import { useEffect, useMemo, useState } from 'react'
import { getPurchaseList } from '@/features/purchases/purchases.api'
import { getApiMessage } from '@/lib/api-response'
import { PageLoader } from '@/components/common/page-loader'
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

export function PurchaseReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const data = await getPurchaseList({
        page: 1,
        limit: 100,
        ...(from ? { startDate: from } : {}),
        ...(to ? { endDate: to } : {}),
      })
      setRows(data.items)
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load purchase reports'))
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
        const total = Number(row.totalAmount || 0)
        acc.totalAmount += total
        acc.orders += 1
        if (row.paymentStatus === 'paid') acc.paidAmount += total
        if (row.paymentStatus === 'pending') acc.pendingAmount += total
        return acc
      },
      { totalAmount: 0, paidAmount: 0, pendingAmount: 0, orders: 0 },
    )
  }, [rows])

  const trendRows = useMemo(() => {
    const map = new Map()

    rows.forEach((row) => {
      const dateKey = row.purchaseDate ? new Date(row.purchaseDate).toISOString().split('T')[0] : 'Unknown'
      const current = map.get(dateKey) || { date: dateKey, orders: 0, totalAmount: 0, pendingAmount: 0 }
      const total = Number(row.totalAmount || 0)

      current.orders += 1
      current.totalAmount += total
      if (row.paymentStatus === 'pending') {
        current.pendingAmount += total
      }

      map.set(dateKey, current)
    })

    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
  }, [rows])

  const topVendors = useMemo(() => {
    const map = new Map()

    rows.forEach((row) => {
      const key = row.vendor?.name || 'Unknown Vendor'
      const current = map.get(key) || { vendor: key, orders: 0, amount: 0 }
      current.orders += 1
      current.amount += Number(row.totalAmount || 0)
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
          <h2 className="text-sm font-semibold text-blue-700">Purchase Reports</h2>
          <p className="text-xs text-slate-500">Widgets-only summary for purchase performance</p>
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

      {loading && <PageLoader text="Loading purchase report..." />}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <article className="border border-slate-300 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Orders</p>
              <p className="text-lg font-semibold text-blue-700">{widgets.orders}</p>
            </article>
            <article className="border border-slate-300 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total Purchases</p>
              <p className="text-lg font-semibold text-blue-700">{formatAmount(widgets.totalAmount)}</p>
            </article>
            <article className="border border-slate-300 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Paid</p>
              <p className="text-lg font-semibold text-green-700">{formatAmount(widgets.paidAmount)}</p>
            </article>
            <article className="border border-slate-300 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pending</p>
              <p className="text-lg font-semibold text-amber-700">{formatAmount(widgets.pendingAmount)}</p>
            </article>
          </section>

          <section className="grid gap-3 xl:grid-cols-2">
            <article className="border border-slate-300 bg-white p-3">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-blue-700">Purchase Trend</h3>
                <p className="text-xs text-slate-500">Order count, spend, and pending amount by day</p>
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
                      <Area yAxisId="right" type="monotone" dataKey="totalAmount" stroke="#16a34a" fill="#bbf7d0" name="Total Amount" />
                      <Area yAxisId="right" type="monotone" dataKey="pendingAmount" stroke="#d97706" fill="#fde68a" name="Pending Amount" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article className="border border-slate-300 bg-white p-3">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-blue-700">Top Vendors</h3>
                <p className="text-xs text-slate-500">Highest procurement value by vendor</p>
              </div>
              {topVendors.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-xs text-slate-500">No vendor contribution data.</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topVendors} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ee" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="vendor" type="category" width={120} tick={{ fontSize: 11 }} />
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
