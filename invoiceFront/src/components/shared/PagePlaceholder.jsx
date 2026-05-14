import { Card, CardContent } from '@/components/ui/card'
import { Construction } from 'lucide-react'

/**
 * Generic deferred-implementation placeholder.
 * Used by NotFound and any future stub routes.
 */
export function PagePlaceholder({ title, promptRefs = [] }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <Construction className="h-10 w-10 text-muted-foreground" aria-hidden />
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Trang này sẽ được hoàn thiện trong bước tiếp theo. Khung điều hướng,
          theme và shared components đã sẵn sàng để build lên.
        </p>
        {promptRefs.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Tham chiếu spec: {promptRefs.join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
