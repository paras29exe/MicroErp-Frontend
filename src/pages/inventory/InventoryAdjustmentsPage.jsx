import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  adjustInventoryStock,
  getInventoryByProductId,
  getInventoryProducts,
} from '@/features/inventory/inventory.api'
import { getApiMessage } from '@/lib/api-response'
import { toast } from 'sonner'

export function InventoryAdjustmentsPage() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [productsLoading, setProductsLoading] = useState(false)
  const [products, setProducts] = useState([])

  const [productId, setProductId] = useState('')
  const [adjustmentType, setAdjustmentType] = useState('increase')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [snapshot, setSnapshot] = useState(null)

  async function loadProducts(searchText) {
    setProductsLoading(true)
    try {
      const data = await getInventoryProducts(searchText)
      setProducts(data)
    } catch {
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  async function loadSnapshot(nextProductId) {
    if (!nextProductId) {
      setSnapshot(null)
      return
    }

    try {
      const data = await getInventoryByProductId(Number(nextProductId))
      setSnapshot(data)
    } catch {
      setSnapshot(null)
    }
  }

  useEffect(() => {
    loadProducts('')
  }, [])

  useEffect(() => {
    const initialProductId = searchParams.get('productId') || ''
    if (!initialProductId) return
    setProductId(initialProductId)
    loadSnapshot(initialProductId)
  }, [searchParams])

  async function handleSubmit() {
    setError('')

    const normalizedQuantity = Number(quantity)
    if (!productId) {
      setError('Please select a product')
      return
    }

    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity <= 0) {
      setError('Quantity must be a positive integer')
      return
    }

    if (!reason || !reason.trim()) {
      setError('Reason is required')
      return
    }

    setLoading(true)
    try {
      await adjustInventoryStock({
        productId: Number(productId),
        adjustmentType,
        quantity: normalizedQuantity,
        reason: reason.trim(),
      })

      toast.success('Stock adjusted successfully')
      setQuantity(1)
      setReason('')
      setConfirmOpen(false)
      await loadSnapshot(productId)
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to adjust stock'))
      setConfirmOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-3">
      <header className="border border-slate-300 bg-white px-3 py-2">
        <h2 className="text-sm font-semibold text-blue-700">Stock Adjustments</h2>
        <p className="text-xs text-slate-500">Apply controlled increase/decrease inventory adjustments.</p>
      </header>

      <section className="grid gap-3 border border-slate-300 bg-white p-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Product</label>
          <SearchableSelect
            value={productId}
            onValueChange={(next) => {
              const nextId = String(next)
              setProductId(nextId)
              loadSnapshot(nextId)
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
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Adjustment Type</label>
          <select
            value={adjustmentType}
            onChange={(event) => setAdjustmentType(event.target.value)}
            className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
          >
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reason</label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="Explain why this adjustment is needed"
            className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
          />
        </div>
      </section>

      <section className="border border-slate-300 bg-slate-50 px-3 py-2 text-xs">
        <p className="font-semibold text-slate-700">Current Snapshot</p>
        <div className="mt-1 grid gap-1 sm:grid-cols-2">
          <p><span className="font-semibold">Stock:</span> {snapshot?.stockQuantity ?? '-'}</p>
          <p><span className="font-semibold">Reorder Level:</span> {snapshot?.reorderLevel ?? '-'}</p>
          <p><span className="font-semibold">Avg Cost:</span> {snapshot?.avgCost ?? '-'}</p>
          <p><span className="font-semibold">Stock Value:</span> {snapshot?.stockValue ?? '-'}</p>
        </div>
      </section>

      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-end">
        <Button
          type="button"
          disabled={loading}
          className="bg-green-700 text-white hover:bg-green-800"
          onClick={() => setConfirmOpen(true)}
        >
          {loading ? 'Saving...' : 'Submit Adjustment'}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Stock Adjustment"
        description="Apply this stock adjustment now?"
        helperText="This will create an inventory transaction record."
        confirmText="Confirm"
        loading={loading}
        onConfirm={handleSubmit}
      />
    </section>
  )
}
