/**
 * Format number input with Vietnamese thousand separators (dots)
 * @param value - Raw number string
 * @returns Formatted string with dots (e.g., "2.450.000")
 */
export function formatNumberInput(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  if (!digits) return '';
  
  // Add dots as thousand separators
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Remove formatting from number input for calculations
 * @param value - Formatted string (e.g., "2.450.000")
 * @returns Raw number
 */
export function parseNumberInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  return parseInt(digits, 10) || 0;
}

/**
 * Calculate VAT amount
 * @param beforeVAT - Value before VAT
 * @param vatRate - VAT rate as percentage (e.g., 10 for 10%)
 * @returns VAT amount
 */
export function calculateVAT(beforeVAT: number, vatRate: number): number {
  return Math.round((beforeVAT * vatRate) / 100);
}

/**
 * Calculate total after VAT
 * @param beforeVAT - Value before VAT
 * @param vat - VAT amount
 * @returns Total after VAT
 */
export function calculateTotal(beforeVAT: number, vat: number): number {
  return beforeVAT + vat;
}

/**
 * Get today's date in dd/mm/yyyy format
 */
export function getTodayString(): string {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${yyyy}-${mm}-${dd}`; // HTML date input format
}

/**
 * Get date string for max future date restriction
 */
export function getMaxDateString(): string {
  return getTodayString(); // Today is max for past-only dates
}

/**
 * Get date string for min future date restriction (tomorrow)
 */
export function getMinFutureDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const yyyy = tomorrow.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Scroll to element smoothly and shake it
 * @param elementId - ID of element to scroll to
 */
export function scrollToError(elementId: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('shake-animation');
    setTimeout(() => {
      element.classList.remove('shake-animation');
    }, 300);
  }
}

/**
 * Calculate checklist completion percentage
 * @param completed - Number of completed items
 * @param total - Total number of items
 * @returns Percentage (0-100)
 */
export function calculateChecklistProgress(groups: Array<{ completed: number; total: number }>): number {
  const totalCompleted = groups.reduce((sum, group) => sum + group.completed, 0);
  const totalItems = groups.reduce((sum, group) => sum + group.total, 0);
  
  if (totalItems === 0) return 0;
  return Math.round((totalCompleted / totalItems) * 100);
}

/**
 * Check if any checklist items have commitment status
 * @param groups - Checklist groups
 * @returns True if any item has commitment
 */
export function hasCommitmentItems(groups: any[]): boolean {
  return groups.some(group => 
    group.items.some((item: any) => item.status === 'committed')
  );
}
