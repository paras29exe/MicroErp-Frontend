import { useEffect, useMemo, useState } from 'react'
import { getPurchaseList } from '@/features/purchases/purchases.api'
import { getApiMessage } from '@/lib/api-response'

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
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

      {loading && <div className="border border-slate-300 bg-white px-3 py-2 text-sm">Loading report widgets...</div>}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
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
      )}
    </section>
  )
}
