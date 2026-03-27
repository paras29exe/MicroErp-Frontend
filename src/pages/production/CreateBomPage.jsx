import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  getBomByProductId,
  getFinishedProducts,
  getRawMaterialProducts,
  upsertBom,
} from '@/features/production/production.api'
import { getApiMessage } from '@/lib/api-response'
import { toast } from 'sonner'

export function CreateBomPage() {
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [finishedLoading, setFinishedLoading] = useState(false)
  const [finishedProducts, setFinishedProducts] = useState([])
  const [finishedProductId, setFinishedProductId] = useState('')

  const [rawLoading, setRawLoading] = useState(false)
  const [rawProducts, setRawProducts] = useState([])

  const [rows, setRows] = useState([{ rawMaterialId: '', quantity: 1 }])

  const selectedFinished = useMemo(
    () => finishedProducts.find((item) => String(item.id) === String(finishedProductId)),
    [finishedProducts, finishedProductId],
  )

  async function loadFinishedProducts(search) {
    setFinishedLoading(true)
    try {
      const data = await getFinishedProducts(search)
      setFinishedProducts(data)
    } catch {
      setFinishedProducts([])
    } finally {
      setFinishedLoading(false)
    }
  }

  async function loadRawProducts(search) {
    setRawLoading(true)
    try {
      const data = await getRawMaterialProducts(search)
      setRawProducts(data)
    } catch {
      setRawProducts([])
    } finally {
      setRawLoading(false)
    }
  }

  useEffect(() => {
    loadFinishedProducts('')
    loadRawProducts('')
  }, [])

  useEffect(() => {
    const initialProductId = searchParams.get('productId') || ''
    if (!initialProductId) return

    setFinishedProductId(initialProductId)

    async function preloadBom() {
      try {
        const bom = await getBomByProductId(Number(initialProductId))
        if (Array.isArray(bom?.items) && bom.items.length > 0) {
          setRows(
            bom.items.map((item) => ({
              rawMaterialId: String(item.rawMaterialId),
              quantity: item.quantity,
            })),
          )
        }
      } catch {
        // If no BOM exists, keep default row.
      }
    }

    preloadBom()
  }, [searchParams])

  function setRow(index, patch) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function addRow() {
    setRows((prev) => [...prev, { rawMaterialId: '', quantity: 1 }])
  }

  function removeRow(index) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!finishedProductId) {
      setError('Please select a finished product')
      return
    }

    const normalizedItems = []
    const selectedRawIds = new Set()

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i]
      const quantity = Number(row.quantity)

      if (!row.rawMaterialId) {
        setError(`Row ${i + 1}: raw material is required`)
        return
      }

      if (selectedRawIds.has(String(row.rawMaterialId))) {
        setError(`Row ${i + 1}: duplicate raw material selected`)
        return
      }

      selectedRawIds.add(String(row.rawMaterialId))

      if (!Number.isInteger(quantity) || quantity <= 0) {
        setError(`Row ${i + 1}: quantity must be a positive integer`)
        return
      }

      normalizedItems.push({
        rawMaterialId: Number(row.rawMaterialId),
        quantity,
      })
    }

    setLoading(true)
    try {
      await upsertBom({
        productId: Number(finishedProductId),
        items: normalizedItems,
      })
      toast.success('BOM saved successfully')
    } catch (apiError) {
      setError(getApiMessage(apiError, 'Failed to save BOM'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-3">
      <header className="border border-slate-300 bg-white px-3 py-2">
        <h2 className="text-sm font-semibold text-blue-700">Create BOM</h2>
        <p className="text-xs text-slate-500">Define raw material quantities required for one finished item.</p>
      </header>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <section className="border border-slate-300 bg-white p-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Finished Product</label>
            <SearchableSelect
              value={finishedProductId}
              onValueChange={(next) => setFinishedProductId(String(next))}
              loading={finishedLoading}
              loadingText="Loading finished products..."
              onSearchChange={(next) => loadFinishedProducts(next)}
              options={finishedProducts.map((product) => ({
                value: String(product.id),
                label: product.name,
              }))}
              placeholder="Select finished product"
              searchPlaceholder="Search finished product"
            />
            <p className="text-xs text-slate-500">Selected: {selectedFinished?.name || '-'}</p>
          </div>
        </section>

        <section className="border border-slate-300 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-700">Raw Material Lines</h3>
          </div>

          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={`bom-row-${index}`} className="grid gap-2 border border-slate-200 p-2 md:grid-cols-[2fr_1fr_auto]">
                <SearchableSelect
                  value={row.rawMaterialId}
                  onValueChange={(next) => setRow(index, { rawMaterialId: String(next) })}
                  loading={rawLoading}
                  loadingText="Loading raw materials..."
                  onSearchChange={(next) => loadRawProducts(next)}
                  options={rawProducts.map((product) => ({
                    value: String(product.id),
                    label: product.name,
                  }))}
                  placeholder="Select raw material"
                  searchPlaceholder="Search raw material"
                />

                <input
                  type="number"
                  min="1"
                  value={row.quantity}
                  onChange={(event) => setRow(index, { quantity: event.target.value })}
                  className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700"
                  onClick={() => removeRow(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              Add Raw Material
            </Button>
          </div>
        </section>

        {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex items-center justify-end">
          <Button type="submit" disabled={loading} className="bg-green-700 text-white hover:bg-green-800">
            {loading ? 'Saving...' : 'Save BOM'}
          </Button>
        </div>
      </form>
    </section>
  )
}
