export function LowStockTable({ lowStock }) {
  return (
    <section className="border border-slate-300 bg-white p-0">
      <div className="border-b border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-green-700">
        Low Stock Details
      </div>
      <table className="dense-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Current Stock</th>
            <th>Reorder Level</th>
            <th>Reorder Gap</th>
          </tr>
        </thead>
        <tbody>
          {lowStock.length === 0 && (
            <tr>
              <td colSpan={4}>No low-stock products for the selected period.</td>
            </tr>
          )}
          {lowStock.map((row) => (
            <tr key={row.productId}>
              <td>{row.productName}</td>
              <td>{row.stockQuantity}</td>
              <td>{row.reorderLevel}</td>
              <td>{row.shortBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
