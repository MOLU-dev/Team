// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Error handling
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

// Helper function to handle API responses
export async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    if (response.status === 401 && !response.url?.includes('/wallet/approve')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        // Notify AuthProvider so it can update state in one place
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
    }
    if (isJson) {
      const errorData = await response.json();
      const message =
        errorData?.error?.message ||
        (typeof errorData?.error === 'string' ? errorData.error : null) ||
        errorData?.message ||
        'Request failed';
      throw new ApiError(response.status, message, errorData);
    }
    throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
  }

  if (isJson) {
    const data = await response.json();
    
    // Handle backend response format
    if (data.success === false) {
      const message =
        data?.error?.message ||
        (typeof data?.error === 'string' ? data.error : null) ||
        data?.message ||
        'Request failed';
      throw new ApiError(response.status, message, data);
    }
    
    return data;
  }

  return {} as T;
}

// API Client class
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Abort after 30 s so a slow/offline backend never stalls the UI indefinitely
    const signal = options.signal ?? AbortSignal.timeout(30_000);

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
      signal,
    });

    return handleResponse<T>(response);
  }

  protected async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  protected async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiConfig = {
  getAuthToken,
  handleResponse,
  ApiClient,
  ApiError,
  API_BASE_URL
};
