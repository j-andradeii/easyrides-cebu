/**
 * API Client Service
 *
 * Fetch API wrapper with interceptors, token management, and error handling
 * Emits events for API calls that can be subscribed to by components
 */

import { useEventStore } from '@/stores/event.store';
import { useUserStore } from '@/stores/user.store';

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || '') {
    this.baseURL = baseURL;
  }

  /**
   * Request interceptor - adds auth token and headers
   */
  private async buildRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Request> {
    const url = `${this.baseURL}${endpoint}`;
    const token = useUserStore.getState().token;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new Request(url, {
      ...options,
      headers,
    });
  }

  /**
   * Response interceptor - handles response and emits events
   */
  private async handleResponse<T>(
    response: Response,
    endpoint: string
  ): Promise<ApiResponse<T>> {
    const eventStore = useEventStore.getState();

    // Handle successful response
    if (response.ok) {
      const data = await response.json();

      // Emit success event
      eventStore.emit({
        type: 'API_SUCCESS',
        status: 'success',
        message: `Request to ${endpoint} successful`,
        metadata: { endpoint, status: response.status },
      });

      return {
        data,
        status: response.status,
        statusText: response.statusText,
      };
    }

    // Handle error response
    const error = await this.handleError(response, endpoint);
    throw error;
  }

  /**
   * Error handler - processes errors and emits error events
   */
  private async handleError(
    response: Response,
    endpoint: string
  ): Promise<ApiError> {
    const eventStore = useEventStore.getState();
    let errorData: unknown;

    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const error: ApiError = {
      message:
        (errorData as { message?: string })?.message ||
        'An error occurred',
      status: response.status,
      statusText: response.statusText,
      errors: (errorData as { errors?: Record<string, string[]> })?.errors,
    };

    // Emit error event
    eventStore.emit({
      type: 'API_ERROR',
      status: 'error',
      message: error.message,
      metadata: {
        endpoint,
        status: response.status,
        errors: error.errors,
      },
    });

    // Handle 401 Unauthorized - clear user session
    if (response.status === 401) {
      useUserStore.getState().clearUser();
    }

    return error;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const request = await this.buildRequest(endpoint, {
      ...options,
      method: 'GET',
    });

    const response = await fetch(request);
    return this.handleResponse<T>(response, endpoint);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const request = await this.buildRequest(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });

    const response = await fetch(request);
    return this.handleResponse<T>(response, endpoint);
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const request = await this.buildRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });

    const response = await fetch(request);
    return this.handleResponse<T>(response, endpoint);
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const request = await this.buildRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });

    const response = await fetch(request);
    return this.handleResponse<T>(response, endpoint);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const request = await this.buildRequest(endpoint, {
      ...options,
      method: 'DELETE',
    });

    const response = await fetch(request);
    return this.handleResponse<T>(response, endpoint);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
