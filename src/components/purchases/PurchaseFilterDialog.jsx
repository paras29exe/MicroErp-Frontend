import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'

const DEFAULT_FILTERS = {
  purchaseId: '',
  vendor: '',
  productName: '',
  paymentStatus: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
}

export function PurchaseFilterDialog({ open, onOpenChange, value, onApply, onReset }) {
  const [draft, setDraft] = useState(DEFAULT_FILTERS)

  useEffect(() => {
    if (!open) return
    setDraft({ ...DEFAULT_FILTERS, ...value })
  }, [open, value])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Advanced Purchase Filters</DialogTitle>
          <DialogDescription>Apply detailed backend filters for purchase orders list.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              min="1"
              value={draft.purchaseId}
              onChange={(event) => setDraft((prev) => ({ ...prev, purchaseId: event.target.value }))}
              placeholder="Purchase ID"
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
            />
            <input
              type="text"
              value={draft.vendor}
              onChange={(event) => setDraft((prev) => ({ ...prev, vendor: event.target.value }))}
              placeholder="Vendor (name or phone)"
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
            />
            <input
              type="text"
              value={draft.productName}
              onChange={(event) => setDraft((prev) => ({ ...prev, productName: event.target.value }))}
              placeholder="Product name"
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs"
            />
            <Select
              value={draft.paymentStatus}
              onChange={(event) => setDraft((prev) => ({ ...prev, paymentStatus: event.target.value }))}
            >
              <option value="">Payment Status (Any)</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </Select>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Amount Min</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.minAmount}
                onChange={(event) => setDraft((prev) => ({ ...prev, minAmount: event.target.value }))}
                placeholder="0.00"
                className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Amount Max</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.maxAmount}
                onChange={(event) => setDraft((prev) => ({ ...prev, maxAmount: event.target.value }))}
                placeholder="0.00"
                className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
              />
            </div>
            <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Range From</label>
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(event) => setDraft((prev) => ({ ...prev, startDate: event.target.value }))}
                  className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Range To</label>
                <input
                  type="date"
                  value={draft.endDate}
                  onChange={(event) => setDraft((prev) => ({ ...prev, endDate: event.target.value }))}
                  className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
                />
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(DEFAULT_FILTERS)
              onReset?.()
            }}
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply?.(draft)
              onOpenChange?.(false)
            }}
            className="bg-green-700 text-white hover:bg-green-800"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
