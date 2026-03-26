function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatCount(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0))
}

const KPI_BLUE = 'text-blue-700'
const KPI_GREEN = 'text-green-700'

export function KpiWidgets({ kpis }) {
  const groups = [
    {
      key: 'sales',
      title: 'Sales Performance',
      tone: KPI_BLUE,
      rows: [
        { label: 'Sales Orders', value: formatCount(kpis?.sales?.count) },
        { label: 'Revenue', value: formatCurrency(kpis?.sales?.totalAmount) },
        { label: 'Gross Profit', value: formatCurrency(kpis?.sales?.grossProfit) },
      ],
    },
    {
      key: 'purchases',
      title: 'Purchase Performance',
      tone: KPI_GREEN,
      rows: [
        { label: 'Purchase Orders', value: formatCount(kpis?.purchases?.count) },
        { label: 'Total Spend', value: formatCurrency(kpis?.purchases?.totalAmount) },
        { label: 'Unpaid Orders', value: formatCount(kpis?.purchases?.pendingCount) },
        { label: 'Unpaid Amount', value: formatCurrency(kpis?.purchases?.pendingAmount) },
      ],
    },
    {
      key: 'production',
      title: 'Production Output',
      tone: KPI_BLUE,
      rows: [
        {
          label: 'Distinct Products Produced',
          value: formatCount(kpis?.production?.distinctProductsCount),
        },
        { label: 'Production Entries', value: formatCount(kpis?.production?.entriesCount) },
        { label: 'Total Units Produced', value: formatCount(kpis?.production?.totalQuantity) },
      ],
    },
    {
      key: 'inventory',
      title: 'Inventory Overview',
      tone: KPI_GREEN,
      rows: [
        { label: 'Tracked Products', value: formatCount(kpis?.inventory?.totalProducts) },
        {
          label: 'Healthy Stock Products',
          value: formatCount(
            (kpis?.inventory?.totalProducts || 0) -
              (kpis?.inventory?.lowStockProducts || 0) -
              (kpis?.inventory?.outOfStockProducts || 0),
          ),
        },
      ],
    },
    {
      key: 'users',
      title: 'User Availability',
      tone: KPI_BLUE,
      rows: [
        { label: 'Active Users', value: formatCount(kpis?.users?.active) },
        { label: 'Inactive Users', value: formatCount(kpis?.users?.inactive) },
      ],
    },
  ]

  return (
    <section className="border border-slate-300 bg-white p-3">
      <div className="mb-2 text-sm font-semibold text-blue-700">Key Performance Snapshot</div>
      <div className="grid grid-cols-3 gap-2">
        {groups.map((group) => (
          <div
            key={group.key}
            className="rounded-sm border border-slate-300 bg-slate-50 px-3 py-2"
          >
            <div className={[group.tone, 'mb-2 text-sm font-semibold'].join(' ')}>
              {group.title}
            </div>
            <div className="space-y-1.5">
              {group.rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-sm">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-semibold text-slate-900">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}