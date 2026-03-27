import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Confirm Action',
  description = 'Are you sure you want to continue?',
  helperText = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {helperText ? <DialogBody className="pt-2 text-xs text-slate-500">{helperText}</DialogBody> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={destructive ? 'bg-red-600 text-white hover:bg-red-700' : ''}
          >
            {loading ? 'Please wait...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
