// Centralized error handler for frontend applications
import { AxiosError } from 'axios';

export interface ApiError {
  success: boolean;
  message: string;
  errorId?: string;
  code?: string;
  details?: any;
}

export class FrontendError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FrontendError';
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const response = error.response?.data;
    
    // If the API returns our standardized error format
    if (response && typeof response === 'object') {
      if ('success' in response) {
        return {
          success: false,
          message: response.message || 'An error occurred',
          errorId: response.errorId,
          code: response.code,
          details: response.details
        };
      }
      
      // Handle default NestJS error format
      if ('message' in response && typeof response.message === 'string') {
        return {
          success: false,
          message: response.message,
          code: response.error || 'ERROR'
        };
      } else if ('message' in response && Array.isArray(response.message)) {
        return {
          success: false,
          message: response.message[0] || 'An error occurred',
          code: response.error || 'VALIDATION_ERROR',
          details: response.message
        };
      }
    }
    
    // Handle network errors
    if (!error.response) {
      return {
        success: false,
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR'
      };
    }
    
    // Handle HTTP status codes
    switch (error.response.status) {
      case 400:
        return {
          success: false,
          message: 'Invalid request data',
          code: 'BAD_REQUEST'
        };
      case 401:
        return {
          success: false,
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        };
      case 403:
        return {
          success: false,
          message: 'Access denied',
          code: 'FORBIDDEN'
        };
      case 404:
        return {
          success: false,
          message: 'Resource not found',
          code: 'NOT_FOUND'
        };
      case 500:
        return {
          success: false,
          message: 'Server error - please try again later',
          code: 'SERVER_ERROR'
        };
      default:
        return {
          success: false,
          message: `Request failed with status ${error.response.status}`,
          code: 'HTTP_ERROR'
        };
    }
  }
  
  // Handle generic JavaScript errors
  if (error instanceof Error) {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    };
  }
  
  // Handle everything else
  return {
    success: false,
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  };
};

export const getErrorMessage = (error: unknown): string => {
  const apiError = handleApiError(error);
  return apiError.message;
};