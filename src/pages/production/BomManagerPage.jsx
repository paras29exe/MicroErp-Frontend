import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { getApiMessage } from '@/lib/api-response'
import {
  getBomByProductId,
  getFinishedProducts,
} from '@/features/production/production.api'

export function BomManagerPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [productsLoading, setProductsLoading] = useState(false)
  const [finishedProducts, setFinishedProducts] = useState([])
  const [finishedProductId, setFinishedProductId] = useState('')

  const [bom, setBom] = useState(null)

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

  useEffect(() => {
    loadFinishedProducts('')
  }, [])

  async function handleLoadBom() {
    setError('')
    setInfo('')
    setBom(null)

    if (!finishedProductId) {
      setError('Please select a finished product')
      return
    }

    setLoading(true)
    try {
      const data = await getBomByProductId(Number(finishedProductId))
      setBom(data)
    } catch (apiError) {
      const message = getApiMessage(apiError, 'Failed to load BOM')
      if (message.toLowerCase().includes('bom not found')) {
        setInfo('No BOM found for this product. Create one to start production.')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">BOM Manager</h2>
          <p className="text-xs text-slate-500">Lookup and maintain BOM definitions for finished products.</p>
        </div>
        <Button render={<Link to="/production/bom/create" />} size="sm" className="bg-green-700 text-white hover:bg-green-800">
          Create BOM
        </Button>
      </header>

      <section className="border border-slate-300 bg-white p-3">
        <div className="grid gap-2 md:grid-cols-[2fr_auto]">
          <SearchableSelect
            value={finishedProductId}
            onValueChange={(next) => setFinishedProductId(String(next))}
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
          <Button type="button" variant="outline" onClick={handleLoadBom} disabled={loading}>
            {loading ? 'Loading...' : 'Load BOM'}
          </Button>
        </div>
      </section>

      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {info && <div className="border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">{info}</div>}

      {bom && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">{bom.product?.name || 'BOM Details'}</h3>
              <p className="text-xs text-slate-500">Raw materials per 1 unit of finished product.</p>
            </div>
            <Button render={<Link to={`/production/bom/create?productId=${bom.productId}`} />} type="button" variant="outline" size="sm">
              Edit BOM
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Raw Material</th>
                  <th>Category</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {bom.items?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-slate-500">No BOM lines found</td>
                  </tr>
                )}
                {(bom.items || []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.rawMaterial?.name || '-'}</td>
                    <td>{item.rawMaterial?.category || '-'}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  )
}
