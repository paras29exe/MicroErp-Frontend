import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  getLowStockProducts,
  updateInventoryReorderLevel,
} from '@/features/inventory/inventory.api'
import { useAuthStore } from '@/features/auth/auth.store'
import { getApiMessage } from '@/lib/api-response'
import { hasPermission } from '@/lib/permissions'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

function getSeverityClass(stockQuantity, reorderLevel) {
  if (stockQuantity === 0) return 'text-red-700'
  if (stockQuantity <= reorderLevel) return 'text-amber-700'
  return 'text-green-700'
}

export function InventoryLowStockPage() {
  const user = useAuthStore((state) => state.user)
  const canUpdate = hasPermission(user?.role, 'inventory:update')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [editTarget, setEditTarget] = useState(null)
  const [nextReorderLevel, setNextReorderLevel] = useState('')
  const [savingReorder, setSavingReorder] = useState(false)

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const data = await getLowStockProducts()
      setRows(data)
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to load low stock products'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleSaveReorderLevel() {
    if (!canUpdate || !editTarget) return

    const normalized = Number(nextReorderLevel)
    if (!Number.isInteger(normalized) || normalized < 0) {
      setError('Reorder level must be a non-negative integer')
      return
    }

    setSavingReorder(true)
    setError('')

    try {
      await updateInventoryReorderLevel(editTarget.productId, normalized)
      toast.success(`Reorder level updated for ${editTarget.productName}`)
      setEditTarget(null)
      setNextReorderLevel('')
      await loadData()
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to update reorder level'))
    } finally {
      setSavingReorder(false)
    }
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Low Stock Alerts</h2>
          <p className="text-xs text-slate-500">Products at or below reorder threshold.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="mr-2 font-semibold text-slate-700">Alerts: {rows.length}</span>
          <Button type="button" variant="outline" size="sm" onClick={loadData}>
            Refresh
          </Button>
        </div>
      </header>

      {loading && <div className="border border-slate-300 bg-white px-3 py-2 text-sm">Loading low stock list...</div>}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-500">No low stock alerts</td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.productId}>
                    <td>{row.productName || '-'}</td>
                    <td>{row.stockQuantity}</td>
                    <td>{row.reorderLevel}</td>
                    <td className={getSeverityClass(row.stockQuantity, row.reorderLevel)}>
                      {row.stockQuantity === 0 ? 'Out of Stock' : 'Low Stock'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {canUpdate ? (
                          <>
                            <Button
                              render={<Link to={`/inventory/adjustments?productId=${row.productId}`} />}
                              type="button"
                              variant="outline"
                              size="sm"
                            >
                              Adjust
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditTarget(row)
                                setNextReorderLevel(String(row.reorderLevel))
                              }}
                            >
                              Edit Reorder
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">Read only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null)
            setNextReorderLevel('')
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Reorder Level</DialogTitle>
            <DialogDescription>
              {editTarget
                ? `Set a new reorder level for ${editTarget.productName}.`
                : 'Set a new reorder level.'}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reorder Level</label>
            <input
              type="number"
              min="0"
              value={nextReorderLevel}
              onChange={(event) => setNextReorderLevel(event.target.value)}
              className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)} disabled={savingReorder}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveReorderLevel} disabled={savingReorder} className="bg-green-700 text-white hover:bg-green-800">
              {savingReorder ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
