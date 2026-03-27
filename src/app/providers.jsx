import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

export function AppProviders({ children }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  )
}
