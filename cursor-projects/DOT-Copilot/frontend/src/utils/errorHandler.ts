import { AxiosError } from 'axios';

export interface ApiError {
  error: string;
  code?: string;
  details?: Array<{ field: string; message: string }>;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;
    
    if (apiError?.error) {
      return apiError.error;
    }

    if (error.response?.status === 401) {
      return 'Unauthorized. Please log in again.';
    }

    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (error.response?.status === 404) {
      return 'Resource not found.';
    }

    if (error.response?.status === 409) {
      return 'A record with this value already exists.';
    }

    if (error.response?.status === 429) {
      return 'Too many requests. Please try again later.';
    }

    if (error.response?.status && error.response.status >= 500) {
      return 'Server error. Please try again later.';
    }

    return error.message || 'An unexpected error occurred.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

export function getValidationErrors(error: unknown): Record<string, string> {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;
    
    if (apiError?.details && Array.isArray(apiError.details)) {
      const errors: Record<string, string> = {};
      apiError.details.forEach((detail) => {
        errors[detail.field] = detail.message;
      });
      return errors;
    }
  }

  return {};
}

