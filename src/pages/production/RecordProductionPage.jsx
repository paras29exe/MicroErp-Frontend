import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { getInventoryByProductId } from '@/features/inventory/inventory.api'
import {
  getBomByProductId,
  getFinishedProducts,
  recordProduction,
} from '@/features/production/production.api'
import { getApiMessage } from '@/lib/api-response'
import { toast } from 'sonner'

export function RecordProductionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [productsLoading, setProductsLoading] = useState(false)
  const [finishedProducts, setFinishedProducts] = useState([])

  const [finishedProductId, setFinishedProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [productionDate, setProductionDate] = useState(() => new Date().toISOString().slice(0, 10))

  const [bomLoading, setBomLoading] = useState(false)
  const [bom, setBom] = useState(null)
  const [bomMessage, setBomMessage] = useState('')
  const [rawStockById, setRawStockById] = useState({})

  const requiredItems = useMemo(() => {
    if (!bom?.items?.length) return []
    const normalizedQty = Number(quantity) || 0
    return bom.items.map((item) => {
      const required = item.quantity * normalizedQty
      const available = rawStockById[item.rawMaterialId]?.stockQuantity || 0
      return {
        rawMaterialId: item.rawMaterialId,
        name: item.rawMaterial?.name || '-',
        perUnit: item.quantity,
        required,
        available,
        sufficient: available >= required,
      }
    })
  }, [bom, quantity, rawStockById])

  async function loadFinishedProducts(search) {
    setProductsLoading(true)
    try {
      const data = await getFinishedProducts(search)
      setFinishedProducts(data)
    } catch {
      setFinishedProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  async function loadBomAndStock(nextProductId) {
    if (!nextProductId) {
      setBom(null)
      setBomMessage('')
      setRawStockById({})
      return
    }

    setBomLoading(true)
    setBom(null)
    setBomMessage('')
    setRawStockById({})
    try {
      const data = await getBomByProductId(Number(nextProductId))
      setBom(data)

      const stockEntries = await Promise.all(
        (data.items || []).map(async (item) => {
          try {
            const snapshot = await getInventoryByProductId(item.rawMaterialId)
            return [item.rawMaterialId, snapshot]
          } catch {
            return [item.rawMaterialId, { stockQuantity: 0 }]
          }
        }),
      )

      setRawStockById(Object.fromEntries(stockEntries))
    } catch (apiError) {
      setBom(null)
      setRawStockById({})
      const message = getApiMessage(apiError, 'Failed to load BOM for selected product')
      if (message.toLowerCase().includes('bom not found')) {
        setBomMessage('No BOM found for selected product. Create BOM before recording production.')
      } else {
        setBomMessage(message)
      }
    } finally {
      setBomLoading(false)
    }
  }

  useEffect(() => {
    loadFinishedProducts('')
  }, [])

  function validateBeforeConfirm() {
    const normalizedQuantity = Number(quantity)
    if (!finishedProductId) {
      setError('Please select a finished product')
      return false
    }

    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity <= 0) {
      setError('Quantity must be a positive integer')
      return false
    }

    if (!productionDate) {
      setError('Production date is required')
      return false
    }

    if (!bom?.items?.length) {
      setError('No BOM found for selected product. Create BOM first.')
      return false
    }

    const insufficient = requiredItems.find((item) => !item.sufficient)
    if (insufficient) {
      setError(`Insufficient stock for ${insufficient.name}`)
      return false
    }

    return true
  }

  function openConfirm() {
    setError('')
    if (!validateBeforeConfirm()) {
      setConfirmOpen(false)
      return
    }

    setConfirmOpen(true)
  }

  async function handleConfirmRecord() {
    setError('')

    if (!validateBeforeConfirm()) {
      setConfirmOpen(false)
      return
    }

    const normalizedQuantity = Number(quantity)

    setLoading(true)
    try {
      await recordProduction({
        productId: Number(finishedProductId),
        quantity: normalizedQuantity,
        productionDate,
      })
      toast.success('Production recorded successfully')
      setQuantity(1)
      setConfirmOpen(false)
      await loadBomAndStock(finishedProductId)
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to record production'))
      setConfirmOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-3">
      <header className="border border-slate-300 bg-white px-3 py-2">
        <h2 className="text-sm font-semibold text-blue-700">Record Production</h2>
        <p className="text-xs text-slate-500">Consume raw materials and add finished product stock.</p>
      </header>

      <section className="grid gap-3 border border-slate-300 bg-white p-3 md:grid-cols-3">
        <div className="space-y-1 md:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Finished Product</label>
          <SearchableSelect
            value={finishedProductId}
            onValueChange={(next) => {
              const nextId = String(next)
              setError('')
              setFinishedProductId(nextId)
              loadBomAndStock(nextId)
            }}
            loading={productsLoading}
            loadingText="Loading finished products..."
            onSearchChange={(next) => loadFinishedProducts(next)}
            options={finishedProducts.map((product) => ({
              value: String(product.id),
              label: product.name,
            }))}
            placeholder="Select finished product"
            searchPlaceholder="Search finished product"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Production Date</label>
          <input
            type="date"
            value={productionDate}
            onChange={(event) => setProductionDate(event.target.value)}
            className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
          />
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
      </section>

      <section className="border border-slate-300 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-700">Required Raw Materials</h3>
          {/* {bomLoading && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading BOM and stock...
            </span>
          )} */}
        </div>

        <div className="overflow-x-auto">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Raw Material</th>
                <th>Per Unit</th>
                <th>Required</th>
                <th>Available</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bomLoading && (
                <tr>
                  <td colSpan={5} className="py-5 text-center text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading BOM and raw material stock...
                    </span>
                  </td>
                </tr>
              )}
              {!bomLoading && requiredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500">Select a finished product with BOM</td>
                </tr>
              )}
              {requiredItems.map((item) => (
                <tr key={item.rawMaterialId}>
                  <td>{item.name}</td>
                  <td>{item.perUnit}</td>
                  <td>{item.required}</td>
                  <td>{item.available}</td>
                  <td className={item.sufficient ? 'text-green-700' : 'text-red-700'}>
                    {item.sufficient ? 'Sufficient' : 'Insufficient'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!bomLoading && finishedProductId && !bom?.items?.length && (
          <div className="mt-2 flex items-center justify-between gap-2 border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <span>{bomMessage || 'No BOM found for selected product.'}</span>
            <Button render={<Link to={`/production/bom/create?productId=${finishedProductId}`} />} type="button" size="sm" className="bg-amber-700 text-white hover:bg-amber-800">
              Create BOM
            </Button>
          </div>
        )}
      </section>

      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-end">
        <Button
          type="button"
          disabled={loading}
          className="bg-green-700 text-white hover:bg-green-800"
          onClick={openConfirm}
        >
          {loading ? 'Saving...' : 'Record Production'}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Production"
        description="Record this production run now?"
        helperText="This action updates raw and finished inventory stocks."
        confirmText="Confirm"
        loading={loading}
        onConfirm={handleConfirmRecord}
      />
    </section>
  )
}
