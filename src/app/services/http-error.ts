import { HttpErrorResponse } from '@angular/common/http';

export function toError(error: unknown, fallback: string): Error {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error === 'string' && error.error.trim()) {
      return new Error(error.error.trim());
    }

    if (error.error && typeof error.error === 'object') {
      const message = (error.error['error'] ?? error.error['message']);
      if (typeof message === 'string' && message.trim()) {
        return new Error(message.trim());
      }
    }

    if (error.message) {
      return new Error(error.message);
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallback);
}
