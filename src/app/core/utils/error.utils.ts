import { HttpErrorResponse } from '@angular/common/http';

export function getErrorMessage(error: any, defaultMessage: string = 'An unexpected error occurred'): string {
  if (!error) return defaultMessage;

  // 1. Check for specific backend error structure (e.g., { message: "..." })
  if (error.error && typeof error.error === 'object' && error.error.message) {
    return error.error.message;
  }

  // 2. Check for simple error string from backend
  if (typeof error.error === 'string') {
    return error.error;
  }

  // 3. Check for standard Error object message
  if (error.message) {
    return error.message;
  }

  // 4. Check for status text (e.g., "Not Found")
  if (error instanceof HttpErrorResponse) {
    return `Error ${error.status}: ${error.statusText || defaultMessage}`;
  }

  return defaultMessage;
}
