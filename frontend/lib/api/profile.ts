import { apiClient } from './client';
import type { ApiResponse, User, SocialAccount } from '../types/api';

// Profile API types
export interface UpdateProfileRequest {
  fullName?: string;
  bio?: string;
  profilePicture?: string;
}

export interface UpdateSettingsRequest {
  emailNotifications?: boolean;
  taskNotifications?: boolean;
  marketingEmails?: boolean;
  twoFactorEnabled?: boolean;
}

export interface ConnectSocialAccountRequest {
  platform: 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'youtube';
  username: string;
}

export interface ProfileSettings {
  emailNotifications: boolean;
  taskNotifications: boolean;
  marketingEmails: boolean;
  twoFactorEnabled: boolean;
}

// Get current user profile
export async function getCurrentProfile(): Promise<ApiResponse<User>> {
  const response = await apiClient.get<User>('/auth/me');
  // Backend returns user directly, not wrapped in ApiResponse
  const userData = (response as any).data || response;
  return {
    success: true,
    data: userData as User,
    timestamp: new Date().toISOString(),
  };
}

// Update user profile
export async function updateProfile(
  data: UpdateProfileRequest
): Promise<ApiResponse<User>> {
  const response = await apiClient.patch<User>('/auth/me', data);
  const userData = (response as any).data || response;
  return {
    success: true,
    data: userData as User,
    timestamp: new Date().toISOString(),
  };
}

// Upload profile picture
export async function uploadProfilePicture(file: File): Promise<ApiResponse<{ url: string }>> {
  const formData = new FormData();
  formData.append('file', file);

  // For file uploads, we need to override the Content-Type header
  const response = await fetch(
    `${typeof window !== 'undefined' && window.location
      ? `${window.location.protocol}//${window.location.hostname}:8001/api/v1`
      : 'http://localhost:8001/api/v1'
    }/auth/me/profile-picture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('palmsgig_access_token')}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload profile picture');
  }

  return response.json();
}

// Get profile settings (stored in user profile_data for now)
export async function getProfileSettings(): Promise<ApiResponse<ProfileSettings>> {
  // Settings are not stored separately yet - return defaults
  // Will be implemented when settings endpoint is added
  return Promise.resolve({
    success: true,
    data: {
      emailNotifications: true,
      taskNotifications: true,
      marketingEmails: false,
      twoFactorEnabled: false,
    },
    timestamp: new Date().toISOString(),
  });
}

// Update profile settings
export async function updateProfileSettings(
  data: UpdateSettingsRequest
): Promise<ApiResponse<ProfileSettings>> {
  // Settings are not stored separately yet - return the updated data
  // Will be implemented when settings endpoint is added
  return Promise.resolve({
    success: true,
    data: {
      emailNotifications: data.emailNotifications ?? true,
      taskNotifications: data.taskNotifications ?? true,
      marketingEmails: data.marketingEmails ?? false,
      twoFactorEnabled: data.twoFactorEnabled ?? false,
    },
    timestamp: new Date().toISOString(),
  });
}

// Helper function to map backend account to frontend format
function mapAccountToFrontend(account: any): SocialAccount {
  return {
    id: account.id,
    platform: account.platform,
    username: account.username || '',
    followers: 100, // Hardcoded for now - follower count fetched on demand
    verified: account.is_verified || false,
    connectedAt: account.created_at,
  };
}

// Get user's social accounts
export async function getSocialAccounts(): Promise<ApiResponse<SocialAccount[]>> {
  const response = await apiClient.get<any>('/social-accounts/accounts');
  // Backend returns AccountList with accounts array
  const accountList = (response as any).data || response;
  const accounts = accountList.accounts || accountList || [];
  // Map backend format to frontend format
  const mappedAccounts = accounts.map(mapAccountToFrontend);
  return {
    success: true,
    data: mappedAccounts,
    timestamp: new Date().toISOString(),
  };
}

// Connect a new social account (manual link with username)
export async function connectSocialAccount(
  data: ConnectSocialAccountRequest
): Promise<ApiResponse<SocialAccount>> {
  // Use POST to manual link endpoint
  const response = await apiClient.post<any>('/social-accounts/link', data);
  const accountData = (response as any).data || response;
  return {
    success: true,
    data: mapAccountToFrontend(accountData),
    timestamp: new Date().toISOString(),
  };
}

// Disconnect a social account (by platform name)
export async function disconnectSocialAccount(
  platform: string
): Promise<ApiResponse<{ success: boolean }>> {
  const response = await apiClient.delete<any>(`/social-accounts/disconnect/${platform}`);
  const data = (response as any).data || response;
  return {
    success: true,
    data: { success: data.success ?? true },
    timestamp: new Date().toISOString(),
  };
}

// Verify a social account (by platform)
export async function verifySocialAccount(
  platform: string
): Promise<ApiResponse<SocialAccount>> {
  const response = await apiClient.post<any>(`/social-accounts/verify/${platform}`);
  const accountData = (response as any).data || response;
  return {
    success: true,
    data: mapAccountToFrontend(accountData),
    timestamp: new Date().toISOString(),
  };
}

// Refresh social account data
export async function refreshSocialAccount(
  platform: string
): Promise<ApiResponse<SocialAccount>> {
  const response = await apiClient.post<any>(`/social-accounts/refresh/${platform}`);
  const accountData = (response as any).data || response;
  return {
    success: true,
    data: mapAccountToFrontend(accountData),
    timestamp: new Date().toISOString(),
  };
}

// Get profile by user ID (public profile view)
export async function getProfileById(userId: string): Promise<ApiResponse<User>> {
  return apiClient.get<User>(`/users/${userId}`);
}

// Get user's social accounts by user ID (public view)
export async function getSocialAccountsByUserId(
  userId: string
): Promise<ApiResponse<SocialAccount[]>> {
  return apiClient.get<SocialAccount[]>(`/users/${userId}/social-accounts`);
}
