import { Loader2 } from 'lucide-react'

export function PageLoader({ text = 'Loading....' }) {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center rounded-sm border border-slate-300 bg-white">
      <div className="flex flex-col items-center gap-3 text-slate-700">
        <Loader2 className="h-12 w-12 animate-spin text-blue-700" />
        <p className="text-base font-semibold">{text}</p>
      </div>
    </div>
  )
}
