import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, getDeviceInfo, ApiResponse } from './apiClient';

// Auth request types
export interface LoginRequest {
    UserNameOrEmail: string;
    Password?: string;
    OtpCode?: string;
    DeviceInfo: string;
    IpAddress: string;
}

export interface RefreshTokenRequest {
    RefreshToken: string;
    DeviceInfo: string;
    IpAddress: string;
}

export interface SendOTPRequest {
    PhoneNumber: string;
}

export interface VerifyOTPRequest {
    PhoneNumber: string;
    OtpCode: string;
}

// Auth response types
export interface LoginData {
    AccessToken?: string;
    RefreshToken?: string;
    token?: string;
    Token?: string;
    refreshToken?: string;
    userId?: string;
    UserId?: string;
    username?: string;
    email?: string;
    UserData?: any;
    // Add other user data fields as needed
}

export enum StorageKeys {
    AUTH_DATA = '@auth_data',
}

export interface OTPData {
    sent: boolean;
    message?: string;
}

// Authentication Service
class AuthService {
    /**
     * Save auth data to storage
     */
    async saveAuthData(data: LoginData): Promise<void> {
        try {
            await AsyncStorage.setItem(StorageKeys.AUTH_DATA, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving auth data:', error);
        }
    }

    /**
     * Get auth data from storage
     */
    async getAuthData(): Promise<LoginData | null> {
        try {
            const data = await AsyncStorage.getItem(StorageKeys.AUTH_DATA);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting auth data:', error);
            return null;
        }
    }

    /**
     * Clear auth data from storage
     */
    async clearAuthData(): Promise<void> {
        try {
            await AsyncStorage.removeItem(StorageKeys.AUTH_DATA);
        } catch (error) {
            console.error('Error clearing auth data:', error);
        }
    }

    /**
     * Logout user by clearing auth data
     */
    async logout(): Promise<void> {
        await this.clearAuthData();
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(): Promise<ApiResponse<LoginData>> {
        const authData = await this.getAuthData();
        const rToken = authData?.refreshToken || authData?.RefreshToken;
        if (!rToken) {
            throw new Error('No refresh token available');
        }

        const request: RefreshTokenRequest = {
            RefreshToken: rToken,
            DeviceInfo: getDeviceInfo(),
            IpAddress: '14.97.178.74', // Should ideally be dynamic or stored
        };

        const response = await apiClient.post<LoginData>('/auth/refresh', request);

        if (response.Success && response.Data) {
            await this.saveAuthData(response.Data);
        }

        return response;
    }

    /**
     * Login with user credentials (userId/password or phone/OTP)
     */
    async login(credentials: {
        userNameOrEmail: string;
        password?: string;
        otpCode?: string;
        ipAddress?: string;
    }): Promise<ApiResponse<LoginData>> {
        const request: LoginRequest = {
            UserNameOrEmail: credentials.userNameOrEmail,
            Password: credentials.password || '',
            OtpCode: credentials.otpCode || '',
            DeviceInfo: getDeviceInfo(),
            IpAddress: credentials.ipAddress || '14.97.178.74', // Default IP
        };

        return apiClient.post<LoginData>('/auth/login', request);
    }

    /**
     * Send OTP to phone number
     */
    async sendOTP(phoneNumber: string): Promise<ApiResponse<OTPData>> {
        // Mock implementation - replace with actual API endpoint when available
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    Data: { sent: true, message: 'OTP sent successfully' },
                    DisplayMessage: 'OTP has been sent to your phone number.',
                    StatusCode: 200,
                    Success: true,
                });
            }, 1500);
        });
    }

    /**
     * Verify OTP for phone login
     */
    async verifyOTP(phoneNumber: string, otpCode: string): Promise<ApiResponse<LoginData>> {
        // This can use the same login endpoint with OTP
        return this.login({
            userNameOrEmail: phoneNumber,
            otpCode: otpCode,
        });
    }
}

// Export singleton instance
export const authService = new AuthService();
