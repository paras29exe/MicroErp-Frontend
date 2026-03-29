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

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatCount(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0))
}

function formatShortDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })
}

function SalesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const count = payload.find((p) => p.dataKey === 'count')?.value || 0
  const amount = payload.find((p) => p.dataKey === 'amount')?.value || 0

  return (
    <div className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm">
      <p className="font-semibold text-slate-800">{formatShortDate(label)}</p>
      <p className="text-slate-700">Orders: {formatCount(count)}</p>
      <p className="text-slate-700">Amount: {formatCurrency(amount)}</p>
    </div>
  )
}

function PurchaseTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const count = payload.find((p) => p.dataKey === 'count')?.value || 0
  const amount = payload.find((p) => p.dataKey === 'amount')?.value || 0

  return (
    <div className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm">
      <p className="font-semibold text-slate-800">{formatShortDate(label)}</p>
      <p className="text-slate-700">Orders: {formatCount(count)}</p>
      <p className="text-slate-700">Spend: {formatCurrency(amount)}</p>
    </div>
  )
}

function ProductionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const count = payload.find((p) => p.dataKey === 'count')?.value || 0
  const quantity = payload.find((p) => p.dataKey === 'quantity')?.value || 0

  return (
    <div className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm">
      <p className="font-semibold text-slate-800">{formatShortDate(label)}</p>
      <p className="text-slate-700">Entries: {formatCount(count)}</p>
      <p className="text-slate-700">Units: {formatCount(quantity)}</p>
    </div>
  )
}

function EmptyState({ label }) {
  return (
    <div className="flex h-65 items-center justify-center rounded-sm border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
      No {label} trend data in selected range.
    </div>
  )
}

export function TrendCharts({ trends }) {
  const salesData = trends?.sales || []
  const purchaseData = trends?.purchases || []
  const productionData = trends?.production || []

  return (
    <section className="border border-slate-300 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-blue-700">Operational Trends</h3>
          <p className="text-xs text-slate-500">Sales, purchase and production movement by date</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-sm border border-slate-300 bg-slate-50 p-2">
          <div className="mb-2">
            <p className="text-xs font-semibold text-slate-800">Sales Trend</p>
            <p className="text-[11px] text-slate-500">Orders and billed amount</p>
          </div>
          {salesData.length === 0 ? (
            <EmptyState label="sales" />
          ) : (
            <div className="h-65">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ee" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip content={<SalesTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area yAxisId="left" type="monotone" dataKey="count" stroke="#1d4ed8" fill="#bfdbfe" name="Orders" />
                  <Area yAxisId="right" type="monotone" dataKey="amount" stroke="#0f766e" fill="#99f6e4" name="Amount" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="rounded-sm border border-slate-300 bg-slate-50 p-2">
          <div className="mb-2">
            <p className="text-xs font-semibold text-slate-800">Purchase Trend</p>
            <p className="text-[11px] text-slate-500">Orders and spend amount</p>
          </div>
          {purchaseData.length === 0 ? (
            <EmptyState label="purchase" />
          ) : (
            <div className="h-65">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={purchaseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ee" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip content={<PurchaseTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area yAxisId="left" type="monotone" dataKey="count" stroke="#0369a1" fill="#bae6fd" name="Orders" />
                  <Area yAxisId="right" type="monotone" dataKey="amount" stroke="#15803d" fill="#bbf7d0" name="Spend" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="rounded-sm border border-slate-300 bg-slate-50 p-2">
          <div className="mb-2">
            <p className="text-xs font-semibold text-slate-800">Production Trend</p>
            <p className="text-[11px] text-slate-500">Entries and units produced</p>
          </div>
          {productionData.length === 0 ? (
            <EmptyState label="production" />
          ) : (
            <div className="h-65">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ee" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip content={<ProductionTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="count" fill="#2563eb" name="Entries" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="quantity" fill="#16a34a" name="Units" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
