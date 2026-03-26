function formatCount(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0))
}

export function LowStockWidget({ summary }) {
  const criticalProduct = summary?.criticalProduct || null
  const lowStockCount = summary?.lowStockProducts || 0
  const outOfStockCount = summary?.outOfStockProducts || 0

  return (
    <section className="border border-slate-300 bg-white p-3">
      <div className="mb-2 text-sm font-semibold text-green-700">Inventory Risk Snapshot</div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-sm border border-slate-300 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Low Stock Products
          </div>
          <div className="mt-1 text-xl font-semibold text-green-700">{formatCount(lowStockCount)}</div>
        </div>
        <div className="rounded-sm border border-slate-300 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Out Of Stock Products
          </div>
          <div className="mt-1 text-xl font-semibold text-blue-700">{formatCount(outOfStockCount)}</div>
        </div>
        <div className="rounded-sm border border-slate-300 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Highest Reorder Risk
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-900">
            {criticalProduct ? criticalProduct.productName : 'No critical items'}
          </div>
          <div className="text-xs text-slate-600">
            {criticalProduct ? `Short by ${formatCount(criticalProduct.shortBy)}` : 'All stock levels are healthy'}
          </div>
        </div>
      </div>
    </section>
  )
}
