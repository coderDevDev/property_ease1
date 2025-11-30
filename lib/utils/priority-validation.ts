/**
 * Priority-Based Date Validation Utility
 *
 * Validates scheduled dates for maintenance requests based on priority level.
 * Ensures dates don't exceed the allowed timeframe for each priority.
 *
 * Priority Deadlines:
 * - Low: 7 days (1 week)
 * - Medium: 5 days
 * - High: 3 days
 * - Urgent: 1 day (24 hours)
 */

// Priority configuration (in days)
const PRIORITY_DAYS = {
  low: 7,
  medium: 5,
  high: 3,
  urgent: 1
} as const;

type PriorityLevel = keyof typeof PRIORITY_DAYS;

/**
 * Get the number of days allowed for a priority level
 * @param priority - Priority level (low, medium, high, urgent)
 * @returns Number of days allowed (default: 7 for unknown priorities)
 */
export function getPriorityDays(priority: string): number {
  return PRIORITY_DAYS[priority as PriorityLevel] || 7;
}

/**
 * Calculate the deadline date for a given priority
 * @param priority - Priority level
 * @returns Deadline date (end of day)
 */
export function calculateDeadline(priority: string): Date {
  const days = getPriorityDays(priority);
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  deadline.setHours(23, 59, 59, 999);
  return deadline;
}

/**
 * Validate if a scheduled date is within the allowed range for a priority
 * @param priority - Priority level
 * @param scheduledDate - Date to validate (string or Date)
 * @returns true if valid, false if invalid
 */
export function isValidScheduledDate(
  priority: string,
  scheduledDate: string | Date | null | undefined
): boolean {
  if (!scheduledDate) return false;

  try {
    const date = new Date(scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Date must be today or later (not in the past)
    if (date < today) return false;

    // Date must not exceed the priority deadline
    const maxDays = getPriorityDays(priority);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + maxDays);
    maxDate.setHours(23, 59, 59, 999);

    return date <= maxDate;
  } catch (error) {
    console.error('Date validation error:', error);
    return false;
  }
}

/**
 * Get a detailed validation error message
 * @param priority - Priority level
 * @param scheduledDate - Date that was invalid
 * @returns Error message string or null if valid
 */
export function getDateValidationError(
  priority: string,
  scheduledDate: string | Date | null | undefined
): string | null {
  if (!scheduledDate) {
    return 'Scheduled date is required';
  }

  try {
    const date = new Date(scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if date is in the past
    if (date < today) {
      return 'Scheduled date cannot be in the past';
    }

    // Check if date exceeds priority deadline
    if (!isValidScheduledDate(priority, scheduledDate)) {
      const maxDays = getPriorityDays(priority);
      const deadline = calculateDeadline(priority);
      const formattedDeadline = deadline.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const dayLabel = maxDays === 1 ? 'day' : 'days';
      return `Scheduled date must be within ${maxDays} ${dayLabel} from today. Deadline: ${formattedDeadline}`;
    }

    return null;
  } catch (error) {
    console.error('Error message generation error:', error);
    return 'Invalid date format';
  }
}

/**
 * Format a deadline date for display
 * @param priority - Priority level
 * @returns Formatted deadline string (e.g., "Friday, Dec 1, 2025")
 */
export function formatDeadline(priority: string): string {
  try {
    const deadline = calculateDeadline(priority);
    return deadline.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Deadline formatting error:', error);
    return 'Invalid deadline';
  }
}

/**
 * Get the minimum date (today) in ISO format for date input
 * @returns Today's date in YYYY-MM-DD format
 */
export function getMinDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the maximum date (deadline) in ISO format for date input
 * @param priority - Priority level
 * @returns Deadline date in YYYY-MM-DD format
 */
export function getMaxDateString(priority: string): string {
  return calculateDeadline(priority).toISOString().split('T')[0];
}

/**
 * Get deadline info for display (e.g., "3 days" or "1 day")
 * @param priority - Priority level
 * @returns Formatted deadline info (e.g., "3 days", "within 24 hours")
 */
export function getDeadlineInfo(priority: string): string {
  const days = getPriorityDays(priority);

  if (days === 1) {
    return 'within 24 hours';
  }

  const dayLabel = days === 1 ? 'day' : 'days';
  return `within ${days} ${dayLabel}`;
}
