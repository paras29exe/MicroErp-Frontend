import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  createPurchase,
  getPurchaseProducts,
  getPurchaseVendors,
} from '@/features/purchases/purchases.api'
import { getApiMessage } from '@/lib/api-response'
import { toast } from 'sonner'

function formatPrice(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return '-'
  return parsed.toFixed(2)
}

export function CreatePurchasePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [paymentStatus, setPaymentStatus] = useState('pending')

  const [vendorsLoading, setVendorsLoading] = useState(false)
  const [vendors, setVendors] = useState([])
  const [vendorId, setVendorId] = useState('')

  const [productsLoading, setProductsLoading] = useState(false)
  const [products, setProducts] = useState([])

  const [rows, setRows] = useState([
    {
      productId: '',
      quantity: 1,
      unitPrice: '',
    },
  ])

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const qty = Number(row.quantity) || 0
        const price = Number(row.unitPrice) || 0
        acc.totalItems += qty
        acc.totalAmount += qty * price
        return acc
      },
      { totalItems: 0, totalAmount: 0 },
    )
  }, [rows])

  async function loadVendors(searchText) {
    setVendorsLoading(true)
    try {
      const data = await getPurchaseVendors(searchText)
      setVendors(data)
    } catch {
      setVendors([])
    } finally {
      setVendorsLoading(false)
    }
  }

  async function loadProducts(searchText) {
    setProductsLoading(true)
    try {
      const data = await getPurchaseProducts(searchText)
      setProducts(data)
    } catch {
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  useEffect(() => {
    loadVendors('')
    loadProducts('')
  }, [])

  function setRow(index, patch) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        productId: '',
        quantity: 1,
        unitPrice: '',
      },
    ])
  }

  function removeRow(index) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!vendorId) {
      setError('Please select a vendor')
      return
    }

    if (!purchaseDate) {
      setError('Please select purchase date')
      return
    }

    const normalizedItems = []
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i]
      const quantity = Number(row.quantity)
      const price = Number(row.unitPrice)

      if (!row.productId) {
        setError(`Row ${i + 1}: product is required`)
        return
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        setError(`Row ${i + 1}: quantity must be a positive integer`)
        return
      }

      if (!Number.isFinite(price) || price < 0) {
        setError(`Row ${i + 1}: unit price must be a non-negative number`)
        return
      }

      normalizedItems.push({
        productId: Number(row.productId),
        quantity,
        price,
      })
    }

    setLoading(true)
    try {
      await createPurchase({
        vendorId: Number(vendorId),
        purchaseDate,
        paymentStatus,
        items: normalizedItems,
      })

      setVendorId('')
      setPurchaseDate(new Date().toISOString().slice(0, 10))
      setPaymentStatus('pending')
      setRows([
        {
          productId: '',
          quantity: 1,
          unitPrice: '',
        },
      ])
      toast.success('Purchase created successfully')
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to create purchase'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-3">
      <header className="border border-slate-300 bg-white px-3 py-2">
        <h2 className="text-sm font-semibold text-blue-700">Record New Purchase</h2>
        <p className="text-xs text-slate-500">Create purchase with active vendors and raw-material products</p>
      </header>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <section className="grid gap-2 border border-slate-300 bg-white p-3 md:grid-cols-3">
          <div className="min-w-0 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vendor</label>
            <SearchableSelect
              value={vendorId}
              onValueChange={(next) => setVendorId(String(next))}
              loading={vendorsLoading}
              loadingText="Loading vendors..."
              onSearchChange={(next) => loadVendors(next)}
              options={vendors.map((vendor) => ({
                value: String(vendor.id),
                label: `${vendor.name} (${vendor.phone || '-'})`,
              }))}
              placeholder="Select vendor"
              searchPlaceholder="Search vendor"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Purchase Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
              className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </section>

        <section className="border border-slate-300 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-700">Purchase Items</h3>
          </div>

          <div className="space-y-2">
            {rows.map((row, index) => {
              const selected = products.find((product) => String(product.id) === String(row.productId))

              return (
                <div key={`row-${index}`} className="grid gap-2 border border-slate-200 p-2 md:grid-cols-[2fr_1fr_1fr_auto]">
                  <div className="min-w-0">
                    <SearchableSelect
                      value={row.productId}
                      onValueChange={(nextValue) => {
                        const nextProductId = String(nextValue)
                        setRow(index, { productId: nextProductId })
                      }}
                      loading={productsLoading}
                      loadingText="Loading products..."
                      onSearchChange={(next) => loadProducts(next)}
                      options={products.map((product) => ({
                        value: String(product.id),
                        label: `${product.name} (${product.category})`,
                      }))}
                      placeholder="Select product"
                      searchPlaceholder="Search product"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Category: {selected?.category || '-'}
                    </p>
                  </div>

                  <input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(event) => setRow(index, { quantity: event.target.value })}
                    placeholder="Qty"
                    className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.unitPrice}
                    onChange={(event) => setRow(index, { unitPrice: event.target.value })}
                    placeholder="Unit price"
                    className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
                  />

                  <Button className="bg-red-600 text-white hover:bg-red-700 hover:text-white" type="button" variant="outline" size="sm" onClick={() => removeRow(index)}>
                    Remove
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              Add Item Row
            </Button>
          </div>
        </section>

        <section className="border border-slate-300 bg-slate-50 px-3 py-2 text-xs">
          <span className="font-semibold text-slate-700">Total Qty:</span> {summary.totalItems}
          <span className="ml-4 font-semibold text-slate-700">Total Amount:</span> {formatPrice(summary.totalAmount)}
        </section>

        {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/purchases/orders')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-green-700 text-white hover:bg-green-800">
            {loading ? 'Saving...' : 'Create Purchase'}
          </Button>
        </div>
      </form>
    </section>
  )
}
