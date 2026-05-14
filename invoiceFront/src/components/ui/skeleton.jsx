import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------
 * Skeleton — content placeholder used during loading states (Prompt 19).
 *
 * Usage:
 *   <Skeleton className="h-4 w-32" />
 *   <SkeletonRow count={5} />
 * --------------------------------------------------------------------- */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/60',
        className,
      )}
      aria-hidden
      {...props}
    />
  )
}

/** Convenience: a row of skeleton lines. */
export function SkeletonRows({ count = 3, className }) {
  return (
    <div className={cn('space-y-2', className)} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}
