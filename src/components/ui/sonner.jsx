import { Toaster as Sonner } from 'sonner'

export function Toaster(props) {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'text-sm',
        },
      }}
      {...props}
    />
  )
}
