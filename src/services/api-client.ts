/**
 * API Client Service
 *
 * Fetch API wrapper with interceptors, token management, and error handling
 * Similar to Axios interceptor pattern but using native fetch
 */

import { useLoadingBarStore } from '@/stores/loading-bar.store';
import { useUserStore } from '@/stores/user.store';
import { useEventStore } from '@/stores/event.store';
import { config } from '@/core/config';

// --- Types ---

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

export interface FetchOptions extends Omit<RequestInit, 'body'> {
  skipAuth?: boolean;
  body?: unknown;
}

interface RetryConfig {
  endpoint: string;
  options?: FetchOptions;
}

// --- Store Actions (outside React components) ---

const { incrementRequests, decrementRequests } = useLoadingBarStore.getState();

// --- Request Interceptor Logic ---

const buildHeaders = (options?: FetchOptions): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Language': 'en',
    ...(options?.headers as Record<string, string>),
  };

  return headers;
};

const buildUrl = (endpoint: string): string => {
  const baseUrl = config.api.url;
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// --- Response Interceptor Logic ---

const handleSuccessResponse = (response: Response): Response => {
  return response;
};

const handleErrorResponse = async (
  response: Response,
  endpoint: string
): Promise<ApiError> => {
  const eventStore = useEventStore.getState();
  let errorData: unknown;

  try {
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText };
  }

  const error: ApiError = {
    message: (errorData as { message?: string })?.message || 'An error occurred',
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

  return error;
};

// --- Token Refresh Logic ---

const refreshToken = async (): Promise<{ token: string; refresh_token: string } | null> => {
  const userStore = useUserStore.getState();
  const currentRefreshToken = userStore.refreshToken;

  if (!currentRefreshToken) return null;

  try {
    const response = await fetch(buildUrl('token/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ refresh_token: currentRefreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.data;
  } catch {
    return null;
  }
};

const handleTokenRefresh = async (
  retryConfig: RetryConfig
): Promise<Response> => {
  const userStore = useUserStore.getState();
  const tokens = await refreshToken();

  if (!tokens?.token) {
    userStore.clearUser();
    throw { message: 'Session expired. Please login again.', status: 401 } as ApiError;
  }

  // Update tokens in store
  userStore.setTokens(tokens.token, tokens.refresh_token);

  // Retry original request with new token
  return makeRequest(retryConfig.endpoint, {
    ...retryConfig.options,
    headers: {
      ...retryConfig.options?.headers,
      Authorization: `Bearer ${tokens.token}`,
    },
  });
};

// --- Core Request Function ---

const makeRequest = async (
  endpoint: string,
  options?: FetchOptions
): Promise<Response> => {
  incrementRequests();

  try {
    const url = buildUrl(endpoint);
    const headers = buildHeaders(options);
    const body = options?.body ? JSON.stringify(options.body) : undefined;

    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    // Handle 401 with "Expired JWT Token" message
    if (response.status === 401) {
      const clonedResponse = response.clone();
      let errorData: { message?: string } = {};

      try {
        errorData = await clonedResponse.json();
      } catch {
        // Ignore parse error
      }

      if (errorData.message === 'Expired JWT Token') {
        decrementRequests();
        return handleTokenRefresh({ endpoint, options });
      }

      // For other 401 errors, clear user session
      useUserStore.getState().clearUser();
    }

    decrementRequests();

    if (!response.ok) {
      const error = await handleErrorResponse(response, endpoint);
      throw error;
    }

    return handleSuccessResponse(response);
  } catch (error) {
    decrementRequests();
    throw error;
  }
};

// --- API Client Class ---

class ApiClient {
  async get(endpoint: string, options?: FetchOptions): Promise<Response> {
    return makeRequest(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, body?: unknown, options?: FetchOptions): Promise<Response> {
    return makeRequest(endpoint, { ...options, method: 'POST', body });
  }

  async put(endpoint: string, body?: unknown, options?: FetchOptions): Promise<Response> {
    return makeRequest(endpoint, { ...options, method: 'PUT', body });
  }

  async patch(endpoint: string, body?: unknown, options?: FetchOptions): Promise<Response> {
    return makeRequest(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete(endpoint: string, options?: FetchOptions): Promise<Response> {
    return makeRequest(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
