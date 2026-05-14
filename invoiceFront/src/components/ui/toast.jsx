import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------
 * Lightweight toast system. No portal, no Radix — just a fixed-position
 * stack rendered at the top of <body> by the provider.
 *
 * Usage:
 *   const { toast } = useToast()
 *   toast.success('Đã lưu')
 *   toast.error('Có lỗi xảy ra')
 *   toast({ title: 'Thông báo', description: '...', variant: 'info' })
 * --------------------------------------------------------------------- */

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
}

const TONE_CLASSES = {
  success: 'border-green-200 bg-green-50 text-green-900 [&_svg]:text-green-600',
  error:   'border-red-200 bg-red-50 text-red-900 [&_svg]:text-red-600',
  info:    'border-blue-200 bg-blue-50 text-blue-900 [&_svg]:text-blue-600',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 [&_svg]:text-amber-600',
}

let _id = 0
const nextId = () => ++_id

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
    const tm = timers.current.get(id)
    if (tm) { clearTimeout(tm); timers.current.delete(id) }
  }, [])

  const show = useCallback((opts) => {
    const t = typeof opts === 'string' ? { description: opts } : opts ?? {}
    const id = nextId()
    const item = {
      id,
      title: t.title ?? null,
      description: t.description ?? '',
      variant: t.variant ?? 'info',
      duration: t.duration ?? 3500,
    }
    setToasts(prev => [...prev, item])
    if (item.duration > 0) {
      const handle = setTimeout(() => dismiss(id), item.duration)
      timers.current.set(id, handle)
    }
    return id
  }, [dismiss])

  // helper shortcuts attached to the show() callable
  const toast = Object.assign(show, {
    success: (msg, opts) => show({ ...(opts || {}), description: msg, variant: 'success' }),
    error:   (msg, opts) => show({ ...(opts || {}), description: msg, variant: 'error'   }),
    info:    (msg, opts) => show({ ...(opts || {}), description: msg, variant: 'info'    }),
    warning: (msg, opts) => show({ ...(opts || {}), description: msg, variant: 'warning' }),
    dismiss,
  })

  useEffect(() => () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
      >
        {toasts.map(t => {
          const Icon = ICONS[t.variant] || Info
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ring-1 ring-black/5',
                'animate-in fade-in slide-in-from-bottom-2',
                TONE_CLASSES[t.variant] || TONE_CLASSES.info,
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                {t.title && <div className="text-sm font-semibold">{t.title}</div>}
                {t.description && (
                  <div className={cn('text-sm', t.title && 'mt-0.5 opacity-90')}>
                    {t.description}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="ml-1 rounded p-1 text-current/60 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-current/30"
                aria-label="Đóng thông báo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
