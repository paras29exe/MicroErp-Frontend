import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  createSale,
  getFinishedProductsWithStock,
  getSaleCustomers,
} from '@/features/sales/sales.api'
import { getApiMessage } from '@/lib/api-response'
import { toast } from 'sonner'

function getStockText(product) {
  if (!product) return ''
  if (product.stockQuantity <= 0) return 'No stock'
  return `In stock: ${product.stockQuantity}`
}

function stockClass(product) {
  if (!product) return 'text-slate-500'
  if (product.stockStatus === 'out_of_stock') return 'text-red-700'
  if (product.stockStatus === 'low_stock') return 'text-amber-700'
  return 'text-green-700'
}

function formatPrice(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return '-'
  return parsed.toFixed(2)
}

export function CreateSalePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [customersLoading, setCustomersLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [productsLoading, setProductsLoading] = useState(false)
  const [products, setProducts] = useState([])

  const [rows, setRows] = useState([
    {
      productId: '',
      quantity: 1,
      unitSellingPrice: '',
      stockQuantity: 0,
      stockStatus: 'out_of_stock',
    },
  ])

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const qty = Number(row.quantity) || 0
        const price = Number(row.unitSellingPrice) || 0
        acc.totalItems += qty
        acc.totalAmount += qty * price
        return acc
      },
      { totalItems: 0, totalAmount: 0 },
    )
  }, [rows])

  async function loadCustomers(searchText) {
    setCustomersLoading(true)
    try {
      const data = await getSaleCustomers(searchText)
      setCustomers(data)
    } catch {
      setCustomers([])
    } finally {
      setCustomersLoading(false)
    }
  }

  async function loadProducts(searchText) {
    setProductsLoading(true)
    try {
      const data = await getFinishedProductsWithStock(searchText)
      setProducts(data)
    } catch {
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers('')
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
        unitSellingPrice: '',
        stockQuantity: 0,
        stockStatus: 'out_of_stock',
      },
    ])
  }

  function removeRow(index) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!customerId) {
      setError('Please select a customer')
      return
    }

    const normalizedItems = []
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i]
      const quantity = Number(row.quantity)
      const unitSellingPrice = Number(row.unitSellingPrice)

      if (!row.productId) {
        setError(`Row ${i + 1}: product is required`)
        return
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        setError(`Row ${i + 1}: quantity must be a positive integer`)
        return
      }

      if (!Number.isFinite(unitSellingPrice) || unitSellingPrice < 0) {
        setError(`Row ${i + 1}: price must be a non-negative number`)
        return
      }

      if (quantity > Number(row.stockQuantity || 0)) {
        setError(`Row ${i + 1}: quantity exceeds stock (${row.stockQuantity || 0})`)
        return
      }

      normalizedItems.push({
        productId: Number(row.productId),
        quantity,
        unitSellingPrice,
      })
    }

    setLoading(true)
    try {
      await createSale({
        customerId: Number(customerId),
        items: normalizedItems,
      })
      setCustomerId('')
      setRows([
        {
          productId: '',
          quantity: 1,
          unitSellingPrice: '',
          stockQuantity: 0,
          stockStatus: 'out_of_stock',
        },
      ])
      toast.success('Sale created successfully')
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to create sale'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-3">
      <header className="border border-slate-300 bg-white px-3 py-2">
        <h2 className="text-sm font-semibold text-blue-700">Record New Sale</h2>
        <p className="text-xs text-slate-500">Create order with stock-aware product selection</p>
      </header>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <section className="border border-slate-300 bg-white p-3">
          <div className="min-w-0 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Customer</label>
            <SearchableSelect
              value={customerId}
              onValueChange={(next) => setCustomerId(String(next))}
              loading={customersLoading}
              loadingText="Loading customers..."
              onSearchChange={(next) => loadCustomers(next)}
              options={customers.map((customer) => ({
                value: String(customer.id),
                label: `${customer.name} (${customer.phone || '-'})`,
              }))}
              placeholder="Select customer"
              searchPlaceholder="Search customer"
            />
          </div>
        </section>

        <section className="border border-slate-300 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-700">Sale Items</h3>
          </div>

          <div className="space-y-2">
            {rows.map((row, index) => {
              const selected = products.find((product) => String(product.id) === String(row.productId))

              return (
                <div key={`row-${index}`} className="grid gap-2 border border-slate-200 p-2 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                  <div className="min-w-0">
                    <SearchableSelect
                      value={row.productId}
                      onValueChange={(nextValue) => {
                        const nextProductId = String(nextValue)
                        const product = products.find((p) => String(p.id) === nextProductId)
                        setRow(index, {
                          productId: nextProductId,
                          stockQuantity: product?.stockQuantity || 0,
                          stockStatus: product?.stockStatus || 'out_of_stock',
                        })
                      }}
                      loading={productsLoading}
                      loadingText="Loading products..."
                      onSearchChange={(next) => loadProducts(next)}
                      options={products.map((product) => ({
                        value: String(product.id),
                        label: `${product.name} - ${product.stockQuantity <= 0 ? 'No stock' : `In stock: ${product.stockQuantity}`}`,
                      }))}
                      placeholder="Select product"
                      searchPlaceholder="Search product"
                    />
                    <p className={`mt-1 text-xs ${stockClass(selected)}`}>{getStockText(selected)}</p>
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
                    type="text"
                    readOnly
                    value={selected ? formatPrice(selected.unitPrice) : ''}
                    placeholder="Unit price (read-only)"
                    className="rounded-sm border border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.unitSellingPrice}
                    onChange={(event) => setRow(index, { unitSellingPrice: event.target.value })}
                    placeholder="Unit selling price"
                    className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
                  />

                  <Button className={"bg-red-600 text-white hover:bg-red-700 hover:text-white"} type="button" variant="outline" size="sm" onClick={() => removeRow(index)}>
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
          <span className="ml-4 font-semibold text-slate-700">Gross Sales:</span> {summary.totalAmount.toFixed(2)}
        </section>

        {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/sales/orders')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-green-700 text-white hover:bg-green-800">
            {loading ? 'Saving...' : 'Create Sale'}
          </Button>
        </div>
      </form>
    </section>
  )
}
