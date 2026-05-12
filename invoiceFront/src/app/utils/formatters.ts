/**
 * Format a number as Vietnamese Dong currency
 * @param value - Number or string to format
 * @returns Formatted string like "2.450.000.000 đ"
 */
export function formatVND(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '')) : value;
  
  if (isNaN(numValue)) return '—';
  
  return numValue.toLocaleString('vi-VN') + ' đ';
}

/**
 * Truncate text with ellipsis and return both truncated text and full text for tooltip
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Object with truncated text and isTruncated flag
 */
export function truncateText(text: string | null | undefined, maxLength: number = 30): { text: string; isTruncated: boolean; fullText: string } {
  if (!text) return { text: '—', isTruncated: false, fullText: '' };
  
  if (text.length <= maxLength) {
    return { text, isTruncated: false, fullText: text };
  }
  
  return {
    text: text.substring(0, maxLength) + '...',
    isTruncated: true,
    fullText: text
  };
}

/**
 * Return "—" for empty/null values
 */
export function emptyCell(value: any): string {
  if (value === null || value === undefined || value === '') return '—';
  return value;
}
