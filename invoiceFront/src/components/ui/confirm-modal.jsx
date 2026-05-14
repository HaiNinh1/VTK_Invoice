import { useState, useCallback } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/**
 * ConfirmModal — controlled confirmation dialog.
 *
 * Props:
 *   open, onOpenChange, title, description,
 *   confirmLabel='Xác nhận', cancelLabel='Huỷ',
 *   confirmVariant='default' | 'destructive', onConfirm()
 */
export function ConfirmModal({
  open,
  onOpenChange,
  title = 'Xác nhận',
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  confirmVariant = 'default',
  onConfirm,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={() => { onConfirm?.(); onOpenChange?.(false) }}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook helper for imperative use.
 *   const { confirm, modal } = useConfirm()
 *   ...
 *   <button onClick={() => confirm({ title, description }, () => doIt())}>...
 *   {modal}
 */
export function useConfirm() {
  const [state, setState] = useState({ open: false })
  const confirm = useCallback((opts, onConfirm) => {
    setState({ ...opts, onConfirm, open: true })
  }, [])
  const modal = (
    <ConfirmModal
      {...state}
      onOpenChange={(o) => setState(s => ({ ...s, open: o }))}
    />
  )
  return { confirm, modal }
}
