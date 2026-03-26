import { TooltipProvider } from '@/components/ui/tooltip'

export function AppProviders({ children }) {
  return <TooltipProvider>{children}</TooltipProvider>
}
