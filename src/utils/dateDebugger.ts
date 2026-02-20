
/**
 * Utility functions for date and time handling, especially for debugging purposes
 */

// Environment detection
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Logs detailed information about a date for debugging purposes
 * Only logs in development environment
 */
export const logDateDetails = (date: Date, label: string): void => {
  if (!isDevelopment) return;
  
  console.log(`---- ${label} ----`);
  console.log(`ISO string: ${date.toISOString()}`);
  console.log(`Local string: ${date.toString()}`);
  console.log(`UTC string: ${date.toUTCString()}`);
  console.log(`Timestamp: ${date.getTime()}`);
  console.log(`Timezone offset (minutes): ${date.getTimezoneOffset()}`);
  console.log('------------------------');
};

/**
 * Compares two dates and logs the difference for debugging
 * Only logs in development environment
 */
export const compareDates = (date1: Date, date2: Date, label1: string, label2: string): void => {
  if (!isDevelopment) return;
  
  console.log(`---- Date comparison: ${label1} vs ${label2} ----`);
  console.log(`${label1}: ${date1.toISOString()}, Timestamp: ${date1.getTime()}`);
  console.log(`${label2}: ${date2.toISOString()}, Timestamp: ${date2.getTime()}`);
  
  const diffMs = date1.getTime() - date2.getTime();
  const diffSecs = diffMs / 1000;
  const diffMins = diffSecs / 60;
  const diffHours = diffMins / 60;
  
  console.log(`Difference: ${diffMs}ms / ${diffSecs.toFixed(1)}s / ${diffMins.toFixed(1)}min / ${diffHours.toFixed(2)}h`);
  console.log(`${label1} is ${diffMs >= 0 ? 'after' : 'before'} ${label2}`);
  console.log('------------------------');
};

/**
 * Formats a date for database storage
 * Returns a properly formatted ISO string for PostgreSQL timestamp with time zone
 */
export const formatDateForDatabase = (date: Date): string => {
  // Always use ISO string format for PostgreSQL timestamp with time zone
  return date.toISOString();
};

/**
 * Determines if a scheduled time is due for execution
 * Includes a small buffer window (30 seconds) to account for processing time
 */
export const isTimeToExecute = (scheduledDate: Date): boolean => {
  const now = new Date();
  const bufferMs = 30 * 1000; // 30 seconds buffer
  
  // Compare timestamps directly for reliability
  const scheduledTimestamp = scheduledDate.getTime();
  const currentTimestamp = now.getTime();
  
  // Add buffer - if scheduled time is within 30 seconds of now or in the past
  const isDue = scheduledTimestamp <= (currentTimestamp + bufferMs);
  
  if (isDevelopment) {
    console.log(`Time to execute check: scheduled=${scheduledTimestamp}, current=${currentTimestamp}, buffer=${bufferMs}, isDue=${isDue}`);
  }
  
  return isDue;
};
