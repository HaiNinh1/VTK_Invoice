import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * STATUS_STYLE — single source of truth for invoice-request status colors.
 * Spec: Prompt 3 §STYLING + Prompt 10 §4.
 *   Nháp (gray) • Chờ duyệt (amber) • Đã duyệt (blue) •
 *   Đã xuất HĐ (green) • Từ chối (red) • Trả lại bổ sung (orange dashed)
 */
const STATUS_STYLE = {
  Nháp:                 'bg-muted text-muted-foreground border-transparent',
  'Chờ duyệt':          'bg-amber-100 text-amber-800 border-transparent',
  'Đã duyệt':           'bg-blue-100 text-blue-800 border-transparent',
  'Đã xuất HĐ':         'bg-green-100 text-green-800 border-transparent',
  'Từ chối':            'bg-red-100 text-red-800 border-transparent',
  'Trả lại bổ sung':    'bg-orange-50 text-orange-800 border border-dashed border-orange-400',

  // Contract statuses
  'Đang thực hiện':     'bg-blue-100 text-blue-800 border-transparent',
  'Đã quyết toán':      'bg-green-100 text-green-800 border-transparent',
  'Đã thanh lý':        'bg-muted text-muted-foreground border-transparent',

  // S-Invoice statuses
  'Chờ xuất':           'bg-muted text-muted-foreground border-transparent',
  'Đang xử lý':         'bg-amber-100 text-amber-800 border-transparent',
  'Thành công':         'bg-green-100 text-green-800 border-transparent',
  'Lỗi':                'bg-red-100 text-red-800 border-transparent',
}

export function StatusBadge({ status, className }) {
  const style = STATUS_STYLE[status] ?? 'bg-muted text-muted-foreground'
  return (
    <Badge
      variant="outline"
      className={cn(style, 'rounded-full px-2.5 py-0.5 text-xs font-medium', className)}
    >
      {status}
    </Badge>
  )
}
