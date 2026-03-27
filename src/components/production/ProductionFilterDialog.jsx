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

const DEFAULT_FILTERS = {
  search: '',
  startDate: '',
  endDate: '',
  minQty: '',
  maxQty: '',
}

export function ProductionFilterDialog({ open, onOpenChange, value, onApply, onReset }) {
  const [draft, setDraft] = useState(DEFAULT_FILTERS)

  useEffect(() => {
    if (!open) return
    setDraft({ ...DEFAULT_FILTERS, ...value })
  }, [open, value])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Production Filters</DialogTitle>
          <DialogDescription>Filter production register by id, product, date, and quantity.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={draft.search}
              onChange={(event) => setDraft((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Production ID or product"
              className="rounded-sm border border-slate-300 px-2 py-1 text-xs md:col-span-2"
            />

            <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Min Qty</label>
                <input
                  type="number"
                  min="0"
                  value={draft.minQty}
                  onChange={(event) => setDraft((prev) => ({ ...prev, minQty: event.target.value }))}
                  placeholder="0"
                  className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Max Qty</label>
                <input
                  type="number"
                  min="0"
                  value={draft.maxQty}
                  onChange={(event) => setDraft((prev) => ({ ...prev, maxQty: event.target.value }))}
                  placeholder="0"
                  className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
                />
              </div>
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
            className="bg-green-700 text-white hover:bg-green-800"
            onClick={() => {
              onApply?.(draft)
              onOpenChange?.(false)
            }}
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
