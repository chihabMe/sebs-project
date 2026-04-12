import { QueryClient } from '@tanstack/react-query';
import { handleApiError } from './errorHandler';

// Configure React Query with global error handling
export const configureQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) => {
          // Don't retry on 400/401/403/404 errors as they're unlikely to succeed
          const status = error?.response?.status;
          if (status === 400 || status === 401 || status === 403 || status === 404) {
            return false;
          }
          
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
      mutations: {
        retry: (failureCount, error: any) => {
          // Don't retry on client errors
          const status = error?.response?.status;
          if (status && status >= 400 && status < 500) {
            return false;
          }
          
          // Retry up to 2 times for server errors
          return failureCount < 2;
        },
      },
    },
  });
};

// Global error handler for React Query
export const onQueryError = (error: unknown) => {
  const apiError = handleApiError(error);
  
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Query error:', apiError);
  }
  
  // In production, you might want to send this to an error reporting service
  // Example: Sentry.captureException(error);
  
  // You could also show a toast notification here
  // toast.error(apiError.message);
};