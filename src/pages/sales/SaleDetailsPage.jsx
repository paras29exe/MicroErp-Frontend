import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getSaleById } from '@/features/sales/sales.api'
import { getApiMessage } from '@/lib/api-response'
import { formatDateDDMMYYYY } from '@/lib/date-format'

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

function formatDate(value) {
  return formatDateDDMMYYYY(value)
}

export function SaleDetailsPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sale, setSale] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getSaleById(id)
        setSale(data)
      } catch (apiError) {
        setError(getApiMessage(apiError, 'Failed to load sale details'))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between border border-slate-300 bg-white px-3 py-2">
        <h2 className="text-sm font-semibold text-blue-700">Sale Details #{id}</h2>
        <Button render={<Link to="/sales/orders" />} variant="outline" size="sm">
          Back to Orders
        </Button>
      </header>

      {loading && <div className="border border-slate-300 bg-white px-3 py-2 text-sm">Loading sale details...</div>}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && sale && (
        <>
          <section className="border border-slate-300 bg-white p-3 text-sm">
            <p><span className="font-semibold">Customer:</span> {sale.customer?.name || '-'}</p>
            <p><span className="font-semibold">Phone:</span> {sale.customer?.phone || '-'}</p>
            <p><span className="font-semibold">Sale Date:</span> {formatDate(sale.saleDate)}</p>
            <p><span className="font-semibold">Gross Sales:</span> {formatAmount(sale.grossSales)}</p>
            <p><span className="font-semibold">COGS:</span> {formatAmount(sale.totalCogs)}</p>
            <p><span className="font-semibold">Profit:</span> {formatAmount(sale.grossProfit)}</p>
          </section>

          <section className="border border-slate-300 bg-white p-3">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Selling Price</th>
                  <th>Unit Cost</th>
                  <th>Line Profit</th>
                </tr>
              </thead>
              <tbody>
                {(sale.items || []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.product?.name || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatAmount(item.unitSellingPrice)}</td>
                    <td>{formatAmount(item.unitCost)}</td>
                    <td>{formatAmount(item.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </section>
  )
}
