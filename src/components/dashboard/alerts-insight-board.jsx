import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const RISK_COLORS = ['#dc2626', '#f59e0b', '#2563eb', '#16a34a']
const MIX_COLORS = ['#2563eb', '#16a34a', '#0f766e']

function formatCount(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0))
}

export function AlertsInsightBoard({ alerts }) {
  const lowStockProducts = Number(alerts?.summary?.lowStockProducts || 0)
  const outOfStockProducts = Number(alerts?.summary?.outOfStockProducts || 0)
  const pendingPurchases = (alerts?.recentPurchases || []).filter((row) => row.paymentStatus === 'pending').length
  const negativeProfitSales = (alerts?.recentSales || []).filter((row) => Number(row.grossProfit || 0) < 0).length

  const riskBars = [
    { metric: 'Out Of Stock', value: outOfStockProducts },
    { metric: 'Low Stock', value: lowStockProducts },
    { metric: 'Pending Purchases', value: pendingPurchases },
    { metric: 'Negative Sales', value: negativeProfitSales },
  ]

  const activityMix = [
    { name: 'Sales', value: alerts?.recentSales?.length || 0 },
    { name: 'Purchases', value: alerts?.recentPurchases?.length || 0 },
    { name: 'Production', value: alerts?.recentProductions?.length || 0 },
  ]

  const riskScore = outOfStockProducts * 40 + lowStockProducts * 15 + pendingPurchases * 10 + negativeProfitSales * 8
  const riskBand = riskScore >= 120 ? 'Critical' : riskScore >= 70 ? 'Elevated' : riskScore >= 30 ? 'Watch' : 'Stable'

  return (
    <section className="border border-slate-300 bg-white p-3">
      <div className="mb-3 grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr]">
        <article className="rounded-sm border border-slate-300 bg-linear-to-r from-blue-50 via-white to-emerald-50 px-3 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Operational Pulse</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Risk Score: {formatCount(riskScore)}</h3>
          <p className="text-xs text-slate-600">Current risk band: {riskBand}</p>
          <p className="mt-2 text-[11px] text-slate-500">
            Score blends inventory risk, payment delays, and negative-profit sales in selected period.
          </p>
        </article>

        <article className="rounded-sm border border-slate-300 bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Highest Pressure</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {(alerts?.summary?.criticalProduct?.productName || 'No critical product')}
          </p>
          <p className="text-xs text-slate-600">
            {alerts?.summary?.criticalProduct
              ? `Short by ${formatCount(alerts.summary.criticalProduct.shortBy)} units`
              : 'No immediate reorder pressure detected'}
          </p>
        </article>

        <article className="rounded-sm border border-slate-300 bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Action Snapshot</p>
          <div className="mt-1 space-y-1 text-xs text-slate-700">
            <p>Out of stock items: {formatCount(outOfStockProducts)}</p>
            <p>Low stock items: {formatCount(lowStockProducts)}</p>
            <p>Pending purchases: {formatCount(pendingPurchases)}</p>
            <p>Loss-making sales: {formatCount(negativeProfitSales)}</p>
          </div>
        </article>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-sm border border-slate-300 bg-white p-2">
          <div className="mb-2">
            <p className="text-xs font-semibold text-slate-800">Risk Drivers</p>
            <p className="text-[11px] text-slate-500">Higher bars indicate stronger operational pressure</p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskBars} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="metric" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCount(value)} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {riskBars.map((entry, index) => (
                    <Cell key={`${entry.metric}-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-sm border border-slate-300 bg-white p-2">
          <div className="mb-2">
            <p className="text-xs font-semibold text-slate-800">Recent Activity Mix</p>
            <p className="text-[11px] text-slate-500">Distribution of latest operational records</p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activityMix}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={88}
                  innerRadius={48}
                  paddingAngle={2}
                >
                  {activityMix.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={MIX_COLORS[index % MIX_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCount(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
            {activityMix.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MIX_COLORS[index % MIX_COLORS.length] }} />
                <span>{item.name}: {formatCount(item.value)}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
