import { Platform } from 'react-native';

// Base API configuration
let API_BASE_URL = 'http://192.168.30.243:7301/api/v1';
let API_BASE_URL_PROD = 'https://assetsapi.tatwa.com/api/v1';



// API Response type
export interface ApiResponse<T> {
    Data: T;
    DeveloperMessage?: string;
    DisplayMessage: string;
    StatusCode: number;
    Success: boolean;
}

// API Error type
export class ApiError extends Error {
    statusCode: number;
    displayMessage: string;

    constructor(message: string, statusCode: number, displayMessage?: string) {
        super(message);
        this.statusCode = statusCode;
        this.displayMessage = displayMessage || message;
        this.name = 'ApiError';
    }
}

// Generic API client
class ApiClient {

    private baseURL: string;

    constructor(baseURL: string) {
        // add a condition for the development and production
        if (__DEV__) {
            this.baseURL = API_BASE_URL;
        } else {
            this.baseURL = API_BASE_URL_PROD;
        }
    }

    getBaseURL(): string {
        return this.baseURL;
    }

    getBaseHost(): string {
        // Remove /api/v1 or similar from the end
        return __DEV__ ? 'http://192.168.30.243:7301/' : 'https://assetsapi.tatwa.com/';
    }

    private isRefreshing = false;
    private refreshSubscribers: ((token: string) => void)[] = [];

    private onRefreshed(token: string) {
        this.refreshSubscribers.map((cb) => cb(token));
        this.refreshSubscribers = [];
    }

    private subscribeTokenRefresh(cb: (token: string) => void) {
        this.refreshSubscribers.push(cb);
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        // Lazy import to avoid circular dependency
        const { authService } = require('./authService');
        const authData = await authService.getAuthData();
        const token = authData?.AccessToken || authData?.token || authData?.Token;

        const isFormData = options.body instanceof FormData;

        const defaultHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (isFormData) {
            // Let fetch handle Content-Type boundary for FormData
            delete defaultHeaders['Content-Type'];
        }

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        console.log(`[API Request] URL: ${url}`);
        console.log(`[API Request] Token present: ${!!token}, Header: ${defaultHeaders['Authorization'] ? 'Bearer [hidden]' : 'None'}`);

        try {
            const response = await fetch(url, config);

            // Handle 401 Unauthorized
            if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
                if (!this.isRefreshing) {
                    this.isRefreshing = true;
                    try {
                        const refreshResponse = await authService.refreshAccessToken();
                        this.isRefreshing = false;

                        if (refreshResponse.Success && (refreshResponse.Data?.AccessToken || refreshResponse.Data?.token || refreshResponse.Data?.Token)) {
                            const newToken = refreshResponse.Data.AccessToken || refreshResponse.Data.token || refreshResponse.Data?.Token;
                            this.onRefreshed(newToken!);

                            // Retry the original request with the new token
                            return this.request<T>(endpoint, {
                                ...options,
                                headers: {
                                    ...options.headers,
                                    'Authorization': `Bearer ${newToken}`,
                                }
                            });
                        }
                    } catch (refreshError) {
                        this.isRefreshing = false;
                        this.refreshSubscribers = [];

                        // Clear auth data and redirect to login
                        await authService.clearAuthData();

                        // Lazy import to avoid circular dependency
                        const NavigationService = require('../navigation/NavigationService');
                        NavigationService.reset('Login');

                        throw new ApiError('Session expired. Please login again.', 401, 'Session Expired');
                    }
                } else {
                    // Wait for the ongoing refresh to complete
                    return new Promise((resolve, reject) => {
                        this.subscribeTokenRefresh(async (newToken) => {
                            try {
                                resolve(await this.request<T>(endpoint, {
                                    ...options,
                                    headers: {
                                        ...options.headers,
                                        'Authorization': `Bearer ${newToken}`,
                                    }
                                }));
                            } catch (error) {
                                reject(error);
                            }
                        });
                    });
                }
            }

            const result = await response.json();

            if (!response.ok) {
                throw new ApiError(
                    result.DisplayMessage || 'Request failed',
                    response.status,
                    result.DisplayMessage
                );
            }

            return result;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            // Network or other errors
            throw new ApiError(
                'Network error. Please check your internet connection.',
                0,
                'Connection failed'
            );
        }
    }

    async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'GET',
        });
    }

    async post<T>(
        endpoint: string,
        data?: unknown,
        options?: RequestInit
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }

    async put<T>(
        endpoint: string,
        data?: unknown,
        options?: RequestInit
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }

    async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'DELETE',
        });
    }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Helper to get device info
export const getDeviceInfo = (): string => {
    if (Platform.OS === 'web') {
        return typeof navigator !== 'undefined' ? navigator.userAgent : 'Web';
    }
    return `Mobile ${Platform.OS}`;
};
