/**
 * formatVND — format a number as Vietnamese Dong with dot separators.
 *   formatVND(2450000000)       → "2.450.000.000 đ"
 *   formatVND(2450000000, true) → "2,45 tỷ đ"   (compact, for tight UI)
 * Spec: Prompt 10 §5.
 */
export function formatVND(value, compact = false) {
  if (value == null || Number.isNaN(value)) return '—'
  if (compact) {
    if (value >= 1_000_000_000)
      return `${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ đ`
    if (value >= 1_000_000)
      return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr đ`
  }
  return `${Math.round(value).toLocaleString('vi-VN')} đ`
}

/** formatDate — DD/MM/YYYY for Vietnamese audience. */
export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

/** initials — first letter of first and last word, uppercase. "Nguyễn Văn A" → "NA" */
export function initials(name = '') {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
