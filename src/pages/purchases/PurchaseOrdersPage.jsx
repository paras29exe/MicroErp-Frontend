import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { PurchaseFilterDialog } from '@/components/purchases/PurchaseFilterDialog'
import {
  deletePurchase,
  getPurchaseList,
  updatePurchasePaymentStatus,
} from '@/features/purchases/purchases.api'
import { getApiMessage } from '@/lib/api-response'
import { formatDateDDMMYYYY } from '@/lib/date-format'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/features/auth/auth.store'
import { toast } from 'sonner'
import { PageLoader } from '@/components/common/page-loader'

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

function formatDate(value) {
  return formatDateDDMMYYYY(value)
}

function getFiltersFromSearchParams(searchParams) {
  return {
    purchaseId: searchParams.get('purchaseId') || searchParams.get('search') || '',
    vendor: searchParams.get('vendor') || '',
    productName: searchParams.get('productName') || '',
    paymentStatus: searchParams.get('paymentStatus') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || '',
  }
}

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
  if (direction === 'asc') return <ArrowUp className="h-3.5 w-3.5 text-slate-700" />
  return <ArrowDown className="h-3.5 w-3.5 text-slate-700" />
}

export function PurchaseOrdersPage() {
  const user = useAuthStore((state) => state.user)
  const canCreate = hasPermission(user, 'purchase:create')
  const canDelete = hasPermission(user, 'purchase:delete')
  const canUpdate = hasPermission(user, 'purchase:update')

  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState({ field: 'purchaseDate', direction: 'desc' })
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filters = useMemo(() => getFiltersFromSearchParams(searchParams), [searchParams])
  const vendor = filters.vendor.trim()
  const purchaseId = filters.purchaseId.trim()

  useEffect(() => {
    const parsed = Number.parseInt(searchParams.get('page') || '', 10)
    if (Number.isInteger(parsed) && parsed > 0) {
      setPage(parsed)
    } else {
      setPage(1)
    }
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true })
    }
  }, [page, searchParams, setSearchParams])

  const canGoPrev = page > 1
  const canGoNext = page < meta.totalPages

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const data = await getPurchaseList({
          page,
          limit: 20,
          sortBy: sort.field,
          sortOrder: sort.direction,
          ...(filters.purchaseId ? { search: filters.purchaseId } : {}),
          ...(filters.vendor ? { vendorName: filters.vendor, vendorPhone: filters.vendor } : {}),
          ...(filters.productName ? { productName: filters.productName } : {}),
          ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
          ...(filters.startDate ? { startDate: filters.startDate } : {}),
          ...(filters.endDate ? { endDate: filters.endDate } : {}),
          ...(filters.minAmount ? { minAmount: filters.minAmount } : {}),
          ...(filters.maxAmount ? { maxAmount: filters.maxAmount } : {}),
        })

        if (cancelled) return

        setRows(data.items)
        setMeta(data.meta)
      } catch (apiError) {
        if (cancelled) return
        setError(getApiMessage(apiError, 'Failed to load purchase orders'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [page, sort, filters])

  function updateFilterQuery(nextFilters) {
    const params = new URLSearchParams(searchParams)

    Object.entries(nextFilters).forEach(([key, value]) => {
      const normalized = String(value || '').trim()
      if (normalized) params.set(key, normalized)
      else params.delete(key)
    })

    params.set('page', '1')
    setSearchParams(params)
    setPage(1)
  }

  async function handleDeleteConfirm() {
    if (!canDelete || !deleteTarget) return

    setDeleting(true)
    setError('')
    try {
      await deletePurchase(deleteTarget.id)
      toast.success(`Purchase #${deleteTarget.id} deleted successfully`)
      setDeleteTarget(null)

      const data = await getPurchaseList({
        page,
        limit: 20,
        sortBy: sort.field,
        sortOrder: sort.direction,
        ...(vendor ? { vendorName: vendor } : {}),
        ...(purchaseId ? { search: purchaseId } : {}),
      })

      setRows(data.items)
      setMeta(data.meta)
    } catch (apiError) {
      const message = getApiMessage(apiError, 'Failed to delete purchase')
      setError(message)
      toast.error(message)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  async function handleStatusConfirm() {
    if (!canUpdate || !statusTarget) return

    const row = statusTarget
    const nextStatus = row.paymentStatus === 'paid' ? 'pending' : 'paid'

    setStatusUpdating(true)
    setUpdatingStatusId(row.id)
    setError('')

    try {
      await updatePurchasePaymentStatus(row.id, nextStatus)

      // Keep table order stable by patching the updated row in-place.
      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.id === row.id
            ? { ...currentRow, paymentStatus: nextStatus }
            : currentRow,
        ),
      )

      toast.success(`Purchase #${row.id} marked as ${nextStatus}`)
      setStatusTarget(null)
    } catch (apiError) {
      const message = getApiMessage(apiError, 'Failed to update payment status')
      setError(message)
      toast.error(message)
      setStatusTarget(null)
    } finally {
      setStatusUpdating(false)
      setUpdatingStatusId(null)
    }
  }

  function toggleSort(field) {
    setPage(1)
    setSort((current) => {
      if (current.field === field) {
        return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      }

      return { field, direction: 'desc' }
    })
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-700">Purchase Orders</h2>
          <p className="text-xs text-slate-500">Track vendor purchases, payment status, and order value trends.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          {vendor && (
            <span className="mr-2">
              <span className="font-semibold text-slate-700">Vendor:</span> {vendor}
            </span>
          )}
          <span className="mr-2 font-semibold text-slate-700">Total: {meta.total}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
            Filters
          </Button>
        </div>
      </header>

      {loading && <PageLoader text="Loading purchase orders..." />}
      {error && <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <section className="border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Purchase ID:</span> {purchaseId || 'Any'}
        <span className="ml-4 font-semibold text-slate-700">Payment:</span> {filters.paymentStatus || 'Any'}
        <span className="ml-4 font-semibold text-slate-700">Total:</span> {meta.total}
      </section>

      {canCreate && (
        <section className="flex justify-end">
          <Button render={<Link to="/purchases/new" />} type="button" size="sm" className="bg-green-700 text-white hover:bg-green-800">
            Record New Purchase
          </Button>
        </section>
      )}

      {!loading && !error && (
        <section className="border border-slate-300 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Purchase ID</th>
                  <th>Vendor</th>
                  <th>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort('purchaseDate')}
                    >
                      <span>Purchase Date</span>
                      <SortIcon active={sort.field === 'purchaseDate'} direction={sort.direction} />
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort('totalAmount')}
                    >
                      <span>Total Amount</span>
                      <SortIcon active={sort.field === 'totalAmount'} direction={sort.direction} />
                    </button>
                  </th>
                  <th>Payment Status</th>
                  <th>Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-500">No purchases found</td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td>{row.vendor?.name || '-'}</td>
                    <td>{formatDate(row.purchaseDate)}</td>
                    <td>{formatAmount(row.totalAmount)}</td>
                    <td className={row.paymentStatus === 'pending' ? 'text-amber-700' : 'text-green-700'}>
                      {row.paymentStatus || '-'}
                    </td>
                    <td>{row.items?.length || 0}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button render={<Link to={`/purchases/${row.id}`} />} variant="outline" size="sm">
                          View
                        </Button>
                        {canUpdate && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-w-30"
                            disabled={updatingStatusId === row.id}
                            onClick={() => setStatusTarget(row)}
                          >
                            {updatingStatusId === row.id
                              ? 'Updating...'
                              : row.paymentStatus === 'paid'
                                ? 'Mark Pending'
                                : 'Mark Paid'}
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700"
                            onClick={() => setDeleteTarget(row)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="mt-3 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGoPrev}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-600">Page {page} of {meta.totalPages}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGoNext}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </footer>
        </section>
      )}

      <PurchaseFilterDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        onApply={(nextFilters) => {
          updateFilterQuery(nextFilters)
        }}
        onReset={() => {
          updateFilterQuery({
            purchaseId: '',
            vendor: '',
            productName: '',
            paymentStatus: '',
            startDate: '',
            endDate: '',
            minAmount: '',
            maxAmount: '',
          })
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete Purchase"
        description={
          deleteTarget
            ? `Delete purchase #${deleteTarget.id}? Inventory will be rolled back.`
            : 'Delete this purchase?'
        }
        confirmText="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null)
        }}
        title="Update Payment Status"
        description={
          statusTarget
            ? `Change purchase #${statusTarget.id} to ${statusTarget.paymentStatus === 'paid' ? 'pending' : 'paid'}?`
            : 'Update payment status?'
        }
        helperText="This updates the payment state for this purchase order."
        confirmText={statusTarget?.paymentStatus === 'paid' ? 'Mark Pending' : 'Mark Paid'}
        loading={statusUpdating}
        onConfirm={handleStatusConfirm}
      />
    </section>
  )
}
