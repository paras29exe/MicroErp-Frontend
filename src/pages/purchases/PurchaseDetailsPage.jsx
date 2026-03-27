import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getPurchaseById } from '@/features/purchases/purchases.api'
import { getApiMessage } from '@/lib/api-response'
import { formatDateDDMMYYYY } from '@/lib/date-format'

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

function formatDate(value) {
  return formatDateDDMMYYYY(value)
}

export function PurchaseDetailsPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [purchase, setPurchase] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getPurchaseById(id)
        setPurchase(data)
      } catch (apiError) {
        setError(getApiMessage(apiError, 'Failed to load purchase details'))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between border border-slate-300 bg-white px-3 py-2">
        <h2 className="text-sm font-semibold text-blue-700">Purchase Details #{id}</h2>
        <Button render={<Link to="/purchases/orders" />} variant="outline" size="sm">
          Back to Orders
        </Button>
      </header>

      {loading && <div className="border border-slate-300 bg-white px-3 py-2 text-sm">Loading purchase details...</div>}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && purchase && (
        <>
          <section className="border border-slate-300 bg-white p-3 text-sm">
            <p><span className="font-semibold">Vendor:</span> {purchase.vendor?.name || '-'}</p>
            <p><span className="font-semibold">Phone:</span> {purchase.vendor?.phone || '-'}</p>
            <p><span className="font-semibold">Purchase Date:</span> {formatDate(purchase.purchaseDate)}</p>
            <p><span className="font-semibold">Payment Status:</span> {purchase.paymentStatus || '-'}</p>
            <p><span className="font-semibold">Total Amount:</span> {formatAmount(purchase.totalAmount)}</p>
          </section>

          <section className="border border-slate-300 bg-white p-3">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {(purchase.items || []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.product?.name || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatAmount(item.price)}</td>
                    <td>{formatAmount(Number(item.quantity || 0) * Number(item.price || 0))}</td>
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
