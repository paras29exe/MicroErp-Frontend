import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select option',
  searchPlaceholder = 'Search',
  emptyText = 'No options found',
  loading = false,
  loadingText = 'Loading options...',
  onSearchChange,
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef(null)

  const selected = useMemo(
    () => options.find((option) => String(option.value) === String(value)),
    [options, value],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter((option) => option.label.toLowerCase().includes(q))
  }, [options, search])

  useEffect(() => {
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between rounded-sm border-slate-300 px-2 py-1 text-xs"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate text-left">{selected?.label || placeholder}</span>
        <span className="text-slate-400">v</span>
      </Button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-sm border border-slate-300 bg-white p-2 shadow-lg">
          <input
            type="text"
            value={search}
            onChange={(event) => {
              const next = event.target.value
              setSearch(next)
              onSearchChange?.(next)
            }}
            placeholder={searchPlaceholder}
            className="mb-2 w-full rounded-sm border border-slate-300 px-2 py-1 text-xs"
          />

          <div className="max-h-56 overflow-auto">
            {loading && (
              <div className="flex items-center gap-2 px-1 py-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{loadingText}</span>
              </div>
            )}
            {!loading && filtered.length === 0 && <p className="px-1 py-1 text-xs text-slate-500">{emptyText}</p>}
            {filtered.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                className={[
                  'mb-1 block w-full rounded-sm px-2 py-1 text-left text-xs',
                  String(option.value) === String(value)
                    ? 'bg-blue-100 text-blue-800'
                    : 'hover:bg-slate-100',
                ].join(' ')}
                onClick={() => {
                  onValueChange(option.value)
                  setOpen(false)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
