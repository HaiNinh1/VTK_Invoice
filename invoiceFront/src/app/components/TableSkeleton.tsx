export default function TableSkeleton({ rows = 8, columns = 12 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-[#E5E7EB] h-12">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-3 bg-[#F3F4F6] rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }}></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}