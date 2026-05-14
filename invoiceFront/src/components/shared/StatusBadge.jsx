import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * STATUS_STYLE — single source of truth for status pill colors.
 * Refined: soft tinted bg + matching border hairline + saturated text.
 */
const STATUS_STYLE = {
  // Invoice request
  'Nháp':              'bg-muted/70 text-muted-foreground border-border',
  'Chờ duyệt':         'bg-amber-50 text-amber-900 border-amber-200',
  'Đã duyệt':          'bg-blue-50 text-blue-800 border-blue-200',
  'Đã xuất HĐ':        'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Từ chối':           'bg-red-50 text-red-800 border-red-200',
  'Trả lại bổ sung':   'bg-orange-50 text-orange-900 border-dashed border-orange-400',

  // Contract
  'Đang thực hiện':    'bg-blue-50 text-blue-800 border-blue-200',
  'Đã quyết toán':     'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Đã thanh lý':       'bg-muted/70 text-muted-foreground border-border',

  // S-Invoice
  'Chờ xuất':          'bg-muted/70 text-muted-foreground border-border',
  'Đang xử lý':        'bg-amber-50 text-amber-900 border-amber-200',
  'Thành công':        'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Lỗi':               'bg-red-50 text-red-800 border-red-200',
}

export function StatusBadge({ status, className }) {
  const style = STATUS_STYLE[status] ?? 'bg-muted text-muted-foreground border-border'
  return (
    <Badge
      variant="outline"
      className={cn(
        style,
        'rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase',
        className,
      )}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60 mr-1.5" aria-hidden />
      {status}
    </Badge>
  )
}
