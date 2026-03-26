import * as React from "react"

import { cn } from "@/lib/utils"

function Select({ className, children, ...props }) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-8 min-w-0 rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export { Select }
